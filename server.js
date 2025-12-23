import express from 'express'; 
import cors from 'cors'; 
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- API ANAHTARINI BURAYA YAPIŞTIR ---
// .trim() ekledim ki yanlışlıkla boşluk kopyaladıysan silsin.
const API_KEY = 'AIzaSyB9pGfQ3wVWpawhu5aIY2iRJpQ4J9soLTM'.trim(); 

const app = express();
const PORT = process.env.PORT || 3000; 

app.use(cors()); 
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- VIYA BROKER ENGINE (V1 STABLE VERSION) ---
app.get('/sefer_onerisi', async (req, res) => {
    const { bolge, gemiTipi, dwt, crane, hiz, konum } = req.query;

    console.log(`\n⚓ [İSTEK]: ${gemiTipi} -> ${bolge}`);

    const brokerPrompt = `
    ACT AS: Senior Ship Broker.
    OUTPUT: JSON ONLY. NO MARKDOWN.
    
    TASK: Plan 3 voyages for ${gemiTipi} (${dwt} DWT) from ${konum} to ${bolge}.
    
    JSON STRUCTURE:
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
        // --- DEĞİŞİKLİK BURADA ---
        // 1. "v1beta" YERİNE "v1" (Kararlı Sürüm)
        // 2. MODEL: "gemini-pro" (En garanti model)
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: brokerPrompt }] }]
            })
        });

        const data = await response.json();

        // HATA YAKALAMA (Detaylı Log)
        if (data.error) {
            console.error("GOOGLE API HATASI:", JSON.stringify(data.error, null, 2));
            throw new Error(data.error.message);
        }

        // CEVAP İŞLEME
        let text = data.candidates && data.candidates[0] && data.candidates[0].content 
                   ? data.candidates[0].content.parts[0].text 
                   : null;

        if (!text) throw new Error("AI boş cevap döndü.");

        console.log("AI HAM CEVAP:", text); 

        // Temizlik
        let cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        // Bazen en başta "JSON:" yazar, onu da silelim
        cleanJson = cleanJson.replace(/^JSON:/i, '').trim();

        // Sadece süslü parantez arasını al (Garanti Yöntem)
        const firstBracket = cleanJson.indexOf('{');
        const lastBracket = cleanJson.lastIndexOf('}');
        if (firstBracket !== -1 && lastBracket !== -1) {
            cleanJson = cleanJson.substring(firstBracket, lastBracket + 1);
        }

        const jsonCevap = JSON.parse(cleanJson);
        res.json({ basari: true, tavsiye: jsonCevap });

    } catch (error) {
        console.error("❌ [MOTOR HATASI]:", error);
        res.status(500).json({ basari: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`🟢 VIYA BROKER LIVE ON PORT ${PORT}`));
