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
app.use(express.static(__dirname));

// =================================================================
// 1. DATA & CONFIG (GENİŞLETİLMİŞ FİLO & KARGOLAR)
// =================================================================

const VESSEL_SPECS = {
    // --- DRY BULK ---
    "HANDYSIZE":    { type: "BULK", dwt: 35000, default_speed: 13.0, sea_cons: 22, port_cons: 2.5, opex: 4500 },
    "HANDYMAX":     { type: "BULK", dwt: 45000, default_speed: 13.0, sea_cons: 24, port_cons: 3.0, opex: 5000 },
    "SUPRAMAX":     { type: "BULK", dwt: 58000, default_speed: 13.5, sea_cons: 28, port_cons: 3.5, opex: 5500 },
    "ULTRAMAX":     { type: "BULK", dwt: 64000, default_speed: 13.5, sea_cons: 29, port_cons: 3.5, opex: 5800 },
    "PANAMAX":      { type: "BULK", dwt: 82000, default_speed: 13.0, sea_cons: 32, port_cons: 4.0, opex: 6500 },
    "KAMSARMAX":    { type: "BULK", dwt: 85000, default_speed: 13.0, sea_cons: 33, port_cons: 4.0, opex: 6700 },
    "CAPESIZE":     { type: "BULK", dwt: 180000, default_speed: 12.5, sea_cons: 45, port_cons: 5.0, opex: 8000 },
    "NEWCASTLEMAX": { type: "BULK", dwt: 205000, default_speed: 12.5, sea_cons: 50, port_cons: 5.5, opex: 8500 },

    // --- TANKER ---
    "SMALL_CHEM":   { type: "TANKER", dwt: 19000, default_speed: 13.0, sea_cons: 18, port_cons: 3.0, opex: 6000 },
    "MR_TANKER":    { type: "TANKER", dwt: 50000, default_speed: 13.0, sea_cons: 26, port_cons: 4.5, opex: 7000 },
    "LR1":          { type: "TANKER", dwt: 75000, default_speed: 13.0, sea_cons: 32, port_cons: 5.0, opex: 7500 },
    "AFRAMAX":      { type: "TANKER", dwt: 115000, default_speed: 12.5, sea_cons: 40, port_cons: 6.0, opex: 8000 },
    "SUEZMAX":      { type: "TANKER", dwt: 160000, default_speed: 12.5, sea_cons: 48, port_cons: 7.0, opex: 9000 },
    "VLCC":         { type: "TANKER", dwt: 300000, default_speed: 12.0, sea_cons: 65, port_cons: 8.0, opex: 10500 },

    // --- GAS (LNG/LPG) ---
    "LPG_MGC":      { type: "GAS", dwt: 38000, default_speed: 16.0, sea_cons: 35, port_cons: 6.0, opex: 9000 },
    "LPG_VLGC":     { type: "GAS", dwt: 55000, default_speed: 16.5, sea_cons: 45, port_cons: 7.0, opex: 11000 },
    "LNG_CONV":     { type: "GAS", dwt: 75000, default_speed: 19.0, sea_cons: 70, port_cons: 8.0, opex: 14000 },
    "LNG_Q_FLEX":   { type: "GAS", dwt: 110000, default_speed: 19.5, sea_cons: 90, port_cons: 10.0, opex: 16000 }
};

const CARGOES = {
    "BULK": [
        {name: "Grain", rate: 32, loadRate: 15000, dischRate: 10000},
        {name: "Coal", rate: 24, loadRate: 25000, dischRate: 20000},
        {name: "Iron Ore", rate: 19, loadRate: 40000, dischRate: 35000},
        {name: "Steel Products", rate: 45, loadRate: 8000, dischRate: 6000},
        {name: "Fertilizer", rate: 29, loadRate: 12000, dischRate: 10000},
        {name: "Scrap", rate: 35, loadRate: 10000, dischRate: 8000},
        {name: "Bauxite", rate: 21, loadRate: 30000, dischRate: 25000}
    ],
    "TANKER": [
        {name: "Crude Oil", rate: 28, loadRate: 50000, dischRate: 40000},
        {name: "Diesel/Gasoil", rate: 35, loadRate: 3000, dischRate: 3000},
        {name: "Naphtha", rate: 31, loadRate: 3500, dischRate: 3500},
        {name: "Jet Fuel", rate: 38, loadRate: 2500, dischRate: 2500},
        {name: "Vegoil", rate: 42, loadRate: 2000, dischRate: 2000}
    ],
    "GAS": [
        {name: "LNG", rate: 65, loadRate: 20000, dischRate: 20000},
        {name: "LPG (Propane)", rate: 55, loadRate: 15000, dischRate: 15000},
        {name: "Ammonia", rate: 58, loadRate: 12000, dischRate: 12000}
    ]
};

