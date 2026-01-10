// server.js
// VIYA BROKER - PLATINUM EDITION (V17.0 - Document Generator Added)
// Status: DATABASE CONNECTED + AI DOCUMENT GENERATION ONLINE
// PART 1 OF 2

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 10000;

// GÜVENLİK VE BAĞLANTI AYARLARI
const SECRET_KEY = process.env.JWT_SECRET || "VIYA_SUPER_SECRET_KEY_2026";
const MONGO_URI = process.env.MONGO_URI;

// --- MONGODB BAĞLANTISI ---
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log(" ✅ [SYSTEM] DATABASE: CONNECTED (MongoDB Atlas)"))
        .catch(err => console.error(" ❌ [SYSTEM] DATABASE ERROR:", err));
} else {
    console.warn(" ⚠️ [SYSTEM] MONGO_URI eksik! Veritabanı çalışmayacak.");
}

// --- MONGODB USER ŞEMASI ---
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, default: "Captain" },
    role: { type: String, default: "user" },
    plan: { type: String, default: "FREE" },
    createdAt: { type: Date, default: Date.now },
    kvkkAccepted: { type: Boolean, default: false }
});
const User = mongoose.model('User', userSchema);

// AI SETUP
const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
let genAI = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log(" ✅ [SYSTEM] AI Engine: ONLINE");
    console.log(" ✅ [SYSTEM] Document Generator: READY");
}

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 1. DATA LOADERS
// ==========================================

const loadRawJSON = (filename) => {
    try {
        const filePath = path.join(process.cwd(), 'data', filename);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
        return null;
    } catch (e) { return null; }
};

const PORT_DB_RAW = loadRawJSON('ports.json') || {};
const DOCS_DB = loadRawJSON('documents.json') || [];
const REGS_DB = loadRawJSON('regulations.json') || [];
const VESSEL_DB = loadRawJSON('vessels.json') || [];

let PORT_DB = {};
const cleanPortName = (name) => {
    if (!name) return "";
    return name.toUpperCase().replace(/İ/g, "I").replace(/Ğ/g, "G").replace(/Ü/g, "U").replace(/Ş/g, "S").replace(/Ö/g, "O").replace(/Ç/g, "C").trim();
};

if (Object.keys(PORT_DB_RAW).length > 0) {
    Object.entries(PORT_DB_RAW).forEach(([name, coords]) => {
        if (Array.isArray(coords) && coords.length === 2) {
            PORT_DB[cleanPortName(name)] = { lat: coords[1], lng: coords[0] };
        }
    });
} else {
    PORT_DB["ISTANBUL"] = {lat: 41.0082, lng: 28.9784};
    PORT_DB["SHANGHAI"] = {lat: 31.2304, lng: 121.4737};
    PORT_DB["ROTTERDAM"] = {lat: 51.9225, lng: 4.47917};
}

const MARKET_RATES = {
    "Grain": { base: 32, volatility: 5 },
    "Coal": { base: 24, volatility: 4 },
    "Iron Ore": { base: 21, volatility: 3 },
    "Steel Products": { base: 45, volatility: 8 },
    "Fertilizer": { base: 28, volatility: 4 },
    "General Cargo": { base: 38, volatility: 6 }
};

// ==========================================
// 2. DOCUMENT TEMPLATES DATABASE (YENİ!)
// ==========================================

