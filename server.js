import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// --- KÜTÜPHANE YÜKLEME ---
const require = createRequire(import.meta.url);
let searoute = null;

try {
    const pkg = require('searoute');
    searoute = (typeof pkg === 'function') ? pkg : (pkg.default || pkg);
    console.log("✅ SEAROUTE: ONLINE & READY TO SWAP");
} catch (e) {
    console.error("❌ CRITICAL: searoute missing.");
    process.exit(1); 
}

const fetch = globalThis.fetch;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// =================================================================
// 1. FRONTEND
// =================================================================
const FRONTEND_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VIYA BROKER | Swap Master</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Orbitron:wght@400;600;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        :root { --neon-cyan: #00f2ff; --neon-purple: #bc13fe; --deep-space: #030508; --panel-bg: rgba(10, 15, 25, 0.95); --card-bg: rgba(255, 255, 255, 0.03); --border-color: rgba(255, 255, 255, 0.1); --text-main: #e0e6ed; --text-muted: #94a3b8; --font-ui: 'Plus Jakarta Sans', sans-serif; --font-tech: 'Orbitron', sans-serif; --success: #00ff9d; --danger: #ff0055; --warning: #ffb700; }
        * { box-sizing: border-box; margin: 0; padding: 0; scroll-behavior: smooth; }
        body { background-color: var(--deep-space); color: var(--text-main); font-family: var(--font-ui); overflow-x: hidden; font-size:14px; }
        nav { position: fixed; top: 0; width: 100%; z-index: 1000; background: rgba(3, 5, 8, 0.95); backdrop-filter: blur(15px); border-bottom: 1px solid var(--border-color); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        .brand { font-family: var(--font-tech); font-weight: 900; font-size: 1.4rem; letter-spacing: 1px; color: #fff; display: flex; align-items: center; gap: 10px; }
        .live-ticker { font-family: var(--font-tech); font-size: 0.8rem; color: var(--text-muted); display:flex; gap:20px; align-items:center; }
        .btn-nav { background: transparent; border: 1px solid var(--neon-cyan); color: var(--neon-cyan); padding: 8px 25px; border-radius: 50px; font-family: var(--font-tech); cursor: pointer; transition: 0.3s; font-size: 0.8rem; }
        .btn-nav:hover { background: var(--neon-cyan); color: #000; box-shadow: 0 0 20px rgba(0,242,255,0.4); }
        #landing-view { display: block; }
        .hero { height: 100vh; background: linear-gradient(rgba(3,5,8,0.7), rgba(3,5,8,1)), url('https://images.unsplash.com/photo-1559827291-72ee739d0d9a?q=80&w=2874&auto=format&fit=crop'); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; text-align: center; }
        .hero h1 { font-family: var(--font-tech); font-size: 4rem; line-height: 1.1; margin-bottom: 20px; background: linear-gradient(to right, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 30px rgba(0,242,255,0.2); }
        .btn-hero { background: linear-gradient(135deg, var(--neon-cyan), #00aaff); border: none; color: #000; padding: 20px 50px; font-size: 1.1rem; font-weight: 800; font-family: var(--font-tech); cursor: pointer; border-radius: 5px; box-shadow: 0 0 30px rgba(0,242,255,0.3); transition: 0.3s; letter-spacing: 1px; }
        #dashboard-view { display: none; padding-top: 80px; height: 100vh; }
        .dash-grid { display: grid; grid-template-columns: 400px 1fr; gap: 20px; padding: 20px; height: calc(100vh - 80px); }
        .sidebar { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 25px; display: flex; flex-direction: column; gap: 20px; box-shadow: 0 0 30px rgba(0,0,0,0.5); overflow-y: auto; }
        .input-group label { display: block; font-size: 0.75rem; color: #8892b0; margin-bottom: 8px; font-weight: 600; letter-spacing: 0.5px; }
        .input-group input, .input-group select { width: 100%; background: #0b1221; border: 1px solid #233554; color: #fff; padding: 14px; border-radius: 6px; font-family: var(--font-ui); font-size: 0.95rem; transition: all 0.3s ease; }
        .btn-action { background: linear-gradient(135deg, var(--neon-cyan), #00aaff); border: none; color: #000; padding: 16px; font-size: 1rem; font-weight: 800; font-family: var(--font-tech); cursor: pointer; border-radius: 6px; width: 100%; transition: 0.3s; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .cargo-list { margin-top: 20px; border-top: 1px solid #333; padding-top: 20px; }
        .cargo-item { background: rgba(255,255,255,0.03); border: 1px solid #333; padding: 15px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: 0.2s; position: relative; overflow: hidden; }
        .cargo-item:hover { border-color: var(--neon-cyan); background: rgba(0,242,255,0.05); }
        .cargo-item.active { border-color: var(--neon-cyan); background: rgba(0,242,255,0.15); box-shadow: 0 0 20px rgba(0,242,255,0.1); }
        .c-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .c-route { font-size: 0.95rem; font-weight: 700; color: #fff; }
        .c-profit { font-family: var(--font-tech); font-weight: 900; color: var(--success); font-size: 1.1rem; }
        .c-sub { font-size: 0.8rem; color: #94a3b8; display: flex; justify-content: space-between; }
        .map-container { position: relative; border-radius: 10px; overflow: hidden; border: 1px solid var(--border-color); background: #000; box-shadow: 0 0 30px rgba(0,0,0,0.5); }
        #map { width: 100%; height: 100%; }
        .results-box { position: absolute; bottom: 25px; right: 25px; z-index: 500; background: var(--panel-bg); border: 1px solid #333; border-radius: 10px; padding: 25px; width: 400px; max-height: 600px; overflow-y: auto; backdrop-filter: blur(15px); box-shadow: 0 0 40px rgba(0,0,0,0.8); display: none; }
        .res-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 15px; }
        .d-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; }
        .d-lbl { color: #94a3b8; }
        .d-val { color: #fff; font-weight: 500; }
        .d-val.pos { color: var(--success); }
        .d-val.neg { color: var(--danger); }
        .ai-box { margin-top: 20px; padding: 15px; background: rgba(0, 242, 255, 0.05); border-left: 3px solid var(--neon-cyan); font-size: 0.85rem; color: #e2e8f0; line-height: 1.6; font-style: italic; border-radius: 0 5px 5px 0; }
        .loader { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.9); z-index: 2000; place-items: center; }
        .spinner { width: 60px; height: 60px; border: 4px solid var(--neon-cyan); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="loader" id="loader"><div style="text-align: center;"><div class="spinner" style="margin: 0 auto 20px;"></div><div style="font-family: var(--font-tech); color: var(--neon-cyan); font-size:1.2rem;">CORRECTING COORDINATES...</div></div></div>

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
                <p>The ultimate AI-powered maritime intelligence platform.</p>
                <button class="btn-hero" onclick="openLogin()">ACCESS TERMINAL</button>
            </div>
        </header>
    </div>

    <div id="dashboard-view">
        <div class="dash-grid">
            <aside class="sidebar">
                <div style="font-family:var(--font-tech); color:var(--neon-cyan); margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:10px;">VESSEL CONFIGURATION</div>
                <div class="input-group">
                    <label>VESSEL CLASS</label>
                    <select id="vType">
                        <option value="SUPRAMAX">Supramax (58k)</option>
                        <option value="PANAMAX">Panamax (82k)</option>
                        <option value="CAPESIZE">Capesize (180k)</option>
                        <option value="MR_TANKER">MR Tanker (50k)</option>
                        <option value="VLCC">VLCC (300k)</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>CURRENT PORT</label>
                    <input type="text" id="vLoc" list="portList" value="ISTANBUL" oninput="this.value = this.value.toUpperCase()">
                </div>
                
                <div style="height:1px; background:#333; margin:20px 0;"></div>
                
                <div style="font-family:var(--font-tech); color:var(--neon-cyan); margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:10px;">COMMERCIAL SCAN</div>
                <div class="input-group">
                    <label>REGION</label>
                    <select id="vRegion">
                        <option value="WORLD">GLOBAL SEARCH</option>
                        <option value="AMERICAS">Americas</option>
                        <option value="ASIA">Asia & Far East</option>
                        <option value="EUROPE">Europe</option>
                        <option value="MED">Mediterranean</option>
                    </select>
                </div>
                <button class="btn-action" onclick="scanMarket()">SCAN MARKET</button>
                <div id="cargoResultList" class="cargo-list" style="display:none;"></div>
                <datalist id="portList"></datalist>
            </aside>
            <div class="map-container">
                <div id="map"></div>
                <div class="results-box" id="resBox">
                    <div class="res-header"><span class="res-title">VOYAGE ESTIMATION</span><i class="fa-solid fa-chart-pie" style="color:var(--neon-cyan)"></i></div>
                    <div id="financialDetails"></div>
                    <div class="ai-box" id="aiText">Select a cargo...</div>
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
            list.innerHTML = '';
            list.style.display = 'block';
            
            if(cargoes.length === 0) {
                list.innerHTML = '<div style="color:var(--danger); padding:10px;">No routes. Check logs.</div>';
                return;
            }

            cargoes.forEach((c) => {
                const div = document.createElement('div');
                div.className = 'cargo-item';
                div.innerHTML = \`<div class="c-header"><div class="c-route">\${c.loadPort} -> \${c.dischPort}</div><div class="c-profit">$\${(c.financials.profit/1000).toFixed(1)}k</div></div><div class="c-sub"><span>\${c.commodity} • \${c.qty.toLocaleString()} mt</span><span>\${c.durationDays.toFixed(0)} days</span></div>\`;
                div.onclick = () => selectCargo(c, div);
                list.appendChild(div);
            });
            if(cargoes.length > 0) selectCargo(cargoes[0], list.children[0]);
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
                <div class="d-row"><span class="d-lbl">Method</span> <span class="d-val" style="color:var(--neon-cyan)">\${c.searchMethod}</span></div>
                <div style="height:1px; background:#333; margin:10px 0;"></div>
                <div class="d-row"><span class="d-lbl">Revenue</span> <span class="d-val pos">+\$\${f.revenue.toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">Fuel Cost</span> <span class="d-val neg">-\$\${f.fuelCost.toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">Fees</span> <span class="d-val neg">-\$\${(f.portDues+f.canalFee).toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">OpEx</span> <span class="d-val neg">-\$\${f.opex.toLocaleString()}</span></div>
                <div style="height:1px; background:#444; margin:10px 0;"></div>
                <div class="d-row" style="font-size:1.2rem; margin-top:5px;"><span class="d-lbl" style="color:#fff">PROFIT</span> <span class="d-val" style="color:\${f.profit > 0 ? '#00f2ff' : '#ff0055'}">\$\${f.profit.toLocaleString()}</span></div>
            \`;
            document.getElementById('financialDetails').innerHTML = html;
            document.getElementById('aiText').innerHTML = c.aiAnalysis;
            document.getElementById('resBox').style.display = 'block';
        }

        function drawRoute(geoJSON, load, disch) {
            layerGroup.clearLayers();
            if(geoJSON && geoJSON.coordinates) {
                L.geoJSON(geoJSON, { style: { color: '#00f2ff', weight: 4, opacity: 0.8 } }).addTo(layerGroup);
                
                const flatCoords = flattenCoordinates(geoJSON.coordinates);
                if(flatCoords.length > 0) {
                    const startPoint = flatCoords[0];
                    const endPoint = flatCoords[flatCoords.length - 1];
                    L.circleMarker([startPoint[1], startPoint[0]], {radius:6, color:'#00f2ff', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup("START");
                    L.circleMarker([endPoint[1], endPoint[0]], {radius:6, color:'#bc13fe', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup("END");
                    map.fitBounds(L.geoJSON(geoJSON).getBounds(), {padding: [50, 50]});
                }
            }
        }

        function flattenCoordinates(coords) {
            if (!Array.isArray(coords)) return [];
            if (typeof coords[0] === 'number') return [coords];
            if (typeof coords[0][0] === 'number') return coords;
            return coords.flat(1);
        }
    </script>
</body>
</html>
`;

// =================================================================
// 2. BACKEND & LOGIC (SWAP MASTER ENGINE)
// =================================================================

let PORT_DB = {};
try {
    const rawData = fs.readFileSync(path.join(__dirname, 'ports.json'));
    const jsonData = JSON.parse(rawData);
    for (const [key, val] of Object.entries(jsonData)) {
        PORT_DB[key.toUpperCase()] = { lat: parseFloat(val[1]), lng: parseFloat(val[0]) };
    }
    console.log(`✅ DATABASE: ${Object.keys(PORT_DB).length} ports loaded.`);
} catch (e) { console.error("❌ ERROR: ports.json missing."); }

let MARKET_DATA = { brent: 80.0, vlsfo: 640.0, lastUpdate: 0 };
async function updateMarketData() {
    if (Date.now() - MARKET_DATA.lastUpdate < 3600000) return;
    try {
        const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d');
        const data = await res.json();
        const price = data.chart.result[0].meta.regularMarketPrice;
        if(price) { MARKET_DATA.brent = price; MARKET_DATA.vlsfo = price * 8.2; MARKET_DATA.lastUpdate = Date.now(); }
    } catch(e) {}
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
    "TANKER": [{name:"Crude Oil",rate:25}, {name:"Diesel/Gasoil",rate:30}, {name:"Naphtha",rate:28}]
};

function calculateDistance(coord1, coord2) {
    const R = 3440;
    const lat1 = coord1[1]; const lon1 = coord1[0];
    const lat2 = coord2[1]; const lon2 = coord2[0];
    const dLat = (lat2 - lat1) * Math.PI/180;
    const dLon = (lon2 - lon1) * Math.PI/180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// --- INTELLIGENT ROUTER (SWAP & SPIRAL) ---
function getIntelligentRoute(start, end) {
    if (!searoute) return null;

    console.log(`🔍 INTEL: [${start.lat},${start.lng}] -> [${end.lat},${end.lng}]`);

    // PERMUTASYONLAR (Kombinasyon Denemesi)
    // C1: Normal [lng, lat]
    // C2: Start Swapped [lat, lng]
    // C3: End Swapped [lat, lng]
    // C4: Both Swapped [lat, lng]
    
    const candidates = [
        { s: [start.lng, start.lat], e: [end.lng, end.lat], id: "Normal" },
        { s: [start.lat, start.lng], e: [end.lng, end.lat], id: "Swap Start" },
        { s: [start.lng, start.lat], e: [end.lat, end.lng], id: "Swap End" },
        { s: [start.lat, start.lng], e: [end.lat, end.lng], id: "Swap Both" }
    ];

    // Önce direkt kombinasyonları dene
    for(let cand of candidates) {
        try {
            const route = searoute(cand.s, cand.e);
            if(route && route.geometry) {
                console.log(`✅ FOUND: ${cand.id}`);
                const dist = Math.round(route.properties.length / 1852);
                return { geo: route.geometry, dist: dist, method: cand.id };
            }
        } catch(e) {}
    }

    // Olmadı mı? O zaman Swaplanmış koordinatları "Spiral" ile denize it.
    // Çünkü belki doğru koordinat "Swap Start"tır ama yine de limanda rıhtımda kalıyordur.
    const steps = [0.05, 0.1, 0.5, 1.0];
    const directions = [[0,1], [0,-1], [1,0], [-1,0]];

    for(let cand of candidates) {
        // Start'ı oynat
        for(let step of steps) {
            for(let dir of directions) {
                const adjStart = [cand.s[0] + (dir[0]*step), cand.s[1] + (dir[1]*step)];
                try {
                    const route = searoute(adjStart, cand.e);
                    if(route && route.geometry) {
                        const dist = Math.round(route.properties.length / 1852);
                        // Tugboat hesabı
                        const tug = calculateDistance([cand.s[0], cand.s[1]], adjStart); // Basit hesap (x=lon olarak kabul)
                        return { geo: route.geometry, dist: dist + Math.round(tug), method: `${cand.id} + Offset` };
                    }
                } catch(e) {}
            }
        }
    }

    console.log("❌ FAILED: All combinations dead.");
    return null;
}

function generateAIAnalysis(profit, method, duration, revenue, vType) {
    let text = `<strong>AI STRATEGY (${vType}):</strong><br>`;
    text += `Method: ${method}. Time: ${duration.toFixed(1)} days.<br>`;
    const margin = (profit / revenue) * 100;
    if (margin > 20) text += `<span style="color:#00ff9d">PRIME VOYAGE.</span>`;
    else if (margin > 5) text += `<span style="color:#00f2ff">STANDARD.</span>`;
    else text += `<span style="color:#ff0055">MARGINAL.</span>`;
    return text;
}

function findOpportunities(shipPosName, region, vType) {
    console.log(`🚀 SCANNING: ${shipPosName} -> ${region}`);
    
    const shipPort = PORT_DB[shipPosName];
    if (!shipPort) return [];

    const specs = VESSEL_SPECS[vType] || VESSEL_SPECS["SUPRAMAX"];
    const commodities = COMMODITY_DB[specs.type] || COMMODITY_DB["BULK"];
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

    for(let i=0; i<6; i++) {
        if(targets.length === 0) break;
        const randIndex = Math.floor(Math.random() * targets.length);
        const destName = targets[randIndex];
        targets.splice(randIndex, 1);
        const destPort = PORT_DB[destName];
        
        const route = getIntelligentRoute(shipPort, destPort);
        
        if (route) {
            const comm = commodities[Math.floor(Math.random() * commodities.length)];
            const qty = Math.min(specs.dwt * 0.95, 25000 + Math.random()*40000); 
            const revenue = qty * comm.rate;
            const fuelCost = (route.dist / 24 / specs.speed) * specs.cons * MARKET_DATA.vlsfo; 
            const opex = (route.dist / 24 / specs.speed) * specs.opex;
            const portDues = 40000 + (specs.dwt * 0.4);
            
            let canalFee = 0;
            // Basit kanal tahmini
            if ((shipPort.lng < 40 && destPort.lng > 60) || (shipPort.lng > 60 && destPort.lng < 40)) canalFee += 200000;
            if ((shipPort.lng > -30 && destPort.lng < -100) || (shipPort.lng < -100 && destPort.lng > -30)) canalFee += 180000;

            const commission = revenue * 0.0375;
            const profit = revenue - (fuelCost + opex + portDues + canalFee + commission);

            if(profit > -1000000) {
                opportunities.push({
                    loadPort: shipPosName, dischPort: destName, commodity: comm.name, qty: Math.floor(qty), unit: "mt",
                    routeGeo: route.geo, distance: route.dist, durationDays: route.dist / (specs.speed * 24), 
                    aiAnalysis: generateAIAnalysis(profit, route.method, route.dist / (specs.speed * 24), revenue, vType),
                    searchMethod: route.method,
                    financials: { revenue: Math.round(revenue), fuelCost: Math.round(fuelCost), opex: Math.round(opex), portDues: Math.round(portDues), canalFee: Math.round(canalFee), commission: Math.round(commission), profit: Math.round(profit) }
                });
            }
        }
    }
    console.log(`🏁 FINISHED: ${opportunities.length} routes found.`);
    return opportunities.sort((a,b) => b.financials.profit - a.financials.profit);
}

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

app.listen(port, () => console.log(`VIYA BROKER V48 (SWAP MASTER) running on port ${port}`));
