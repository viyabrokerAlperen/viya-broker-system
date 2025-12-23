import express from 'express'; 
import cors from 'cors'; 
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- YENİ ALDIĞIN "TEMİZ" ANAHTARI BURAYA YAPIŞTIR ---
// Şifreyi artık kodun içine yazmıyoruz, Render'ın kasasından (Environment) çekiyoruz.
const API_KEY = process.env.GEMINI_API_KEY;

// Eğer kasa boşsa hata verelim ki anlayalım
if (!API_KEY) {
    console.error("❌ HATA: API Anahtarı bulunamadı! Render Environment ayarlarına 'GEMINI_API_KEY' eklemeyi unuttun.");
} 

const app = express();
const PORT = process.env.PORT || 3000; 

app.use(cors()); 
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- VIYA BROKER ENGINE (DEDEKTİF MODU AÇIK) ---
app.get('/sefer_onerisi', async (req, res) => {
    const { bolge, gemiTipi, dwt, crane, hiz, konum } = req.query;
    console.log(`\n⚓ [İSTEK]: ${gemiTipi} -> ${bolge}`);

    const brokerPrompt = `
    ACT AS: Senior Ship Broker. OUTPUT: JSON ONLY.
    TASK: Plan 3 voyages for ${gemiTipi} (${dwt} DWT) from ${konum} to ${bolge}.
    JSON STRUCTURE: {"tavsiyeGerekcesi": "Analiz", "tumRotlarinAnalizi": [{"rotaAdi": "R1", "detay": "D1", "rotaSegmentleri": ["A"], "finans": {"navlunUSD": 0, "komisyonUSD": 0, "ballastYakitUSD": 0, "ladenYakitUSD": 0, "kanalUSD": 0, "limanUSD": 0, "opexUSD": 0, "netKarUSD": 0}}]}`;

    try {
        // ÖNCE EN GARANTİ MODELİ DENİYORUZ: gemini-1.5-flash
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        let response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: brokerPrompt }] }] })
        });

        let data = await response.json();

        // EĞER HATA VARSA (404 vs.)
        if (data.error) {
            console.error("❌ BİRİNCİ DENEME BAŞARISIZ:", data.error.message);
            
            // --- DEDEKTİF MODU: SİSTEMDE HANGİ MODELLER VAR? ---
            console.log("🕵️‍♂️ MEVCUT MODELLER ARANIYOR...");
            const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
            const listResp = await fetch(listUrl);
            const listData = await listResp.json();
            
            if (listData.models) {
                const modelIsimleri = listData.models.map(m => m.name).join(", ");
                console.log("✅ SENİN ANAHTARININ GÖRDÜĞÜ MODELLER:", modelIsimleri);
                
                // Hata mesajını detaylı döndürelim
                throw new Error(`Model Bulunamadı. Ancak erişebildiğin modeller şunlar: ${modelIsimleri}`);
            } else {
                throw new Error("Anahtarın hiçbir model görmüyor! Yeni bir proje oluşturup anahtar almalısın.");
            }
        }

        // --- İŞLEM BAŞARILIYSA ---
        let text = data.candidates[0].content.parts[0].text;
        let cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBracket = cleanJson.indexOf('{');
        const lastBracket = cleanJson.lastIndexOf('}');
        if (firstBracket !== -1 && lastBracket !== -1) cleanJson = cleanJson.substring(firstBracket, lastBracket + 1);

        res.json({ basari: true, tavsiye: JSON.parse(cleanJson) });

    } catch (error) {
        console.error("❌ [MOTOR HATASI]:", error.message);
        res.status(500).json({ basari: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`🟢 VIYA BROKER LIVE ON PORT ${PORT}`));

