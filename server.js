// server.js
// VIYA BROKER - PLATINUM EDITION (V16.0 - MongoDB Atlas Integration)
// Status: DATABASE CONNECTED - PERSISTENT DATA STORAGE

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose'; // YENİ: Veritabanı Sürücüsü

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 10000;

// GÜVENLİK VE BAĞLANTI AYARLARI
const SECRET_KEY = process.env.JWT_SECRET || "VIYA_SUPER_SECRET_KEY_2026";
const MONGO_URI = process.env.MONGO_URI; // Render'dan gelecek bağlantı adresi

// --- MONGODB BAĞLANTISI ---
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log(" ✅ [SYSTEM] DATABASE: CONNECTED (MongoDB Atlas)"))
        .catch(err => console.error(" ❌ [SYSTEM] DATABASE ERROR:", err));
} else {
    console.warn(" ⚠️ [SYSTEM] MONGO_URI eksik! Veritabanı çalışmayacak.");
}

// --- MONGODB USER ŞEMASI ---
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, default: "Captain" },
    role: { type: String, default: "user" },
    plan: { type: String, default: "FREE" },
    createdAt: { type: Date, default: Date.now },
    kvkkAccepted: { type: Boolean, default: false }
});
const User = mongoose.model('User', userSchema);

// AI SETUP
const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
let genAI = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log(" ✅ [SYSTEM] AI Engine: ONLINE");
}

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 1. DATA LOADERS (STATİK VERİLER HALA DOSYADA)
// ==========================================
// Limanlar, gemiler ve dokümanlar çok değişmediği için JSON'da kalabilir.
// Sadece Üyeleri veritabanına taşıdık.

const loadRawJSON = (filename) => {
    try {
        const filePath = path.join(process.cwd(), 'data', filename);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
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
    return name.toUpperCase().replace(/İ/g, "I").replace(/Ğ/g, "G").replace(/Ü/g, "U").replace(/Ş/g, "S").replace(/Ö/g, "O").replace(/Ç/g, "C").trim();
};

if (Object.keys(PORT_DB_RAW).length > 0) {
    Object.entries(PORT_DB_RAW).forEach(([name, coords]) => {
        if (Array.isArray(coords) && coords.length === 2) {
            PORT_DB[cleanPortName(name)] = { lat: coords[1], lng: coords[0] };
        }
    });
} else {
    // Fallback Ports
    PORT_DB["ISTANBUL"] = {lat: 41.0082, lng: 28.9784};
    PORT_DB["SHANGHAI"] = {lat: 31.2304, lng: 121.4737};
    PORT_DB["ROTTERDAM"] = {lat: 51.9225, lng: 4.47917};
}

const MARKET_RATES = {
    "Grain": { base: 32, volatility: 5 },
    "Coal": { base: 24, volatility: 4 },
    "Iron Ore": { base: 21, volatility: 3 },
    "Steel Products": { base: 45, volatility: 8 },
    "Fertilizer": { base: 28, volatility: 4 },
    "General Cargo": { base: 38, volatility: 6 }
};

// ==========================================
// 2. AUTH & KVKK ENDPOINTS (MONGODB POWERED)
// ==========================================

app.get('/api/kvkk', (req, res) => {
    res.json({
        title: "Kişisel Verilerin Korunması ve Gizlilik Politikası",
        content: "VIYA BROKER KVKK AYDINLATMA METNİ\n\n1. Veri Sorumlusu: Viya Broker Platformu.\n2. İşlenen Veriler: E-posta adresi, Ad-Soyad (opsiyonel), IP adresi ve Log kayıtları.\n3. İşleme Amacı: Üyelik işlemlerinin yapılması, güvenli giriş sağlanması ve yasal yükümlülüklerin ifası.\n4. Aktarım: Verileriniz yasal zorunluluklar dışında üçüncü kişilerle paylaşılmaz.\n5. Haklarınız: KVKK m.11 uyarınca verilerinizin silinmesini talep edebilirsiniz.\n\nBu kutuyu işaretleyerek verilerinizin işlenmesini kabul etmiş sayılırsınız."
    });
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, fullName, kvkkAccepted } = req.body;
        
        if (!kvkkAccepted) return res.status(400).json({ error: "KVKK onayı zorunludur." });
        if (!email || !password) return res.status(400).json({ error: "E-posta ve şifre giriniz." });

        // MongoDB Kontrolü
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Bu e-posta zaten kayıtlı." });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Yeni Kullanıcı Oluştur (Veritabanına Kayıt)
        const newUser = await User.create({
            email,
            password: hashedPassword,
            fullName: fullName || "Captain",
            kvkkAccepted: true
        });

        res.json({ success: true, msg: "Kayıt başarılı! Giriş yapın." });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: "Veritabanı hatası." }); 
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Veritabanından Kullanıcıyı Bul
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Kullanıcı bulunamadı." });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Hatalı şifre." });

        const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });
        
        // Şifreyi çıkartıp gönder
        const userData = {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            plan: user.plan
        };
        
        res.json({ success: true, token, user: userData });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: "Giriş hatası." }); 
    }
});

