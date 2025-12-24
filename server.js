import express from 'express'; 
import cors from 'cors'; 
import path from 'path';
import fs from 'fs'; 
import { fileURLToPath } from 'url';
import searoute from 'searoute-js'; 
import * as turf from '@turf/turf'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// KASA
const API_KEY = process.env.GEMINI_API_KEY;

const app = express();
const PORT = process.env.PORT || 10000; 

app.use(cors()); 
app.use(express.json());
app.use(express.static(__dirname));

// --- LİMAN VERİTABANINI YÜKLE ---
let PORTS_DB = {};
try {
    const rawData = fs.readFileSync(path.join(__dirname, 'ports.json'), 'utf-8');
    PORTS_DB = JSON.parse(rawData);
    console.log(`✅ LİMAN VERİTABANI: ${Object.keys(PORTS_DB).length} liman online.`);
} catch (error) {
    console.error("❌ Veritabanı okuma hatası, varsayılanlar devrede.");
    PORTS_DB = { "istanbul": [28.9784, 41.0082], "shanghai": [121.4737, 31.2304] };
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- YENİ NESİL ROTA OPTİMİZASYONU (HIGH PRECISION) ---
function optimizeRoute(routeGeoJSON) {
    try {
        // 1. CLEANING: Hatalı veya üst üste binmiş noktaları temizle
        let clean = turf.cleanCoords(routeGeoJSON);

        // 2. SMOOTHING (AKILLI YUMUŞATMA)
        // DİKKAT: "simplify" (basitleştirme) kullanmıyoruz! 
        // Çünkü basitleştirme, Boğaz gibi dar kanallardaki detayları silip gemiyi karaya bindirir.
        
        // Bezier Spline Ayarları:
        // resolution: 20000 -> Çizgi kalitesini artırır (daha az kırık görünür).
        // sharpness: 0.90 -> (0 ile 1 arası). 
        // Düşük değer (0.5) rotayı çok yayar, karaya çarpar. 
        // Yüksek değer (0.90-0.95) rotaya sadık kalır ama köşeleri tatlı sert yumuşatır.
        
        const smoothed = turf.bezierSpline(clean, {
            resolution: 20000, 
            sharpness: 0.90 
        });

        return smoothed;
    } catch (e) {
        console.log("⚠️ Optimizasyon pas geçildi (Hata):", e.message);
        return routeGeoJSON; // Hata olursa orijinal, güvenli ham rotayı döndür
    }
}

// --- KOORDİNAT BULUCU ---
async function getCoordinates(locationName) {
    if(!locationName) return null;
    const cleanName = locationName.toLowerCase().trim();
    
    // 1. DB KONTROL
    if (PORTS_DB[cleanName]) return PORTS_DB[cleanName];
    const foundKey = Object.keys(PORTS_DB).find(key => cleanName.includes(key));
    if (foundKey) return PORTS_DB[foundKey];

    // 2. GOOGLE API
    console.log(`🌍 [API] Google'a soruluyor: ${locationName}`);
    const geoPrompt = `Return JSON ONLY. Exact coords [lon, lat] for port: ${locationName}. Format: {"coords": [lon, lat]}`;
    
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: geoPrompt }] }] })
        });
        
        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Cevap yok");
        
        const json = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
        return json.coords;
    } catch (error) {
        console.error(`❌ Koordinat Hatası: ${error.message}`);
        throw new Error("Liman bulunamadı.");
    }
}

// --- MOTOR ---
app.get('/sefer_onerisi', async (req, res) => {
    const { bolge, gemiTipi, dwt, crane, hiz, konum } = req.query;
    console.log(`\n⚓ [ROTALAMA]: ${konum} -> ${bolge}`);

    if (!API_KEY) return res.status(500).json({ basari: false, error: "API Key Eksik" });

    try {
        const [originCoords, destCoords] = await Promise.all([getCoordinates(konum), getCoordinates(bolge)]);
        if (!originCoords || !destCoords) throw new Error("Koordinat bulunamadı.");

        // HAM ROTA HESAPLA
        let route = searoute(
            { type: "Feature", geometry: { type: "Point", coordinates: originCoords } },
            { type: "Feature", geometry: { type: "Point", coordinates: destCoords } }
        );

        if (!route) throw new Error("Rota çizilemedi.");

        // --- KUSURSUZLAŞTIRMA ---
        const optimizedRoute = optimizeRoute(route);
        
        // Mesafe Hesabı (Optimize rota üzerinden)
        const distanceKm = turf.length(optimizedRoute, {units: 'kilometers'});
        const distanceNM = (distanceKm * 0.539957).toFixed(0);
        
        console.log(`🌊 Mesafe (Hassas): ${distanceNM} NM`);

        // FİNANSAL ANALİZ
        const brokerPrompt = `
        ACT AS: Senior Ship Broker.
        TASK: Financial analysis for voyage from ${konum} to ${bolge}.
        VESSEL: ${gemiTipi} (${dwt} DWT).
        SPEED: ${hiz} knots.
        DISTANCE: ${distanceNM} NM.
        OUTPUT: JSON ONLY. 2025 Market Rates.
        {
          "tavsiyeGerekcesi": "Piyasa analizi (Türkçe). Mesafeyi (${distanceNM} NM) belirt.",
          "finans": { "navlunUSD": 0, "komisyonUSD": 0, "ballastYakitUSD": 0, "ladenYakitUSD": 0, "kanalUSD": 0, "limanUSD": 0, "opexUSD": 0, "netKarUSD": 0 }
        }
        `;

        const finUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
        const response = await fetch(finUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: brokerPrompt }] }],
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            })
        });

        const finData = await response.json();
        let finJson = { tavsiyeGerekcesi: "Analiz bekleniyor...", finans: { navlunUSD:0, netKarUSD:0 } };

        if (finData.candidates?.[0]?.content?.parts?.[0]?.text) {
            let txt = finData.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
            const s = txt.indexOf('{'), e = txt.lastIndexOf('}');
            if (s !== -1 && e !== -1) finJson = JSON.parse(txt.substring(s, e + 1));
        }

        res.json({
            basari: true,
            tavsiye: {
                tavsiyeGerekcesi: finJson.tavsiyeGerekcesi,
                tumRotlarinAnalizi: [{
                    rotaAdi: `${konum} - ${bolge}`,
                    detay: `${distanceNM} NM - Hassas Deniz Yolu`,
                    finans: finJson.finans,
                    geoJSON: optimizedRoute.geometry || optimizedRoute 
                }]
            }
        });

    } catch (error) {
        console.error("🚨 HATA:", error.message);
        res.status(500).json({ basari: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`🟢 VIYA BROKER LIVE ON PORT ${PORT}`));