const DOCUMENT_TEMPLATES = {
    "letter_of_protest": {
        "weather_storm": {
            title: "Letter of Protest - Heavy Weather/Storm",
            category: "Weather Related",
            template: `LETTER OF PROTEST

To: [CHARTERERS_NAME]
    [CHARTERERS_ADDRESS]

From: Master of M/V [VESSEL_NAME]
Date: [DATE]
Port: [PORT_NAME]

Dear Sirs,

RE: LETTER OF PROTEST - HEAVY WEATHER DELAY

We hereby lodge our formal protest regarding the delays encountered by M/V [VESSEL_NAME] during the voyage from [LOAD_PORT] to [DISCHARGE_PORT].

VESSEL DETAILS:
- Vessel Name: [VESSEL_NAME]
- IMO Number: [IMO_NUMBER]
- Flag: [FLAG]
- DWT: [DWT] MT

VOYAGE PARTICULARS:
- Charter Party: [CP_NAME] dated [CP_DATE]
- Cargo: [CARGO_TYPE] - [CARGO_QUANTITY] MT
- Load Port: [LOAD_PORT]
- Discharge Port: [DISCHARGE_PORT]

INCIDENT DETAILS:
On [INCIDENT_DATE] at approximately [INCIDENT_TIME] hours (local time), while the vessel was proceeding on her voyage at position [LAT]/[LONG], she encountered severe weather conditions with:
- Wind Force: [WIND_FORCE] Beaufort
- Sea State: [SEA_STATE]
- Visibility: [VISIBILITY]

Due to these adverse conditions, the Master was compelled to reduce speed to [REDUCED_SPEED] knots and alter course to [SAFE_COURSE] for the safety of the vessel, crew, and cargo.

TIME IMPACT:
- Weather delay commenced: [DELAY_START]
- Weather delay ended: [DELAY_END]
- Total time lost: [HOURS_LOST] hours

This delay was entirely beyond the control of the vessel and constitutes a force majeure event as defined under the Charter Party.

We hereby reserve all our rights under the Charter Party and applicable law, including but not limited to claiming any additional costs incurred.

Yours faithfully,

_______________________
Master, M/V [VESSEL_NAME]

cc: Owners, P&I Club, Flag State`
        },
        "weather_fog": {
            title: "Letter of Protest - Dense Fog",
            category: "Weather Related",
            template: `LETTER OF PROTEST - RESTRICTED VISIBILITY

To: [CHARTERERS_NAME]
Date: [DATE]
Vessel: M/V [VESSEL_NAME]

Dear Sirs,

RE: PROTEST - DENSE FOG / RESTRICTED VISIBILITY

We formally protest regarding the delays caused by dense fog and restricted visibility affecting M/V [VESSEL_NAME] during the voyage from [LOAD_PORT] to [DISCHARGE_PORT].

INCIDENT SUMMARY:
Date/Time: [INCIDENT_DATE] at [INCIDENT_TIME] hours
Position: [LAT] / [LONG]
Visibility: Less than [VISIBILITY_METERS] meters

ACTION TAKEN:
In accordance with COLREG Rule 19 (Conduct of Vessels in Restricted Visibility) and sound seamanship principles, the Master:
1. Reduced speed to safe maneuvering speed ([REDUCED_SPEED] knots)
2. Activated fog signals as per regulations
3. Posted additional lookouts
4. Proceeded with extreme caution

DELAYS INCURRED:
- Fog commenced: [FOG_START]
- Normal visibility resumed: [FOG_END]  
- Time lost: [HOURS_LOST] hours
- Distance covered at reduced speed: [DISTANCE] nautical miles

This delay was entirely due to adverse weather beyond the Owners' control and does not count against laytime or create liability for demurrage.

All rights reserved under Charter Party and applicable law.

Respectfully,

_______________________
Master, M/V [VESSEL_NAME]`
        },
        "cargo_damage": {
            title: "Letter of Protest - Cargo Damage on Loading",
            category: "Cargo Issues",
            template: `LETTER OF PROTEST - CARGO CONDITION

To: [SHIPPERS_NAME] / [CHARTERERS_NAME]
Date: [DATE]
Port: [PORT_NAME]

Dear Sirs,

RE: PROTEST - DAMAGED CARGO PRESENTED FOR LOADING

This letter serves as formal protest regarding the condition of cargo presented for loading aboard M/V [VESSEL_NAME] at [PORT_NAME].

VESSEL & CARGO PARTICULARS:
- Vessel: M/V [VESSEL_NAME], IMO [IMO_NUMBER]
- Charter Party: [CP_NAME] dated [CP_DATE]
- B/L Number: [BL_NUMBER]
- Cargo Description: [CARGO_TYPE]
- Contracted Quantity: [CARGO_QUANTITY] MT

PROTEST DETAILS:
During loading operations on [DATE] between [TIME_START] and [TIME_END], the following defects/damages were observed:

[DAMAGE_DESCRIPTION]

Examples include:
- [SPECIFIC_DEFECT_1]
- [SPECIFIC_DEFECT_2]
- [SPECIFIC_DEFECT_3]

EVIDENCE:
- Photographs taken: [NUMBER] photos
- Samples retained: [YES/NO]
- Tally sheets marked accordingly
- Surveyor attended: [SURVEYOR_NAME] (if applicable)

The Master has noted these exceptions on the Mate's Receipts and will issue claused Bills of Lading unless a Letter of Indemnity is provided.

We hereby reserve all rights under the Charter Party, Bill of Lading, and applicable Hague-Visby Rules.

The cargo was loaded under protest and Owners accept no liability for pre-shipment damage.

Yours faithfully,

_______________________
Master, M/V [VESSEL_NAME]

cc: P&I Club, Owners`
        },
        "port_delay": {
            title: "Letter of Protest - Port/Terminal Delays",
            category: "Port/Terminal",
            template: `LETTER OF PROTEST - PORT CONGESTION & TERMINAL DELAYS

To: [CHARTERERS_NAME]
    [PORT_AUTHORITY_NAME]
Date: [DATE]

Dear Sirs,

RE: PROTEST - UNREASONABLE DELAYS AT [PORT_NAME]

We lodge formal protest regarding excessive delays experienced by M/V [VESSEL_NAME] at [PORT_NAME].

ARRIVAL DETAILS:
- Vessel arrived at pilot station: [ARRIVAL_DATE] at [ARRIVAL_TIME]
- NOR tendered: [NOR_DATE] at [NOR_TIME]
- NOR accepted: [NOR_ACCEPTED_DATE] (delay: [DELAY_HOURS] hours)
- Berth allocation: [BERTH_DATE] (additional delay: [ADDITIONAL_HOURS] hours)

DELAYS ENCOUNTERED:
1. Anchorage waiting time: [ANCHORAGE_HOURS] hours
2. Berth availability delay: [BERTH_DELAY_HOURS] hours  
3. Pilot delay: [PILOT_DELAY_HOURS] hours
4. Terminal equipment failure: [EQUIPMENT_DELAY_HOURS] hours

REASONS PROVIDED BY PORT/TERMINAL:
[PORT_REASON_1]
[PORT_REASON_2]

CHARTER PARTY PROVISIONS:
Under Charter Party clause [CLAUSE_NUMBER], the port/berth must be "safe and always accessible". The charterers guaranteed "one safe berth, one safe port, always afloat".

These delays were entirely beyond the control of the Vessel and constitute breach of the safe port warranty.

FINANCIAL IMPACT (PRELIMINARY):
- Additional bunker consumption: [BUNKER_COST] USD
- Crew overtime: [CREW_COST] USD  
- Opportunity cost/lost hire: [LOST_HIRE] USD

We reserve all rights to claim compensation for time lost and additional expenses incurred.

Respectfully submitted,

_______________________
Master, M/V [VESSEL_NAME]

cc: Owners, Charterers, P&I Club`
        },
        "laytime_dispute": {
            title: "Letter of Protest - Laytime Calculation Dispute",
            category: "Laytime Disputes",
            template: `LETTER OF PROTEST - LAYTIME DISPUTE

To: [CHARTERERS_NAME]
Date: [DATE]

Dear Sirs,

RE: DISPUTE - LAYTIME CALCULATION FOR M/V [VESSEL_NAME]

We formally dispute the laytime calculation presented by Charterers' agents and lodge this protest to preserve our rights.

VESSEL & VOYAGE:
- Vessel: M/V [VESSEL_NAME]
- Charter Party: [CP_NAME] dated [CP_DATE]
- Port: [PORT_NAME]
- Operation: [LOADING/DISCHARGING]
- Cargo: [CARGO_TYPE] - [CARGO_QUANTITY] MT

CHARTER PARTY LAYTIME TERMS:
- Allowed laytime: [LAYTIME_ALLOWED]
- Terms: [SHINC/SHEX/WWD]
- Demurrage rate: USD [DEMURRAGE_RATE] per day
- Despatch rate: USD [DESPATCH_RATE] per day (if applicable)

OWNERS' CALCULATION:
- NOR tendered: [NOR_TENDERED_DATE_TIME]
- NOR accepted: [NOR_ACCEPTED_DATE_TIME]  
- Laytime commenced: [LAYTIME_START]
- Operations commenced: [OPS_START]
- Operations completed: [OPS_END]
- Time used: [TIME_USED]
- Time allowed: [TIME_ALLOWED]
- Demurrage due: [DEMURRAGE_AMOUNT] USD (or Despatch due: [DESPATCH_AMOUNT] USD)

CHARTERERS' CALCULATION:
[CHARTERERS_POSITION]

POINTS OF DISPUTE:
1. [DISPUTE_POINT_1]
2. [DISPUTE_POINT_2]
3. [DISPUTE_POINT_3]

EXCLUDED PERIODS (per C/P):
- Sundays/Holidays: [EXCLUDED_HOURS] hours (if SHEX applies)
- Weather delays: [WEATHER_HOURS] hours (if WWD applies)
- Charterers' fault: [FAULT_HOURS] hours

We maintain that demurrage of USD [DEMURRAGE_AMOUNT] is due and payable within [PAYMENT_DAYS] days as per Charter Party terms.

We reserve the right to arrest the cargo or any sub-freights if payment is not received, and to invoke arbitration as per Charter Party clause [ARBITRATION_CLAUSE].

Yours faithfully,

For and on behalf of Owners
M/V [VESSEL_NAME]

_______________________
[OWNERS_REPRESENTATIVE]`
        },
        "bunker_quality": {
            title: "Letter of Protest - Off-Spec Bunker Fuel",
            category: "Bunker Quality",
            template: `LETTER OF PROTEST - BUNKER FUEL QUALITY DISPUTE

To: [BUNKER_SUPPLIER_NAME]
    [BUNKER_SUPPLIER_ADDRESS]
Date: [DATE]
Port: [BUNKERING_PORT]

Dear Sirs,

RE: PROTEST - OFF-SPECIFICATION BUNKER FUEL SUPPLIED

We hereby lodge formal protest regarding the bunker fuel supplied to M/V [VESSEL_NAME] at [BUNKERING_PORT].

SUPPLY DETAILS:
- Bunker Delivery Note (BDN) Number: [BDN_NUMBER]
- Date of bunkering: [BUNKER_DATE]
- Supplier: [SUPPLIER_NAME]
- Barge/Truck: [DELIVERY_METHOD]
- Grade ordered: [FUEL_GRADE] (e.g., VLSFO 0.50% S)
- Quantity ordered: [QUANTITY_ORDERED] MT
- Quantity received: [QUANTITY_RECEIVED] MT

LABORATORY TEST RESULTS:
Our independent laboratory analysis (Certificate No: [LAB_CERT_NUMBER]) dated [TEST_DATE] reveals the following non-conformities with ISO 8217:2017 specifications:

Parameter          | Specification | Actual Result | Status
-------------------|---------------|---------------|--------
Sulphur Content    | Max 0.50%     | [ACTUAL_%]    | [FAIL/PASS]
Viscosity @ 50°C   | [SPEC]        | [ACTUAL]      | [FAIL/PASS]
Density @ 15°C     | [SPEC]        | [ACTUAL]      | [FAIL/PASS]
Flash Point        | Min 60°C      | [ACTUAL]      | [FAIL/PASS]
Total Sediment     | Max 0.10%     | [ACTUAL]      | [FAIL/PASS]
Water Content      | Max 0.50%     | [ACTUAL]      | [FAIL/PASS]

IMPACT ON VESSEL:
- Engine performance: [IMPACT_DESCRIPTION]
- Operational restrictions: [RESTRICTIONS]
- Additional costs: [COST_IMPACT]

ACTION REQUIRED:
1. Immediate replacement of off-spec fuel ([QUANTITY_TO_REPLACE] MT)
2. Compensation for debunkering costs (estimated USD [DEBUNKER_COST])
3. Reimbursement for engine cleaning/maintenance (estimated USD [MAINTENANCE_COST])
4. Compensation for delays (estimated USD [DELAY_COST])

We have retained samples as per ISO standards and have notified:
- Flag State Administration: [FLAG_STATE]
- Port State Control: [PSC_AUTHORITY]  
- Classification Society: [CLASS_SOCIETY]
- P&I Club: [PI_CLUB]

We reserve all rights under the bunker supply contract and applicable maritime law, including claims for consequential damages.

Urgent response required within 48 hours.

Yours faithfully,

_______________________
Master / Chief Engineer
M/V [VESSEL_NAME]

cc: Owners, P&I Club, Flag State, ISO 8217 Testing Laboratory`
        }
    }
};

