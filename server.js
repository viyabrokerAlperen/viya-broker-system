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

// API KEY CHECK
const API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;

if (API_KEY) {
    console.log("✅ VIYA AI SYSTEM: ONLINE (API Key Detected)");
} else {
    console.error("❌ VIYA AI SYSTEM: OFFLINE (GEMINI_API_KEY Missing)");
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// =================================================================
// 1. ADVANCED DATA & CONFIGURATION (DETAYLI FİNANSAL VERİLER)
// =================================================================

// Gemi Tiplerine Göre Detaylı Günlük OPEX (USD/Gün)
const VESSEL_SPECS = {
    "HANDYSIZE": { 
        type: "BULK", dwt: 35000, default_speed: 13.0, sea_cons: 22, port_cons: 2.5, 
        opex_details: { crew: 2200, victualling: 250, maintenance: 600, insurance: 350, stores: 250, admin: 400 } 
    },
    "HANDYMAX": { 
        type: "BULK", dwt: 45000, default_speed: 13.0, sea_cons: 24, port_cons: 3.0, 
        opex_details: { crew: 2300, victualling: 260, maintenance: 650, insurance: 400, stores: 280, admin: 450 } 
    },
    "SUPRAMAX": { 
        type: "BULK", dwt: 58000, default_speed: 13.5, sea_cons: 28, port_cons: 3.5, 
        opex_details: { crew: 2400, victualling: 280, maintenance: 700, insurance: 450, stores: 300, admin: 500 } 
    },
    "ULTRAMAX": { 
        type: "BULK", dwt: 64000, default_speed: 13.5, sea_cons: 29, port_cons: 3.5, 
        opex_details: { crew: 2500, victualling: 300, maintenance: 750, insurance: 500, stores: 320, admin: 550 } 
    },
    "PANAMAX": { 
        type: "BULK", dwt: 82000, default_speed: 13.0, sea_cons: 32, port_cons: 4.0, 
        opex_details: { crew: 2600, victualling: 320, maintenance: 800, insurance: 600, stores: 400, admin: 600 } 
    },
    "KAMSARMAX": { 
        type: "BULK", dwt: 85000, default_speed: 13.0, sea_cons: 33, port_cons: 4.0, 
        opex_details: { crew: 2650, victualling: 330, maintenance: 850, insurance: 650, stores: 420, admin: 620 } 
    },
    "CAPESIZE": { 
        type: "BULK", dwt: 180000, default_speed: 12.5, sea_cons: 45, port_cons: 5.0, 
        opex_details: { crew: 2800, victualling: 350, maintenance: 1000, insurance: 900, stores: 500, admin: 700 } 
    },
    "NEWCASTLEMAX": { 
        type: "BULK", dwt: 205000, default_speed: 12.5, sea_cons: 50, port_cons: 5.5, 
        opex_details: { crew: 2900, victualling: 360, maintenance: 1100, insurance: 950, stores: 550, admin: 750 } 
    },
    "SMALL_CHEM": { 
        type: "TANKER", dwt: 19000, default_speed: 13.0, sea_cons: 18, port_cons: 3.0, 
        opex_details: { crew: 2500, victualling: 300, maintenance: 800, insurance: 500, stores: 400, admin: 600 } 
    },
    "MR_TANKER": { 
        type: "TANKER", dwt: 50000, default_speed: 13.0, sea_cons: 26, port_cons: 4.5, 
        opex_details: { crew: 2800, victualling: 350, maintenance: 900, insurance: 800, stores: 450, admin: 650 } 
    },
    "LR1": { 
        type: "TANKER", dwt: 75000, default_speed: 13.0, sea_cons: 32, port_cons: 5.0, 
        opex_details: { crew: 3000, victualling: 380, maintenance: 1000, insurance: 900, stores: 500, admin: 700 } 
    },
    "AFRAMAX": { 
        type: "TANKER", dwt: 115000, default_speed: 12.5, sea_cons: 40, port_cons: 6.0, 
        opex_details: { crew: 3200, victualling: 400, maintenance: 1200, insurance: 1100, stores: 600, admin: 800 } 
    },
    "SUEZMAX": { 
        type: "TANKER", dwt: 160000, default_speed: 12.5, sea_cons: 48, port_cons: 7.0, 
        opex_details: { crew: 3400, victualling: 420, maintenance: 1400, insurance: 1300, stores: 700, admin: 900 } 
    },
    "VLCC": { 
        type: "TANKER", dwt: 300000, default_speed: 12.0, sea_cons: 65, port_cons: 8.0, 
        opex_details: { crew: 3600, victualling: 450, maintenance: 1600, insurance: 1600, stores: 800, admin: 1000 } 
    },
    "LPG_MGC": { 
        type: "GAS", dwt: 38000, default_speed: 16.0, sea_cons: 35, port_cons: 6.0, 
        opex_details: { crew: 3500, victualling: 400, maintenance: 1500, insurance: 1200, stores: 600, admin: 800 } 
    },
    "LPG_VLGC": { 
        type: "GAS", dwt: 55000, default_speed: 16.5, sea_cons: 45, port_cons: 7.0, 
        opex_details: { crew: 3800, victualling: 450, maintenance: 1800, insurance: 1500, stores: 800, admin: 1000 } 
    },
    "LNG_CONV": { 
        type: "GAS", dwt: 75000, default_speed: 19.0, sea_cons: 70, port_cons: 8.0, 
        opex_details: { crew: 4000, victualling: 500, maintenance: 2000, insurance: 2000, stores: 1000, admin: 1500 } 
    },
    "LNG_Q_FLEX": { 
        type: "GAS", dwt: 110000, default_speed: 19.5, sea_cons: 90, port_cons: 10.0, 
        opex_details: { crew: 4500, victualling: 550, maintenance: 2500, insurance: 2500, stores: 1200, admin: 1800 } 
    }
};

const CARGOES = {
    "BULK": [
        {name: "Grain", rate: 32, handling: 2.5, stowing: 1.0},
        {name: "Coal", rate: 24, handling: 2.0, stowing: 0.8},
        {name: "Iron Ore", rate: 19, handling: 1.8, stowing: 0.5},
        {name: "Steel Products", rate: 45, handling: 4.5, stowing: 2.5},
        {name: "Fertilizer", rate: 29, handling: 3.0, stowing: 1.2},
        {name: "Scrap", rate: 35, handling: 3.5, stowing: 1.5},
        {name: "Bauxite", rate: 21, handling: 1.9, stowing: 0.6}
    ],
    "TANKER": [
        {name: "Crude Oil", rate: 28, handling: 0.8, stowing: 0},
        {name: "Diesel/Gasoil", rate: 35, handling: 1.0, stowing: 0},
        {name: "Naphtha", rate: 31, handling: 1.2, stowing: 0},
        {name: "Jet Fuel", rate: 38, handling: 1.1, stowing: 0},
        {name: "Vegoil", rate: 42, handling: 1.5, stowing: 0}
    ],
    "GAS": [
        {name: "LNG", rate: 65, handling: 2.0, stowing: 0},
        {name: "LPG (Propane)", rate: 55, handling: 2.2, stowing: 0},
        {name: "Ammonia", rate: 58, handling: 2.5, stowing: 0}
    ]
};

let MARKET = { brent: 78.50, heatingOil: 2.35, vlsfo: 620, mgo: 850, lastUpdate: 0 };

let PORT_DB = {};
try {
    const rawData = fs.readFileSync(path.join(__dirname, 'ports.json'));
    const jsonData = JSON.parse(rawData);
    for (const [key, val] of Object.entries(jsonData)) {
        PORT_DB[key.toUpperCase()] = { lat: parseFloat(val[1]), lng: parseFloat(val[0]) };
    }
    console.log(`✅ DATABASE: ${Object.keys(PORT_DB).length} ports loaded.`);
} catch (e) { console.error("❌ ERROR: ports.json missing."); }

let DOCS_DATA = [];
try {
    const docData = fs.readFileSync(path.join(__dirname, 'documents.json'));
    DOCS_DATA = JSON.parse(docData);
    console.log(`✅ DOCUMENTS: Library loaded successfully.`);
} catch (e) { console.error("⚠️ WARNING: documents.json missing."); }

let REGS_DATA = [];
let REGS_CONTEXT = "";
try {
    const regData = fs.readFileSync(path.join(__dirname, 'regulations.json'));
    REGS_DATA = JSON.parse(regData);
    REGS_CONTEXT = REGS_DATA.map(r => `[${r.code}] ${r.title}: ${r.summary}`).join(" | ");
    console.log(`✅ REGULATIONS: ${REGS_DATA.length} statutes loaded.`);
} catch (e) { console.error("⚠️ WARNING: regulations.json missing."); }


// =================================================================
// 2. HELPER FUNCTIONS (BACKEND LOGIC)
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
    } catch(e) {
        console.log("⚠️ Market update failed, using defaults.");
    }
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 3440;
    const dLat = (lat2 - lat1) * Math.PI/180;
    const dLon = (lon2 - lon1) * Math.PI/180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 1.15); 
}

