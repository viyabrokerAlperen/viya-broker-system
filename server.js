import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { calculateFullVoyage, generateAnalysis, getDistance, VESSEL_SPECS } from './utils/calculations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// DATA LOADERS
const loadJSON = (file) => {
    try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', file))); } 
    catch (e) { return []; }
};

const PORT_DB_RAW = loadJSON('ports.json');
let PORT_DB = {};
// Veri formatını garantiye al
if (!Array.isArray(PORT_DB_RAW)) {
    for (const [key, val] of Object.entries(PORT_DB_RAW)) {
        if(val && val.length === 2) PORT_DB[key.toUpperCase()] = { lat: parseFloat(val[1]), lng: parseFloat(val[0]) };
    }
}

const REGS_DATA = loadJSON('regulations.json');
const DOCS_DATA = loadJSON('documents.json');
const REGS_CONTEXT = Array.isArray(REGS_DATA) ? REGS_DATA.map(r => r.summary).join(" | ") : "";

// ROUTES
app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));
app.get('/api/port-coords', (req, res) => res.json(PORT_DB[req.query.port] || {}));
app.get('/api/documents', (req, res) => res.json(DOCS_DATA));
app.get('/api/regulations', (req, res) => res.json(REGS_DATA));
app.get('/api/market', (req, res) => res.json({ brent: 78.50, mgo: 850, vlsfo: 620 }));

app.post('/api/chat', async (req, res) => {
    if (!API_KEY) return res.json({ reply: "AI Offline." });
    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: `System: Maritime Broker AI. Context: ${REGS_CONTEXT}. User: ${req.body.message}` }] }] })
        });
        const data = await resp.json();
        res.json({ reply: data.candidates?.[0]?.content?.parts?.[0]?.text || "No response." });
    } catch(e) { res.json({ reply: "Connection Error." }); }
});

app.post('/api/analyze', (req, res) => {
    const { shipLat, shipLng, vType, cargoQty, loadRate, dischRate } = req.body;
    if (!shipLat || !shipLng) return res.json({ success: false });

    const specs = VESSEL_SPECS[vType] || VESSEL_SPECS["SUPRAMAX"];
    const allPorts = Object.keys(PORT_DB);
    
    // [FIX] Sadece koordinatı olan limanları al
    const validPorts = allPorts.filter(p => PORT_DB[p] && PORT_DB[p].lat);
    
    // En yakın 50 limanı bul
    const candidates = validPorts.map(p => ({
        name: p, geo: PORT_DB[p],
        dist: getDistance(shipLat, shipLng, PORT_DB[p].lat, PORT_DB[p].lng)
    })).sort((a, b) => a.dist - b.dist).slice(0, 50);

    const suggestions = [];
    
    // [FIX] Döngü sayısını artır ve hata kontrolü yap
    let attempts = 0;
    while(suggestions.length < 5 && attempts < 20) {
        attempts++;
        const load = candidates[Math.floor(Math.random() * candidates.length)];
        const dischName = validPorts[Math.floor(Math.random() * validPorts.length)];
        
        if (!load || load.name === dischName) continue;
        const dischGeo = PORT_DB[dischName];

        const calc = calculateFullVoyage(shipLat, shipLng, load.name, load.geo, dischName, dischGeo, specs, {vlsfo:620, mgo:850}, 13.5, cargoQty, loadRate, dischRate);
        
        // Sadece mantıklı sonuçları ekle
        if(calc && calc.financials.tce > -5000) { 
            suggestions.push({ ...calc, aiAnalysis: generateAnalysis(calc, specs) });
        }
    }

    res.json({ success: true, voyages: suggestions.sort((a,b)=>b.financials.tce - a.financials.tce) });
});

app.listen(port, () => console.log(`VIYA V106 ONLINE on ${port}`));