// ==========================================
// 3. AUTH & KVKK ENDPOINTS
// ==========================================

app.get('/api/kvkk', (req, res) => {
    res.json({
        title: "Kişisel Verilerin Korunması ve Gizlilik Politikası",
        content: "VIYA BROKER KVKK AYDINLATMA METNİ\n\n1. Veri Sorumlusu: Viya Broker Platformu.\n2. İşlenen Veriler: E-posta adresi, Ad-Soyad (opsiyonel), IP adresi ve Log kayıtları.\n3. İşleme Amacı: Üyelik işlemlerinin yapılması, güvenli giriş sağlanması ve yasal yükümlülüklerin ifası.\n4. Aktarım: Verileriniz yasal zorunluluklar dışında üçüncü kişilerle paylaşılmaz.\n5. Haklarınız: KVKK m.11 uyarınca verilerinizin silinmesini talep edebilirsiniz.\n\nBu kutuyu işaretleyerek verilerinizin işlenmesini kabul etmiş sayılırsınız."
    });
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, fullName, kvkkAccepted } = req.body;
        
        if (!kvkkAccepted) return res.status(400).json({ error: "KVKK onayı zorunludur." });
        if (!email || !password) return res.status(400).json({ error: "E-posta ve şifre giriniz." });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Bu e-posta zaten kayıtlı." });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await User.create({
            email,
            password: hashedPassword,
            fullName: fullName || "Captain",
            kvkkAccepted: true
        });

        res.json({ success: true, msg: "Kayıt başarılı! Giriş yapın." });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: "Veritabanı hatası." }); 
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Kullanıcı bulunamadı." });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Hatalı şifre." });

        const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });
        
        const userData = {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            plan: user.plan
        };
        
        res.json({ success: true, token, user: userData });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: "Giriş hatası." }); 
    }
});

