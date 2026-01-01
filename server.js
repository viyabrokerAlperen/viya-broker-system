import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateFullVoyage, generateAnalysis, VESSEL_SPECS } from './utils/calculations.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

const API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// LOADERS
const loadJSON = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f)));
const PORT_DB_RAW = loadJSON('ports.json');
let PORT_DB = {};
for(const [k,v] of Object.entries(PORT_DB_RAW)) PORT_DB[k.toUpperCase()] = {lat:v[1], lng:v[0]};
const REGS_DATA = loadJSON('regulations.json');
const REGS_CONTEXT = REGS_DATA.map(r => r.summary).join(" | ");

// ROUTES
app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));
app.get('/api/port-coords', (req, res) => res.json(PORT_DB[req.query.port] || {}));
app.get('/api/documents', (req, res) => res.json(loadJSON('documents.json')));
app.get('/api/regulations', (req, res) => res.json(REGS_DATA));
app.get('/api/market', (req, res) => res.json({ brent: 78.50, mgo: 850, vlsfo: 620 }));

app.post('/api/chat', async (req, res) => {
    if (!API_KEY) return res.json({ reply: "Offline." });
    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: `VIYA AI. Context: ${REGS_CONTEXT}. User: ${req.body.message}` }] }] })
        });
        const data = await resp.json();
        res.json({ reply: data.candidates[0].content.parts[0].text });
    } catch(e) { res.json({ reply: "Error." }); }
});

app.post('/api/analyze', (req, res) => {
    const { shipLat, shipLng, vType, cargoQty, loadRate, dischRate } = req.body;
    const specs = VESSEL_SPECS[vType] || VESSEL_SPECS["SUPRAMAX"];
    const allPorts = Object.keys(PORT_DB);
    const candidates = allPorts.slice(0, 50);
    const suggestions = [];

    for(let i=0; i<5; i++) {
        const ln = candidates[Math.floor(Math.random()*candidates.length)];
        const dn = allPorts[Math.floor(Math.random()*allPorts.length)];
        if(ln===dn) continue;
        const calc = calculateFullVoyage(shipLat, shipLng, ln, PORT_DB[ln], dn, PORT_DB[dn], specs, {vlsfo:620, mgo:850}, 13.5, cargoQty, loadRate, dischRate);
        if(calc.financials.profit > -200000) suggestions.push({ ...calc, aiAnalysis: generateAnalysis(calc, specs) });
    }
    res.json({ success: true, voyages: suggestions.sort((a,b)=>b.financials.tce - a.financials.tce) });
});

app.listen(port, () => console.log(`VIYA MODULAR V1 running on ${port}`));
