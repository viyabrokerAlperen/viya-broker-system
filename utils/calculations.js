// utils/calculations.js

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
        {name: "Grain", rate: 32, stowing: 1.0}, {name: "Coal", rate: 24, stowing: 0.8}, 
        {name: "Iron Ore", rate: 19, stowing: 0.5}, {name: "Fertilizer", rate: 29, stowing: 1.2}
    ],
    "TANKER": [
        {name: "Crude Oil", rate: 28}, {name: "Diesel", rate: 35}, {name: "Jet Fuel", rate: 38}
    ],
    "GAS": [{name: "LNG", rate: 65}, {name: "LPG", rate: 55}]
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
    // 1. TEMEL DEĞİŞKENLER
    const speed = shipSpeed || 13.5;
    const ballastDist = getDistance(shipLat, shipLng, loadGeo.lat, loadGeo.lng);
    const ladenDist = getDistance(loadGeo.lat, loadGeo.lng, dischGeo.lat, dischGeo.lng);
    const totalDist = ballastDist + ladenDist;
    
    // Yük Seçimi
    const cargoType = specs.type;
    const possibleCargoes = CARGOES[cargoType] || CARGOES["BULK"];
    const cargo = possibleCargoes[Math.floor(Math.random() * possibleCargoes.length)];
    let qty = userQty || Math.floor(specs.dwt * 0.95);

    // Süreler
    const ballastDays = ballastDist / (speed * 24);
    const ladenDays = ladenDist / (speed * 24);
    const seaDays = ballastDays + ladenDays;
    const loadDays = (qty / (userLoadRate || 15000)) + 1; // +1 Turn time
    const dischDays = (qty / (userDischRate || 10000)) + 1;
    const portDays = Math.ceil(loadDays + dischDays);
    const totalDays = seaDays + portDays;

    // --- DETAYLI GİDER HESAPLAMASI ---

    // A. YAKIT (BUNKERS)
    // Ana Makine: Seyirde VLSFO
    const costMainFuel = seaDays * specs.sea_cons * market.vlsfo;
    // Yardımcı Makine (Jeneratör): Limanda MGO
    const costAuxFuel = portDays * specs.port_cons * market.mgo; 
    // Yağlar (Lubricants): Günlük ortalama $400 (Gemi boyuna göre değişir ama sabit alalım)
    const costLubes = totalDays * 400; 
    const totalBunkers = costMainFuel + costAuxFuel + costLubes;

    // B. LİMAN GİDERLERİ (PORT CHARGES) - 2 Liman (Yükleme + Tahliye)
    const grt = specs.grt;
    // Liman Rüsumu (Dues): GRT başına tahmini $1.2 x 2 Liman
    const costPortDues = (grt * 1.2) * 2;
    // Kılavuzluk (Pilotage): Giriş/Çıkış x 2 Liman (Ortalama $2500 sefer başı)
    const costPilotage = (2500 * 2) * 2;
    // Römorkör (Towage): 2 Römorkör x Giriş/Çıkış x 2 Liman (Ortalama $2000 römorkör başı)
    const costTowage = (2000 * 2 * 2) * 2;
    // Palamar (Line Handling): Ortalama $800 x 2 Liman
    const costLines = 800 * 2 * 2;
    // Rıhtım İşgaliye (Berth Hire): Günlük $1000 x Port Days
    const costBerth = portDays * 1000;
    // Atık/Acente/Misc
    const costAgency = 2500 * 2;
    const costWaste = 1500;
    
    const totalPortCosts = costPortDues + costPilotage + costTowage + costLines + costBerth + costAgency + costWaste;

    // C. YÜK & KANAL
    const costStevedoring = 0; // Genelde FIO (Free In/Out) olur, kiracı öder. Owner için 0 varsayıyoruz.
    const costDunnage = qty * 0.15; // Lashing malzemesi
    const costCleaning = 3000; // Ambar yıkama
    let costCanal = 0;
    // Kanal kontrolü (Basit coğrafi kontrol)
    if ((loadGeo.lng < 35 && dischGeo.lng > 45) || (loadGeo.lng > 45 && dischGeo.lng < 35)) costCanal = 180000; // Süveyş Tahmini
    const totalCargoCanal = costStevedoring + costDunnage + costCleaning + costCanal;

    // D. OPEX (İŞLETME MALİYETLERİ) - Günlük Dağılım
    // Sektör Ortalaması Dağılım: Crew %45, Maint %20, Ins %12, Stores %13, Admin %10
    const opex = specs.opex_daily;
    const costCrew = (opex * 0.45) * totalDays;
    const costMaint = (opex * 0.20) * totalDays;
    const costIns = (opex * 0.12) * totalDays; // H&M + P&I
    const costStores = (opex * 0.13) * totalDays; // Kumanya, Malzeme
    const costAdmin = (opex * 0.10) * totalDays;
    const totalOpex = opex * totalDays;

    // GELİR TABLOSU
    const grossRevenue = qty * cargo.rate;
    const commission = grossRevenue * 0.0375; // %3.75 Broker/Address
    const totalExpenses = totalBunkers + totalPortCosts + totalCargoCanal + commission + totalOpex;
    
    const netProfit = grossRevenue - totalExpenses;
    const tce = (grossRevenue - (totalBunkers + totalPortCosts + totalCargoCanal + commission)) / totalDays;

    // PAKETLEME (Frontend'e gidecek detaylı veri)
    return { 
        ballastDist, ladenDist, totalDays, cargo, qty, 
        breakdown: {
            revenue: grossRevenue,
            voyage_costs: {
                fuel: { main: costMainFuel, aux: costAuxFuel, lubes: costLubes, total: totalBunkers },
                port: { dues: costPortDues, pilot: costPilotage, towage: costTowage, lines: costLines, berth: costBerth, agency: costAgency, total: totalPortCosts },
                cargo: { dunnage: costDunnage, cleaning: costCleaning, total: costStevedoring + costDunnage + costCleaning },
                canal: costCanal,
                comm: commission,
                total: totalBunkers + totalPortCosts + totalCargoCanal + commission
            },
            opex: {
                crew: costCrew,
                maintenance: costMaint,
                insurance: costIns,
                stores: costStores,
                admin: costAdmin,
                daily: opex,
                total: totalOpex
            },
            total_expenses: totalExpenses
        },
        financials: { profit: netProfit, tce },
        loadPort: loadPortName, dischPort: dischPortName, loadGeo, dischGeo, usedSpeed: speed
    };
}

export function generateAnalysis(v, specs) {
    const breakEven = specs.opex_daily;
    const ratio = (v.financials.tce / breakEven).toFixed(2);
    let sentiment = "NEUTRAL";
    let color = "#94a3b8";

    if (v.financials.tce > breakEven * 2.0) { sentiment = "STRONG BUY"; color = "#10b981"; }
    else if (v.financials.tce > breakEven) { sentiment = "MODERATE"; color = "#f59e0b"; }
    else { sentiment = "LOSS MAKING"; color = "#ef4444"; }

    return `<div style="color:${color}; font-weight:900; font-size:1.1rem; margin-bottom:5px;">MARKET: ${sentiment}</div>
            <div style="font-size:0.85rem; color:#cbd5e1;">
            Coverage: <strong>${ratio}x</strong> OPEX<br>
            Break-even: <strong>$${breakEven}</strong>/day
            </div>`;
}