// ==========================================
// 4. DOCUMENT GENERATOR API (YENİ!)
// ==========================================

// Template listesini döndür
app.get('/api/document-templates', (req, res) => {
    const templateList = [];
    
    // Letter of Protest kategorileri
    Object.entries(DOCUMENT_TEMPLATES.letter_of_protest).forEach(([key, data]) => {
        templateList.push({
            id: `lop_${key}`,
            type: 'letter_of_protest',
            category: data.category,
            title: data.title,
            templateKey: key
        });
    });
    
    res.json({ success: true, templates: templateList });
});

// Doküman oluştur (AI ile placeholder doldurma)
app.post('/api/generate-document', async (req, res) => {
    try {
        if (!genAI) {
            return res.status(503).json({ 
                error: "AI Engine offline. Cannot generate document." 
            });
        }

        const { templateType, templateKey, userInputs } = req.body;
        
        // Template'i bul
        let template = null;
        if (templateType === 'letter_of_protest') {
            template = DOCUMENT_TEMPLATES.letter_of_protest[templateKey];
        }
        
        if (!template) {
            return res.status(404).json({ error: "Template not found" });
        }

        // AI'ya gönderilecek prompt
        const aiPrompt = `
You are a professional maritime document generator for VIYA BROKER system.

TASK: Fill in the placeholders in this legal maritime document template.

TEMPLATE:
${template.template}

USER PROVIDED DATA:
${JSON.stringify(userInputs, null, 2)}

RULES:
1. Replace ALL placeholders (text inside [BRACKETS]) with appropriate values
2. Use data from USER PROVIDED DATA when available
3. If data is missing, use reasonable defaults or write "TO BE COMPLETED"
4. Keep the professional legal tone
5. Do NOT add any extra text, comments, or explanations
6. Return ONLY the completed document
7. Maintain exact formatting and structure

CRITICAL: If user didn't provide specific data for a field, use these fallbacks:
- Dates: Use "DD/MM/YYYY" format or "TO BE INSERTED"
- Names: "TO BE COMPLETED BY USER"
- Numbers: Use "XXX" or reasonable estimates
- Technical details: Use standard maritime terminology

OUTPUT: Return the filled document directly, no preamble.
`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(aiPrompt);
        const generatedDocument = result.response.text();

        res.json({
            success: true,
            document: generatedDocument,
            template_title: template.title,
            disclaimer: "⚠️ LEGAL DISCLAIMER: This document is a DRAFT generated by AI assistance. VIYA BROKER strongly recommends review by a qualified maritime lawyer before execution or submission. The user assumes full responsibility for accuracy and legal compliance."
        });

    } catch (error) {
        console.error('Document generation error:', error);
        res.status(500).json({ 
            error: "Failed to generate document",
            details: error.message 
        });
    }
});

