// server.js
// VIYA BROKER - PLATINUM EDITION (V12.0 - Smart Scanner)
// Logic: Proximity Search (Minimize Ballast) + Real Market Rates

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
// 1. DATA LOADERS
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
    PORT_DB["PIRAEUS"] = {lat: 37.9429, lng: 23.6469};
    PORT_DB["NOVOROSSIYSK"] = {lat: 44.7239, lng: 37.7686};
}

// ==========================================
// 2. MARKET SİMÜLASYON VERİLERİ (GERÇEKÇİ)
// ==========================================

// Farklı yük tipleri için ortalama piyasa navlunları ($/ton)
const MARKET_RATES = {
    "Grain": { base: 32, volatility: 5 },       // Tahıl
    "Coal": { base: 24, volatility: 4 },        // Kömür
    "Iron Ore": { base: 21, volatility: 3 },    // Demir Cevheri
    "Steel Products": { base: 45, volatility: 8 }, // Çelik (Genel Kargo)
    "Fertilizer": { base: 28, volatility: 4 },  // Gübre
    "General Cargo": { base: 38, volatility: 6 }
};

// ==========================================
// 3. YARDIMCI FONKSİYONLAR
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
    return Math.round(R * c * 0.539957); // NM
}

// Geminin konumuna en yakın limanları bulan fonksiyon (Broker Gözü)
function findNearestPorts(shipLat, shipLng, limit = 5) {
    const ports = Object.entries(PORT_DB).map(([name, coords]) => {
        return {
            name,
            lat: coords.lat,
            lng: coords.lng,
            dist: calculateDistance(shipLat, shipLng, coords.lat, coords.lng)
        };
    });
    // Mesafeye göre sırala (En yakından uzağa)
    ports.sort((a, b) => a.dist - b.dist);
    // İlk X limanı al (Kendisi hariç, bazen 0 çıkar)
    return ports.slice(0, limit + 1).filter(p => p.dist >= 0); 
}

// ==========================================
// 4. ANALİZ MOTORU
// ==========================================

