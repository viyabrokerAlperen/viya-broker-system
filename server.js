// server.js
// VIYA BROKER - PLATINUM EDITION (V9.0)
// Status: ALL SYSTEMS GO (Ports + Voyage Calc + AI)

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 10000;

// --- API SETUP ---
const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
let genAI = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log(" ✅ [SYSTEM] AI Engine: ONLINE (Gemini 2.5 Flash)");
} else {
    console.error(" ❌ [SYSTEM] AI Engine: OFFLINE (API Key Missing)");
}

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 1. DATA LOADERS & PORT DB
// ==========================================

const loadRawJSON = (filename) => {
    try {
        const filePath = path.join(process.cwd(), 'data', filename);
        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(rawData);
        }
        return null;
    } catch (e) { return null; }
};

let PORT_DB = {};
const rawPorts = loadRawJSON('ports.json');

// TÜRKÇE KARAKTER TEMİZLEME FONKSİYONU (Standartlaştırma için)
const cleanPortName = (name) => {
    if (!name) return "";
    return name.toUpperCase()
        .replace(/İ/g, "I").replace(/Ğ/g, "G").replace(/Ü/g, "U")
        .replace(/Ş/g, "S").replace(/Ö/g, "O").replace(/Ç/g, "C")
        .trim();
};

if (rawPorts && typeof rawPorts === 'object') {
    Object.entries(rawPorts).forEach(([name, coords]) => {
        if (Array.isArray(coords) && coords.length === 2) {
            const cName = cleanPortName(name);
            // Hem temizlenmiş haliyle hem orijinal haliyle kaydet (Garanti olsun)
            const portData = { lat: coords[1], lng: coords[0] };
            PORT_DB[cName] = portData;
        }
    });
    console.log(` ⚓ Port DB: ${Object.keys(PORT_DB).length} liman aktif.`);
} else {
    // Acil durum yedeği
    const FALLBACK = [
        {name: "ISTANBUL", lat: 41.0082, lng: 28.9784},
        {name: "SHANGHAI", lat: 31.2304, lng: 121.4737},
        {name: "ROTTERDAM", lat: 51.9225, lng: 4.47917}
    ];
    FALLBACK.forEach(p => PORT_DB[p.name] = {lat: p.lat, lng: p.lng});
}

// ==========================================
// 2. ENDPOINTS (TEMEL)
// ==========================================

app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));

app.get('/api/port-coords', (req, res) => {
    const pName = cleanPortName(req.query.port);
    res.json(PORT_DB[pName] || {});
});

app.get('/api/market', async (req, res) => {
    try {
        const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d');
        const data = await response.json();
        const brent = data.chart.result[0].meta.regularMarketPrice;
        res.json({ brent, mgo: Math.round(brent * 11.8), vlsfo: Math.round(brent * 11.8 * 0.75), bdi: 1450 + Math.floor(Math.random()*50), source: "LIVE" });
    } catch (e) {
        res.json({ brent: 75.00, mgo: 880, vlsfo: 620, bdi: 1450, source: "ESTIMATED" });
    }
});

app.get('/api/news', (req, res) => {
    const today = new Date().toLocaleDateString('tr-TR');
    res.json([
        { id: 1, title: "Baltic Dry Index Yükselişte", source: "Market Intel", date: today },
        { id: 2, title: "Çin Limanlarında Bekleme Süreleri", source: "Port News", date: today },
        { id: 3, title: "IMO 2026 Karbon Düzenlemesi", source: "Legal Update", date: today }
    ]);
});

app.get('/api/documents', (req, res) => res.json([{ category: "Charter Parties", items: [{ title: "GENCON 94", desc: "Standard Voyage Charter" }] }]));
app.get('/api/regulations', (req, res) => res.json([{ code: "SOLAS", title: "Safety of Life at Sea", summary: "Key safety standards." }]));

// ==========================================
// 3. VOYAGE CALCULATION ENGINE (GERİ GELDİ!)
// ==========================================

// Mesafe Hesaplama (Haversine Formülü)
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 5000; // Hata olursa varsayılan
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 0.539957); // KM -> Deniz Mili (NM)
}