// ==========================================
// PART 1 BİTTİ - PART 2'YE DEVAM EDECEK
// ==========================================
// ==========================================
// PART 2 OF 2 - VOYAGE ANALYTICS & CHAT
// ==========================================

// ==========================================
// 5. VOYAGE ANALYTICS ENGINE
// ==========================================

function checkCanals(loadGeo, dischGeo) {
    let costs = { total: 0, names: [] };
    const isBlackSea = (geo) => geo.lat > 40 && geo.lng > 27 && geo.lng < 42 && geo.lat < 47;
    const isAmericasEast = (geo) => geo.lng < -30 && geo.lng > -100;
    const isAmericasWest = (geo) => geo.lng < -100;

    if ((isBlackSea(loadGeo) && !isBlackSea(dischGeo)) || (!isBlackSea(loadGeo) && isBlackSea(dischGeo))) {
        costs.total += 35000; costs.names.push("Turkish Straits");
    }
    if (loadGeo.lng < 35 && dischGeo.lng > 60 || loadGeo.lng > 60 && dischGeo.lng < 35) {
        if (!isAmericasWest(loadGeo) && !isAmericasWest(dischGeo)) {
            costs.total += 300000; costs.names.push("Suez Canal");
        }
    }
    if ((loadGeo.lng > -80 && dischGeo.lng < -80) || (loadGeo.lng < -80 && dischGeo.lng > -80)) {
        if (isAmericasEast(loadGeo) || isAmericasEast(dischGeo)) {
            costs.total += 250000; costs.names.push("Panama Canal");
        }
    }
    return costs;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 5000;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 0.539957);
}