let MARKET = { brent: 0, heatingOil: 0, vlsfo: 0, mgo: 0, lastUpdate: 0 };

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
    <title>VIYA BROKER | Global Maritime Intelligence</title>
    <link rel="icon" href="https://raw.githubusercontent.com/viyabrokerAlperen/viya-broker-system/main/viya_broker_logo.png" type="image/png">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Orbitron:wght@400;600;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        :root { --neon-cyan: #00f2ff; --neon-purple: #bc13fe; --deep-space: #050a14; --panel-bg: rgba(10, 15, 25, 0.90); --card-bg: rgba(255, 255, 255, 0.03); --border-color: rgba(255, 255, 255, 0.08); --text-main: #e2e8f0; --text-muted: #94a3b8; --font-ui: 'Plus Jakarta Sans', sans-serif; --font-tech: 'Orbitron', sans-serif; --success: #10b981; --danger: #ef4444; --warning: #f59e0b; }
        * { box-sizing: border-box; margin: 0; padding: 0; scroll-behavior: smooth; }
        body { background-color: var(--deep-space); color: var(--text-main); font-family: var(--font-ui); overflow-x: hidden; font-size:13px; }
        
        nav { position: fixed; top: 0; width: 100%; z-index: 1000; background: rgba(5, 10, 20, 0.95); backdrop-filter: blur(15px); border-bottom: 1px solid var(--border-color); padding: 0.5rem 2rem; display: none; justify-content: space-between; align-items: center; transition: 0.5s; }
        .brand { display: flex; align-items: center; cursor:pointer; gap: 10px; font-family: var(--font-tech); font-size: 1.2rem; font-weight: 900; color: #fff; }
        .brand img { height: 40px; } 
        
        .nav-links { display: flex; gap: 30px; }
        .nav-item { color: var(--text-muted); cursor: pointer; font-weight: 600; transition: 0.3s; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 5px; }
        .nav-item:hover, .nav-item.active { color: var(--neon-cyan); border-bottom: 2px solid var(--neon-cyan); text-shadow: 0 0 15px rgba(0,242,255,0.4); }
        
        .live-ticker { font-family: var(--font-tech); font-size: 0.7rem; color: var(--text-muted); display:flex; gap:20px; align-items:center; }
        .blinking { animation: blinker 2s linear infinite; color: var(--success); font-weight:bold;}
        @keyframes blinker { 50% { opacity: 0.5; } }

        #landing-view { 
            position: fixed; top: 0; left: 0; width: 100%; height: 100vh; 
            background: linear-gradient(rgba(3,5,8,0.9), rgba(3,5,8,0.8)), url('https://images.unsplash.com/photo-1559827291-72ee739d0d9a?q=80&w=2874&auto=format&fit=crop'); 
            background-size: cover; background-position: center; 
            z-index: 9999; 
            display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;
            transition: opacity 0.8s ease-in-out;
        }
        .landing-logo-img { max-width: 300px; margin-bottom: 30px; filter: drop-shadow(0 0 40px rgba(0,242,255,0.3)); }
        .landing-sub { font-size: 1.2rem; color: #94a3b8; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 50px; font-weight: 300; font-family: var(--font-tech); }
        .btn-enter { 
            background: transparent; border: 2px solid var(--neon-cyan); color: var(--neon-cyan); 
            padding: 15px 50px; font-size: 1rem; font-weight: 700; font-family: var(--font-tech); 
            cursor: pointer; text-transform: uppercase; letter-spacing: 2px; transition: 0.4s; position: relative; overflow: hidden;
        }
        .btn-enter:hover { background: var(--neon-cyan); color: #000; box-shadow: 0 0 40px rgba(0,242,255,0.6); }

        .view-section { display: none; padding-top: 80px; height: 100vh; animation: fadeIn 0.6s ease-out; }
        .view-section.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .dash-grid { display: grid; grid-template-columns: 380px 1fr 450px; gap: 15px; padding: 15px; height: calc(100vh - 80px); }
        .panel { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 4px; display: flex; flex-direction: column; overflow: hidden; backdrop-filter: blur(10px); }
        .p-header { padding: 15px; border-bottom: 1px solid var(--border-color); font-family: var(--font-tech); color: var(--neon-cyan); font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; letter-spacing: 1px; }
        .p-body { padding: 15px; overflow-y: auto; flex: 1; }

        .input-group { margin-bottom: 15px; }
        .input-group label { display: block; font-size: 0.65rem; color: #64748b; margin-bottom: 4px; font-weight: 700; letter-spacing: 0.5px; }
        .input-group input, .input-group select { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: #fff; padding: 10px; border-radius: 2px; font-family: var(--font-ui); font-size: 0.85rem; transition: 0.3s; }
        .btn-action { background: linear-gradient(90deg, var(--neon-cyan), #00aaff); border: none; color: #000; padding: 14px; font-size: 0.9rem; font-weight: 800; font-family: var(--font-tech); cursor: pointer; border-radius: 2px; width: 100%; transition: 0.3s; margin-top: 10px; letter-spacing: 1px; }
        
        .cargo-item { background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 12px; margin-bottom: 8px; cursor: pointer; transition: 0.2s; border-left: 3px solid transparent; }
        .cargo-item:hover { background: rgba(0,242,255,0.05); border-left-color: var(--neon-cyan); }
        .cargo-item.active { background: rgba(0,242,255,0.1); border-left-color: var(--neon-cyan); border-top: 1px solid var(--neon-cyan); border-bottom: 1px solid var(--neon-cyan); border-right: 1px solid var(--neon-cyan); }
        .ci-top { display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: 600; color: #fff; font-size: 0.9rem; }
        .ci-bot { display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8; }
        .tce-badge { background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 6px; border-radius: 2px; font-family: var(--font-tech); font-size: 0.7rem; }

        #map { width: 100%; height: 100%; background: #0b1221; }

        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
        .stat-card { background: rgba(0,0,0,0.4); padding: 12px; border: 1px solid var(--border-color); text-align: center; }
        .stat-val { font-family: var(--font-tech); font-size: 1.2rem; color: #fff; font-weight: 700; }
        .stat-lbl { font-size: 0.65rem; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; }
        .d-val { font-weight: 500; font-family: 'Courier New', monospace; }
        .d-val.neg { color: var(--danger); }
        .d-val.pos { color: var(--success); }
        .ai-insight { background: rgba(0, 242, 255, 0.05); border-left: 2px solid var(--neon-cyan); padding: 15px; margin-top: 15px; font-size: 0.85rem; line-height: 1.6; color: #cbd5e1; }
        
        .ai-list { padding-left: 15px; margin-top: 5px; color: #94a3b8; }
        .ai-list li { margin-bottom: 4px; }
        .tag-pro { color: var(--success); font-weight: bold; font-size: 0.75rem; }
        .tag-con { color: var(--danger); font-weight: bold; font-size: 0.75rem; }

        .library-section { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .section-title { font-family: var(--font-tech); font-size: 1.8rem; color: #fff; margin-bottom: 10px; border-left: 4px solid var(--neon-cyan); padding-left: 15px; }
        .section-desc { color: var(--text-muted); margin-bottom: 40px; margin-left: 20px; }
        .category-header { font-family: var(--font-tech); color: var(--neon-cyan); margin: 40px 0 20px 0; font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
        .docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .doc-card { background: var(--panel-bg); border: 1px solid var(--border-color); padding: 20px; transition: 0.3s; position: relative; }
        .doc-card:hover { border-color: var(--neon-cyan); transform: translateY(-3px); }
        .doc-icon { font-size: 1.8rem; color: #fff; margin-bottom: 15px; opacity: 0.7; }
        .doc-title { font-weight: 700; color: #fff; margin-bottom: 5px; }
        .doc-desc { font-size: 0.8rem; color: #94a3b8; margin-bottom: 15px; min-height: 40px; }
        .btn-download { background: transparent; border: 1px solid #334155; color: #94a3b8; width: 100%; padding: 8px; font-size: 0.75rem; cursor: pointer; transition: 0.2s; text-transform: uppercase; font-weight: 600; }
        .btn-download:hover { border-color: var(--neon-cyan); color: var(--neon-cyan); }

        .pricing-container { display: flex; justify-content: center; gap: 30px; padding-top: 50px; flex-wrap: wrap; }
        .price-card { background: var(--panel-bg); border: 1px solid var(--border-color); width: 300px; padding: 40px; text-align: center; position: relative; transition: 0.3s; }
        .price-card:hover { transform: scale(1.03); border-color: var(--neon-cyan); }
        .price-card.pro { border: 1px solid var(--neon-cyan); box-shadow: 0 0 30px rgba(0,242,255,0.1); }
        .plan-name { font-family: var(--font-tech); font-size: 1.2rem; color: #94a3b8; margin-bottom: 10px; }
        .plan-price { font-size: 3rem; color: #fff; font-weight: 700; margin-bottom: 30px; }
        .plan-price span { font-size: 1rem; color: #555; font-weight: 400; }
        .plan-features { list-style: none; padding: 0; text-align: left; margin-bottom: 30px; color: #cbd5e1; font-size: 0.9rem; }
        .plan-features li { margin-bottom: 12px; display: flex; gap: 10px; }
        .plan-features i { color: var(--success); }
        .btn-plan { width: 100%; padding: 15px; font-weight: 700; border: none; cursor: pointer; font-family: var(--font-tech); }
        .btn-plan.pro { background: var(--neon-cyan); color: #000; }
        .btn-plan.basic { background: #334155; color: #fff; }

        .loader { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.9); z-index: 2000; place-items: center; }
        .spinner { width: 50px; height: 50px; border: 3px solid var(--neon-cyan); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="loader" id="loader"><div style="text-align: center;"><div class="spinner" style="margin: 0 auto 15px;"></div><div style="font-family: var(--font-tech); color: var(--neon-cyan); font-size:1rem;">COMPUTING...</div></div></div>

    <div id="landing-view">
        <img src="https://raw.githubusercontent.com/viyabrokerAlperen/viya-broker-system/main/viya_broker_logo.png" alt="VIYA BROKER LOGO" class="landing-logo-img">
        <div class="landing-sub">Global Maritime Brokerage System</div>
        <button class="btn-enter" onclick="enterSystem()">ENTER TERMINAL</button>
    </div>

    <nav id="mainNav">
        <div class="brand" onclick="switchView('dashboard')">
            <img src="https://raw.githubusercontent.com/viyabrokerAlperen/viya-broker-system/main/viya_broker_logo.png" alt="VIYA BROKER">
            VIYA BROKER
        </div>
        <div class="nav-links">
            <div class="nav-item active" onclick="switchView('dashboard')">Terminal</div>
            <div class="nav-item" onclick="switchView('academy')">Knowledge Base</div>
            <div class="nav-item" onclick="switchView('docs')">Document Center</div>
            <div class="nav-item" onclick="switchView('pricing')">Membership</div>
        </div>
        <div class="live-ticker">
            <div class="ticker-item"><span class="live-dot"></span> MARKET LIVE</div>
            <div class="ticker-item">BRENT: <span id="oilPrice" class="blinking">...</span></div>
            <div class="ticker-item">MGO: <span id="hoPrice">...</span></div>
            <div class="ticker-item">VLSFO: <span id="vlsfoPrice">...</span></div>
        </div>
    </nav>

    <div id="dashboard" class="view-section">
        <div class="dash-grid">
            <aside class="panel">
                <div class="p-header"><i class="fa-solid fa-ship"></i> VESSEL PARAMETERS</div>
                <div class="p-body">
                    <div class="input-group"><label>VESSEL CLASS & TYPE</label>
                        <select id="vType" onchange="updateSpeed()">
                            <optgroup label="DRY BULK FLEET">
                                <option value="HANDYSIZE">Handysize (35k)</option>
                                <option value="HANDYMAX">Handymax (45k)</option>
                                <option value="SUPRAMAX">Supramax (58k)</option>
                                <option value="ULTRAMAX">Ultramax (64k)</option>
                                <option value="PANAMAX">Panamax (82k)</option>
                                <option value="KAMSARMAX">Kamsarmax (85k)</option>
                                <option value="CAPESIZE">Capesize (180k)</option>
                                <option value="NEWCASTLEMAX">Newcastlemax (205k)</option>
                            </optgroup>
                            <optgroup label="TANKER FLEET (OIL/CHEM)">
                                <option value="SMALL_CHEM">Small Chemical (19k)</option>
                                <option value="MR_TANKER">MR Tanker (50k)</option>
                                <option value="LR1">LR1 Tanker (75k)</option>
                                <option value="AFRAMAX">Aframax (115k)</option>
                                <option value="SUEZMAX">Suezmax (160k)</option>
                                <option value="VLCC">VLCC (300k)</option>
                            </optgroup>
                            <optgroup label="GAS FLEET (LNG/LPG)">
                                <option value="LPG_MGC">LPG MGC (38k)</option>
                                <option value="LPG_VLGC">LPG VLGC (55k)</option>
                                <option value="LNG_CONV">LNG Conventional (75k)</option>
                                <option value="LNG_Q_FLEX">LNG Q-Flex (110k)</option>
                            </optgroup>
                        </select>
                    </div>
                    <div class="input-group"><label>QUICK POSITION (PORT)</label><input type="text" id="refPort" list="portList" placeholder="Enter port name..." onchange="fillCoords()"></div>
                    <div class="input-group"><div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;"><input type="number" id="vLat" placeholder="Lat"><input type="number" id="vLng" placeholder="Lng"></div></div>
                    <div class="input-group"><label>OPERATIONAL SPEED (KTS)</label><input type="number" id="vSpeed" value="13.5"></div>
                    
                    <div class="input-group"><label>CARGO QTY (TONS)</label><input type="number" id="vQty" placeholder="e.g. 50000" value="50000"></div>
                    <div class="input-group">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                            <div><label>LOAD RATE (MT/DAY)</label><input type="number" id="vLoadRate" value="15000"></div>
                            <div><label>DISCH RATE (MT/DAY)</label><input type="number" id="vDischRate" value="10000"></div>
                        </div>
                    </div>

                    <button class="btn-action" onclick="scanMarket()">SCAN MARKET OPPORTUNITIES</button>
                    <div id="cargoResultList" class="cargo-list" style="margin-top:20px; display:none;"></div>
                </div>
            </aside>
            <div class="panel">
                <div id="map"></div>
                <div style="position:absolute; bottom:20px; left:20px; z-index:500; background:rgba(0,0,0,0.8); padding:10px; border-radius:4px; color:#fff; font-size:0.7rem; border:1px solid #333;">
                    <div style="display:flex; align-items:center; margin-bottom:5px;"><span style="width:8px; height:8px; background:#f59e0b; border-radius:50%; margin-right:8px;"></span> Vessel</div>
                    <div style="display:flex; align-items:center; margin-bottom:5px;"><span style="width:8px; height:8px; background:#10b981; border-radius:50%; margin-right:8px;"></span> Load Port</div>
                    <div style="display:flex; align-items:center;"><span style="width:8px; height:8px; background:#ef4444; border-radius:50%; margin-right:8px;"></span> Discharge</div>
                </div>
            </div>
            <aside class="panel">
                <div class="p-header"><i class="fa-solid fa-file-invoice-dollar"></i> VOYAGE ESTIMATION</div>
                <div class="p-body" id="analysisPanel" style="display:none;">
                    <div class="stat-grid">
                        <div class="stat-card"><div class="stat-val" id="dispTCE" style="color:var(--neon-cyan)">$0</div><div class="stat-lbl">TCE / Day</div></div>
                        <div class="stat-card"><div class="stat-val" id="dispProfit" style="color:var(--success)">$0</div><div class="stat-lbl">Net Profit</div></div>
                    </div>
                    <div id="financialDetails"></div>
                    <div class="ai-insight" id="aiOutput"></div>
                </div>
                <div class="p-body" id="emptyState" style="text-align:center; padding-top:50px; color:#555;">Waiting for vessel position data...</div>
            </aside>
        </div>
    </div>

    <div id="academy" class="view-section">
        <div class="library-section">
            <div class="section-title">KNOWLEDGE BASE</div>
            <div class="section-desc">Essential maritime commercial and legal concepts for modern brokers.</div>
            <div class="docs-grid" id="academyGrid"></div>
        </div>
    </div>

    <div id="docs" class="view-section">
        <div class="library-section">
            <div class="section-title">DOCUMENT CENTER</div>
            <div class="section-desc">Industry standard Charter Parties, Riders and Operational Forms.</div>
            <div id="docsContainer"></div>
        </div>
    </div>

    <div id="pricing" class="view-section">
        <div class="pricing-container">
            <div class="price-card">
                <div class="plan-name">CADET</div>
                <div class="plan-price">$0 <span>/mo</span></div>
                <ul class="plan-features">
                    <li><i class="fa-solid fa-check"></i> Distance Calculator</li>
                    <li><i class="fa-solid fa-check"></i> 3 Daily Scans</li>
                    <li><i class="fa-solid fa-xmark" style="color:#555"></i> Financial Analysis</li>
                </ul>
                <button class="btn-plan basic">CURRENT PLAN</button>
            </div>
            <div class="price-card pro">
                <div class="plan-name" style="color:var(--neon-cyan)">BROKER PRO</div>
                <div class="plan-price">$49 <span>/mo</span></div>
                <ul class="plan-features">
                    <li><i class="fa-solid fa-check"></i> Unlimited Scans</li>
                    <li><i class="fa-solid fa-check"></i> Real-Time TCE & Profit</li>
                    <li><i class="fa-solid fa-check"></i> Live Market Data</li>
                    <li><i class="fa-solid fa-check"></i> Document Access</li>
                </ul>
                <button class="btn-plan pro">UPGRADE NOW</button>
            </div>
            <div class="price-card">
                <div class="plan-name">OWNER</div>
                <div class="plan-price">$199 <span>/mo</span></div>
                <ul class="plan-features">
                    <li><i class="fa-solid fa-check"></i> All Pro Features</li>
                    <li><i class="fa-solid fa-check"></i> API Access</li>
                    <li><i class="fa-solid fa-check"></i> Custom Reports</li>
                    <li><i class="fa-solid fa-check"></i> Dedicated Consultant</li>
                </ul>
                <button class="btn-plan basic">CONTACT SALES</button>
            </div>
        </div>
    </div>

    <datalist id="portList"></datalist>

    <script>
        // --- UI LOGIC ---
        function enterSystem() {
            document.getElementById('landing-view').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('landing-view').style.display = 'none';
                document.getElementById('mainNav').style.display = 'flex';
                document.getElementById('dashboard').classList.add('active');
                map.invalidateSize();
            }, 800);
        }

        document.addEventListener('keydown', function(event) {
            if (event.key === "Enter" && document.getElementById('landing-view').style.display !== 'none') {
                enterSystem();
            }
        });

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
            {icon: "fa-scale-balanced", title: "Laytime & Demurrage", desc: "Calculating time saved/lost. Key concepts: SHINC, SHEX, WWD."},
            {icon: "fa-globe", title: "INCOTERMS 2020", desc: "Responsibility transfer points: FOB vs CIF vs CFR."},
            {icon: "fa-file-signature", title: "Bill of Lading", desc: "Functions of B/L: Receipt, Title, Contract of Carriage."},
            {icon: "fa-anchor", title: "General Average", desc: "York-Antwerp Rules and shared loss principles."},
            {icon: "fa-hand-holding-dollar", title: "Maritime Lien", desc: "Claims against the vessel vs the owner."},
            {icon: "fa-smog", title: "ECA Regulations", desc: "Sulphur caps (0.1% vs 0.5%) and scrubber usage."}
        ];

        const DOCS_DB = [
            {
                category: "DRY BULK CHARTER PARTIES",
                items: [
                    {title: "GENCON 94", desc: "Standard Voyage Charter (Universal)."},
                    {title: "NYPE 2015", desc: "New York Produce Exchange Time Charter."},
                    {title: "AMWELSH 93", desc: "Americanized Welsh Coal Charter."},
                    {title: "GRAINCON", desc: "Grain Voyage Charter Party."}
                ]
            },
            {
                category: "TANKER (OIL/CHEM) CHARTER PARTIES",
                items: [
                    {title: "ASBATANKVOY", desc: "Association of Ship Brokers Tanker Voyage."},
                    {title: "SHELLTIME 4", desc: "Standard Time Charter for Tankers."},
                    {title: "BPVOY 4", desc: "BP Voyage Charter Party."}
                ]
            },
            {
                category: "GAS (LNG/LPG) CHARTER PARTIES",
                items: [
                    {title: "GASVOY 2005", desc: "Standard Gas Voyage Charter."},
                    {title: "LNGVOY", desc: "Liquefied Natural Gas Charter."},
                    {title: "SHELLLNGTIME", desc: "Time Charter for LNG Carriers."}
                ]
            },
            {
                category: "OPERATIONAL DOCUMENTS",
                items: [
                    {title: "Notice of Readiness (NOR)", desc: "Standard NOR template."},
                    {title: "Statement of Facts (SOF)", desc: "Port agent time log."},
                    {title: "Letter of Indemnity (LOI)", desc: "Clean B/L indemnity."}
                ]
            }
        ];

        function loadLibrary() {
            const aGrid = document.getElementById('academyGrid');
            ACADEMY_DATA.forEach(item => {
                aGrid.innerHTML += \`
                    <div class="doc-card">
                        <i class="fa-solid \${item.icon} doc-icon" style="color:var(--neon-purple)"></i>
                        <div class="doc-title">\${item.title}</div>
                        <div class="doc-desc">\${item.desc}</div>
                        <button class="btn-download">READ</button>
                    </div>\`;
            });

            const dContainer = document.getElementById('docsContainer');
            DOCS_DB.forEach(cat => {
                let html = \`<div class="category-header">\${cat.category}</div><div class="docs-grid">\`;
                cat.items.forEach(item => {
                    html += \`
                        <div class="doc-card">
                            <i class="fa-solid fa-file-contract doc-icon" style="color:var(--neon-cyan)"></i>
                            <div class="doc-title">\${item.title}</div>
                            <div class="doc-desc">\${item.desc}</div>
                            <button class="btn-download" onclick="alert('Downloading template...')">DOWNLOAD</button>
                        </div>\`;
                });
                html += \`</div>\`;
                dContainer.innerHTML += html;
            });
        }
        loadLibrary();

        // --- CORE BROKER LOGIC ---
        const SPECS = { 
            "HANDYSIZE":    { dwt: 35000, default_speed: 13.0 },
            "HANDYMAX":     { dwt: 45000, default_speed: 13.0 },
            "SUPRAMAX":     { dwt: 58000, default_speed: 13.5 },
            "ULTRAMAX":     { dwt: 64000, default_speed: 13.5 },
            "PANAMAX":      { dwt: 82000, default_speed: 13.0 },
            "KAMSARMAX":    { dwt: 85000, default_speed: 13.0 },
            "CAPESIZE":     { dwt: 180000, default_speed: 12.5 },
            "NEWCASTLEMAX": { dwt: 205000, default_speed: 12.5 },
            "SMALL_CHEM":   { dwt: 19000, default_speed: 13.0 },
            "MR_TANKER":    { dwt: 50000, default_speed: 13.0 },
            "LR1":          { dwt: 75000, default_speed: 13.0 },
            "AFRAMAX":      { dwt: 115000, default_speed: 12.5 },
            "SUEZMAX":      { dwt: 160000, default_speed: 12.5 },
            "VLCC":         { dwt: 300000, default_speed: 12.0 },
            "LPG_MGC":      { dwt: 38000, default_speed: 16.0 },
            "LPG_VLGC":     { dwt: 55000, default_speed: 16.5 },
            "LNG_CONV":     { dwt: 75000, default_speed: 19.0 },
            "LNG_Q_FLEX":   { dwt: 110000, default_speed: 19.5 }
        };

        const map = L.map('map', {zoomControl: false, attributionControl: false}).setView([30, 0], 2);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 10 }).addTo(map);
        const layerGroup = L.layerGroup().addTo(map);
        let shipMarker = null;

        async function init() {
            try {
                const pRes = await fetch('/api/ports'); const ports = await pRes.json();
                const dl = document.getElementById('portList'); ports.forEach(p => { const opt = document.createElement('option'); opt.value = p; dl.appendChild(opt); });
                const mRes = await fetch('/api/market'); const m = await mRes.json();
                document.getElementById('oilPrice').innerText = "$" + m.brent.toFixed(2);
                document.getElementById('hoPrice').innerText = "$" + m.mgo.toFixed(0);
                document.getElementById('vlsfoPrice').innerText = "$" + m.vlsfo.toFixed(0);
            } catch(e) {}
        }
        init();

        function updateSpeed() { const type = document.getElementById('vType').value; if(SPECS[type]) document.getElementById('vSpeed').value = SPECS[type].default_speed; }
        async function fillCoords() { const pName = document.getElementById('refPort').value.toUpperCase(); if(!pName) return; try{ const res = await fetch('/api/port-coords?port='+pName); const d = await res.json(); if(d.lat){ document.getElementById('vLat').value=d.lat; document.getElementById('vLng').value=d.lng; updateShipMarker(d.lat, d.lng); }}catch(e){} }
        function updateShipMarker(lat, lng) { if(shipMarker) map.removeLayer(shipMarker); shipMarker = L.circleMarker([lat, lng], {radius:7, color:'#fff', fillColor:'#f59e0b', fillOpacity:1}).addTo(map).bindPopup("VESSEL"); map.setView([lat, lng], 4); }

        async function scanMarket() {
            const lat = parseFloat(document.getElementById('vLat').value);
            const lng = parseFloat(document.getElementById('vLng').value);
            const speed = parseFloat(document.getElementById('vSpeed').value);
            const qty = parseFloat(document.getElementById('vQty').value);
            const lRate = parseFloat(document.getElementById('vLoadRate').value);
            const dRate = parseFloat(document.getElementById('vDischRate').value);

            if(isNaN(lat) || isNaN(lng)) { alert("Enter valid Coords"); return; }
            updateShipMarker(lat, lng);
            document.getElementById('loader').style.display = 'grid';
            try {
                const res = await fetch('/api/analyze', { 
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'}, 
                    body: JSON.stringify({
                        shipLat:lat, shipLng:lng, shipSpeed:speed, vType:document.getElementById('vType').value,
                        cargoQty: qty, loadRate: lRate, dischRate: dRate 
                    }) 
                });
                const data = await res.json();
                if(data.success) renderList(data.voyages);
            } catch(e) { alert("Analysis Failed"); }
            finally { document.getElementById('loader').style.display = 'none'; }
        }

        function renderList(voyages) {
            const list = document.getElementById('cargoResultList'); list.innerHTML = ''; list.style.display = 'block';
            if(voyages.length === 0) { list.innerHTML = '<div style="padding:10px;">No cargoes found.</div>'; return; }
            voyages.forEach(v => {
                const el = document.createElement('div'); el.className = 'cargo-item';
                el.innerHTML = \`<div class="ci-top"><span>\${v.loadPort} -> \${v.dischPort}</span><span class="tce-badge">\$\${v.financials.tce.toLocaleString()}/day</span></div><div class="ci-bot"><span>\${v.commodity}</span><span>Bal: \${v.ballastDist} NM</span></div>\`;
                el.onclick = () => showDetails(v, el); list.appendChild(el);
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
                <div class="detail-row"><span class="d-lbl">Ballast</span> <span class="d-val neg">\${v.ballastDist} NM</span></div>
                <div class="detail-row"><span class="d-lbl">Laden</span> <span class="d-val">\${v.ladenDist} NM</span></div>
                <div class="detail-row"><span class="d-lbl">Speed</span> <span class="d-val">\${v.usedSpeed} kts</span></div>
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
            L.circleMarker(pos, {radius:7, color:'#fff', fillColor:'#f59e0b', fillOpacity:1}).addTo(layerGroup);
            L.circleMarker(p1, {radius:7, color:'#fff', fillColor:'#10b981', fillOpacity:1}).addTo(layerGroup).bindPopup("LOAD");
            L.circleMarker(p2, {radius:7, color:'#fff', fillColor:'#ef4444', fillOpacity:1}).addTo(layerGroup).bindPopup("DISCH");
            map.fitBounds([pos, p1, p2], {padding:[50,50]});
        }
    </script>
</body>
</html>
`;

// =================================================================
// 3. BACKEND LOGIC
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

function calculateFullVoyage(shipLat, shipLng, loadPortName, loadGeo, dischPortName, dischGeo, specs, market, shipSpeed, userQty, userLoadRate, userDischRate) {
    const speed = shipSpeed || specs.default_speed;
    const ballastDist = getDistance(shipLat, shipLng, loadGeo.lat, loadGeo.lng);
    const ballastDays = ballastDist / (speed * 24);
    const ladenDist = getDistance(loadGeo.lat, loadGeo.lng, dischGeo.lat, dischGeo.lng);
    const ladenDays = ladenDist / (speed * 24);
    
    // AKILLI KARGO SEÇİMİ
    const cargoType = specs.type; // "BULK", "TANKER", or "GAS"
    const possibleCargoes = CARGOES[cargoType] || CARGOES["BULK"];
    const cargo = possibleCargoes[Math.floor(Math.random() * possibleCargoes.length)];
    
    let qty = userQty;
    if (!qty || qty > specs.dwt) qty = Math.floor(specs.dwt * 0.95);

    const lRate = userLoadRate || cargo.loadRate;
    const dRate = userDischRate || cargo.dischRate;

    const loadDays = (qty / lRate) + 1;
    const dischDays = (qty / dRate) + 1;
    const portDays = Math.ceil(loadDays + dischDays);

    const costBallastFuel = ballastDays * specs.sea_cons * market.vlsfo;
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

function generateAnalysis(v, specs) {
    const profitMargin = (v.financials.profit / v.financials.revenue) * 100;
    const ballastRatio = (v.ballastDist / (v.ballastDist + v.ladenDist)) * 100;
    const tceVsOpex = v.financials.tce / specs.opex;

    let sentiment = "NEUTRAL";
    let color = "#94a3b8";
    let advice = "";
    let pros = [];
    let cons = [];

    // SENARYO ANALİZİ
    if (tceVsOpex > 2.5) {
        sentiment = "EXCEPTIONAL FIXTURE";
        color = "#10b981"; // Green
        advice = "This voyage offers outstanding returns, significantly above market average. Immediate fixing recommended.";
    } else if (tceVsOpex > 1.5) {
        sentiment = "STRONG PERFORMER";
        color = "#34d399";
        advice = "Solid profit margin. Good option for positioning.";
    } else if (tceVsOpex > 1.0) {
        sentiment = "STANDARD MARKET";
        color = "#f59e0b"; // Orange
        advice = "Covers OPEX but profit is thin. Consider if it positions for a better follow-on cargo.";
    } else {
        sentiment = "NEGATIVE RETURNS";
        color = "#ef4444"; // Red
        advice = "Loss-making voyage. Only consider for urgent repositioning.";
    }

    // PROS & CONS
    if (ballastRatio < 15) pros.push("Minimal Ballast (Efficient)");
    if (v.totalDays < 20) pros.push("Short Duration (Quick Cashflow)");
    if (profitMargin > 30) pros.push("High Net Profit Margin");
    if (v.ballastDist > 1000) cons.push("Long Ballast Leg");
    if (v.financials.tce < specs.opex) cons.push("Below OPEX Levels");

    let html = `<div style="margin-bottom:10px; font-family:var(--font-tech); color:${color}; font-size:1.1rem; font-weight:bold;">${sentiment}</div>`;
    html += `<div style="margin-bottom:10px;">${advice}</div>`;
    
    if (pros.length > 0) {
        html += `<ul class="ai-list" style="margin-bottom:10px;"><span class="tag-pro">PROS:</span>`;
        pros.forEach(p => html += `<li>${p}</li>`);
        html += `</ul>`;
    }
    
    if (cons.length > 0) {
        html += `<ul class="ai-list"><span class="tag-con">RISKS:</span>`;
        cons.forEach(c => html += `<li>${c}</li>`);
        html += `</ul>`;
    }

    return html;
}

// --- API ROUTES ---

app.get('/', (req, res) => res.send(FRONTEND_HTML));
app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));
app.get('/api/market', async (req, res) => { await updateMarketData(); res.json(MARKET); });
app.get('/api/port-coords', (req, res) => { const p = PORT_DB[req.query.port]; res.json(p || {}); });

app.post('/api/analyze', async (req, res) => {
    await updateMarketData();
    const { shipLat, shipLng, shipSpeed, vType, cargoQty, loadRate, dischRate } = req.body;
    
    if(!shipLat || !shipLng) return res.json({success: false, error: "Missing coordinates"});
    const specs = VESSEL_SPECS[vType] || VESSEL_SPECS["SUPRAMAX"]; // Fallback
    const suggestions = [];
    const allPorts = Object.keys(PORT_DB);
    const sortedPorts = allPorts.map(pName => { return { name: pName, geo: PORT_DB[pName], dist: getDistance(shipLat, shipLng, PORT_DB[pName].lat, PORT_DB[pName].lng) }; }).sort((a,b) => a.dist - b.dist);
    const candidates = sortedPorts.slice(0, 30);
    for(let i=0; i<5; i++) {
        const loadCand = candidates[Math.floor(Math.random() * candidates.length)];
        const dischName = allPorts[Math.floor(Math.random() * allPorts.length)];
        const dischGeo = PORT_DB[dischName];
        if(loadCand.name === dischName) continue;
        
        const calc = calculateFullVoyage(shipLat, shipLng, loadCand.name, loadCand.geo, dischName, dischGeo, specs, MARKET, shipSpeed, cargoQty, loadRate, dischRate);
        
        if(calc.financials.profit > -20000) {
            suggestions.push({
                loadPort: loadCand.name, dischPort: dischName, loadGeo: loadCand.geo, dischGeo: dischGeo,
                commodity: calc.cargo.name, qty: calc.qty,
                ballastDist: calc.ballastDist, ballastDays: calc.ballastDays,
                ladenDist: calc.ladenDist, ladenDays: calc.ladenDays,
                totalDays: calc.totalDays, usedSpeed: calc.usedSpeed,
                financials: calc.financials, 
                aiAnalysis: generateAnalysis(calc, specs) // Pass specs for OPEX comparison
            });
        }
    }
    suggestions.sort((a,b) => b.financials.tce - a.financials.tce);
    res.json({success: true, voyages: suggestions});
});

app.listen(port, () => console.log(`VIYA BROKER V63 (THE AI BROKER INTELLIGENCE) running on port ${port}`));
