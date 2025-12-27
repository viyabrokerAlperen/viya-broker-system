import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const fetch = globalThis.fetch;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// =================================================================
// 1. DATA & CONFIG (V56'dan Aynen Korundu)
// =================================================================

const VESSEL_SPECS = {
    "SUPRAMAX": { dwt: 58000, default_speed: 13.5, sea_cons: 28, port_cons: 3.5, opex: 5500 }, 
    "PANAMAX":  { dwt: 82000, default_speed: 13.0, sea_cons: 34, port_cons: 4.0, opex: 6500 },
    "CAPESIZE": { dwt: 180000, default_speed: 12.5, sea_cons: 45, port_cons: 5.0, opex: 8000 },
    "MR_TANKER": { dwt: 50000, default_speed: 13.0, sea_cons: 26, port_cons: 4.5, opex: 6800 },
    "AFRAMAX":  { dwt: 115000, default_speed: 12.5, sea_cons: 40, port_cons: 6.0, opex: 7800 },
    "VLCC":     { dwt: 300000, default_speed: 12.0, sea_cons: 65, port_cons: 8.0, opex: 10500 }
};

const CARGOES = {
    "BULK": [
        {name: "Grain", rate: 32, loadRate: 15000, dischRate: 10000},
        {name: "Coal", rate: 24, loadRate: 25000, dischRate: 20000},
        {name: "Iron Ore", rate: 19, loadRate: 40000, dischRate: 30000},
        {name: "Steel Products", rate: 45, loadRate: 8000, dischRate: 6000},
        {name: "Fertilizer", rate: 29, loadRate: 12000, dischRate: 10000},
        {name: "Scrap", rate: 35, loadRate: 10000, dischRate: 8000}
    ],
    "TANKER": [
        {name: "Crude Oil", rate: 28, loadRate: 50000, dischRate: 40000},
        {name: "Diesel/Gasoil", rate: 35, loadRate: 3000, dischRate: 3000},
        {name: "Naphtha", rate: 31, loadRate: 3500, dischRate: 3500},
        {name: "Jet Fuel", rate: 38, loadRate: 2500, dischRate: 2500}
    ]
};

// GLOBAL MARKET STATE
let MARKET = { 
    brent: 0, 
    heatingOil: 0, // NYMEX Heating Oil (Proxy for MGO)
    vlsfo: 0, 
    mgo: 0, 
    lastUpdate: 0 
};

let PORT_DB = {};
try {
    const rawData = fs.readFileSync(path.join(__dirname, 'ports.json'));
    const jsonData = JSON.parse(rawData);
    for (const [key, val] of Object.entries(jsonData)) {
        PORT_DB[key.toUpperCase()] = { lat: parseFloat(val[1]), lng: parseFloat(val[0]) };
    }
    console.log(`✅ DATABASE: ${Object.keys(PORT_DB).length} ports loaded.`);
} catch (e) { console.error("❌ ERROR: ports.json missing."); }


