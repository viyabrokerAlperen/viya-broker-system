import express from 'express'; 
import cors from 'cors'; 
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ŞİFREYİ ARTIK KODUN İÇİNE YAZMIYORUZ!
// Render'ın kasasından (Environment Variable) çekiyoruz.
const API_KEY = process.env.GEMINI_API_KEY;

const app = express();
const PORT = process.env.PORT || 10000; 

app.use(cors()); 
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- VIYA BROKER ENGINE (MODEL: GEMINI 2.0 FLASH) ---
app.get('/sefer_onerisi', async (req, res) => {
    const { bolge, gemiTipi, dwt, crane, hiz, konum } = req.query;

    console.log(`\n⚓ [İSTEK]: ${gemiTipi} -> ${bolge}`);

    // Kasa kontrolü
    if (!API_KEY) {
        console.error("❌ HATA: API Anahtarı yok! Render Environment ayarlarına 'GEMINI_API_KEY' eklemelisin.");
        return res.status(500).json({ basari: false, error: "Sunucu API Anahtarı Ayarlanmamış." });
    }

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
        // --- İŞTE ÇÖZÜM BURADA ---
        // Senin listende "gemini-1.5-flash" YOKTU.
        // Ama "gemini-2.0-flash" VARDI. O yüzden bunu kullanıyoruz.
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: brokerPrompt }] }]
            })
        });

        const data = await response.json();

        // Hata Kontrolü
        if (data.error) {
            console.error("GOOGLE API HATASI:", JSON.stringify(data.error, null, 2));
            throw new Error(data.error.message);
        }

        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("AI boş cevap döndü.");

        console.log("AI HAM CEVAP:", text); 

        // Temizlik Robotu
        let cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        // Bazen en başta "JSON:" yazar, onu da silelim
        cleanJson = cleanJson.replace(/^JSON:/i, '').trim();

        const firstBracket = cleanJson.indexOf('{');
        const lastBracket = cleanJson.lastIndexOf('}');
        if (firstBracket !== -1 && lastBracket !== -1) {
            cleanJson = cleanJson.substring(firstBracket, lastBracket + 1);
        }

        const jsonCevap = JSON.parse(cleanJson);
        res.json({ basari: true, tavsiye: jsonCevap });

    } catch (error) {
        console.error("❌ [MOTOR HATASI]:", error.message);
        res.status(500).json({ basari: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`🟢 VIYA BROKER LIVE ON PORT ${PORT}`));
