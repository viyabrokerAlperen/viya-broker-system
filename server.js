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

// --- 1. FRONTEND KODU ---
const FRONTEND_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VIYA BROKER | Commercial Intelligence</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Orbitron:wght@400;600;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        :root { --neon-cyan: #00f2ff; --neon-purple: #bc13fe; --deep-space: #030508; --panel-bg: rgba(10, 15, 25, 0.95); --card-bg: rgba(255, 255, 255, 0.03); --border-color: rgba(255, 255, 255, 0.1); --text-main: #e0e6ed; --text-muted: #94a3b8; --font-ui: 'Plus Jakarta Sans', sans-serif; --font-tech: 'Orbitron', sans-serif; --success: #00ff9d; --danger: #ff0055; --warning: #ffb700; }
        * { box-sizing: border-box; margin: 0; padding: 0; scroll-behavior: smooth; }
        body { background-color: var(--deep-space); color: var(--text-main); font-family: var(--font-ui); overflow-x: hidden; }
        
        nav { position: fixed; top: 0; width: 100%; z-index: 1000; background: rgba(3, 5, 8, 0.95); backdrop-filter: blur(15px); border-bottom: 1px solid var(--border-color); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        .brand { font-family: var(--font-tech); font-weight: 900; font-size: 1.4rem; letter-spacing: 1px; color: #fff; display: flex; align-items: center; gap: 10px; }
        .brand i { color: var(--neon-cyan); }
        
        #dashboard-view { padding-top: 80px; height: 100vh; display: block; }
        .dash-grid { display: grid; grid-template-columns: 380px 1fr; gap: 20px; padding: 20px; height: calc(100vh - 80px); }
        
        .sidebar { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 25px; display: flex; flex-direction: column; gap: 15px; box-shadow: 0 0 30px rgba(0,0,0,0.5); overflow-y: auto; }
        .sidebar h3 { font-family: var(--font-tech); color: var(--neon-cyan); border-bottom: 1px solid #333; padding-bottom: 10px; font-size: 0.9rem; letter-spacing: 1px; }
        
        .input-group label { display: block; font-size: 0.75rem; color: #8892b0; margin-bottom: 5px; font-weight: 600; }
        .input-group input, .input-group select { width: 100%; background: #0b1221; border: 1px solid #233554; color: #fff; padding: 12px; border-radius: 4px; font-family: var(--font-ui); font-size: 0.9rem; transition: all 0.3s ease; }
        .input-group input:focus, .input-group select:focus { border-color: var(--neon-cyan); outline: none; box-shadow: 0 0 10px rgba(0,242,255,0.1); }
        
        .btn-action { background: linear-gradient(135deg, var(--neon-cyan), #00aaff); border: none; color: #000; padding: 15px; font-size: 1rem; font-weight: 800; font-family: var(--font-tech); cursor: pointer; border-radius: 5px; width: 100%; transition: 0.3s; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .btn-action:hover { transform: translateY(-2px); box-shadow: 0 0 20px rgba(0,242,255,0.4); }

        .cargo-list { margin-top: 15px; border-top: 1px solid #333; padding-top: 15px; }
        .cargo-item { background: rgba(255,255,255,0.03); border: 1px solid #333; padding: 15px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: 0.2s; position: relative; overflow: hidden; }
        .cargo-item:hover { border-color: var(--neon-cyan); background: rgba(0,242,255,0.05); }
        .cargo-item.active { border-color: var(--neon-cyan); background: rgba(0,242,255,0.1); box-shadow: 0 0 15px rgba(0,242,255,0.1); }
        .c-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
        .c-route { font-size: 0.9rem; font-weight: 700; color: #fff; }
        .c-profit { font-family: var(--font-tech); font-weight: 900; color: var(--success); font-size: 1.1rem; }
        .c-details { font-size: 0.8rem; color: #94a3b8; display: flex; justify-content: space-between; }
        
        .map-container { position: relative; border-radius: 10px; overflow: hidden; border: 1px solid var(--border-color); background: #000; box-shadow: 0 0 30px rgba(0,0,0,0.5); }
        #map { width: 100%; height: 100%; }
        
        .hud { position: absolute; top: 20px; left: 20px; z-index: 500; background: rgba(5, 11, 20, 0.95); backdrop-filter: blur(10px); border: 1px solid var(--neon-cyan); padding: 20px; width: 300px; clip-path: polygon(0 0, 100% 0, 100% 90%, 90% 100%, 0 100%); display: none; }
        .hud-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem; color: #cbd5e1; }
        .hud-val { font-weight: 700; color: #fff; font-family: var(--font-tech); }
        
        .loader { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.9); z-index: 2000; place-items: center; }
        .spinner { width: 50px; height: 50px; border: 3px solid var(--neon-cyan); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="loader" id="loader"><div style="text-align: center;"><div class="spinner" style="margin: 0 auto 20px;"></div><div style="font-family: var(--font-tech); color: var(--neon-cyan);">AI BROKER ANALYZING GLOBAL MARKET...</div></div></div>

    <nav>
        <div class="brand"><i class="fa-solid fa-anchor"></i> VIYA BROKER</div>
        <div style="color:var(--neon-cyan); font-size:0.8rem; font-family:var(--font-tech);">COMMERCIAL INTELLIGENCE V12</div>
    </nav>

    <div id="dashboard-view">
        <div class="dash-grid">
            <aside class="sidebar">
                <h3><i class="fa-solid fa-ship"></i> VESSEL STATUS</h3>
                
                <div class="input-group">
                    <label>VESSEL TYPE</label>
                    <select id="vType">
                        <option value="Supramax">Supramax (50-60k DWT)</option>
                        <option value="Panamax">Panamax (60-80k DWT)</option>
                        <option value="Handysize">Handysize (15-35k DWT)</option>
                    </select>
                </div>

                <div class="input-group">
                    <label>CURRENT POSITION (OPEN PORT)</label>
                    <input type="text" id="vLoc" list="portList" value="ISTANBUL" oninput="this.value = this.value.toUpperCase()">
                </div>

                <div style="height:1px; background:#333; margin:10px 0;"></div>
                <h3><i class="fa-solid fa-crosshairs"></i> MARKET SCAN</h3>

                <div class="input-group">
                    <label>TARGET REGION</label>
                    <select id="vRegion">
                        <option value="WORLD">GLOBAL SEARCH (Best Profit)</option>
                        <option value="AMERICAS">Americas (North/South)</option>
                        <option value="ASIA">Asia / Far East</option>
                        <option value="EUROPE">North Europe</option>
                        <option value="MED">Mediterranean / Black Sea</option>
                    </select>
                </div>

                <button class="btn-action" onclick="scanMarket()">FIND PROFITABLE CARGOES</button>

                <div id="cargoResultList" class="cargo-list" style="display:none;">
                    <div style="font-size:0.75rem; color:#666; margin-bottom:10px; font-weight:bold;">TOP OPPORTUNITIES:</div>
                    </div>

                <datalist id="portList"></datalist>
            </aside>

            <div class="map-container">
                <div id="map"></div>
                <div class="hud" id="hud">
                    <div style="color:var(--neon-cyan); font-family:var(--font-tech); margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:5px;">VOYAGE P&L</div>
                    <div class="hud-row"><span>ROUTE</span> <span class="hud-val" id="hudRoute">---</span></div>
                    <div class="hud-row"><span>DISTANCE</span> <span class="hud-val" id="hudDist">---</span></div>
                    <div class="hud-row"><span>DURATION</span> <span class="hud-val" id="hudDays">---</span></div>
                    <div style="height:1px; background:#333; margin:8px 0;"></div>
                    <div class="hud-row"><span>FREIGHT REVENUE</span> <span class="hud-val" style="color:#00ff9d" id="hudRev">---</span></div>
                    <div class="hud-row"><span>TOTAL EXPENSES</span> <span class="hud-val" style="color:#ff0055" id="hudExp">---</span></div>
                    <div style="height:1px; background:#333; margin:8px 0;"></div>
                    <div class="hud-row" style="font-size:1rem; margin-top:5px;"><span>NET PROFIT</span> <span class="hud-val profit" id="hudProfit">---</span></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const map = L.map('map', {zoomControl: false}).setView([35, 10], 3);
        L.control.zoom({position: 'bottomright'}).addTo(map);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: 'abcd', maxZoom: 19 }).addTo(map);
        const layerGroup = L.layerGroup().addTo(map);

        // Load Ports
        async function loadPorts() {
            try {
                const res = await fetch('/api/ports');
                const ports = await res.json();
                const dl = document.getElementById('portList');
                ports.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p;
                    dl.appendChild(opt);
                });
            } catch(e) { console.log("Port load error"); }
        }
        loadPorts();

        async function scanMarket() {
            const shipPos = document.getElementById('vLoc').value.toUpperCase();
            const region = document.getElementById('vRegion').value;
            const loader = document.getElementById('loader');
            
            loader.style.display = 'grid';
            document.getElementById('cargoResultList').style.display = 'none';
            document.getElementById('hud').style.display = 'none';
            layerGroup.clearLayers();

            try {
                // CALL THE BROKER API
                const res = await fetch(\`/api/broker?shipPos=\${shipPos}&region=\${region}\`);
                const data = await res.json();

                if(data.success) {
                    displayCargoes(data.cargoes, shipPos);
                } else {
                    alert(data.error || "No suitable cargoes found.");
                }
            } catch (err) {
                console.error(err);
                alert("Market Scan Failed. Check connection.");
            } finally {
                loader.style.display = 'none';
            }
        }

        function displayCargoes(cargoes, shipPos) {
            const list = document.getElementById('cargoResultList');
            list.innerHTML = '<div style="font-size:0.75rem; color:#888; margin-bottom:10px; font-weight:bold;">AI RECOMMENDATIONS:</div>';
            list.style.display = 'block';

            cargoes.forEach((c) => {
                const div = document.createElement('div');
                div.className = 'cargo-item';
                div.innerHTML = \`
                    <div class="c-header">
                        <div class="c-route">\${c.loadPort} <i class="fa-solid fa-arrow-right" style="color:#666; font-size:0.8em;"></i> \${c.dischPort}</div>
                        <div class="c-profit">$\${(c.profit/1000).toFixed(1)}k</div>
                    </div>
                    <div class="c-details">
                        <span>\${c.commodity} • \${(c.qty/1000).toFixed(0)}k mt</span>
                        <span style="color:#aaa;">\${c.days.toFixed(0)} days</span>
                    </div>
                \`;
                div.onclick = () => selectCargo(c, shipPos, div);
                list.appendChild(div);
            });
            
            // Auto-select best option
            if(cargoes.length > 0) selectCargo(cargoes[0], shipPos, list.children[1]);
        }

        function selectCargo(c, shipPos, el) {
            document.querySelectorAll('.cargo-item').forEach(x => x.classList.remove('active'));
            el.classList.add('active');

            drawRoute(c.routeGeo, c.loadPort, c.dischPort);

            document.getElementById('hudRoute').innerText = \`\${c.loadPort} -> \${c.dischPort}\`;
            document.getElementById('hudDist').innerText = c.distance.toLocaleString() + " NM";
            document.getElementById('hudDays').innerText = c.days.toFixed(1) + " DAYS";
            document.getElementById('hudRev').innerText = "$" + c.revenue.toLocaleString();
            document.getElementById('hudExp').innerText = "$" + c.expenses.toLocaleString();
            document.getElementById('hudProfit').innerText = "$" + c.profit.toLocaleString();
            document.getElementById('hud').style.display = 'block';
        }

        function drawRoute(geoJSON, load, disch) {
            layerGroup.clearLayers();
            
            // 1. NEON GLOW (Base)
            L.geoJSON(geoJSON, { style: { color: '#00f2ff', weight: 8, opacity: 0.3 } }).addTo(layerGroup);
            
            // 2. DASHED LINE (Top)
            const routeLine = L.geoJSON(geoJSON, { 
                style: { color: '#00f2ff', weight: 3, opacity: 1, dashArray: '10, 15', lineCap: 'round' } 
            }).addTo(layerGroup);

            const c = geoJSON.coordinates;
            const start = [c[0][1], c[0][0]];
            const end = [c[c.length-1][1], c[c.length-1][0]];

            L.circleMarker(start, {radius:6, color:'#00f2ff', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup("LOAD: " + load);
            L.circleMarker(end, {radius:6, color:'#bc13fe', fillColor:'#000', fillOpacity:1}).addTo(layerGroup).bindPopup("DISCH: " + disch);

            map.fitBounds(routeLine.getBounds(), {padding: [50, 50]});
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
    console.log(`✅ ${Object.keys(PORT_DB).length} Ports Loaded Successfully!`);
} catch (error) {
    console.error("❌ Error loading ports.json:", error.message);
    PORT_DB = { "ISTANBUL": { lat: 41.00, lng: 28.97 }, "NEW YORK": { lat: 40.71, lng: -74.00 } };
}

// --- WAYPOINT & ROTA MANTIĞI (GELİŞTİRİLMİŞ V12) ---
// Bu noktalar gemileri karalardan uzak tutar ve gerçekçi rotalar çizer.
const SEA_PATHS = {
    // BOĞAZLAR VE KANALLAR
    BOSPHORUS_N: [29.12, 41.23], // Karadeniz Girişi
    BOSPHORUS_S: [28.99, 40.99], // Marmara Girişi
    DARDANELLES_N: [26.70, 40.40], // Marmara Çıkışı
    DARDANELLES_S: [26.05, 39.95], // Ege Girişi
    
    // EGE ÇIKIŞ KORİDORU (Adaların etrafından dolan)
    AEGEAN_CORRIDOR: [
        [25.50, 39.00], // Kuzey Ege Açıkları
        [25.00, 38.00], // Orta Ege
        [23.50, 36.00]  // Kythira Geçidi (Ege'den Akdeniz'e çıkış)
    ],

    // AKDENİZ ANA HATTI (Doğu-Batı)
    MED_TRUNK_LINE: [
        [20.00, 35.50], // İyon Denizi
        [12.00, 37.00], // Sicilya-Tunus Arası
        [5.00, 37.50],  // Cezayir Açıkları
        [-4.00, 36.50], // Alboran Denizi
        [-5.60, 35.95]  // Cebelitarık Boğazı
    ],

    // ATLANTİK GEÇİŞLERİ (Büyük Çember Yaklaşımı)
    ATLANTIC_NORTH_CROSSING: [
        [-10.00, 36.00], // Portekiz Açıkları
        [-25.00, 38.00], // Azorlar Yakını
        [-45.00, 40.00], // Orta Atlantik
        [-65.00, 38.00]  // Gulf Stream Hattı
    ],
    
    // KIZILDENİZ & HİNT OKYANUSU
    SUEZ_CANAL: [[32.55, 31.30], [32.56, 29.92]],
    RED_SEA_TRUNK: [
        [35.00, 26.00],
        [40.00, 19.00],
        [43.40, 12.60] // Babülmendep
    ],
    INDIAN_TO_MALACCA: [
        [55.00, 12.00], // Socotra Açığı
        [80.00, 5.80],  // Sri Lanka Güneyi
        [95.00, 5.50],  // Sumatra Yaklaşımı
        [103.80, 1.30]  // Singapur
    ]
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

// --- ROTA OLUŞTURUCU (PATHFINDER) ---
function getRealisticRoute(startPort, endPort) {
    const start = [startPort.lng, startPort.lat];
    const end = [endPort.lng, endPort.lat];
    let path = [start];
    let description = "Direct Route";
    let canalFee = 0;

    // COĞRAFİ BÖLGE TANIMLARI
    const isBlackSea = (p) => p.lng > 27 && p.lat > 40.8 && p.lat < 47;
    const isMarmara = (p) => p.lng > 26.5 && p.lng < 30 && p.lat > 40 && p.lat < 41.2;
    const isMed = (p) => p.lat > 30 && p.lat < 46 && p.lng > -6 && p.lng < 36 && !isBlackSea(p) && !isMarmara(p);
    const isAmericas = (p) => p.lng < -30;
    const isAsia = (p) => p.lng > 60;

    // --- SENARYO: KARADENİZ/MARMARA -> DÜNYA ---
    // (Gemiyi zorla boğazlardan geçir)
    if (isBlackSea(startPort) || isMarmara(startPort)) {
        if (isBlackSea(startPort)) {
            path.push(SEA_PATHS.BOSPHORUS_N);
            path.push(SEA_PATHS.BOSPHORUS_S);
        }
        if (isBlackSea(startPort) || isMarmara(startPort)) {
            path.push(SEA_PATHS.DARDANELLES_N);
            path.push(SEA_PATHS.DARDANELLES_S);
            path = path.concat(SEA_PATHS.AEGEAN_CORRIDOR);
        }
    } else if (isMed(startPort)) {
        // Zaten Akdeniz'deyse, bulunduğu boylama göre koridora katıl
        // Basitleştirilmiş mantık: Ege çıkışının güneyine in
        if (startPort.lat > 37 && startPort.lng > 20) {
            path.push([23.50, 36.00]); // Kythira
        }
    }

    // --- SENARYO: AKDENİZ (veya oraya gelmiş gemi) -> AMERİKA ---
    // Cebelitarık'tan çık ve Atlantik'i geç
    if ((isBlackSea(startPort) || isMarmara(startPort) || isMed(startPort)) && isAmericas(endPort)) {
        path = path.concat(SEA_PATHS.MED_TRUNK_LINE); // Cebelitarık'a git
        path = path.concat(SEA_PATHS.ATLANTIC_NORTH_CROSSING); // Okyanusu geç
        path.push(end);
        description = "Via Turkish Straits & Gibraltar";
    }
    
    // --- SENARYO: AKDENİZ -> ASYA ---
    // Süveyş'e git
    else if ((isBlackSea(startPort) || isMarmara(startPort) || isMed(startPort)) && isAsia(endPort)) {
        // Akdeniz hattını tersine (Doğuya) çevirmemiz lazım veya direkt Süveyş'e yönlendir
        path.push(SEA_PATHS.SUEZ_CANAL[0]); // Kuzey Girişi
        path.push(SEA_PATHS.SUEZ_CANAL[1]); // Güney Çıkışı
        path = path.concat(SEA_PATHS.RED_SEA_TRUNK);
        path = path.concat(SEA_PATHS.INDIAN_TO_MALACCA);
        path.push(end);
        description = "Via Suez Canal & Malacca";
        canalFee = 250000;
    }
    // VARSAYILAN
    else {
        path.push(end);
        description = "Direct / Coastal Route";
    }

    // Mesafeyi hesapla
    let dist = 0;
    for(let i=0; i<path.length-1; i++) dist += calculateDistance(path[i], path[i+1]);
    dist = Math.round(dist * 1.1); // %10 sapma payı

    return { path, dist, description, canalFee };
}

// --- 3. BROKER MANTIĞI (KARLILIK HESAPLAYICI) ---
function findOpportunities(shipPosName, region) {
    const shipPort = PORT_DB[shipPosName];
    if (!shipPort) return [];

    const opportunities = [];
    const commodities = [
        { name: "Steel Products", rateMod: 1.2 }, 
        { name: "Wheat (Bulk)", rateMod: 1.0 }, 
        { name: "Coal", rateMod: 0.9 }, 
        { name: "Fertilizer", rateMod: 1.1 },
        { name: "Iron Ore", rateMod: 0.8 }
    ];

    // Hedef limanları filtrele
    const targets = Object.keys(PORT_DB).filter(p => {
        if (p === shipPosName) return false;
        const port = PORT_DB[p];
        if (region === 'AMERICAS') return port.lng < -30;
        if (region === 'ASIA') return port.lng > 60;
        if (region === 'EUROPE') return port.lat > 48 && port.lng > -10 && port.lng < 30;
        if (region === 'MED') return port.lat > 30 && port.lat < 46 && port.lng > -6 && port.lng < 36;
        return true; // WORLD
    });

    // Rastgele 5 fırsat oluştur (Gerçek veri entegrasyonu buraya yapılacak)
    for (let i = 0; i < 5; i++) {
        if (targets.length === 0) break;
        const randIdx = Math.floor(Math.random() * targets.length);
        const destName = targets[randIdx];
        const destPort = PORT_DB[destName];

        // Rotayı hesapla
        const routeData = getRealisticRoute(shipPort, destPort);
        
        // Rastgele Yük Detayları
        const cargoType = commodities[Math.floor(Math.random() * commodities.length)];
        const qty = 25000 + Math.floor(Math.random() * 35000); // 25k-60k
        const baseRate = 20 + Math.floor(Math.random() * 30); // Market Rate
        const finalRate = baseRate * cargoType.rateMod;
        
        // Finansallar
        const revenue = qty * finalRate;
        const fuelPrice = 620;
        const days = routeData.dist / (13.5 * 24);
        const fuelCost = days * 30 * fuelPrice; // 30mt/day
        const opex = days * 5500;
        const portDues = 45000;
        const expenses = fuelCost + opex + portDues + routeData.canalFee;
        const profit = revenue - expenses;

        if (profit > 0) { // Sadece kârlı işleri göster
            opportunities.push({
                loadPort: shipPosName,
                dischPort: destName,
                commodity: cargoType.name,
                qty: qty,
                rate: finalRate.toFixed(2),
                revenue: Math.round(revenue),
                expenses: Math.round(expenses),
                profit: Math.round(profit),
                distance: routeData.dist,
                days: days,
                routeGeo: { type: "LineString", coordinates: routeData.path }
            });
        }
    }

    // En kârlıya göre sırala
    return opportunities.sort((a, b) => b.profit - a.profit);
}

// --- API ROUTES ---
app.get('/', (req, res) => res.send(FRONTEND_HTML));

app.get('/api/ports', (req, res) => {
    res.json(Object.keys(PORT_DB).sort());
});

app.get('/api/broker', (req, res) => {
    const { shipPos, region } = req.query;
    if (!PORT_DB[shipPos]) return res.json({ success: false, error: "Ship position unknown." });
    
    const results = findOpportunities(shipPos, region);
    res.json({ success: true, cargoes: results });
});

// Eski hesaplama route'unu da broker mantığına yönlendirebiliriz veya ayrı tutabiliriz.
// Şimdilik uyumluluk için tutuyoruz.
app.get('/sefer_onerisi', (req, res) => {
    // Bu endpoint artık direkt hesaplama için kullanılıyor
    // Broker API ile aynı mantığı kullanabilir
    const origin = req.query.konum;
    const dest = req.query.bolge;
    const startPort = PORT_DB[origin];
    const endPort = PORT_DB[dest];
    
    if(!startPort || !endPort) return res.json({basari:false, error: "Port not found"});

    const routeData = getRealisticRoute(startPort, endPort);
    // ... (Finansal hesaplama yukarıdaki ile aynı mantıkta yapılabilir)
    // Şimdilik basit dönüş:
    res.json({
        basari: true,
        tavsiye: {
            tumRotlarinAnalizi: [{
                geoJSON: { type: "LineString", coordinates: routeData.path },
                finans: { navlunUSD: 0, netKarUSD: 0, detaylar: { fuel: 0, opex: 0, port: 0, canal: 0 } }, // Dummy for compatibility
                detay: `${routeData.dist} NM`
            }]
        }
    });
});

app.listen(port, () => console.log(`VIYA BROKER V12 (BROKER MODE) running on port ${port}`));
