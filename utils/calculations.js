export const VESSEL_SPECS = {
    "HANDYSIZE": { type: "BULK", dwt: 35000, default_speed: 13.0, sea_cons: 22, port_cons: 2.5, opex_details: { crew: 2200, victualling: 250, maintenance: 600, insurance: 350, stores: 250, admin: 400 } },
    "SUPRAMAX": { type: "BULK", dwt: 58000, default_speed: 13.5, sea_cons: 28, port_cons: 3.5, opex_details: { crew: 2400, victualling: 280, maintenance: 700, insurance: 450, stores: 300, admin: 500 } },
    "PANAMAX": { type: "BULK", dwt: 82000, default_speed: 13.0, sea_cons: 32, port_cons: 4.0, opex_details: { crew: 2600, victualling: 320, maintenance: 800, insurance: 600, stores: 400, admin: 600 } },
    "CAPESIZE": { type: "BULK", dwt: 180000, default_speed: 12.5, sea_cons: 45, port_cons: 5.0, opex_details: { crew: 2800, victualling: 350, maintenance: 1000, insurance: 900, stores: 500, admin: 700 } },
    "MR_TANKER": { type: "TANKER", dwt: 50000, default_speed: 13.0, sea_cons: 26, port_cons: 4.5, opex_details: { crew: 2800, victualling: 350, maintenance: 900, insurance: 800, stores: 450, admin: 650 } },
    "VLCC": { type: "TANKER", dwt: 300000, default_speed: 12.0, sea_cons: 65, port_cons: 8.0, opex_details: { crew: 3600, victualling: 450, maintenance: 1600, insurance: 1600, stores: 800, admin: 1000 } },
    "LNG_CONV": { type: "GAS", dwt: 75000, default_speed: 19.0, sea_cons: 70, port_cons: 8.0, opex_details: { crew: 4000, victualling: 500, maintenance: 2000, insurance: 2000, stores: 1000, admin: 1500 } }
};

export const CARGOES = {
    "BULK": [{name: "Grain", rate: 32}, {name: "Coal", rate: 24}, {name: "Iron Ore", rate: 19}],
    "TANKER": [{name: "Crude Oil", rate: 28}, {name: "Diesel", rate: 35}],
    "GAS": [{name: "LNG", rate: 65}]
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

    const costMainEngine = (ballastDays + ladenDays) * specs.sea_cons * market.vlsfo;
    const costAuxEngine = portDays * specs.port_cons * market.mgo; 
    const costLubricants = totalDays * 400;
    const totalFuelCost = costMainEngine + costAuxEngine + costLubricants;

    const grt = specs.dwt * 0.65; 
    const totalPortCosts = (grt * 1.1 * 2) + (3500 * 4) + (2500 * 8) + (1000 * 4) + (portDays * 1500) + 2000 + 6000;
    const totalCargoCosts = 2000 + 4000;
    let costCanal = 0;
    if ((loadGeo.lng < 35 && dischGeo.lng > 45) || (loadGeo.lng > 45 && dischGeo.lng < 35)) costCanal += 250000;

    const od = specs.opex_details || { crew: 2500, victualling: 300, maintenance: 800, insurance: 600, stores: 400, admin: 500 };
    const dailyOpexTotal = Object.values(od).reduce((a, b) => a + b, 0);
    const totalOpexCost = dailyOpexTotal * totalDays;

    const grossRevenue = qty * cargo.rate;
    const commission = grossRevenue * 0.0375; 
    const totalVoyageCosts = totalFuelCost + totalPortCosts + totalCargoCosts + costCanal + commission;
    const totalCostsAll = totalVoyageCosts + totalOpexCost;
    const netProfit = grossRevenue - totalCostsAll;
    const tce = (grossRevenue - totalVoyageCosts) / totalDays;

    return { 
        ballastDist, ladenDist, totalDays, cargo, qty, 
        breakdown: {
            revenue: grossRevenue,
            voyage_costs: {
                fuel: { main: costMainEngine, aux: costAuxEngine, lubes: costLubricants, total: totalFuelCost },
                port: { total: totalPortCosts },
                cargo: { total: totalCargoCosts },
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
    const sentiment = v.financials.tce > (dailyOpex * 2) ? "EXCEPTIONAL" : (v.financials.tce > dailyOpex * 1.2 ? "GOOD" : "WEAK");
    return `<div style="font-weight:bold;">MARKET SENTIMENT: ${sentiment}</div><div>Coverage: ${(v.financials.tce/dailyOpex).toFixed(2)}x OPEX</div>`;
}
