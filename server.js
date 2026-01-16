// server.js
// VIYA BROKER - PLATINUM EDITION (V18.1 - COMPLETE MERGE)
// Status: DATABASE + AI + MARKETPLACE + REAL-TIME MESSAGING + VIDEO CALL READY
// All V17 features preserved + V18 Marketplace/Messaging added

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
import { Server } from 'socket.io';
import http from 'http';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 10000;

// HTTP SERVER + SOCKET.IO (V18 YENİ)
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

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

// --- MONGODB SCHEMAS ---

// USER SCHEMA (V17)
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, default: "Captain" },
    role: { type: String, default: "user" },
    plan: { type: String, default: "FREE" },
    createdAt: { type: Date, default: Date.now },
    kvkkAccepted: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});
const User = mongoose.model('User', userSchema);

// VESSEL LISTING SCHEMA (V18 YENİ - MARKETPLACE)
const vesselListingSchema = new mongoose.Schema({
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerName: { type: String, required: true },
    sellerEmail: { type: String, required: true },
    vesselName: { type: String, required: true },
    vesselType: { type: String, required: true },
    dwt: { type: Number, required: true },
    yearBuilt: { type: Number, required: true },
    flag: { type: String, required: true },
    imoNumber: { type: String },
    classification: { type: String },
    price: { type: Number, required: true },
    priceType: { type: String, enum: ['SALE', 'TIME_CHARTER', 'VOYAGE_CHARTER'], default: 'SALE' },
    charterDuration: { type: String }, // For charter listings
    images: [{ type: String }], // Base64 images (max 4)
    description: { type: String },
    specifications: {
        loa: Number,
        beam: Number,
        draft: Number,
        engine: String,
        horsePower: Number,
        fuelConsumption: String,
        speed: Number,
        holds: Number,
        cranes: Number
    },
    currentLocation: { type: String },
    status: { type: String, enum: ['ACTIVE', 'SOLD', 'UNDER_NEGOTIATION', 'CHARTERED'], default: 'ACTIVE' },
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const VesselListing = mongoose.model('VesselListing', vesselListingSchema);

// MESSAGE SCHEMA (V18 YENİ - MESSAGING)
const messageSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromName: { type: String, required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toName: { type: String, required: true },
    vesselListing: { type: mongoose.Schema.Types.ObjectId, ref: 'VesselListing' },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// VIDEO ROOM SCHEMA (V18.1 YENİ - VIDEO CALL)
const videoRoomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    vesselListing: { type: mongoose.Schema.Types.ObjectId, ref: 'VesselListing' },
    status: { type: String, enum: ['WAITING', 'ACTIVE', 'ENDED'], default: 'WAITING' },
    createdAt: { type: Date, default: Date.now }
});
const VideoRoom = mongoose.model('VideoRoom', videoRoomSchema);

// AI SETUP
const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
let genAI = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log(" ✅ [SYSTEM] AI Engine: ONLINE");
    console.log(" ✅ [SYSTEM] Document Generator: READY");
}

// ==========================================
// NODEMAILER SETUP (OTP EMAIL SYSTEM)
// ==========================================

// Debug log
console.log('📧 Mail Gönderiliyor -> Kullanıcı:', process.env.EMAIL_USER, 'Host: smtp.titan.email');

// Titan Email transporter (kullanıcı .env dosyasına kendi bilgilerini ekleyecek)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// OTP storage (production'da Redis kullanılabilir)
const otpStore = new Map(); // { email: { otp, userData, expiresAt } }

