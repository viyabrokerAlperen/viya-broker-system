import express from 'express'; 
import cors from 'cors'; 
import path from 'path';
import { fileURLToPath } from 'url';
import searoute from 'searoute-js'; // DOĞRU KÜTÜPHANE
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

// --- VIYA BROKER ENGINE (REAL DATA MODE) ---
app.get('/sefer_onerisi', async (req, res) => {
    const { bolge, gemiTipi, dwt, crane, hiz, konum } = req.query;

    console.log(`\n⚓ [HESAPLAMA BAŞLADI]: ${konum} -> ${bolge}`);

    if (!API_KEY) {
        return res.status(500).json({ basari: false, error: "API Anahtarı Eksik!" });
    }

    try {
        // 1. ADIM: KOORDİNATLARI BUL (Gemini ile)
        const geoPrompt = `
        Return JSON ONLY. Find exact latitude and longitude for these two ports.
        Port 1: ${konum}
        Port 2: ${bolge}
        
        Output format:
        {
            "origin": [longitude, latitude],
            "destination": [longitude, latitude]
        }
        `;

        const geoUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
        const geoResp = await fetch(geoUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: geoPrompt }] }] })
        });
        
        const geoData = await geoResp.json();
        let geoText = geoData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        // Temizlik
        geoText = geoText.replace(/```json/g, '').replace(/```/g, '').trim();
        const coords = JSON.parse(geoText);
        
        console.log("📍 Koordinatlar Bulundu:", coords);

        // 2. ADIM: GERÇEK ROTAYI HESAPLA (searoute-js)
        console.log("🌊 Deniz Yolu Hesaplanıyor...");

        // ÖNEMLİ DÜZELTME: Kütüphane GeoJSON objesi ister!
        // Çıplak koordinat verirsen "Not a function" veya hata verir.
        const originGeo = {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Point",
                "coordinates": coords.origin // [Lon, Lat]
            }
        };

        const destGeo = {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Point",
                "coordinates": coords.destination // [Lon, Lat]
            }
        };
        
        // Rota Hesapla (Nautical Miles)
        const route = searoute(originGeo, destGeo, "nautical_miles");
        
        if (!route) {
            throw new Error("Rota çizilemedi (Deniz bağlantısı bulunamadı).");
        }

        // Mesafe Hesabı (Route bir LineString döner)
        const line = route; 
        const distanceKm = turf.length(line, {units: 'kilometers'});
        const distanceNM = (distanceKm * 0.539957).toFixed(0); 

        console.log(`✅ Rota Hazır! Mesafe: ${distanceNM} NM`);

        // 3. ADIM: GEMINI FİNANSAL ANALİZ
        const brokerPrompt = `
        ACT AS: Senior Ship Broker.
        TASK: Financial analysis for voyage from ${konum} to ${bolge}.
        VESSEL: ${gemiTipi} (${dwt} DWT).
        SPEED: ${hiz} knots.
        REAL DISTANCE: ${distanceNM} Nautical Miles.
        
        CALCULATIONS:
        - Sea Days = ${distanceNM} / (${hiz} * 24).
        - Use realistic daily fuel consumption.
        
        OUTPUT: JSON ONLY.
        {
          "tavsiyeGerekcesi": "Market analysis text (Turkish). Mention distance ${distanceNM} NM.",
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
        let finText = finData.candidates?.[0]?.content?.parts?.[0]?.text;
        finText = finText.replace(/```json/g, '').replace(/```/g, '').replace(/^JSON:/i, '').trim();
        const firstBracket = finText.indexOf('{');
        const lastBracket = finText.lastIndexOf('}');
        if (firstBracket !== -1 && lastBracket !== -1) finText = finText.substring(firstBracket, lastBracket + 1);
        
        const finJson = JSON.parse(finText);

        // 4. SONUÇ
        const finalResponse = {
            tavsiyeGerekcesi: finJson.tavsiyeGerekcesi,
            tumRotlarinAnalizi: [
                {
                    rotaAdi: "Optimal Deniz Yolu",
                    detay: `${distanceNM} NM - Gerçek Deniz Rotası`,
                    finans: finJson.finans,
                    geoJSON: line.geometry // Harita için geometri verisi
                }
            ]
        };

        res.json({ basari: true, tavsiye: finalResponse });

    } catch (error) {
        console.error("❌ HATASI:", error.message);
        console.error(error);
        res.status(500).json({ basari: false, error: "Sunucu hatası: " + error.message });
    }
});

app.listen(PORT, () => console.log(`🟢 VIYA BROKER LIVE ON PORT ${PORT}`));
