// server.js
// VIYA BROKER - PROFESSIONAL MARITIME SYSTEM (V4.0)

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 10000;

// --- API GÜVENLİK ---
const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;
let genAI = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log(" ✅ [SYSTEM] AI Engine: ONLINE");
} else {
    console.log(" ⚠️ [SYSTEM] AI Engine: OFFLINE (Mock Data Mode)");
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- YEDEK VERİLER (FALLBACK DATA) ---
// Dosyalar okunamasa bile sistemin boş görünmemesini sağlar.
const FALLBACK_PORTS = [
    {name: "ISTANBUL", coordinates: [28.9784, 41.0082]},
    {name: "PIRAEUS", coordinates: [23.6469, 37.9429]},
    {name: "ROTTERDAM", coordinates: [4.47917, 51.9225]},
    {name: "SINGAPORE", coordinates: [103.8198, 1.3521]},
    {name: "SHANGHAI", coordinates: [121.4737, 31.2304]},
    {name: "NEW YORK", coordinates: [-74.0060, 40.7128]},
    {name: "SANTOS", coordinates: [-46.3097, -23.9618]}
];

const FALLBACK_DOCS = [
    {
        category: "Charter Parties",
        items: [
            { title: "GENCON 94", desc: "Standard Voyage Charter Party", content: "PART I\n1. Shipbroker...\n2. Place and Date..." },
            { title: "NYPE 2015", desc: "New York Produce Exchange Form", content: "Time Charter Party Agreement..." }
        ]
    },
    {
        category: "Bills of Lading",
        items: [
            { title: "Congenbill 2016", desc: "To be used with Charter Parties", content: "Conditions of Carriage..." }
        ]
    }
];

const FALLBACK_REGS = [
    { code: "SOLAS", title: "Safety of Life at Sea", summary: "International standard for ship safety, construction, and equipment.", content: "Chapter I - General Provisions..." },
    { code: "MARPOL", title: "Marine Pollution", summary: "Prevention of pollution by ships (Annex I-VI).", content: "Annex I - Regulations for the Prevention of Pollution by Oil..." }
];

// --- DATA LOADERS ---
const loadJSON = (file, fallback) => {
    try { 
        const filePath = path.join(__dirname, 'data', file);
        if (!fs.existsSync(filePath)) return fallback;
        const data = JSON.parse(fs.readFileSync(filePath));
        if (Array.isArray(data) && data.length === 0) return fallback;
        return data;
    } catch (e) { return fallback; }
};

// Port DB Oluşturma
const rawPorts = loadJSON('ports.json', FALLBACK_PORTS);
let PORT_DB = {};
if (Array.isArray(rawPorts)) {
    rawPorts.forEach(p => {
        if(p.name && p.coordinates) PORT_DB[p.name.toUpperCase()] = { lat: p.coordinates[1], lng: p.coordinates[0] };
    });
}

// --- ENDPOINTS ---

app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));

app.get('/api/port-coords', (req, res) => {
    const pName = req.query.port?.toUpperCase();
    res.json(PORT_DB[pName] || {});
});

app.get('/api/documents', (req, res) => res.json(loadJSON('documents.json', FALLBACK_DOCS)));
app.get('/api/regulations', (req, res) => res.json(loadJSON('regulations.json', FALLBACK_REGS)));

// MARKET ENDPOINT (LIVE/DELAYED)
app.get('/api/market', async (req, res) => {
    try {
        // Yahoo Finance'den Brent Petrol verisi çekmeye çalış
        const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d');
        const data = await response.json();
        const brentPrice = data.chart.result[0].meta.regularMarketPrice;

        if (brentPrice) {
            res.json({
                brent: brentPrice,
                mgo: Math.round(brentPrice * 11.8), // Sektörel ortalama çarpan
                vlsfo: Math.round(brentPrice * 11.8 * 0.75),
                source: "LIVE (Delayed)"
            });
        } else {
            throw new Error("No data");
        }
    } catch (error) {
        // Çekemezse gerçekçi simülasyon
        const simBrent = 74.50 + ((Math.random() * 2) - 1);
        res.json({ 
            brent: simBrent, 
            mgo: Math.round(simBrent * 11.8), 
            vlsfo: Math.round(simBrent * 11.8 * 0.75),
            source: "ESTIMATED" 
        });
    }
});