// [V100] ULTRA DETAILED CALCULATION ENGINE
function calculateFullVoyage(shipLat, shipLng, loadPortName, loadGeo, dischPortName, dischGeo, specs, market, shipSpeed, userQty, userLoadRate, userDischRate) {
    const speed = shipSpeed || specs.default_speed;
    const ballastDist = getDistance(shipLat, shipLng, loadGeo.lat, loadGeo.lng);
    const ladenDist = getDistance(loadGeo.lat, loadGeo.lng, dischGeo.lat, dischGeo.lng);
    
    // Cargo Selection
    const cargoType = specs.type;
    const possibleCargoes = CARGOES[cargoType] || CARGOES["BULK"];
    const cargo = possibleCargoes[Math.floor(Math.random() * possibleCargoes.length)];
    
    let qty = userQty;
    if (!qty || qty > specs.dwt) qty = Math.floor(specs.dwt * 0.95);

    // Duration
    const ballastDays = ballastDist / (speed * 24);
    const ladenDays = ladenDist / (speed * 24);
    const loadDays = (qty / (userLoadRate || 15000)) + 1; // +1 Turn time
    const dischDays = (qty / (userDischRate || 10000)) + 1;
    const portDays = Math.ceil(loadDays + dischDays);
    const totalDays = ballastDays + ladenDays + portDays;

    // --- 1. VOYAGE COSTS (SEFER MALİYETLERİ) ---
    
    // A. BUNKER (YAKIT)
    const seaCons = specs.sea_cons;
    const portCons = specs.port_cons;
    const costMainEngine = (ballastDays + ladenDays) * seaCons * market.vlsfo;
    const costAuxEngine = portDays * portCons * market.mgo; 
    const costLubricants = totalDays * 400; // Günlük ortalama $400 yağ gideri
    const totalFuelCost = costMainEngine + costAuxEngine + costLubricants;

    // B. PORT CHARGES (LİMAN GİDERLERİ)
    const grt = specs.dwt * 0.65; // Approximate GRT
    // Port Dues (Liman Rüsumları)
    const duesLoad = grt * 1.1; // $1.1 per GRT
    const duesDisch = grt * 1.1;
    // Pilotage (Kılavuzluk) - Giriş/Çıkış x 2 Liman
    const pilotage = 3500 * 2 * 2; 
    // Towage (Römorkör) - 2 Römorkör x Giriş/Çıkış x 2 Liman
    const towage = 2500 * 2 * 2 * 2;
    // Line Handling (Palamar)
    const lineHandling = 1000 * 2 * 2;
    // Berth Hire (Rıhtım İşgaliye) - Günlük
    const berthHire = portDays * 1500;
    // Waste/Slop (Atık)
    const wasteFees = 2000;
    // Agency Fees (Acente)
    const agencyFees = 3000 * 2; // 2 Liman

    const totalPortCosts = duesLoad + duesDisch + pilotage + towage + lineHandling + berthHire + wasteFees + agencyFees;

    // C. CARGO HANDLING (YÜK ELLEÇLEME - Owner Expenses)
    // Varsayım: FIOST değilse (veya Owner adına küçük giderler)
    const stevedoring = 0; // Genelde kiracı öder ama burada owner adına ekstra varsa
    const dunnageLashing = qty * (cargo.stowing || 0.5); // Malzeme/Sabitleme
    const holdCleaning = 4000; // Yıkama
    const totalCargoCosts = dunnageLashing + holdCleaning + stevedoring;

    // D. CANAL & STRAITS (KANAL/BOĞAZ)
    let costCanal = 0;
    // Basit bir coğrafi kontrol (Süveyş/Panama vb.)
    if ((loadGeo.lng < 35 && dischGeo.lng > 45) || (loadGeo.lng > 45 && dischGeo.lng < 35)) costCanal += 250000;

    // --- 2. OPERATING EXPENSES (OPEX - İŞLETME MALİYETLERİ) ---
    // Gemi tipine özel detaylı günlük OPEX
    const od = specs.opex_details || { crew: 2500, victualling: 300, maintenance: 800, insurance: 600, stores: 400, admin: 500 };
    const dailyOpexTotal = Object.values(od).reduce((a, b) => a + b, 0);
    
    const costCrew = od.crew * totalDays;
    const costVictualling = od.victualling * totalDays;
    const costMaint = od.maintenance * totalDays;
    const costIns = od.insurance * totalDays; // H&M + P&I
    const costStores = od.stores * totalDays;
    const costAdmin = od.admin * totalDays;
    
    const totalOpexCost = dailyOpexTotal * totalDays;

    // --- 3. REVENUE (GELİR) ---
    const grossRevenue = qty * cargo.rate;
    const commission = grossRevenue * 0.0375; // %3.75 Broker/Address Comm
    
    // --- SUMMARY ---
    const totalVoyageCosts = totalFuelCost + totalPortCosts + totalCargoCosts + costCanal + commission;
    const totalCostsAll = totalVoyageCosts + totalOpexCost;
    
    const netProfit = grossRevenue - totalCostsAll;
    // TCE Calculation: (Net Freight - Voyage Costs) / Duration
    const tce = (grossRevenue - totalVoyageCosts) / totalDays;

    return { 
        ballastDist, ladenDist, totalDays,
        cargo, qty, 
        breakdown: {
            revenue: grossRevenue,
            voyage_costs: {
                fuel: { main: costMainEngine, aux: costAuxEngine, lubes: costLubricants, total: totalFuelCost },
                port: { dues: duesLoad + duesDisch, pilot: pilotage, towage: towage, lines: lineHandling, berth: berthHire, agency: agencyFees, waste: wasteFees, total: totalPortCosts },
                cargo: { lashing: dunnageLashing, cleaning: holdCleaning, total: totalCargoCosts },
                canal: costCanal,
                comm: commission,
                total: totalVoyageCosts
            },
            opex: {
                crew: costCrew,
                victualling: costVictualling,
                maintenance: costMaint,
                insurance: costIns,
                stores: costStores,
                admin: costAdmin,
                daily: dailyOpexTotal,
                total: totalOpexCost
            },
            total_expenses: totalCostsAll
        },
        financials: { profit: netProfit, tce },
        loadPort: loadPortName, dischPort: dischPortName, loadGeo, dischGeo,
        usedSpeed: speed
    };
}

