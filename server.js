import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// Hesaplama motorunu utils klasöründen çağırıyoruz
import { calculateFullVoyage, generateAnalysis, getDistance, VESSEL_SPECS } from './utils/calculations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// API KEY KONTROLÜ
const API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
if (API_KEY) {
    console.log("✅ SYSTEM ONLINE: AI Connected");
} else {
    console.error("⚠️ SYSTEM WARNING: API Key Missing (AI features will be disabled)");
}

app.use(cors());
app.use(express.json());

// [KRİTİK] Public klasörünü (Site Arayüzü) dışarıya açıyoruz
app.use(express.static(path.join(__dirname, 'public')));

// =================================================================
// DATA LOADERS (VERİ YÜKLEYİCİLER)
// =================================================================
const loadJSON = (file) => {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', file)));
    } catch (e) {
        console.error(`❌ Error loading ${file}:`, e.message);
        return [];
    }
};

// Liman Veritabanını Yükle
const PORT_DB_RAW = loadJSON('ports.json');
let PORT_DB = {};
// Array formatından Object formatına çevir (Hızlı arama için)
if (!Array.isArray(PORT_DB_RAW)) {
    // Eğer zaten object formatındaysa (eski ports.json gibi)
    for (const [key, val] of Object.entries(PORT_DB_RAW)) {
        PORT_DB[key.toUpperCase()] = { lat: parseFloat(val[1]), lng: parseFloat(val[0]) };
    }
} else {
    // Eğer yeni formatta gelirse (ihtimal)
    console.log("⚠️ Port DB format unknown, using fallback.");
}

const DOCS_DATA = loadJSON('documents.json');
const REGS_DATA = loadJSON('regulations.json');

// AI İçin Yönetmelik Özeti
const REGS_CONTEXT = Array.isArray(REGS_DATA) 
    ? REGS_DATA.map(r => `[${r.code}] ${r.title}: ${r.summary}`).join(" | ")
    : "No regulations loaded.";

// =================================================================
// API ROUTES (ROTALAR)
// =================================================================

// 1. Temel Veri Rotaları
app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));

app.get('/api/port-coords', (req, res) => {
    const pName = req.query.port ? req.query.port.toUpperCase() : "";
    res.json(PORT_DB[pName] || {});
});

app.get('/api/documents', (req, res) => res.json(DOCS_DATA));
app.get('/api/regulations', (req, res) => res.json(REGS_DATA));

// 2. Market Verisi (Yahoo Finance - Canlı)
app.get('/api/market', async (req, res) => {
    try {
        const resBrent = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d');
        const resHO = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/HO=F?interval=1d&range=1d');
        const brentData = await resBrent.json();
        const hoData = await resHO.json();
        
        const brent = brentData.chart.result[0].meta.regularMarketPrice || 78.50;
        const hoGal = hoData.chart.result[0].meta.regularMarketPrice || 2.35;
        
        const mgo = Math.round(hoGal * 319); // Galon -> Ton
        const vlsfo = Math.round(mgo * 0.75); // VLSFO Spread

        res.json({ brent, mgo, vlsfo });
    } catch (e) {
        // Hata olursa varsayılan değerleri dön
        res.json({ brent: 78.50, mgo: 850, vlsfo: 620 });
    }
});

// 3. AI Chat Rotası
app.post('/api/chat', async (req, res) => {
    if (!API_KEY) return res.json({ reply: "AI System is currently offline (API Key Missing)." });
    
    const userMsg = req.body.message;
    const models = ["gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-pro"];

    for (const model of models) {
        try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `SYSTEM: You are VIYA AI, an expert Maritime Broker & Legal Consultant.
                            CONTEXT - REGULATIONS: ${REGS_CONTEXT}
                            INSTRUCTION: Answer briefly and professionally in the user's language.
                            USER: ${userMsg}`
                        }]
                    }]
                })
            });
            const data = await resp.json();
            if (data.candidates && data.candidates[0].content) {
                return res.json({ reply: data.candidates[0].content.parts[0].text });
            }
        } catch (e) {
            console.warn(`AI Model ${model} failed, trying next...`);
        }
    }
    res.json({ reply: "Communication error with AI services." });
});

// 4. Analiz ve Hesaplama Rotası
app.post('/api/analyze', (req, res) => {
    const { shipLat, shipLng, shipSpeed, vType, cargoQty, loadRate, dischRate } = req.body;
    
    // Validasyon
    if (!shipLat || !shipLng) return res.json({ success: false, error: "Missing coordinates" });

    const specs = VESSEL_SPECS[vType] || VESSEL_SPECS["SUPRAMAX"];
    const speed = parseFloat(shipSpeed) || specs.default_speed;
    const qty = parseFloat(cargoQty) || 50000;
    const lRate = parseFloat(loadRate) || 15000;
    const dRate = parseFloat(dischRate) || 10000;

    const allPorts = Object.keys(PORT_DB);
    const suggestions = [];
    
    // Performans için en yakın 50 limanı al
    const sortedPorts = allPorts.map(p => ({
        name: p,
        geo: PORT_DB[p],
        dist: getDistance(shipLat, shipLng, PORT_DB[p].lat, PORT_DB[p].lng)
    })).sort((a, b) => a.dist - b.dist).slice(0, 50);

    // 5 Farklı senaryo üret
    for (let i = 0; i < 5; i++) {
        const loadPort = sortedPorts[Math.floor(Math.random() * sortedPorts.length)];
        const dischPortName = allPorts[Math.floor(Math.random() * allPorts.length)];
        
        if (loadPort.name === dischPortName) continue;

        const dischGeo = PORT_DB[dischPortName];
        
        // UTILS klasöründeki motoru kullan
        const calc = calculateFullVoyage(
            shipLat, shipLng, 
            loadPort.name, loadPort.geo, 
            dischPortName, dischGeo, 
            specs, 
            { vlsfo: 620, mgo: 850 }, // Market verisi (basitleştirilmiş)
            speed, qty, lRate, dRate
        );

        if (calc.financials.profit > -200000) { // Çok kötü zararları filtrele
            suggestions.push({
                ...calc,
                aiAnalysis: generateAnalysis(calc, specs)
            });
        }
    }

    // TCE'ye göre en iyiden en kötüye sırala
    suggestions.sort((a, b) => b.financials.tce - a.financials.tce);
    
    res.json({ success: true, voyages: suggestions });
});

// SUNUCUYU BAŞLAT
app.listen(port, () => {
    console.log(`🚀 VIYA BROKER MODULAR SERVER running on port ${port}`);
    console.log(`📂 Serving static files from: ${path.join(__dirname, 'public')}`);
});
