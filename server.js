// server.js
// VIYA BROKER - CORE SYSTEM (MULTI-MODEL AI ENGINE)

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// Hesaplama modülünü çağırıyoruz
import { calculateFullVoyage, generateAnalysis, getDistance, VESSEL_SPECS } from './utils/calculations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 10000;

// --- GÜVENLİK ---
const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;
let genAI = null;

if (!API_KEY) {
    console.error(" ❌ CRITICAL: API KEY EKSİK! AI ÇALIŞMAZ.");
} else {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log(` ✅ AI ÇEKİRDEĞİ AKTİF. (Key: ...${API_KEY.slice(-4)})`);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- AKILLI MODEL SEÇİCİ (FALLBACK ENGINE) ---
// Reis'in isteği üzerine: Önce en yeniyi dener, olmazsa eskiye düşer.
const tryGenerateContent = async (userMessage) => {
    // DENENECEK MODELLER LİSTESİ (Sırasıyla dener)
    const modelsToTry = [
        "gemini-2.5-flash",      // Reis'in favorisi (Varsa çalışır)
        "gemini-2.0-flash-exp",  // Deneysel yeni sürüm
        "gemini-1.5-flash",      // Hızlı ve güvenli
        "gemini-1.5-pro",        // Daha zeki ama yavaş
        "gemini-pro"             // En eski emektar
    ];

    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(` ⚙️ Deneniyor: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            
            // Basit bir chat başlat
            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: "Sen 'Viya Broker' adında, tecrübeli, biraz sert mizaçlı ama yardımsever bir Gemi Brokerisin (Kaptan/Reis). Denizcilik terimleri kullan. Kısa ve net cevap ver." }],
                    },
                    {
                        role: "model",
                        parts: [{ text: "Anlaşıldı Reis. Rotayı çizdik, makineler tam yol ileri. Sorunu bekliyorum." }],
                    },
                ],
            });

            const result = await chat.sendMessage(userMessage);
            const response = await result.response;
            const text = response.text();
            
            console.log(` ✅ BAŞARILI: ${modelName} cevap verdi.`);
            return { reply: text, model: modelName }; // Hangi modelin çalıştığını da dönüyoruz

        } catch (error) {
            console.warn(` ⚠️ ${modelName} başarısız oldu. Sıradakine geçiliyor...`);
            lastError = error;
            // Döngü devam eder, bir sonraki modeli dener
        }
    }

    // Hiçbiri çalışmazsa
    throw new Error("Bütün modeller denendi, hepsi hata verdi Reis. API Key'i veya kotayı kontrol et.");
};

// --- DATA LOADERS ---
const loadJSON = (file) => {
    try { 
        const filePath = path.join(__dirname, 'data', file);
        if (!fs.existsSync(filePath)) return [];
        return JSON.parse(fs.readFileSync(filePath)); 
    } catch (e) { return []; }
};

const PORT_DB_RAW = loadJSON('ports.json');
let PORT_DB = {};

if (!Array.isArray(PORT_DB_RAW)) {
    for (const [key, val] of Object.entries(PORT_DB_RAW)) {
        if(val && val.length === 2) PORT_DB[key.toUpperCase()] = { lat: parseFloat(val[1]), lng: parseFloat(val[0]) };
    }
} else {
    PORT_DB_RAW.forEach(p => {
         if(p.name && p.coordinates) PORT_DB[p.name.toUpperCase()] = { lat: p.coordinates[1], lng: p.coordinates[0] };
    });
}
// Fallback Portlar
if (Object.keys(PORT_DB).length === 0) {
    PORT_DB = { "ISTANBUL": { lat: 41.0082, lng: 28.9784 }, "SINGAPORE": { lat: 1.3521, lng: 103.8198 } };
}

// --- ENDPOINTS ---

// 1. DASHBOARD ROTALARI (Undefined düzeltmesi dahil)
app.get('/api/routes', (req, res) => {
    const ports = Object.keys(PORT_DB);
    const routes = [];
    const cargoes = ["Steel Coils", "Heavy Grain", "Scrap", "Iron Ore", "Fertilizer"];

    for (let i = 0; i < 6; i++) {
        const origin = ports[Math.floor(Math.random() * ports.length)];
        let destination = ports[Math.floor(Math.random() * ports.length)];
        while(origin === destination) destination = ports[Math.floor(Math.random() * ports.length)];

        let dist = 3000;
        try {
            if (getDistance) dist = Math.floor(getDistance(PORT_DB[origin].lat, PORT_DB[origin].lng, PORT_DB[destination].lat, PORT_DB[destination].lng));
        } catch(e) {}

        routes.push({
            id: i + 1,
            origin: origin,
            destination: destination,
            date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
            distance: dist,
            price: Math.floor(dist * (Math.random() * 10 + 15)),
            cargo: cargoes[Math.floor(Math.random() * cargoes.length)],
            vessel_name: "MV VIYA " + (i + 1)
        });
    }
    res.json(routes);
});

// 2. AI CHAT (ÇOKLU MOTOR SİSTEMİ ENTEGRE)
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    if (!genAI) return res.json({ reply: "Sistem Hatası: API Anahtarı yok." });

    try {
        // Yukarıdaki akıllı fonksiyonu çağır
        const result = await tryGenerateContent(message);
        // Cevabın sonuna hangi modelin cevap verdiğini ufakça ekleyelim (Reis görsün 2.5 mu 1.5 mu)
        const finalReply = result.reply + `\n\n*(Motor: ${result.model})*`;
        res.json({ reply: finalReply });

    } catch (error) {
        console.error("AI Error:", error);
        res.json({ reply: "Telsiz tamamen sustu Reis. Hiçbir model cevap vermiyor." });
    }
});

// 3. ANALİZ & HARİTA DETAYLARI
app.post('/api/analyze', async (req, res) => {
    const { shipLat, shipLng, vType, cargoQty, loadRate, dischRate } = req.body;
    const allPorts = Object.keys(PORT_DB);
    const validPorts = allPorts.filter(p => PORT_DB[p] && PORT_DB[p].lat);

    const suggestions = [];
    // 5 tane rastgele rota dene
    for(let i=0; i<5; i++) {
        const load = validPorts[Math.floor(Math.random() * validPorts.length)];
        const disch = validPorts[Math.floor(Math.random() * validPorts.length)];
        
        if(load === disch) continue;

        const specs = VESSEL_SPECS[vType] || VESSEL_SPECS["SUPRAMAX"];
        const marketData = { vlsfo: 620, mgo: 900, portDuesFactor: 1.25 };

        // Calculation fonksiyonu zaten Balast, Yüklü ve Toplam mesafeyi hesaplıyor
        const calc = calculateFullVoyage(
            shipLat, shipLng, 
            load, PORT_DB[load], 
            disch, PORT_DB[disch], 
            specs, marketData, 
            specs.default_speed, 
            cargoQty, loadRate, dischRate
        );

        if(calc) suggestions.push(calc);
    }
    
    suggestions.sort((a, b) => b.financials.tce - a.financials.tce);
    res.json({ success: true, voyages: suggestions });
});

app.get('/api/market', (req, res) => {
    res.json({ brent: 75.5, mgo: 850, vlsfo: 650, source: "SIMULATED" });
});

app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));

app.get('/api/port-coords', (req, res) => {
    const pName = req.query.port?.toUpperCase();
    res.json(PORT_DB[pName] || {});
});

app.listen(port, () => {
    console.log(` 🚀 Server port ${port} üzerinde hazır.`);
});
