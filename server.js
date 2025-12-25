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
// 1. FRONTEND (GELİŞMİŞ ANALİZ PANELİ)
// =================================================================
const FRONTEND_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VIYA BROKER | Strategic Advisor</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Orbitron:wght@400;600;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        :root { --neon-cyan: #00f2ff; --neon-purple: #bc13fe; --deep-space: #030508; --panel-bg: rgba(15, 23, 42, 0.96); --card-bg: rgba(255, 255, 255, 0.05); --border-color: rgba(255, 255, 255, 0.1); --text-main: #e2e8f0; --text-muted: #94a3b8; --font-ui: 'Plus Jakarta Sans', sans-serif; --font-tech: 'Orbitron', sans-serif; --success: #10b981; --danger: #ef4444; --warning: #f59e0b; }
        * { box-sizing: border-box; margin: 0; padding: 0; scroll-behavior: smooth; }
        body { background-color: var(--deep-space); color: var(--text-main); font-family: var(--font-ui); overflow-x: hidden; font-size:13px; }
        
        /* Layout & Nav */
        nav { position: fixed; top: 0; width: 100%; z-index: 1000; background: rgba(3, 5, 8, 0.95); backdrop-filter: blur(15px); border-bottom: 1px solid var(--border-color); padding: 0.8rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        .brand { font-family: var(--font-tech); font-weight: 900; font-size: 1.4rem; letter-spacing: 1px; color: #fff; display: flex; align-items: center; gap: 10px; }
        .live-ticker { font-family: var(--font-tech); font-size: 0.75rem; color: var(--text-muted); display:flex; gap:20px; align-items:center; }
        .btn-nav { background: transparent; border: 1px solid var(--neon-cyan); color: var(--neon-cyan); padding: 6px 20px; border-radius: 50px; font-family: var(--font-tech); cursor: pointer; transition: 0.3s; font-size: 0.7rem; }
        .btn-nav:hover { background: var(--neon-cyan); color: #000; box-shadow: 0 0 15px rgba(0,242,255,0.4); }

        #landing-view { display: block; }
        .hero { height: 100vh; background: linear-gradient(rgba(3,5,8,0.8), rgba(3,5,8,1)), url('https://images.unsplash.com/photo-1559827291-72ee739d0d9a?q=80&w=2874&auto=format&fit=crop'); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; text-align: center; }
        .hero h1 { font-family: var(--font-tech); font-size: 3.5rem; line-height: 1.1; margin-bottom: 20px; background: linear-gradient(to right, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .btn-hero { background: linear-gradient(135deg, var(--neon-cyan), #00aaff); border: none; color: #000; padding: 18px 45px; font-size: 1rem; font-weight: 800; font-family: var(--font-tech); cursor: pointer; border-radius: 4px; box-shadow: 0 0 30px rgba(0,242,255,0.3); transition: 0.3s; letter-spacing: 1px; }

        #dashboard-view { display: none; padding-top: 70px; height: 100vh; }
        .dash-grid { display: grid; grid-template-columns: 380px 1fr 450px; gap: 15px; padding: 15px; height: calc(100vh - 70px); }
        
        /* Panels */
        .panel { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; }
        .p-header { padding: 15px; border-bottom: 1px solid var(--border-color); font-family: var(--font-tech); color: var(--neon-cyan); font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center; }
        .p-body { padding: 15px; overflow-y: auto; flex: 1; }

        /* Inputs */
        .input-group { margin-bottom: 15px; }
        .input-group label { display: block; font-size: 0.7rem; color: #94a3b8; margin-bottom: 6px; font-weight: 600; letter-spacing: 0.5px; }
        .input-group input, .input-group select { width: 100%; background: #0b1221; border: 1px solid #334155; color: #fff; padding: 12px; border-radius: 4px; font-family: var(--font-ui); font-size: 0.9rem; transition: all 0.3s ease; }
        .input-group input:focus, .input-group select:focus { border-color: var(--neon-cyan); outline: none; }
        .btn-action { background: linear-gradient(135deg, var(--neon-cyan), #00aaff); border: none; color: #000; padding: 14px; font-size: 0.9rem; font-weight: 800; font-family: var(--font-tech); cursor: pointer; border-radius: 4px; width: 100%; transition: 0.3s; margin-top: 10px; letter-spacing: 1px; }
        
        /* List */
        .cargo-item { background: var(--card-bg); border: 1px solid var(--border-color); padding: 12px; border-radius: 6px; margin-bottom: 10px; cursor: pointer; transition: 0.2s; position: relative; }
        .cargo-item:hover { border-color: var(--neon-cyan); background: rgba(0,242,255,0.05); }
        .cargo-item.active { border-color: var(--neon-cyan); background: rgba(0,242,255,0.1); border-left: 4px solid var(--neon-cyan); }
        .ci-top { display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: 600; color: #fff; font-size: 0.95rem; }
        .ci-bot { display: flex; justify-content: space-between; font-size: 0.8rem; color: #94a3b8; }
        .tce-badge { background: #064e3b; color: #34d399; padding: 2px 6px; border-radius: 4px; font-family: var(--font-tech); font-size: 0.75rem; }

        /* Map */
        #map { width: 100%; height: 100%; background: #000; }

        /* Analysis Panel */
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
        .stat-card { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border: 1px solid #333; text-align: center; }
        .stat-val { font-family: var(--font-tech); font-size: 1.1rem; color: #fff; font-weight: 700; }
        .stat-lbl { font-size: 0.7rem; color: #94a3b8; margin-top: 4px; text-transform: uppercase; }
        
        .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; }
        .detail-row:last-child { border-bottom: none; }
        .d-lbl { color: #94a3b8; }
        .d-val { color: #e2e8f0; font-weight: 500; }
        .d-val.neg { color: var(--danger); }
        .d-val.pos { color: var(--success); }

        .ai-insight { background: rgba(0, 242, 255, 0.05); border-left: 3px solid var(--neon-cyan); padding: 15px; margin-top: 15px; font-size: 0.85rem; line-height: 1.5; color: #cbd5e1; border-radius: 0 6px 6px 0; }
        .ai-insight strong { color: var(--neon-cyan); font-family: var(--font-tech); display: block; margin-bottom: 5px; }

        .loader { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.9); z-index: 2000; place-items: center; }
        .spinner { width: 50px; height: 50px; border: 3px solid var(--neon-cyan); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="loader" id="loader"><div style="text-align: center;"><div class="spinner" style="margin: 0 auto 15px;"></div><div style="font-family: var(--font-tech); color: var(--neon-cyan); font-size:1rem;">ANALYZING FINANCIALS...</div></div></div>

    <nav>
        <div class="brand"><i class="fa-solid fa-anchor"></i> VIYA BROKER</div>
        <div class="live-ticker">
            <div class="ticker-item"><i class="fa-solid fa-droplet"></i> BRENT: <span id="oilPrice">Loading...</span></div>
            <div class="ticker-item"><i class="fa-solid fa-gas-pump"></i> VLSFO: <span id="vlsfoPrice">Loading...</span></div>
            <div class="ticker-item"><i class="fa-solid fa-truck"></i> MGO: <span id="mgoPrice">Loading...</span></div>
        </div>
        <button class="btn-nav" onclick="location.reload()">SYSTEM REBOOT</button>
    </nav>

    <div id="landing-view">
        <header class="hero">
            <div class="hero-content">
                <h1>STRATEGIC<br>MARITIME INTELLIGENCE</h1>
                <p>Advanced voyage estimation, TCE analysis, and AI-driven commercial strategy.</p>
                <button class="btn-hero" onclick="openLogin()">LAUNCH TERMINAL</button>
            </div>
        </header>
    </div>

    <div id="dashboard-view">
        <div class="dash-grid">
            <aside class="panel">
                <div class="p-header"><i class="fa-solid fa-sliders"></i> VOYAGE PARAMETERS</div>
                <div class="p-body">
                    <div class="input-group">
                        <label>VESSEL TYPE</label>
                        <select id="vType">
                            <option value="SUPRAMAX">Supramax (58k DWT)</option>
                            <option value="PANAMAX">Panamax (82k DWT)</option>
                            <option value="CAPESIZE">Capesize (180k DWT)</option>
                            <option value="MR_TANKER">MR Tanker (50k DWT)</option>
                            <option value="AFRAMAX">Aframax (115k DWT)</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>OPEN PORT</label>
                        <input type="text" id="vLoc" list="portList" value="ISTANBUL" oninput="this.value = this.value.toUpperCase()">
                    </div>
                    <div class="input-group">
                        <label>TARGET MARKET</label>
                        <select id="vRegion">
                            <option value="WORLD">Global Opportunities</option>
                            <option value="AMERICAS">Americas (Atlantic/Pacific)</option>
                            <option value="ASIA">Asia & Far East</option>
                            <option value="EUROPE">Europe & Continent</option>
                            <option value="MED">Mediterranean & Black Sea</option>
                        </select>
                    </div>
                    <button class="btn-action" onclick="scanMarket()">RUN ANALYSIS</button>
                    
                    <div id="cargoResultList" class="cargo-list" style="margin-top:20px; display:none;"></div>
                </div>
            </aside>

            <div class="panel">
                <div id="map"></div>
            </div>

            <aside class="panel">
                <div class="p-header"><i class="fa-solid fa-chart-line"></i> VOYAGE P&L & STRATEGY</div>
                <div class="p-body" id="analysisPanel" style="display:none;">
                    <div class="stat-grid">
                        <div class="stat-card">
                            <div class="stat-val" id="dispTCE" style="color:var(--neon-cyan)">$0</div>
                            <div class="stat-lbl">TCE / Day</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-val" id="dispProfit" style="color:var(--success)">$0</div>
                            <div class="stat-lbl">Net Profit</div>
                        </div>
                    </div>

                    <div style="font-family:var(--font-tech); font-size:0.8rem; margin-bottom:10px; color:#fff; border-bottom:1px solid #333; padding-bottom:5px;">REVENUE</div>
                    <div class="detail-row"><span class="d-lbl">Freight</span> <span class="d-val" id="valFreight"></span></div>
                    <div class="detail-row"><span class="d-lbl">Gross Revenue</span> <span class="d-val pos" id="valRevenue"></span></div>

                    <div style="font-family:var(--font-tech); font-size:0.8rem; margin:15px 0 5px 0; color:#fff; border-bottom:1px solid #333; padding-bottom:5px;">EXPENSES</div>
                    <div class="detail-row"><span class="d-lbl">Bunkers (Sea)</span> <span class="d-val neg" id="valSeaFuel"></span></div>
                    <div class="detail-row"><span class="d-lbl">Bunkers (Port)</span> <span class="d-val neg" id="valPortFuel"></span></div>
                    <div class="detail-row"><span class="d-lbl">Port Dues</span> <span class="d-val neg" id="valPortDues"></span></div>
                    <div class="detail-row"><span class="d-lbl">Canal Fees</span> <span class="d-val neg" id="valCanal"></span></div>
                    <div class="detail-row"><span class="d-lbl">Commission</span> <span class="d-val neg" id="valComm"></span></div>
                    <div class="detail-row"><span class="d-lbl">Running Costs (OpEx)</span> <span class="d-val neg" id="valOpex"></span></div>

                    <div style="font-family:var(--font-tech); font-size:0.8rem; margin:15px 0 5px 0; color:#fff; border-bottom:1px solid #333; padding-bottom:5px;">OPERATIONAL SPECS</div>
                    <div class="detail-row"><span class="d-lbl">Distance</span> <span class="d-val" id="valDist"></span></div>
                    <div class="detail-row"><span class="d-lbl">Duration</span> <span class="d-val" id="valDuration"></span></div>
                    <div class="detail-row"><span class="d-lbl">Fuel Cons.</span> <span class="d-val" id="valCons"></span></div>

                    <div class="ai-insight" id="aiOutput"></div>
                </div>
                <div class="p-body" id="emptyState" style="display:flex; align-items:center; justify-content:center; color:#555; text-align:center;">
                    Select a voyage option to view detailed financial breakdown.
                </div>
            </aside>
        </div>
    </div>

    <datalist id="portList"></datalist>

    <script>
        const map = L.map('map', {zoomControl: false, attributionControl: false}).setView([30, 0], 2);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 10 }).addTo(map);
        const layerGroup = L.layerGroup().addTo(map);

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
                document.getElementById('vlsfoPrice').innerText = "$" + m.vlsfo.toFixed(0);
                document.getElementById('mgoPrice').innerText = "$" + m.mgo.toFixed(0);
            } catch(e) {}
        }
        init();

        async function scanMarket() {
            const params = {
                shipPos: document.getElementById('vLoc').value.toUpperCase(),
                region: document.getElementById('vRegion').value,
                vType: document.getElementById('vType').value
            };
            
            document.getElementById('loader').style.display = 'grid';
            
            try {
                const res = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(params)
                });
                const data = await res.json();
                
                if(data.success) { renderList(data.voyages); }
                else { alert(data.error); }
            } catch(e) { alert("Analysis Failed"); }
            finally { document.getElementById('loader').style.display = 'none'; }
        }

        function renderList(voyages) {
            const list = document.getElementById('cargoResultList');
            list.innerHTML = '';
            list.style.display = 'block';
            
            if(voyages.length === 0) { list.innerHTML = '<div style="padding:10px; color:#666;">No suitable cargoes found.</div>'; return; }

            voyages.forEach(v => {
                const el = document.createElement('div');
                el.className = 'cargo-item';
                el.innerHTML = \`
                    <div class="ci-top">
                        <span>\${v.dischPort}</span>
                        <span class="tce-badge">\$\${v.financials.tce.toLocaleString()}/day</span>
                    </div>
                    <div class="ci-bot">
                        <span>\${v.commodity} • \${v.qty}mt</span>
                        <span>\${v.duration.toFixed(1)} days</span>
                    </div>
                \`;
                el.onclick = () => showDetails(v, el);
                list.appendChild(el);
            });
            
            showDetails(voyages[0], list.children[0]);
        }

        function showDetails(v, el) {
            document.querySelectorAll('.cargo-item').forEach(x => x.classList.remove('active'));
            el.classList.add('active');
            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('analysisPanel').style.display = 'block';

            const f = v.financials;
            document.getElementById('dispTCE').innerText = "$" + f.tce.toLocaleString();
            document.getElementById('dispProfit').innerText = "$" + f.profit.toLocaleString();
            
            // Values
            document.getElementById('valFreight').innerText = \`\$\${v.rate}/pmt\`;
            document.getElementById('valRevenue').innerText = "$" + f.revenue.toLocaleString();
            document.getElementById('valSeaFuel').innerText = "$" + f.cost_fuel_sea.toLocaleString();
            document.getElementById('valPortFuel').innerText = "$" + f.cost_fuel_port.toLocaleString();
            document.getElementById('valPortDues').innerText = "$" + f.cost_port_dues.toLocaleString();
            document.getElementById('valCanal').innerText = "$" + f.cost_canal.toLocaleString();
            document.getElementById('valComm').innerText = "$" + f.cost_comm.toLocaleString();
            document.getElementById('valOpex').innerText = "$" + f.cost_opex.toLocaleString();
            
            document.getElementById('valDist').innerText = v.distance.toLocaleString() + " NM";
            document.getElementById('valDuration').innerText = v.duration.toFixed(2) + " days (" + v.seaDays.toFixed(1) + " sea + " + v.portDays.toFixed(1) + " port)";
            document.getElementById('valCons').innerText = f.total_fuel_qty.toFixed(1) + " mt";

            document.getElementById('aiOutput').innerHTML = v.aiAnalysis;

            // Map Update (Point to Point)
            layerGroup.clearLayers();
            const p1 = [v.loadGeo.lat, v.loadGeo.lng];
            const p2 = [v.dischGeo.lat, v.dischGeo.lng];
            
            // Great Circle Curve (Visual only)
            const curve = getCurve(p1, p2);
            L.polyline(curve, {color: '#00f2ff', weight: 2, opacity: 0.6, dashArray: '5, 5'}).addTo(layerGroup);
            
            L.circleMarker(p1, {radius:5, color:'#00f2ff', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup(v.loadPort);
            L.circleMarker(p2, {radius:5, color:'#bc13fe', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup(v.dischPort);
            
            map.fitBounds([p1, p2], {padding:[50,50]});
        }

        function getCurve(p1, p2) {
            const points = [];
            for(let i=0; i<=50; i++) {
                const f = i/50;
                const lat = p1[0] + (p2[0]-p1[0])*f;
                const lng = p1[1] + (p2[1]-p1[1])*f;
                const arc = Math.sin(f*Math.PI) * 10;
                points.push([lat+arc, lng]);
            }
            return points;
        }
    </script>
</body>
</html>
`;

// =================================================================
// 2. BACKEND (THE BRAIN)
// =================================================================

// --- DATABASE SIMULATION ---
let PORT_DB = {};
try {
    const rawData = fs.readFileSync(path.join(__dirname, 'ports.json'));
    const jsonData = JSON.parse(rawData);
    for (const [key, val] of Object.entries(jsonData)) {
        PORT_DB[key.toUpperCase()] = { lat: parseFloat(val[1]), lng: parseFloat(val[0]) };
    }
} catch (e) { console.error("Ports missing"); }

// --- MARKET DATA ---
let MARKET = { brent: 82.5, vlsfo: 650, mgo: 920, lastUpdate: 0 }; // Default values

// --- VESSEL DATABASE (Detailed) ---
const VESSELS = {
    "SUPRAMAX": { dwt: 58000, speed: 13.5, sea_cons: 28, port_cons: 3.5, opex: 5500 }, // Sea Cons: VLSFO, Port Cons: MGO
    "PANAMAX":  { dwt: 82000, speed: 13.0, sea_cons: 34, port_cons: 4.0, opex: 6500 },
    "CAPESIZE": { dwt: 180000, speed: 12.5, sea_cons: 45, port_cons: 5.0, opex: 8000 },
    "MR_TANKER": { dwt: 50000, speed: 13.0, sea_cons: 26, port_cons: 4.5, opex: 6800 }, // Tankers use more in port (pumps)
    "AFRAMAX":  { dwt: 115000, speed: 12.5, sea_cons: 40, port_cons: 6.0, opex: 7800 },
    "VLCC":     { dwt: 300000, speed: 12.0, sea_cons: 65, port_cons: 8.0, opex: 10500 }
};

const CARGOES = {
    "BULK": [
        {name: "Grain", rate: 32, loadRate: 15000, dischRate: 10000},
        {name: "Coal", rate: 24, loadRate: 25000, dischRate: 20000},
        {name: "Iron Ore", rate: 19, loadRate: 40000, dischRate: 30000},
        {name: "Steel", rate: 38, loadRate: 8000, dischRate: 6000}
    ],
    "TANKER": [
        {name: "Crude Oil", rate: 28, loadRate: 50000, dischRate: 40000},
        {name: "CPP/Diesel", rate: 35, loadRate: 2500, dischRate: 2500} // Tankers use m3/hr usually, simplified here
    ]
};

// --- LOGIC FUNCTIONS ---

function getDistance(p1, p2) {
    // Haversine with 15% Sea Margin
    const R = 3440;
    const dLat = (p2.lat - p1.lat) * Math.PI/180;
    const dLon = (p2.lng - p1.lng) * Math.PI/180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(p1.lat*Math.PI/180)*Math.cos(p2.lat*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 1.15);
}

function checkECA(port) {
    // Basic ECA Logic: North Europe & North America
    return (port.lat > 45 && port.lng > -10 && port.lng < 30) || (port.lat > 25 && port.lng < -60);
}

function calculateVoyage(ship, start, end, specs, market) {
    // 1. Operational
    const dist = getDistance(start, end);
    const seaDays = dist / (specs.speed * 24);
    
    // Cargo & Port Time
    const type = (specs.dwt > 60000 && specs.dwt < 120000 && start.lat === end.lat) ? "TANKER" : "BULK"; // Simple logic
    const cargoType = specs.sea_cons < 30 ? "BULK" : "TANKER"; // Better logic based on ship type
    const possibleCargoes = CARGOES[cargoType] || CARGOES["BULK"];
    const cargo = possibleCargoes[Math.floor(Math.random() * possibleCargoes.length)];
    
    const qty = Math.floor(specs.dwt * 0.95);
    const loadDays = qty / cargo.loadRate;
    const dischDays = qty / cargo.dischRate;
    const portDays = Math.ceil(loadDays + dischDays + 2); // +2 days buffer/waiting
    
    const totalDays = seaDays + portDays;

    // 2. Financials - Expenses
    // Fuel: Sea (VLSFO) + Port (MGO)
    // ECA Check: If both ports in ECA, maybe use MGO at sea too (simplified: just standard here)
    const costFuelSea = seaDays * specs.sea_cons * market.vlsfo;
    const costFuelPort = portDays * specs.port_cons * market.mgo;
    
    // Port Dues (Estimate: $1.2 per DWT total for both ports)
    const costPortDues = specs.dwt * 1.25; 
    
    // Canal Fees
    let costCanal = 0;
    let canalNote = "";
    if ((start.lng < 35 && end.lng > 45) || (start.lng > 45 && end.lng < 35)) {
        costCanal = 200000 + (specs.dwt * 0.5); // Suez
        canalNote = "Via Suez Canal";
    } else if ((start.lng > -80 && start.lng < 0 && end.lng < -80) || (start.lng < -80 && end.lng > -80)) {
        costCanal = 180000 + (specs.dwt * 0.4); // Panama
        canalNote = "Via Panama Canal";
    }

    const costOpex = totalDays * specs.opex;
    const grossRevenue = qty * cargo.rate;
    const commission = grossRevenue * 0.0375; // 3.75% total comm
    
    const totalCost = costFuelSea + costFuelPort + costPortDues + costCanal + costOpex + commission;
    const profit = grossRevenue - totalCost;
    
    // 3. Key Metrics
    const tce = (grossRevenue - (costFuelSea + costFuelPort + costPortDues + costCanal + commission)) / totalDays;

    return {
        dist, seaDays, portDays, totalDays, cargo, qty, rate: cargo.rate, canalNote,
        financials: {
            revenue: grossRevenue,
            cost_fuel_sea: costFuelSea,
            cost_fuel_port: costFuelPort,
            cost_port_dues: costPortDues,
            cost_canal: costCanal,
            cost_opex: costOpex,
            cost_comm: commission,
            total_fuel_qty: (seaDays*specs.sea_cons) + (portDays*specs.port_cons),
            profit, tce
        }
    };
}

function generateStrategy(v, startName, endName) {
    let risk = "Low";
    let strategy = "";
    let alert = "";

    // 1. ECA Risk
    if(checkECA(v.loadGeo) || checkECA(v.dischGeo)) {
        alert += "<br>• <span style='color:orange'>ECA Zone Alert:</span> High MGO consumption expected.";
    }

    // 2. Canal Risk
    if(v.canalNote.includes("Panama")) {
        alert += "<br>• <span style='color:orange'>Panama Delays:</span> Factor in 5-8 days waiting time.";
    }

    // 3. Profitability
    if(v.financials.tce > 25000) {
        strategy = `<span style="color:#10b981; font-weight:bold">AGGRESSIVE FIX.</span> Exceptional returns. Prioritize this cargo.`;
    } else if (v.financials.tce > 12000) {
        strategy = `<span style="color:#00f2ff">BALANCED.</span> Market level fixture. Good for repositioning.`;
    } else {
        strategy = `<span style="color:#ef4444">NEGATIVE.</span> TCE below OpEx break-even. Reject unless COA.`;
        risk = "High";
    }

    return `
        <strong>STRATEGIC ASSESSMENT:</strong><br>
        Recommendation: ${strategy}<br>
        Risk Profile: ${risk}${alert}<br>
        <i>Notes: ${v.commodity} market is volatile. Verify load readiness at ${startName}.</i>
    `;
}

// --- API ROUTES ---

app.get('/', (req, res) => res.send(FRONTEND_HTML));

app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));

app.get('/api/market', (req, res) => res.json(MARKET));

app.post('/api/analyze', (req, res) => {
    const { shipPos, region, vType } = req.body;
    const startPort = PORT_DB[shipPos];
    if(!startPort) return res.json({success: false, error: "Invalid Port"});

    const specs = VESSEL_SPECS[vType] || VESSEL_SPECS["SUPRAMAX"];
    const suggestions = [];

    // Filter targets
    const targets = Object.keys(PORT_DB).filter(p => {
        if(p === shipPos) return false;
        const port = PORT_DB[p];
        if(region === 'AMERICAS') return port.lng < -30;
        if(region === 'ASIA') return port.lng > 60;
        if(region === 'EUROPE') return port.lat > 48;
        if(region === 'MED') return port.lat > 30 && port.lat < 46 && port.lng > -6 && port.lng < 36;
        return true;
    });

    // Pick random 5
    for(let i=0; i<5; i++) {
        if(targets.length === 0) break;
        const randIdx = Math.floor(Math.random() * targets.length);
        const destName = targets[randIdx];
        targets.splice(randIdx, 1);
        const destPort = PORT_DB[destName];

        const calc = calculateVoyage(null, startPort, destPort, specs, MARKET); // ship object not used yet in calc
        
        // Build Response Object
        suggestions.push({
            loadPort: shipPos, dischPort: destName,
            loadGeo: startPort, dischGeo: destPort,
            commodity: calc.cargo.name, qty: calc.qty, rate: calc.cargo.rate,
            distance: calc.dist, duration: calc.totalDays, 
            seaDays: calc.seaDays, portDays: calc.portDays,
            financials: calc.financials,
            aiAnalysis: generateStrategy({ ...calc, loadGeo: startPort, dischGeo: destPort }, shipPos, destName)
        });
    }

    // Sort by TCE (Highest Daily Earnings First)
    suggestions.sort((a,b) => b.financials.tce - a.financials.tce);

    res.json({success: true, voyages: suggestions});
});

app.listen(port, () => console.log(`VIYA BROKER V52 (STRATEGIC ADVISOR) running on port ${port}`));
