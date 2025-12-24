import express from 'express'; 
import cors from 'cors'; 
import path from 'path';
import { fileURLToPath } from 'url';
import searoute from 'searoute-js'; 
import * as turf from '@turf/turf'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// KASA (Render Environment)
const API_KEY = process.env.GEMINI_API_KEY;

const app = express();
const PORT = process.env.PORT || 10000; 

app.use(cors()); 
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- YEREL LİMAN VERİTABANI (Google'a muhtaç kalmamak için) ---
// En popüler limanları buraya ekledik. Sistem önce buraya bakar.
const LOCAL_PORTS = {
    "istanbul": [28.9784, 41.0082],
    "shanghai": [121.4737, 31.2304],
    "rotterdam": [4.47917, 51.9225],
    "singapore": [103.8198, 1.3521],
    "santos": [-46.3322, -23.9618],
    "houston": [-95.3698, 29.7604],
    "new york": [-74.0060, 40.7128],
    "richards bay": [32.0383, -28.7807],
    "tokyo": [139.6917, 35.6895],
    "hamburg": [9.9937, 53.5511],
    "antwerp": [4.4025, 51.2194],
    "busan": [129.0756, 35.1796],
    "dubai": [55.2708, 25.2048],
    "los angeles": [-118.2437, 34.0522],
    "gibraltar": [-5.3536, 36.1408],
    "suez": [32.5598, 29.9668],
    "panama": [-79.5197, 8.9824]
};

// --- YARDIMCI: Koordinat Bulucu (Önce Yerel, Sonra Google) ---
async function getCoordinates(locationName) {
    const key = locationName.toLowerCase().trim();
    
    // 1. ADIM: Yerel veritabanına bak
    if (LOCAL_PORTS[key]) {
        console.log(`⚡ [CACHE] Koordinat hafızadan alındı: ${locationName}`);
        return LOCAL_PORTS[key];
    }

    // 2. ADIM: Yoksa Google'a sor
    console.log(`🌍 [API] Google'a soruluyor: ${locationName}`);
    
    const geoPrompt = `
    Return JSON ONLY. Specific coordinates [longitude, latitude] for port: ${locationName}.
    Format: {"coords": [lon, lat]}
    `;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: geoPrompt }] }] })
        });
        
        const data = await response.json();
        
        // Hata Kontrolü
        if (data.error) throw new Error(data.error.message);
        if (!data.candidates) throw new Error("Google boş cevap döndü (Limit veya Hata).");

        let text = data.candidates[0].content.parts[0].text;
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const json = JSON.parse(text);
        
        return json.coords;

    } catch (error) {
        console.error(`❌ Koordinat Hatası (${locationName}):`, error.message);
        throw new Error(`Google API koordinat veremedi: ${locationName}`);
    }
}


// --- VIYA BROKER ENGINE ---
app.get('/sefer_onerisi', async (req, res) => {
    const { bolge, gemiTipi, dwt, crane, hiz, konum } = req.query;

    console.log(`\n⚓ [İŞLEM]: ${konum} -> ${bolge}`);

    if (!API_KEY) {
        return res.status(500).json({ basari: false, error: "API Anahtarı Eksik!" });
    }

    try {
        // 1. KOORDİNATLARI ÇEK (HİBRİT SİSTEM)
        // Promise.all ile ikisini aynı anda çözüyoruz
        const [originCoords, destCoords] = await Promise.all([
            getCoordinates(konum),
            getCoordinates(bolge)
        ]);

        console.log("📍 Rota Noktaları:", originCoords, "->", destCoords);

        // 2. DENİZ ROTASI HESAPLA (searoute-js)
        const route = searoute(
            { type: "Feature", geometry: { type: "Point", coordinates: originCoords } },
            { type: "Feature", geometry: { type: "Point", coordinates: destCoords } }
        );

        if (!route) throw new Error("Deniz rotası çizilemedi (Karayolu yok!)");

        // Mesafe Hesabı (KM -> NM)
        const distanceKm = turf.length(route, {units: 'kilometers'});
        const distanceNM = (distanceKm * 0.539957).toFixed(0);
        
        console.log(`🌊 Mesafe: ${distanceNM} NM`);

        // 3. FİNANSAL ANALİZ (Gemini)
        const brokerPrompt = `
        ACT AS: Senior Ship Broker.
        TASK: Financial analysis for voyage from ${konum} to ${bolge}.
        VESSEL: ${gemiTipi} (${dwt} DWT).
        SPEED: ${hiz} knots.
        DISTANCE: ${distanceNM} NM.
        
        OUTPUT: JSON ONLY.
        {
          "tavsiyeGerekcesi": "Piyasa analizi (Türkçe). Mesafeyi (${distanceNM} NM) ve tahmini süreyi belirt.",
          "finans": {
                "navlunUSD": 0, 
                "komisyonUSD": 0,
                "ballastYakitUSD": 0, 
                "ladenYakitUSD": 0,
                "kanalUSD": 0, 
                "limanUSD": 0, 
                "opexUSD": 0, 
                "netKarUSD": 0
          }
        }
        `;

        const finUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
        const finResp = await fetch(finUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: brokerPrompt }] }] })
        });

        const finData = await finResp.json();
        
        // Google Cevap Vermezse Yedek Plan (Fail-Safe)
        let finJson = {
            tavsiyeGerekcesi: "Sunucu yoğunluğu nedeniyle AI analizi alınamadı, ancak rota hesaplandı.",
            finans: { navlunUSD:0, komisyonUSD:0, ballastYakitUSD:0, ladenYakitUSD:0, kanalUSD:0, limanUSD:0, opexUSD:0, netKarUSD:0 }
        };

        if (finData.candidates) {
            let finText = finData.candidates[0].content.parts[0].text;
            finText = finText.replace(/```json/g, '').replace(/```/g, '').replace(/^JSON:/i, '').trim();
            // JSON Parçalama Güvenliği
            const firstBracket = finText.indexOf('{');
            const lastBracket = finText.lastIndexOf('}');
            if (firstBracket !== -1 && lastBracket !== -1) {
                finJson = JSON.parse(finText.substring(firstBracket, lastBracket + 1));
            }
        } else {
            console.error("⚠️ Google Finans Analizi Yapamadı (Boş Cevap).");
        }

        // 4. CEVABI PAKETLE
        res.json({
            basari: true,
            tavsiye: {
                tavsiyeGerekcesi: finJson.tavsiyeGerekcesi,
                tumRotlarinAnalizi: [{
                    rotaAdi: `${konum} - ${bolge}`,
                    detay: `${distanceNM} NM - Deniz Rotası`,
                    finans: finJson.finans,
                    geoJSON: route.geometry
                }]
            }
        });

    } catch (error) {
        console.error("🚨 SİSTEM HATASI:", error.message);
        res.status(500).json({ basari: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`🟢 VIYA BROKER LIVE ON PORT ${PORT}`));