// 6 haneli OTP üretici fonksiyon
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// OTP email gönderme fonksiyonu
async function sendOTPEmail(email, otp) {
    const mailOptions = {
        from: `"Viya System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '✅ VIYA BROKER - Email Doğrulama Kodu',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #0066FF; margin-bottom: 10px;">VIYA BROKER</h1>
                    <p style="color: #6B7280;">Global Maritime Intelligence Platform</p>
                </div>
                <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h2 style="color: #111827; margin-bottom: 20px;">Email Doğrulama</h2>
                    <p style="color: #4B5563; margin-bottom: 20px;">VIYA BROKER platformuna hoş geldiniz! Hesabınızı oluşturmak için aşağıdaki doğrulama kodunu kullanın:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="display: inline-block; background: #E6F0FF; padding: 20px 40px; border-radius: 10px; font-size: 32px; font-weight: bold; color: #0066FF; letter-spacing: 8px;">
                            ${otp}
                        </div>
                    </div>
                    <p style="color: #9CA3AF; font-size: 14px; margin-top: 20px;">⏰ Bu kod 10 dakika içinde geçerliliğini yitirecektir.</p>
                    <p style="color: #9CA3AF; font-size: 14px;">🔒 Bu kodu kimseyle paylaşmayın.</p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #9CA3AF; font-size: 12px;">
                    <p>© 2026 VIYA BROKER. Tüm hakları saklıdır.</p>
                    <p>Bu mail otomatik olarak gönderilmiştir.</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(` 📧 [OTP] Email sent to: ${email}`);
        return true;
    } catch (error) {
        console.error(' ❌ [OTP] Email send error:', error);
        return false;
    }
}

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(express.json({ limit: '10mb' })); // Fotoğraflar için limit artırıldı
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 1. DATA LOADERS (V17 KORUNDU)
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
    PORT_DB["SINGAPORE"] = {lat: 1.3521, lng: 103.8198};
    PORT_DB["HOUSTON"] = {lat: 29.7604, lng: -95.3698};
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
// 2. LIVE MARKET DATA (V18.1 YENİ - ÜCRETSİZ API)
// ==========================================

let cachedMarketData = {
    brent: 82.50,
    wti: 78.20,
    vlsfo: 670,
    mgo: 960,
    bdi: 1550,
    lastUpdate: null,
    source: "INITIALIZING"
};

// Ücretsiz API'lerden veri çekme fonksiyonu
async function fetchLiveMarketData() {
    try {
        // Birden fazla ücretsiz kaynak deneyelim
        const sources = [
            fetchFromExchangeRateAPI,
            fetchFromCoinGecko, // Commodities proxy olarak
        ];
        
        for (const fetchFn of sources) {
            try {
                const data = await fetchFn();
                if (data) {
                    cachedMarketData = { ...cachedMarketData, ...data, lastUpdate: new Date(), source: "LIVE" };
                    console.log(" 📈 [MARKET] Live data updated:", cachedMarketData.source);
                    return;
                }
            } catch (e) {
                continue;
            }
        }
        
        // Hiçbir API çalışmazsa simüle et
        simulateMarketData();
        
    } catch (error) {
        console.error(" ⚠️ [MARKET] API Error, using simulation:", error.message);
        simulateMarketData();
    }
}

async function fetchFromExchangeRateAPI() {
    // Brent yaklaşık değeri için EUR/USD üzerinden hesaplama
    // Gerçek projede paid API kullanılacak
    return null;
}

async function fetchFromCoinGecko() {
    // Commodities için alternatif
    return null;
}

function simulateMarketData() {
    // Gerçekçi piyasa simülasyonu (günlük %1-2 dalgalanma)
    const fluctuate = (base, percent) => {
        const change = base * (percent / 100) * (Math.random() * 2 - 1);
        return Math.round((base + change) * 100) / 100;
    };
    
    cachedMarketData = {
        brent: fluctuate(82.50, 2),
        wti: fluctuate(78.20, 2),
        vlsfo: fluctuate(670, 1.5),
        mgo: fluctuate(960, 1.5),
        bdi: Math.round(fluctuate(1550, 3)),
        lastUpdate: new Date(),
        source: "SIMULATED"
    };
}

// Her 5 dakikada bir güncelle
setInterval(fetchLiveMarketData, 5 * 60 * 1000);
// Başlangıçta bir kez çalıştır
setTimeout(fetchLiveMarketData, 3000);

// ==========================================
// 3. DOCUMENT TEMPLATES DATABASE (V17 KORUNDU)
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
// 4. AUTH & KVKK ENDPOINTS (V17 KORUNDU)
// ==========================================

app.get('/api/kvkk', (req, res) => {
    res.json({
        title: "Kişisel Verilerin Korunması ve Gizlilik Politikası",
        content: `VIYA BROKER KVKK AYDINLATMA METNİ

1. Veri Sorumlusu: Viya Broker Platformu.

2. İşlenen Veriler: 
   - E-posta adresi
   - Ad-Soyad (opsiyonel)
   - IP adresi ve Log kayıtları
   - Gemi ilan bilgileri (satıcılar için)

3. İşleme Amacı:
   - Üyelik işlemlerinin yapılması
   - Güvenli giriş sağlanması
   - Gemi alım-satım/kiralama işlemlerinin yürütülmesi
   - Yasal yükümlülüklerin ifası

4. Aktarım:
   Verileriniz yasal zorunluluklar dışında üçüncü kişilerle paylaşılmaz.

5. Haklarınız:
   KVKK m.11 uyarınca verilerinizin silinmesini talep edebilirsiniz.

6. İletişim:
   info@viyabroker.com

Bu kutuyu işaretleyerek verilerinizin işlenmesini kabul etmiş sayılırsınız.`
    });
});

// Maritime News API - RSS Feed'den haber çek
app.get('/api/maritime-news', async (req, res) => {
    try {
        const Parser = (await import('rss-parser')).default;
        const parser = new Parser();
        
        const feeds = [
            'https://www.hellenicshippingnews.com/feed/',
            'https://gcaptain.com/feed/',
            'https://splash247.com/feed/'
        ];
        
        let allNews = [];
        
        for (const feedUrl of feeds) {
            try {
                const feed = await parser.parseURL(feedUrl);
                const news = feed.items.slice(0, 5).map(item => ({
                    title: item.title,
                    link: item.link,
                    date: item.pubDate || item.isoDate,
                    source: feed.title,
                    snippet: item.contentSnippet ? item.contentSnippet.substring(0, 150) + '...' : ''
                }));
                allNews = allNews.concat(news);
            } catch (e) {
                console.log('Feed error:', feedUrl);
            }
        }
        
        // Tarihe göre sırala (en yeni önce)
        allNews.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.json({ success: true, news: allNews.slice(0, 15) });
        
    } catch (error) {
        console.error('News fetch error:', error);
        res.json({ success: false, news: [], error: 'Haberler yüklenemedi' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, fullName, kvkkAccepted } = req.body;
        
        if (!kvkkAccepted) return res.status(400).json({ error: "KVKK onayı zorunludur." });
        if (!email || !password) return res.status(400).json({ error: "E-posta ve şifre giriniz." });
        if (password.length < 6) return res.status(400).json({ error: "Şifre en az 6 karakter olmalı." });

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ error: "Geçerli bir e-posta adresi giriniz." });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Bu e-posta zaten kayıtlı." });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 dakika

        // Store OTP and user data temporarily
        otpStore.set(email, {
            otp,
            userData: {
                email,
                password: hashedPassword,
                fullName: fullName || "Captain",
                kvkkAccepted: true
            },
            expiresAt
        });

        // Send OTP email
        const emailSent = await sendOTPEmail(email, otp);

        if (!emailSent) {
            otpStore.delete(email);
            return res.status(500).json({ error: "Email gönderilemedi. Lütfen tekrar deneyin." });
        }

        console.log(` ✅ [OTP] Generated for ${email}: ${otp} (expires in 10 min)`);

        res.json({ 
            success: true, 
            requiresOTP: true,
            email: email,
            message: "Doğrulama kodu e-posta adresinize gönderildi!" 
        });

    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: "Sistem hatası. Lütfen tekrar deneyin." }); 
    }
});

// OTP Doğrulama Endpoint'i
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: "E-posta ve OTP kodu gerekli." });
        }

        // OTP store'dan kontrol et
        const otpData = otpStore.get(email);

        if (!otpData) {
            return res.status(400).json({ error: "Doğrulama kodu bulunamadı veya süresi dolmuş." });
        }

        // Süre kontrolü
        if (Date.now() > otpData.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ error: "Doğrulama kodunun süresi dolmuş. Lütfen tekrar kayıt olun." });
        }

        // OTP kontrolü
        if (otpData.otp !== otp.trim()) {
            return res.status(400).json({ error: "Hatalı doğrulama kodu." });
        }

        // OTP doğru, kullanıcıyı veritabanına kaydet
        const newUser = await User.create(otpData.userData);

        // OTP'yi temizle
        otpStore.delete(email);

        // Token oluştur
        const token = jwt.sign({ id: newUser._id, email: newUser.email }, SECRET_KEY, { expiresIn: '24h' });

        const userData = {
            id: newUser._id,
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role,
            plan: newUser.plan
        };

        console.log(` ✅ [AUTH] User verified and registered: ${email}`);

        res.json({ 
            success: true, 
            token, 
            user: userData,
            message: "Hesabınız başarıyla oluşturuldu!" 
        });

    } catch (e) {
        console.error(' ❌ [OTP] Verification error:', e);
        res.status(500).json({ error: "Doğrulama hatası. Lütfen tekrar deneyin." });
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

// Şifremi Unuttum - Link Gönder
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        
        // Güvenlik: Kullanıcı bulunamasa bile aynı mesajı ver
        if (!user) {
            return res.json({ success: true }); 
        }
        
        // Token oluştur (32 karakter hex)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = Date.now() + 15 * 60 * 1000; // 15 dakika geçerli
        
        // Kullanıcıya kaydet
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetExpires;
        await user.save();
        
        // Mail gönder
        const resetUrl = `${process.env.FRONTEND_URL || 'https://viya-broker.onrender.com'}?reset=${resetToken}`;
        
        await transporter.sendMail({
            from: `"VIYA BROKER" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Şifre Sıfırlama - VIYA BROKER',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #0066FF; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">VIYA BROKER</h1>
                    </div>
                    <div style="padding: 30px; background: #f9f9f9;">
                        <h2 style="color: #333;">Şifre Sıfırlama Talebi</h2>
                        <p style="color: #666;">Merhaba,</p>
                        <p style="color: #666;">Hesabınız için şifre sıfırlama talebinde bulunuldu. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="background: #0066FF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Şifremi Sıfırla</a>
                        </div>
                        <p style="color: #999; font-size: 14px;">Bu link 15 dakika geçerlidir.</p>
                        <p style="color: #999; font-size: 14px;">Eğer bu talebi siz yapmadıysanız, bu maili görmezden gelebilirsiniz.</p>
                    </div>
                    <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                        © 2026 VIYA BROKER. All rights reserved.
                    </div>
                </div>
            `
        });
        
        console.log('✅ Password reset email sent to:', email);
        res.json({ success: true });
        
    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.json({ success: false, error: 'Bir hata oluştu' });
    }
});

// Şifre Sıfırlama
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.json({ success: false, error: 'Geçersiz veya süresi dolmuş link' });
        }
        
        // Yeni şifreyi hashle
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        console.log('✅ Password reset successful for:', user.email);
        res.json({ success: true });
        
    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.json({ success: false, error: 'Bir hata oluştu' });
    }
});

// Contact Form
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        if (!name || !email || !message) {
            return res.json({ success: false, error: 'Tüm alanlar zorunlu' });
        }
        
        // info@viyabroker.com'a mail gönder
        await transporter.sendMail({
            from: `"VIYA BROKER Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.CONTACT_EMAIL || 'info@viyabroker.com',
            replyTo: email,
            subject: `[Contact Form] ${subject || 'Genel Soru'} - ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #0066FF, #0052CC); padding: 24px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Yeni İletişim Formu</h1>
                    </div>
                    <div style="padding: 32px; background: #ffffff;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; width: 120px;">İsim:</td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 600;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Email:</td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 600;"><a href="mailto:${email}" style="color: #0066FF;">${email}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Konu:</td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 600;">${subject || 'Genel Soru'}</td>
                            </tr>
                        </table>
                        <div style="margin-top: 24px;">
                            <p style="color: #6b7280; margin-bottom: 8px; font-size: 14px;">Mesaj:</p>
                            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #0066FF;">
                                <p style="color: #374151; margin: 0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
                            </div>
                        </div>
                    </div>
                    <div style="padding: 20px; background: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">Bu mail VIYA BROKER iletişim formundan gönderildi.</p>
                    </div>
                </div>
            `
        });
        
        console.log('✅ Contact form email sent from:', email);
        res.json({ success: true });
        
    } catch (error) {
        console.error('❌ Contact form error:', error);
        res.json({ success: false, error: 'Mail gönderilemedi' });
    }
});

