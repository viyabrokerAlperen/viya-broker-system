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
// 1. DATA & CONFIG (EN TEPEDE - HATA OLMAMASI İÇİN)
// =================================================================

// --- GEMİ VERİTABANI ---
const VESSEL_SPECS = {
    "SUPRAMAX": { dwt: 58000, speed: 13.5, sea_cons: 28, port_cons: 3.5, opex: 5500 }, 
    "PANAMAX":  { dwt: 82000, speed: 13.0, sea_cons: 34, port_cons: 4.0, opex: 6500 },
    "CAPESIZE": { dwt: 180000, speed: 12.5, sea_cons: 45, port_cons: 5.0, opex: 8000 },
    "MR_TANKER": { dwt: 50000, speed: 13.0, sea_cons: 26, port_cons: 4.5, opex: 6800 },
    "AFRAMAX":  { dwt: 115000, speed: 12.5, sea_cons: 40, port_cons: 6.0, opex: 7800 },
    "VLCC":     { dwt: 300000, speed: 12.0, sea_cons: 65, port_cons: 8.0, opex: 10500 }
};

// --- YÜK TİPLERİ ---
const CARGOES = {
    "BULK": [
        {name: "Grain", rate: 32, loadRate: 15000, dischRate: 10000},
        {name: "Coal", rate: 24, loadRate: 25000, dischRate: 20000},
        {name: "Iron Ore", rate: 19, loadRate: 40000, dischRate: 30000},
        {name: "Steel Products", rate: 38, loadRate: 8000, dischRate: 6000},
        {name: "Fertilizer", rate: 29, loadRate: 12000, dischRate: 10000}
    ],
    "TANKER": [
        {name: "Crude Oil", rate: 28, loadRate: 50000, dischRate: 40000},
        {name: "Diesel/Gasoil", rate: 35, loadRate: 3000, dischRate: 3000},
        {name: "Naphtha", rate: 31, loadRate: 3500, dischRate: 3500}
    ]
};

// --- PİYASA VERİLERİ (Defaults) ---
let MARKET = { brent: 82.5, vlsfo: 650, mgo: 920, lastUpdate: 0 };

