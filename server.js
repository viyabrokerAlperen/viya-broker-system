import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// --- KRİTİK DÜZELTME: SEAROUTE SAFE IMPORT ---
// Bu blok, kütüphane ne şekilde gelirse gelsin (CommonJS veya ES Module)
// doğru fonksiyonu yakalayıp 'searoute' değişkenine atar.
const require = createRequire(import.meta.url);
const searoutePkg = require('searoute');
const searoute = (typeof searoutePkg === 'function') ? searoutePkg : searoutePkg.default;

// Node 18+ Native Fetch
const fetch = globalThis.fetch;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// =================================================================
// 1. FRONTEND KODU (FULL DETAYLI VE GÖRKEMLİ ARAYÜZ)
// =================================================================
const FRONTEND_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VIYA BROKER | Leviathan Edition</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Orbitron:wght@400;600;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        :root { --neon-cyan: #00f2ff; --neon-purple: #bc13fe; --deep-space: #030508; --panel-bg: rgba(10, 15, 25, 0.95); --card-bg: rgba(255, 255, 255, 0.03); --border-color: rgba(255, 255, 255, 0.1); --text-main: #e0e6ed; --text-muted: #94a3b8; --font-ui: 'Plus Jakarta Sans', sans-serif; --font-tech: 'Orbitron', sans-serif; --success: #00ff9d; --danger: #ff0055; --warning: #ffb700; }
        * { box-sizing: border-box; margin: 0; padding: 0; scroll-behavior: smooth; }
        body { background-color: var(--deep-space); color: var(--text-main); font-family: var(--font-ui); overflow-x: hidden; font-size:14px; }
        
        /* NAVBAR */
        nav { position: fixed; top: 0; width: 100%; z-index: 1000; background: rgba(3, 5, 8, 0.95); backdrop-filter: blur(15px); border-bottom: 1px solid var(--border-color); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        .brand { font-family: var(--font-tech); font-weight: 900; font-size: 1.4rem; letter-spacing: 1px; color: #fff; display: flex; align-items: center; gap: 10px; }
        .brand i { color: var(--neon-cyan); }
        .live-ticker { font-family: var(--font-tech); font-size: 0.8rem; color: var(--text-muted); display:flex; gap:20px; align-items:center; }
        .ticker-item span { color: var(--success); font-weight:bold; margin-left:5px; }
        .btn-nav { background: transparent; border: 1px solid var(--neon-cyan); color: var(--neon-cyan); padding: 8px 25px; border-radius: 50px; font-family: var(--font-tech); cursor: pointer; transition: 0.3s; font-size: 0.8rem; }
        .btn-nav:hover { background: var(--neon-cyan); color: #000; box-shadow: 0 0 20px rgba(0,242,255,0.4); }

        /* LANDING PAGE */
        #landing-view { display: block; }
        .hero { height: 100vh; background: linear-gradient(rgba(3,5,8,0.7), rgba(3,5,8,1)), url('https://images.unsplash.com/photo-1559827291-72ee739d0d9a?q=80&w=2874&auto=format&fit=crop'); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; text-align: center; }
        .hero h1 { font-family: var(--font-tech); font-size: 4rem; line-height: 1.1; margin-bottom: 20px; background: linear-gradient(to right, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 30px rgba(0,242,255,0.2); }
        .hero p { font-size: 1.2rem; color: var(--text-muted); max-width: 700px; margin: 0 auto 40px auto; }
        .btn-hero { background: linear-gradient(135deg, var(--neon-cyan), #00aaff); border: none; color: #000; padding: 20px 50px; font-size: 1.1rem; font-weight: 800; font-family: var(--font-tech); cursor: pointer; border-radius: 5px; box-shadow: 0 0 30px rgba(0,242,255,0.3); transition: 0.3s; letter-spacing: 1px; }
        .btn-hero:hover { transform: translateY(-5px); box-shadow: 0 0 60px rgba(0,242,255,0.6); }

        /* DASHBOARD LAYOUT */
        #dashboard-view { display: none; padding-top: 80px; height: 100vh; }
        .dash-grid { display: grid; grid-template-columns: 400px 1fr; gap: 20px; padding: 20px; height: calc(100vh - 80px); }
        
        /* SIDEBAR */
        .sidebar { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 15px; box-shadow: 0 0 30px rgba(0,0,0,0.5); overflow-y: auto; }
        .sidebar h3 { font-family: var(--font-tech); color: var(--neon-cyan); border-bottom: 1px solid #333; padding-bottom: 10px; font-size: 0.9rem; letter-spacing: 1px; margin-top:5px; }
        
        .input-group label { display: block; font-size: 0.75rem; color: #8892b0; margin-bottom: 8px; font-weight: 600; letter-spacing: 0.5px; }
        .input-group input, .input-group select { width: 100%; background: #0b1221; border: 1px solid #233554; color: #fff; padding: 14px; border-radius: 6px; font-family: var(--font-ui); font-size: 0.95rem; transition: all 0.3s ease; }
        .input-group input:focus, .input-group select:focus { border-color: var(--neon-cyan); outline: none; box-shadow: 0 0 15px rgba(0,242,255,0.15); }
        
        .btn-action { background: linear-gradient(135deg, var(--neon-cyan), #00aaff); border: none; color: #000; padding: 16px; font-size: 1rem; font-weight: 800; font-family: var(--font-tech); cursor: pointer; border-radius: 6px; width: 100%; transition: 0.3s; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .btn-action:hover { transform: translateY(-3px); box-shadow: 0 0 25px rgba(0,242,255,0.5); }

        /* CARGO RESULTS */
        .cargo-list { margin-top: 20px; border-top: 1px solid #333; padding-top: 20px; }
        .cargo-item { background: rgba(255,255,255,0.03); border: 1px solid #333; padding: 15px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: 0.2s; position: relative; overflow: hidden; }
        .cargo-item:hover { border-color: var(--neon-cyan); background: rgba(0,242,255,0.05); }
        .cargo-item.active { border-color: var(--neon-cyan); background: rgba(0,242,255,0.15); box-shadow: 0 0 20px rgba(0,242,255,0.1); }
        .c-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .c-route { font-size: 0.95rem; font-weight: 700; color: #fff; }
        .c-profit { font-family: var(--font-tech); font-weight: 900; color: var(--success); font-size: 1.1rem; }
        .c-sub { font-size: 0.8rem; color: #94a3b8; display: flex; justify-content: space-between; }

        /* MAP & RESULTS */
        .map-container { position: relative; border-radius: 10px; overflow: hidden; border: 1px solid var(--border-color); background: #000; box-shadow: 0 0 30px rgba(0,0,0,0.5); }
        #map { width: 100%; height: 100%; }
        
        .results-box { position: absolute; bottom: 25px; right: 25px; z-index: 500; background: var(--panel-bg); border: 1px solid #333; border-radius: 10px; padding: 25px; width: 400px; max-height: 600px; overflow-y: auto; backdrop-filter: blur(15px); box-shadow: 0 0 40px rgba(0,0,0,0.8); display: none; }
        .res-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 15px; }
        .res-title { font-family: var(--font-tech); color: var(--neon-cyan); font-size: 1rem; letter-spacing: 1px; }
        .d-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; }
        .d-lbl { color: #94a3b8; }
        .d-val { color: #fff; font-weight: 500; }
        .d-val.pos { color: var(--success); }
        .d-val.neg { color: var(--danger); }
        .ai-box { margin-top: 20px; padding: 15px; background: rgba(0, 242, 255, 0.05); border-left: 3px solid var(--neon-cyan); font-size: 0.85rem; color: #e2e8f0; line-height: 1.6; font-style: italic; border-radius: 0 5px 5px 0; }

        /* UTILS */
        .loader { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.9); z-index: 2000; place-items: center; }
        .spinner { width: 60px; height: 60px; border: 4px solid var(--neon-cyan); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .toast { position: fixed; top: 25px; right: 25px; background: #0f172a; border-left: 5px solid var(--neon-cyan); color: #fff; padding: 15px 30px; border-radius: 6px; z-index: 3000; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-weight: 600; }
        .toast.show { display: block; animation: slideIn 0.3s ease-out; }
        .toast.error { border-left-color: var(--danger); }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    </style>
</head>
<body>
    <div class="toast" id="toast">Notification</div>
    <div class="loader" id="loader"><div style="text-align: center;"><div class="spinner" style="margin: 0 auto 20px;"></div><div style="font-family: var(--font-tech); color: var(--neon-cyan); font-size:1.2rem;">AI NAVIGATOR CALCULATING...</div></div></div>

    <nav>
        <div class="brand"><i class="fa-solid fa-anchor"></i> VIYA BROKER</div>
        <div class="live-ticker">
            <div class="ticker-item"><i class="fa-solid fa-droplet"></i> BRENT: <span id="oilPrice">Loading...</span></div>
            <div class="ticker-item"><i class="fa-solid fa-gas-pump"></i> VLSFO: <span id="fuelPrice">Loading...</span></div>
        </div>
        <button class="btn-nav" onclick="location.reload()">SYSTEM REBOOT</button>
    </nav>

    <div id="landing-view">
        <header class="hero">
            <div class="hero-content">
                <h1>COMMAND THE<br>GLOBAL MARKETS</h1>
                <p>The ultimate AI-powered maritime intelligence platform. Real-time routing, live bunker indices, and precise voyage estimation.</p>
                <button class="btn-hero" onclick="openLogin()">ACCESS TERMINAL</button>
            </div>
        </header>
    </div>

    <div id="dashboard-view">
        <div class="dash-grid">
            <aside class="sidebar">
                <h3><i class="fa-solid fa-ship"></i> VESSEL CONFIGURATION</h3>
                <div class="input-group">
                    <label>VESSEL CLASS & TYPE</label>
                    <select id="vType">
                        <optgroup label="DRY BULK CARRIERS">
                            <option value="HANDYSIZE">Handysize (35,000 DWT)</option>
                            <option value="SUPRAMAX">Supramax (58,000 DWT)</option>
                            <option value="PANAMAX">Panamax (82,000 DWT)</option>
                            <option value="CAPESIZE">Capesize (180,000 DWT)</option>
                        </optgroup>
                        <optgroup label="LIQUID TANKERS">
                            <option value="MR_TANKER">MR Tanker (50,000 DWT)</option>
                            <option value="AFRAMAX">Aframax (115,000 DWT)</option>
                            <option value="VLCC">VLCC (300,000 DWT)</option>
                        </optgroup>
                        <optgroup label="GAS CARRIERS">
                            <option value="LNG_STD">LNG Standard (174k cbm)</option>
                        </optgroup>
                    </select>
                </div>
                <div class="input-group">
                    <label>CURRENT OPEN PORT</label>
                    <input type="text" id="vLoc" list="portList" value="ISTANBUL" oninput="this.value = this.value.toUpperCase()">
                </div>
                <div style="height:1px; background:#333; margin:10px 0;"></div>
                <h3><i class="fa-solid fa-globe"></i> COMMERCIAL SCAN</h3>
                <div class="input-group">
                    <label>TARGET MARKET</label>
                    <select id="vRegion">
                        <option value="WORLD">GLOBAL SEARCH (Maximize Profit)</option>
                        <option value="AMERICAS">Americas (Atlantic/Pacific)</option>
                        <option value="ASIA">Asia & Far East</option>
                        <option value="EUROPE">North Europe & Continent</option>
                        <option value="MED">Mediterranean & Black Sea</option>
                    </select>
                </div>
                <button class="btn-action" onclick="scanMarket()">SCAN MARKET OPPORTUNITIES</button>
                <div id="cargoResultList" class="cargo-list" style="display:none;"></div>
                <datalist id="portList"></datalist>
            </aside>
            <div class="map-container">
                <div id="map"></div>
                <div class="results-box" id="resBox">
                    <div class="res-header"><span class="res-title">VOYAGE ESTIMATION</span><i class="fa-solid fa-chart-pie" style="color:var(--neon-cyan)"></i></div>
                    <div id="financialDetails"></div>
                    <div class="ai-box" id="aiText">Select a cargo to view AI analysis...</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const map = L.map('map', {zoomControl: false}).setView([35, 10], 3);
        L.control.zoom({position: 'bottomright'}).addTo(map);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 19 }).addTo(map);
        const layerGroup = L.layerGroup().addTo(map);

        function openLogin() { document.getElementById('landing-view').style.display = 'none'; document.getElementById('dashboard-view').style.display = 'block'; setTimeout(() => map.invalidateSize(), 100); }
        function showLanding() { document.getElementById('dashboard-view').style.display = 'none'; document.getElementById('landing-view').style.display = 'block'; }
        
        async function loadPorts() {
            try {
                const res = await fetch('/api/ports');
                const ports = await res.json();
                const dl = document.getElementById('portList');
                ports.forEach(p => { const opt = document.createElement('option'); opt.value = p; dl.appendChild(opt); });
                const resMarket = await fetch('/api/market-data');
                const market = await resMarket.json();
                document.getElementById('oilPrice').innerText = "$" + market.brent.toFixed(2);
                document.getElementById('fuelPrice').innerText = "$" + market.vlsfo.toFixed(2);
            } catch(e) {}
        }
        loadPorts();

        async function scanMarket() {
            const shipPos = document.getElementById('vLoc').value.toUpperCase();
            const region = document.getElementById('vRegion').value;
            const vType = document.getElementById('vType').value;
            const loader = document.getElementById('loader');
            loader.style.display = 'grid';
            document.getElementById('cargoResultList').style.display = 'none';
            document.getElementById('resBox').style.display = 'none';
            layerGroup.clearLayers();

            try {
                const res = await fetch(\`/api/broker?shipPos=\${shipPos}&region=\${region}&vType=\${vType}\`);
                const data = await res.json();
                if(data.success) { displayCargoes(data.cargoes); } 
                else { alert(data.error); }
            } catch (err) { alert("Market Scan Error"); } finally { loader.style.display = 'none'; }
        }

        function displayCargoes(cargoes) {
            const list = document.getElementById('cargoResultList');
            list.innerHTML = '<div style="font-size:0.75rem; color:#888; margin-bottom:10px; font-weight:bold;">LIVE OPPORTUNITIES:</div>';
            list.style.display = 'block';
            cargoes.forEach((c) => {
                const div = document.createElement('div');
                div.className = 'cargo-item';
                div.innerHTML = \`<div class="c-header"><div class="c-route">\${c.loadPort} -> \${c.dischPort}</div><div class="c-profit">$\${(c.financials.profit/1000).toFixed(1)}k</div></div><div class="c-sub"><span>\${c.commodity} • \${(c.qty/1000).toFixed(1)}k \${c.unit}</span><span>\${c.durationDays.toFixed(0)} days</span></div>\`;
                div.onclick = () => selectCargo(c, div);
                list.appendChild(div);
            });
            if(cargoes.length > 0) selectCargo(cargoes[0], list.children[1]);
        }

        function selectCargo(c, el) {
            document.querySelectorAll('.cargo-item').forEach(x => x.classList.remove('active'));
            el.classList.add('active');
            drawRoute(c.routeGeo, c.loadPort, c.dischPort);
            updateDetails(c);
        }

        function updateDetails(c) {
            const f = c.financials;
            const html = \`
                <div class="d-row"><span class="d-lbl">Route</span> <span class="d-val">\${c.loadPort} to \${c.dischPort}</span></div>
                <div class="d-row"><span class="d-lbl">Cargo</span> <span class="d-val">\${c.commodity} (\${c.qty.toLocaleString()} \${c.unit})</span></div>
                <div class="d-row"><span class="d-lbl">Distance / Time</span> <span class="d-val">\${c.distance} NM / \${c.durationDays.toFixed(1)} days</span></div>
                <div style="height:1px; background:#333; margin:10px 0;"></div>
                <div class="d-row"><span class="d-lbl">Gross Revenue</span> <span class="d-val pos">+\$\${f.revenue.toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">Bunker Cost (Fuel)</span> <span class="d-val neg">-\$\${f.fuelCost.toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">Port Dues & Agency</span> <span class="d-val neg">-\$\${f.portDues.toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">Canal Fees</span> <span class="d-val neg">-\$\${f.canalFee.toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">Vessel OpEx</span> <span class="d-val neg">-\$\${f.opex.toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">Broker Comm. (3.75%)</span> <span class="d-val neg">-\$\${f.commission.toLocaleString()}</span></div>
                <div style="height:1px; background:#444; margin:10px 0;"></div>
                <div class="d-row" style="font-size:1.2rem; margin-top:10px; font-family:var(--font-tech);">
                    <span class="d-lbl" style="color:#fff">NET PROFIT</span> 
                    <span class="d-val" style="color:\${f.profit > 0 ? '#00f2ff' : '#ff0055'}">\$\${f.profit.toLocaleString()}</span>
                </div>
            \`;
            document.getElementById('financialDetails').innerHTML = html;
            document.getElementById('aiText').innerHTML = c.aiAnalysis;
            document.getElementById('resBox').style.display = 'block';
        }

        function drawRoute(geoJSON, load, disch) {
            layerGroup.clearLayers();
            L.geoJSON(geoJSON, { style: { color: '#00f2ff', weight: 8, opacity: 0.3 } }).addTo(layerGroup);
            const line = L.geoJSON(geoJSON, { style: { color: '#00f2ff', weight: 3, opacity: 1, dashArray: '10, 15', lineCap: 'round' } }).addTo(layerGroup);
            const c = geoJSON.coordinates;
            L.circleMarker([c[0][1], c[0][0]], {radius:6, color:'#00f2ff', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup("LOAD: " + load);
            L.circleMarker([c[c.length-1][1], c[c.length-1][0]], {radius:6, color:'#bc13fe', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup("DISCH: " + disch);
            map.fitBounds(line.getBounds(), {padding: [50, 50]});
        }
    </script>
</body>
</html>
`;

// =================================================================
// 2. BACKEND & DATA
// =================================================================

// --- LİMAN VERİTABANI YÜKLEME ---
let PORT_DB = {};
try {
    const rawData = fs.readFileSync(path.join(__dirname, 'ports.json'));
    const jsonData = JSON.parse(rawData);
    for (const [key, val] of Object.entries(jsonData)) {
        PORT_DB[key.toUpperCase()] = { lat: val[1], lng: val[0] };
    }
    console.log(`✅ ${Object.keys(PORT_DB).length} Ports Loaded Successfully.`);
} catch (error) { console.error("❌ Ports Error: ports.json missing."); }

// --- CANLI PİYASA VERİSİ ---
let MARKET_DATA = { brent: 80.0, vlsfo: 640.0, lastUpdate: 0 };
async function updateMarketData() {
    if (Date.now() - MARKET_DATA.lastUpdate < 3600000) return; // 1 saat cache
    try {
        const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d');
        const data = await res.json();
        const brentPrice = data.chart.result[0].meta.regularMarketPrice;
        if (brentPrice) {
            MARKET_DATA.brent = brentPrice;
            MARKET_DATA.vlsfo = brentPrice * 8.2; 
            MARKET_DATA.lastUpdate = Date.now();
        }
    } catch (e) {}
}

const VESSEL_SPECS = {
    "HANDYSIZE": { type: "BULK", dwt: 35000, speed: 13.0, cons: 22, opex: 4500 },
    "SUPRAMAX":  { type: "BULK", dwt: 58000, speed: 13.5, cons: 28, opex: 5500 },
    "PANAMAX":   { type: "BULK", dwt: 82000, speed: 13.0, cons: 34, opex: 6500 },
    "CAPESIZE":  { type: "BULK", dwt: 180000, speed: 12.5, cons: 45, opex: 8000 },
    "MR_TANKER": { type: "TANKER", dwt: 50000, speed: 13.0, cons: 26, opex: 6500 },
    "AFRAMAX":   { type: "TANKER", dwt: 115000, speed: 12.5, cons: 40, opex: 7500 },
    "VLCC":      { type: "TANKER", dwt: 300000, speed: 12.0, cons: 65, opex: 10000 },
    "LNG_STD":   { type: "GAS", dwt: 90000, speed: 19.0, cons: 80, opex: 14000 }
};

const COMMODITY_DB = {
    "BULK": [{name:"Steel Products",rate:35}, {name:"Bulk Wheat",rate:28}, {name:"Thermal Coal",rate:22}, {name:"Iron Ore",rate:18}],
    "TANKER": [{name:"Crude Oil",rate:25}, {name:"Diesel/Gasoil",rate:30}, {name:"Naphtha",rate:28}],
    "GAS": [{name:"LNG",rate:85}, {name:"LPG",rate:65}]
};

// --- ROTA MOTORU: SEAROUTE LIBRARY INTEGRATION ---
// Gemi artık karadan yürümez. Searoute kütüphanesi en kısa deniz yolunu bulur.
function getSmartRoute(startPort, endPort) {
    const origin = [startPort.lng, startPort.lat];
    const dest = [endPort.lng, endPort.lat];

    try {
        // Fonksiyonu güvenli bir şekilde çağır (V23 Fix)
        const route = searoute(origin, dest); 
        
        const distNM = Math.round(route.properties.length / 1852);
        
        // Kanal kontrolü
        let canal = "NONE";
        const hasSuez = route.geometry.coordinates.some(c => c[1] > 29 && c[1] < 32 && c[0] > 32 && c[0] < 33);
        const hasPanama = route.geometry.coordinates.some(c => c[1] > 8 && c[1] < 10 && c[0] > -80 && c[0] < -79);
        
        if (hasSuez) canal = "SUEZ";
        if (hasPanama) canal = "PANAMA";

        return {
            path: route.geometry,
            dist: distNM,
            desc: "Optimized Sea Route",
            canal: canal
        };
    } catch (e) {
        console.error("Searoute Error:", e);
        // Fallback
        return {
            path: { type: "LineString", coordinates: [origin, dest] },
            dist: 1000,
            desc: "Direct (Fallback)",
            canal: "NONE"
        };
    }
}

// --- BROKER ENGINE ---
function generateAIAnalysis(profit, routeDesc, duration, revenue, vType) {
    const margin = (profit / revenue) * 100;
    let text = `<strong>AI STRATEGY (${vType}):</strong><br>`;
    text += `Route: ${routeDesc}. Duration: ${duration.toFixed(1)} days.<br>`;
    
    if (margin > 25) text += `<span style="color:#00ff9d">HIGH YIELD. Strong recommendation. Fix immediately.</span>`;
    else if (margin > 10) text += `<span style="color:#00f2ff">Solid fixture. Above market average.</span>`;
    else if (margin > 0) text += `<span style="color:#ffb700">Marginal return. Use for repositioning only.</span>`;
    else text += `<span style="color:#ff0055">NEGATIVE. High risk. Avoid unless COA commitment.</span>`;
    return text;
}

function findOpportunities(shipPosName, region, vType) {
    const shipPort = PORT_DB[shipPosName];
    if (!shipPort) return [];

    const specs = VESSEL_SPECS[vType] || VESSEL_SPECS["SUPRAMAX"];
    const category = specs.type;
    const commodities = COMMODITY_DB[category];
    const opportunities = [];

    const targets = Object.keys(PORT_DB).filter(p => {
        if(p === shipPosName) return false;
        const port = PORT_DB[p];
        if(region === 'AMERICAS') return port.lng < -30;
        if(region === 'ASIA') return port.lng > 60;
        if(region === 'EUROPE') return port.lat > 48;
        if(region === 'MED') return port.lat > 30 && port.lat < 46 && port.lng > -6 && port.lng < 36;
        return true;
    });

    for(let i=0; i<5; i++) {
        if(targets.length === 0) break;
        const randIndex = Math.floor(Math.random() * targets.length);
        const destName = targets[randIndex];
        targets.splice(randIndex, 1);
        
        const route = getSmartRoute(shipPort, PORT_DB[destName]);
        
        const comm = commodities[Math.floor(Math.random() * commodities.length)];
        const qty = Math.min(specs.dwt * 0.95, 25000 + Math.random()*40000); 
        const freightRate = comm.rate + (Math.random() * 5 - 2.5);
        
        const duration = route.dist / (specs.speed * 24);
        const revenue = qty * freightRate;
        const fuelCost = duration * specs.cons * MARKET_DATA.vlsfo; 
        const opex = duration * specs.opex;
        const portDues = 40000 + (specs.dwt * 0.4);
        
        let canalFee = 0;
        if(route.canal === "SUEZ") canalFee = 180000 + (specs.dwt * 0.5);
        if(route.canal === "PANAMA") canalFee = 150000 + (specs.dwt * 0.4);
        
        const commission = revenue * 0.0375;
        const totalExp = fuelCost + opex + portDues + canalFee + commission;
        const profit = revenue - totalExp;

        const aiText = generateAIAnalysis(profit, route.desc, duration, revenue, vType);

        if(profit > -100000) { 
            opportunities.push({
                loadPort: shipPosName, dischPort: destName, commodity: comm.name, qty: Math.floor(qty), unit: "mt",
                routeGeo: route.path, distance: route.dist, durationDays: duration, aiAnalysis: aiText,
                financials: { revenue: Math.round(revenue), fuelCost: Math.round(fuelCost), opex: Math.round(opex), portDues: Math.round(portDues), canalFee: Math.round(canalFee), commission: Math.round(commission), profit: Math.round(profit) }
            });
        }
    }
    return opportunities.sort((a,b) => b.financials.profit - a.financials.profit);
}

// --- API ROUTES ---
app.get('/', (req, res) => res.send(FRONTEND_HTML));
app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));
app.get('/api/market-data', async (req, res) => { await updateMarketData(); res.json(MARKET_DATA); });
app.get('/api/broker', async (req, res) => {
    const { shipPos, region, vType } = req.query;
    if (!PORT_DB[shipPos]) return res.json({ success: false, error: "Unknown Port" });
    await updateMarketData();
    const results = findOpportunities(shipPos, region, vType);
    res.json({ success: true, cargoes: results });
});

app.listen(port, () => console.log(`VIYA BROKER V23 (LEVIATHAN FIX) running on port ${port}`));