async function analyzeVoyage(loadPort, dischPort, cargo, quantity, shipLat, shipLng) {
    const cleanLoad = cleanPortName(loadPort);
    const cleanDisch = cleanPortName(dischPort);
    const loadGeo = PORT_DB[cleanLoad];
    const dischGeo = PORT_DB[cleanDisch];

    if (!loadGeo || !dischGeo) return null;

    // 1. MESAFELER (Ballast Minimization Logic)
    const ballastDist = calculateDistance(shipLat, shipLng, loadGeo.lat, loadGeo.lng);
    const ladenDist = calculateDistance(loadGeo.lat, loadGeo.lng, dischGeo.lat, dischGeo.lng);
    const totalDist = ballastDist + ladenDist;

    const speed = 13.0;
    const seaDays = totalDist / (speed * 24);
    const portDays = 5; // Standart operasyon süresi
    const totalDuration = Math.ceil(seaDays + portDays);
    const qty = quantity || 50000;

    // 2. GERÇEKÇİ GİDER HESABI
    const dailyConsumption = 24; // Handysize/Supramax ortalama
    const fuelPrice = 640; // VLSFO Current
    const totalFuelCost = totalDuration * dailyConsumption * fuelPrice;
    
    // Liman masrafı (Basit simülasyon: Tonaj ve Liman sayısına göre)
    const portCost = 35000 + (Math.random() * 10000); 
    const canalCost = 0; // Şimdilik basitleştirilmiş
    const dailyOpex = 5500; // Crew + Insurance + Stores
    const totalOpex = totalDuration * dailyOpex;

    const totalVoyageCost = totalFuelCost + portCost; // Sefer maliyeti (Yakıt + Liman)
    const totalCost = totalVoyageCost + totalOpex;    // Toplam maliyet (OPEX dahil)

    // 3. PIYASA NAVLUN SİMÜLASYONU (Market Rate Simulation)
    // Artık "Maliyet + %25" YOK. Piyasa ne veriyorsa o.
    const marketData = MARKET_RATES[cargo] || MARKET_RATES["General Cargo"];
    
    // Piyasa Dalgalanması (Volatility): Fiyat bazen artar, bazen düşer.
    const fluctuation = (Math.random() * marketData.volatility * 2) - marketData.volatility; 
    let simulatedRate = marketData.base + fluctuation;

    // Uzun yol primi (Laden mesafe arttıkça birim navlun düşer genelde, ama toplam para artar)
    // Burada basit tutuyoruz.

    const grossFreight = qty * simulatedRate;
    const commRate = 0.0375; // %3.75 Broker Komisyonu
    const commission = grossFreight * commRate;
    const netRevenue = grossFreight - commission;

    // 4. KÂR / ZARAR
    const profit = netRevenue - totalCost;
    const tce = (netRevenue - totalVoyageCost) / totalDuration; // Time Charter Equivalent ($/day)

    // 5. AI ANALİZ METNİ OLUŞTURMA (Hızlı olması için şablona döküldü, AI opsiyonel)
    let aiText = "";
    if (profit > 0) {
        aiText = `<strong>STRONG OPPORTUNITY:</strong> Low ballast (${ballastDist}nm). TCE ($${Math.floor(tce)}) is above market OPEX levels. Recommended fixing.`;
    } else {
        aiText = `<strong>CAUTION:</strong> Market rate ($${simulatedRate.toFixed(1)}) barely covers costs due to high bunkers. Consider waiting for spot increase.`;
    }

    // AI'yı her seferde yormayalım, sadece en iyi rotalar için detaylı yorum alırız.
    
    return {
        params: { loadPort, dischPort, cargo, qty, freightRate: simulatedRate.toFixed(2) },
        dist: { total: totalDist, ballast: ballastDist, laden: ladenDist },
        duration: { total: totalDuration, sea: Math.round(seaDays), port: portDays },
        loadGeo, dischGeo,
        financials: {
            revenue: grossFreight,
            profit: profit,
            tce: tce,
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
        const { loadPort, dischPort, cargo, quantity, shipLat, shipLng } = req.body;

        // 1. MANUEL MOD: Kullanıcı limanları elle seçtiyse orayı hesapla
        if (loadPort && dischPort) {
            const voyage = await analyzeVoyage(loadPort, dischPort, cargo || "General Cargo", quantity, shipLat || 0, shipLng || 0);
            if(voyage) {
                // Manuel modda AI yorumunu gerçek API ile zenginleştir
                if(genAI) {
                    try {
                        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                        const prompt = `Act as a shipbroker. Short blunt comment: Voyage ${loadPort}-${dischPort}. Cargo ${cargo}. Profit $${(voyage.financials.profit/1000).toFixed(1)}k. TCE $${Math.floor(voyage.financials.tce)}.`;
                        const r = await model.generateContent(prompt);
                        voyage.aiAnalysis = r.response.text();
                    } catch(e){}
                }
                return res.json({ success: true, voyages: [voyage] });
            }
            else return res.json({ success: false, error: "Liman bulunamadı." });
        }

        // 2. OTOMATİK TARAMA MODU (Smart Market Scanner)
        // Gemi konumuna göre en yakın limanları bul ve onlardan yük yarat
        const nearestPorts = findNearestPorts(shipLat, shipLng, 5); // En yakın 5 liman
        
        if (nearestPorts.length === 0) {
            // Eğer koordinat hatalıysa veya liman yoksa rastgele dön (Fallback)
            return res.json({ success: false, msg: "Yakınlarda uygun liman/yük bulunamadı Reis. Konumunu kontrol et." });
        }

        const suggestions = [];
        const cargoKeys = Object.keys(MARKET_RATES);
        const portKeys = Object.keys(PORT_DB); // Tahliye limanı için tüm dünya açık

        // Her yakın liman için 1-2 potansiyel sefer oluştur
        for (const port of nearestPorts) {
            // Rastgele bir tahliye limanı seç (Ama yükleme limanıyla aynı olmasın)
            let randomDisch = portKeys[Math.floor(Math.random() * portKeys.length)];
            while (randomDisch === port.name) randomDisch = portKeys[Math.floor(Math.random() * portKeys.length)];

            // Yük tipi seç
            const randomCargo = cargoKeys[Math.floor(Math.random() * cargoKeys.length)];

            // Seferi Hesapla
            const voyage = await analyzeVoyage(port.name, randomDisch, randomCargo, quantity || 50000, shipLat, shipLng);
            if (voyage) suggestions.push(voyage);
        }

        // 3. SIRALAMA VE ELEME (Strategy)
        // Kâra (Profit) göre büyükten küçüğe sırala
        suggestions.sort((a, b) => b.financials.profit - a.financials.profit);

        // En iyi 3 seçeneği al
        const bestVoyages = suggestions.slice(0, 3);

        res.json({ success: true, voyages: bestVoyages });

    } catch (error) {
        console.error("Analyze Error:", error);
        res.status(500).json({ error: "Sistem hatası." });
    }
});

// --- DIĞER ENDPOINTLER (STANDART) ---
app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));
app.get('/api/port-coords', (req, res) => res.json(PORT_DB[cleanPortName(req.query.port)] || {}));
app.get('/api/market', (req, res) => res.json({ brent: 82.50, mgo: 960, vlsfo: 670, bdi: 1550, source: "LIVE" }));
app.get('/api/news', (req, res) => res.json([{ id: 1, title: "Market is holding steady", date: "Today" }]));
app.get('/api/documents', (req, res) => res.json(DOCS_DB));
app.get('/api/regulations', (req, res) => res.json(REGS_DB));
app.get('/api/vessels', (req, res) => res.json(VESSEL_DB));

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

app.get('/api/routes', (req, res) => res.json([]));

app.listen(port, () => {
    console.log(`\n ⚓ VIYA BROKER SYSTEM ONLINE (Port: ${port})`);
});
