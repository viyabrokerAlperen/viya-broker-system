import express from 'express'; 
import cors from 'cors'; 
import path from 'path';
import { fileURLToPath } from 'url';
import searoute from 'searoute-js'; 
import * as turf from '@turf/turf'; 
// import { PORTS_DB } from './ports.js'; // BU SATIRI SİLDİK, ARTIK GEREK YOK

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

// --- LİMAN VERİTABANI (DİREKT BURAYA GÖMDÜK) ---
const PORTS_DB = {
    // ASYA
    "shanghai": [121.4737, 31.2304],
    "singapore": [103.8198, 1.3521],
    "ningbo": [121.5500, 29.8700],
    "shenzhen": [114.0579, 22.5431],
    "guangzhou": [113.2644, 23.1291],
    "busan": [129.0756, 35.1796],
    "hong kong": [114.1694, 22.3193],
    "qingdao": [120.3800, 36.0600],
    "tianjin": [117.2000, 39.1200],
    "dubai": [55.2708, 25.2048],
    "jebel ali": [55.0273, 25.0113],
    "tokyo": [139.6917, 35.6895],
    "yokohama": [139.6380, 35.4437],
    "kaohsiung": [120.2700, 22.6200],
    "port klang": [101.3900, 3.0000],
    "mumbai": [72.8777, 19.0760],
    "colombo": [79.8612, 6.9271],
    "ho chi minh": [106.6297, 10.8231],
    "jakarta": [106.8456, -6.2088],
    
    // AVRUPA
    "rotterdam": [4.47917, 51.9225],
    "antwerp": [4.4025, 51.2194],
    "hamburg": [9.9937, 53.5511],
    "bremerhaven": [8.5800, 53.5500],
    "le havre": [0.1079, 49.4944],
    "felixstowe": [1.3514, 51.9567],
    "algeciras": [-5.4500, 36.1300],
    "valencia": [-0.3763, 39.4699],
    "barcelona": [2.1734, 41.3851],
    "marseille": [5.3698, 43.2965],
    "genoa": [8.9463, 44.4056],
    "piraeus": [23.6470, 37.9430],
    "istanbul": [28.9784, 41.0082],
    "ambarli": [28.6900, 40.9700],
    "izmit": [29.9167, 40.7667],
    "izmir": [27.1428, 38.4237],
    "mersin": [34.6415, 36.8121],
    "iskenderun": [36.1667, 36.5833],
    "novorossiysk": [37.7667, 44.7167],
    "odessa": [30.7233, 46.4825],
    "constanta": [28.6333, 44.1733],

    // AMERİKA
    "los angeles": [-118.2437, 34.0522],
    "long beach": [-118.1937, 33.7701],
    "new york": [-74.0060, 40.7128],
    "new jersey": [-74.1724, 40.7357],
    "savannah": [-81.0998, 32.0809],
    "houston": [-95.3698, 29.7604],
    "vancouver": [-123.1207, 49.2827],
    "santos": [-46.3322, -23.9618],
    "buenos aires": [-58.3816, -34.6037],
    "rio de janeiro": [-43.1729, -22.9068],
    "panama canal": [-79.5197, 8.9824],

    // AFRİKA & DİĞER
    "suez": [32.5598, 29.9668],
    "durban": [31.0218, -29.8587],
    "richards bay": [32.0383, -28.7807],
    "cape town": [18.4241, -33.9249],
    "gibraltar": [-5.3536, 36.1408],
    "ceuta": [-5.3162, 35.8894],
    "malta": [14.5146, 35.8997]
};

// --- AKILLI KOORDİNAT BULUCU ---
async function getCoordinates(locationName) {
    if(!locationName) return null;
    
    // 1. Temizlik
    const cleanName = locationName.toLowerCase().trim();
    
    // 2. YEREL VERİTABANI KONTROLÜ
    if (PORTS_DB[cleanName]) {
        console.log(`⚡ [DB] Koordinat hafızadan: ${cleanName}`);
        return PORTS_DB[cleanName];
    }

    // Benzerlik kontrolü
    const foundKey = Object.keys(PORTS_DB).find(key => cleanName.includes(key));
    if (foundKey) {
        console.log(`⚡ [DB] Benzerlik bulundu: ${cleanName} -> ${foundKey}`);
        return PORTS_DB[foundKey];
    }

    // 3. GOOGLE'A SOR (Yedek Plan)
    console.log(`🌍 [API] Bilinmeyen liman, Google'a soruluyor: ${locationName}`);
    
    const geoPrompt = `
    Return JSON ONLY. Exact coordinates [longitude, latitude] for maritime port: ${locationName}.
    If it's a city, return the port coordinates.
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

// --- VIYA BROKER ENGINE ---
app.get('/sefer_onerisi', async (req, res) => {
    const { bolge, gemiTipi, dwt, crane, hiz, konum } = req.query;

    console.log(`\n⚓ [İŞLEM]: ${konum} -> ${bolge}`);

    if (!API_KEY) {
        return res.status(500).json({ basari: false, error: "API Anahtarı Eksik!" });
    }

    try {
        // 1. KOORDİNATLARI ÇEK
        const [originCoords, destCoords] = await Promise.all([
            getCoordinates(konum),
            getCoordinates(bolge)
        ]);

        if (!originCoords || !destCoords) {
            throw new Error("Liman koordinatları bulunamadı. İsmi doğru yazdığınızdan emin olun.");
        }

        // 2. DENİZ ROTASI HESAPLA
        const route = searoute(
            { type: "Feature", geometry: { type: "Point", coordinates: originCoords } },
            { type: "Feature", geometry: { type: "Point", coordinates: destCoords } }
        );

        if (!route) throw new Error("Deniz rotası çizilemedi.");

        const distanceKm = turf.length(route, {units: 'kilometers'});
        const distanceNM = (distanceKm * 0.539957).toFixed(0);
        console.log(`🌊 Mesafe: ${distanceNM} NM`);

        // 3. FİNANSAL ANALİZ (SAFETY FILTER OFF)
        const brokerPrompt = `
        ACT AS: Senior Ship Broker.
        TASK: Financial analysis for voyage from ${konum} to ${bolge}.
        VESSEL: ${gemiTipi} (${dwt} DWT).
        SPEED: ${hiz} knots.
        DISTANCE: ${distanceNM} NM.
        
        OUTPUT: JSON ONLY. Use realistic market rates (2025).
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
        
        const response = await fetch(finUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: brokerPrompt }] }],
                // FİLTRELERİ KAPATIYORUZ
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
            tavsiyeGerekcesi: "Rota hesaplandı ancak AI finansal analizi o anlık yoğunluk nedeniyle alınamadı.",
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
        console.error("🚨 SİSTEM HATASI:", error.message);
        res.status(500).json({ basari: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`🟢 VIYA BROKER LIVE ON PORT ${PORT}`));
