import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

dotenv.config();

// Dosya yolu ayarları (ES Module için)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 10000;

// --- API GÜVENLİK ---
const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
let genAI = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log(" ✅ [SYSTEM] AI Engine: ONLINE (Model: Gemini 2.5 Flash)");
} else {
    console.error(" ❌ [SYSTEM] AI Engine: OFFLINE (API Key Eksik!)");
}

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- DATA LOADERS (500+ Liman İçin) ---
const loadJSON = (filename) => {
    try {
        // Render'da dosya yolu genellikle kök dizindeki data klasörüdür
        const filePath = path.join(__dirname, 'data', filename);
        
        console.log(` 📂 Dosya aranıyor: ${filePath}`); // LOG EKLENDİ

        if (!fs.existsSync(filePath)) {
            console.error(` ❌ HATA: ${filename} dosyası bulunamadı! Lütfen GitHub'a 'data' klasörünü yüklediğinden emin ol.`);
            return [];
        }

        const rawData = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(rawData);
        
        console.log(` ✅ ${filename} yüklendi. Kayıt sayısı: ${data.length}`);
        return data;

    } catch (e) { 
        console.error(` ❌ JSON Okuma Hatası (${filename}):`, e.message);
        return [];
    }
};

// --- PORT DATABASE OLUŞTURMA ---
const rawPorts = loadJSON('ports.json');
let PORT_DB = {};

if (Array.isArray(rawPorts) && rawPorts.length > 0) {
    rawPorts.forEach(p => {
        if(p.name && p.coordinates) {
            // İsimleri standardize et (Türkçe karakter sorunu olmasın)
            let cleanName = p.name.toUpperCase()
                .replace(/İ/g, "I").replace(/Ğ/g, "G").replace(/Ü/g, "U")
                .replace(/Ş/g, "S").replace(/Ö/g, "O").replace(/Ç/g, "C");
            
            PORT_DB[cleanName] = { lat: p.coordinates[1], lng: p.coordinates[0] };
            // Orijinal haliyle de bulunsun
            PORT_DB[p.name.toUpperCase()] = { lat: p.coordinates[1], lng: p.coordinates[0] };
        }
    });
    console.log(` ⚓ Liman Veritabanı Hazır: ${Object.keys(PORT_DB).length} liman işlendi.`);
} else {
    console.error(" ⚠️ DİKKAT: Liman listesi boş! ports.json dosyasını kontrol et.");
}

// --- ENDPOINTS ---

// Liman Listesi
app.get('/api/ports', (req, res) => {
    const ports = Object.keys(PORT_DB).sort();
    if(ports.length === 0) {
        // Eğer dosya okunamazsa frontend boş kalmasın diye acil durum hatası dönmüyoruz ama logda belli.
        res.json(["Limanlar Yüklenemedi (Dosya Kontrolü Yapın)"]); 
    } else {
        res.json(ports);
    }
});

// Koordinat Çekme
app.get('/api/port-coords', (req, res) => {
    let pName = req.query.port?.toUpperCase();
    if (pName) {
        // Frontend'den gelen isteği de temizle
        pName = pName.replace(/İ/g, "I").replace(/Ğ/g, "G").replace(/Ü/g, "U")
                     .replace(/Ş/g, "S").replace(/Ö/g, "O").replace(/Ç/g, "C");
    }
    res.json(PORT_DB[pName] || {});
});

// Market Verileri (Canlı/Simüle)
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
            source: "LIVE (Yahoo Finance)"
        });
    } catch (error) {
        // Hata durumunda kurtarıcı veri
        res.json({ brent: 75.00, mgo: 880, vlsfo: 620, bdi: 1450, source: "ESTIMATED" });
    }
});

// Haberler
app.get('/api/news', async (req, res) => {
    // Süs olmasın, basit ve hızlı veri dönsün
    const today = new Date().toLocaleDateString('tr-TR');
    res.json([
        { id: 1, title: "Piyasalarda Gözler Çin İthalat Verilerinde", source: "Viya Market", date: today },
        { id: 2, title: "Kızıldeniz Rotası Güvenlik Güncellemesi", source: "Global Shipping", date: today },
        { id: 3, title: "Bunker Fiyatlarında Haftalık Artış", source: "Energy Report", date: today }
    ]);
});

// --- CHAT ENDPOINT (Gemini 2.5 Flash) ---
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    if(!genAI) return res.json({ reply: "Sistem: API Anahtarı eksik. Yapay zeka başlatılamadı." });

    try {
        // Kullanıcının özellikle istediği model:
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "Sen Viya Broker'sın. Denizcilik, brokerlik ve hukuk uzmanısın. Cevapların kısa, profesyonel ve sektörel jargona uygun olsun." }],
                },
                {
                    role: "model",
                    parts: [{ text: "Anlaşıldı. Sektörel bilgi ve profesyonel üslupla hizmete hazırım." }],
                },
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        res.json({ reply: response.text() });

    } catch(e) {
        console.error("AI Hatası Detayı:", e);
        // Hata detayını frontend'e değil loga yazıyoruz, kullanıcıya temiz mesaj.
        let userMsg = "Bağlantı kurulamadı.";
        
        if (e.message.includes("not found")) {
            userMsg = "Model (gemini-2.5-flash) şu an bu API anahtarıyla erişilebilir değil veya bölge kısıtlaması var. Lütfen 1.5 sürümünü deneyin veya API ayarlarını kontrol edin.";
        }
        res.json({ reply: `Sistem Hatası: ${userMsg}` });
    }
});

app.listen(port, () => {
    console.log(`\n ⚓ VIYA BROKER SYSTEM ONLINE (Port: ${port})`);
    console.log(` 📂 Çalışma Dizini: ${__dirname}`);
});
