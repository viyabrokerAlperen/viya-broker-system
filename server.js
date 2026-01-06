// server.js
// VIYA BROKER - CORE SYSTEM (V2.5 "DEEP OCEAN" EDITION)

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Bizim yazdığımız o "Taşşaklı" hesaplama motorunu çağırıyoruz
import { calculateFullVoyage, generateAnalysis, getDistance, VESSEL_SPECS } from './utils/calculations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 10000; // Render genelde 10000 sever

// --- GÜVENLİK VE BAŞLANGIÇ ---
const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;

console.clear();
console.log("\x1b[36m%s\x1b[0m", "----------------------------------------------------");
console.log("\x1b[1m\x1b[33m%s\x1b[0m", " ⚓  VIYA BROKER SYSTEM STARTING - COMMAND DECK  ⚓ ");
console.log("\x1b[36m%s\x1b[0m", "----------------------------------------------------");

if (!API_KEY) {
    console.error("\x1b[41m%s\x1b[0m", " ❌ CRITICAL: API KEY NOT FOUND! AI SYSTEMS OFFLINE ");
} else {
    console.log(` ✅ AI CORE: ONLINE [Key ending in ...${API_KEY.slice(-4)}]`);
}

// Gemini İstemcisi
const genAI = new GoogleGenerativeAI(API_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- DATA LOADERS (FAIL-SAFE) ---
const loadJSON = (file) => {
    try { 
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', file))); 
        console.log(` 📂 LOADED: ${file} (${Array.isArray(data) ? data.length : Object.keys(data).length} items)`);
        return data;
    } catch (e) { 
        console.warn(` ⚠️ WARNING: ${file} missing. Using dummy data.`); 
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
    // Eğer array geliyorsa (bazı json formatlarında)
    PORT_DB_RAW.forEach(p => {
         if(p.name && p.coordinates) PORT_DB[p.name.toUpperCase()] = { lat: p.coordinates[1], lng: p.coordinates[0] };
    });
}

const REGS_DATA = loadJSON('regulations.json');
const DOCS_DATA = loadJSON('documents.json');

// --- AKILLI ENDPOINTLER ---

app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));

app.get('/api/port-coords', (req, res) => {
    const pName = req.query.port?.toUpperCase();
    res.json(PORT_DB[pName] || {});
});

app.get('/api/documents', (req, res) => res.json(DOCS_DATA));
app.get('/api/regulations', (req, res) => res.json(REGS_DATA));

// [MARKET ORACLE] - Yahoo çalışmazsa bile gerçekçi veri üretir
app.get('/api/market', async (req, res) => {
    try {
        // Önce Yahoo'yu dene (Timeout 2 saniye)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const resBrent = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d', { signal: controller.signal });
        const brentJson = await resBrent.json();
        const brentVal = brentJson.chart.result[0].meta.regularMarketPrice;
        clearTimeout(timeoutId);

        if (brentVal) {
            console.log(` 💹 MARKET DATA (LIVE): Brent $${brentVal}`);
            res.json({ 
                brent: brentVal, 
                mgo: Math.round(brentVal * 11.2), // Piyasa çarpanı
                vlsfo: Math.round(brentVal * 11.2 * 0.78),
                source: "LIVE"
            });
        } else throw new Error("Yahoo Empty");

    } catch (e) {
        // FALLBACK: Simülasyon Modu (Bugünün tarihine göre hafif dalgalı veri üret)
        const basePrice = 74.50;
        const randomFluctuation = (Math.random() * 4) - 2; // +/- 2 dolar
        const simBrent = basePrice + randomFluctuation;
        
        console.log(` ⚠️ MARKET DATA (SIMULATED): Brent $${simBrent.toFixed(2)}`);
        res.json({ 
            brent: simBrent, 
            mgo: Math.round(simBrent * 11.5), 
            vlsfo: Math.round(simBrent * 11.5 * 0.78),
            source: "SIMULATED"
        });
    }
});