function generateAnalysis(v, specs) {
    const dailyOpex = Object.values(specs.opex_details).reduce((a, b) => a + b, 0);
    const breakEvenTCE = dailyOpex;
    
    let sentiment = "NEUTRAL";
    let color = "#94a3b8";
    
    if (v.financials.tce > breakEvenTCE * 2.5) {
        sentiment = "EXCEPTIONAL"; color = "#10b981";
    } else if (v.financials.tce > breakEvenTCE * 1.5) {
        sentiment = "STRONG"; color = "#34d399";
    } else if (v.financials.tce > breakEvenTCE) {
        sentiment = "MODERATE"; color = "#f59e0b";
    } else {
        sentiment = "LOSS MAKING"; color = "#ef4444";
    }

    return `<div style="color:${color}; font-weight:bold; font-size:1.1rem; margin-bottom:5px;">MARKET SENTIMENT: ${sentiment}</div>
            <div style="font-size:0.85rem; color:#cbd5e1;">
            • Break-even TCE (OPEX): <strong>$${dailyOpex.toLocaleString()}</strong><br>
            • Voyage TCE: <strong>$${Math.floor(v.financials.tce).toLocaleString()}</strong><br>
            • Coverage: <strong>${(v.financials.tce/dailyOpex).toFixed(2)}x</strong> OPEX
            </div>`;
}