// ==========================================
// 3. VOYAGE ANALYTICS ENGINE
// ==========================================

function checkCanals(loadGeo, dischGeo) {
    let costs = { total: 0, names: [] };
    const isBlackSea = (geo) => geo.lat > 40 && geo.lng > 27 && geo.lng < 42 && geo.lat < 47;
    const isAmericasEast = (geo) => geo.lng < -30 && geo.lng > -100;
    const isAmericasWest = (geo) => geo.lng < -100;

    if ((isBlackSea(loadGeo) && !isBlackSea(dischGeo)) || (!isBlackSea(loadGeo) && isBlackSea(dischGeo))) {
        costs.total += 35000; costs.names.push("Turkish Straits");
    }
    if (loadGeo.lng < 35 && dischGeo.lng > 60 || loadGeo.lng > 60 && dischGeo.lng < 35) {
        if (!isAmericasWest(loadGeo) && !isAmericasWest(dischGeo)) {
            costs.total += 300000; costs.names.push("Suez Canal");
        }
    }
    if ((loadGeo.lng > -80 && dischGeo.lng < -80) || (loadGeo.lng < -80 && dischGeo.lng > -80)) {
        if (isAmericasEast(loadGeo) || isAmericasEast(dischGeo)) {
            costs.total += 250000; costs.names.push("Panama Canal");
        }
    }
    return costs;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 5000;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 0.539957);
}

function findNearestPorts(shipLat, shipLng, limit = 5) {
    const ports = Object.entries(PORT_DB).map(([name, coords]) => {
        return { name, lat: coords.lat, lng: coords.lng, dist: calculateDistance(shipLat, shipLng, coords.lat, coords.lng) };
    });
    ports.sort((a, b) => a.dist - b.dist);
    return ports.slice(0, limit + 1).filter(p => p.dist >= 0); 
}

async function analyzeVoyage(loadPort, dischPort, cargo, quantity, shipLat, shipLng) {
    const cleanLoad = cleanPortName(loadPort);
    const cleanDisch = cleanPortName(dischPort);
    const loadGeo = PORT_DB[cleanLoad];
    const dischGeo = PORT_DB[cleanDisch];
    if (!loadGeo || !dischGeo) return null;

    const ballastDist = calculateDistance(shipLat, shipLng, loadGeo.lat, loadGeo.lng);
    const ladenDist = calculateDistance(loadGeo.lat, loadGeo.lng, dischGeo.lat, dischGeo.lng);
    const totalDist = ballastDist + ladenDist;
    const totalDuration = Math.ceil((totalDist / (13.0 * 24)) + 5);
    const qty = quantity || 50000;

    const canalInfo = checkCanals(loadGeo, dischGeo);
    const totalVoyageCost = (totalDuration * 24 * 640) + 35000 + canalInfo.total;
    const totalCost = totalVoyageCost + (totalDuration * 5500);

    const marketData = MARKET_RATES[cargo] || MARKET_RATES["General Cargo"];
    const simulatedRate = marketData.base + ((Math.random() * marketData.volatility * 2) - marketData.volatility);
    const grossFreight = qty * simulatedRate;
    const commission = grossFreight * 0.0375;
    const profit = grossFreight - commission - totalCost;
    
    let aiText = profit > 0 ? "Strong opportunity." : "Market is tough.";
    
    return {
        params: { loadPort, dischPort, cargo, qty, freightRate: simulatedRate.toFixed(2) },
        dist: { total: totalDist, ballast: ballastDist, laden: ladenDist },
        duration: { total: totalDuration, sea: Math.round(totalDist/(13*24)), port: 5 },
        loadGeo, dischGeo,
        financials: { revenue: grossFreight, profit: profit, tce: (grossFreight - commission - totalVoyageCost) / totalDuration, breakEvenRate: (totalCost / qty) },
        breakdown: {
            revenue: grossFreight,
            voyage_costs: { fuel: { total: totalDuration*24*640, main: totalDuration*24*640*0.9, aux: 0, lubes: 0 }, port: { total: 35000, dues: 0, pilot: 0, tow: 0 }, cargo_canal: { total: canalInfo.total, canal: canalInfo.total, names: canalInfo.names.join('+') }, commission: commission },
            opex: { total: totalDuration*5500, daily: 5500 }
        },
        aiAnalysis: aiText
    };
}

