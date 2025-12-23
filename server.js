import express from 'express'; 
import cors from 'cors'; 
import path from 'path';
import { fileURLToPath } from 'url';
import routeGraph, { coordinates, findNearestNode } from './seamap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// KASA
const API_KEY = process.env.GEMINI_API_KEY;

const app = express();
const PORT = process.env.PORT || 10000; 

app.use(cors()); 
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- VIYA BROKER ENGINE (REAL DATA NAVIGATION) ---
app.get('/sefer_onerisi', async (req, res) => {
    const { bolge, gemiTipi, dwt, crane, hiz, konum } = req.query;

    console.log(`\n⚓ [NAVIGASYON]: ${konum} -> ${bolge}`);

    // 1. GERÇEK ROTA HESAPLAMA (DIJKSTRA)
    // Başlangıç ve Bitiş limanlarının koordinatlarını "tahmin" etmiyoruz,
    // Veritabanımızdaki en yakın gerçek noktayı buluyoruz.
    
    // NOT: Frontend'den lat/lon gelse daha iyi olur ama şimdilik isme göre basit eşleştirme yapalım
    // (Burası geliştirilecek, şimdilik manuel eşleme)
    const mapStart = findNearestNodeForCity(konum);
    const mapEnd = findNearestNodeForCity(bolge);

    console.log(`📍 Rota Noktaları: ${mapStart} -> ${mapEnd}`);

    let geoJSONPath = null;
    let rotaAdi = "Direkt Rota";

    if (mapStart && mapEnd) {
        // En kısa yolu hesapla
        const path = routeGraph.path(mapStart, mapEnd);
        
        if (path) {
            console.log("✅ Rota Bulundu:", path);
            rotaAdi = `${konum} - ${bolge} (via ${path.length} waypoints)`;
            
            // Koordinatları GeoJSON formatına çevir
            const pathCoordinates = path.map(nodeName => {
                const coord = coordinates[nodeName];
                return [coord[1], coord[0]]; // GeoJSON: [Lon, Lat]
            });

            geoJSONPath = {
                type: "LineString",
                coordinates: pathCoordinates
            };
        } else {
            console.log("❌ Rota Bulunamadı! Deniz bağlantısı yok.");
        }
    }

    // 2. GEMINI FİNANSAL ANALİZ
    // Rotayı biz çizdik, Gemini sadece para hesabını yapacak.
    const brokerPrompt = `
    ACT AS: Senior Ship Broker.
    TASK: Financial analysis for voyage from ${konum} to ${bolge}.
    VESSEL: ${gemiTipi} (${dwt} DWT).
    ROUTE: The vessel will follow a standard maritime route.
    
    OUTPUT: JSON ONLY.
    {
      "tavsiyeGerekcesi": "Detailed market analysis in Turkish.",
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
    `;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: brokerPrompt }] }] })
        });

        const data = await response.json();
        
        let jsonCevap = {};
        if (data.candidates) {
            let text = data.candidates[0].content.parts[0].text;
            let cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            cleanJson = cleanJson.replace(/^JSON:/i, '').trim();
            const firstBracket = cleanJson.indexOf('{');
            const lastBracket = cleanJson.lastIndexOf('}');
            if (firstBracket !== -1 && lastBracket !== -1) {
                cleanJson = cleanJson.substring(firstBracket, lastBracket + 1);
            }
            jsonCevap = JSON.parse(cleanJson);
        }

        // 3. VERİLERİ BİRLEŞTİR
        // Gemini'nin finans verisi + Bizim Gerçek Harita verimiz
        const finalResponse = {
            tavsiyeGerekcesi: jsonCevap.tavsiyeGerekcesi || "Analiz yapıldı.",
            tumRotlarinAnalizi: [
                {
                    rotaAdi: rotaAdi,
                    detay: "Standart Deniz Yolu",
                    finans: jsonCevap.finans || {},
                    geoJSON: geoJSONPath // İşte gerçek harita verisi burada!
                }
            ]
        };

        res.json({ basari: true, tavsiye: finalResponse });

    } catch (error) {
        console.error("❌ HATASI:", error.message);
        res.status(500).json({ basari: false, error: error.message });
    }
});

// Yardımcı Fonksiyon: Şehir isminden harita noktası bulma (Basit eşleştirme)
function findNearestNodeForCity(city) {
    if (!city) return "Istanbul";
    const lower = city.toLowerCase();
    
    // Basit bir sözlük (Burası geliştirilecek)
    if (lower.includes("istanbul")) return "Istanbul";
    if (lower.includes("new york") || lower.includes("amerika")) return "New_York";
    if (lower.includes("rotterdam")) return "Rotterdam";
    if (lower.includes("shanghai") || lower.includes("cin")) return "Shanghai";
    if (lower.includes("santos") || lower.includes("brazil")) return "Santos";
    if (lower.includes("singapore")) return "Singapore";
    if (lower.includes("tokyo")) return "Tokyo";
    if (lower.includes("suez")) return "Suez_North";
    
    // Eğer bulamazsa varsayılan bir nokta (veya en yakını buldurabiliriz)
    // Şimdilik test için manuel:
    if (lower.includes("london")) return "London";
    if (lower.includes("hamburg")) return "Hamburg";
    
    return "Istanbul"; // Fallback
}

app.listen(PORT, () => console.log(`🟢 VIYA BROKER LIVE ON PORT ${PORT}`));