// DASHBOARD ROUTES (Undefined Fix)
app.get('/api/routes', (req, res) => {
    const ports = Object.keys(PORT_DB);
    const routes = [];
    for (let i = 0; i < 6; i++) {
        const origin = ports[Math.floor(Math.random() * ports.length)];
        let destination = ports[Math.floor(Math.random() * ports.length)];
        while(origin === destination) destination = ports[Math.floor(Math.random() * ports.length)];
        
        const distVal = Math.floor(Math.random() * 4000) + 500;
        
        routes.push({
            id: i + 1,
            origin: origin,
            destination: destination,
            date: new Date().toISOString().split('T')[0],
            dist: { total: distVal, ballast: 0, laden: distVal }, 
            price: Math.floor(distVal * 18.5),
            cargo: "General Cargo",
            vessel_name: "MV VIYA " + (i+1)
        });
    }
    res.json(routes);
});

// ANALİZ ve AI (Professional Persona)
app.post('/api/analyze', async (req, res) => {
    const { shipLat, shipLng, vType } = req.body;
    
    // Basit Analiz Mantığı (Utils dosyası opsiyonel)
    const suggestions = [];
    const ports = Object.keys(PORT_DB);
    
    for(let i=0; i<3; i++) {
        const load = ports[Math.floor(Math.random() * ports.length)];
        const disch = ports[Math.floor(Math.random() * ports.length)];
        if(load === disch) continue;
        
        const loadGeo = PORT_DB[load];
        const dischGeo = PORT_DB[disch];
        
        const ballast = Math.floor(Math.random() * 1000) + 100;
        const laden = Math.floor(Math.random() * 4000) + 500;
        
        suggestions.push({
            params: { loadPort: load, dischPort: disch, cargo: "Iron Ore", qty: 50000, freightRate: 25 },
            loadGeo: loadGeo,
            dischGeo: dischGeo,
            dist: { total: ballast + laden, ballast: ballast, laden: laden },
            duration: { total: 25, sea: 20, port: 5 },
            financials: { tce: 15000 + (Math.random()*5000), profit: 50000 + (Math.random()*20000), breakEvenRate: 18 },
            // Default profesyonel mesaj (AI çalışmazsa bu görünür)
            aiAnalysis: `<strong>Strategic Brief:</strong> Route from ${load} to ${disch} shows optimal TCE levels based on current market bunkers.`
        });
    }
    
    // AI Devreye Girerse (Profesyonel Ton)
    if(genAI && suggestions.length > 0) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `You are a Senior Maritime Shipbroker. 
            Analyze a voyage from ${suggestions[0].params.loadPort} to ${suggestions[0].params.dischPort}. 
            Cargo: Iron Ore. TCE: $${suggestions[0].financials.tce.toFixed(0)}. 
            Provide a 2-sentence professional market commentary. Do not use slang.`;
            
            const result = await model.generateContent(prompt);
            suggestions[0].aiAnalysis = result.response.text();
        } catch(e) { console.log("AI Failed, using fallback."); }
    }

    res.json({ success: true, voyages: suggestions });
});

// Chat Endpoint (Professional Persona)
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if(!genAI) return res.json({ reply: "Sistem: API bağlantısı kurulamadı." });
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "Sen Viya Broker sistemisin. Üst düzey, kurumsal ve saygın bir dil kullan. Asla 'Reis', 'Kaptan' gibi samimi ifadeler kullanma. 'Sayın Kullanıcı' veya direkt bilgi odaklı konuş." }],
                },
                {
                    role: "model",
                    parts: [{ text: "Anlaşılmıştır. Viya Broker sistemleri olarak kurumsal çerçevede en güncel piyasa verileri ve analizlerle yardımcı olmaya hazırım." }],
                },
            ],
        });

        const result = await chat.sendMessage(message);
        res.json({ reply: result.response.text() });
    } catch(e) {
        res.json({ reply: "Bağlantı hatası. Lütfen daha sonra tekrar deneyiniz." });
    }
});

app.listen(port, () => {
    console.log(` 🚀 SERVER RUNNING ON PORT ${port}`);
});