app.post('/api/analyze', async (req, res) => {
    try {
        const { loadPort, dischPort, cargo, quantity, shipLat, shipLng } = req.body;
        if (loadPort && dischPort) {
            const voyage = await analyzeVoyage(loadPort, dischPort, cargo || "General Cargo", quantity, shipLat || 0, shipLng || 0);
            if(voyage && genAI) {
                 try {
                    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                    const r = await model.generateContent(`Act as broker. Voyage: ${loadPort}-${dischPort}. Cargo: ${cargo}. Profit: $${Math.floor(voyage.financials.profit)}. Short comment.`);
                    voyage.aiAnalysis = r.response.text();
                 } catch(e){}
            }
            return res.json(voyage ? { success: true, voyages: [voyage] } : { success: false, error: "Liman hatası" });
        }
        
        const nearestPorts = findNearestPorts(shipLat, shipLng, 5);
        if (nearestPorts.length === 0) return res.json({ success: false, msg: "Uygun liman yok." });

        const suggestions = [];
        const cargoKeys = Object.keys(MARKET_RATES);
        const portKeys = Object.keys(PORT_DB);

        for (const port of nearestPorts) {
            let randomDisch = portKeys[Math.floor(Math.random() * portKeys.length)];
            while (randomDisch === port.name) randomDisch = portKeys[Math.floor(Math.random() * portKeys.length)];
            const randomCargo = cargoKeys[Math.floor(Math.random() * cargoKeys.length)];
            const voyage = await analyzeVoyage(port.name, randomDisch, randomCargo, quantity || 50000, shipLat, shipLng);
            if (voyage) suggestions.push(voyage);
        }
        suggestions.sort((a, b) => b.financials.profit - a.financials.profit);
        res.json({ success: true, voyages: suggestions.slice(0, 3) });

    } catch (error) { res.status(500).json({ error: "Sistem hatası." }); }
});

app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));
app.get('/api/port-coords', (req, res) => res.json(PORT_DB[cleanPortName(req.query.port)] || {}));
app.get('/api/market', (req, res) => res.json({ brent: 82.50, mgo: 960, vlsfo: 670, bdi: 1550, source: "LIVE" }));
app.get('/api/documents', (req, res) => res.json(DOCS_DB));
app.get('/api/regulations', (req, res) => res.json(REGS_DB));
app.get('/api/vessels', (req, res) => res.json(VESSEL_DB));
app.get('/api/routes', (req, res) => res.json([]));
// ... (Önceki kodlar aynı) ...

app.post('/api/chat', async (req, res) => {
    try {
        if(!genAI) return res.json({ reply: "Sistem: AI Motoru Devre Dışı (API Key Yok)." });
        
        const { message } = req.body;
        // Dili UI'dan almak yerine, AI'ın kullanıcının yazdığı dili algılamasına izin veriyoruz.

        // --- VIYA AI: GLOBAL BROKER MODE ---
        const systemPrompt = `
        IDENTITY: You are VIYA AI, an advanced maritime artificial intelligence created specifically for the 'Viya Broker' platform.
        ROLE: You are a Professional Shipbroker and Maritime Legal Consultant.
        
        YOUR KNOWLEDGE BASE:
        1. Expert in Chartering (Voyage, Time), Laytime, Demurrage, and Despatch.
        2. Expert in maritime regulations (SOLAS, MARPOL) and contracts (GENCON, NYPE).
        3. You speak with a FORMAL, CORPORATE, and PROFESSIONAL tone.
        
        RULES:
        1. NEVER say you are a Google AI. You are VIYA AI.
        2. If asked "Who are you?", answer: "I am VIYA AI, your professional maritime intelligence assistant." (Translate this to the target language).
        3. DO NOT use colloquial terms like 'Reis', 'Kaptan', 'Bro'. 
        4. Address the user formally based on the language (e.g., 'Sir/Madam' for English, 'Efendim' or 'Sayın Kullanıcı' for Turkish, 'Monsieur/Madame' for French).
        5. Keep answers precise, objective, and business-oriented.

        CRITICAL LANGUAGE PROTOCOL:
        1. DETECT the language of the USER MESSAGE below.
        2. RESPOND STRICTLY IN THE SAME LANGUAGE as the User Message.
        3. If the user asks "Can you speak Turkish?", reply IN TURKISH.
        4. Do not limit yourself to English. You are fluent in all major languages (TR, EN, DE, FR, ES, IT, GR).

        USER MESSAGE: "${message}"
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(systemPrompt);
        
        res.json({ reply: result.response.text() });

    } catch(e) { 
        console.error(e);
        res.json({ reply: "Connection Error. Please try again." }); 
    }
});

// ... (app.listen kısmı aynı) ...

app.listen(port, () => {
    console.log(`\n ⚓ VIYA BROKER SYSTEM ONLINE (Port: ${port})`);
});


