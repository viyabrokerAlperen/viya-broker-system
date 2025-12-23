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

// --- VIYA BROKER ENGINE (V2.0 POWERED) ---
app.get('/sefer_onerisi', async (req, res) => {
    const { bolge, gemiTipi, dwt, crane, hiz, konum } = req.query;

    console.log(`\n⚓ [İSTEK GELDİ]: ${gemiTipi} -> ${bolge}`);

    const brokerPrompt = `
    ACT AS: Senior Ship Broker.
    OUTPUT FORMAT: JSON ONLY. NO MARKDOWN. NO COMMENTS.
    
    TASK: Plan 3 voyages for ${gemiTipi} (${dwt} DWT) from ${konum} to ${bolge}.
    
    REQUIRED JSON STRUCTURE:
    {
      "tavsiyeGerekcesi": "Market analysis text (Turkish)",
      "tumRotlarinAnalizi": [
        {
          "rotaAdi": "Route Name",
          "detay": "Cargo example",
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
        // SENİN İSTEDİĞİN MODEL: 2.0 FLASH EXPERIMENTAL
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); 
        
        const result = await model.generateContent(brokerPrompt);
        let text = result.response.text();
        
        console.log("AI HAM CEVAP:", text); // Loglarda cevabı görelim

        // TEMİZLİK: Markdown tırnaklarını (```json ... ```) temizle
        let cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Parse Et
        const jsonCevap = JSON.parse(cleanJson);
        
        res.json({ basari: true, tavsiye: jsonCevap });

    } catch (error) {
        console.error("❌ [VIYA ENGINE ERROR]:", error);
        // Hata detayını artık frontend'e göndermiyoruz, çünkü frontend okuyamıyor.
        // Ama Render loglarında "❌" işaretli satırda hatayı göreceğiz.
        res.status(500).json({ basari: false, error: "Sunucu Hatası" });
    }
});

app.listen(PORT, () => console.log(`🟢 VIYA BROKER LIVE ON PORT ${PORT}`));