// ==========================================
// 5. MARKETPLACE ENDPOINTS (V18 YENİ)
// ==========================================

// Tüm ilanları listele (filtreleme destekli)
app.get('/api/marketplace/listings', async (req, res) => {
    try {
        const { type, priceType, minDwt, maxDwt, minYear, maxYear, flag, status } = req.query;
        
        let filter = {};
        if (type) filter.vesselType = type;
        if (priceType) filter.priceType = priceType;
        if (minDwt) filter.dwt = { ...filter.dwt, $gte: parseInt(minDwt) };
        if (maxDwt) filter.dwt = { ...filter.dwt, $lte: parseInt(maxDwt) };
        if (minYear) filter.yearBuilt = { ...filter.yearBuilt, $gte: parseInt(minYear) };
        if (maxYear) filter.yearBuilt = { ...filter.yearBuilt, $lte: parseInt(maxYear) };
        if (flag) filter.flag = flag;
        if (status) filter.status = status;
        else filter.status = 'ACTIVE';
        
        const listings = await VesselListing.find(filter)
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.json({ success: true, listings });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

// Tek ilan detayı
app.get('/api/marketplace/listing/:id', async (req, res) => {
    try {
        const listing = await VesselListing.findById(req.params.id);
        if (!listing) return res.status(404).json({ error: 'Listing not found' });
        
        // Görüntülenme sayısını artır
        listing.views += 1;
        await listing.save();
        
        res.json({ success: true, listing });
    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Yeni ilan oluştur
app.post('/api/marketplace/create-listing', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ error: 'User not found' });
        
        const listingData = {
            ...req.body,
            seller: user._id,
            sellerName: user.fullName,
            sellerEmail: user.email
        };
        
        // Maksimum 4 fotoğraf
        if (listingData.images && listingData.images.length > 4) {
            listingData.images = listingData.images.slice(0, 4);
        }
        
        const newListing = await VesselListing.create(listingData);
        res.json({ success: true, listing: newListing });
        
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create listing' });
    }
});

// İlan güncelle
app.put('/api/marketplace/listing/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, SECRET_KEY);
        const listing = await VesselListing.findById(req.params.id);
        
        if (!listing) return res.status(404).json({ error: 'Listing not found' });
        if (listing.seller.toString() !== decoded.id) {
            return res.status(403).json({ error: 'Not authorized to edit this listing' });
        }
        
        Object.assign(listing, req.body);
        listing.updatedAt = Date.now();
        await listing.save();
        
        res.json({ success: true, listing });
    } catch (e) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// İlan sil
app.delete('/api/marketplace/listing/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, SECRET_KEY);
        const listing = await VesselListing.findById(req.params.id);
        
        if (!listing) return res.status(404).json({ error: 'Listing not found' });
        if (listing.seller.toString() !== decoded.id) {
            return res.status(403).json({ error: 'Not authorized to delete this listing' });
        }
        
        await VesselListing.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Listing deleted' });
    } catch (e) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

// Kullanıcının kendi ilanları
app.get('/api/marketplace/my-listings', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, SECRET_KEY);
        const listings = await VesselListing.find({ seller: decoded.id }).sort({ createdAt: -1 });
        
        res.json({ success: true, listings });
    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ==========================================
// 6. MESSAGING ENDPOINTS (V18 YENİ)
// ==========================================

// Mesaj gönder
app.post('/api/messages/send', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ error: 'User not found' });
        
        const { toUserId, message, vesselListingId } = req.body;
        const toUser = await User.findById(toUserId);
        if (!toUser) return res.status(404).json({ error: 'Recipient not found' });
        
        const newMessage = await Message.create({
            from: user._id,
            fromName: user.fullName,
            to: toUserId,
            toName: toUser.fullName,
            message,
            vesselListing: vesselListingId || null
        });
        
        // Socket.io ile gerçek zamanlı bildirim
        io.to(toUserId).emit('new_message', newMessage);
        
        res.json({ success: true, message: newMessage });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// İki kullanıcı arasındaki sohbet
app.get('/api/messages/conversation/:userId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, SECRET_KEY);
        const otherUserId = req.params.userId;
        
        const messages = await Message.find({
            $or: [
                { from: decoded.id, to: otherUserId },
                { from: otherUserId, to: decoded.id }
            ]
        }).sort({ timestamp: 1 });
        
        // Okunmamış mesajları okundu işaretle
        await Message.updateMany(
            { from: otherUserId, to: decoded.id, read: false },
            { read: true }
        );
        
        res.json({ success: true, messages });
    } catch (e) {
        res.status(500).json({ error: 'Failed to load messages' });
    }
});

