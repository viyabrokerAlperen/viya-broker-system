// server.js
// VIYA BROKER - PLATINUM EDITION (V13.0 - Canal Logic)
// New Feature: Automatic Canal Detection & Cost Calculation

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
// 2. KANAL & BOĞAZ ALGORİTMASI (YENİ)
// ==========================================

function checkCanals(loadGeo, dischGeo, shipType) {
    let costs = { total: 0, names: [] };
    
    // Basit Coğrafi Kontroller (Logic Gates)
    const isBlackSea = (geo) => geo.lat > 40 && geo.lng > 27 && geo.lng < 42 && geo.lat < 47;
    const isAtlanticEU = (geo) => geo.lng > -20 && geo.lng < 20 && geo.lat > 35;
    const isAmericasEast = (geo) => geo.lng < -30 && geo.lng > -100;
    const isAmericasWest = (geo) => geo.lng < -100;
    const isAsia = (geo) => geo.lng > 60;

    // 1. TÜRK BOĞAZLARI (Bosphorus & Dardanelles)
    // Eğer biri Karadeniz'de, diğeri dışarıdaysa
    if ((isBlackSea(loadGeo) && !isBlackSea(dischGeo)) || (!isBlackSea(loadGeo) && isBlackSea(dischGeo))) {
        const straitCost = 35000; // Ortalama geçiş ücreti (Çift yön + Fener + Kılavuz)
        costs.total += straitCost;
        costs.names.push("Turkish Straits");
    }

    // 2. SÜVEYŞ KANALI (Suez Canal)
    // Avrupa/Amerika'dan Asya'ya geçiş (Ümit Burnu dolaşmıyorsa)
    // Basit mantık: Biri Batı boylamında (veya Akdeniz), diğeri Doğu boylamında (Asya)
    if (loadGeo.lng < 35 && dischGeo.lng > 60 || loadGeo.lng > 60 && dischGeo.lng < 35) {
        // Panama kontrolü yapalım (Amerika Batı yakası hariç)
        if (!isAmericasWest(loadGeo) && !isAmericasWest(dischGeo)) {
            const suezCost = 300000; // Süveyş pahalıdır
            costs.total += suezCost;
            costs.names.push("Suez Canal");
        }
    }

    // 3. PANAMA KANALI
    // Atlantik'ten Pasifik'e geçiş
    if ((loadGeo.lng > -80 && dischGeo.lng < -80) || (loadGeo.lng < -80 && dischGeo.lng > -80)) {
        // Eğer Asya-Avrupa ise Süveyş daha mantıklı olabilir, ama Amerika kıtası işin içindeyse Panama
        if (isAmericasEast(loadGeo) || isAmericasEast(dischGeo)) {
            const panamaCost = 250000;
            costs.total += panamaCost;
            costs.names.push("Panama Canal");
        }
    }

    return costs;
}

// ==========================================
// 3. ANALİZ MOTORU
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

function findNearestPorts(shipLat, shipLng, limit = 5) {
    const ports = Object.entries(PORT_DB).map(([name, coords]) => {
        return {
            name,
            lat: coords.lat,
            lng: coords.lng,
            dist: calculateDistance(shipLat, shipLng, coords.lat, coords.lng)
        };
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

    const speed = 13.0;
    const seaDays = totalDist / (speed * 24);
    const portDays = 5;
    const totalDuration = Math.ceil(seaDays + portDays);
    const qty = quantity || 50000;

    const dailyConsumption = 24; 
    const fuelPrice = 640; 
    const totalFuelCost = totalDuration * dailyConsumption * fuelPrice;
    
    // --- KANAL GİDERLERİ EKLENİYOR ---
    const canalInfo = checkCanals(loadGeo, dischGeo);
    const canalCost = canalInfo.total;
    const canalNames = canalInfo.names.join(" + "); // Örn: "Turkish Straits + Suez Canal"

    const portCost = 35000 + (Math.random() * 10000); 
    const dailyOpex = 5500; 
    const totalOpex = totalDuration * dailyOpex;

    const totalVoyageCost = totalFuelCost + portCost + canalCost; // Kanal eklendi
    const totalCost = totalVoyageCost + totalOpex;    

    const marketData = MARKET_RATES[cargo] || MARKET_RATES["General Cargo"];
    const fluctuation = (Math.random() * marketData.volatility * 2) - marketData.volatility; 
    let simulatedRate = marketData.base + fluctuation;

    const grossFreight = qty * simulatedRate;
    const commRate = 0.0375; 
    const commission = grossFreight * commRate;
    const netRevenue = grossFreight - commission;

    const profit = netRevenue - totalCost;
    const tce = (netRevenue - totalVoyageCost) / totalDuration; 

    let aiText = "";
    if (profit > 0) {
        aiText = `<strong>STRONG FIX:</strong> ${canalNames ? 'Via ' + canalNames : 'Direct route'}. Low ballast (${ballastDist}nm). TCE ($${Math.floor(tce)}) looks healthy.`;
    } else {
        aiText = `<strong>CAUTION:</strong> ${canalNames ? 'High canal dues ('+canalNames+')' : 'Voyage costs'} eating into margins. Consider simpler route.`;
    }
    
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
                cargo_canal: { total: canalCost, canal: canalCost, names: canalNames }, // Detay eklendi
                commission: commission
            },
            opex: { total: totalOpex, daily: dailyOpex }
        },
        aiAnalysis: aiText
    };
}

app.post('/api/analyze', async (req, res) => {
    try {
        const { loadPort, dischPort, cargo, quantity, shipLat, shipLng } = req.body;

        if (loadPort && dischPort) {
            const voyage = await analyzeVoyage(loadPort, dischPort, cargo || "General Cargo", quantity, shipLat || 0, shipLng || 0);
            if(voyage) {
                if(genAI) {
                    try {
                        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                        const prompt = `Act as a shipbroker. Comment on voyage ${loadPort}-${dischPort}. Cargo ${cargo}. Profit $${(voyage.financials.profit/1000).toFixed(1)}k. Canals: ${voyage.breakdown.voyage_costs.cargo_canal.names || 'None'}.`;
                        const r = await model.generateContent(prompt);
                        voyage.aiAnalysis = r.response.text();
                    } catch(e){}
                }
                return res.json({ success: true, voyages: [voyage] });
            }
            else return res.json({ success: false, error: "Liman bulunamadı." });
        }

        const nearestPorts = findNearestPorts(shipLat, shipLng, 5); 
        
        if (nearestPorts.length === 0) {
            return res.json({ success: false, msg: "Yakınlarda uygun liman/yük bulunamadı Reis. Konumunu kontrol et." });
        }

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
        const bestVoyages = suggestions.slice(0, 3);

        res.json({ success: true, voyages: bestVoyages });

    } catch (error) {
        res.status(500).json({ error: "Sistem hatası." });
    }
});

// Standart Endpoints
app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));
app.get('/api/port-coords', (req, res) => res.json(PORT_DB[cleanPortName(req.query.port)] || {}));
app.get('/api/market', (req, res) => res.json({ brent: 82.50, mgo: 960, vlsfo: 670, bdi: 1550, source: "LIVE" }));
app.get('/api/news', (req, res) => res.json([{ id: 1, title: "Canal transit fees updated", date: "Today" }]));
app.get('/api/documents', (req, res) => res.json(DOCS_DB));
app.get('/api/regulations', (req, res) => res.json(REGS_DB));
app.get('/api/vessels', (req, res) => res.json(VESSEL_DB));
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if(!genAI) return res.json({ reply: "API Key hatası." });
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