// =================================================================
// 3. FRONTEND HTML (FULL CONTENT)
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
        :root { --neon-cyan: #00f2ff; --neon-purple: #bc13fe; --neon-gold: #fbbf24; --deep-space: #050a14; --panel-bg: rgba(10, 15, 25, 0.95); --card-bg: rgba(255, 255, 255, 0.03); --border-color: rgba(255, 255, 255, 0.1); --text-main: #e2e8f0; --text-muted: #94a3b8; --font-ui: 'Plus Jakarta Sans', sans-serif; --font-tech: 'Orbitron', sans-serif; --success: #10b981; --danger: #ef4444; --warning: #f59e0b; }
        * { box-sizing: border-box; margin: 0; padding: 0; scroll-behavior: smooth; }
        body { background-color: var(--deep-space); color: var(--text-main); font-family: var(--font-ui); overflow-x: hidden; font-size:13px; }
        
        nav { position: fixed; top: 0; width: 100%; z-index: 1000; background: rgba(5, 10, 20, 0.95); backdrop-filter: blur(15px); border-bottom: 1px solid var(--border-color); padding: 0.5rem 2rem; display: none; justify-content: space-between; align-items: center; transition: 0.5s; }
        .brand { display: flex; align-items: center; cursor:pointer; gap: 10px; font-family: var(--font-tech); font-size: 1.2rem; font-weight: 900; color: #fff; }
        .brand img { height: 40px; } 
        .nav-links { display: flex; gap: 30px; align-items: center; }
        .nav-item { color: var(--text-muted); cursor: pointer; font-weight: 600; transition: 0.3s; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 5px; }
        .nav-item:hover, .nav-item.active { color: var(--neon-cyan); border-bottom: 2px solid var(--neon-cyan); text-shadow: 0 0 15px rgba(0,242,255,0.4); }
        .lang-switch { cursor: pointer; font-family: var(--font-tech); color: #fff; border: 1px solid var(--neon-cyan); padding: 5px 10px; border-radius: 4px; font-size: 0.75rem; transition: 0.3s; }
        .live-ticker { font-family: var(--font-tech); font-size: 0.7rem; color: var(--text-muted); display:flex; gap:20px; align-items:center; }
        .blinking { animation: blinker 2s linear infinite; color: var(--success); font-weight:bold;}
        @keyframes blinker { 50% { opacity: 0.5; } }

        #landing-view { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: linear-gradient(rgba(3,5,8,0.9), rgba(3,5,8,0.8)), url('https://images.unsplash.com/photo-1559827291-72ee739d0d9a?q=80&w=2874&auto=format&fit=crop'); background-size: cover; background-position: center; z-index: 9999; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; transition: opacity 0.8s ease-in-out; }
        .landing-logo-img { max-width: 300px; margin-bottom: 30px; filter: drop-shadow(0 0 40px rgba(0,242,255,0.3)); }
        .landing-sub { font-size: 1.2rem; color: #94a3b8; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 50px; font-weight: 300; font-family: var(--font-tech); }
        .btn-enter { background: transparent; border: 2px solid var(--neon-cyan); color: var(--neon-cyan); padding: 15px 50px; font-size: 1rem; font-weight: 700; font-family: var(--font-tech); cursor: pointer; text-transform: uppercase; letter-spacing: 2px; transition: 0.4s; position: relative; overflow: hidden; }
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
        .price-card { background: var(--panel-bg); border: 1px solid var(--border-color); width: 320px; padding: 40px; text-align: center; position: relative; transition: 0.3s; }
        .price-card:hover { transform: scale(1.05); }
        .price-card.premium { border: 2px solid var(--neon-gold); box-shadow: 0 0 50px rgba(251, 191, 36, 0.15); }
        .price-card.premium .plan-name, .price-card.premium .btn-plan, .price-card.premium i { color: var(--neon-gold); }
        .price-card.premium .btn-plan { background: var(--neon-gold); color: #000; }
        .price-card.pro { border: 2px solid var(--neon-cyan); box-shadow: 0 0 50px rgba(0, 242, 255, 0.15); }
        .plan-name { font-family: var(--font-tech); font-size: 1.4rem; color: #94a3b8; margin-bottom: 10px; letter-spacing: 2px; }
        .plan-price { font-size: 3.5rem; color: #fff; font-weight: 700; margin-bottom: 30px; }
        .plan-features { list-style: none; padding: 0; text-align: left; margin-bottom: 30px; color: #cbd5e1; font-size: 0.9rem; }
        .plan-features li { margin-bottom: 15px; display: flex; gap: 10px; align-items: center; }
        .plan-features i { color: var(--success); }
        .btn-plan { width: 100%; padding: 15px; font-weight: 800; border: none; cursor: pointer; font-family: var(--font-tech); text-transform: uppercase; letter-spacing: 1px; transition: 0.3s; }
        .btn-plan.pro { background: var(--neon-cyan); color: #000; }
        .btn-plan.basic { background: #334155; color: #fff; }

        /* FINANCIAL TABLE STYLES - CFO LEVEL */
        .fin-table { width: 100%; border-collapse: collapse; font-family: 'Courier New', monospace; font-size: 0.85rem; margin-top:10px; color:#e2e8f0; }
        .fin-table th, .fin-table td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); text-align: right; }
        .fin-table th { text-align: left; color: var(--neon-cyan); font-weight:bold; font-size:0.9rem; letter-spacing:1px; }
        .fin-table tr:hover { background: rgba(255,255,255,0.03); }
        .fin-sub-row td { color: #94a3b8; font-style: italic; padding-left: 20px; font-size: 0.75rem; border-bottom: 1px dashed rgba(255,255,255,0.05); }
        .fin-section-total td { font-weight: bold; color: #fff; border-top: 1px solid #555; background: rgba(255,255,255,0.05); }
        .fin-grand-total td { font-weight: 900; font-size: 1.2rem; border-top: 2px solid var(--neon-gold); color: var(--neon-gold); padding: 20px 10px; }
        .fin-lbl { text-align: left; }

        /* MODAL */
        .modal { display: none; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.85); backdrop-filter: blur(8px); }
        .modal-content { background-color: #0f172a; margin: 2% auto; padding: 0; border: 1px solid var(--neon-cyan); width: 85%; max-width: 1100px; border-radius: 4px; box-shadow: 0 0 100px rgba(0,242,255,0.15); animation: fadeIn 0.3s; }
        .modal-header { padding: 20px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; background: rgba(0,242,255,0.05); }
        .modal-title { font-family: var(--font-tech); font-size: 1.5rem; color: var(--neon-cyan); letter-spacing:2px; }
        .close-btn { color: #aaa; font-size: 32px; font-weight: bold; cursor: pointer; }
        .modal-body { padding: 30px; max-height: 80vh; overflow-y: auto; color: #cbd5e1; }

        /* CHAT */
        .chat-btn { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background: var(--neon-cyan); border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 1500; box-shadow: 0 0 20px rgba(0,242,255,0.4); }
        .chat-window { display: none; position: fixed; bottom: 90px; right: 20px; width: 350px; height: 450px; background: rgba(10, 15, 25, 0.95); border: 1px solid var(--neon-cyan); border-radius: 8px; z-index: 1500; flex-direction: column; backdrop-filter: blur(10px); transition: all 0.3s ease; }
        .chat-window.expanded { width: 600px; height: 700px; max-width: 90vw; max-height: 80vh; }
        .chat-header { padding: 15px; background: rgba(0,242,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1); font-family: var(--font-tech); color: var(--neon-cyan); font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
        .chat-body { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; font-size: 0.85rem; }
        .chat-input-area { padding: 10px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 10px; }
        .chat-input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 8px; border-radius: 4px; outline: none; }
        .chat-send { background: var(--neon-cyan); border: none; color: #000; padding: 0 15px; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .msg { padding: 8px 12px; border-radius: 4px; max-width: 80%; line-height: 1.4; word-wrap: break-word; }
        .msg.user { align-self: flex-end; background: rgba(0,242,255,0.2); color: #fff; border-right: 2px solid var(--neon-cyan); }
        .msg.ai { align-self: flex-start; background: rgba(255,255,255,0.05); color: #cbd5e1; border-left: 2px solid var(--neon-purple); }

        .loader { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.9); z-index: 2000; place-items: center; }
        .spinner { width: 50px; height: 50px; border: 3px solid var(--neon-cyan); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="loader" id="loader"><div style="text-align: center;"><div class="spinner" style="margin: 0 auto 15px;"></div><div style="font-family: var(--font-tech); color: var(--neon-cyan); font-size:1rem;" data-i18n="computing">CALCULATING VOYAGE ESTIMATION...</div></div></div>

    <div id="docModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <span class="modal-title" id="modalTitle">TITLE</span>
                <span class="close-btn" onclick="closeModal('docModal')">&times;</span>
            </div>
            <div class="modal-body" id="modalBody"></div>
        </div>
    </div>

    <div id="finModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <span class="modal-title">DETAILED VOYAGE FINANCIAL BREAKDOWN</span>
                <span class="close-btn" onclick="closeModal('finModal')">&times;</span>
            </div>
            <div class="modal-body" id="finBody"></div>
        </div>
    </div>

    <div class="chat-btn" onclick="toggleChat()"><i class="fa-solid fa-robot"></i></div>
    <div class="chat-window" id="chatWindow">
        <div class="chat-header">
            <span><i class="fa-solid fa-brain" style="margin-right:8px;"></i>VIYA AI</span>
            <div style="display:flex; gap:10px; align-items:center;">
                <span style="cursor:pointer;" onclick="toggleExpand()"><i class="fa-solid fa-expand"></i></span>
                <span style="cursor:pointer;" onclick="toggleChat()">&times;</span>
            </div>
        </div>
        <div class="chat-body" id="chatBody">
            <div class="msg ai">Hello Captain! I am VIYA AI. Ask me about Regulations (SOLAS, MARPOL), Charter Parties, Market Rates, or Operational questions.</div>
        </div>
        <div class="chat-input-area">
            <input type="text" id="chatInput" class="chat-input" placeholder="Type here..." onkeypress="handleEnter(event)">
            <button class="chat-send" onclick="sendChat()"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
    </div>

    <div id="landing-view">
        <img src="https://raw.githubusercontent.com/viyabrokerAlperen/viya-broker-system/main/viya_broker_logo.png" alt="VIYA BROKER LOGO" class="landing-logo-img">
        <div class="landing-sub" data-i18n="landing_sub">Global Maritime Brokerage System</div>
        <button class="btn-enter" onclick="enterSystem()" data-i18n="enter_btn">ENTER TERMINAL</button>
    </div>

    <nav id="mainNav">
        <div class="brand" onclick="switchView('dashboard')">
            <img src="https://raw.githubusercontent.com/viyabrokerAlperen/viya-broker-system/main/viya_broker_logo.png" alt="VIYA BROKER">
            VIYA BROKER
        </div>
        <div class="nav-links">
            <div class="nav-item active" onclick="switchView('dashboard')" data-i18n="nav_term">Terminal</div>
            <div class="nav-item" onclick="switchView('academy')" data-i18n="nav_kb">Knowledge Base</div>
            <div class="nav-item" onclick="switchView('regulations')" data-i18n="nav_reg">Regulations</div>
            <div class="nav-item" onclick="switchView('docs')" data-i18n="nav_docs">Document Center</div>
            <div class="nav-item" onclick="switchView('pricing')" data-i18n="nav_mem">Membership</div>
            <div class="lang-switch" onclick="toggleLanguage()">EN | TR</div>
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
                <div class="p-header"><i class="fa-solid fa-ship"></i> <span data-i18n="panel_vessel">VESSEL PARAMETERS</span></div>
                <div class="p-body">
                    <div class="input-group"><label data-i18n="lbl_vessel">VESSEL CLASS & TYPE</label>
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
                    <div class="input-group"><label data-i18n="lbl_port">QUICK POSITION (PORT)</label><input type="text" id="refPort" list="portList" placeholder="Enter port name..." onchange="fillCoords()"></div>
                    <div class="input-group"><div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;"><input type="number" id="vLat" placeholder="Lat"><input type="number" id="vLng" placeholder="Lng"></div></div>
                    <div class="input-group"><label data-i18n="lbl_speed">OPERATIONAL SPEED (KTS)</label><input type="number" id="vSpeed" value="13.5"></div>
                    <div class="input-group"><label data-i18n="lbl_qty">CARGO QTY (TONS)</label><input type="number" id="vQty" placeholder="e.g. 50000" value="50000"></div>
                    <div class="input-group">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                            <div><label data-i18n="lbl_lrate">LOAD RATE (MT/DAY)</label><input type="number" id="vLoadRate" value="15000"></div>
                            <div><label data-i18n="lbl_drate">DISCH RATE (MT/DAY)</label><input type="number" id="vDischRate" value="10000"></div>
                        </div>
                    </div>
                    <button class="btn-action" onclick="scanMarket()" data-i18n="btn_scan">SCAN MARKET OPPORTUNITIES</button>
                    <div id="cargoResultList" class="cargo-list" style="margin-top:20px; display:none;"></div>
                </div>
            </aside>
            <div class="panel">
                <div id="map"></div>
                <div style="position:absolute; bottom:20px; left:20px; z-index:500; background:rgba(0,0,0,0.8); padding:10px; border-radius:4px; color:#fff; font-size:0.7rem; border:1px solid #333;">
                    <div style="display:flex; align-items:center; margin-bottom:5px;"><span style="width:8px; height:8px; background:#f59e0b; border-radius:50%; margin-right:8px;"></span> <span data-i18n="map_vessel">Vessel</span></div>
                    <div style="display:flex; align-items:center; margin-bottom:5px;"><span style="width:8px; height:8px; background:#10b981; border-radius:50%; margin-right:8px;"></span> <span data-i18n="map_load">Load Port</span></div>
                    <div style="display:flex; align-items:center;"><span style="width:8px; height:8px; background:#ef4444; border-radius:50%; margin-right:8px;"></span> <span data-i18n="map_disch">Discharge</span></div>
                </div>
            </div>
            <aside class="panel">
                <div class="p-header"><i class="fa-solid fa-file-invoice-dollar"></i> <span data-i18n="panel_estim">VOYAGE ESTIMATION</span></div>
                <div class="p-body" id="analysisPanel" style="display:none;">
                    <div class="stat-grid">
                        <div class="stat-card"><div class="stat-val" id="dispTCE" style="color:var(--neon-cyan)">$0</div><div class="stat-lbl">TCE / Day</div></div>
                        <div class="stat-card"><div class="stat-val" id="dispProfit" style="color:var(--success)">$0</div><div class="stat-lbl" data-i18n="stat_profit">Net Profit</div></div>
                    </div>
                    <button class="btn-download" style="margin:10px 0; border-color:var(--neon-gold); color:var(--neon-gold);" onclick="showFinancials()">VIEW FULL BREAKDOWN</button>
                    <div id="financialDetails"></div>
                    <div class="ai-insight" id="aiOutput"></div>
                </div>
                <div class="p-body" id="emptyState" style="text-align:center; padding-top:50px; color:#555;" data-i18n="empty_state">Waiting for vessel position data...</div>
            </aside>
        </div>
    </div>

    <div id="academy" class="view-section">
        <div class="library-section">
            <div class="section-title" data-i18n="sec_kb">KNOWLEDGE BASE</div>
            <div class="section-desc" data-i18n="desc_kb">Essential maritime commercial and legal concepts for modern brokers.</div>
            <div class="docs-grid" id="academyGrid"></div>
        </div>
    </div>

    <div id="regulations" class="view-section">
        <div class="library-section">
            <div class="section-title">MARITIME REGULATIONS (IMO & ILO)</div>
            <div class="section-desc">Global compliance framework: SOLAS, MARPOL, STCW, MLC 2006.</div>
            <div class="docs-grid" id="regsGrid"></div>
        </div>
    </div>

    <div id="docs" class="view-section">
        <div class="library-section">
            <div class="section-title" data-i18n="sec_doc">DOCUMENT CENTER</div>
            <div class="section-desc" data-i18n="desc_doc">Industry standard Charter Parties, Riders and Operational Forms.</div>
            <div id="docsContainer"></div>
        </div>
    </div>

    <div id="pricing" class="view-section">
        <div class="pricing-container">
            <div class="price-card">
                <div class="plan-name">CADET</div>
                <div class="plan-price">$0 <span>/mo</span></div>
                <ul class="plan-features">
                    <li><i class="fa-solid fa-check"></i> <span data-i18n="feat_dist">Distance Calculator</span></li>
                    <li><i class="fa-solid fa-check"></i> <span data-i18n="feat_scans">3 Daily Scans</span></li>
                    <li><i class="fa-solid fa-xmark" style="color:#555"></i> Financial Analysis</li>
                </ul>
                <button class="btn-plan basic" data-i18n="btn_curr">CURRENT PLAN</button>
            </div>
            <div class="price-card pro">
                <div class="plan-name" style="color:var(--neon-cyan)">BROKER PRO</div>
                <div class="plan-price">$199 <span>/mo</span></div>
                <ul class="plan-features">
                    <li><i class="fa-solid fa-check"></i> <span data-i18n="feat_unl">Unlimited Scans</span></li>
                    <li><i class="fa-solid fa-check"></i> Real-Time TCE & Profit</li>
                    <li><i class="fa-solid fa-check"></i> Live Market Data</li>
                    <li><i class="fa-solid fa-check"></i> Regulation Library</li>
                </ul>
                <button class="btn-plan pro" data-i18n="btn_upg">UPGRADE NOW</button>
            </div>
            <div class="price-card premium">
                <div class="plan-name">FLEET OWNER</div>
                <div class="plan-price">$999 <span>/mo</span></div>
                <ul class="plan-features">
                    <li><i class="fa-solid fa-check"></i> <span data-i18n="feat_all">All Pro Features</span></li>
                    <li><i class="fa-solid fa-check"></i> API Access</li>
                    <li><i class="fa-solid fa-check"></i> 24/7 Dedicated Legal AI</li>
                    <li><i class="fa-solid fa-check"></i> Fleet Management Tools</li>
                </ul>
                <button class="btn-plan basic" data-i18n="btn_contact">CONTACT SALES</button>
            </div>
        </div>
    </div>

    <datalist id="portList"></datalist>

    <script>
        // GLOBAL STATE
        let currentVoyageData = null; // Holds the detailed calculation for the modal
        const CLIENT_VESSEL_SPECS = {
            "HANDYSIZE":    { default_speed: 13.0 }, "HANDYMAX": { default_speed: 13.0 }, "SUPRAMAX": { default_speed: 13.5 },
            "ULTRAMAX":     { default_speed: 13.5 }, "PANAMAX": { default_speed: 13.0 }, "KAMSARMAX": { default_speed: 13.0 },
            "CAPESIZE":     { default_speed: 12.5 }, "NEWCASTLEMAX": { default_speed: 12.5 }, "SMALL_CHEM": { default_speed: 13.0 },
            "MR_TANKER":    { default_speed: 13.0 }, "LR1": { default_speed: 13.0 }, "AFRAMAX": { default_speed: 12.5 },
            "SUEZMAX":      { default_speed: 12.5 }, "VLCC": { default_speed: 12.0 }, "LPG_MGC": { default_speed: 16.0 },
            "LPG_VLGC":     { default_speed: 16.5 }, "LNG_CONV": { default_speed: 19.0 }, "LNG_Q_FLEX": { default_speed: 19.5 }
        };

        // --- TRANSLATION ENGINE ---
        const TRANSLATIONS = {
            en: {
                nav_term: "Terminal", nav_kb: "Knowledge Base", nav_reg: "Regulations", nav_docs: "Document Center", nav_mem: "Membership",
                btn_scan: "SCAN MARKET OPPORTUNITIES", read_btn: "READ", lbl_vessel: "VESSEL CLASS & TYPE", lbl_port: "QUICK POSITION (PORT)", 
                lbl_speed: "OPERATIONAL SPEED (KTS)", lbl_qty: "CARGO QTY (TONS)", lbl_lrate: "LOAD RATE (MT/DAY)", lbl_drate: "DISCH RATE (MT/DAY)",
                panel_vessel: "VESSEL PARAMETERS", panel_estim: "VOYAGE ESTIMATION", map_vessel: "Vessel", map_load: "Load Port", map_disch: "Discharge",
                stat_profit: "Net Profit", empty_state: "Waiting for vessel position data...",
                sec_kb: "KNOWLEDGE BASE", desc_kb: "Essential maritime commercial and legal concepts for modern brokers.", 
                sec_doc: "DOCUMENT CENTER", desc_doc: "Industry standard Charter Parties, Riders and Operational Forms.",
                feat_dist: "Distance Calculator", feat_scans: "3 Daily Scans", feat_unl: "Unlimited Scans", feat_all: "All Pro Features",
                btn_curr: "CURRENT PLAN", btn_upg: "UPGRADE NOW", btn_contact: "CONTACT SALES", computing: "COMPUTING..."
            },
            tr: {
                nav_term: "Terminal", nav_kb: "Bilgi Bankası", nav_reg: "Mevzuat", nav_docs: "Doküman Merkezi", nav_mem: "Üyelik",
                btn_scan: "PİYASAYI TARAT", read_btn: "İNCELE", lbl_vessel: "GEMİ SINIFI & TİPİ", lbl_port: "HIZLI KONUM (LİMAN)", 
                lbl_speed: "OPERASYONEL HIZ (KTS)", lbl_qty: "YÜK MİKTARI (TON)", lbl_lrate: "YÜKLEME HIZI (TON/GÜN)", lbl_drate: "TAHLİYE HIZI (TON/GÜN)",
                panel_vessel: "GEMİ PARAMETRELERİ", panel_estim: "SEFER TAHMİNİ", map_vessel: "Gemi", map_load: "Yükleme", map_disch: "Tahliye",
                stat_profit: "Net Kâr", empty_state: "Gemi konum verisi bekleniyor...",
                sec_kb: "BİLGİ BANKASI", desc_kb: "Modern brokerler için temel ticari ve hukuki kavramlar.", 
                sec_doc: "DOKÜMAN MERKEZİ", desc_doc: "Endüstri standardı Charter Party, Ek Maddeler ve Operasyonel Formlar.",
                feat_dist: "Mesafe Hesaplayıcı", feat_scans: "Günlük 3 Tarama", feat_unl: "Sınırsız Tarama", feat_all: "Tüm Pro Özellikler",
                btn_curr: "MEVCUT PLAN", btn_upg: "YÜKSELT", btn_contact: "SATIŞLA GÖRÜŞ", computing: "HESAPLANIYOR..."
            }
        };

        let currentLang = 'en';

        function toggleLanguage() {
            currentLang = currentLang === 'en' ? 'tr' : 'en';
            updateLanguage();
        }

        function updateLanguage() {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if(TRANSLATIONS[currentLang][key]) {
                    el.innerText = TRANSLATIONS[currentLang][key];
                }
            });
            loadLibrary(); 
            loadRegulations();
        }

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
            if(viewId === 'regulations') document.querySelectorAll('.nav-item')[2].classList.add('active');
            if(viewId === 'docs') document.querySelectorAll('.nav-item')[3].classList.add('active');
            if(viewId === 'pricing') document.querySelectorAll('.nav-item')[4].classList.add('active');
            if(viewId === 'dashboard') setTimeout(() => map.invalidateSize(), 100);
        }

        let DOCS_DB = [], REGS_DB = [];

        async function loadLibrary() {
            const aGrid = document.getElementById('academyGrid');
            aGrid.innerHTML = "";
            const ACADEMY_DATA = [
                {icon: "fa-scale-balanced", title: "Laytime & Demurrage", desc: "Calculating time saved/lost. Key concepts: SHINC, SHEX, WWD."},
                {icon: "fa-globe", title: "INCOTERMS 2020", desc: "Responsibility transfer points: FOB vs CIF vs CFR."},
                {icon: "fa-file-signature", title: "Bill of Lading", desc: "Functions of B/L: Receipt, Title, Contract of Carriage."},
                {icon: "fa-anchor", title: "General Average", desc: "York-Antwerp Rules and shared loss principles."},
                {icon: "fa-hand-holding-dollar", title: "Maritime Lien", desc: "Claims against the vessel vs the owner."},
                {icon: "fa-smog", title: "ECA Regulations", desc: "Sulphur caps (0.1% vs 0.5%) and scrubber usage."}
            ];
            ACADEMY_DATA.forEach(item => {
                let html = '<div class="doc-card">' +
                           '<i class="fa-solid ' + item.icon + ' doc-icon" style="color:var(--neon-purple)"></i>' +
                           '<div class="doc-title">' + item.title + '</div>' +
                           '<div class="doc-desc">' + item.desc + '</div>' +
                           '<button class="btn-download">' + TRANSLATIONS[currentLang].read_btn + '</button>' +
                           '</div>';
                aGrid.innerHTML += html;
            });

            const dContainer = document.getElementById('docsContainer');
            dContainer.innerHTML = "";
            try {
                if(DOCS_DB.length === 0) { const res = await fetch('/api/documents'); DOCS_DB = await res.json(); }
                DOCS_DB.forEach(cat => {
                    let html = '<div class="category-header">' + cat.category + '</div><div class="docs-grid">';
                    cat.items.forEach(item => {
                        html += '<div class="doc-card">' +
                                '<i class="fa-solid fa-file-contract doc-icon" style="color:var(--neon-cyan)"></i>' +
                                '<div class="doc-title">' + item.title + '</div>' +
                                '<div class="doc-desc">' + item.desc + '</div>' +
                                '<button class="btn-download" onclick="openDoc(\\'' + item.id + '\\')">' + TRANSLATIONS[currentLang].read_btn + '</button>' +
                                '</div>';
                    });
                    html += '</div>';
                    dContainer.innerHTML += html;
                });
            } catch(e) {}
        }
        loadLibrary();

        async function loadRegulations() {
            const rGrid = document.getElementById('regsGrid');
            rGrid.innerHTML = "";
            try {
                if(REGS_DB.length === 0) { const res = await fetch('/api/regulations'); REGS_DB = await res.json(); }
                REGS_DB.forEach(reg => {
                    rGrid.innerHTML += '<div class="doc-card">' +
                        '<i class="fa-solid fa-gavel doc-icon" style="color:var(--neon-gold)"></i>' +
                        '<div class="doc-title">' + reg.code + '</div>' +
                        '<div class="doc-desc" style="font-weight:bold; color:#fff;">' + reg.title + '</div>' +
                        '<div class="doc-desc">' + reg.summary + '</div>' +
                        '<button class="btn-download" onclick="openReg(\\'' + reg.id + '\\')">VIEW STATUTE</button>' +
                        '</div>';
                });
            } catch(e){}
        }
        loadRegulations();

        // MODALS
        function openDoc(id) {
            const doc = DOCS_DB.flatMap(c => c.items).find(i => i.id === id);
            if(doc) showModal(doc.title, doc.content);
        }
        function openReg(id) {
            const reg = REGS_DB.find(r => r.id === id);
            if(reg) showModal(reg.title + " (" + reg.code + ")", reg.content);
        }
        function showModal(title, content) {
            document.getElementById('modalTitle').innerText = title;
            document.getElementById('modalBody').innerText = content;
            document.getElementById('docModal').style.display = 'block';
        }
        function closeModal(id) { document.getElementById(id).style.display = 'none'; }
        function downloadCurrentDoc() { alert("Secure Download Started..."); }
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) event.target.style.display = 'none';
        }

        // FINANCIAL DETAILS MODAL (THE CFO FEATURE)
        function showFinancials() {
            if(!currentVoyageData) return;
            const b = currentVoyageData.breakdown;
            const vc = b.voyage_costs;
            const ox = b.opex;
            
            const html = \`
                <table class="fin-table">
                    <tr><th colspan="2" class="fin-lbl" style="font-size:1rem; border-bottom:2px solid var(--neon-cyan);">1. REVENUE (GELİR)</th></tr>
                    <tr><td class="fin-lbl">Gross Freight (${currentVoyageData.qty}mt x $${currentVoyageData.cargo.rate})</td><td>$${Math.floor(b.revenue).toLocaleString()}</td></tr>
                    <tr class="fin-section-total"><td class="fin-lbl">NET REVENUE (After Comm)</td><td>$${Math.floor(b.revenue - vc.comm).toLocaleString()}</td></tr>
                    
                    <tr><th colspan="2" class="fin-lbl" style="padding-top:20px; font-size:1rem; border-bottom:2px solid var(--neon-cyan);">2. VOYAGE COSTS (SEFER GİDERLERİ)</th></tr>
                    <tr><td class="fin-lbl"><strong>A. Bunkers (Yakıt)</strong></td><td><strong>$${Math.floor(vc.fuel.total).toLocaleString()}</strong></td></tr>
                    <tr class="fin-sub-row"><td class="fin-lbl">- Main Engine</td><td>$${Math.floor(vc.fuel.main).toLocaleString()}</td></tr>
                    <tr class="fin-sub-row"><td class="fin-lbl">- Aux Engine (Port)</td><td>$${Math.floor(vc.fuel.aux).toLocaleString()}</td></tr>
                    <tr class="fin-sub-row"><td class="fin-lbl">- Lubricants</td><td>$${Math.floor(vc.fuel.lubes).toLocaleString()}</td></tr>
                    
                    <tr><td class="fin-lbl"><strong>B. Port Charges (Liman)</strong></td><td><strong>$${Math.floor(vc.port.total).toLocaleString()}</strong></td></tr>
                    <tr class="fin-sub-row"><td class="fin-lbl">- Dues (Rüsum)</td><td>$${Math.floor(vc.port.dues).toLocaleString()}</td></tr>
                    <tr class="fin-sub-row"><td class="fin-lbl">- Pilotage (Kılavuz)</td><td>$${Math.floor(vc.port.pilot).toLocaleString()}</td></tr>
                    <tr class="fin-sub-row"><td class="fin-lbl">- Towage (Römorkör)</td><td>$${Math.floor(vc.port.towage).toLocaleString()}</td></tr>
                    <tr class="fin-sub-row"><td class="fin-lbl">- Agency & Misc</td><td>$${Math.floor(vc.port.agency + vc.port.waste).toLocaleString()}</td></tr>

                    <tr><td class="fin-lbl"><strong>C. Cargo Handling</strong></td><td><strong>$${Math.floor(vc.cargo.total).toLocaleString()}</strong></td></tr>
                    <tr class="fin-sub-row"><td class="fin-lbl">- Hold Cleaning / Lashing</td><td>$${Math.floor(vc.cargo.total).toLocaleString()}</td></tr>

                    <tr><td class="fin-lbl"><strong>D. Others</strong></td><td></td></tr>
                    <tr class="fin-sub-row"><td class="fin-lbl">- Canal Transit</td><td>$${Math.floor(vc.canal).toLocaleString()}</td></tr>
                    <tr class="fin-sub-row"><td class="fin-lbl">- Brokerage Comm</td><td>$${Math.floor(vc.comm).toLocaleString()}</td></tr>
                    
                    <tr class="fin-section-total"><td class="fin-lbl">TOTAL VOYAGE COSTS</td><td>$${Math.floor(vc.total).toLocaleString()}</td></tr>

                    <tr><th colspan="2" class="fin-lbl" style="padding-top:20px; font-size:1rem; border-bottom:2px solid var(--neon-cyan);">3. OPERATING EXPENSES (OPEX - GÜNLÜK)</th></tr>
                    <tr><td class="fin-lbl">Total OPEX (${currentVoyageData.totalDays.toFixed(1)} days)</td><td><strong>$${Math.floor(ox.total).toLocaleString()}</strong></td></tr>
                    <tr class="fin-sub-row"><td class="fin-lbl">- Crewing (Personel)</td><td>$${Math.floor(ox.crew).toLocaleString()}</td></tr>
                    <tr class="fin-sub-row"><td class="fin-lbl">- Insurance (H&M, P&I)</td><td>$${Math.floor(ox.insurance).toLocaleString()}</td></tr>
                    <tr class="fin-sub-row"><td class="fin-lbl">- Maintenance & Stores</td><td>$${Math.floor(ox.maintenance + ox.stores).toLocaleString()}</td></tr>
                    <tr class="fin-sub-row"><td class="fin-lbl">- Victualling & Admin</td><td>$${Math.floor(ox.victualling + ox.admin).toLocaleString()}</td></tr>

                    <tr><th colspan="2" style="padding-top:30px;"></th></tr>
                    <tr class="fin-grand-total">
                        <td class="fin-lbl">NET PROFIT (KÂR)</td>
                        <td>$${Math.floor(currentVoyageData.financials.profit).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td class="fin-lbl" style="color:#aaa;">TCE (Time Charter Equivalent)</td>
                        <td style="color:var(--neon-cyan); font-weight:bold;">$${Math.floor(currentVoyageData.financials.tce).toLocaleString()} / day</td>
                    </tr>
                </table>
            \`;
            document.getElementById('finBody').innerHTML = html;
            document.getElementById('finModal').style.display = 'block';
        }

        // CHAT
        function toggleChat() { 
            const w = document.getElementById('chatWindow'); 
            w.style.display = w.style.display === 'flex' ? 'none' : 'flex'; 
        }
        function toggleExpand() { document.getElementById('chatWindow').classList.toggle('expanded'); }
        function handleEnter(e) { if(e.key === 'Enter') sendChat(); }
        
        async function sendChat() {
            const inp = document.getElementById('chatInput');
            const msg = inp.value.trim();
            if(!msg) return;
            const body = document.getElementById('chatBody');
            body.innerHTML += '<div class="msg user">' + msg + '</div>';
            inp.value = ''; body.scrollTop = body.scrollHeight;
            const lid = 'l-' + Date.now();
            body.innerHTML += '<div class="msg ai" id="' + lid + '">...</div>';
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({message: msg})
                });
                const d = await res.json();
                document.getElementById(lid).innerText = d.reply;
            } catch(e) { document.getElementById(lid).innerText = "Error."; }
            body.scrollTop = body.scrollHeight;
        }

        function updateSpeed() { 
            const type = document.getElementById('vType').value;
            if(type && CLIENT_VESSEL_SPECS[type]) document.getElementById('vSpeed').value = CLIENT_VESSEL_SPECS[type].default_speed;
        }

        function getDistance(lat1, lon1, lat2, lon2) {
            // Client side simplistic distance for sorting
            const R = 3440;
            const dLat = (lat2 - lat1) * Math.PI/180;
            const dLon = (lon2 - lon1) * Math.PI/180;
            const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return Math.round(R * c * 1.15); 
        }

        async function init() {
            try {
                const pRes = await fetch('/api/ports'); const ports = await pRes.json();
                const dl = document.getElementById('portList');
                ports.forEach(p => { const o = document.createElement('option'); o.value = p; dl.appendChild(o); });
                const mRes = await fetch('/api/market'); const m = await mRes.json();
                if(m.brent) {
                    document.getElementById('oilPrice').innerText = "$"+m.brent.toFixed(2);
                    document.getElementById('hoPrice').innerText = "$"+m.mgo.toFixed(0);
                    document.getElementById('vlsfoPrice').innerText = "$"+m.vlsfo.toFixed(0);
                }
            } catch(e) {}
        }
        init();

        async function fillCoords() { 
             const pName = document.getElementById('refPort').value.toUpperCase(); 
             if(!pName) return; 
             try{ 
                 const res = await fetch('/api/port-coords?port='+pName); 
                 const d = await res.json(); 
                 if(d.lat){ 
                     document.getElementById('vLat').value=d.lat; 
                     document.getElementById('vLng').value=d.lng; 
                     updateShipMarker(d.lat, d.lng); 
                 }
             } catch(e){} 
        }

        const map = L.map('map', {zoomControl: false, attributionControl: false}).setView([30, 0], 2);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 10 }).addTo(map);
        const layerGroup = L.layerGroup().addTo(map);
        let shipMarker = null;

        function updateShipMarker(lat, lng) { if(shipMarker) map.removeLayer(shipMarker); shipMarker = L.circleMarker([lat, lng], {radius:7, color:'#fff', fillColor:'#f59e0b', fillOpacity:1}).addTo(map).bindPopup("VESSEL"); map.setView([lat, lng], 4); }

        async function scanMarket() {
            const lat = parseFloat(document.getElementById('vLat').value);
            const lng = parseFloat(document.getElementById('vLng').value);
            if(isNaN(lat) || isNaN(lng)) { alert("Enter valid Coords"); return; }
            updateShipMarker(lat, lng);
            document.getElementById('loader').style.display = 'grid';
            try {
                const res = await fetch('/api/analyze', { 
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'}, 
                    body: JSON.stringify({
                        shipLat:lat, shipLng:lng, 
                        shipSpeed:document.getElementById('vSpeed').value, 
                        vType:document.getElementById('vType').value, 
                        cargoQty:document.getElementById('vQty').value,
                        loadRate:document.getElementById('vLoadRate').value,
                        dischRate:document.getElementById('vDischRate').value
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
                el.innerHTML = '<div class="ci-top"><span>' + v.loadPort + ' -> ' + v.dischPort + '</span><span class="tce-badge">$' + Math.floor(v.financials.tce).toLocaleString() + '/day</span></div><div class="ci-bot"><span>' + v.commodity + '</span><span>Bal: ' + v.ballastDist + ' NM</span></div>';
                el.onclick = () => showDetails(v, el); list.appendChild(el);
            });
            showDetails(voyages[0], list.children[0]);
        }

        function showDetails(v, el) {
            currentVoyageData = v; // SAVE FOR MODAL
            document.querySelectorAll('.cargo-item').forEach(x => x.classList.remove('active')); el.classList.add('active');
            document.getElementById('emptyState').style.display = 'none'; document.getElementById('analysisPanel').style.display = 'block';
            
            document.getElementById('dispTCE').innerText = "$" + Math.floor(v.financials.tce).toLocaleString();
            document.getElementById('dispProfit').innerText = "$" + Math.floor(v.financials.profit).toLocaleString();
            
            // Simplified view for side panel
            document.getElementById('financialDetails').innerHTML = 
                '<div class="detail-row"><span class="d-lbl">Ballast</span> <span class="d-val neg">' + v.ballastDist + ' NM</span></div>' +
                '<div class="detail-row"><span class="d-lbl">Laden</span> <span class="d-val">' + v.ladenDist + ' NM</span></div>' +
                '<div class="detail-row"><span class="d-lbl">Total Days</span> <span class="d-val">' + v.totalDays.toFixed(1) + '</span></div>' +
                '<div class="detail-row"><span class="d-lbl">Gross Revenue</span> <span class="d-val pos">$' + Math.floor(v.breakdown.revenue).toLocaleString() + '</span></div>' +
                '<div class="detail-row"><span class="d-lbl">Total Expenses</span> <span class="d-val neg">-$' + Math.floor(v.breakdown.total_expenses).toLocaleString() + '</span></div>';
            
            document.getElementById('aiOutput').innerHTML = v.aiAnalysis;
            
            // MAP UPDATE
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
// 4. API ROUTES (END)
// =================================================================

app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));

app.get('/api/market', async (req, res) => { 
    await updateMarketData(); 
    res.json(MARKET); 
});

app.get('/api/port-coords', (req, res) => { const p = PORT_DB[req.query.port]; res.json(p || {}); });

app.get('/api/documents', (req, res) => { res.json(DOCS_DATA); });

app.get('/api/regulations', (req, res) => { res.json(REGS_DATA); });

// [YENİ]: AKILLI AI MODEL SEÇİCİ & SİSTEM KİMLİĞİ GÜNCELLEMESİ
app.post('/api/chat', async (req, res) => {
    const userMsg = req.body.message;
    if (!API_KEY) return res.json({ reply: "AI System Offline (Missing API Key)." });

    const modelsToTry = [
        "gemini-1.5-flash", 
        "gemini-2.0-flash-exp", 
        "gemini-pro"
    ];

    for (const model of modelsToTry) {
        try {
            console.log(`Trying AI Model: ${model}...`);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            // [GÜNCELLENMİŞ SİSTEM PROMPT]
                            text: `You are VIYA AI, an elite Maritime Expert Assistant. 
                            Your name is "VIYA AI". You are professional, knowledgeable, authoritative yet helpful. You act as a combination of a Master Mariner, a Shipbroker, and a Maritime Lawyer.

                            CONTEXT - REGULATIONS:
                            ${REGS_CONTEXT}

                            CRITICAL INSTRUCTIONS:
                            1. IDENTITY: Never call yourself "Efendi Kaptan". You are "VIYA AI".
                            2. LANGUAGE: If the user writes in Turkish, answer in Turkish. If in English, answer in English. Detect and adapt instantly.
                            3. TONE: Professional, concise, industry-standard terminology.
                            4. CONTEXT: Current Market: Brent $${MARKET.brent}, VLSFO $${MARKET.vlsfo}.

                            User asks: "${userMsg}"`
                        }]
                    }]
                })
            });

            const data = await response.json();

            if (!data.error && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                return res.json({ reply: data.candidates[0].content.parts[0].text });
            } else if (data.error) {
                console.warn(`Model ${model} failed:`, data.error.message);
            }
        } catch (e) {
            console.warn(`Network error with model ${model}`);
        }
    }

    res.json({ reply: "AI Communication Error: All models failed. Please check Google API status." });
});

app.post('/api/analyze', async (req, res) => {
    await updateMarketData();
    const { shipLat, shipLng, shipSpeed, vType, cargoQty, loadRate, dischRate } = req.body;
    
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
        
        const calc = calculateFullVoyage(shipLat, shipLng, loadCand.name, loadCand.geo, dischName, dischGeo, specs, MARKET, shipSpeed, cargoQty, loadRate, dischRate);
        
        if(calc.financials.profit > -100000) { // Biraz esnek filtre
            suggestions.push({
                loadPort: loadCand.name, dischPort: dischName, loadGeo: loadCand.geo, dischGeo: dischGeo,
                commodity: calc.cargo.name, qty: calc.qty,
                ballastDist: calc.ballastDist, ladenDist: calc.ladenDist,
                totalDays: calc.totalDays, usedSpeed: calc.usedSpeed,
                financials: calc.financials, 
                breakdown: calc.breakdown, // Pass detailed breakdown to frontend
                aiAnalysis: generateAnalysis(calc, specs)
            });
        }
    }
    suggestions.sort((a,b) => b.financials.tce - a.financials.tce);
    res.json({success: true, voyages: suggestions});
});

app.listen(port, () => console.log(`VIYA BROKER V100 (THE CENTENNIAL) running on port ${port}`));
app.get('/', (req, res) => res.send(FRONTEND_HTML));
