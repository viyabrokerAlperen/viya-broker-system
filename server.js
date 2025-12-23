import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express'; 
import cors from 'cors'; 
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- BURAYA KENDİ API ANAHTARINI YAPIŞTIR ---
const genAI = new GoogleGenerativeAI('AIzaSyB9pGfQ3wVWpawhu5aIY2iRJpQ4J9soLTM'); 

const app = express();
const PORT = process.env.PORT || 3000; 

app.use(cors()); 
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- VIYA BROKER ENGINE (CLASSIC GEMINI PRO) ---
app.get('/sefer_onerisi', async (req, res) => {
    const { bolge, gemiTipi, dwt, crane, hiz, konum } = req.query;

    console.log(`\n⚓ [İSTEK]: ${gemiTipi} -> ${bolge}`);

    const brokerPrompt = `
    ACT AS: Senior Ship Broker.
    OUTPUT: JSON ONLY. DO NOT USE MARKDOWN. DO NOT WRITE EXPLANATIONS.
    
    TASK: Plan 3 voyages for ${gemiTipi} (${dwt} DWT) from ${konum} to ${bolge}.
    
    STRICT JSON STRUCTURE:
    {
      "tavsiyeGerekcesi": "Piyasa analizi (Turkce)",
      "tumRotlarinAnalizi": [
        {
          "rotaAdi": "Rota Ismi",
          "detay": "Yuk Detayi",
          "rotaSegmentleri": ["MED_EAST", "RED_SEA"],
          "finans": {
            "navlunUSD": 100000, 
            "komisyonUSD": 2500,
            "ballastYakitUSD": 5000, 
            "ladenYakitUSD": 50000,
            "kanalUSD": 0, 
            "limanUSD": 10000, 
            "opexUSD": 5000, 
            "netKarUSD": 27500
          }
        }
      ]
    }
    `;

    try {
        // DEĞİŞİKLİK: En klasik ve uyumlu model "gemini-pro" kullanıyoruz.
        // Bu model her anahtarla çalışır.
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); 
        
        const result = await model.generateContent(brokerPrompt);
        const response = await result.response;
        let text = response.text();
        
        console.log("AI HAM CEVAP:", text); 

        // --- GÜÇLÜ TEMİZLİK ---
        // Gemini Pro bazen en başa "Here is the JSON" yazar. Bunu siliyoruz.
        // Sadece { ile } arasındaki kısmı alıyoruz.
        const jsonBaslangic = text.indexOf('{');
        const jsonBitis = text.lastIndexOf('}');
        
        if (jsonBaslangic !== -1 && jsonBitis !== -1) {
            let cleanJson = text.substring(jsonBaslangic, jsonBitis + 1);
            const jsonCevap = JSON.parse(cleanJson);
            res.json({ basari: true, tavsiye: jsonCevap });
        } else {
            throw new Error("AI geçerli bir JSON üretmedi.");
        }

    } catch (error) {
        console.error("❌ [MOTOR HATASI]:", error);
        res.status(500).json({ basari: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`🟢 VIYA BROKER LIVE ON PORT ${PORT}`));
