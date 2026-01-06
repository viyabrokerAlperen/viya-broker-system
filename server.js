// server.js
// VIYA BROKER - FINAL STABLE EDITION (V8.0)
// Fix: JSON Object Parsing for specific ports.json structure

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
// 1. DATA LOADERS (DOSYA OKUMA)
// ==========================================

const loadRawJSON = (filename) => {
    try {
        // Render root dizininden 'data' klasörüne git
        const filePath = path.join(process.cwd(), 'data', filename);
        
        console.log(` 📂 Dosya aranıyor: ${filePath}`);

        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(rawData);
            console.log(` ✅ ${filename} başarıyla okundu.`);
            return data;
        } else {
            console.error(` ❌ HATA: ${filePath} bulunamadı!`);
            return null;
        }
    } catch (e) { 
        console.error(` ❌ JSON Okuma Hatası (${filename}):`, e.message);
        return null;
    }
};

// ==========================================
// 2. PORT DB (SENİN VERİNİ İŞLEME)
// ==========================================

let PORT_DB = {};

// 1. Önce senin gerçek dosyanı yüklemeyi dene
const rawPorts = loadRawJSON('ports.json');

if (rawPorts && typeof rawPorts === 'object') {
    // SENİN JSON FORMATIN: { "shanghai": [121.47, 31.23], ... }
    // Bu bir Array değil, Object. O yüzden Object.entries ile dönüyoruz.
    
    Object.entries(rawPorts).forEach(([name, coords]) => {
        if (Array.isArray(coords) && coords.length === 2) {
            // Veri Formatın: [Longitude, Latitude] -> [Boylam, Enlem]
            const cleanName = name.toUpperCase()
                .replace(/İ/g, "I").replace(/Ğ/g, "G").replace(/Ü/g, "U")
                .replace(/Ş/g, "S").replace(/Ö/g, "O").replace(/Ç/g, "C")
                .trim();
            
            PORT_DB[cleanName] = { 
                lat: coords[1], // 2. eleman Enlem (Latitude)
                lng: coords[0]  // 1. eleman Boylam (Longitude)
            };
        }
    });
    console.log(` ⚓ Liman Veritabanı Hazır: ${Object.keys(PORT_DB).length} liman yüklendi (Github Dosyasından).`);

} else {
    // Dosya yoksa veya bozuksa acil durum verileri (Hardcoded)
    console.error(" ⚠️ DİKKAT: ports.json okunamadı veya formatı hatalı. Yedek liste devrede.");
    
    // Fallback listesini buraya gömüyoruz ki sistem çökmesin
    const FALLBACK_PORTS = [
        {name: "ISTANBUL", coordinates: [28.9784, 41.0082]},
        {name: "ROTTERDAM", coordinates: [4.47917, 51.9225]},
        {name: "SINGAPORE", coordinates: [103.8198, 1.3521]},
        {name: "SHANGHAI", coordinates: [121.4737, 31.2304]}
    ];
    FALLBACK_PORTS.forEach(p => {
        PORT_DB[p.name] = { lat: p.coordinates[1], lng: p.coordinates[0] };
    });
}

// ==========================================
// 3. ENDPOINTS
// ==========================================

// Liman Listesi
app.get('/api/ports', (req, res) => {
    const ports = Object.keys(PORT_DB).sort();
    res.json(ports);
});

// Koordinat Çekme
app.get('/api/port-coords', (req, res) => {
    let pName = req.query.port?.toUpperCase();
    if (pName) {
        // Frontend'den gelen isteği temizle
        pName = pName.replace(/İ/g, "I").replace(/Ğ/g, "G").replace(/Ü/g, "U")
                     .replace(/Ş/g, "S").replace(/Ö/g, "O").replace(/Ç/g, "C")
                     .trim();
    }
    
    const coords = PORT_DB[pName];
    
    if (coords) {
        res.json(coords);
    } else {
        // Bulunamazsa boş dön
        res.json({});
    }
});

// Market (Piyasa)
app.get('/api/market', async (req, res) => {
    try {
        const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d');
        const data = await response.json();
        const brentPrice = data.chart.result[0].meta.regularMarketPrice;
        res.json({
            brent: brentPrice,
            mgo: Math.round(brentPrice * 11.8),
            vlsfo: Math.round(brentPrice * 11.8 * 0.75),
            bdi: 1450 + Math.floor(Math.random() * 50 - 25), 
            source: "LIVE"
        });
    } catch (error) {
        res.json({ brent: 75.00, mgo: 880, vlsfo: 620, bdi: 1450, source: "ESTIMATED" });
    }
});

// Regulations & Documents (Hardcoded Fallback - Silinmez)
const FALLBACK_DOCS = [ { category: "Charter Parties", items: [ { title: "GENCON 94", desc: "Standard Voyage Charter Party" }, { title: "NYPE 2015", desc: "Time Charter Party" } ] } ];
const FALLBACK_REGS = [ { code: "SOLAS", title: "Safety of Life at Sea", summary: "Key safety standards." }, { code: "MARPOL", title: "Marine Pollution", summary: "Pollution prevention annexes." } ];

app.get('/api/documents', (req, res) => res.json(FALLBACK_DOCS));
app.get('/api/regulations', (req, res) => res.json(FALLBACK_REGS));

// Haberler
app.get('/api/news', async (req, res) => {
    const today = new Date().toLocaleDateString('tr-TR');
    res.json([
        { id: 1, title: "Küresel Konteyner Endeksi Yükselişte", source: "Viya Market", date: today },
        { id: 2, title: "Panama Kanalı Geçiş Kısıtlamaları Gevşetildi", source: "Maritime News", date: today },
        { id: 3, title: "Çin Limanlarında Yoğunluk Artıyor", source: "Port Intel", date: today }
    ]);
});

// ==========================================
// 4. AI CHATBOT
// ==========================================
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    if(!genAI) return res.json({ reply: "Sistem: API Anahtarı eksik." });

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "Sen Viya Broker'sın. Profesyonel denizcilik, hukuk ve brokerlik uzmanısın. Kısa, net, ticari dilde konuş." }],
                },
                {
                    role: "model",
                    parts: [{ text: "Anlaşıldı. Profesyonel brokerlik hizmetine hazırım." }],
                },
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        res.json({ reply: response.text() });

    } catch(e) {
        console.error("AI Error:", e);
        res.json({ reply: "Sistem: Yapay zeka şu an meşgul. Lütfen tekrar deneyin." });
    }
});

app.listen(port, () => {
    console.log(`\n ⚓ VIYA BROKER SYSTEM ONLINE (Port: ${port})`);
});
