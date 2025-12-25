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
    console.log("✅ SEAROUTE ENGINE: ONLINE (Precision Mode)");
} catch (e) {
    console.error("⚠️ SEAROUTE FAILED. Fallback active.");
    searoute = null;
}

// Node 18+ Native Fetch
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
    <title>VIYA BROKER | Precision</title>
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
        .res-title { font-family: var(--font-tech); color: var(--neon-cyan); font-size: 1rem; letter-spacing: 1px; }
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
    <div class="loader" id="loader"><div style="text-align: center;"><div class="spinner" style="margin: 0 auto 20px;"></div><div style="font-family: var(--font-tech); color: var(--neon-cyan); font-size:1.2rem;">CALCULATING ROUTES...</div></div></div>

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
                <div class="d-row"><span class="d-lbl">Method</span> <span class="d-val" style="color:var(--neon-cyan)">\${c.routeMethod}</span></div>
                <div style="height:1px; background:#333; margin:10px 0;"></div>
                <div class="d-row"><span class="d-lbl">Revenue</span> <span class="d-val pos">+\$\${f.revenue.toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">Fuel Cost</span> <span class="d-val neg">-\$\${f.fuelCost.toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">Port/Canal Fees</span> <span class="d-val neg">-\$\${(f.portDues+f.canalFee).toLocaleString()}</span></div>
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
            L.geoJSON(geoJSON, { style: { color: '#00f2ff', weight: 4, opacity: 0.8 } }).addTo(layerGroup);
            const c = geoJSON.coordinates;
            L.circleMarker([c[0][1], c[0][0]], {radius:6, color:'#00f2ff', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup("LOAD: " + load);
            L.circleMarker([c[c.length-1][1], c[c.length-1][0]], {radius:6, color:'#bc13fe', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup("DISCH: " + disch);
            map.fitBounds(L.geoJSON(geoJSON).getBounds(), {padding: [50, 50]});
        }
    </script>
</body>
</html>
`;

// =================================================================
// 2. BACKEND & INTELLIGENCE
// =================================================================

let PORT_DB = {};
try {
    const rawData = fs.readFileSync(path.join(__dirname, 'ports.json'));
    const jsonData = JSON.parse(rawData);
    for (const [key, val] of Object.entries(jsonData)) {
        PORT_DB[key.toUpperCase()] = { lat: parseFloat(val[1]), lng: parseFloat(val[0]) };
    }
} catch (e) { console.error("Ports missing"); }

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
    "VLCC":      { type: "TANKER", dwt: 300000, speed: 12.0, cons: 65, opex: 10000 }
};

const COMMODITY_DB = {
    "BULK": [{name:"Steel Products",rate:35}, {name:"Bulk Wheat",rate:28}, {name:"Thermal Coal",rate:22}, {name:"Iron Ore",rate:18}],
    "TANKER": [{name:"Crude Oil",rate:25}, {name:"Diesel/Gasoil",rate:30}, {name:"Naphtha",rate:28}]
};

// --- EFSANE V11 YEDEK PROTOKOLÜ (MANUEL OTOYOL) ---
// Not: Searoute bozulursa devreye girecek olan kemik yapı.
const SEA_NETWORK = {
    BOSPHORUS: [[29.1, 41.25], [29.05, 41.1], [28.98, 41.0], [28.95, 40.95]],
    MARMARA: [[28.5, 40.8], [27.5, 40.7]],
    DARDANELLES: [[26.7, 40.4], [26.4, 40.15], [26.2, 40.0]],
    AEGEAN_EXIT: [[25.8, 39.5], [25.0, 38.0], [23.5, 36.0]],
    GIBRALTAR: [[-5.6, 35.95]],
    SUEZ: [[32.55, 31.3], [32.56, 29.9], [43.4, 12.6]],
    PANAMA: [[-79.9, 9.3], [-79.6, 8.9]],
    CAPE_GOOD_HOPE: [[20.0, -36.0]] // Afrika dolaşma ihtimali için
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

// --- JIGGLE (TİTREŞİM) FONKSİYONU ---
// Searoute limanı karada sanarsa, denize doğru 4 yöne kaydırıp tekrar dener.
function tryGetRoute(start, end) {
    if (!searoute) return null; // Kütüphane yoksa direkt çık

    // 1. Orijinal noktaları dene
    try {
        const route = searoute([start.lng, start.lat], [end.lng, end.lat]);
        if (route && route.geometry) return { geo: route.geometry, dist: Math.round(route.properties.length / 1852), source: "Searoute (Direct)" };
    } catch(e) {}

    // 2. Jiggle (Kaydırma) Dene (Kuzey, Güney, Doğu, Batı - 0.1 derece)
    const shifts = [[0.1,0], [-0.1,0], [0,0.1], [0,-0.1]];
    for (let s of shifts) {
        try {
            // Sadece Start noktasını kaydırıp dene
            const newStart = [start.lng + s[0], start.lat + s[1]];
            const route = searoute(newStart, [end.lng, end.lat]);
            if (route && route.geometry) return { geo: route.geometry, dist: Math.round(route.properties.length / 1852), source: "Searoute (Adjusted)" };
        } catch(e) {}
    }
    
    return null; // Hala olmuyorsa null dön
}

// --- AKILLI ROTA MOTORU ---
function getSmartRoute(startPort, endPort) {
    let result = tryGetRoute(startPort, endPort);
    
    // Eğer Searoute başardıysa onu döndür
    if (result) {
        // Kanal kontrolü
        let canal = "NONE";
        const coords = result.geo.coordinates;
        if (coords.some(c => c[1] > 29 && c[1] < 32 && c[0] > 32 && c[0] < 33)) canal = "SUEZ";
        if (coords.some(c => c[1] > 8 && c[1] < 10 && c[0] > -80 && c[0] < -79)) canal = "PANAMA";
        return { path: result.geo, dist: result.dist, desc: "Optimized Sea Route", canal: canal, method: result.source };
    }

    // --- FALLBACK: MANUEL ROTA (V11+) ---
    // Searoute çalışmadıysa burası devreye girer
    const origin = [startPort.lng, startPort.lat];
    const dest = [endPort.lng, endPort.lat];
    let path = [origin];
    let canal = "NONE";

    // Karadeniz Çıkışı
    if (startPort.lng > 27 && startPort.lat > 40) {
        path = path.concat(SEA_NETWORK.BOSPHORUS, SEA_NETWORK.MARMARA, SEA_NETWORK.DARDANELLES, SEA_NETWORK.AEGEAN_EXIT);
    }

    // Okyanus Geçişleri
    if (endPort.lng < -30) { // Amerika
        if (startPort.lng > 0) path.push(SEA_NETWORK.GIBRALTAR[0]);
        if (endPort.lng < -80 && endPort.lat < 20) {
            path = path.concat(SEA_NETWORK.PANAMA);
            canal = "PANAMA";
        }
    } else if (endPort.lng > 60 && startPort.lng < 40) { // Asya
        path = path.concat(SEA_NETWORK.SUEZ);
        canal = "SUEZ";
    }

    path.push(dest);
    let dist = 0;
    for(let i=0; i<path.length-1; i++) dist += calculateDistance(path[i], path[i+1]);
    
    return { path: { type: "LineString", coordinates: path }, dist: Math.round(dist * 1.15), desc: "Manual Fallback Route", canal: canal, method: "Fallback (V11)" };
}

function generateAIAnalysis(profit, routeDesc, duration, revenue, vType) {
    const margin = (profit / revenue) * 100;
    let text = `<strong>AI STRATEGY (${vType}):</strong><br>`;
    text += `Route: ${routeDesc}. Duration: ${duration.toFixed(1)} days.<br>`;
    if (margin > 25) text += `<span style="color:#00ff9d">HIGH YIELD. Recommended.</span>`;
    else if (margin > 10) text += `<span style="color:#00f2ff">Solid fixture.</span>`;
    else text += `<span style="color:#ff0055">Low Margin. Caution.</span>`;
    return text;
}

function findOpportunities(shipPosName, region, vType) {
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

    for(let i=0; i<5; i++) {
        if(targets.length === 0) break;
        const randIndex = Math.floor(Math.random() * targets.length);
        const destName = targets[randIndex];
        targets.splice(randIndex, 1);
        
        const route = getSmartRoute(shipPort, PORT_DB[destName]);
        
        const comm = commodities[Math.floor(Math.random() * commodities.length)];
        const qty = Math.min(specs.dwt * 0.95, 25000 + Math.random()*40000); 
        const revenue = qty * comm.rate;
        const fuelCost = (route.dist / 24 / specs.speed) * specs.cons * MARKET_DATA.vlsfo; 
        const opex = (route.dist / 24 / specs.speed) * specs.opex;
        const portDues = 40000 + (specs.dwt * 0.4);
        
        let canalFee = 0;
        if(route.canal === "SUEZ") canalFee = 200000;
        if(route.canal === "PANAMA") canalFee = 180000;
        
        const commission = revenue * 0.0375;
        const profit = revenue - (fuelCost + opex + portDues + canalFee + commission);

        if(profit > -100000) {
            opportunities.push({
                loadPort: shipPosName, dischPort: destName, commodity: comm.name, qty: Math.floor(qty), unit: "mt",
                routeGeo: route.path, distance: route.dist, durationDays: route.dist / (specs.speed * 24), aiAnalysis: generateAIAnalysis(profit, route.desc, route.dist / (specs.speed * 24), revenue, vType),
                routeMethod: route.method,
                financials: { revenue: Math.round(revenue), fuelCost: Math.round(fuelCost), opex: Math.round(opex), portDues: Math.round(portDues), canalFee: Math.round(canalFee), commission: Math.round(commission), profit: Math.round(profit) }
            });
        }
    }
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

app.listen(port, () => console.log(`VIYA BROKER V35 (PRECISION OPS) running on port ${port}`));
