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

// --- VIYA BROKER ENGINE (V1.5 STABLE) ---
app.get('/sefer_onerisi', async (req, res) => {
    const { bolge, gemiTipi, dwt, crane, hiz, konum } = req.query;

    console.log(`\n⚓ [İSTEK]: ${gemiTipi} -> ${bolge}`);

    const brokerPrompt = `
    ACT AS: Senior Ship Broker.
    OUTPUT: JSON ONLY. NO MARKDOWN. NO EXPLANATIONS OUTSIDE JSON.
    
    TASK: Plan 3 voyages for ${gemiTipi} (${dwt} DWT) from ${konum} to ${bolge}.
    
    JSON STRUCTURE:
    {
      "tavsiyeGerekcesi": "Market analysis (Turkish)",
      "tumRotlarinAnalizi": [
        {
          "rotaAdi": "Route Name",
          "detay": "Cargo type",
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
        // EN SAĞLAM MODEL: 1.5 FLASH
        // 2.0 sunucuda bulunamadığı için bunu kullanmak ZORUNDAYIZ.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
        
        const result = await model.generateContent(brokerPrompt);
        let text = result.response.text();
        
        console.log("AI HAM CEVAP:", text); 

        // --- TEMİZLİK ROBOTU ---
        // Eğer AI cevabı ```json ile süslerse temizliyoruz.
        let cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const jsonCevap = JSON.parse(cleanJson);
        res.json({ basari: true, tavsiye: jsonCevap });

    } catch (error) {
        console.error("❌ [MOTOR HATASI]:", error);
        // Hatayı artık gizlemiyoruz, ekrana basıyoruz ki görelim.
        res.status(500).json({ basari: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`🟢 VIYA BROKER LIVE ON PORT ${PORT}`));
