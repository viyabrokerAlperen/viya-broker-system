import express from 'express'; 
import cors from 'cors'; 
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- BURAYA KENDİ API ANAHTARINI YAPIŞTIR ---
const API_KEY = 'AIzaSyB9pGfQ3wVWpawhu5aIY2iRJpQ4J9soLTM'; 

const app = express();
const PORT = process.env.PORT || 3000; 

app.use(cors()); 
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- VIYA BROKER ENGINE (MANUEL VİTES / RAW HTTP) ---
app.get('/sefer_onerisi', async (req, res) => {
    const { bolge, gemiTipi, dwt, crane, hiz, konum } = req.query;

    console.log(`\n⚓ [İSTEK]: ${gemiTipi} -> ${bolge}`);

    // JSON Formatını zorlayan Prompt
    const brokerPrompt = `
    ACT AS: Senior Ship Broker.
    OUTPUT: JSON ONLY. NO MARKDOWN. NO EXPLANATIONS.
    
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
        // ARACIYI DEVREDEN ÇIKARDIK. DİREKT ADRESE GİDİYORUZ.
        // Model: gemini-1.5-flash (En yenisi ve hızlısı)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: brokerPrompt }]
                }]
            })
        });

        const data = await response.json();

        // Eğer Google hata dönerse (API Key yanlışsa vs.)
        if (data.error) {
            throw new Error(data.error.message);
        }

        // Cevabı al
        let text = data.candidates[0].content.parts[0].text;
        console.log("AI HAM CEVAP:", text); 

        // Temizlik
        let cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonCevap = JSON.parse(cleanJson);
        
        res.json({ basari: true, tavsiye: jsonCevap });

    } catch (error) {
        console.error("❌ [MOTOR HATASI]:", error);
        res.status(500).json({ basari: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`🟢 VIYA BROKER LIVE ON PORT ${PORT}`));
