import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express'; 
import cors from 'cors'; 
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- DİKKAT: BURAYA KENDİ API ANAHTARINI YAPIŞTIR ---
const genAI = new GoogleGenerativeAI('AIzaSyB9pGfQ3wVWpawhu5aIY2iRJpQ4J9soLTM'); 

const app = express();
const PORT = process.env.PORT || 3000; 

app.use(cors()); 
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- VIYA BROKER ENGINE ---
app.get('/sefer_onerisi', async (req, res) => {
    const { bolge, gemiTipi, dwt, crane, hiz, konum } = req.query;

    console.log(`\n⚓ [İSTEK GELDİ]: ${gemiTipi} | ${konum} -> ${bolge}`);

    // Prompt (Talimat)
    const brokerPrompt = `
    Role: Senior Ship Broker. 
    Task: Create a shipping voyage plan in strictly valid JSON format.
    Vessel: ${gemiTipi} (${dwt} DWT), Speed: ${hiz} knots.
    From: ${konum}, To: ${bolge}.
    
    Requirements:
    - 3 distinct route options.
    - Financials must be realistic (Revenue, Fuel Costs, Net Profit).
    - Route Segments must use these keys: "MED_EAST", "RED_SEA", "INDIAN_OCEAN", "SOUTH_CHINA", "MED_WEST", "ATLANTIC_NA", "ATLANTIC_SA".
    
    Output Format (JSON ONLY):
    {
      "tavsiyeGerekcesi": "Market analysis text here (Turkish).",
      "tumRotlarinAnalizi": [
        {
          "rotaAdi": "Route Name",
          "detay": "Cargo details",
          "rotaSegmentleri": ["MED_EAST", "RED_SEA"],
          "finans": {
            "navlunUSD": 1000000, 
            "komisyonUSD": 25000,
            "ballastYakitUSD": 10000, 
            "ladenYakitUSD": 200000,
            "kanalUSD": 0, 
            "limanUSD": 50000, 
            "opexUSD": 80000, 
            "netKarUSD": 635000
          }
        }
      ]
    }`;

    try {
        // MODEL AYARI: Gemini 1.5 Flash + JSON ZORLAMASI
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(brokerPrompt);
        const text = result.response.text();
        
        console.log("✅ [AI CEVABI BAŞARILI]");
        
        // Gelen cevap zaten saf JSON olduğu için direkt parse ediyoruz
        const jsonCevap = JSON.parse(text);
        
        res.json({ basari: true, tavsiye: jsonCevap });

    } catch (error) {
        console.error("❌ [VIYA ENGINE ERROR]:", error);
        // Hata detayını frontend'e gönderelim ki görebilelim
        res.status(500).json({ basari: false, error: error.message, details: error.toString() });
    }
});

app.listen(PORT, () => console.log(`🟢 VIYA BROKER LIVE ON PORT ${PORT}`));
