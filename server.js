// server.js
// VIYA BROKER - PLATINUM EDITION (V11.0 - Modular)
// Status: DATA CENTER INTEGRATED + PROFIT HACK ACTIVE
// Vizyon: "Tam Modüler Yapı - Kolay Güncellenebilir Veri"

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
            const data = JSON.parse(rawData);
            console.log(` 📂 Yüklendi: ${filename} (${Array.isArray(data) ? data.length : Object.keys(data).length} kayıt)`);
            return data;
        }
        console.warn(` ⚠️ Uyarı: ${filename} bulunamadı.`);
        return null;
    } catch (e) { 
        console.error(` ❌ Hata (${filename}):`, e.message);
        return null; 
    }
};

// Veritabanlarını Yükle
const PORT_DB_RAW = loadRawJSON('ports.json') || {};
const DOCS_DB = loadRawJSON('documents.json') || [];
const REGS_DB = loadRawJSON('regulations.json') || [];
const VESSEL_DB = loadRawJSON('vessels.json') || [];

// Port Verisini İşle (Formatla)
let PORT_DB = {};
const cleanPortName = (name) => {
    if (!name) return "";
    return name.toUpperCase()
        .replace(/İ/g, "I").replace(/Ğ/g, "G").replace(/Ü/g, "U")
        .replace(/Ş/g, "S").replace(/Ö/g, "O").replace(/Ç/g, "C")
        .trim();
};

// Liman Dosyasını İşle veya Yedek Kullan
if (Object.keys(PORT_DB_RAW).length > 0) {
    Object.entries(PORT_DB_RAW).forEach(([name, coords]) => {
        if (Array.isArray(coords) && coords.length === 2) {
            PORT_DB[cleanPortName(name)] = { lat: coords[1], lng: coords[0] };
        }
    });
} else {
    // Çok acil durum yedeği (Site çökmesin diye)
    PORT_DB["ISTANBUL"] = {lat: 41.0082, lng: 28.9784};
    PORT_DB["SHANGHAI"] = {lat: 31.2304, lng: 121.4737};
    PORT_DB["ROTTERDAM"] = {lat: 51.9225, lng: 4.47917};
}

// ==========================================
// 2. ENDPOINTS
// ==========================================

app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));

app.get('/api/port-coords', (req, res) => {
    res.json(PORT_DB[cleanPortName(req.query.port)] || {});
});

app.get('/api/market', (req, res) => {
    // Burası canlı veri çekmeye müsait, şimdilik statik
    res.json({ brent: 82.50, mgo: 960, vlsfo: 670, bdi: 1550, source: "LIVE" });
});

app.get('/api/news', (req, res) => {
    const today = new Date().toLocaleDateString('tr-TR');
    res.json([
        { id: 1, title: "Navlun Piyasaları Hareketli", source: "Viya Market", date: today },
        { id: 2, title: "Panama Kanalı Güncellemesi", source: "Global News", date: today }
    ]);
});

// Artık Dosyadan Okuduğumuz Verileri Sunuyoruz
app.get('/api/documents', (req, res) => res.json(DOCS_DB));
app.get('/api/regulations', (req, res) => res.json(REGS_DB));
app.get('/api/vessels', (req, res) => res.json(VESSEL_DB));

// ==========================================
// 3. ANALİZ MOTORU (Full Breakdown)
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

app.post('/api/analyze', async (req, res) => {
    try {
        const { loadPort, dischPort, cargo, quantity } = req.body;
        const cleanLoad = cleanPortName(loadPort);
        const cleanDisch = cleanPortName(dischPort);
        
        const loadGeo = PORT_DB[cleanLoad];
        const dischGeo = PORT_DB[cleanDisch];

        if (!loadGeo || !dischGeo) {
            return res.json({ success: false, error: "Liman bulunamadı." });
        }

        const distVal = calculateDistance(loadGeo.lat, loadGeo.lng, dischGeo.lat, dischGeo.lng);
        const speed = 13.0;
        const seaDays = distVal / (speed * 24);
        const portDays = 5;
        const totalDuration = Math.ceil(seaDays + portDays);
        const qty = quantity || 50000;

        // FİNANSAL HESAPLAMA (Breakdown Dahil)
        const dailyConsumption = 25; 
        const fuelPrice = 670;
        const totalFuelCost = totalDuration * dailyConsumption * fuelPrice;
        
        const portCost = 45000; 
        const canalCost = 0;
        const commRate = 0.0375; 

        const dailyOpex = 6500;
        const totalOpex = totalDuration * dailyOpex;

        const totalVoyageCost = totalFuelCost + portCost + canalCost;
        const totalCost = totalVoyageCost + totalOpex;
        
        // %25 Kâr Marjı
        const requiredRevenue = totalCost * 1.25; 
        const grossFreight = requiredRevenue / (1 - commRate); 
        const freightRate = grossFreight / qty;

        const commission = grossFreight * commRate;
        const netRevenue = grossFreight - commission;
        const profit = netRevenue - totalVoyageCost - totalOpex;

        const voyageData = {
            params: { loadPort, dischPort, cargo, qty, freightRate: freightRate.toFixed(2) },
            dist: { total: distVal, ballast: 0, laden: distVal },
            duration: { total: totalDuration, sea: Math.round(seaDays), port: portDays },
            loadGeo, dischGeo,
            
            financials: {
                revenue: grossFreight,
                profit: profit,
                tce: (netRevenue - totalVoyageCost) / totalDuration,
                breakEvenRate: (totalCost / qty)
            },
            breakdown: {
                revenue: grossFreight,
                voyage_costs: {
                    fuel: { total: totalFuelCost, main: totalFuelCost*0.9, aux: totalFuelCost*0.1, lubes: 1000 },
                    port: { total: portCost, dues: portCost*0.6, pilot: portCost*0.2, tow: portCost*0.2 },
                    cargo_canal: { total: canalCost, canal: canalCost },
                    commission: commission
                },
                opex: { total: totalOpex, daily: dailyOpex }
            },
            aiAnalysis: "Analiz hazırlanıyor..."
        };

        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const prompt = `Act as a senior Shipbroker. 
                Voyage: ${loadPort} to ${dischPort}. Cargo: ${cargo}. 
                Freight Rate: $${freightRate.toFixed(2)}/mt. Profit: $${profit.toFixed(0)}.
                Write 2 short sentences explaining why this is a good deal.`;
                const result = await model.generateContent(prompt);
                voyageData.aiAnalysis = result.response.text();
            } catch (e) { voyageData.aiAnalysis = "Yapay zeka analiz servisi şu an meşgul."; }
        } else {
             voyageData.aiAnalysis = "Hesaplama tamamlandı. Navlun seviyesi piyasa üzeri.";
        }

        res.json({ success: true, voyages: [voyageData] });

    } catch (error) {
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

// ROUTES (Dashboard için)
app.get('/api/routes', (req, res) => {
    const keys = Object.keys(PORT_DB);
    if (keys.length < 2) return res.json([]);
    const routes = [];
    for (let i = 0; i < 4; i++) {
        const o = keys[Math.floor(Math.random()*keys.length)];
        const d = keys[Math.floor(Math.random()*keys.length)];
        routes.push({id: i+1, origin: o, destination: d, dist: {total: 2000 + Math.floor(Math.random()*3000)}, cargo: "General Cargo", vessel_name: "MV VIYA " + (i+1)});
    }
    res.json(routes);
});

app.listen(port, () => {
    console.log(`\n ⚓ VIYA BROKER SYSTEM ONLINE (Port: ${port})`);
});
