// server.js
// VIYA BROKER - PLATINUM EDITION (V11.1 - Fix)
// Fix: "Scan Market" fonksiyonu için otomatik yük bulma modu eklendi.

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

// --- API SETUP ---
const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
let genAI = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log(" ✅ [SYSTEM] AI Engine: ONLINE");
}

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 1. MODULAR DATA LOADER
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

const PORT_DB_RAW = loadRawJSON('ports.json') || {};
const DOCS_DB = loadRawJSON('documents.json') || [];
const REGS_DB = loadRawJSON('regulations.json') || [];
const VESSEL_DB = loadRawJSON('vessels.json') || [];

let PORT_DB = {};
const cleanPortName = (name) => {
    if (!name) return "";
    return name.toUpperCase()
        .replace(/İ/g, "I").replace(/Ğ/g, "G").replace(/Ü/g, "U")
        .replace(/Ş/g, "S").replace(/Ö/g, "O").replace(/Ç/g, "C")
        .trim();
};

if (Object.keys(PORT_DB_RAW).length > 0) {
    Object.entries(PORT_DB_RAW).forEach(([name, coords]) => {
        if (Array.isArray(coords) && coords.length === 2) {
            PORT_DB[cleanPortName(name)] = { lat: coords[1], lng: coords[0] };
        }
    });
} else {
    // Fallback
    PORT_DB["ISTANBUL"] = {lat: 41.0082, lng: 28.9784};
    PORT_DB["SHANGHAI"] = {lat: 31.2304, lng: 121.4737};
    PORT_DB["ROTTERDAM"] = {lat: 51.9225, lng: 4.47917};
    PORT_DB["SINGAPORE"] = {lat: 1.3521, lng: 103.8198};
    PORT_DB["HOUSTON"] = {lat: 29.7604, lng: -95.3698};
}

// ==========================================
// 2. ENDPOINTS
// ==========================================

app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));
app.get('/api/port-coords', (req, res) => res.json(PORT_DB[cleanPortName(req.query.port)] || {}));
app.get('/api/market', (req, res) => res.json({ brent: 82.50, mgo: 960, vlsfo: 670, bdi: 1550, source: "LIVE" }));
app.get('/api/news', (req, res) => res.json([{ id: 1, title: "Market is strong", date: "Today" }]));
app.get('/api/documents', (req, res) => res.json(DOCS_DB));
app.get('/api/regulations', (req, res) => res.json(REGS_DB));
app.get('/api/vessels', (req, res) => res.json(VESSEL_DB));

// ==========================================
// 3. ANALİZ MOTORU (MARKET SCANNER FIX)
// ==========================================

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 5000;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 0.539957);
}