// [AI CHATBOT - GEMINI 2.5 ENGINE]
app.post('/api/chat', async (req, res) => {
    const { message, language } = req.body;
    const targetLang = language || "English";

    if (!API_KEY) return res.json({ reply: "Sistem Hatası: API Anahtarı eksik." });

    console.log(` 💬 USER: "${message}" [${targetLang}]`);

    try {
        // Önce 2.5 Flash'ı dene, yoksa 1.5 Pro'ya düş
        let modelName = "gemini-2.5-flash"; 
        
        // SYSTEM PROMPT (Viya Broker Personası)
        const systemInstruction = `
            You are "Viya Broker", an elite maritime chartering expert.
            Tone: Professional yet sharp, slightly informal like a "Ship Captain" (Reis).
            Context: You are helping a user manage shipping routes, calculate profits, and analyze risks.
            Rules:
            1. Respond ONLY in ${targetLang}.
            2. Be concise. Don't write essays.
            3. If the user asks about the market, refer to general trends (Oil prices, geopolitics).
            4. Use maritime terminology (Demurrage, Laycan, TCE, OPEX) correctly.
            User Input: "${message}"
        `;

        // Modeli Başlat
        // NOT: Google Node SDK'da model seçimi farklı olabilir, en güvenli yol:
        let model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Garanti model
        // Eğer 2.5 varsa burada değiştirebilirsin ama şimdilik güvenli liman 1.5 Flash kalsın, hız için.
        
        const result = await model.generateContent(systemInstruction);
        const response = await result.response;
        const text = response.text();

        console.log(` 🤖 VIYA: "${text.substring(0, 50)}..."`);
        res.json({ reply: text });

    } catch (error) {
        console.error(" ❌ AI ERROR:", error.message);
        res.json({ reply: "Bağlantı koptu Reis. Telsiz çekmiyor (API Hatası)." });
    }
});

// [VOYAGE ANALYZER - TACTICAL ENGINE]
app.post('/api/analyze', async (req, res) => {
    console.log(" ⚙️ ANALYZING VOYAGE REQUEST...");
    const { shipLat, shipLng, vType, cargoQty, loadRate, dischRate } = req.body;
    
    if (!shipLat || !shipLng) return res.json({ success: false, msg: "No coordinates" });

    const specs = VESSEL_SPECS[vType] || VESSEL_SPECS["SUPRAMAX"];
    const allPorts = Object.keys(PORT_DB);
    
    // Sadece koordinatı olan limanları al
    const validPorts = allPorts.filter(p => PORT_DB[p] && PORT_DB[p].lat);

    // 1. ADIM: Yakındaki Limanları Bul (Yükleme Adayları)
    // Geminin 3000 mil çapındaki limanları önceliklendir
    const candidates = validPorts.map(p => {
        const dist = getDistance(shipLat, shipLng, PORT_DB[p].lat, PORT_DB[p].lng);
        return { name: p, geo: PORT_DB[p], dist };
    }).filter(p => p.dist < 5000) // Çok uzaklara gitme (Balast minimize et)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 50); // En yakın 50 liman

    if (candidates.length === 0) return res.json({ success: false, msg: "No ports found nearby" });

    // 2. ADIM: Piyasa Verisini Çek (Internal Call)
    // Burada fetch yerine direkt logic kullanabiliriz ama API tutarlılığı için mock data kullanalım
    const marketData = { vlsfo: 620, mgo: 900, portDuesFactor: 1.25 }; // Default Market

    const suggestions = [];
    let attempts = 0;
    const maxSuggestions = 5;

    // 3. ADIM: Karlı Rota Avı
    // Rastgele değil, mantıklı eşleşmeler yapmaya çalış
    while(suggestions.length < maxSuggestions && attempts < 100) {
        attempts++;
        
        // Yükleme limanı: Yakındakilerden biri
        const load = candidates[Math.floor(Math.random() * (candidates.length > 10 ? 10 : candidates.length))];
        
        // Tahliye limanı: Rastgele ama yüklemeden farklı
        const dischName = validPorts[Math.floor(Math.random() * validPorts.length)];
        
        if (!load || load.name === dischName) continue;
        if (!PORT_DB[dischName]) continue;

        // Mesafeyi kontrol et (Çok kısa seferleri ele - 200 milden azsa)
        const voyageDist = getDistance(load.geo.lat, load.geo.lng, PORT_DB[dischName].lat, PORT_DB[dischName].lng);
        if (voyageDist < 200) continue;

        // ** KRİTİK: calculation.js içindeki yeni fonksiyonu çağır **
        const calc = calculateFullVoyage(
            shipLat, shipLng, 
            load.name, load.geo, 
            dischName, PORT_DB[dischName], 
            specs, marketData, 
            specs.default_speed, 
            cargoQty, loadRate, dischRate
        );

        if(calc) {
            // Analiz HTML'ini oluştur
            calc.aiAnalysis = generateAnalysis(calc, specs);
            suggestions.push(calc);
        }
    }

    // En karlı sefer en üstte olsun (TCE'ye göre sırala)
    suggestions.sort((a, b) => b.financials.tce - a.financials.tce);

    console.log(` ✅ ANALYSIS COMPLETE: Found ${suggestions.length} viable routes.`);
    res.json({ success: true, voyages: suggestions });
});

app.listen(port, () => {
    console.log(` 🚀 VIYA SYSTEM IS READY. LISTENING ON PORT ${port}`);
    console.log("\x1b[36m%s\x1b[0m", "----------------------------------------------------");
});
