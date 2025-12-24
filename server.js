import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// import fetch from 'node-fetch'; <-- BU SATIRI SİLDİK, ARTIK GEREK YOK

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- 1. FRONTEND KODU (AYNI GÖRKEMLİ YAPI) ---
const FRONTEND_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VIYA BROKER | Global Maritime Intelligence</title>
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
        .brand i { color: var(--neon-cyan); }
        .nav-links { display: flex; gap: 20px; }
        .nav-links a { color: var(--text-muted); text-decoration: none; font-weight: 600; transition: 0.3s; cursor: pointer; }
        .nav-links a:hover { color: var(--neon-cyan); }
        .btn-nav { background: transparent; border: 1px solid var(--neon-cyan); color: var(--neon-cyan); padding: 8px 25px; border-radius: 50px; font-family: var(--font-tech); cursor: pointer; transition: 0.3s; font-size: 0.8rem; }
        .btn-nav:hover { background: var(--neon-cyan); color: #000; box-shadow: 0 0 20px rgba(0,242,255,0.4); }

        #landing-view { display: block; }
        .hero { height: 100vh; background: linear-gradient(rgba(3,5,8,0.7), rgba(3,5,8,1)), url('https://images.unsplash.com/photo-1559827291-72ee739d0d9a?q=80&w=2874&auto=format&fit=crop'); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; text-align: center; }
        .hero h1 { font-family: var(--font-tech); font-size: 3.5rem; margin-bottom: 20px; background: linear-gradient(to right, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero p { font-size: 1.2rem; color: var(--text-muted); max-width: 600px; margin: 0 auto 40px auto; }
        .btn-hero { background: linear-gradient(135deg, var(--neon-cyan), #00aaff); border: none; color: #000; padding: 18px 45px; font-size: 1rem; font-weight: 800; font-family: var(--font-tech); cursor: pointer; border-radius: 5px; box-shadow: 0 0 30px rgba(0,242,255,0.3); transition: 0.3s; }
        .btn-hero:hover { transform: translateY(-5px); box-shadow: 0 0 50px rgba(0,242,255,0.6); }

        #dashboard-view { display: none; padding-top: 80px; height: 100vh; }
        .dash-grid { display: grid; grid-template-columns: 380px 1fr; gap: 20px; padding: 20px; height: calc(100vh - 80px); }
        .sidebar { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 15px; box-shadow: 0 0 30px rgba(0,0,0,0.5); overflow-y: auto; }
        .sidebar h3 { font-family: var(--font-tech); color: var(--neon-cyan); border-bottom: 1px solid #333; padding-bottom: 10px; font-size: 0.9rem; margin-top:10px; }
        .input-group label { display: block; font-size: 0.75rem; color: #8892b0; margin-bottom: 5px; font-weight: 600; }
        .input-group input, .input-group select { width: 100%; background: #0b1221; border: 1px solid #233554; color: #fff; padding: 10px; border-radius: 4px; font-family: var(--font-ui); font-size: 0.9rem; }
        .btn-action { background: linear-gradient(135deg, var(--neon-cyan), #00aaff); border: none; color: #000; padding: 12px; font-weight: 800; font-family: var(--font-tech); cursor: pointer; border-radius: 5px; width: 100%; transition: 0.3s; margin-top: 5px; }
        
        .cargo-list { margin-top: 10px; border-top: 1px solid #333; padding-top: 10px; }
        .cargo-item { background: rgba(255,255,255,0.03); border: 1px solid #333; padding: 12px; border-radius: 6px; margin-bottom: 8px; cursor: pointer; transition: 0.2s; }
        .cargo-item:hover { border-color: var(--neon-cyan); background: rgba(0,242,255,0.05); }
        .cargo-item.active { border-color: var(--neon-cyan); background: rgba(0,242,255,0.1); box-shadow: 0 0 15px rgba(0,242,255,0.1); }
        .c-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
        .c-route { font-size: 0.85rem; font-weight: 700; color: #fff; }
        .c-profit { font-family: var(--font-tech); font-weight: 900; color: var(--success); font-size: 1rem; }
        
        .map-container { position: relative; border-radius: 10px; overflow: hidden; border: 1px solid var(--border-color); background: #000; box-shadow: 0 0 30px rgba(0,0,0,0.5); }
        #map { width: 100%; height: 100%; }
        
        .results-box { position: absolute; bottom: 20px; right: 20px; z-index: 500; background: var(--panel-bg); border: 1px solid #333; border-radius: 8px; padding: 20px; width: 380px; max-height: 500px; overflow-y: auto; backdrop-filter: blur(10px); box-shadow: 0 0 30px rgba(0,0,0,0.8); display: none; }
        .d-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.85rem; }
        .d-val.pos { color: var(--success); }
        .d-val.neg { color: var(--danger); }
        .ai-box { margin-top: 15px; padding: 10px; background: rgba(0, 242, 255, 0.05); border-left: 3px solid var(--neon-cyan); font-size: 0.8rem; color: #e2e8f0; line-height: 1.5; font-style: italic; }

        .loader { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.9); z-index: 2000; place-items: center; }
        .spinner { width: 50px; height: 50px; border: 3px solid var(--neon-cyan); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .toast { position: fixed; top: 20px; right: 20px; background: #0f172a; border-left: 4px solid var(--neon-cyan); color: #fff; padding: 15px 25px; z-index: 3000; display: none; }
    </style>
</head>
<body>
    <div class="toast" id="toast">Notification</div>
    <div class="loader" id="loader"><div style="text-align: center;"><div class="spinner" style="margin: 0 auto 20px;"></div><div style="font-family: var(--font-tech); color: var(--neon-cyan);">AI NAVIGATOR CALCULATING...</div></div></div>

    <nav>
        <div class="brand"><i class="fa-solid fa-anchor"></i> VIYA BROKER</div>
        <div class="nav-links">
            <a onclick="showLanding()">Home</a>
            <a onclick="showLanding()">Solutions</a>
            <a onclick="showLanding()">Contact</a>
        </div>
        <button class="btn-nav" onclick="openLogin()">CLIENT LOGIN</button>
    </nav>

    <div id="landing-view">
        <header class="hero">
            <div class="hero-content">
                <h1>NEXT GENERATION<br>MARITIME INTELLIGENCE</h1>
                <p>Advanced routing, real-time bunker costs, and AI-driven commercial decisions for Bulk, Tanker & LNG.</p>
                <button class="btn-hero" onclick="openLogin()">ENTER PLATFORM</button>
            </div>
        </header>
    </div>

    <div id="dashboard-view">
        <div class="dash-grid">
            <aside class="sidebar">
                <h3><i class="fa-solid fa-ship"></i> VESSEL CONFIGURATION</h3>
                
                <div class="input-group">
                    <label>VESSEL CLASS</label>
                    <select id="vType">
                        <optgroup label="DRY BULK">
                            <option value="HANDYSIZE">Handysize (35k)</option>
                            <option value="SUPRAMAX">Supramax (58k)</option>
                            <option value="PANAMAX">Panamax (82k)</option>
                            <option value="CAPESIZE">Capesize (180k)</option>
                        </optgroup>
                        <optgroup label="TANKER">
                            <option value="MR_TANKER">MR Tanker (50k)</option>
                            <option value="AFRAMAX">Aframax (115k)</option>
                            <option value="VLCC">VLCC (300k)</option>
                        </optgroup>
                        <optgroup label="GAS">
                            <option value="LNG_STD">LNG Standard (174k)</option>
                        </optgroup>
                    </select>
                </div>
                <div class="input-group">
                    <label>CURRENT POSITION</label>
                    <input type="text" id="vLoc" list="portList" value="ISTANBUL" oninput="this.value = this.value.toUpperCase()">
                </div>
                <div style="height:1px; background:#333; margin:10px 0;"></div>
                <h3><i class="fa-solid fa-globe"></i> COMMERCIAL SCAN</h3>
                <div class="input-group">
                    <label>TARGET MARKET</label>
                    <select id="vRegion">
                        <option value="WORLD">GLOBAL (Best Yield)</option>
                        <option value="AMERICAS">Americas</option>
                        <option value="ASIA">Asia / Far East</option>
                        <option value="EUROPE">Europe</option>
                        <option value="MED">Mediterranean</option>
                    </select>
                </div>
                <button class="btn-action" onclick="scanMarket()">FIND CARGOES</button>
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
        function showLanding() { document.getElementById('dashboard-view').style.display = 'none'; document.getElementById('landing-view').style.display = 'block'; }
        
        async function loadPorts() {
            try { const res = await fetch('/api/ports'); const ports = await res.json(); 
            const dl = document.getElementById('portList'); ports.forEach(p => { const opt = document.createElement('option'); opt.value = p; dl.appendChild(opt); });
            } catch(e) {}
        }
        loadPorts();

        async function scanMarket() {
            const shipPos = document.getElementById('vLoc').value.toUpperCase();
            const region = document.getElementById('vRegion').value;
            const vType = document.getElementById('vType').value;
            const loader = document.getElementById('loader');
            loader.style.display = 'grid'; layerGroup.clearLayers(); document.getElementById('resBox').style.display = 'none'; document.getElementById('cargoResultList').style.display = 'none';

            try {
                const res = await fetch(\`/api/broker?shipPos=\${shipPos}&region=\${region}&vType=\${vType}\`);
                const data = await res.json();
                if(data.success) displayCargoes(data.cargoes);
                else alert(data.error);
            } catch(e) { alert("Error"); } finally { loader.style.display = 'none'; }
        }

        function displayCargoes(cargoes) {
            const list = document.getElementById('cargoResultList'); list.innerHTML = '<div style="font-size:0.75rem; color:#888; margin-bottom:10px;">OPPORTUNITIES:</div>'; list.style.display = 'block';
            cargoes.forEach(c => {
                const div = document.createElement('div'); div.className = 'cargo-item';
                div.innerHTML = \`<div class="c-header"><div class="c-route">\${c.loadPort} -> \${c.dischPort}</div><div class="c-profit">$\${(c.financials.profit/1000).toFixed(1)}k</div></div><div class="c-sub"><span>\${c.commodity}</span><span>\${c.durationDays.toFixed(0)} days</span></div>\`;
                div.onclick = () => selectCargo(c, div); list.appendChild(div);
            });
            if(cargoes.length > 0) selectCargo(cargoes[0], list.children[1]);
        }

        function selectCargo(c, el) {
            document.querySelectorAll('.cargo-item').forEach(x => x.classList.remove('active')); el.classList.add('active');
            drawRoute(c.routeGeo, c.loadPort, c.dischPort);
            
            const f = c.financials;
            const html = \`
                <div class="d-row"><span class="d-lbl">Route</span> <span class="d-val">\${c.loadPort} to \${c.dischPort}</span></div>
                <div class="d-row"><span class="d-lbl">Cargo</span> <span class="d-val">\${c.commodity} (\${c.qty.toLocaleString()} mt)</span></div>
                <div class="d-row"><span class="d-lbl">Dist/Time</span> <span class="d-val">\${c.distance} NM / \${c.durationDays.toFixed(1)} d</span></div>
                <div style="height:1px; background:#333; margin:10px 0;"></div>
                <div class="d-row"><span class="d-lbl">Revenue</span> <span class="d-val pos">+\$\${f.revenue.toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">Fuel</span> <span class="d-val neg">-\$\${f.fuelCost.toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">Fees/Port</span> <span class="d-val neg">-\$\${(f.portDues+f.canalFee).toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">OpEx</span> <span class="d-val neg">-\$\${f.opex.toLocaleString()}</span></div>
                <div style="height:1px; background:#444; margin:10px 0;"></div>
                <div class="d-row" style="font-size:1.1rem; margin-top:5px;"><span class="d-lbl" style="color:#fff">PROFIT</span> <span class="d-val" style="color:\${f.profit > 0 ? '#00f2ff' : '#ff0055'}">\$\${f.profit.toLocaleString()}</span></div>
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
            L.circleMarker([c[0][1], c[0][0]], {radius:6, color:'#00f2ff', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup("LOAD");
            L.circleMarker([c[c.length-1][1], c[c.length-1][0]], {radius:6, color:'#bc13fe', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup("DISCH");
            map.fitBounds(line.getBounds(), {padding: [50, 50]});
        }
    </script>
</body>
</html>
`;

// --- 2. BACKEND VERİSİ ---

let PORT_DB = {};
try {
    const rawData = fs.readFileSync(path.join(__dirname, 'ports.json'));
    const jsonData = JSON.parse(rawData);
    for (const [key, val] of Object.entries(jsonData)) {
        PORT_DB[key.toUpperCase()] = { lat: val[1], lng: val[0] };
    }
    console.log(`✅ ${Object.keys(PORT_DB).length} Ports Loaded.`);
} catch (error) { console.error("Ports Error"); }

let MARKET_DATA = { brent: 80.0, vlsfo: 640.0, lastUpdate: 0 };
async function updateMarketData() {
    if (Date.now() - MARKET_DATA.lastUpdate < 3600000) return;
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
    "BULK": [{name:"Steel",rate:35}, {name:"Grain",rate:28}, {name:"Coal",rate:22}, {name:"Ore",rate:18}],
    "TANKER": [{name:"Crude",rate:25}, {name:"Diesel",rate:30}, {name:"Naptha",rate:28}],
    "GAS": [{name:"LNG",rate:85}, {name:"LPG",rate:65}]
};

// --- GLOBAL SEA HIGHWAY GRID (DENİZ OTOYOLU AĞI - V17) ---
// Bu noktalar gemilerin karaya çarpmasını engeller ve gerçekçi rota çizer.
const SEA_HUBS = {
    // 1. BOĞAZLAR VE KANALLAR
    BOSPHORUS: [29.0, 41.1],
    DARDANELLES: [26.4, 40.2],
    GIBRALTAR: [-5.6, 35.95],
    SUEZ_N: [32.55, 31.3],
    SUEZ_S: [32.56, 29.9],
    BAB_EL_MANDEB: [43.4, 12.6],
    MALACCA: [103.8, 1.3],
    PANAMA_ATL: [-79.9, 9.3],
    PANAMA_PAC: [-79.5, 8.9],
    ENGLISH_CHANNEL: [-1.0, 50.0],
    SKAGEN: [10.6, 57.7], // Baltık Girişi
    
    // 2. STRATEJİK DÖNÜŞ NOKTALARI
    AEGEAN_EXIT: [23.5, 36.0], // Mora Güneyi
    MED_CENTRAL: [12.0, 37.2], // Sicilya-Tunus
    FINISTERRE: [-10.0, 43.0], // İspanya Köşesi
    USHANT: [-6.0, 48.5], // Fransa Köşesi
    AZORES: [-25.0, 38.0], // Orta Atlantik
    FLORIDA_STRAIT: [-80.0, 24.5], // Key West
    CAPE_HATTERAS: [-75.0, 35.0], // US East Coast Off
    GOOD_HOPE: [18.5, -35.0], // Ümit Burnu
    SRI_LANKA: [80.6, 5.8] // Hint Okyanusu Ucu
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

// --- AKILLI ROTA MOTORU (GRAPH ROUTING) ---
function getSmartRoute(startPort, endPort) {
    const start = [startPort.lng, startPort.lat];
    const end = [endPort.lng, endPort.lat];
    let path = [start];
    let routeDesc = "Direct";
    let canal = "NONE";

    const isBlackSea = (p) => p.lng > 27 && p.lat > 40.8 && p.lat < 47;
    const isMarmara = (p) => p.lng > 27 && p.lng < 30 && p.lat > 40 && p.lat < 41.2;
    const isMed = (p) => p.lat > 30 && p.lat < 46 && p.lng > -6 && p.lng < 36 && !isBlackSea(p);
    const isNorthEurope = (p) => p.lat > 48 && p.lng > -10 && p.lng < 30;
    const isAmericas = (p) => p.lng < -30;
    const isAsia = (p) => p.lng > 60;
    const isGulf = (p) => p.lng < -80 && p.lat < 31 && p.lat > 18; // Meksika Körfezi

    // 1. KARADENİZ ÇIKIŞ PROTOKOLÜ (Fix for Turkey Cut)
    if (isBlackSea(startPort) || isMarmara(startPort)) {
        if(isBlackSea(startPort)) path.push(SEA_HUBS.BOSPHORUS);
        path.push(SEA_HUBS.DARDANELLES);
        path.push(SEA_HUBS.AEGEAN_EXIT);
    } else if (isMed(startPort) && startPort.lng > 24) {
        path.push(SEA_HUBS.AEGEAN_EXIT);
    }

    // 2. KUZEY AVRUPA ÇIKIŞ PROTOKOLÜ (Fix for Spain/France Cut)
    if (isNorthEurope(startPort) && (isMed(endPort) || isAsia(endPort) || isAmericas(endPort))) {
        path.push(SEA_HUBS.ENGLISH_CHANNEL);
        path.push(SEA_HUBS.USHANT);
        path.push(SEA_HUBS.FINISTERRE);
    }

    // 3. AMERİKA GİDİŞ (ATLANTİK GEÇİŞİ)
    if (isAmericas(endPort) && (isMed(startPort) || isBlackSea(startPort) || isNorthEurope(startPort))) {
        // Avrupa/Akdeniz'den geliyorsa
        if (!isNorthEurope(startPort)) { // Akdeniz'den geliyorsa önce Gibraltar
            path.push(SEA_HUBS.MED_CENTRAL);
            path.push(SEA_HUBS.GIBRALTAR);
        }
        // Ortak Atlantik Rotası
        path.push(SEA_HUBS.AZORES);
        
        // Amerika Varış (Florida/Gulf ise aşağı kır)
        if (isGulf(endPort)) {
            path.push(SEA_HUBS.FLORIDA_STRAIT);
        } else {
            path.push(SEA_HUBS.CAPE_HATTERAS);
        }
        path.push(end);
        routeDesc = "Trans-Atlantic";
    }
    // 4. ASYA GİDİŞ (SÜVEYŞ)
    else if (isAsia(endPort) && (isMed(startPort) || isNorthEurope(startPort) || isBlackSea(startPort))) {
        if (!isNorthEurope(startPort) && !isBlackSea(startPort)) path.push(SEA_HUBS.MED_CENTRAL); // Akdeniz ortası
        path.push(SEA_HUBS.SUEZ_N);
        path.push(SEA_HUBS.SUEZ_S);
        path.push(SEA_HUBS.BAB_EL_MANDEB);
        path.push(SEA_HUBS.SRI_LANKA);
        path.push(SEA_HUBS.MALACCA);
        path.push(end);
        routeDesc = "Via Suez & Malacca";
        canal = "SUEZ";
    }
    // DİĞER
    else {
        path.push(end);
    }

    // Mesafe
    let dist = 0;
    for(let i=0; i<path.length-1; i++) dist += calculateDistance(path[i], path[i+1]);
    
    return { 
        path: { type: "LineString", coordinates: path }, 
        dist: Math.round(dist * 1.1),
        desc: routeDesc,
        canal: canal
    };
}

// --- BROKER ENGINE ---
function generateAIAnalysis(profit, routeDesc, duration, revenue, vType) {
    const margin = (profit / revenue) * 100;
    let text = `<strong>AI ANALYSIS (${vType}):</strong><br>Route: ${routeDesc}. Time: ${duration.toFixed(1)} days.<br>`;
    if (margin > 20) text += `<span style="color:#00ff9d">STRONG FIX. High margin (${margin.toFixed(1)}%). Recommended.</span>`;
    else if (margin > 0) text += `<span style="color:#ffb700">Marginal return. Good for repositioning.</span>`;
    else text += `<span style="color:#ff0055">NEGATIVE YIELD. Avoid unless strategic.</span>`;
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
        const destName = targets[Math.floor(Math.random() * targets.length)];
        const route = getSmartRoute(shipPort, PORT_DB[destName]);
        
        const comm = commodities[Math.floor(Math.random() * commodities.length)];
        const qty = Math.min(specs.dwt * 0.95, 25000 + Math.random()*40000); 
        const freightRate = comm.rate + (Math.random() * 5 - 2.5);
        
        const duration = route.dist / (specs.speed * 24);
        const revenue = qty * freightRate;
        const fuelCost = duration * specs.cons * MARKET_DATA.vlsfo; 
        const opex = duration * specs.opex;
        const portDues = 40000 + (specs.dwt * 0.4);
        let canalFee = route.canal === "SUEZ" ? 180000 + (specs.dwt * 0.5) : 0;
        
        const profit = revenue - (fuelCost + opex + portDues + canalFee + (revenue*0.0375));
        const aiText = generateAIAnalysis(profit, route.desc, duration, revenue, vType);

        if(profit > -50000) {
            opportunities.push({
                loadPort: shipPosName, dischPort: destName, commodity: comm.name, qty: Math.floor(qty), unit: "mt",
                routeGeo: route.path, distance: route.dist, durationDays: duration, aiAnalysis: aiText,
                financials: { revenue: Math.round(revenue), fuelCost: Math.round(fuelCost), opex: Math.round(opex), portDues: Math.round(portDues), canalFee: Math.round(canalFee), commission: Math.round(revenue*0.0375), profit: Math.round(profit) }
            });
        }
    }
    return opportunities.sort((a,b) => b.financials.profit - a.financials.profit);
}

// --- API ROUTES ---
app.get('/', (req, res) => res.send(FRONTEND_HTML));
app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));
app.get('/api/broker', async (req, res) => {
    const { shipPos, region, vType } = req.query;
    if (!PORT_DB[shipPos]) return res.json({ success: false, error: "Unknown Port" });
    await updateMarketData();
    const results = findOpportunities(shipPos, region, vType);
    res.json({ success: true, cargoes: results });
});

app.listen(port, () => console.log(`VIYA BROKER V17 (GLOBAL NAVIGATOR) running on port ${port}`));
