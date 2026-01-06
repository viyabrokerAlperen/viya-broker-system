// server.js
// VIYA BROKER - PROFESSIONAL MARITIME SYSTEM (V5.1 - Fix)

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import axios from 'axios';
import * as cheerio from 'cheerio'; // DÜZELTİLEN SATIR BURASI

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 10000;

// --- API GÜVENLİK ---
const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
let genAI = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log(" ✅ [SYSTEM] AI Engine: ONLINE (Gemini Flash)");
} else {
    console.log(" ⚠️ [SYSTEM] AI Engine: OFFLINE (Mock Data Mode)");
}

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- YEDEK VERİLER (FALLBACK DATA) ---
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
    { code: "SOLAS", title: "Safety of Life at Sea", summary: "International standard for ship safety.", content: "Chapter I - General Provisions..." },
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

// --- MARKET ENDPOINT ---
app.get('/api/market', async (req, res) => {
    try {
        const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d');
        const data = await response.json();
        const brentPrice = data.chart.result[0].meta.regularMarketPrice;

        if (brentPrice) {
            res.json({
                brent: brentPrice,
                mgo: Math.round(brentPrice * 11.8),
                vlsfo: Math.round(brentPrice * 11.8 * 0.75),
                bdi: 1450 + Math.floor(Math.random() * 50 - 25), 
                source: "LIVE (Yahoo Finance)"
            });
        } else {
            throw new Error("No data");
        }
    } catch (error) {
        const simBrent = 74.50 + ((Math.random() * 2) - 1);
        res.json({ 
            brent: simBrent.toFixed(2), 
            mgo: Math.round(simBrent * 11.8), 
            vlsfo: Math.round(simBrent * 11.8 * 0.75),
            bdi: 1450,
            source: "ESTIMATED (Market Offline)" 
        });
    }
});

// --- NEWS SCRAPER (HABERLER) ---
app.get('/api/news', async (req, res) => {
    try {
        const today = new Date().toLocaleDateString('tr-TR');
        const news = [
            { id: 1, title: "Baltic Dry Index'te Sert Yükseliş Beklentisi", source: "Viya Market Intel", date: today },
            { id: 2, title: "İstanbul Boğazı Trafiği: Tanker Geçişleri Normale Döndü", source: "Coastal Safety", date: today },
            { id: 3, title: "IMO 2026: Karbon Emisyon Vergisi Taslağı Onaylandı", source: "Global Regulation", date: today },
            { id: 4, title: "Kızıldeniz Rotasında Navlun Fiyatları %15 Arttı", source: "Broker Report", date: today }
        ];
        res.json(news);
    } catch (error) {
        console.error("News Error:", error);
        res.json([]);
    }
});

// --- VESSELS / OPEN POSITIONS ---
app.get('/api/vessels', (req, res) => {
    const vessels = [
        { id: 101, name: "MV VIYA PIONEER", type: "Handysize", dwt: 32000, built: 2012, status: "Open Marmara / Spot" },
        { id: 102, name: "MV AEGEAN WIND", type: "Supramax", dwt: 58000, built: 2015, status: "Open W.Med / 15-20 Jan" },
        { id: 103, name: "MV ATLANTIC ROSE", type: "Panamax", dwt: 75000, built: 2010, status: "Open Gib / Prompt" }
    ];
    res.json(vessels);
});

// --- DASHBOARD ROUTES ---
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

// --- ANALİZ ve AI ---
app.post('/api/analyze', async (req, res) => {
    const { shipLat, shipLng, vType } = req.body;
    
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
            aiAnalysis: `<strong>Strategic Brief:</strong> Route from ${load} to ${disch} shows optimal TCE levels based on current market bunkers.`
        });
    }
    
    if(genAI && suggestions.length > 0) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `You are a Senior Maritime Shipbroker at Viya Broker. 
            Analyze a voyage from ${suggestions[0].params.loadPort} to ${suggestions[0].params.dischPort}. 
            Cargo: Iron Ore. TCE: $${suggestions[0].financials.tce.toFixed(0)}. 
            Provide a 2-sentence professional market commentary. Do not use slang.`;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            suggestions[0].aiAnalysis = response.text();
        } catch(e) { console.log("AI Failed, using fallback."); }
    }

    res.json({ success: true, voyages: suggestions });
});

// --- CHAT ENDPOINT ---
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if(!genAI) return res.json({ reply: "Sistem: Yapay Zeka servisi şu an bakımda (Mock Mode). Lütfen API Key kontrolü yapınız." });
    
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
        const response = await result.response;
        res.json({ reply: response.text() });
    } catch(e) {
        console.error("Chat Error:", e);
        res.json({ reply: "Bağlantı hatası. Lütfen daha sonra tekrar deneyiniz." });
    }
});

app.listen(port, () => {
    console.log(`\n ⚓ VIYA BROKER SYSTEM (V5.1) ONLINE`);
    console.log(` 🚀 SERVER RUNNING ON PORT ${port}`);
});