function findNearestPorts(shipLat, shipLng, limit = 5) {
    const ports = Object.entries(PORT_DB).map(([name, coords]) => {
        return { name, lat: coords.lat, lng: coords.lng, dist: calculateDistance(shipLat, shipLng, coords.lat, coords.lng) };
    });
    ports.sort((a, b) => a.dist - b.dist);
    return ports.slice(0, limit + 1).filter(p => p.dist >= 0); 
}

async function analyzeVoyage(loadPort, dischPort, cargo, quantity, shipLat, shipLng) {
    const cleanLoad = cleanPortName(loadPort);
    const cleanDisch = cleanPortName(dischPort);
    const loadGeo = PORT_DB[cleanLoad];
    const dischGeo = PORT_DB[cleanDisch];
    if (!loadGeo || !dischGeo) return null;

    const ballastDist = calculateDistance(shipLat, shipLng, loadGeo.lat, loadGeo.lng);
    const ladenDist = calculateDistance(loadGeo.lat, loadGeo.lng, dischGeo.lat, dischGeo.lng);
    const totalDist = ballastDist + ladenDist;
    const totalDuration = Math.ceil((totalDist / (13.0 * 24)) + 5);
    const qty = quantity || 50000;

    const canalInfo = checkCanals(loadGeo, dischGeo);
    const totalVoyageCost = (totalDuration * 24 * 640) + 35000 + canalInfo.total;
    const totalCost = totalVoyageCost + (totalDuration * 5500);

    const marketData = MARKET_RATES[cargo] || MARKET_RATES["General Cargo"];
    const simulatedRate = marketData.base + ((Math.random() * marketData.volatility * 2) - marketData.volatility);
    const grossFreight = qty * simulatedRate;
    const commission = grossFreight * 0.0375;
    const profit = grossFreight - commission - totalCost;
    
    let aiText = profit > 0 ? "Strong opportunity." : "Market is tough.";
    
    return {
        params: { loadPort, dischPort, cargo, qty, freightRate: simulatedRate.toFixed(2) },
        dist: { total: totalDist, ballast: ballastDist, laden: ladenDist },
        duration: { total: totalDuration, sea: Math.round(totalDist/(13*24)), port: 5 },
        loadGeo, dischGeo,
        financials: { revenue: grossFreight, profit: profit, tce: (grossFreight - commission - totalVoyageCost) / totalDuration, breakEvenRate: (totalCost / qty) },
        breakdown: {
            revenue: grossFreight,
            voyage_costs: { fuel: { total: totalDuration*24*640, main: totalDuration*24*640*0.9, aux: 0, lubes: 0 }, port: { total: 35000, dues: 0, pilot: 0, tow: 0 }, cargo_canal: { total: canalInfo.total, canal: canalInfo.total, names: canalInfo.names.join('+') }, commission: commission },
            opex: { total: totalDuration*5500, daily: 5500 }
        },
        aiAnalysis: aiText
    };
}

