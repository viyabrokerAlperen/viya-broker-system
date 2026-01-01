export const VESSEL_SPECS = {
    "HANDYSIZE":    { type: "BULK", dwt: 35000, default_speed: 13.0, sea_cons: 22, port_cons: 2.5, opex_details: { crew: 2200, victualling: 250, maintenance: 600, insurance: 350, stores: 250, admin: 400 } },
    "HANDYMAX":     { type: "BULK", dwt: 45000, default_speed: 13.0, sea_cons: 24, port_cons: 3.0, opex_details: { crew: 2300, victualling: 260, maintenance: 650, insurance: 400, stores: 280, admin: 450 } },
    "SUPRAMAX":     { type: "BULK", dwt: 58000, default_speed: 13.5, sea_cons: 28, port_cons: 3.5, opex_details: { crew: 2400, victualling: 280, maintenance: 700, insurance: 450, stores: 300, admin: 500 } },
    "ULTRAMAX":     { type: "BULK", dwt: 64000, default_speed: 13.5, sea_cons: 29, port_cons: 3.5, opex_details: { crew: 2500, victualling: 300, maintenance: 750, insurance: 500, stores: 320, admin: 550 } },
    "PANAMAX":      { type: "BULK", dwt: 82000, default_speed: 13.0, sea_cons: 32, port_cons: 4.0, opex_details: { crew: 2600, victualling: 320, maintenance: 800, insurance: 600, stores: 400, admin: 600 } },
    "KAMSARMAX":    { type: "BULK", dwt: 85000, default_speed: 13.0, sea_cons: 33, port_cons: 4.0, opex_details: { crew: 2650, victualling: 330, maintenance: 850, insurance: 650, stores: 420, admin: 620 } },
    "CAPESIZE":     { type: "BULK", dwt: 180000, default_speed: 12.5, sea_cons: 45, port_cons: 5.0, opex_details: { crew: 2800, victualling: 350, maintenance: 1000, insurance: 900, stores: 500, admin: 700 } },
    "NEWCASTLEMAX": { type: "BULK", dwt: 205000, default_speed: 12.5, sea_cons: 50, port_cons: 5.5, opex_details: { crew: 2900, victualling: 360, maintenance: 1100, insurance: 950, stores: 550, admin: 750 } },
    "SMALL_CHEM":   { type: "TANKER", dwt: 19000, default_speed: 13.0, sea_cons: 18, port_cons: 3.0, opex_details: { crew: 2500, victualling: 300, maintenance: 800, insurance: 500, stores: 400, admin: 600 } },
    "MR_TANKER":    { type: "TANKER", dwt: 50000, default_speed: 13.0, sea_cons: 26, port_cons: 4.5, opex_details: { crew: 2800, victualling: 350, maintenance: 900, insurance: 800, stores: 450, admin: 650 } },
    "LR1":          { type: "TANKER", dwt: 75000, default_speed: 13.0, sea_cons: 32, port_cons: 5.0, opex_details: { crew: 3000, victualling: 380, maintenance: 1000, insurance: 900, stores: 500, admin: 700 } },
    "AFRAMAX":      { type: "TANKER", dwt: 115000, default_speed: 12.5, sea_cons: 40, port_cons: 6.0, opex_details: { crew: 3200, victualling: 400, maintenance: 1200, insurance: 1100, stores: 600, admin: 800 } },
    "SUEZMAX":      { type: "TANKER", dwt: 160000, default_speed: 12.5, sea_cons: 48, port_cons: 7.0, opex_details: { crew: 3400, victualling: 420, maintenance: 1400, insurance: 1300, stores: 700, admin: 900 } },
    "VLCC":         { type: "TANKER", dwt: 300000, default_speed: 12.0, sea_cons: 65, port_cons: 8.0, opex_details: { crew: 3600, victualling: 450, maintenance: 1600, insurance: 1600, stores: 800, admin: 1000 } },
    "LPG_MGC":      { type: "GAS", dwt: 38000, default_speed: 16.0, sea_cons: 35, port_cons: 6.0, opex_details: { crew: 3500, victualling: 400, maintenance: 1500, insurance: 1200, stores: 600, admin: 800 } },
    "LPG_VLGC":     { type: "GAS", dwt: 55000, default_speed: 16.5, sea_cons: 45, port_cons: 7.0, opex_details: { crew: 3800, victualling: 450, maintenance: 1800, insurance: 1500, stores: 800, admin: 1000 } },
    "LNG_CONV":     { type: "GAS", dwt: 75000, default_speed: 19.0, sea_cons: 70, port_cons: 8.0, opex_details: { crew: 4000, victualling: 500, maintenance: 2000, insurance: 2000, stores: 1000, admin: 1500 } },
    "LNG_Q_FLEX":   { type: "GAS", dwt: 110000, default_speed: 19.5, sea_cons: 90, port_cons: 10.0, opex_details: { crew: 4500, victualling: 550, maintenance: 2500, insurance: 2500, stores: 1200, admin: 1800 } }
};

