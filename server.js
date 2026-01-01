import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateFullVoyage, generateAnalysis, getDistance, VESSEL_SPECS } from './utils/calculations.js';

// Veri okuma yardımcıları
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

const API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
if(API_KEY) console.log("✅ SYSTEM ONLINE"); else console.error("❌ API KEY MISSING");

app.use(cors());
app.use(express.json());
// [ÖNEMLİ] Public klasörünü statik olarak sunuyoruz (HTML, CSS, JS buradan gidecek)
app.use(express.static(path.join(__dirname, 'public')));

// DATA LOADERS
const loadJSON = (file) => {
    try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', file))); } 
    catch(e) { return []; }
};
const PORT_DB_RAW = loadJSON('ports.json');
let PORT_DB = {};
for(const [k,v] of Object.entries(PORT_DB_RAW)) PORT_DB[k.toUpperCase()] = {lat:v[1], lng:v[0]};

const DOCS_DATA = loadJSON('documents.json');
const REGS_DATA = loadJSON('regulations.json');

// ROUTES
app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));
app.get('/api/port-coords', (req, res) => res.json(PORT_DB[req.query.port] || {}));
app.get('/api/documents', (req, res) => res.json(DOCS_DATA));
app.get('/api/regulations', (req, res) => res.json(REGS_DATA));
app.get('/api/market', (req, res) => res.json({ brent: 78.50, mgo: 850, vlsfo: 620 })); // Mock for simplicity in modular

// AI CHAT
app.post('/api/chat', async (req, res) => {
    if (!API_KEY) return res.json({ reply: "System Offline." });
    const models = ["gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-pro"];
    
    for (const model of models) {
        try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ contents: [{ parts: [{ text: "You are VIYA AI. Answer concisely. User: " + req.body.message }] }] })
            });
            const data = await resp.json();
            if (data.candidates) return res.json({ reply: data.candidates[0].content.parts[0].text });
        } catch(e) {}
    }
    res.json({ reply: "Error." });
});

// ANALYZE
app.post('/api/analyze', (req, res) => {
    const { shipLat, shipLng, shipSpeed, vType, cargoQty, loadRate, dischRate } = req.body;
    const specs = VESSEL_SPECS[vType] || VESSEL_SPECS["SUPRAMAX"];
    const allPorts = Object.keys(PORT_DB);
    const suggestions = [];
    
    // Performance limit
    const candidates = allPorts.slice(0, 50);

    for(let i=0; i<5; i++) {
        const ln = candidates[Math.floor(Math.random()*candidates.length)];
        const dn = allPorts[Math.floor(Math.random()*allPorts.length)];
        if(ln===dn) continue;
        
        const calc = calculateFullVoyage(shipLat, shipLng, ln, PORT_DB[ln], dn, PORT_DB[dn], specs, {vlsfo:620, mgo:850}, shipSpeed, cargoQty, loadRate, dischRate);
        if(calc.financials.profit > -200000) {
            suggestions.push({
                ...calc,
                aiAnalysis: generateAnalysis(calc, specs)
            });
        }
    }
    res.json({ success: true, voyages: suggestions.sort((a,b)=>b.financials.tce - a.financials.tce) });
});

app.listen(port, () => console.log(`VIYA BROKER MODULAR running on port ${port}`));
