// server.js
// VIYA BROKER - CORE SYSTEM (V2.6 "DEEP OCEAN" PATCHED EDITION)

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// .env dosyasını yükle (Hata almamak için)
dotenv.config();

// Bizim yazdığımız o "Taşşaklı" hesaplama motorunu çağırıyoruz
// NOT: utils/calculations.js dosyasının yerinde olduğundan emin ol
import { calculateFullVoyage, generateAnalysis, getDistance, VESSEL_SPECS } from './utils/calculations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 10000;

// --- GÜVENLİK VE BAŞLANGIÇ ---
const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;

console.clear();
console.log("\x1b[36m%s\x1b[0m", "----------------------------------------------------");
console.log("\x1b[1m\x1b[33m%s\x1b[0m", " ⚓  VIYA BROKER SYSTEM STARTING - COMMAND DECK  ⚓ ");
console.log("\x1b[36m%s\x1b[0m", "----------------------------------------------------");

let genAI = null;
if (!API_KEY) {
    console.error("\x1b[41m%s\x1b[0m", " ❌ CRITICAL: API KEY NOT FOUND! AI SYSTEMS OFFLINE ");
} else {
    console.log(` ✅ AI CORE: ONLINE [Key ending in ...${API_KEY.slice(-4)}]`);
    genAI = new GoogleGenerativeAI(API_KEY);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- DATA LOADERS (FAIL-SAFE) ---
const loadJSON = (file) => {
    try { 
        const filePath = path.join(__dirname, 'data', file);
        if (!fs.existsSync(filePath)) throw new Error("File not found");
        const data = JSON.parse(fs.readFileSync(filePath)); 
        console.log(` 📂 LOADED: ${file} (${Array.isArray(data) ? data.length : Object.keys(data).length} items)`);
        return data;
    } catch (e) { 
        console.warn(` ⚠️ WARNING: ${file} missing or empty. Using system defaults.`); 
        // Hata durumunda boş dönmemesi için basit fallback
        if (file === 'ports.json') return [{"name": "ISTANBUL", "coordinates": [28.9784, 41.0082]}, {"name": "HAMBURG", "coordinates": [9.9937, 53.5511]}];
        return []; 
    }
};

// Liman Veritabanını Optimize Et
const PORT_DB_RAW = loadJSON('ports.json');
let PORT_DB = {};

// Veri formatı array mi object mi kontrol et ve düzelt
if (!Array.isArray(PORT_DB_RAW)) {
    for (const [key, val] of Object.entries(PORT_DB_RAW)) {
        if(val && val.length === 2) PORT_DB[key.toUpperCase()] = { lat: parseFloat(val[1]), lng: parseFloat(val[0]) };
    }
} else {
    PORT_DB_RAW.forEach(p => {
         if(p.name && p.coordinates) PORT_DB[p.name.toUpperCase()] = { lat: p.coordinates[1], lng: p.coordinates[0] };
    });
}

// Port DB boşsa manuel ekleme yap (Garanti olsun)
if (Object.keys(PORT_DB).length === 0) {
    PORT_DB = {
        "ISTANBUL": { lat: 41.0082, lng: 28.9784 },
        "PIRAEUS": { lat: 37.9429, lng: 23.6469 },
        "ROTTERDAM": { lat: 51.9225, lng: 4.47917 },
        "NEW YORK": { lat: 40.7128, lng: -74.0060 },
        "SINGAPORE": { lat: 1.3521, lng: 103.8198 },
        "SHANGHAI": { lat: 31.2304, lng: 121.4737 }
    };
}

const REGS_DATA = loadJSON('regulations.json');
const DOCS_DATA = loadJSON('documents.json');

// --- [YENİ EKLENDİ] ROTA SİMÜLATÖRÜ (FRONTEND İÇİN) ---
// undefined hatasını çözen kısım burası!
app.get('/api/routes', (req, res) => {
    const ports = Object.keys(PORT_DB);
    const routes = [];
    const cargoes = ["Steel Coils", "Heavy Grain", "Scrap", "Iron Ore", "Fertilizer"];

    for (let i = 0; i < 6; i++) {
        const origin = ports[Math.floor(Math.random() * ports.length)];
        let destination = ports[Math.floor(Math.random() * ports.length)];
        
        // Aynı liman olmasın
        while(origin === destination) {
            destination = ports[Math.floor(Math.random() * ports.length)];
        }

        // Mesafeyi hesapla (Eğer utils çalışmazsa rastgele ver)
        let dist = 3000;
        try {
            if (getDistance) {
                dist = Math.floor(getDistance(PORT_DB[origin].lat, PORT_DB[origin].lng, PORT_DB[destination].lat, PORT_DB[destination].lng));
            }
        } catch(e) { dist = Math.floor(Math.random() * 5000) + 500; }

        routes.push({
            id: i + 1,
            origin: origin,           // Frontend bunu bekliyor
            destination: destination, // Frontend bunu bekliyor
            date: new Date(Date.now() + i * 86400000 * 3).toISOString().split('T')[0],
            distance: dist,           // Frontend bunu bekliyor
            price: Math.floor(dist * (Math.random() * 10 + 15)), // Frontend bunu bekliyor
            cargo: cargoes[Math.floor(Math.random() * cargoes.length)],
            vessel_name: "MV VIYA " + (i + 1)
        });
    }
    res.json(routes);
});

// --- DİĞER ENDPOINTLER ---

app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));