export const CARGOES = {
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

export function getDistance(lat1, lon1, lat2, lon2) {
    const R = 3440;
    const dLat = (lat2 - lat1) * Math.PI/180;
    const dLon = (lon2 - lon1) * Math.PI/180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 1.15); 
}

export function calculateFullVoyage(shipLat, shipLng, loadPortName, loadGeo, dischPortName, dischGeo, specs, market, shipSpeed, userQty, userLoadRate, userDischRate) {
    const speed = shipSpeed || specs.default_speed;
    const ballastDist = getDistance(shipLat, shipLng, loadGeo.lat, loadGeo.lng);
    const ladenDist = getDistance(loadGeo.lat, loadGeo.lng, dischGeo.lat, dischGeo.lng);
    
    const cargoType = specs.type;
    const possibleCargoes = CARGOES[cargoType] || CARGOES["BULK"];
    const cargo = possibleCargoes[Math.floor(Math.random() * possibleCargoes.length)];
    let qty = userQty || Math.floor(specs.dwt * 0.95);

    const ballastDays = ballastDist / (speed * 24);
    const ladenDays = ladenDist / (speed * 24);
    const loadDays = (qty / (userLoadRate || 15000)) + 1; 
    const dischDays = (qty / (userDischRate || 10000)) + 1;
    const portDays = Math.ceil(loadDays + dischDays);
    const totalDays = ballastDays + ladenDays + portDays;

    // A. BUNKER
    const costMainEngine = (ballastDays + ladenDays) * specs.sea_cons * market.vlsfo;
    const costAuxEngine = portDays * specs.port_cons * market.mgo; 
    const costLubricants = totalDays * 400;
    const totalFuelCost = costMainEngine + costAuxEngine + costLubricants;

    // B. PORT CHARGES
    const grt = specs.dwt * 0.65; 
    const duesLoad = grt * 1.1; 
    const duesDisch = grt * 1.1;
    const pilotage = 3500 * 2 * 2; 
    const towage = 2500 * 2 * 2 * 2;
    const lineHandling = 1000 * 2 * 2;
    const berthHire = portDays * 1500;
    const wasteFees = 2000;
    const agencyFees = 3000 * 2; 
    const totalPortCosts = duesLoad + duesDisch + pilotage + towage + lineHandling + berthHire + wasteFees + agencyFees;

    // C. CARGO
    const stevedoring = 0; 
    const dunnageLashing = qty * (cargo.stowing || 0.5); 
    const holdCleaning = 4000; 
    const totalCargoCosts = dunnageLashing + holdCleaning + stevedoring;

    // D. CANAL
    let costCanal = 0;
    if ((loadGeo.lng < 35 && dischGeo.lng > 45) || (loadGeo.lng > 45 && dischGeo.lng < 35)) costCanal += 250000;

    // E. OPEX
    const od = specs.opex_details || { crew: 2500, victualling: 300, maintenance: 800, insurance: 600, stores: 400, admin: 500 };
    const dailyOpexTotal = Object.values(od).reduce((a, b) => a + b, 0);
    const totalOpexCost = dailyOpexTotal * totalDays;

    // REVENUE
    const grossRevenue = qty * cargo.rate;
    const commission = grossRevenue * 0.0375; 
    
    const totalVoyageCosts = totalFuelCost + totalPortCosts + totalCargoCosts + costCanal + commission;
    const totalCostsAll = totalVoyageCosts + totalOpexCost;
    
    const netProfit = grossRevenue - totalCostsAll;
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
                canal: costCanal, comm: commission, total: totalVoyageCosts
            },
            opex: { daily: dailyOpexTotal, total: totalOpexCost, details: od },
            total_expenses: totalCostsAll
        },
        financials: { profit: netProfit, tce },
        loadPort: loadPortName, dischPort: dischPortName, loadGeo, dischGeo, usedSpeed: speed
    };
}

export function generateAnalysis(v, specs) {
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
