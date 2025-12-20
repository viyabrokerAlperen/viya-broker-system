import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express'; 
import cors from 'cors'; 
import path from 'path';
import { fileURLToPath } from 'url';

// Dosya yollarını tanımla
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API ANAHTARIN BURAYA (Render'da Environment Variable olarak da ekleyebilirsin ama şimdilik burada kalsın)
const genAI = new GoogleGenerativeAI('AIzaSyB9pGfQ3wVWpawhu5aIY2iRJpQ4J9soLTM'); 

const app = express();
const PORT = process.env.PORT || 3000; 

app.use(cors()); 
app.use(express.json());

// Statik Dosyalar (HTML/CSS)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- VIYA BROKER API ---
app.get('/sefer_onerisi', async (req, res) => {
    const { bolge, gemiTipi, dwt, crane, hiz, konum } = req.query;

    console.log(`\n⚓ [VIYA BROKER ENGINE]: ${gemiTipi} | ${konum} -> ${bolge}`);

    const brokerPrompt = `
    SYSTEM: Elite Ship Broker & Commercial Manager (Viya Broker System).
    USER PLAN: GOD MODE.
    
    TASK: Plan 3 realistic voyages with FULL FINANCIAL BREAKDOWN.
    INPUT: Vessel ${gemiTipi} (${dwt} DWT) at ${konum}. Target: ${bolge}.
    SPEED: ${hiz} knots.
    
    INSTRUCTIONS:
    1. ROUTES: Select realistic SEA LANE SEGMENTS.
    2. CARGO: Suggest specific cargo (e.g. 60,000mt Grain, Iron Ore, Coal).
    3. BALLAST LEG: Distance from ${konum} to Load Port.
    4. LADEN LEG: Distance from Load Port to Discharge Port.
    
    FINANCIALS (MANDATORY - DO NOT SKIP):
    - Freight Rate: Realistic $/mt (e.g. $25/mt).
    - Revenue: Rate * Cargo Qty.
    - Commission: Total 2.5% (Broker 1.25% + Address 1.25%).
    - Bunker Price: VLSFO $600/mt.
    - Cons: Ballast (approx 25mt/day), Laden (approx 30mt/day).
    - Port D/A: Load ($40k) + Disch ($40k).
    - Canal Fees: Suez ($300k), Panama ($250k) if applicable.
    
    OUTPUT JSON (Strict, No Comments):
    {
      "secilenRota": "Route Name",
      "tavsiyeGerekcesi": "Detailed market and route analysis in Turkish.",
      "tumRotlarinAnalizi": [
        {
          "rotaAdi": "Via Suez",
          "detay": "60.000mt Grain, SF 45",
          "rotaSegmentleri": ["MED_EAST", "RED_SEA", "INDIAN_OCEAN"],
          "finans": {
            "navlunUSD": 1500000, 
            "komisyonUSD": 37500,
            "ballastYakitUSD": 15000, 
            "ladenYakitUSD": 270000,
            "kanalUSD": 300000, 
            "limanUSD": 80000, 
            "opexUSD": 120000, 
            "netKarUSD": 677500
          },
          "iletisim": { "sirket": "Global Chartering", "email": "fix@viyabroker.com" }
        }
      ]
    }`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); 
        const result = await model.generateContent(brokerPrompt);
        let text = result.response.text();
        let cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1)
                            .replace(/\/\/.*$/gm, '')
                            .replace(/,(\s*[}\]])/g, '$1');

        res.json({ basari: true, tavsiye: JSON.parse(cleanJson) });
    } catch (error) {
        console.error("❌ VIYA ENGINE ERROR:", error.message);
        res.status(500).json({ basari: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`🟢 VIYA BROKER LIVE ON PORT ${PORT}`));