// =================================================================
// 2. FRONTEND (MULTI-VIEW INTERFACE)
// =================================================================
const FRONTEND_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VIYA BROKER | Maritime Hub</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Orbitron:wght@400;600;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        :root { --neon-cyan: #00f2ff; --neon-purple: #bc13fe; --deep-space: #030508; --panel-bg: rgba(15, 23, 42, 0.96); --card-bg: rgba(255, 255, 255, 0.05); --border-color: rgba(255, 255, 255, 0.1); --text-main: #e2e8f0; --text-muted: #94a3b8; --font-ui: 'Plus Jakarta Sans', sans-serif; --font-tech: 'Orbitron', sans-serif; --success: #10b981; --danger: #ef4444; --warning: #f59e0b; }
        * { box-sizing: border-box; margin: 0; padding: 0; scroll-behavior: smooth; }
        body { background-color: var(--deep-space); color: var(--text-main); font-family: var(--font-ui); overflow-x: hidden; font-size:13px; }
        
        /* Navigation */
        nav { position: fixed; top: 0; width: 100%; z-index: 1000; background: rgba(3, 5, 8, 0.95); backdrop-filter: blur(15px); border-bottom: 1px solid var(--border-color); padding: 0.8rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        .brand { font-family: var(--font-tech); font-weight: 900; font-size: 1.4rem; letter-spacing: 1px; color: #fff; display: flex; align-items: center; gap: 10px; cursor:pointer; }
        .nav-links { display: flex; gap: 20px; }
        .nav-item { color: var(--text-muted); cursor: pointer; font-weight: 600; transition: 0.3s; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
        .nav-item:hover, .nav-item.active { color: var(--neon-cyan); text-shadow: 0 0 10px rgba(0,242,255,0.5); }
        
        .live-ticker { font-family: var(--font-tech); font-size: 0.75rem; color: var(--text-muted); display:flex; gap:20px; align-items:center; }
        .live-dot { height: 8px; width: 8px; background-color: var(--success); border-radius: 50%; display: inline-block; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

        /* Views */
        .view-section { display: none; padding-top: 80px; height: 100vh; animation: fadeIn 0.5s; }
        .view-section.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* Dashboard Grid (Existing) */
        .dash-grid { display: grid; grid-template-columns: 380px 1fr 450px; gap: 15px; padding: 15px; height: calc(100vh - 80px); }
        .panel { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; }
        .p-header { padding: 15px; border-bottom: 1px solid var(--border-color); font-family: var(--font-tech); color: var(--neon-cyan); font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center; }
        .p-body { padding: 15px; overflow-y: auto; flex: 1; }

        /* Form Elements */
        .input-group { margin-bottom: 15px; }
        .input-group label { display: block; font-size: 0.7rem; color: #94a3b8; margin-bottom: 6px; font-weight: 600; letter-spacing: 0.5px; }
        .input-group input, .input-group select { width: 100%; background: #0b1221; border: 1px solid #334155; color: #fff; padding: 12px; border-radius: 4px; font-family: var(--font-ui); font-size: 0.9rem; transition: all 0.3s ease; }
        .btn-action { background: linear-gradient(135deg, var(--neon-cyan), #00aaff); border: none; color: #000; padding: 14px; font-size: 0.9rem; font-weight: 800; font-family: var(--font-tech); cursor: pointer; border-radius: 4px; width: 100%; transition: 0.3s; margin-top: 10px; letter-spacing: 1px; }
        
        /* Cards */
        .cargo-item { background: var(--card-bg); border: 1px solid var(--border-color); padding: 12px; border-radius: 6px; margin-bottom: 10px; cursor: pointer; transition: 0.2s; }
        .cargo-item:hover, .cargo-item.active { border-color: var(--neon-cyan); background: rgba(0,242,255,0.05); }
        .tce-badge { background: #064e3b; color: #34d399; padding: 2px 6px; border-radius: 4px; font-family: var(--font-tech); font-size: 0.75rem; }

        #map { width: 100%; height: 100%; background: #000; }

        /* ACADEMY & DOCS STYLES */
        .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; padding: 20px; max-width: 1400px; margin: 0 auto; }
        .info-card { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; transition: 0.3s; position: relative; overflow: hidden; }
        .info-card:hover { transform: translateY(-5px); border-color: var(--neon-cyan); box-shadow: 0 5px 20px rgba(0,0,0,0.5); }
        .ic-icon { font-size: 2rem; color: var(--neon-purple); margin-bottom: 15px; }
        .ic-title { font-family: var(--font-tech); font-size: 1.1rem; color: #fff; margin-bottom: 10px; }
        .ic-desc { color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; margin-bottom: 15px; }
        .btn-small { background: transparent; border: 1px solid var(--border-color); color: #fff; padding: 5px 15px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; transition: 0.2s; }
        .btn-small:hover { border-color: var(--neon-cyan); color: var(--neon-cyan); }

        /* PRICING STYLES */
        .pricing-grid { display: flex; justify-content: center; gap: 30px; padding: 50px 20px; align-items: center; }
        .price-card { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 30px; width: 320px; text-align: center; position: relative; transition:0.3s; }
        .price-card.featured { border-color: var(--neon-cyan); transform: scale(1.05); box-shadow: 0 0 30px rgba(0,242,255,0.15); }
        .pc-title { font-family: var(--font-tech); font-size: 1.5rem; margin-bottom: 10px; color: #fff; }
        .pc-price { font-size: 2.5rem; font-weight: 700; color: #fff; margin-bottom: 20px; }
        .pc-price span { font-size: 1rem; color: var(--text-muted); font-weight: 400; }
        .pc-features { list-style: none; padding: 0; text-align: left; margin-bottom: 30px; }
        .pc-features li { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #ccc; }
        .pc-features li i { color: var(--success); margin-right: 10px; }
        .btn-price { width: 100%; padding: 12px; background: #fff; color: #000; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; font-family: var(--font-tech); }
        .featured .btn-price { background: var(--neon-cyan); }

        /* Stats & Details */
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
        .stat-card { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border: 1px solid #333; text-align: center; }
        .stat-val { font-family: var(--font-tech); font-size: 1.1rem; color: #fff; font-weight: 700; }
        .stat-lbl { font-size: 0.7rem; color: #94a3b8; margin-top: 4px; text-transform: uppercase; }
        .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; }
        .d-val.neg { color: var(--danger); }
        .d-val.pos { color: var(--success); }

        .loader { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.9); z-index: 2000; place-items: center; }
        .spinner { width: 50px; height: 50px; border: 3px solid var(--neon-cyan); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .blinking { animation: blinker 2s linear infinite; color: var(--success); font-weight:bold;}
        @keyframes blinker { 50% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="loader" id="loader"><div style="text-align: center;"><div class="spinner" style="margin: 0 auto 15px;"></div><div style="font-family: var(--font-tech); color: var(--neon-cyan); font-size:1rem;">PROCESSING...</div></div></div>

    <nav>
        <div class="brand" onclick="switchView('dashboard')"><i class="fa-solid fa-anchor"></i> VIYA BROKER</div>
        <div class="nav-links">
            <div class="nav-item active" onclick="switchView('dashboard')">Terminal</div>
            <div class="nav-item" onclick="switchView('academy')">Academy</div>
            <div class="nav-item" onclick="switchView('docs')">Documents</div>
            <div class="nav-item" onclick="switchView('pricing')">Plans</div>
        </div>
        <div class="live-ticker">
            <div class="ticker-item"><span class="live-dot"></span> LIVE</div>
            <div class="ticker-item"><i class="fa-solid fa-droplet"></i> BRENT: <span id="oilPrice" class="blinking">...</span></div>
            <div class="ticker-item"><i class="fa-solid fa-fire"></i> MGO: <span id="hoPrice">...</span></div>
            <div class="ticker-item"><i class="fa-solid fa-gas-pump"></i> VLSFO: <span id="vlsfoPrice">...</span></div>
        </div>
    </nav>

    <div id="dashboard" class="view-section active">
        <div class="dash-grid">
            <aside class="panel">
                <div class="p-header"><i class="fa-solid fa-ship"></i> VESSEL CONFIG</div>
                <div class="p-body">
                    <div class="input-group"><label>VESSEL CLASS</label><select id="vType" onchange="updateSpeed()"><option value="SUPRAMAX">Supramax</option><option value="PANAMAX">Panamax</option><option value="CAPESIZE">Capesize</option><option value="MR_TANKER">MR Tanker</option><option value="AFRAMAX">Aframax</option></select></div>
                    <div class="input-group"><label>LAT/LNG (AUTO FILL)</label><input type="text" id="refPort" list="portList" placeholder="Select Reference Port..." onchange="fillCoords()"></div>
                    <div class="input-group"><div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;"><input type="number" id="vLat" placeholder="Lat"><input type="number" id="vLng" placeholder="Lng"></div></div>
                    <div class="input-group"><label>SPEED (KTS)</label><input type="number" id="vSpeed" value="13.5"></div>
                    <button class="btn-action" onclick="scanMarket()">FIND CARGOES</button>
                    <div id="cargoResultList" class="cargo-list" style="margin-top:20px; display:none;"></div>
                </div>
            </aside>
            <div class="panel">
                <div id="map"></div>
                <div style="position:absolute; bottom:20px; left:20px; z-index:500; background:rgba(0,0,0,0.8); padding:10px; border-radius:5px; color:#fff; font-size:0.75rem; border:1px solid #333;">
                    <div style="display:flex; align-items:center; margin-bottom:5px;"><span style="width:10px; height:10px; background:#f59e0b; border-radius:50%; margin-right:8px; display:inline-block;"></span> Vessel</div>
                    <div style="display:flex; align-items:center; margin-bottom:5px;"><span style="width:10px; height:10px; background:#10b981; border-radius:50%; margin-right:8px; display:inline-block;"></span> Load</div>
                    <div style="display:flex; align-items:center;"><span style="width:10px; height:10px; background:#ef4444; border-radius:50%; margin-right:8px; display:inline-block;"></span> Disch</div>
                </div>
            </div>
            <aside class="panel">
                <div class="p-header"><i class="fa-solid fa-chart-pie"></i> ANALYSIS</div>
                <div class="p-body" id="analysisPanel" style="display:none;">
                    <div class="stat-grid">
                        <div class="stat-card"><div class="stat-val" id="dispTCE" style="color:var(--neon-cyan)">$0</div><div class="stat-lbl">TCE / Day</div></div>
                        <div class="stat-card"><div class="stat-val" id="dispProfit" style="color:var(--success)">$0</div><div class="stat-lbl">Net Profit</div></div>
                    </div>
                    <div id="financialDetails"></div>
                    <div class="ai-insight" id="aiOutput"></div>
                </div>
                <div class="p-body" id="emptyState" style="text-align:center; padding-top:50px; color:#555;">Scan to view data.</div>
            </aside>
        </div>
    </div>

    <div id="academy" class="view-section">
        <div style="text-align:center; margin-bottom:30px;">
            <h1 style="font-family:var(--font-tech); font-size:2.5rem; color:#fff;">VIYA ACADEMY</h1>
            <p style="color:var(--text-muted);">Critical knowledge for the modern shipbroker.</p>
        </div>
        <div class="grid-container" id="academyGrid"></div>
    </div>

    <div id="docs" class="view-section">
        <div style="text-align:center; margin-bottom:30px;">
            <h1 style="font-family:var(--font-tech); font-size:2.5rem; color:#fff;">DOCUMENT CENTER</h1>
            <p style="color:var(--text-muted);">Standard Charter Parties & Clauses templates.</p>
        </div>
        <div class="grid-container" id="docsGrid"></div>
    </div>

    <div id="pricing" class="view-section">
        <div class="pricing-grid">
            <div class="price-card">
                <div class="pc-title">CADET</div>
                <div class="pc-price">$0 <span>/mo</span></div>
                <ul class="pc-features">
                    <li><i class="fa-solid fa-check"></i> Basic Distance Calc</li>
                    <li><i class="fa-solid fa-check"></i> 5 Scans per Day</li>
                    <li><i class="fa-solid fa-xmark" style="color:#555"></i> Financial Analysis</li>
                </ul>
                <button class="btn-price">CURRENT PLAN</button>
            </div>
            <div class="price-card featured">
                <div style="position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:var(--neon-cyan); color:#000; padding:2px 10px; font-weight:bold; font-size:0.7rem; border-radius:4px;">MOST POPULAR</div>
                <div class="pc-title">BROKER PRO</div>
                <div class="pc-price">$49 <span>/mo</span></div>
                <ul class="pc-features">
                    <li><i class="fa-solid fa-check"></i> Unlimited Scans</li>
                    <li><i class="fa-solid fa-check"></i> TCE & Profit Analysis</li>
                    <li><i class="fa-solid fa-check"></i> Real-time Market Data</li>
                    <li><i class="fa-solid fa-check"></i> Document Library</li>
                </ul>
                <button class="btn-price">UPGRADE NOW</button>
            </div>
            <div class="price-card">
                <div class="pc-title">OWNER</div>
                <div class="pc-price">$199 <span>/mo</span></div>
                <ul class="pc-features">
                    <li><i class="fa-solid fa-check"></i> Everything in Pro</li>
                    <li><i class="fa-solid fa-check"></i> API Access</li>
                    <li><i class="fa-solid fa-check"></i> Custom Reports</li>
                    <li><i class="fa-solid fa-check"></i> 24/7 AI Consultant</li>
                </ul>
                <button class="btn-price">CONTACT SALES</button>
            </div>
        </div>
    </div>

    <datalist id="portList"></datalist>

    <script>
        // --- NAVIGATION LOGIC ---
        function switchView(viewId) {
            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            document.getElementById(viewId).classList.add('active');
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            if(viewId === 'dashboard') document.querySelectorAll('.nav-item')[0].classList.add('active');
            if(viewId === 'academy') document.querySelectorAll('.nav-item')[1].classList.add('active');
            if(viewId === 'docs') document.querySelectorAll('.nav-item')[2].classList.add('active');
            if(viewId === 'pricing') document.querySelectorAll('.nav-item')[3].classList.add('active');
            if(viewId === 'dashboard') setTimeout(() => map.invalidateSize(), 100);
        }

        // --- CONTENT GENERATION ---
        const ACADEMY_DATA = [
            {icon: "fa-scale-balanced", title: "Laytime Calculation", desc: "Understanding Laytime, Demurrage and Despatch. How to calculate time saved or lost."},
            {icon: "fa-globe", title: "INCOTERMS 2020", desc: "Difference between FOB, CIF, and CFR. Who pays for freight and insurance?"},
            {icon: "fa-file-contract", title: "Charter Parties", desc: "Key differences between Time Charter (NYPE) and Voyage Charter (Gencon)."},
            {icon: "fa-ship", title: "ECA Zones", desc: "Emission Control Areas regulations. Sulphur limits in SECA (0.1%) vs Global (0.5%)."}
        ];

        const DOCS_DATA = [
            {icon: "fa-file-pdf", title: "GENCON 94", desc: "Standard Voyage Charter Party template. The most widely used form."},
            {icon: "fa-file-lines", title: "NYPE 2015", desc: "New York Produce Exchange form for Time Charters."},
            {icon: "fa-envelope-open-text", title: "Notice of Readiness", desc: "Standard NOR template to trigger laytime."},
            {icon: "fa-clipboard-check", title: "Statement of Facts", desc: "SOF template for port agents."}
        ];

        function loadContent() {
            const aGrid = document.getElementById('academyGrid');
            ACADEMY_DATA.forEach(item => {
                aGrid.innerHTML += \`
                    <div class="info-card">
                        <i class="fa-solid \${item.icon} ic-icon"></i>
                        <div class="ic-title">\${item.title}</div>
                        <div class="ic-desc">\${item.desc}</div>
                        <button class="btn-small">READ ARTICLE</button>
                    </div>\`;
            });

            const dGrid = document.getElementById('docsGrid');
            DOCS_DATA.forEach(item => {
                dGrid.innerHTML += \`
                    <div class="info-card">
                        <i class="fa-solid \${item.icon} ic-icon" style="color:var(--neon-cyan)"></i>
                        <div class="ic-title">\${item.title}</div>
                        <div class="ic-desc">\${item.desc}</div>
                        <button class="btn-small" onclick="downloadMock('\${item.title}')">DOWNLOAD TEMPLATE</button>
                    </div>\`;
            });
        }
        loadContent();

        function downloadMock(title) {
            alert("Downloading " + title + " template... (Mock)");
        }

        // --- DASHBOARD LOGIC (V56 Logic Preserved) ---
        const SPECS = { "SUPRAMAX": 13.5, "PANAMAX": 13.0, "CAPESIZE": 12.5, "MR_TANKER": 13.0, "AFRAMAX": 12.5, "VLCC": 12.0 };
        const map = L.map('map', {zoomControl: false, attributionControl: false}).setView([30, 0], 2);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 10 }).addTo(map);
        const layerGroup = L.layerGroup().addTo(map);
        let shipMarker = null;

        function openLogin() { document.getElementById('landing-view').style.display = 'none'; document.getElementById('dashboard-view').style.display = 'block'; setTimeout(() => map.invalidateSize(), 100); }
        
        async function init() {
            try {
                const pRes = await fetch('/api/ports');
                const ports = await pRes.json();
                const dl = document.getElementById('portList');
                ports.forEach(p => { const opt = document.createElement('option'); opt.value = p; dl.appendChild(opt); });
                const mRes = await fetch('/api/market');
                const m = await mRes.json();
                document.getElementById('oilPrice').innerText = "$" + m.brent.toFixed(2);
                document.getElementById('hoPrice').innerText = "$" + m.mgo.toFixed(0);
                document.getElementById('vlsfoPrice').innerText = "$" + m.vlsfo.toFixed(0);
            } catch(e) {}
        }
        init();

        function updateSpeed() {
            const type = document.getElementById('vType').value;
            if(SPECS[type]) document.getElementById('vSpeed').value = SPECS[type];
        }

        async function fillCoords() {
            const portName = document.getElementById('refPort').value.toUpperCase();
            if(!portName) return;
            try { const res = await fetch('/api/port-coords?port=' + portName); const data = await res.json(); if(data.lat) { document.getElementById('vLat').value = data.lat; document.getElementById('vLng').value = data.lng; updateShipMarker(data.lat, data.lng); } } catch(e){}
        }

        function updateShipMarker(lat, lng) {
            if(shipMarker) map.removeLayer(shipMarker);
            shipMarker = L.circleMarker([lat, lng], {radius:7, color:'#fff', fillColor:'#f59e0b', fillOpacity:1}).addTo(map).bindPopup("VESSEL");
            map.setView([lat, lng], 4);
        }

        async function scanMarket() {
            const lat = parseFloat(document.getElementById('vLat').value);
            const lng = parseFloat(document.getElementById('vLng').value);
            const speed = parseFloat(document.getElementById('vSpeed').value);
            if(isNaN(lat) || isNaN(lng)) { alert("Enter valid Coords"); return; }
            updateShipMarker(lat, lng);

            document.getElementById('loader').style.display = 'grid';
            try {
                const res = await fetch('/api/analyze', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({shipLat:lat, shipLng:lng, shipSpeed:speed, vType:document.getElementById('vType').value}) });
                const data = await res.json();
                if(data.success) renderList(data.voyages);
            } catch(e) { alert("Error"); }
            finally { document.getElementById('loader').style.display = 'none'; }
        }

        function renderList(voyages) {
            const list = document.getElementById('cargoResultList');
            list.innerHTML = ''; list.style.display = 'block';
            if(voyages.length === 0) { list.innerHTML = '<div style="padding:10px;">No cargoes found.</div>'; return; }
            voyages.forEach(v => {
                const el = document.createElement('div'); el.className = 'cargo-item';
                el.innerHTML = \`<div class="ci-top"><span>\${v.loadPort} -> \${v.dischPort}</span><span class="tce-badge">\$\${v.financials.tce.toLocaleString()}/day</span></div><div class="ci-bot"><span>\${v.commodity}</span><span>Bal: \${v.ballastDist} NM</span></div>\`;
                el.onclick = () => showDetails(v, el);
                list.appendChild(el);
            });
            showDetails(voyages[0], list.children[0]);
        }

        function showDetails(v, el) {
            document.querySelectorAll('.cargo-item').forEach(x => x.classList.remove('active')); el.classList.add('active');
            document.getElementById('emptyState').style.display = 'none'; document.getElementById('analysisPanel').style.display = 'block';
            
            const f = v.financials;
            document.getElementById('dispTCE').innerText = "$" + f.tce.toLocaleString();
            document.getElementById('dispProfit').innerText = "$" + f.profit.toLocaleString();
            document.getElementById('financialDetails').innerHTML = \`
                <div class="detail-row"><span class="d-lbl">Ballast</span> <span class="d-val">\${v.ballastDist} NM</span></div>
                <div class="detail-row"><span class="d-lbl">Laden</span> <span class="d-val">\${v.ladenDist} NM</span></div>
                <div class="detail-row"><span class="d-lbl">Speed</span> <span class="d-val" style="color:var(--neon-cyan)">\${v.usedSpeed} kts</span></div>
                <div class="detail-row"><span class="d-lbl">Total Days</span> <span class="d-val">\${v.totalDays.toFixed(1)}</span></div>
                <div class="detail-row"><span class="d-lbl">Gross Revenue</span> <span class="d-val pos">\$\${f.revenue.toLocaleString()}</span></div>
                <div class="detail-row"><span class="d-lbl">Ballast Cost</span> <span class="d-val neg">-\$\${f.cost_ballast_fuel.toLocaleString()}</span></div>
                <div class="detail-row"><span class="d-lbl">Laden Fuel</span> <span class="d-val neg">-\$\${f.cost_laden_fuel.toLocaleString()}</span></div>
                <div class="detail-row"><span class="d-lbl">Port/Canal</span> <span class="d-val neg">-\$\${(f.cost_port_dues+f.cost_canal).toLocaleString()}</span></div>
                <div class="detail-row"><span class="d-lbl">Comm (2.5%)</span> <span class="d-val neg">-\$\${f.cost_comm.toLocaleString()}</span></div>
                <div class="detail-row"><span class="d-lbl">OpEx</span> <span class="d-val neg">-\$\${f.cost_opex.toLocaleString()}</span></div>
            \`;
            document.getElementById('aiOutput').innerHTML = v.aiAnalysis;

            layerGroup.clearLayers();
            const pos = [document.getElementById('vLat').value, document.getElementById('vLng').value];
            const p1 = [v.loadGeo.lat, v.loadGeo.lng];
            const p2 = [v.dischGeo.lat, v.dischGeo.lng];
            
            L.circleMarker(pos, {radius:6, color:'#fff', fillColor:'#f59e0b', fillOpacity:1}).addTo(layerGroup);
            L.circleMarker(p1, {radius:6, color:'#fff', fillColor:'#10b981', fillOpacity:1}).addTo(layerGroup).bindPopup("LOAD");
            L.circleMarker(p2, {radius:6, color:'#fff', fillColor:'#ef4444', fillOpacity:1}).addTo(layerGroup).bindPopup("DISCH");
            map.fitBounds([pos, p1, p2], {padding:[50,50]});
        }
    </script>
</body>
</html>
`;

// =================================================================
// 3. BACKEND LOGIC (REAL-TIME ENGINE - V56 PRESERVED)
// =================================================================

async function updateMarketData() {
    if (Date.now() - MARKET.lastUpdate < 900000) return; 
    try {
        const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d');
        const resHO = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/HO=F?interval=1d&range=1d');
        const brentData = await res.json();
        const hoData = await resHO.json();
        const brentPrice = brentData.chart.result[0].meta.regularMarketPrice;
        const hoPriceGal = hoData.chart.result[0].meta.regularMarketPrice;
        if(brentPrice && hoPriceGal) {
            MARKET.brent = brentPrice;
            MARKET.mgo = Math.round(hoPriceGal * 319); 
            MARKET.vlsfo = Math.round(MARKET.mgo * 0.75);
            MARKET.lastUpdate = Date.now();
            console.log(`✅ LIVE MARKET: Brent $${brentPrice} | MGO $${MARKET.mgo} | VLSFO $${MARKET.vlsfo}`);
        }
    } catch(e) {}
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 3440;
    const dLat = (lat2 - lat1) * Math.PI/180;
    const dLon = (lon2 - lon1) * Math.PI/180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 1.15); 
}

function calculateFullVoyage(shipLat, shipLng, loadPortName, loadGeo, dischPortName, dischGeo, specs, market, shipSpeed) {
    const speed = shipSpeed || specs.default_speed;
    const ballastDist = getDistance(shipLat, shipLng, loadGeo.lat, loadGeo.lng);
    const ballastDays = ballastDist / (speed * 24);
    const costBallastFuel = ballastDays * specs.sea_cons * market.vlsfo;
    const ladenDist = getDistance(loadGeo.lat, loadGeo.lng, dischGeo.lat, dischGeo.lng);
    const ladenDays = ladenDist / (speed * 24);
    const cargoType = specs.sea_cons < 30 ? "BULK" : "TANKER";
    const possibleCargoes = CARGOES[cargoType] || CARGOES["BULK"];
    const cargo = possibleCargoes[Math.floor(Math.random() * possibleCargoes.length)];
    const qty = Math.floor(specs.dwt * 0.95);
    const loadDays = qty / cargo.loadRate;
    const dischDays = qty / cargo.dischRate;
    const portDays = Math.ceil(loadDays + dischDays + 2);
    const costLadenFuel = ladenDays * specs.sea_cons * market.vlsfo;
    const costPortFuel = portDays * specs.port_cons * market.mgo;
    const costPortDues = specs.dwt * 1.30; 
    const totalDays = ballastDays + ladenDays + portDays;
    let costCanal = 0;
    if ((loadGeo.lng < 35 && dischGeo.lng > 45) || (loadGeo.lng > 45 && dischGeo.lng < 35)) costCanal += 200000;
    const costOpex = totalDays * specs.opex;
    const grossRevenue = qty * cargo.rate;
    const commission = grossRevenue * 0.025; 
    const totalCost = costBallastFuel + costLadenFuel + costPortFuel + costPortDues + costCanal + costOpex + commission;
    const profit = grossRevenue - totalCost;
    const tce = profit / totalDays;
    return { ballastDist, ballastDays, ladenDist, ladenDays, portDays, totalDays, usedSpeed: speed, cargo, qty, financials: { revenue: grossRevenue, cost_ballast_fuel: costBallastFuel, cost_laden_fuel: costLadenFuel + costPortFuel, cost_port_dues: costPortDues, cost_canal: costCanal, cost_opex: costOpex, cost_comm: commission, profit, tce } };
}

function generateAnalysis(v) {
    let advice = v.financials.tce > 20000 ? "STRONGLY RECOMMENDED" : "STANDARD FIXTURE";
    if(v.financials.tce < 6000) advice = "NEGATIVE RETURNS";
    return `<strong>AI STRATEGY:</strong><br>${advice}<br>Ballast: ${v.ballastDist} NM`;
}

// --- API ROUTES ---

app.get('/', (req, res) => res.send(FRONTEND_HTML));
app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));
app.get('/api/market', async (req, res) => { await updateMarketData(); res.json(MARKET); });
app.get('/api/port-coords', (req, res) => { const p = PORT_DB[req.query.port]; res.json(p || {}); });

app.post('/api/analyze', async (req, res) => {
    await updateMarketData();
    const { shipLat, shipLng, shipSpeed, vType } = req.body;
    if(!shipLat || !shipLng) return res.json({success: false, error: "Missing coordinates"});
    const specs = VESSEL_SPECS[vType] || VESSEL_SPECS["SUPRAMAX"];
    const suggestions = [];
    const allPorts = Object.keys(PORT_DB);
    const sortedPorts = allPorts.map(pName => { return { name: pName, geo: PORT_DB[pName], dist: getDistance(shipLat, shipLng, PORT_DB[pName].lat, PORT_DB[pName].lng) }; }).sort((a,b) => a.dist - b.dist);
    const candidates = sortedPorts.slice(0, 30);
    for(let i=0; i<5; i++) {
        const loadCand = candidates[Math.floor(Math.random() * candidates.length)];
        const dischName = allPorts[Math.floor(Math.random() * allPorts.length)];
        const dischGeo = PORT_DB[dischName];
        if(loadCand.name === dischName) continue;
        const calc = calculateFullVoyage(shipLat, shipLng, loadCand.name, loadCand.geo, dischName, dischGeo, specs, MARKET, shipSpeed);
        if(calc.financials.profit > -20000) {
            suggestions.push({
                loadPort: loadCand.name, dischPort: dischName, loadGeo: loadCand.geo, dischGeo: dischGeo,
                commodity: calc.cargo.name, qty: calc.qty,
                ballastDist: calc.ballastDist, ballastDays: calc.ballastDays,
                ladenDist: calc.ladenDist, ladenDays: calc.ladenDays,
                totalDays: calc.totalDays, usedSpeed: calc.usedSpeed,
                financials: calc.financials, aiAnalysis: generateAnalysis(calc)
            });
        }
    }
    suggestions.sort((a,b) => b.financials.tce - a.financials.tce);
    res.json({success: true, voyages: suggestions});
});

app.listen(port, () => console.log(`VIYA BROKER V57 (THE MARITIME HUB) running on port ${port}`));