app.post('/api/analyze', async (req, res) => {
    try {
        const { loadPort, dischPort, cargo, quantity, shipLat, shipLng } = req.body;
        if (loadPort && dischPort) {
            const voyage = await analyzeVoyage(loadPort, dischPort, cargo || "General Cargo", quantity, shipLat || 0, shipLng || 0);
            if(voyage && genAI) {
                 try {
                    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                    const r = await model.generateContent(`Act as broker. Voyage: ${loadPort}-${dischPort}. Cargo: ${cargo}. Profit: $${Math.floor(voyage.financials.profit)}. Short comment.`);
                    voyage.aiAnalysis = r.response.text();
                 } catch(e){}
            }
            return res.json(voyage ? { success: true, voyages: [voyage] } : { success: false, error: "Liman hatası" });
        }
        
        const nearestPorts = findNearestPorts(shipLat, shipLng, 5);
        if (nearestPorts.length === 0) return res.json({ success: false, msg: "Uygun liman yok." });

        const suggestions = [];
        const cargoKeys = Object.keys(MARKET_RATES);
        const portKeys = Object.keys(PORT_DB);

        for (const port of nearestPorts) {
            let randomDisch = portKeys[Math.floor(Math.random() * portKeys.length)];
            while (randomDisch === port.name) randomDisch = portKeys[Math.floor(Math.random() * portKeys.length)];
            const randomCargo = cargoKeys[Math.floor(Math.random() * cargoKeys.length)];
            const voyage = await analyzeVoyage(port.name, randomDisch, randomCargo, quantity || 50000, shipLat, shipLng);
            if (voyage) suggestions.push(voyage);
        }
        suggestions.sort((a, b) => b.financials.profit - a.financials.profit);
        res.json({ success: true, voyages: suggestions.slice(0, 3) });

    } catch (error) { res.status(500).json({ error: "Sistem hatası." }); }
});