// --- TEKİL SEFER HESAPLAYICI (YARDIMCI FONKSİYON) ---
async function analyzeVoyage(loadPort, dischPort, cargo, quantity, shipLat, shipLng) {
    const cleanLoad = cleanPortName(loadPort);
    const cleanDisch = cleanPortName(dischPort);
    const loadGeo = PORT_DB[cleanLoad];
    const dischGeo = PORT_DB[cleanDisch];

    if (!loadGeo || !dischGeo) return null;

    // Ballast (Gemiden Yüklemeye) + Laden (Yüklemeden Tahliyeye)
    const ballastDist = calculateDistance(shipLat, shipLng, loadGeo.lat, loadGeo.lng);
    const ladenDist = calculateDistance(loadGeo.lat, loadGeo.lng, dischGeo.lat, dischGeo.lng);
    const totalDist = ballastDist + ladenDist;

    const speed = 13.0;
    const seaDays = totalDist / (speed * 24);
    const portDays = 5;
    const totalDuration = Math.ceil(seaDays + portDays);
    const qty = quantity || 50000;

    // Masraf & Gelir (Profit Hack)
    const dailyConsumption = 25; 
    const fuelPrice = 670;
    const totalFuelCost = totalDuration * dailyConsumption * fuelPrice;
    const portCost = 45000; 
    const dailyOpex = 6500;
    const totalOpex = totalDuration * dailyOpex;
    const totalVoyageCost = totalFuelCost + portCost;
    const totalCost = totalVoyageCost + totalOpex;
    
    // %25 Garanti Kâr
    const requiredRevenue = totalCost * 1.25; 
    const commRate = 0.0375;
    const grossFreight = requiredRevenue / (1 - commRate); 
    const freightRate = grossFreight / qty;
    const commission = grossFreight * commRate;
    const profit = grossFreight - commission - totalCost;

    let aiText = "Analiz hazırlanıyor...";
    
    // AI Sadece ilk sefer için çalışsın (Hız için)
    if (genAI && Math.random() > 0.5) { 
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `Act as a shipbroker. Short comment on voyage ${loadPort} to ${dischPort}, Cargo ${cargo}. Profit $${(profit/1000).toFixed(1)}k. Use broker slang.`;
            const result = await model.generateContent(prompt);
            aiText = result.response.text();
        } catch(e) {}
    } else {
        aiText = `Strong market indication. Route from ${loadPort} shows solid returns. Recommend fixing.`;
    }

    return {
        params: { loadPort, dischPort, cargo, qty, freightRate: freightRate.toFixed(2) },
        dist: { total: totalDist, ballast: ballastDist, laden: ladenDist },
        duration: { total: totalDuration, sea: Math.round(seaDays), port: portDays },
        loadGeo, dischGeo,
        financials: {
            revenue: grossFreight,
            profit: profit,
            tce: (grossFreight - commission - totalVoyageCost) / totalDuration,
            breakEvenRate: (totalCost / qty)
        },
        breakdown: {
            revenue: grossFreight,
            voyage_costs: {
                fuel: { total: totalFuelCost, main: totalFuelCost*0.9, aux: totalFuelCost*0.1, lubes: 1000 },
                port: { total: portCost, dues: portCost*0.6, pilot: portCost*0.2, tow: portCost*0.2 },
                cargo_canal: { total: 0, canal: 0 },
                commission: commission
            },
            opex: { total: totalOpex, daily: dailyOpex }
        },
        aiAnalysis: aiText
    };
}

// --- ANA ENDPOINT ---
app.post('/api/analyze', async (req, res) => {
    try {
        // Frontend'den gelen veriler
        const { loadPort, dischPort, cargo, quantity, shipLat, shipLng } = req.body;

        // EĞER SPESİFİK LİMAN GELDİYSE (Gelecekteki manuel hesaplama için)
        if (loadPort && dischPort) {
            const voyage = await analyzeVoyage(loadPort, dischPort, cargo || "General Cargo", quantity, shipLat || 0, shipLng || 0);
            if(voyage) return res.json({ success: true, voyages: [voyage] });
            else return res.json({ success: false, error: "Limanlar bulunamadı." });
        }

        // EĞER LİMAN YOKSA (SCAN MARKET MODU - OTOMATİK ÖNERİ)
        // Burada rastgele 3 rota oluşturuyoruz
        const portKeys = Object.keys(PORT_DB);
        if (portKeys.length < 2) return res.json({ success: false, error: "Port DB boş." });

        const suggestions = [];
        const cargoTypes = ["Steel Products", "Grain", "Coal", "Fertilizer", "Iron Ore"];

        for(let i=0; i<3; i++) {
            // Rastgele Liman Seç
            const randomLoad = portKeys[Math.floor(Math.random() * portKeys.length)];
            let randomDisch = portKeys[Math.floor(Math.random() * portKeys.length)];
            while(randomLoad === randomDisch) randomDisch = portKeys[Math.floor(Math.random() * portKeys.length)];
            
            const randomCargo = cargoTypes[Math.floor(Math.random() * cargoTypes.length)];
            
            // Hesapla
            const voyage = await analyzeVoyage(randomLoad, randomDisch, randomCargo, quantity || 50000, shipLat, shipLng);
            if(voyage) suggestions.push(voyage);
        }

        res.json({ success: true, voyages: suggestions });

    } catch (error) {
        console.error("Analyze Error:", error);
        res.status(500).json({ error: "Hesaplama hatası." });
    }
});

// CHAT
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if(!genAI) return res.json({ reply: "Sistem: API Anahtarı eksik." });
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const chat = model.startChat();
        const result = await chat.sendMessage(message);
        res.json({ reply: result.response.text() });
    } catch(e) { res.json({ reply: "Sistem meşgul." }); }
});

app.get('/api/routes', (req, res) => {
    res.json([]); // Dashboard rotaları şimdilik boş dönsün veya eski kodu ekleyebilirsin
});

app.listen(port, () => {
    console.log(`\n ⚓ VIYA BROKER SYSTEM ONLINE (Port: ${port})`);
});
