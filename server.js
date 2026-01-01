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

app.get('/api/market', async (req, res) => {
    try {
        const resBrent = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d');
        const brentJson = await resBrent.json();
        const brentVal = brentJson.chart.result[0].meta.regularMarketPrice;
        if (brentVal) {
            res.json({ brent: brentVal, mgo: Math.round(brentVal * 10.5), vlsfo: Math.round(brentVal * 10.5 * 0.75) });
        } else { throw new Error("No data"); }
    } catch (e) {
        res.json({ brent: null, mgo: null, vlsfo: null });
    }
});

// [GÜNCELLEME] Chatbot artık seçilen dili biliyor
app.post('/api/chat', async (req, res) => {
    if (!API_KEY) return res.json({ reply: "AI Offline." });
    
    // Frontend'den gelen dili al
    const { message, language } = req.body;
    const targetLang = language || "English";

    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ 
                text: `You are a Maritime Expert Broker. 
                Context: ${REGS_CONTEXT}. 
                IMPORTANT: Respond ONLY in ${targetLang} language.
                User asks: ${message}` 
            }] }] })
        });
        const data = await resp.json();
        res.json({ reply: data.candidates?.[0]?.content?.parts?.[0]?.text || "..." });
    } catch(e) { res.json({ reply: "Connection Error." }); }
});

app.post('/api/analyze', (req, res) => {
    const { shipLat, shipLng, vType, cargoQty, loadRate, dischRate } = req.body;
    if (!shipLat || !shipLng) return res.json({ success: false });

    const specs = VESSEL_SPECS[vType] || VESSEL_SPECS["SUPRAMAX"];
    const allPorts = Object.keys(PORT_DB);
    const validPorts = allPorts.filter(p => PORT_DB[p] && PORT_DB[p].lat);
    const candidates = validPorts.map(p => ({
        name: p, geo: PORT_DB[p],
        dist: getDistance(shipLat, shipLng, PORT_DB[p].lat, PORT_DB[p].lng)
    })).sort((a, b) => a.dist - b.dist).slice(0, 40);

    const suggestions = [];
    let attempts = 0;
    while(suggestions.length < 5 && attempts < 50) {
        attempts++;
        const load = candidates[Math.floor(Math.random() * candidates.length)];
        const dischName = validPorts[Math.floor(Math.random() * validPorts.length)];
        if (!load || load.name === dischName) continue;
        const calc = calculateFullVoyage(shipLat, shipLng, load.name, load.geo, dischName, PORT_DB[dischName], specs, {vlsfo:600, mgo:800}, 13.5, cargoQty, loadRate, dischRate);
        if(calc) suggestions.push({ ...calc, aiAnalysis: generateAnalysis(calc, specs) });
    }
    res.json({ success: true, voyages: suggestions.sort((a,b)=>b.financials.tce - a.financials.tce) });
});

app.listen(port, () => console.log(`SYSTEM ONLINE on ${port}`));
