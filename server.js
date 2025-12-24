import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- 1. FRONTEND KODU (LANDING PAGE + DASHBOARD) ---
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
        
        /* --- LANDING PAGE STYLES --- */
        nav { position: fixed; top: 0; width: 100%; z-index: 1000; background: rgba(3, 5, 8, 0.9); backdrop-filter: blur(15px); border-bottom: 1px solid var(--border-color); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        .brand { font-family: var(--font-tech); font-weight: 900; font-size: 1.4rem; letter-spacing: 1px; color: #fff; display: flex; align-items: center; gap: 10px; }
        .brand i { color: var(--neon-cyan); }
        .nav-links { display: flex; gap: 30px; }
        .nav-links a { text-decoration: none; color: var(--text-muted); font-size: 0.9rem; font-weight: 500; transition: 0.3s; cursor: pointer;}
        .nav-links a:hover { color: var(--neon-cyan); }
        .btn-nav { background: transparent; border: 1px solid var(--neon-cyan); color: var(--neon-cyan); padding: 8px 25px; border-radius: 50px; font-family: var(--font-tech); cursor: pointer; transition: 0.3s; font-size: 0.8rem; }
        .btn-nav:hover { background: var(--neon-cyan); color: #000; box-shadow: 0 0 20px rgba(0,242,255,0.4); }

        #landing-view { display: block; }
        .hero { height: 100vh; background: linear-gradient(rgba(3,5,8,0.7), rgba(3,5,8,1)), url('https://images.unsplash.com/photo-1559827291-72ee739d0d9a?q=80&w=2874&auto=format&fit=crop'); background-size: cover; background-position: center; background-attachment: fixed; display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px; }
        .hero h1 { font-family: var(--font-tech); font-size: 3.5rem; line-height: 1.1; margin-bottom: 20px; background: linear-gradient(to right, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero p { font-size: 1.1rem; color: var(--text-muted); max-width: 600px; margin: 0 auto 40px auto; }
        .btn-hero { background: linear-gradient(135deg, var(--neon-cyan), #00aaff); border: none; color: #000; padding: 18px 45px; font-size: 1rem; font-weight: 800; font-family: var(--font-tech); cursor: pointer; border-radius: 5px; box-shadow: 0 0 30px rgba(0,242,255,0.3); transition: 0.3s; text-decoration: none; }
        .btn-hero:hover { transform: translateY(-5px); box-shadow: 0 0 50px rgba(0,242,255,0.6); }
        
        .section { padding: 80px 20px; max-width: 1200px; margin: 0 auto; }
        .section-title { text-align: center; font-family: var(--font-tech); font-size: 2rem; margin-bottom: 50px; color: #fff; }
        .section-title span { color: var(--neon-cyan); }
        .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 40px; border-radius: 15px; transition: 0.3s; }
        .card:hover { border-color: var(--neon-cyan); transform: translateY(-10px); background: rgba(255,255,255,0.05); }
        .card i { font-size: 2rem; color: var(--neon-cyan); margin-bottom: 20px; }
        .card h3 { margin-bottom: 15px; color: #fff; font-family: var(--font-ui); }
        .card p { color: var(--text-muted); line-height: 1.6; font-size: 0.9rem; }
        
        /* LOGIN MODAL */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: none; justify-content: center; align-items: center; z-index: 2000; }
        .login-box { background: #0f172a; border: 1px solid var(--border-color); padding: 40px; border-radius: 10px; width: 350px; text-align: center; box-shadow: 0 0 50px rgba(0,0,0,0.5); position: relative; }
        .close-modal { position: absolute; top: 15px; right: 20px; cursor: pointer; color: #666; font-size: 1.2rem; }
        .login-input { width: 100%; padding: 12px; margin: 10px 0; background: #05080e; border: 1px solid #334155; color: #fff; border-radius: 4px; font-family: var(--font-ui); }
        .login-input:focus { border-color: var(--neon-cyan); outline: none; }

        /* --- DASHBOARD STYLES --- */
        #dashboard-view { display: none; padding-top: 80px; height: 100vh; }
        .dash-grid { display: grid; grid-template-columns: 400px 1fr; gap: 20px; padding: 20px; height: calc(100vh - 80px); }
        
        .sidebar { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 15px; box-shadow: 0 0 30px rgba(0,0,0,0.5); overflow-y: auto; }
        .sidebar h3 { font-family: var(--font-tech); color: var(--neon-cyan); border-bottom: 1px solid #333; padding-bottom: 10px; font-size: 0.9rem; letter-spacing: 1px; margin-top:10px; }
        
        .input-group label { display: block; font-size: 0.75rem; color: #8892b0; margin-bottom: 5px; font-weight: 600; }
        .input-group input, .input-group select { width: 100%; background: #0b1221; border: 1px solid #233554; color: #fff; padding: 10px; border-radius: 4px; font-family: var(--font-ui); font-size: 0.9rem; transition: all 0.3s ease; }
        .input-group input:focus, .input-group select:focus { border-color: var(--neon-cyan); outline: none; box-shadow: 0 0 10px rgba(0,242,255,0.1); }
        
        .btn-action { background: linear-gradient(135deg, var(--neon-cyan), #00aaff); border: none; color: #000; padding: 12px; font-size: 0.9rem; font-weight: 800; font-family: var(--font-tech); cursor: pointer; border-radius: 5px; width: 100%; transition: 0.3s; margin-top: 5px; }
        .btn-action:hover { transform: translateY(-2px); box-shadow: 0 0 20px rgba(0,242,255,0.4); }

        .cargo-list { margin-top: 10px; border-top: 1px solid #333; padding-top: 10px; }
        .cargo-item { background: rgba(255,255,255,0.03); border: 1px solid #333; padding: 12px; border-radius: 6px; margin-bottom: 8px; cursor: pointer; transition: 0.2s; position: relative; }
        .cargo-item:hover { border-color: var(--neon-cyan); background: rgba(0,242,255,0.05); }
        .cargo-item.active { border-color: var(--neon-cyan); background: rgba(0,242,255,0.1); box-shadow: 0 0 15px rgba(0,242,255,0.1); }
        .c-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
        .c-route { font-size: 0.85rem; font-weight: 700; color: #fff; }
        .c-profit { font-family: var(--font-tech); font-weight: 900; color: var(--success); font-size: 1rem; }
        .c-sub { font-size: 0.75rem; color: #94a3b8; display: flex; justify-content: space-between; }

        .map-container { position: relative; border-radius: 10px; overflow: hidden; border: 1px solid var(--border-color); background: #000; box-shadow: 0 0 30px rgba(0,0,0,0.5); }
        #map { width: 100%; height: 100%; }
        
        .results-box { position: absolute; bottom: 20px; right: 20px; z-index: 500; background: var(--panel-bg); border: 1px solid #333; border-radius: 8px; padding: 20px; width: 380px; max-height: 500px; overflow-y: auto; backdrop-filter: blur(10px); box-shadow: 0 0 30px rgba(0,0,0,0.8); display: none; }
        .res-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .res-title { font-family: var(--font-tech); color: var(--neon-cyan); font-size: 0.9rem; letter-spacing: 1px;}
        .d-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.85rem; }
        .d-lbl { color: #94a3b8; }
        .d-val { color: #fff; font-weight: 500; }
        .d-val.pos { color: var(--success); }
        .d-val.neg { color: var(--danger); }
        .ai-box { margin-top: 15px; padding: 10px; background: rgba(0, 242, 255, 0.05); border-left: 3px solid var(--neon-cyan); font-size: 0.8rem; color: #e2e8f0; line-height: 1.5; font-style: italic; }

        .loader { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.9); z-index: 2000; place-items: center; }
        .spinner { width: 50px; height: 50px; border: 3px solid var(--neon-cyan); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .toast { position: fixed; top: 20px; right: 20px; background: rgba(15, 23, 42, 0.95); border-left: 4px solid var(--neon-cyan); color: #fff; padding: 15px 25px; border-radius: 4px; z-index: 3000; display: none; box-shadow: 0 0 20px rgba(0,0,0,0.5); backdrop-filter: blur(5px); font-family: var(--font-ui); font-size: 0.9rem; align-items: center; gap: 10px; transform: translateX(120%); transition: transform 0.3s ease-out; }
        .toast.show { transform: translateX(0); }
        .toast.error { border-left-color: var(--danger); }
        .toast.warning { border-left-color: var(--warning); }
        .toast i { font-size: 1.2rem; }
    </style>
</head>
<body>
    <div class="toast" id="toast"><i class="fa-solid fa-circle-info" id="toastIcon"></i><span id="toastMsg">Notification</span></div>
    <div class="loader" id="loader"><div style="text-align: center;"><div class="spinner" style="margin: 0 auto 20px;"></div><div style="font-family: var(--font-tech); color: var(--neon-cyan);">AI BROKER SCANNING MARKET...</div></div></div>

    <nav>
        <div class="brand"><i class="fa-solid fa-anchor"></i> VIYA BROKER</div>
        <div class="nav-links">
            <a onclick="showLanding()">Home</a>
            <a onclick="showLanding()">Features</a>
            <a onclick="showLanding()">Pricing</a>
        </div>
        <button class="btn-nav" onclick="openLogin()">CLIENT LOGIN</button>
    </nav>

    <div class="modal-overlay" id="loginModal">
        <div class="login-box">
            <span class="close-modal" onclick="closeLogin()">&times;</span>
            <h2 style="font-family: var(--font-tech); margin-bottom: 20px; color: #fff;">SECURE ACCESS</h2>
            <input type="text" class="login-input" placeholder="Username (demo: admin)">
            <input type="password" class="login-input" placeholder="Password (demo: 1234)">
            <button class="btn-hero" style="width: 100%; margin-top: 20px; padding: 12px;" onclick="attemptLogin()">ENTER SYSTEM</button>
        </div>
    </div>

    <div id="landing-view">
        <header class="hero">
            <div class="hero-content">
                <h1>NEXT GENERATION<br>MARITIME INTELLIGENCE</h1>
                <p>Advanced route optimization, real-time financial forecasting, and global port analytics powered by AI.</p>
                <button class="btn-hero" onclick="openLogin()">START FREE TRIAL</button>
            </div>
        </header>
        <section id="features" class="section">
            <div class="section-title">WHY CHOOSE <span>VIYA?</span></div>
            <div class="grid-3">
                <div class="card"><i class="fa-solid fa-satellite-dish"></i><h3>AI Navigation</h3><p>Optimized routing for Bulk, Tanker & LNG vessels.</p></div>
                <div class="card"><i class="fa-solid fa-chart-line"></i><h3>Financial Analytics</h3><p>Instant voyage estimation with real-time Bunker & Port costs.</p></div>
                <div class="card"><i class="fa-solid fa-server"></i><h3>Global Database</h3><p>Access to over 500+ major commercial ports worldwide.</p></div>
            </div>
        </section>
        <footer><p>&copy; 2025 VIYA BROKER SYSTEMS. Engineered for the Future of Shipping.</p></footer>
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
                            <option value="SUEZMAX">Suezmax (160k)</option>
                            <option value="VLCC">VLCC (300k)</option>
                        </optgroup>
                        <optgroup label="GAS CARRIER">
                            <option value="LPG_MED">LPG Carrier (35k cbm)</option>
                            <option value="LNG_STD">LNG Standard (174k cbm)</option>
                            <option value="Q_MAX">Q-Max LNG (266k cbm)</option>
                        </optgroup>
                    </select>
                </div>

                <div class="input-group">
                    <label>OPEN PORT (CURRENT POSITION)</label>
                    <input type="text" id="vLoc" list="portList" value="ISTANBUL" oninput="this.value = this.value.toUpperCase()">
                </div>

                <div style="height:1px; background:#333; margin:10px 0;"></div>
                <h3><i class="fa-solid fa-globe"></i> COMMERCIAL SCAN</h3>

                <div class="input-group">
                    <label>TARGET MARKET</label>
                    <select id="vRegion">
                        <option value="WORLD">GLOBAL (Best Yield)</option>
                        <option value="AMERICAS">Americas (North/South)</option>
                        <option value="ASIA">Pacific / Asia</option>
                        <option value="EUROPE">Continent / North Sea</option>
                        <option value="MED">Mediterranean / Black Sea</option>
                    </select>
                </div>

                <button class="btn-action" onclick="scanMarket()">FIND PROFITABLE CARGOES</button>

                <div id="cargoResultList" class="cargo-list" style="display:none;">
                    <div style="font-size:0.75rem; color:#666; margin-bottom:10px; font-weight:bold;">MARKET OPPORTUNITIES:</div>
                    </div>

                <datalist id="portList"></datalist>
            </aside>

            <div class="map-container">
                <div id="map"></div>
                
                <div class="results-box" id="resBox">
                    <div class="res-header">
                        <span class="res-title">VOYAGE ESTIMATION</span>
                        <i class="fa-solid fa-chart-pie" style="color:var(--neon-cyan)"></i>
                    </div>
                    <div id="financialDetails"></div>
                    <div class="ai-box" id="aiText">Select a cargo to see analysis...</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const map = L.map('map', {zoomControl: false}).setView([35, 10], 3);
        L.control.zoom({position: 'bottomright'}).addTo(map);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 19 }).addTo(map);
        const layerGroup = L.layerGroup().addTo(map);

        // NAVIGATION
        function openLogin() { document.getElementById('loginModal').style.display = 'flex'; }
        function closeLogin() { document.getElementById('loginModal').style.display = 'none'; }
        function attemptLogin() { 
            closeLogin(); 
            document.getElementById('landing-view').style.display = 'none'; 
            document.getElementById('dashboard-view').style.display = 'block'; 
            setTimeout(() => map.invalidateSize(), 100); 
            showToast("System Ready. Welcome Admiral.", "success"); 
        }
        function showLanding() {
            document.getElementById('dashboard-view').style.display = 'none';
            document.getElementById('landing-view').style.display = 'block';
        }
        function showToast(msg, type = 'info') { 
            const t = document.getElementById('toast'); 
            const icon = document.getElementById('toastIcon'); 
            const txt = document.getElementById('toastMsg'); 
            t.className = 'toast show ' + (type === 'error' ? 'error' : (type === 'warning' ? 'warning' : '')); 
            icon.className = type === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'; 
            if(type === 'info') icon.className = 'fa-solid fa-circle-info'; 
            txt.innerText = msg; 
            t.style.display = 'flex'; 
            setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.style.display = 'none', 300); }, 3000); 
        }

        // Load Ports
        async function loadPorts() {
            try {
                const res = await fetch('/api/ports');
                const ports = await res.json();
                const dl = document.getElementById('portList');
                ports.forEach(p => { const opt = document.createElement('option'); opt.value = p; dl.appendChild(opt); });
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

                if(data.success) {
                    displayCargoes(data.cargoes);
                } else {
                    showToast(data.error, "error");
                }
            } catch (err) { showToast("Market Scan Error", "error"); } finally { loader.style.display = 'none'; }
        }

        function displayCargoes(cargoes) {
            const list = document.getElementById('cargoResultList');
            list.innerHTML = '<div style="font-size:0.75rem; color:#888; margin-bottom:10px; font-weight:bold;">MARKET OPPORTUNITIES:</div>';
            list.style.display = 'block';

            cargoes.forEach((c) => {
                const div = document.createElement('div');
                div.className = 'cargo-item';
                div.innerHTML = \`
                    <div class="c-header">
                        <div class="c-route">\${c.loadPort} -> \${c.dischPort}</div>
                        <div class="c-profit">$\${(c.financials.profit/1000).toFixed(1)}k</div>
                    </div>
                    <div class="c-sub">
                        <span>\${c.commodity} • \${(c.qty/1000).toFixed(1)}k \${c.unit}</span>
                        <span>\${c.durationDays.toFixed(0)} days</span>
                    </div>
                \`;
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
                
                <div class="d-row"><span class="d-lbl">Freight Revenue</span> <span class="d-val pos">+\$\${f.revenue.toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">Bunker Cost</span> <span class="d-val neg">-\$\${f.fuelCost.toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">Port Dues</span> <span class="d-val neg">-\$\${f.portDues.toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">Canal Fees</span> <span class="d-val neg">-\$\${f.canalFee.toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">OpEx</span> <span class="d-val neg">-\$\${f.opex.toLocaleString()}</span></div>
                <div class="d-row"><span class="d-lbl">Commission</span> <span class="d-val neg">-\$\${f.commission.toLocaleString()}</span></div>
                
                <div style="height:1px; background:#444; margin:10px 0;"></div>
                <div class="d-row" style="font-size:1.1rem; margin-top:10px;">
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
            L.geoJSON(geoJSON, { style: { color: '#00f2ff', weight: 8, opacity: 0.3 } }).addTo(layerGroup); // Glow
            const line = L.geoJSON(geoJSON, { style: { color: '#00f2ff', weight: 3, opacity: 1, dashArray: '10, 15', lineCap: 'round' } }).addTo(layerGroup);
            
            const c = geoJSON.coordinates;
            const start = [c[0][1], c[0][0]];
            const end = [c[c.length-1][1], c[c.length-1][0]];
            L.circleMarker(start, {radius:6, color:'#00f2ff', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup("LOAD");
            L.circleMarker(end, {radius:6, color:'#bc13fe', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup("DISCH");
            map.fitBounds(line.getBounds(), {padding: [50, 50]});
        }
    </script>
</body>
</html>
`;

// --- 2. BACKEND & DATA ---

let PORT_DB = {};
try {
    const rawData = fs.readFileSync(path.join(__dirname, 'ports.json'));
    const jsonData = JSON.parse(rawData);
    for (const [key, val] of Object.entries(jsonData)) {
        PORT_DB[key.toUpperCase()] = { lat: val[1], lng: val[0] };
    }
    console.log(`✅ ${Object.keys(PORT_DB).length} Ports Loaded.`);
} catch (error) { console.error("Ports Error"); }

// --- DETAYLI GEMİ VERİTABANI (DRY, TANKER, GAS) ---
const VESSEL_SPECS = {
    // DRY BULK
    "HANDYSIZE": { type: "BULK", dwt: 35000, speed: 13.0, cons: 22, opex: 4500 },
    "SUPRAMAX":  { type: "BULK", dwt: 58000, speed: 13.5, cons: 28, opex: 5500 },
    "ULTRAMAX":  { type: "BULK", dwt: 64000, speed: 13.5, cons: 30, opex: 5800 },
    "PANAMAX":   { type: "BULK", dwt: 82000, speed: 13.0, cons: 34, opex: 6500 },
    "KAMSARMAX": { type: "BULK", dwt: 85000, speed: 13.0, cons: 35, opex: 6700 },
    "CAPESIZE":  { type: "BULK", dwt: 180000, speed: 12.5, cons: 45, opex: 8000 },
    // TANKER
    "MR_TANKER": { type: "TANKER", dwt: 50000, speed: 13.0, cons: 26, opex: 6500 },
    "AFRAMAX":   { type: "TANKER", dwt: 115000, speed: 12.5, cons: 40, opex: 7500 },
    "SUEZMAX":   { type: "TANKER", dwt: 160000, speed: 12.5, cons: 48, opex: 8500 },
    "VLCC":      { type: "TANKER", dwt: 300000, speed: 12.0, cons: 65, opex: 10000 },
    // GAS
    "LPG_MED":   { type: "GAS", dwt: 35000, speed: 16.0, cons: 30, opex: 9000 },
    "LNG_STD":   { type: "GAS", dwt: 90000, speed: 19.0, cons: 80, opex: 14000 }, // ~174k cbm
    "Q_MAX":     { type: "GAS", dwt: 130000, speed: 18.0, cons: 100, opex: 16000 } // ~266k cbm
};

// --- YÜK TİPLERİ (COMMODITIES) ---
const COMMODITY_DB = {
    "BULK": [
        { name: "Steel Coils", rate: 35 }, { name: "Heavy Grain", rate: 28 }, 
        { name: "Iron Ore", rate: 18 }, { name: "Thermal Coal", rate: 22 }, 
        { name: "Fertilizer", rate: 32 }, { name: "Scrap Metal", rate: 40 }
    ],
    "TANKER": [
        { name: "Crude Oil", rate: 25 }, { name: "Diesel/Gasoil", rate: 30 },
        { name: "Jet Fuel", rate: 35 }, { name: "Naphtha", rate: 28 },
        { name: "Fuel Oil", rate: 20 }
    ],
    "GAS": [
        { name: "LNG (Liquefied Natural Gas)", rate: 85 }, 
        { name: "LPG (Propane/Butane)", rate: 65 },
        { name: "Ammonia", rate: 70 }
    ]
};

// --- ROTA & COĞRAFYA (SEA WOLVES GRID) ---
const SEA_NETWORK = {
    BOSPHORUS: [[29.1, 41.25], [29.05, 41.1], [28.98, 41.0], [28.95, 40.95]],
    MARMARA: [[28.5, 40.8], [27.5, 40.7]],
    DARDANELLES: [[26.7, 40.4], [26.4, 40.15], [26.2, 40.0]],
    AEGEAN_EXIT: [[25.8, 39.5], [25.0, 38.0], [24.5, 37.0], [23.5, 36.0]],
    MED_EAST: [[20.0, 35.5], [15.0, 36.0]],
    MED_CENTRAL: [[12.0, 37.5], [11.0, 37.2]],
    MED_WEST: [[8.0, 37.5], [4.0, 37.5], [0.0, 37.0], [-3.0, 36.5]],
    GIBRALTAR: [[-5.3, 36.0], [-5.8, 35.9]],
    ATLANTIC_NORTH: [[-10.0, 36.0], [-20.0, 38.0], [-30.0, 40.0], [-40.0, 41.5], [-50.0, 41.0], [-60.0, 40.0], [-68.0, 40.0], [-72.0, 40.2]],
    SUEZ_CANAL: [[32.55, 31.25], [32.56, 29.92]],
    RED_SEA: [[34.0, 27.0], [38.0, 22.0], [42.0, 15.0], [43.4, 12.6]],
    INDIAN_OCEAN: [[50.0, 12.0], [60.0, 10.0], [75.0, 6.0], [80.5, 5.8], [95.0, 5.8]],
    MALACCA: [[100.0, 3.0], [103.8, 1.3]],
    SOUTH_CHINA_SEA: [[105.0, 5.0], [110.0, 10.0], [115.0, 15.0]]
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

function getSmartRoute(startPort, endPort) {
    const start = [startPort.lng, startPort.lat];
    const end = [endPort.lng, endPort.lat];
    let path = [start];
    let routeDesc = "Direct";
    let canal = "NONE";

    const isBlackSea = (p) => p.lng > 27 && p.lat > 40.8 && p.lat < 47;
    const isMarmara = (p) => p.lng > 27 && p.lng < 30 && p.lat > 40 && p.lat < 41.2;
    const isAmericas = (p) => p.lng < -30;
    const isAsia = (p) => p.lng > 60;
    const isMed = (p) => p.lat > 30 && p.lat < 46 && p.lng > -6 && p.lng < 36 && !isBlackSea(p);

    if ((isBlackSea(startPort) || isMarmara(startPort) || startPort.lng > 26) && isAmericas(endPort)) {
        if(isBlackSea(startPort)) path = path.concat(SEA_NETWORK.BOSPHORUS);
        if(isBlackSea(startPort) || isMarmara(startPort)) path = path.concat(SEA_NETWORK.MARMARA);
        path = path.concat(SEA_NETWORK.DARDANELLES);
        path = path.concat(SEA_NETWORK.AEGEAN_EXIT);
        path = path.concat(SEA_NETWORK.MED_EAST, SEA_NETWORK.MED_CENTRAL, SEA_NETWORK.MED_WEST, SEA_NETWORK.GIBRALTAR);
        path = path.concat(SEA_NETWORK.ATLANTIC_NORTH);
        path.push(end);
        routeDesc = "Via Turkish Straits & Gibraltar";
    }
    else if ((isMed(startPort) || isBlackSea(startPort)) && isAsia(endPort)) {
        path.push(SEA_NETWORK.SUEZ_CANAL[0]);
        path = path.concat(SEA_NETWORK.SUEZ_CANAL, SEA_NETWORK.RED_SEA, SEA_NETWORK.INDIAN_OCEAN, SEA_NETWORK.MALACCA);
        if(endPort.lat > 20) path = path.concat(SEA_NETWORK.SOUTH_CHINA_SEA);
        path.push(end);
        routeDesc = "Via Suez Canal & Malacca";
        canal = "SUEZ";
    }
    else {
        path.push(end);
    }

    let dist = 0;
    for(let i=0; i<path.length-1; i++) dist += calculateDistance(path[i], path[i+1]);
    
    return { 
        path: { type: "LineString", coordinates: path }, 
        dist: Math.round(dist * 1.05),
        desc: routeDesc,
        canal: canal
    };
}

// --- 3. AI BROKER ENGINE ---
function generateAIAnalysis(profit, routeDesc, duration, revenue, vType) {
    const margin = (profit / revenue) * 100;
    let text = `<strong>AI BROKER ANALYSIS (${vType}):</strong><br>`;
    
    text += `Route: ${routeDesc}. Time: ${duration.toFixed(1)} days.<br>`;
    
    if (margin > 30) text += `<span style="color:#00ff9d">STRONG FIX. High margin (${margin.toFixed(1)}%). Priority Recommendation.</span>`;
    else if (margin > 15) text += `<span style="color:#00f2ff">Standard market fixture. Reliable cash flow.</span>`;
    else if (margin > 0) text += `<span style="color:#ffb700">Marginal return. Consider only for repositioning.</span>`;
    else text += `<span style="color:#ff0055">NEGATIVE YIELD. Do not fix unless contract obligation.</span>`;

    return text;
}

function findOpportunities(shipPosName, region, vType) {
    const shipPort = PORT_DB[shipPosName];
    if (!shipPort) return [];

    const specs = VESSEL_SPECS[vType] || VESSEL_SPECS["SUPRAMAX"];
    const category = specs.type; // BULK, TANKER, GAS
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

    for(let i=0; i<6; i++) {
        if(targets.length === 0) break;
        const destName = targets[Math.floor(Math.random() * targets.length)];
        const route = getSmartRoute(shipPort, PORT_DB[destName]);
        
        // Cargo Logic
        const comm = commodities[Math.floor(Math.random() * commodities.length)];
        const qty = Math.min(specs.dwt * 0.95, 25000 + Math.random()*40000); 
        const freightRate = comm.rate + (Math.random() * 5 - 2.5);
        
        // Financials
        const duration = route.dist / (specs.speed * 24);
        const revenue = qty * freightRate;
        const fuelCost = duration * specs.cons * 620; // $620/mt VLSFO
        const opex = duration * specs.opex;
        const portDues = 40000 + (specs.dwt * 0.4);
        let canalFee = 0;
        if(route.canal === "SUEZ") canalFee = 180000 + (specs.dwt * 0.5);
        
        const commission = revenue * 0.0375; // Broker comm
        const totalExp = fuelCost + opex + portDues + canalFee + commission;
        const profit = revenue - totalExp;

        const aiText = generateAIAnalysis(profit, route.desc, duration, revenue, vType);

        if(profit > -50000) {
            opportunities.push({
                loadPort: shipPosName,
                dischPort: destName,
                commodity: comm.name,
                qty: Math.floor(qty),
                unit: "mt",
                routeGeo: route.path,
                distance: route.dist,
                durationDays: duration,
                aiAnalysis: aiText,
                financials: {
                    revenue: Math.round(revenue),
                    fuelCost: Math.round(fuelCost),
                    opex: Math.round(opex),
                    portDues: Math.round(portDues),
                    canalFee: Math.round(canalFee),
                    commission: Math.round(commission),
                    profit: Math.round(profit)
                }
            });
        }
    }
    return opportunities.sort((a,b) => b.financials.profit - a.financials.profit);
}

// --- API ROUTES ---
app.get('/', (req, res) => res.send(FRONTEND_HTML));
app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));
app.get('/api/broker', (req, res) => {
    const { shipPos, region, vType } = req.query;
    if (!PORT_DB[shipPos]) return res.json({ success: false, error: "Unknown Port" });
    const results = findOpportunities(shipPos, region, vType);
    res.json({ success: true, cargoes: results });
});

app.listen(port, () => console.log(`VIYA BROKER V15 (EMPIRE) running on port ${port}`));