// --- LİMAN VERİTABANI YÜKLEME ---
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
// 2. FRONTEND
// =================================================================
const FRONTEND_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VIYA BROKER | The Navigator</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Orbitron:wght@400;600;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        :root { --neon-cyan: #00f2ff; --neon-purple: #bc13fe; --deep-space: #030508; --panel-bg: rgba(15, 23, 42, 0.96); --card-bg: rgba(255, 255, 255, 0.05); --border-color: rgba(255, 255, 255, 0.1); --text-main: #e2e8f0; --text-muted: #94a3b8; --font-ui: 'Plus Jakarta Sans', sans-serif; --font-tech: 'Orbitron', sans-serif; --success: #10b981; --danger: #ef4444; --warning: #f59e0b; }
        * { box-sizing: border-box; margin: 0; padding: 0; scroll-behavior: smooth; }
        body { background-color: var(--deep-space); color: var(--text-main); font-family: var(--font-ui); overflow-x: hidden; font-size:13px; }
        
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
        
        .panel { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; }
        .p-header { padding: 15px; border-bottom: 1px solid var(--border-color); font-family: var(--font-tech); color: var(--neon-cyan); font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center; }
        .p-body { padding: 15px; overflow-y: auto; flex: 1; }

        .input-group { margin-bottom: 15px; }
        .input-group label { display: block; font-size: 0.7rem; color: #94a3b8; margin-bottom: 6px; font-weight: 600; letter-spacing: 0.5px; }
        .input-group input, .input-group select { width: 100%; background: #0b1221; border: 1px solid #334155; color: #fff; padding: 12px; border-radius: 4px; font-family: var(--font-ui); font-size: 0.9rem; transition: all 0.3s ease; }
        .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        
        .btn-action { background: linear-gradient(135deg, var(--neon-cyan), #00aaff); border: none; color: #000; padding: 14px; font-size: 0.9rem; font-weight: 800; font-family: var(--font-tech); cursor: pointer; border-radius: 4px; width: 100%; transition: 0.3s; margin-top: 10px; letter-spacing: 1px; }
        
        .cargo-item { background: var(--card-bg); border: 1px solid var(--border-color); padding: 12px; border-radius: 6px; margin-bottom: 10px; cursor: pointer; transition: 0.2s; position: relative; }
        .cargo-item:hover { border-color: var(--neon-cyan); background: rgba(0,242,255,0.05); }
        .cargo-item.active { border-color: var(--neon-cyan); background: rgba(0,242,255,0.1); border-left: 4px solid var(--neon-cyan); }
        .ci-top { display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: 600; color: #fff; font-size: 0.95rem; }
        .ci-bot { display: flex; justify-content: space-between; font-size: 0.8rem; color: #94a3b8; }
        .tce-badge { background: #064e3b; color: #34d399; padding: 2px 6px; border-radius: 4px; font-family: var(--font-tech); font-size: 0.75rem; }

        #map { width: 100%; height: 100%; background: #000; }

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
        
        .loader { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.9); z-index: 2000; place-items: center; }
        .spinner { width: 50px; height: 50px; border: 3px solid var(--neon-cyan); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="loader" id="loader"><div style="text-align: center;"><div class="spinner" style="margin: 0 auto 15px;"></div><div style="font-family: var(--font-tech); color: var(--neon-cyan); font-size:1rem;">CALCULATING BALLAST & PROFITS...</div></div></div>

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
                <h1>COMMAND THE<br>GLOBAL MARKETS</h1>
                <p>Advanced position-based voyage estimation. Calculate ballast legs, port costs and net returns.</p>
                <button class="btn-hero" onclick="openLogin()">LAUNCH TERMINAL</button>
            </div>
        </header>
    </div>

    <div id="dashboard-view">
        <div class="dash-grid">
            <aside class="panel">
                <div class="p-header"><i class="fa-solid fa-ship"></i> VESSEL POSITION</div>
                <div class="p-body">
                    <div class="input-group">
                        <label>VESSEL CLASS</label>
                        <select id="vType">
                            <option value="SUPRAMAX">Supramax (58k DWT)</option>
                            <option value="PANAMAX">Panamax (82k DWT)</option>
                            <option value="CAPESIZE">Capesize (180k DWT)</option>
                            <option value="MR_TANKER">MR Tanker (50k DWT)</option>
                            <option value="AFRAMAX">Aframax (115k DWT)</option>
                        </select>
                    </div>
                    
                    <div style="border-top:1px solid #333; margin:15px 0; padding-top:15px;">
                        <div class="input-group">
                            <label>REFERENCE PORT (Quick Fill)</label>
                            <input type="text" id="refPort" list="portList" placeholder="Select port to fill coords..." onchange="fillCoords()">
                        </div>
                        <div class="input-row">
                            <div class="input-group">
                                <label>LATITUDE</label>
                                <input type="number" id="vLat" placeholder="00.00" step="0.0001">
                            </div>
                            <div class="input-group">
                                <label>LONGITUDE</label>
                                <input type="number" id="vLng" placeholder="00.00" step="0.0001">
                            </div>
                        </div>
                    </div>

                    <div class="input-group">
                        <label>SCAN REGION</label>
                        <select id="vRegion">
                            <option value="WORLD">Global Opportunities</option>
                            <option value="AMERICAS">Americas</option>
                            <option value="ASIA">Asia & Far East</option>
                            <option value="EUROPE">Europe & Continent</option>
                            <option value="MED">Mediterranean</option>
                        </select>
                    </div>
                    <button class="btn-action" onclick="scanMarket()">SCAN FROM POSITION</button>
                    
                    <div id="cargoResultList" class="cargo-list" style="margin-top:20px; display:none;"></div>
                </div>
            </aside>

            <div class="panel">
                <div id="map"></div>
            </div>

            <aside class="panel">
                <div class="p-header"><i class="fa-solid fa-chart-pie"></i> VOYAGE P&L</div>
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

                    <div style="font-family:var(--font-tech); font-size:0.8rem; margin-bottom:10px; color:#fff; border-bottom:1px solid #333; padding-bottom:5px;">VOYAGE STRUCTURE</div>
                    <div class="detail-row"><span class="d-lbl">Ballast (To Load)</span> <span class="d-val neg" id="valBallastDist"></span></div>
                    <div class="detail-row"><span class="d-lbl">Laden (To Disch)</span> <span class="d-val" id="valLadenDist"></span></div>
                    <div class="detail-row"><span class="d-lbl">Total Days</span> <span class="d-val" id="valTotalDays"></span></div>

                    <div style="font-family:var(--font-tech); font-size:0.8rem; margin:15px 0 5px 0; color:#fff; border-bottom:1px solid #333; padding-bottom:5px;">FINANCIALS</div>
                    <div class="detail-row"><span class="d-lbl">Gross Revenue</span> <span class="d-val pos" id="valRevenue"></span></div>
                    <div class="detail-row"><span class="d-lbl">Ballast Cost</span> <span class="d-val neg" id="valBallastCost"></span></div>
                    <div class="detail-row"><span class="d-lbl">Laden Fuel</span> <span class="d-val neg" id="valLadenFuel"></span></div>
                    <div class="detail-row"><span class="d-lbl">Port/Canal Expenses</span> <span class="d-val neg" id="valPortCanal"></span></div>
                    <div class="detail-row"><span class="d-lbl">OpEx (Running)</span> <span class="d-val neg" id="valOpex"></span></div>

                    <div class="ai-insight" id="aiOutput"></div>
                </div>
                <div class="p-body" id="emptyState" style="display:flex; align-items:center; justify-content:center; color:#555; text-align:center;">
                    Enter vessel coordinates and scan to see profitable voyages.
                </div>
            </aside>
        </div>
    </div>

    <datalist id="portList"></datalist>

    <script>
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
                document.getElementById('vlsfoPrice').innerText = "$" + m.vlsfo.toFixed(0);
                document.getElementById('mgoPrice').innerText = "$" + m.mgo.toFixed(0);
            } catch(e) {}
        }
        init();

        async function fillCoords() {
            const portName = document.getElementById('refPort').value.toUpperCase();
            if(!portName) return;
            try {
                const res = await fetch('/api/port-coords?port=' + portName);
                const data = await res.json();
                if(data.lat) {
                    document.getElementById('vLat').value = data.lat;
                    document.getElementById('vLng').value = data.lng;
                    updateShipMarker(data.lat, data.lng);
                }
            } catch(e){}
        }

        function updateShipMarker(lat, lng) {
            if(shipMarker) map.removeLayer(shipMarker);
            shipMarker = L.circleMarker([lat, lng], {radius:8, color:'#fff', fillColor:'#f59e0b', fillOpacity:1}).addTo(map).bindPopup("VESSEL POSITION");
            map.setView([lat, lng], 4);
        }

        async function scanMarket() {
            const lat = parseFloat(document.getElementById('vLat').value);
            const lng = parseFloat(document.getElementById('vLng').value);
            
            if(isNaN(lat) || isNaN(lng)) { alert("Please enter valid Latitude/Longitude"); return; }
            updateShipMarker(lat, lng);

            const params = {
                shipLat: lat,
                shipLng: lng,
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
                // Show Net Profit instead of TCE for quick view? Or TCE. Let's show TCE.
                el.innerHTML = \`
                    <div class="ci-top">
                        <span>\${v.loadPort} -> \${v.dischPort}</span>
                        <span class="tce-badge">\$\${v.financials.tce.toLocaleString()}/day</span>
                    </div>
                    <div class="ci-bot">
                        <span>\${v.commodity} • Ballast: \${v.ballastDist} NM</span>
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
            document.getElementById('valBallastDist').innerText = v.ballastDist.toLocaleString() + " NM (" + v.ballastDays.toFixed(1) + " days)";
            document.getElementById('valLadenDist').innerText = v.ladenDist.toLocaleString() + " NM (" + v.ladenDays.toFixed(1) + " days)";
            document.getElementById('valTotalDays').innerText = v.totalDays.toFixed(1) + " days";

            document.getElementById('valRevenue').innerText = "$" + f.revenue.toLocaleString();
            document.getElementById('valBallastCost').innerText = "-$" + f.cost_ballast_fuel.toLocaleString();
            document.getElementById('valLadenFuel').innerText = "-$" + f.cost_laden_fuel.toLocaleString();
            document.getElementById('valPortCanal').innerText = "-$" + (f.cost_port_dues + f.cost_canal).toLocaleString();
            document.getElementById('valOpex').innerText = "-$" + f.cost_opex.toLocaleString();

            document.getElementById('aiOutput').innerHTML = v.aiAnalysis;

            // Map Update (Vessel -> Load -> Disch)
            layerGroup.clearLayers();
            // Vessel Marker
            const shipPos = [document.getElementById('vLat').value, document.getElementById('vLng').value];
            L.circleMarker(shipPos, {radius:6, color:'#fff', fillColor:'#f59e0b', fillOpacity:1}).addTo(layerGroup).bindPopup("VESSEL");
            
            // Ports
            const p1 = [v.loadGeo.lat, v.loadGeo.lng];
            const p2 = [v.dischGeo.lat, v.dischGeo.lng];
            L.circleMarker(p1, {radius:5, color:'#00f2ff', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup("LOAD: "+v.loadPort);
            L.circleMarker(p2, {radius:5, color:'#bc13fe', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup("DISCH: "+v.dischPort);

            // Lines
            // Ballast: Dashed Orange
            L.polyline([shipPos, p1], {color: '#f59e0b', weight: 2, dashArray: '5, 10', opacity:0.7}).addTo(layerGroup);
            // Laden: Solid Cyan
            L.polyline([p1, p2], {color: '#00f2ff', weight: 3, opacity: 0.9}).addTo(layerGroup);
            
            map.fitBounds([shipPos, p1, p2], {padding:[50,50]});
        }
    </script>
</body>
</html>
`;

// =================================================================
// 3. BACKEND LOGIC
// =================================================================

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 3440; // NM
    const dLat = (lat2 - lat1) * Math.PI/180;
    const dLon = (lon2 - lon1) * Math.PI/180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 1.15); // +15% Sea Margin
}

function calculateFullVoyage(shipLat, shipLng, loadPortName, loadGeo, dischPortName, dischGeo, specs, market) {
    // 1. BALLAST LEG (Ship -> Load)
    const ballastDist = getDistance(shipLat, shipLng, loadGeo.lat, loadGeo.lng);
    const ballastDays = ballastDist / (specs.speed * 24);
    const costBallastFuel = ballastDays * specs.sea_cons * market.vlsfo;

    // 2. LADEN LEG (Load -> Disch)
    const ladenDist = getDistance(loadGeo.lat, loadGeo.lng, dischGeo.lat, dischGeo.lng);
    const ladenDays = ladenDist / (specs.speed * 24);
    
    // Cargo & Port
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

    // Total Duration
    const totalDays = ballastDays + ladenDays + portDays;

    // Fees
    let costCanal = 0;
    let canalNote = "";
    // Simplified Canal Logic based on Longitude crossing
    if ((loadGeo.lng < 35 && dischGeo.lng > 45) || (loadGeo.lng > 45 && dischGeo.lng < 35)) {
        costCanal += 200000; canalNote = "Suez";
    }
    
    const costOpex = totalDays * specs.opex;
    const grossRevenue = qty * cargo.rate;
    const commission = grossRevenue * 0.0375;

    const totalCost = costBallastFuel + costLadenFuel + costPortFuel + costPortDues + costCanal + costOpex + commission;
    const profit = grossRevenue - totalCost;
    const tce = (grossRevenue - (costBallastFuel + costLadenFuel + costPortFuel + costPortDues + costCanal + commission)) / totalDays;

    return {
        ballastDist, ballastDays, ladenDist, ladenDays, portDays, totalDays,
        cargo, qty,
        financials: {
            revenue: grossRevenue,
            cost_ballast_fuel: costBallastFuel,
            cost_laden_fuel: costLadenFuel + costPortFuel, // Combined for simplicity in UI
            cost_port_dues: costPortDues,
            cost_canal: costCanal,
            cost_opex: costOpex,
            profit, tce
        },
        canalNote
    };
}

function generateAnalysis(v) {
    let style = "color:#00f2ff";
    let advice = "STANDARD MARKET FIXTURE.";
    
    if(v.financials.tce > 20000) { style="color:#10b981; font-weight:bold"; advice="HIGHLY RECOMMENDED. Excellent TCE."; }
    else if(v.financials.tce < 5000) { style="color:#ef4444"; advice="NEGATIVE RETURNS. Do not fix."; }
    
    let text = `<strong>AI BROKER OPINION:</strong><br>${advice}<br>`;
    if(v.ballastDist > 1000) text += `<span style="color:orange">Warning: Long Ballast Leg (${v.ballastDist} NM). Eats into profit.</span><br>`;
    return text;
}

// --- API ---

app.get('/', (req, res) => res.send(FRONTEND_HTML));
app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));
app.get('/api/market', (req, res) => res.json(MARKET));

app.get('/api/port-coords', (req, res) => {
    const p = PORT_DB[req.query.port];
    res.json(p || {});
});

app.post('/api/analyze', (req, res) => {
    const { shipLat, shipLng, region, vType } = req.body;
    
    if(!shipLat || !shipLng) return res.json({success: false, error: "Missing coordinates"});

    const specs = VESSEL_SPECS[vType] || VESSEL_SPECS["SUPRAMAX"];
    const suggestions = [];

    // Filter potential load ports by Region (Simulating market availability)
    const potentialLoadPorts = Object.keys(PORT_DB).filter(p => {
        const port = PORT_DB[p];
        if(region === 'AMERICAS') return port.lng < -30;
        if(region === 'ASIA') return port.lng > 60;
        if(region === 'EUROPE') return port.lat > 48;
        if(region === 'MED') return port.lat > 30 && port.lat < 46 && port.lng > -6 && port.lng < 36;
        return true; // WORLD
    });

    // Randomly pick 5 opportunities
    for(let i=0; i<5; i++) {
        if(potentialLoadPorts.length === 0) break;
        const randIdx = Math.floor(Math.random() * potentialLoadPorts.length);
        const loadName = potentialLoadPorts[randIdx];
        const loadGeo = PORT_DB[loadName];
        
        // Pick a random discharge port (different from load)
        const dischName = Object.keys(PORT_DB)[Math.floor(Math.random() * Object.keys(PORT_DB).length)];
        const dischGeo = PORT_DB[dischName];

        const calc = calculateFullVoyage(shipLat, shipLng, loadName, loadGeo, dischName, dischGeo, specs, MARKET);

        // Logic check: Don't show if ballast is absurdly long (>5000nm) unless profit is huge
        if(calc.ballastDist < 5000 || calc.financials.profit > 100000) {
            suggestions.push({
                loadPort: loadName, dischPort: dischName,
                loadGeo, dischGeo,
                commodity: calc.cargo.name, qty: calc.qty,
                ballastDist: calc.ballastDist, ballastDays: calc.ballastDays,
                ladenDist: calc.ladenDist, ladenDays: calc.ladenDays,
                totalDays: calc.totalDays,
                financials: calc.financials,
                aiAnalysis: generateAnalysis(calc)
            });
        }
    }

    suggestions.sort((a,b) => b.financials.tce - a.financials.tce);
    res.json({success: true, voyages: suggestions});
});

app.listen(port, () => console.log(`VIYA BROKER V53 (NAVIGATOR) running on port ${port}`));