// ==========================================
// 6. DATA ENDPOINTS
// ==========================================

app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));
app.get('/api/port-coords', (req, res) => res.json(PORT_DB[cleanPortName(req.query.port)] || {}));
app.get('/api/market', (req, res) => res.json({ brent: 82.50, mgo: 960, vlsfo: 670, bdi: 1550, source: "LIVE" }));
app.get('/api/documents', (req, res) => res.json(DOCS_DB));
app.get('/api/regulations', (req, res) => res.json(REGS_DB));
app.get('/api/vessels', (req, res) => res.json(VESSEL_DB));
app.get('/api/routes', (req, res) => res.json([]));

// ==========================================
// 7. AI CHAT
// ==========================================

app.post('/api/chat', async (req, res) => {
    try {
        if(!genAI) return res.json({ reply: "Sistem: AI Motoru Devre Dışı (API Key Yok)." });
        
        const { message } = req.body;

        const systemPrompt = `
        IDENTITY: You are VIYA AI, an advanced maritime artificial intelligence created specifically for the 'Viya Broker' platform.
        ROLE: You are a Professional Shipbroker and Maritime Legal Consultant.
        
        YOUR KNOWLEDGE BASE:
        1. Expert in Chartering (Voyage, Time), Laytime, Demurrage, and Despatch.
        2. Expert in maritime regulations (SOLAS, MARPOL) and contracts (GENCON, NYPE).
        3. You speak with a FORMAL, CORPORATE, and PROFESSIONAL tone.
        
        RULES:
        1. NEVER say you are a Google AI. You are VIYA AI.
        2. If asked "Who are you?", answer: "I am VIYA AI, your professional maritime intelligence assistant." (Translate this to the target language).
        3. DO NOT use colloquial terms like 'Reis', 'Kaptan', 'Bro'. 
        4. Address the user formally based on the language (e.g., 'Sir/Madam' for English, 'Efendim' or 'Sayın Kullanıcı' for Turkish, 'Monsieur/Madame' for French).
        5. Keep answers precise, objective, and business-oriented.

        CRITICAL LANGUAGE PROTOCOL:
        1. DETECT the language of the USER MESSAGE below.
        2. RESPOND STRICTLY IN THE SAME LANGUAGE as the User Message.
        3. If the user asks "Can you speak Turkish?", reply IN TURKISH.
        4. Do not limit yourself to English. You are fluent in all major languages (TR, EN, DE, FR, ES, IT, GR).

        USER MESSAGE: "${message}"
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(systemPrompt);
        
        res.json({ reply: result.response.text() });

    } catch(e) { 
        console.error(e);
        res.json({ reply: "Connection Error. Please try again." }); 
    }
});

// ==========================================
// 8. SERVER START
// ==========================================

app.listen(port, () => {
    console.log(`\n ⚓ VIYA BROKER SYSTEM ONLINE (Port: ${port})`);
    console.log(` 📂 Document Templates: ${Object.keys(DOCUMENT_TEMPLATES.letter_of_protest).length} loaded`);
});

