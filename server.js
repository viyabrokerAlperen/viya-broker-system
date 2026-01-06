import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// utils klasörünün ve calculations.js dosyasının olduğundan emin ol
import { calculateFullVoyage, generateAnalysis, getDistance, VESSEL_SPECS } from './utils/calculations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// API KEY KONTROLÜ (Render Loglarında görünecek)
const API_KEY = process.env.GEMINI_API_KEY;

console.log("-----------------------------------------");
console.log("SERVER STARTING...");
if (API_KEY) {
    // Güvenlik için sadece ilk 4 ve son 4 karakteri gösterelim
    const maskedKey = API_KEY.substring(0, 4) + "..." + API_KEY.substring(API_KEY.length - 4);
    console.log(`✅ API KEY DETECTED: [${maskedKey}]`);
} else {
    console.error("❌ CRITICAL ERROR: API KEY NOT FOUND IN ENVIRONMENT VARIABLES");
}
console.log("-----------------------------------------");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- DATA LOADERS ---
const loadJSON = (file) => {
    try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', file))); } 
    catch (e) { console.warn(`⚠️ Warning: ${file} not found.`); return []; }
};

const PORT_DB_RAW = loadJSON('ports.json');
let PORT_DB = {};
if (!Array.isArray(PORT_DB_RAW)) {
    for (const [key, val] of Object.entries(PORT_DB_RAW)) {
        if(val && val.length === 2) PORT_DB[key.toUpperCase()] = { lat: parseFloat(val[1]), lng: parseFloat(val[0]) };
    }
}

const REGS_DATA = loadJSON('regulations.json');
const DOCS_DATA = loadJSON('documents.json');
// Context'i çok uzun tutmayalım, token limitine takılmasın
const REGS_CONTEXT = Array.isArray(REGS_DATA) 
    ? REGS_DATA.slice(0, 5).map(r => r.summary).join(" | ") 
    : "Maritime Rules Apply.";

// --- ROUTES ---

app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));
app.get('/api/port-coords', (req, res) => res.json(PORT_DB[req.query.port] || {}));
app.get('/api/documents', (req, res) => res.json(DOCS_DATA));
app.get('/api/regulations', (req, res) => res.json(REGS_DATA));

// [MARKET VERİSİ - GARANTİ]
app.get('/api/market', async (req, res) => {
    try {
        const resBrent = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d');
        const brentJson = await resBrent.json();
        const brentVal = brentJson.chart.result[0].meta.regularMarketPrice;
        
        if (brentVal) {
            res.json({ brent: brentVal, mgo: Math.round(brentVal * 10.5), vlsfo: Math.round(brentVal * 10.5 * 0.75) });
        } else throw new Error("Yahoo Data Empty");
    } catch (e) {
        // Hata olursa varsayılan veriyi döndür (Ekranda ... yazmasın, veri görünsün)
        console.log("Market data fetch failed, using fallback.");
        res.json({ brent: 75.50, mgo: 820, vlsfo: 610 });
    }
});

// [CHATBOT - DEBUG MODU]
app.post('/api/chat', async (req, res) => {
    const { message, language } = req.body;
    
    if (!API_KEY) {
        console.error("Chat Request Failed: No API Key");
        return res.json({ reply: "Sistem Hatası: API Anahtarı sunucuda tanımlı değil." });
    }

    console.log(`💬 Chat Request: "${message}" [Target Lang: ${language}]`);

    try {
        const targetLang = language || "English";
        
        // Model ismini 'gemini-1.5-flash' olarak güncelledik, daha hızlı ve stabil.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
        
        const payload = {
            contents: [{ 
                parts: [{ 
                    text: `You are VIYA AI, an expert Maritime Broker. 
                    Act strictly as a professional consultant.
                    Respond ONLY in the ${targetLang} language.
                    User Question: "${message}"` 
                }] 
            }]
        };

        const resp = await fetch(apiUrl, {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        const data = await resp.json();

        // [HATA YAKALAMA BLOĞU]
        if (data.error) {
            console.error("❌ GOOGLE API ERROR:", JSON.stringify(data.error, null, 2));
            return res.json({ reply: `AI Hatası: ${data.error.message}` });
        }

        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (replyText) {
            res.json({ reply: replyText });
        } else {
            console.error("❌ AI Empty Response:", JSON.stringify(data));
            res.json({ reply: "Cevap oluşturulamadı (Boş yanıt)." });
        }

    } catch(e) { 
        console.error("❌ Server Exception:", e);
        res.json({ reply: "Sunucu bağlantı hatası." }); 
    }
});

// [ANALİZ - GARANTİ SEFER]
app.post('/api/analyze', (req, res) => {
    const { shipLat, shipLng, vType, cargoQty, loadRate, dischRate } = req.body;
    if (!shipLat || !shipLng) return res.json({ success: false });

    const specs = VESSEL_SPECS[vType] || VESSEL_SPECS["SUPRAMAX"];
    const allPorts = Object.keys(PORT_DB);
    const validPorts = allPorts.filter(p => PORT_DB[p] && PORT_DB[p].lat);
    
    // Mesafeye göre en yakın limanları al
    const candidates = validPorts.map(p => ({
        name: p, geo: PORT_DB[p],
        dist: getDistance(shipLat, shipLng, PORT_DB[p].lat, PORT_DB[p].lng)
    })).sort((a, b) => a.dist - b.dist).slice(0, 40);

    const suggestions = [];
    let attempts = 0;

    // Sefer bulana kadar dene
    while(suggestions.length < 5 && attempts < 50) {
        attempts++;
        const load = candidates[Math.floor(Math.random() * candidates.length)];
        const dischName = validPorts[Math.floor(Math.random() * validPorts.length)];
        if (!load || load.name === dischName) continue;

        // Hesaplama için güvenli yakıt fiyatları
        const calcMarket = { vlsfo: 610, mgo: 820 }; 

        const calc = calculateFullVoyage(shipLat, shipLng, load.name, load.geo, dischName, PORT_DB[dischName], specs, calcMarket, 13.5, cargoQty, loadRate, dischRate);
        if(calc) suggestions.push({ ...calc, aiAnalysis: generateAnalysis(calc, specs) });
    }
    
    res.json({ success: true, voyages: suggestions.sort((a,b)=>b.financials.tce - a.financials.tce) });
});

app.listen(port, () => console.log(`🚀 VIYA SYSTEM READY on port ${port}`));

