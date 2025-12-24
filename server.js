import express from 'express'; 
import cors from 'cors'; 
import path from 'path';
import fs from 'fs'; // Dosya okuma modülü
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
    // ports.json dosyasını senkron olarak oku
    const rawData = fs.readFileSync(path.join(__dirname, 'ports.json'), 'utf-8');
    PORTS_DB = JSON.parse(rawData);
    console.log(`✅ LİMAN VERİTABANI YÜKLENDİ: ${Object.keys(PORTS_DB).length} liman hafızada.`);
} catch (error) {
    console.error("❌ Veritabanı okuma hatası:", error);
    // Yedek olarak en kritik limanları elle ekle (Crash olmasın diye)
    PORTS_DB = {
        "istanbul": [28.9784, 41.0082],
        "shanghai": [121.4737, 31.2304],
        "rotterdam": [4.47917, 51.9225],
        "singapore": [103.8198, 1.3521],
        "santos": [-46.3322, -23.9618]
    };
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- AKILLI KOORDİNAT BULUCU ---
async function getCoordinates(locationName) {
    if(!locationName) return null;
    
    const cleanName = locationName.toLowerCase().trim();
    
    // 1. JSON VERİTABANI KONTROLÜ
    // Tam eşleşme
    if (PORTS_DB[cleanName]) {
        console.log(`⚡ [DB] Koordinat hafızadan: ${cleanName}`);
        return PORTS_DB[cleanName];
    }
    // Benzerlik (Örn: "Port of Shanghai" -> "shanghai")
    const foundKey = Object.keys(PORTS_DB).find(key => cleanName.includes(key));
    if (foundKey) {
        console.log(`⚡ [DB] Benzerlik bulundu: ${cleanName} -> ${foundKey}`);
        return PORTS_DB[foundKey];
    }

    // 2. GOOGLE'A SOR (Yedek Plan)
    console.log(`🌍 [API] Bilinmeyen liman, Google'a soruluyor: ${locationName}`);
    
    const geoPrompt = `
    Return JSON ONLY. Exact coordinates [longitude, latitude] for maritime port: ${locationName}.
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
        if (data.error) throw new Error(data.error.message);
        
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("API cevap vermedi.");

        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const json = JSON.parse(text);
        return json.coords;

    } catch (error) {
        console.error(`❌ Koordinat Hatası (${locationName}):`, error.message);
        throw new Error(`Liman bulunamadı: ${locationName}`);
    }
}

// --- ENGINE ---
app.get('/sefer_onerisi', async (req, res) => {
    const { bolge, gemiTipi, dwt, crane, hiz, konum } = req.query;

    console.log(`\n⚓ [İŞLEM]: ${konum} -> ${bolge}`);

    if (!API_KEY) return res.status(500).json({ basari: false, error: "API Anahtarı Eksik!" });

    try {
        const [originCoords, destCoords] = await Promise.all([
            getCoordinates(konum),
            getCoordinates(bolge)
        ]);

        if (!originCoords || !destCoords) throw new Error("Liman koordinatları bulunamadı.");

        const route = searoute(
            { type: "Feature", geometry: { type: "Point", coordinates: originCoords } },
            { type: "Feature", geometry: { type: "Point", coordinates: destCoords } }
        );

        if (!route) throw new Error("Deniz rotası çizilemedi.");

        const distanceKm = turf.length(route, {units: 'kilometers'});
        const distanceNM = (distanceKm * 0.539957).toFixed(0);
        console.log(`🌊 Mesafe: ${distanceNM} NM`);

        const brokerPrompt = `
        ACT AS: Senior Ship Broker.
        TASK: Financial analysis for voyage from ${konum} to ${bolge}.
        VESSEL: ${gemiTipi} (${dwt} DWT).
        SPEED: ${hiz} knots.
        DISTANCE: ${distanceNM} NM.
        OUTPUT: JSON ONLY. Use realistic 2025 rates.
        {
          "tavsiyeGerekcesi": "Piyasa analizi (Türkçe). Mesafeyi (${distanceNM} NM) ve süreyi belirt.",
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
        let finJson = {
            tavsiyeGerekcesi: "Rota hesaplandı ancak AI finansal analizi alınamadı. Lütfen tekrar deneyin.",
            finans: { navlunUSD:0, komisyonUSD:0, ballastYakitUSD:0, ladenYakitUSD:0, kanalUSD:0, limanUSD:0, opexUSD:0, netKarUSD:0 }
        };

        if (finData.candidates && finData.candidates[0].content) {
            let finText = finData.candidates[0].content.parts[0].text;
            finText = finText.replace(/```json/g, '').replace(/```/g, '').replace(/^JSON:/i, '').trim();
            const firstBracket = finText.indexOf('{');
            const lastBracket = finText.lastIndexOf('}');
            if (firstBracket !== -1 && lastBracket !== -1) {
                finJson = JSON.parse(finText.substring(firstBracket, lastBracket + 1));
            }
        }

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
        console.error("🚨 HATA:", error.message);
        res.status(500).json({ basari: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`🟢 VIYA BROKER LIVE ON PORT ${PORT}`));