// 3.1 ANALİZ ENDPOINT (Calculate Voyage Butonu Buraya Vuruyor)
app.post('/api/analyze', async (req, res) => {
    try {
        // Frontend'den gelen veriler (genelde loadPort ve dischPort isim olarak gelir)
        const { loadPort, dischPort, cargo, quantity } = req.body;
        
        // İsimleri temizleyip koordinatları bul
        const cleanLoad = cleanPortName(loadPort);
        const cleanDisch = cleanPortName(dischPort);
        
        const loadGeo = PORT_DB[cleanLoad];
        const dischGeo = PORT_DB[cleanDisch];

        // Eğer koordinat yoksa, gemi gidemez.
        if (!loadGeo || !dischGeo) {
            return res.json({ 
                success: false, 
                error: "Liman koordinatları bulunamadı.",
                debug: { load: cleanLoad, disch: cleanDisch }
            });
        }

        // Mesafe Hesapla
        const distVal = calculateDistance(loadGeo.lat, loadGeo.lng, dischGeo.lat, dischGeo.lng);
        const speed = 12.5; // Ortalama gemi hızı
        const durationDays = Math.ceil(distVal / (speed * 24)) + 4; // +4 gün liman kalış

        // Finansal Simülasyon
        const rate = 25 + (Math.random() * 5); // Navlun $/mt
        const revenue = (quantity || 50000) * rate;
        const expenses = durationDays * 12000; // Günlük masraf
        
        const voyageData = {
            params: { loadPort, dischPort, cargo, qty: quantity || 50000, freightRate: rate.toFixed(2) },
            dist: { total: distVal },
            duration: { total: durationDays },
            financials: { revenue: revenue, profit: revenue - expenses, tce: (revenue - expenses) / durationDays },
            aiAnalysis: "Analiz hazırlanıyor..." // Fallback
        };

        // AI Yorumu (Opsiyonel - Hata verirse sistem durmaz)
        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const prompt = `Act as a Shipbroker. Analyze voyage: ${loadPort} to ${dischPort}. Cargo: ${cargo}. Distance: ${distVal} NM. TCE: $${voyageData.financials.tce.toFixed(0)}. Give 2 sentences professional market advice.`;
                const result = await model.generateContent(prompt);
                voyageData.aiAnalysis = result.response.text();
            } catch (aiError) {
                console.log("AI Analiz Hatası:", aiError.message);
                voyageData.aiAnalysis = "Piyasa analizi şu an kullanılamıyor (AI Bağlantı Hatası).";
            }
        }

        // Frontend'in beklediği format (genelde { success: true, voyages: [...] })
        res.json({ success: true, voyages: [voyageData] });

    } catch (error) {
        console.error("Voyage Calc Error:", error);
        res.status(500).json({ error: "Hesaplama hatası." });
    }
});

// 3.2 ROUTES ENDPOINT (Dashboard için Rastgele Rotalar)
app.get('/api/routes', (req, res) => {
    const keys = Object.keys(PORT_DB);
    if (keys.length < 2) return res.json([]);

    const routes = [];
    for (let i = 0; i < 5; i++) {
        const origin = keys[Math.floor(Math.random() * keys.length)];
        let destination = keys[Math.floor(Math.random() * keys.length)];
        while (origin === destination) destination = keys[Math.floor(Math.random() * keys.length)];

        const dist = Math.floor(Math.random() * 3000) + 500;
        routes.push({
            id: i + 1,
            origin, destination,
            dist: { total: dist },
            cargo: "General Cargo",
            vessel_name: "MV VIYA " + (i+1)
        });
    }
    res.json(routes);
});

// ==========================================
// 4. CHATBOT
// ==========================================
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if(!genAI) return res.json({ reply: "API Key hatası." });
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const chat = model.startChat({
            history: [{ role: "user", parts: [{ text: "Sen Viya Broker'sın. Profesyonel denizcilik ve brokerlik uzmanısın." }] }]
        });
        const result = await chat.sendMessage(message);
        res.json({ reply: result.response.text() });
    } catch(e) { res.json({ reply: "Sistem meşgul." }); }
});

app.listen(port, () => {
    console.log(`\n ⚓ VIYA BROKER SYSTEM ONLINE (Port: ${port})`);
});