app.get('/api/port-coords', (req, res) => {
    const pName = req.query.port?.toUpperCase();
    res.json(PORT_DB[pName] || {});
});

app.get('/api/documents', (req, res) => res.json(DOCS_DATA));
app.get('/api/regulations', (req, res) => res.json(REGS_DATA));

// [MARKET ORACLE]
app.get('/api/market', async (req, res) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const resBrent = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d', { signal: controller.signal });
        const brentJson = await resBrent.json();
        const brentVal = brentJson.chart.result[0].meta.regularMarketPrice;
        clearTimeout(timeoutId);

        if (brentVal) {
            res.json({ 
                brent: brentVal, 
                mgo: Math.round(brentVal * 11.2),
                vlsfo: Math.round(brentVal * 11.2 * 0.78),
                source: "LIVE"
            });
        } else throw new Error("Yahoo Empty");

    } catch (e) {
        const basePrice = 74.50;
        const simBrent = basePrice + ((Math.random() * 4) - 2);
        
        res.json({ 
            brent: simBrent, 
            mgo: Math.round(simBrent * 11.5), 
            vlsfo: Math.round(simBrent * 11.5 * 0.78),
            source: "SIMULATED"
        });
    }
});

// [AI CHATBOT]
app.post('/api/chat', async (req, res) => {
    const { message, language } = req.body;
    const targetLang = language || "English";

    if (!genAI) return res.json({ reply: "Sistem Hatası: API Anahtarı eksik veya geçersiz." });

    console.log(` 💬 USER: "${message}"`);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
        
        const systemInstruction = `
            You are "Viya Broker", an elite maritime chartering expert.
            Tone: Professional yet sharp, slightly informal like a "Ship Captain" (Reis).
            Context: Helping user manage shipping routes.
            Rules: Respond ONLY in ${targetLang}. Be concise. Use maritime terminology.
            User Input: "${message}"
        `;
        
        const result = await model.generateContent(systemInstruction);
        const response = await result.response;
        res.json({ reply: response.text() });

    } catch (error) {
        console.error(" ❌ AI ERROR:", error.message);
        res.json({ reply: "Telsiz bağlantısı koptu kaptan." });
    }
});

// [VOYAGE ANALYZER]
app.post('/api/analyze', async (req, res) => {
    console.log(" ⚙️ ANALYZING VOYAGE REQUEST...");
    const { shipLat, shipLng, vType, cargoQty, loadRate, dischRate } = req.body;
    
    if (!shipLat || !shipLng) return res.json({ success: false, msg: "No coordinates" });

    const specs = VESSEL_SPECS[vType] || VESSEL_SPECS["SUPRAMAX"];
    const allPorts = Object.keys(PORT_DB);
    const validPorts = allPorts.filter(p => PORT_DB[p] && PORT_DB[p].lat);

    const candidates = validPorts.map(p => {
        const dist = getDistance(shipLat, shipLng, PORT_DB[p].lat, PORT_DB[p].lng);
        return { name: p, geo: PORT_DB[p], dist };
    }).filter(p => p.dist < 5000).sort((a, b) => a.dist - b.dist).slice(0, 50);

    if (candidates.length === 0) return res.json({ success: false, msg: "No ports found nearby" });

    const marketData = { vlsfo: 620, mgo: 900, portDuesFactor: 1.25 };
    const suggestions = [];
    let attempts = 0;

    while(suggestions.length < 5 && attempts < 100) {
        attempts++;
        const load = candidates[Math.floor(Math.random() * (candidates.length > 10 ? 10 : candidates.length))];
        const dischName = validPorts[Math.floor(Math.random() * validPorts.length)];
        
        if (!load || load.name === dischName) continue;
        if (!PORT_DB[dischName]) continue;

        const voyageDist = getDistance(load.geo.lat, load.geo.lng, PORT_DB[dischName].lat, PORT_DB[dischName].lng);
        if (voyageDist < 200) continue;

        const calc = calculateFullVoyage(
            shipLat, shipLng, 
            load.name, load.geo, 
            dischName, PORT_DB[dischName], 
            specs, marketData, 
            specs.default_speed, 
            cargoQty, loadRate, dischRate
        );

        if(calc) {
            calc.aiAnalysis = generateAnalysis(calc, specs);
            suggestions.push(calc);
        }
    }

    suggestions.sort((a, b) => b.financials.tce - a.financials.tce);
    res.json({ success: true, voyages: suggestions });
});

app.listen(port, () => {
    console.log(` 🚀 VIYA SYSTEM IS READY. LISTENING ON PORT ${port}`);
});