// Kullanıcının tüm sohbetleri (inbox)
app.get('/api/messages/inbox', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, SECRET_KEY);
        
        const messages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { from: new mongoose.Types.ObjectId(decoded.id) }, 
                        { to: new mongoose.Types.ObjectId(decoded.id) }
                    ]
                }
            },
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$from', new mongoose.Types.ObjectId(decoded.id)] },
                            '$to',
                            '$from'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [
                                    { $eq: ['$to', new mongoose.Types.ObjectId(decoded.id)] }, 
                                    { $eq: ['$read', false] }
                                ]},
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);
        
        res.json({ success: true, conversations: messages });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to load inbox' });
    }
});

// ==========================================
// 7. VIDEO ROOM ENDPOINTS (V18.1 YENİ)
// ==========================================

// Video odası oluştur
app.post('/api/video/create-room', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, SECRET_KEY);
        const { vesselListingId } = req.body;
        
        const roomId = `VIYA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        const room = await VideoRoom.create({
            roomId,
            createdBy: decoded.id,
            participants: [decoded.id],
            vesselListing: vesselListingId || null
        });
        
        res.json({ success: true, room });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create video room' });
    }
});

// Video odasına katıl
app.post('/api/video/join-room', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, SECRET_KEY);
        const { roomId } = req.body;
        
        const room = await VideoRoom.findOne({ roomId });
        if (!room) return res.status(404).json({ error: 'Room not found' });
        
        if (!room.participants.includes(decoded.id)) {
            room.participants.push(decoded.id);
            await room.save();
        }
        
        res.json({ success: true, room });
    } catch (e) {
        res.status(500).json({ error: 'Failed to join room' });
    }
});

// ==========================================
// 8. DOCUMENT GENERATOR API (V17 KORUNDU)
// ==========================================

// Template listesini döndür
app.get('/api/document-templates', (req, res) => {
    const templateList = [];
    
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

// AI ile doküman oluştur
app.post('/api/generate-document', async (req, res) => {
    try {
        if (!genAI) {
            return res.status(503).json({ 
                error: "AI Engine offline. Cannot generate document." 
            });
        }

        const { templateType, templateKey, userInputs } = req.body;
        
        let template = null;
        if (templateType === 'letter_of_protest') {
            template = DOCUMENT_TEMPLATES.letter_of_protest[templateKey];
        }
        
        if (!template) {
            return res.status(404).json({ error: "Template not found" });
        }

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
// 9. VOYAGE ANALYTICS ENGINE (V17 KORUNDU)
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
            voyage_costs: { 
                fuel: { total: totalDuration*24*640, main: totalDuration*24*640*0.9, aux: totalDuration*24*640*0.08, lubes: totalDuration*24*640*0.02 }, 
                port: { total: 35000, dues: 15000, pilot: 12000, tow: 8000 }, 
                cargo_canal: { total: canalInfo.total, canal: canalInfo.total, names: canalInfo.names.join('+') || 'None' }, 
                commission: commission 
            },
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
                    const r = await model.generateContent(`Act as a professional shipbroker. Analyze this voyage: ${loadPort} to ${dischPort}. Cargo: ${cargo}. Expected Profit: $${Math.floor(voyage.financials.profit)}. Give a short professional comment (2-3 sentences) about market conditions and recommendation.`);
                    voyage.aiAnalysis = r.response.text();
                 } catch(e){
                    console.error("AI Analysis error:", e);
                 }
            }
            return res.json(voyage ? { success: true, voyages: [voyage] } : { success: false, error: "Port not found in database" });
        }
        
        const nearestPorts = findNearestPorts(shipLat, shipLng, 5);
        if (nearestPorts.length === 0) return res.json({ success: false, msg: "No suitable ports found." });

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

    } catch (error) { 
        console.error(error);
        res.status(500).json({ error: "System error." }); 
    }
});

// ==========================================
// 10. DATA ENDPOINTS (V17 KORUNDU + V18.1 MARKET DATA)
// ==========================================

app.get('/api/ports', (req, res) => res.json(Object.keys(PORT_DB).sort()));
app.get('/api/port-coords', (req, res) => res.json(PORT_DB[cleanPortName(req.query.port)] || {}));

// V18.1 - Güncellenmiş market endpoint (BRENT + VLSFO + MGO)
app.get('/api/market', (req, res) => {
    res.json({
        brent: cachedMarketData.brent,
        wti: cachedMarketData.wti,
        vlsfo: cachedMarketData.vlsfo,
        mgo: cachedMarketData.mgo,
        bdi: cachedMarketData.bdi,
        lastUpdate: cachedMarketData.lastUpdate,
        source: cachedMarketData.source
    });
});

app.get('/api/documents', (req, res) => res.json(DOCS_DB));
app.get('/api/regulations', (req, res) => res.json(REGS_DB));
app.get('/api/vessels', (req, res) => res.json(VESSEL_DB));
app.get('/api/routes', (req, res) => res.json([]));

// ==========================================
// 11. AI CHAT (V17 KORUNDU)
// ==========================================

app.post('/api/chat', async (req, res) => {
    try {
        if(!genAI) return res.json({ reply: "System: AI Engine Offline (No API Key)." });
        
        const { message } = req.body;

        const systemPrompt = `
        IDENTITY: You are VIYA AI, an advanced maritime artificial intelligence created specifically for the 'Viya Broker' platform.
        ROLE: You are a Professional Shipbroker, Maritime Legal Consultant, and Ship Sale & Purchase Advisor.
        
        YOUR KNOWLEDGE BASE:
        1. Expert in Chartering (Voyage Charter, Time Charter), Laytime, Demurrage, and Despatch.
        2. Expert in maritime regulations (SOLAS, MARPOL, ISM Code) and contracts (GENCON, NYPE, BIMCO forms).
        3. Expert in Ship Sale & Purchase procedures, vessel valuation, and market conditions.
        4. You speak with a FORMAL, CORPORATE, and PROFESSIONAL tone.
        
        RULES:
        1. NEVER say you are a Google AI or any other AI. You are VIYA AI.
        2. If asked "Who are you?", answer: "I am VIYA AI, your professional maritime intelligence assistant."
        3. DO NOT use colloquial terms like 'Reis', 'Bro', 'Mate' unless the user uses them first.
        4. Address the user formally based on the detected language.
        5. Keep answers precise, objective, and business-oriented.
        6. If asked about ship prices or market values, provide general guidance but recommend professional valuation.

        CRITICAL LANGUAGE PROTOCOL:
        1. DETECT the language of the USER MESSAGE below.
        2. RESPOND STRICTLY IN THE SAME LANGUAGE as the User Message.
        3. If the user writes in Turkish, respond in Turkish.
        4. If the user writes in English, respond in English.
        5. You are fluent in: Turkish, English, German, French, Spanish, Italian, Greek.

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
// 12. SOCKET.IO EVENTS (V18 YENİ + V18.1 VIDEO CALL)
// ==========================================

