import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- 1. FRONTEND KODU (HTML/CSS/JS) ---
// HTML'i doğrudan buradan sunuyoruz. Dosya derdi yok.
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
    <script src="https://unpkg.com/@turf/turf/turf.min.js"></script>
    <style>
        :root { --neon-cyan: #00f2ff; --neon-purple: #bc13fe; --deep-space: #030508; --panel-bg: rgba(10, 15, 25, 0.95); --card-bg: rgba(255, 255, 255, 0.03); --border-color: rgba(255, 255, 255, 0.1); --text-main: #e0e6ed; --text-muted: #94a3b8; --font-ui: 'Plus Jakarta Sans', sans-serif; --font-tech: 'Orbitron', sans-serif; --success: #00ff9d; --danger: #ff0055; --warning: #ffb700; }
        * { box-sizing: border-box; margin: 0; padding: 0; scroll-behavior: smooth; }
        body { background-color: var(--deep-space); color: var(--text-main); font-family: var(--font-ui); overflow-x: hidden; }
        nav { position: fixed; top: 0; width: 100%; z-index: 1000; background: rgba(3, 5, 8, 0.9); backdrop-filter: blur(15px); border-bottom: 1px solid var(--border-color); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        .brand { font-family: var(--font-tech); font-weight: 900; font-size: 1.4rem; letter-spacing: 1px; color: #fff; display: flex; align-items: center; gap: 10px; }
        .brand i { color: var(--neon-cyan); }
        .nav-links { display: flex; gap: 30px; }
        .nav-links a { text-decoration: none; color: var(--text-muted); font-size: 0.9rem; font-weight: 500; transition: 0.3s; }
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
        footer { border-top: 1px solid var(--border-color); padding: 50px 20px; text-align: center; color: var(--text-muted); font-size: 0.8rem; background: #020406; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: none; justify-content: center; align-items: center; z-index: 2000; }
        .login-box { background: #0f172a; border: 1px solid var(--border-color); padding: 40px; border-radius: 10px; width: 350px; text-align: center; box-shadow: 0 0 50px rgba(0,0,0,0.5); position: relative; }
        .close-modal { position: absolute; top: 15px; right: 20px; cursor: pointer; color: #666; font-size: 1.2rem; }
        .login-input { width: 100%; padding: 12px; margin: 10px 0; background: #05080e; border: 1px solid #334155; color: #fff; border-radius: 4px; font-family: var(--font-ui); }
        .login-input:focus { border-color: var(--neon-cyan); outline: none; }
        #dashboard-view { display: none; padding-top: 80px; height: 100vh; }
        .dash-grid { display: grid; grid-template-columns: 350px 1fr; gap: 20px; padding: 20px; height: calc(100vh - 80px); }
        .sidebar { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 25px; display: flex; flex-direction: column; gap: 20px; box-shadow: 0 0 30px rgba(0,0,0,0.5); overflow-y: auto; }
        .sidebar h3 { font-family: var(--font-tech); color: var(--neon-cyan); border-bottom: 1px solid #333; padding-bottom: 10px; font-size: 0.9rem; letter-spacing: 1px; }
        .input-group label { display: block; font-size: 0.75rem; color: #8892b0; margin-bottom: 5px; font-weight: 600; }
        .input-group input, .input-group select { width: 100%; background: #0b1221; border: 1px solid #233554; color: #fff; padding: 12px; border-radius: 4px; font-family: var(--font-ui); font-size: 0.9rem; transition: all 0.3s ease; }
        .input-group input:focus { border-color: var(--neon-cyan); outline: none; box-shadow: 0 0 10px rgba(0,242,255,0.1); }
        .sidebar-divider { height: 1px; background: linear-gradient(to right, transparent, #333, transparent); margin: 10px 0; }
        .map-container { position: relative; border-radius: 10px; overflow: hidden; border: 1px solid var(--border-color); background: #000; box-shadow: 0 0 30px rgba(0,0,0,0.5); }
        #map { width: 100%; height: 100%; }
        .hud { position: absolute; top: 20px; left: 20px; z-index: 500; background: rgba(5, 11, 20, 0.9); backdrop-filter: blur(10px); border: 1px solid var(--neon-cyan); padding: 20px; width: 260px; clip-path: polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%); }
        .hud-title { color: var(--neon-cyan); font-family: var(--font-tech); font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 15px; }
        .hud-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem; color: #cbd5e1; }
        .hud-val { font-weight: 700; color: #fff; font-family: var(--font-tech); }
        .profit { color: #00ff9d; font-size: 1.2rem; text-shadow: 0 0 10px rgba(0,255,157,0.3); }
        .results-box { position: absolute; bottom: 20px; right: 20px; z-index: 500; background: var(--panel-bg); border: 1px solid #333; border-radius: 8px; padding: 20px; width: 400px; max-height: 400px; overflow-y: auto; backdrop-filter: blur(10px); box-shadow: 0 0 30px rgba(0,0,0,0.6); }
        .res-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .res-title { font-family: var(--font-tech); color: var(--neon-cyan); font-size: 0.9rem; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem; }
        .detail-label { color: #94a3b8; }
        .detail-val { color: #fff; font-weight: 500; }
        .detail-val.neg { color: var(--danger); }
        .detail-val.pos { color: var(--success); }
        .ai-analysis-box { margin-top: 15px; padding: 10px; background: rgba(0, 242, 255, 0.05); border-left: 2px solid var(--neon-cyan); font-size: 0.8rem; color: #e2e8f0; line-height: 1.5; }
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
    <div class="loader" id="loader"><div style="text-align: center;"><div class="spinner" style="margin: 0 auto 20px;"></div><div style="font-family: var(--font-tech); color: var(--neon-cyan);">CALCULATING PRECISE ROUTE...</div></div></div>
    <nav>
        <div class="brand"><i class="fa-solid fa-anchor"></i> VIYA BROKER</div>
        <div class="nav-links"><a href="#landing-view" onclick="showLanding()">Home</a><a href="#features" onclick="showLanding()">Features</a><a href="#pricing" onclick="showLanding()">Pricing</a><a href="#contact" onclick="showLanding()">Contact</a></div>
        <button class="btn-nav" onclick="openLogin()">CLIENT LOGIN</button>
    </nav>
    <div class="modal-overlay" id="loginModal">
        <div class="login-box"><span class="close-modal" onclick="closeLogin()">&times;</span><h2 style="font-family: var(--font-tech); margin-bottom: 20px; color: #fff;">SECURE ACCESS</h2><input type="text" class="login-input" placeholder="Username (demo: admin)"><input type="password" class="login-input" placeholder="Password (demo: 1234)"><button class="btn-hero" style="width: 100%; margin-top: 20px; padding: 12px;" onclick="attemptLogin()">ENTER SYSTEM</button></div>
    </div>
    <div id="landing-view">
        <header class="hero"><div class="hero-content"><h1>NEXT GENERATION<br>MARITIME INTELLIGENCE</h1><p>Advanced route optimization, real-time financial forecasting, and global port analytics powered by AI.</p><button class="btn-hero" onclick="openLogin()">START FREE TRIAL</button></div></header>
        <section id="features" class="section"><div class="section-title">WHY CHOOSE <span>VIYA?</span></div><div class="grid-3"><div class="card"><i class="fa-solid fa-satellite-dish"></i><h3>AI Navigation</h3><p>High-precision routing.</p></div><div class="card"><i class="fa-solid fa-chart-line"></i><h3>Financial Analytics</h3><p>Instant voyage estimation.</p></div><div class="card"><i class="fa-solid fa-server"></i><h3>Global Database</h3><p>Access to major commercial ports.</p></div></div></section>
    </div>
    <div id="dashboard-view">
        <div class="dash-grid">
            <aside class="sidebar">
                <h3><i class="fa-solid fa-ship"></i> VESSEL & POSITION</h3>
                <div class="input-group"><label>VESSEL TYPE</label><select id="vType"><option value="Dry Bulk Carrier">Dry Bulk Carrier</option><option value="Crude Oil Tanker">Crude Oil Tanker</option><option value="Container Ship">Container Ship</option><option value="LNG Carrier">LNG Carrier</option></select></div>
                <datalist id="portList"><option value="ISTANBUL"><option value="ROTTERDAM"><option value="HAMBURG"><option value="NEW YORK"><option value="HOUSTON"><option value="SANTOS"><option value="SHANGHAI"><option value="SINGAPORE"><option value="TOKYO"><option value="JEBEL ALI"><option value="GIBRALTAR"><option value="SUEZ"><option value="RICHARDS BAY"><option value="NOVOROSSIYSK"><option value="CONSTANTA"></datalist>
                <div class="input-group"><label>ORIGIN PORT</label><input type="text" id="vLoc" list="portList" value="ISTANBUL" placeholder="Start Port..." oninput="this.value = this.value.toUpperCase()"></div>
                <div class="input-group"><label>DESTINATION PORT</label><input type="text" id="vRegion" list="portList" value="NEW YORK" placeholder="End Port..." oninput="this.value = this.value.toUpperCase()"></div>
                <div class="sidebar-divider"></div>
                <div class="input-group"><label>CARGO QTY (MT)</label><input type="number" id="vCargo" value="50000"></div>
                <div class="input-group"><label>FREIGHT RATE ($/MT)</label><input type="number" id="vFreight" value="24.5"></div>
                <button class="btn-hero" onclick="runCalculation()" style="width:100%; margin-top:20px; font-size:0.9rem; padding:12px;">CALCULATE VOYAGE</button>
                <div style="margin-top:auto; font-size:0.7rem; color:#444; text-align:center;">Port Database: <span style="color:var(--neon-cyan)">CONNECTED</span><br>Status: <span style="color:var(--success)">ONLINE</span></div>
            </aside>
            <div class="map-container">
                <div id="map"></div>
                <div class="hud" id="hud" style="display:none;"><div class="hud-title">VOYAGE TELEMETRY</div><div class="hud-row"><span>DISTANCE</span> <span class="hud-val" id="hudDist">---</span></div><div class="hud-row"><span>TIME</span> <span class="hud-val" id="hudDays">---</span></div><div class="hud-row"><span>PROFIT</span> <span class="hud-val profit" id="hudProfit">---</span></div></div>
                <div class="results-box" id="resBox" style="display:none;"><div class="res-header"><span class="res-title">COMMERCIAL BREAKDOWN</span><i class="fa-solid fa-file-invoice-dollar" style="color:var(--neon-cyan)"></i></div><div id="financialDetails"></div><div class="ai-analysis-box"><i class="fa-solid fa-robot" style="margin-right:5px;"></i><span id="aiText">Analyzing...</span></div></div>
            </div>
        </div>
    </div>
    <script>
        function openLogin() { document.getElementById('loginModal').style.display = 'flex'; }
        function closeLogin() { document.getElementById('loginModal').style.display = 'none'; }
        function attemptLogin() { closeLogin(); document.getElementById('landing-view').style.display = 'none'; document.getElementById('dashboard-view').style.display = 'block'; setTimeout(() => map.invalidateSize(), 100); showToast("System Ready", "success"); }
        function showLanding() { document.getElementById('dashboard-view').style.display = 'none'; document.getElementById('landing-view').style.display = 'block'; }
        function showToast(msg, type = 'info') { const t = document.getElementById('toast'); const icon = document.getElementById('toastIcon'); const txt = document.getElementById('toastMsg'); t.className = 'toast show ' + (type === 'error' ? 'error' : (type === 'warning' ? 'warning' : '')); icon.className = type === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'; if(type === 'info') icon.className = 'fa-solid fa-circle-info'; txt.innerText = msg; t.style.display = 'flex'; setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.style.display = 'none', 300); }, 3000); }
        const map = L.map('map', {zoomControl: false}).setView([30, 0], 2);
        L.control.zoom({position: 'bottomright'}).addTo(map);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: 'abcd', maxZoom: 19 }).addTo(map);
        const layerGroup = L.layerGroup().addTo(map);

        async function runCalculation() {
            const origin = document.getElementById('vLoc').value.toUpperCase();
            const dest = document.getElementById('vRegion').value.toUpperCase();
            const dwt = document.getElementById('vCargo').value;
            const loader = document.getElementById('loader');
            loader.style.display = 'grid';
            layerGroup.clearLayers();
            document.getElementById('hud').style.display = 'none';
            document.getElementById('resBox').style.display = 'none';

            try {
                // KENDI BACKEND'İMİZE İSTEK ATIYORUZ
                const res = await fetch(\`/sefer_onerisi?konum=\${origin}&bolge=\${dest}&dwt=\${dwt}\`);
                const data = await res.json();
                
                if(data.basari) {
                    const r = data.tavsiye.tumRotlarinAnalizi[0];
                    renderRoute(r.geoJSON, origin, dest);
                    updateUI(r.detay, r.finans, data.tavsiye.tavsiyeGerekcesi);
                    showToast("Calculation Complete", "success");
                } else {
                    showToast(data.error, "error");
                }
            } catch (err) {
                console.error(err);
                showToast("Connection Error", "error");
            } finally {
                loader.style.display = 'none';
            }
        }

        function renderRoute(geoJSON, startLabel, endLabel) {
            L.geoJSON(geoJSON, { style: { color: '#00f2ff', weight: 4, opacity: 0.9 } }).addTo(layerGroup);
            const c = geoJSON.coordinates;
            // Leaflet LatLng vs GeoJSON LngLat fix
            const start = [c[0][1], c[0][0]];
            const end = [c[c.length-1][1], c[c.length-1][0]];
            L.circleMarker(start, {radius:5, color:'#00f2ff', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup(startLabel);
            L.circleMarker(end, {radius:5, color:'#bc13fe', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup(endLabel);
            const line = L.geoJSON(geoJSON, { style: { color: '#fff', weight: 0, opacity: 0 } }).addTo(layerGroup);
            map.fitBounds(line.getBounds(), {padding: [50, 50]});
        }

        function updateUI(distStr, f, aiText) {
            const dist = parseInt(distStr.split(" ")[0]);
            const speed = 13.5;
            const days = dist / (speed * 24);
            
            document.getElementById('hudDist').innerText = dist.toLocaleString() + " NM";
            document.getElementById('hudDays').innerText = days.toFixed(1) + " DAYS";
            document.getElementById('hudProfit').innerText = "$" + f.netKarUSD.toLocaleString();
            document.getElementById('hud').style.display = 'block';

            const html = \`
                <div class="detail-row"><span class="detail-label">Freight Revenue</span> <span class="detail-val pos">+\$\${f.navlunUSD.toLocaleString()}</span></div>
                <div style="height:1px; background:#333; margin:5px 0;"></div>
                <div class="detail-row"><span class="detail-label">Fuel Cost</span> <span class="detail-val neg">-\$\${f.detaylar.fuel.toLocaleString()}</span></div>
                <div class="detail-row"><span class="detail-label">Canal Fees</span> <span class="detail-val neg">-\$\${f.detaylar.canal.toLocaleString()}</span></div>
                <div class="detail-row"><span class="detail-label">Port Dues</span> <span class="detail-val neg">-\$\${f.detaylar.port.toLocaleString()}</span></div>
                <div class="detail-row"><span class="detail-label">OpEx</span> <span class="detail-val neg">-\$\${f.detaylar.opex.toLocaleString()}</span></div>
                <div style="height:1px; background:#444; margin:10px 0;"></div>
                <div class="detail-row" style="font-size:1rem; margin-top:10px;">
                    <span class="detail-label" style="color:#fff">NET PROFIT</span> 
                    <span class="detail-val" style="color:\${f.netKarUSD > 0 ? '#00f2ff' : '#ff0055'}; font-size:1.1rem">\$\${f.netKarUSD.toLocaleString()}</span>
                </div>
            \`;
            document.getElementById('financialDetails').innerHTML = html;
            document.getElementById('aiText').innerHTML = aiText;
            document.getElementById('resBox').style.display = 'block';
        }
    </script>
</body>
</html>
`;

// --- 2. BACKEND (HESAPLAMA MOTORU) ---

// PORT DATABASE
const PORT_DB = {
    "ISTANBUL": { lat: 41.00, lng: 28.97 },
    "ROTTERDAM": { lat: 51.90, lng: 4.40 },
    "HAMBURG": { lat: 53.55, lng: 9.99 },
    "ANTWERP": { lat: 51.21, lng: 4.40 },
    "NEW YORK": { lat: 40.71, lng: -74.00 },
    "HOUSTON": { lat: 29.76, lng: -95.36 },
    "SANTOS": { lat: -23.96, lng: -46.33 },
    "SHANGHAI": { lat: 31.23, lng: 121.47 },
    "SINGAPORE": { lat: 1.29, lng: 103.81 },
    "TOKYO": { lat: 35.68, lng: 139.69 },
    "JEBEL ALI": { lat: 25.02, lng: 55.02 },
    "GIBRALTAR": { lat: 36.14, lng: -5.35 },
    "SUEZ": { lat: 29.97, lng: 32.55 },
    "RICHARDS BAY": { lat: -28.78, lng: 32.03 },
    "NOVOROSSIYSK": { lat: 44.71, lng: 37.77 },
    "CONSTANTA": { lat: 44.17, lng: 28.63 },
    "LONDON": { lat: 51.50, lng: 0.12 },
    "BARCELONA": { lat: 41.38, lng: 2.17 }
};

// WAYPOINTS
const WAYPOINTS = {
    "GIBRALTAR": [-5.6, 35.95],
    "SUEZ_N": [32.56, 31.26],
    "SUEZ_S": [32.56, 29.92],
    "BAB_EL_MANDEB": [43.4, 12.6],
    "SRI_LANKA": [80.6, 5.9],
    "MALACCA": [103.8, 1.3],
    "AEGEAN_EXIT": [26.0, 36.0],
    "ATLANTIC_MID": [-40.0, 35.0]
};

function calculateDistance(coord1, coord2) {
    const R = 3440; // NM
    const lat1 = coord1[1]; const lon1 = coord1[0];
    const lat2 = coord2[1]; const lon2 = coord2[0];
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// --- ANA ROUTE (Kullanıcı siteye girince HTML'i ver) ---
app.get('/', (req, res) => {
    res.send(FRONTEND_HTML);
});

// --- API ROUTE (Hesaplama) ---
app.get('/sefer_onerisi', (req, res) => {
    try {
        const konumRaw = req.query.konum || "ISTANBUL";
        const bolgeRaw = req.query.bolge || "NEW YORK";
        const originName = konumRaw.toUpperCase().trim();
        const destName = bolgeRaw.toUpperCase().trim();
        const dwt = parseInt(req.query.dwt) || 50000;
        const hiz = 13.5;

        const startPort = PORT_DB[originName];
        const endPort = PORT_DB[destName];

        if (!startPort || !endPort) {
            return res.json({ basari: false, error: `Liman veritabanında bulunamadı: ${!startPort ? originName : destName}` });
        }

        let path = [];
        let routeDescription = "Direct";
        let canalFee = 0;
        const startCoords = [startPort.lng, startPort.lat];
        const endCoords = [endPort.lng, endPort.lat];

        const isMed = (lat, lng) => (lat > 30 && lat < 46 && lng > -6 && lng < 36);
        const isAmericas = (lng) => (lng < -30);
        const isAsia = (lng) => (lng > 60);

        if (isMed(startPort.lat, startPort.lng) && isAmericas(endPort.lng)) {
            let prefix = [startCoords];
            if(startPort.lng > 25) prefix.push(WAYPOINTS.AEGEAN_EXIT);
            path = [...prefix, WAYPOINTS.GIBRALTAR, WAYPOINTS.ATLANTIC_MID, endCoords];
            routeDescription = "Via Gibraltar (Trans-Atlantic)";
        } else if ((isMed(startPort.lat, startPort.lng) || startPort.lng < 30) && isAsia(endPort.lng)) {
            let prefix = [];
            if (startPort.lat > 48) { prefix = [startCoords, WAYPOINTS.GIBRALTAR]; } else { prefix = [startCoords]; if(startPort.lng > 25 && startPort.lng < 30) prefix.push(WAYPOINTS.AEGEAN_EXIT); }
            path = [...prefix, WAYPOINTS.SUEZ_N, WAYPOINTS.SUEZ_S, WAYPOINTS.BAB_EL_MANDEB, WAYPOINTS.SRI_LANKA, WAYPOINTS.MALACCA, endCoords];
            routeDescription = "Via Suez Canal";
            canalFee = 250000; 
        } else {
            path = [startCoords, endCoords];
            routeDescription = "Direct / Coastal Route";
        }

        let totalDistNM = 0;
        for(let i=0; i<path.length-1; i++) { totalDistNM += calculateDistance(path[i], path[i+1]); }
        totalDistNM = Math.round(totalDistNM * 1.1); 

        const days = totalDistNM / (hiz * 24);
        const dailyFuelCons = 20 + (dwt / 10000) * 1.5; 
        const fuelPrice = 620; 
        const fuelCost = days * dailyFuelCons * fuelPrice;
        const dailyOpex = 5500 + (dwt / 10000) * 200; 
        const totalOpex = days * dailyOpex;
        const portDues = 40000 + (dwt * 0.5); 
        const marketFreightRate = 22.5; 
        const revenue = dwt * 0.95 * marketFreightRate; 
        const totalExpense = fuelCost + totalOpex + portDues + canalFee;
        const netProfit = revenue - totalExpense;

        res.json({
            basari: true,
            tavsiye: {
                tavsiyeGerekcesi: `Optimal route: ${routeDescription}. Distance: ${totalDistNM} NM.`,
                tumRotlarinAnalizi: [{
                    rotaAdi: routeDescription,
                    detay: `${totalDistNM} NM @ ${hiz} kts`,
                    geoJSON: { type: "LineString", coordinates: path },
                    finans: {
                        navlunUSD: Math.round(revenue),
                        netKarUSD: Math.round(netProfit),
                        detaylar: { fuel: Math.round(fuelCost), opex: Math.round(totalOpex), port: Math.round(portDues), canal: Math.round(canalFee) }
                    }
                }]
            }
        });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ basari: false, error: "Internal Error" });
    }
});

app.listen(port, () => {
    console.log(`VIYA BROKER FULL SYSTEM running on port ${port}`);
});