io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);
    
    // Kullanıcı odasına katıl
    socket.on('join_room', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their personal room`);
    });
    
    // Mesaj gönder
    socket.on('send_message', (data) => {
        io.to(data.toUserId).emit('new_message', data);
    });
    
    // Video call - Kullanıcıyı ara
    socket.on('call_user', (data) => {
        io.to(data.toUserId).emit('incoming_call', {
            from: data.from,
            fromName: data.fromName,
            roomId: data.roomId,
            offer: data.offer
        });
    });
    
    // Video call - Aramayı cevapla
    socket.on('answer_call', (data) => {
        io.to(data.toUserId).emit('call_answered', {
            answer: data.answer
        });
    });
    
    // Video call - ICE candidate
    socket.on('ice_candidate', (data) => {
        io.to(data.toUserId).emit('ice_candidate', {
            candidate: data.candidate
        });
    });
    
    // Video call - Aramayı sonlandır
    socket.on('end_call', (data) => {
        io.to(data.toUserId).emit('call_ended', {
            from: data.from
        });
    });
    
    // Video room - Odaya katıl
    socket.on('join_video_room', (data) => {
        socket.join(data.roomId);
        socket.to(data.roomId).emit('user_joined_room', {
            odaId: data.roomId,
            userName: data.userName
        });
        console.log(`User ${data.userName} joined video room ${data.roomId}`);
    });
    
    // Video room - Odadan ayrıl
    socket.on('leave_video_room', (data) => {
        socket.leave(data.roomId);
        socket.to(data.roomId).emit('user_left_room', {
            roomId: data.roomId,
            userName: data.userName
        });
    });
    
    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
    });
});

// ==========================================
// 13. SERVER START
// ==========================================

server.listen(port, () => {
    console.log(`\n ⚓ VIYA BROKER SYSTEM V18.1 ONLINE (Port: ${port})`);
    console.log(` 📂 Document Templates: ${Object.keys(DOCUMENT_TEMPLATES.letter_of_protest).length} loaded`);
    console.log(` 🌍 Ports Database: ${Object.keys(PORT_DB).length} ports`);
    console.log(` 🚢 Marketplace: ONLINE`);
    console.log(` 💬 Real-time Messaging: ACTIVE (Socket.io)`);
    console.log(` 📹 Video Conference: READY (WebRTC)`);
    console.log(` 📈 Market Data: ${cachedMarketData.source}`);
});
