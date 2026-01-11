// public/app.js
// VIYA BROKER - COMMAND INTERFACE (V18.1 - COMPLETE MERGE)
// Features: All V17 + Marketplace + Messaging + Video Call
// Status: FULLY OPERATIONAL

// ==========================================
// GLOBAL VARIABLES
// ==========================================
let currentVoyageData = null;
let REGS_DB = [], DOCS_DB = [];
let currentLang = 'en';
let mapRouteLayer = null;
let currentTemplateType = null;
let currentTemplateKey = null;

// V18 NEW - Marketplace & Messaging
let socket = null;
let currentUser = null;
let currentChatUserId = null;
let currentChatUserName = null;
let currentChatVesselId = null;
let uploadedImages = [];

// V18.1 NEW - Video Call
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let currentRoomId = null;
let isMuted = false;
let isVideoOff = false;

// Language Names for AI
const LANG_NAMES = {
    en: "English", tr: "Turkish", de: "German", it: "Italian",
    fr: "French", es: "Spanish", gr: "Greek"
};

// ==========================================
// FULL LOCALIZATION PACK (V17 KORUNDU)
// ==========================================
const TRANSLATIONS = {
    en: {
        landing_title: "NEXT GEN MARITIME INTELLIGENCE", landing_sub: "Advanced Voyage Estimation & Legal AI.",
        btn_login: "LOG IN", btn_enter_term: "ENTER TERMINAL", btn_learn_more: "LEARN MORE", btn_register: "BECOME MEMBER",
        nav_term: "Terminal", nav_market: "Market", nav_docstudio: "Document Studio", nav_kb: "Academy", nav_reg: "Regulations", nav_docs: "Docs", nav_mem: "Membership",
        menu_home: "Home", menu_about: "About Us", menu_mission: "Mission", menu_contact: "Contact",
        lbl_vessel: "VESSEL CLASS", lbl_port: "POSITION", lbl_speed: "SPEED", lbl_qty: "CARGO", lbl_lrate: "LOAD RATE", lbl_drate: "DISCH RATE",
        btn_scan: "SCAN MARKET", btn_sell_charter: "SELL / CHARTER", panel_params: "PARAMETERS", panel_estim: "ESTIMATION",
        stat_profit: "Net Profit", btn_breakdown: "VIEW FULL BREAKDOWN", empty_state: "Awaiting Inputs...",
        modal_fin_title: "FINANCIAL BREAKDOWN",
        fin_rev: "REVENUE", fin_freight: "Gross Freight", fin_net: "NET REVENUE",
        fin_voy: "VOYAGE COSTS", fin_bunkers: "A. Bunkers", fin_main: "Main Engine", fin_aux: "Aux Engine", fin_lubes: "Lubricants",
        fin_port: "B. Port Charges", fin_dues: "Dues", fin_pilot: "Pilotage", fin_tow: "Towage", fin_total_port: "Total Port",
        fin_cargo: "C. Cargo/Canal", fin_misc: "Misc/Cleaning", fin_canal: "Canal Transit", fin_comm: "Commission",
        fin_opex: "OPEX", fin_daily_opex: "Daily OPEX", fin_total_opex: "TOTAL OPEX", fin_profit: "NET PROFIT",
        sec_kb: "KNOWLEDGE BASE", sec_reg: "REGULATIONS", sec_doc: "DOCUMENT CENTER", sec_market: "GLOBAL SHIP MARKET",
        ai_welcome: "Hello Captain! I am VIYA AI. Systems Online.", chat_placeholder: "Ask me anything...",
        footer_rights: "© 2026 VIYA BROKER. All Rights Reserved.",
        btn_read: "READ", btn_download: "DOWNLOAD", btn_view: "DETAILS", btn_generate: "GENERATE"
    },
    tr: {
        landing_title: "YENİ NESİL DENİZCİLİK ZEKASI", landing_sub: "İleri Sefer Tahmini & Hukuki AI.",
        btn_login: "GİRİŞ", btn_enter_term: "TERMİNALE GİR", btn_learn_more: "DAHA FAZLA", btn_register: "ÜYE OL",
        nav_term: "Terminal", nav_market: "Pazar", nav_docstudio: "Doküman Stüdyosu", nav_kb: "Akademi", nav_reg: "Mevzuat", nav_docs: "Evraklar", nav_mem: "Üyelik",
        menu_home: "Anasayfa", menu_about: "Hakkımızda", menu_mission: "Misyon", menu_contact: "İletişim",
        lbl_vessel: "GEMİ TİPİ", lbl_port: "KONUM", lbl_speed: "HIZ", lbl_qty: "YÜK", lbl_lrate: "YÜKLEME HIZI", lbl_drate: "TAHLİYE HIZI",
        btn_scan: "PİYASAYI TARA", btn_sell_charter: "SAT / KİRALA", panel_params: "PARAMETRELER", panel_estim: "TAHMİN",
        stat_profit: "Net Kâr", btn_breakdown: "DETAYLI DÖKÜM", empty_state: "Veri Bekleniyor...",
        modal_fin_title: "FİNANSAL DÖKÜM",
        fin_rev: "GELİRLER", fin_freight: "Brüt Navlun", fin_net: "NET GELİR",
        fin_voy: "SEFER GİDERLERİ", fin_bunkers: "A. Yakıt", fin_main: "Ana Makine", fin_aux: "Yardımcı", fin_lubes: "Yağlar",
        fin_port: "B. Liman Giderleri", fin_dues: "Rüsumlar", fin_pilot: "Kılavuz", fin_tow: "Römorkör", fin_total_port: "Toplam Liman",
        fin_cargo: "C. Yük & Kanal", fin_misc: "Temizlik", fin_canal: "Kanal", fin_comm: "Komisyon",
        fin_opex: "İŞLETME (OPEX)", fin_daily_opex: "Günlük OPEX", fin_total_opex: "TOPLAM OPEX", fin_profit: "NET KÂR",
        sec_kb: "BİLGİ BANKASI", sec_reg: "YÖNETMELİKLER", sec_doc: "DOKÜMAN MERKEZİ", sec_market: "GLOBAL GEMİ PAZARI",
        ai_welcome: "Merhaba Kaptan! Ben VIYA AI. Sistemler Aktif.", chat_placeholder: "Bana bir şey sor...",
        footer_rights: "© 2026 VIYA BROKER. Tüm Hakları Saklıdır.",
        btn_read: "OKU", btn_download: "İNDİR", btn_view: "DETAYLAR", btn_generate: "OLUŞTUR"
    },
    de: {
        landing_title: "MARITIME INTELLIGENZ DER NÄCHSTEN GENERATION", landing_sub: "Fortschrittliche Reiseschätzung & Rechtliche KI.",
        btn_login: "ANMELDEN", btn_enter_term: "TERMINAL BETRETEN", btn_learn_more: "MEHR ERFAHREN",
        nav_term: "Terminal", nav_market: "Markt", nav_docstudio: "Dokument Studio", nav_kb: "Akademie", nav_reg: "Vorschriften", nav_docs: "Dokumente", nav_mem: "Mitgliedschaft",
        ai_welcome: "Hallo Kapitän! Ich bin VIYA AI. Systeme Online.",
        footer_rights: "© 2026 VIYA BROKER. Alle Rechte vorbehalten."
    },
    fr: {
        landing_title: "INTELLIGENCE MARITIME NOUVELLE GÉNÉRATION", landing_sub: "Estimation de Voyage Avancée & IA Juridique.",
        btn_login: "CONNEXION", btn_enter_term: "ENTRER TERMINAL", btn_learn_more: "EN SAVOIR PLUS",
        nav_term: "Terminal", nav_market: "Marché", nav_docstudio: "Studio Documents", nav_kb: "Académie", nav_reg: "Règlements", nav_docs: "Documents", nav_mem: "Adhésion",
        ai_welcome: "Bonjour Capitaine! Je suis VIYA AI. Systèmes en ligne.",
        footer_rights: "© 2026 VIYA BROKER. Tous droits réservés."
    },
    es: {
        landing_title: "INTELIGENCIA MARÍTIMA DE PRÓXIMA GENERACIÓN", landing_sub: "Estimación de Viaje Avanzada e IA Legal.",
        btn_login: "INICIAR SESIÓN", btn_enter_term: "ENTRAR TERMINAL", btn_learn_more: "MÁS INFORMACIÓN",
        nav_term: "Terminal", nav_market: "Mercado", nav_kb: "Academia", nav_reg: "Regulaciones", nav_docs: "Documentos", nav_mem: "Membresía",
        ai_welcome: "¡Hola Capitán! Soy VIYA AI. Sistemas en línea.",
        footer_rights: "© 2026 VIYA BROKER. Todos los derechos reservados."
    },
    it: {
        landing_title: "INTELLIGENZA MARITTIMA DI NUOVA GENERAZIONE", landing_sub: "Stima Avanzata dei Viaggi e IA Legale.",
        btn_login: "ACCEDI", btn_enter_term: "ENTRA TERMINALE", btn_learn_more: "SCOPRI DI PIÙ",
        nav_term: "Terminale", nav_market: "Mercato", nav_kb: "Accademia", nav_reg: "Regolamenti", nav_docs: "Documenti", nav_mem: "Abbonamento",
        ai_welcome: "Ciao Capitano! Sono VIYA AI. Sistemi online.",
        footer_rights: "© 2026 VIYA BROKER. Tutti i diritti riservati."
    },
    gr: {
        landing_title: "ΝΑΥΤΙΛΙΑΚΗ ΝΟΗΜΟΣΥΝΗ ΝΕΑΣ ΓΕΝΙΑΣ", landing_sub: "Προηγμένη Εκτίμηση Ταξιδιού & Νομική AI.",
        btn_login: "ΣΥΝΔΕΣΗ", btn_enter_term: "ΕΙΣΟΔΟΣ ΤΕΡΜΑΤΙΚΟΥ", btn_learn_more: "ΜΑΘΕΤΕ ΠΕΡΙΣΣΟΤΕΡΑ",
        nav_term: "Τερματικό", nav_market: "Αγορά", nav_kb: "Ακαδημία", nav_reg: "Κανονισμοί", nav_docs: "Έγγραφα", nav_mem: "Συνδρομή",
        ai_welcome: "Γεια σας Καπετάνιε! Είμαι η VIYA AI. Συστήματα Online.",
        footer_rights: "© 2026 VIYA BROKER. Με επιφύλαξη παντός δικαιώματος."
    }
};

// ==========================================
// 1. SYSTEM INITIALIZATION
// ==========================================

function enterSystem() {
    const landing = document.getElementById('landing-page');
    const app = document.getElementById('app-container');
    if (landing && app) {
        landing.style.opacity = '0';
        landing.style.transition = 'opacity 0.8s ease';
        setTimeout(() => {
            landing.style.display = 'none';
            app.style.display = 'block';
            if (map) map.invalidateSize();
            const welcomeMsg = TRANSLATIONS[currentLang]?.ai_welcome || "System Online";
            addChatMessage('ai', welcomeMsg);
        }, 800);
    }
}

async function init() {
    console.log("⚓ VIYA SYSTEM V18.1 INITIALIZING...");
    try {
        // Socket.IO başlat (V18)
        initSocket();

        // Limanları Yükle
        const pRes = await fetch('/api/ports');
        const ports = await pRes.json();
        const dl = document.getElementById('portList');
        if (dl) {
            dl.innerHTML = "";
            ports.forEach(p => {
                const o = document.createElement('option');
                o.value = p;
                dl.appendChild(o);
            });
        }

        // Market Verisi (V18.1 - BRENT + VLSFO + MGO)
        const mRes = await fetch('/api/market');
        const m = await mRes.json();

        const oilEl = document.getElementById('oilPrice');
        const vlsfoEl = document.getElementById('vlsfoPrice');
        const mgoEl = document.getElementById('mgoPrice');
        const sourceEl = document.getElementById('dataSource');

        if (m.brent) {
            if (oilEl) {
                oilEl.innerText = "$" + m.brent.toFixed(2);
                if (m.source === 'SIMULATED') {
                    oilEl.style.color = '#f59e0b';
                    oilEl.title = "Simulated Data";
                }
            }
            if (vlsfoEl) vlsfoEl.innerText = "$" + m.vlsfo;
            if (mgoEl) mgoEl.innerText = "$" + m.mgo;
            if (sourceEl) {
                sourceEl.innerText = m.source === 'LIVE' ? '🟢' : '🟡';
                sourceEl.title = m.source === 'LIVE' ? 'Live Data' : 'Simulated Data';
            }
        }

        // İçerikleri Yükle
        loadAcademy();
        loadDocs();
        loadRegulations();
        loadDocumentTemplates();
        loadMarketplaceListings(); // V18

    } catch (e) {
        console.error("System Init Error:", e);
    }
}
window.onload = init;

// ==========================================
// 2. SOCKET.IO (V18 YENİ)
// ==========================================

function initSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        if (currentUser) {
            socket.emit('join_room', currentUser.id);
        }
    });

    socket.on('new_message', (data) => {
        console.log('📩 New message:', data);
        // Eğer açık sohbet varsa mesajı göster
        if (currentChatUserId && (data.from === currentChatUserId || data.fromName)) {
            displayMessage(data);
        }
        // Inbox badge güncelle
        updateInboxBadge();
    });

    // Video Call Events
    socket.on('incoming_call', (data) => {
        if (confirm(`${data.fromName} is calling you. Accept?`)) {
            currentRoomId = data.roomId;
            answerCall(data);
        }
    });

    socket.on('call_answered', (data) => {
        if (peerConnection) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
    });

    socket.on('ice_candidate', (data) => {
        if (peerConnection && data.candidate) {
            peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    });

    socket.on('call_ended', () => {
        endVideoCall();
    });

    socket.on('user_joined_room', (data) => {
        console.log('User joined video room:', data.userName);
        document.getElementById('remoteUserName').innerText = data.userName;
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
    });
}

// ==========================================
// 3. VIEW SWITCHING & LANGUAGE
// ==========================================

function switchView(id) {
    document.querySelectorAll('.view-section').forEach(e => e.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const navMap = { 'dashboard': 0, 'marketplace': 1, 'document-studio': 2, 'academy': 3, 'regulations': 4, 'docs': 5, 'pricing': 6 };
    if (navMap[id] !== undefined) {
        const items = document.querySelectorAll('.nav-item');
        if (items[navMap[id]]) items[navMap[id]].classList.add('active');
    }

    if (id === 'dashboard' && map) setTimeout(() => map.invalidateSize(), 100);
    if (id === 'marketplace') loadMarketplaceListings();
}

function changeLanguage(lang) {
    currentLang = lang;
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        if (t[k]) el.innerText = t[k];
    });

    const chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.placeholder = t.chat_placeholder || "...";

    // Sync dropdowns
    const landingSelect = document.getElementById('langSelectLanding');
    const appSelect = document.getElementById('langSelectApp');
    if (landingSelect) landingSelect.value = lang;
    if (appSelect) appSelect.value = lang;

    // Reload content
    loadAcademy();
    loadDocs();
    loadRegulations();

    if (currentVoyageData && document.getElementById('finModal').style.display === 'block') {
        showFinancials();
    }
}

// ==========================================
// 4. MAP & VOYAGE ENGINE (V17 KORUNDU)
// ==========================================

const map = L.map('map', { zoomControl: false }).setView([34, 26], 3);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 10,
    attribution: 'VIYA MAPS'
}).addTo(map);

// OpenSeaMap Layer (V17 KORUNDU)
L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'OpenSeaMap'
}).addTo(map);

// High Risk Area - Piracy (V17 KORUNDU)
const hraPolygon = L.polygon([
    [12.5, 43.5], [15.0, 55.0], [5.0, 60.0], [-5.0, 50.0], [0.0, 40.0]
], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.1,
    weight: 1,
    dashArray: '5, 10'
}).addTo(map).bindPopup("HIGH RISK AREA (HRA) - Piracy Risk");

let shipLayer = L.layerGroup().addTo(map);

async function fillCoords() {
    const p = document.getElementById('refPort').value.toUpperCase();
    if (!p) return;
    try {
        const res = await fetch('/api/port-coords?port=' + p);
        const d = await res.json();
        if (d.lat) {
            document.getElementById('vLat').value = d.lat;
            document.getElementById('vLng').value = d.lng;
            updateShipMarker(d.lat, d.lng);
        }
    } catch (e) { }
}

function updateShipMarker(lat, lng) {
    if (shipLayer) shipLayer.clearLayers();
    L.circleMarker([lat, lng], {
        radius: 8,
        color: '#0ea5e9',
        fillColor: '#0ea5e9',
        fillOpacity: 0.8,
        weight: 2
    }).addTo(shipLayer).bindPopup("VESSEL POSITION");
    map.setView([lat, lng], 5);
}

async function scanMarket() {
    const lat = parseFloat(document.getElementById('vLat').value);
    const lng = parseFloat(document.getElementById('vLng').value);

    if (isNaN(lat) || isNaN(lng)) {
        alert("Please enter vessel position first!");
        return;
    }

    updateShipMarker(lat, lng);

    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'grid';

    try {
        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                shipLat: lat,
                shipLng: lng,
                shipSpeed: document.getElementById('vSpeed').value || 13,
                vType: document.getElementById('vType').value,
                cargoQty: document.getElementById('vQty').value,
                loadRate: document.getElementById('vLoadRate').value,
                dischRate: document.getElementById('vDischRate').value
            })
        });

        const data = await res.json();

        if (data.success && data.voyages.length > 0) {
            renderList(data.voyages);
        } else {
            alert(data.msg || "No profitable voyages found.");
        }

    } catch (e) {
        console.error(e);
        alert("Connection error.");
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

function renderList(voyages) {
    const list = document.getElementById('cargoResultList');
    list.innerHTML = '';

    voyages.forEach((v, index) => {
        const el = document.createElement('div');
        el.className = 'cargo-item';

        let profitClass = v.financials.profit > 0 ? 'text-green-400' : 'text-red-400';

        el.innerHTML = `
            <div class="ci-top">
                <span style="font-weight:bold;color:white;">${v.params.loadPort} <i class="fa-solid fa-arrow-right" style="font-size:0.8em;color:#64748b"></i> ${v.params.dischPort}</span>
                <span class="tce-badge">$${Math.floor(v.financials.tce).toLocaleString()}</span>
            </div>
            <div class="ci-bot">
                <span>${v.params.cargo} (${parseInt(v.params.qty / 1000)}k)</span>
                <span class="${profitClass}">$${Math.floor(v.financials.profit / 1000)}k Net</span>
            </div>
        `;
        el.onclick = () => showDetails(v, el);
        list.appendChild(el);
        if (index === 0) showDetails(v, el);
    });
}

function showDetails(v, el) {
    currentVoyageData = v;
    document.querySelectorAll('.cargo-item').forEach(x => x.classList.remove('active'));
    if (el) el.classList.add('active');

    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('analysisPanel').style.display = 'block';

    document.getElementById('dispTCE').innerText = "$" + Math.floor(v.financials.tce).toLocaleString();

    const profitEl = document.getElementById('dispProfit');
    profitEl.innerText = "$" + Math.floor(v.financials.profit).toLocaleString();
    profitEl.style.color = v.financials.profit > 0 ? '#4ade80' : '#f87171';

    // Distance details (V17 KORUNDU)
    let distDisplay = "";
    if (v.dist && typeof v.dist === 'object') {
        distDisplay = `
        <div class="detail-row"><span class="d-lbl" style="color:#94a3b8">Ballast (To Load)</span><span class="d-val text-cyan-400">${Math.floor(v.dist.ballast)} nm</span></div>
        <div class="detail-row"><span class="d-lbl" style="color:#94a3b8">Laden (To Disch)</span><span class="d-val text-cyan-400">${Math.floor(v.dist.laden)} nm</span></div>
        <div class="detail-row"><span class="d-lbl font-bold">Total Distance</span><span class="d-val font-bold text-white">${Math.floor(v.dist.total)} nm</span></div>
        `;
    }

    document.getElementById('financialDetails').innerHTML = `
        <div class="detail-row"><span class="d-lbl">Sea/Port Days</span><span class="d-val">${v.duration.sea} / ${v.duration.port}</span></div>
        <div class="detail-row"><span class="d-lbl">Total Duration</span><span class="d-val">${v.duration.total} days</span></div>
        <div class="detail-row"><span class="d-lbl">Break-Even</span><span class="d-val">$${v.financials.breakEvenRate.toFixed(2)} / ton</span></div>
        <hr style="border-color:#334155;margin:8px 0;">
        ${distDisplay}
    `;

    document.getElementById('aiOutput').innerHTML = v.aiAnalysis;

    // Map update
    shipLayer.clearLayers();

    const shipPos = [document.getElementById('vLat').value, document.getElementById('vLng').value];
    const loadPos = [v.loadGeo?.lat || 0, v.loadGeo?.lng || 0];
    const dischPos = [v.dischGeo?.lat || 0, v.dischGeo?.lng || 0];

    L.circleMarker(shipPos, { radius: 8, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.8 })
        .addTo(shipLayer).bindPopup("<b>SHIP POSITION</b>").openPopup();

    L.circleMarker(loadPos, { radius: 8, color: '#eab308', fillColor: '#eab308', fillOpacity: 0.8 })
        .addTo(shipLayer).bindPopup(`<b>LOAD:</b> ${v.params.loadPort}`);

    L.circleMarker(dischPos, { radius: 8, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.8 })
        .addTo(shipLayer).bindPopup(`<b>DISCH:</b> ${v.params.dischPort}`);

    const bounds = L.latLngBounds([shipPos, loadPos, dischPos]);
    map.fitBounds(bounds, { padding: [50, 50] });
}

// ==========================================
// 5. FINANCIAL BREAKDOWN (V17 KORUNDU)
// ==========================================

function showFinancials() {
    if (!currentVoyageData) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    const bd = currentVoyageData.breakdown;
    const vc = bd.voyage_costs;
    const ox = bd.opex;

    const html = `
        <table class="fin-table">
            <tr><th colspan="2" style="border-bottom:2px solid var(--neon-cyan)">${t.fin_rev || 'REVENUE'}</th></tr>
            <tr><td>${t.fin_freight || 'Gross Freight'} (${currentVoyageData.params.qty}mt @ $${currentVoyageData.params.freightRate})</td>
                <td class="text-green-400">$${Math.floor(bd.revenue).toLocaleString()}</td></tr>
            <tr class="fin-section-total"><td>${t.fin_net || 'NET REVENUE'}</td>
                <td>$${Math.floor(bd.revenue - vc.commission).toLocaleString()}</td></tr>
            
            <tr><th colspan="2" style="padding-top:20px;border-bottom:2px solid var(--neon-cyan)">${t.fin_voy || 'VOYAGE COSTS'}</th></tr>
            <tr><td>${t.fin_bunkers || 'Bunkers'} (Total)</td><td class="text-red-300">-$${Math.floor(vc.fuel.total).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_main || 'Main Engine'}</td><td>-$${Math.floor(vc.fuel.main).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_aux || 'Aux Engine'}</td><td>-$${Math.floor(vc.fuel.aux).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_lubes || 'Lubricants'}</td><td>-$${Math.floor(vc.fuel.lubes).toLocaleString()}</td></tr>

            <tr><td>${t.fin_port || 'Port Charges'}</td><td class="text-red-300">-$${Math.floor(vc.port.total).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_dues || 'Dues'}</td><td>-$${Math.floor(vc.port.dues).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_pilot || 'Pilotage'}</td><td>-$${Math.floor(vc.port.pilot).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_tow || 'Towage'}</td><td>-$${Math.floor(vc.port.tow).toLocaleString()}</td></tr>
            
            <tr><td>${t.fin_cargo || 'Cargo/Canal'}</td><td class="text-red-300">-$${Math.floor(vc.cargo_canal.total).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_canal || 'Canal'} (${vc.cargo_canal.names || 'None'})</td><td>-$${Math.floor(vc.cargo_canal.canal).toLocaleString()}</td></tr>

            <tr><td>${t.fin_comm || 'Commission'}</td><td class="text-red-300">-$${Math.floor(vc.commission).toLocaleString()}</td></tr>

            <tr><th colspan="2" style="padding-top:20px;border-bottom:2px solid var(--neon-cyan)">${t.fin_opex || 'OPEX'}</th></tr>
            <tr><td>${t.fin_daily_opex || 'Daily OPEX'} ($${ox.daily})</td><td class="text-orange-300">-$${Math.floor(ox.total).toLocaleString()}</td></tr>
            
            <tr><th colspan="2" style="padding-top:30px;"></th></tr>
            <tr class="fin-grand-total">
                <td>${t.fin_profit || 'NET PROFIT'}</td>
                <td style="color:${currentVoyageData.financials.profit > 0 ? '#4ade80' : '#ef4444'}">
                    $${Math.floor(currentVoyageData.financials.profit).toLocaleString()}
                </td>
            </tr>
        </table>`;

    document.getElementById('finBody').innerHTML = html;
    document.getElementById('finModal').style.display = 'block';
}
// ==========================================
// 6. MARKETPLACE LOGIC (V18.1)
// ==========================================

async function loadMarketplaceListings() {
    const grid = document.getElementById('marketplaceGrid');
    if (!grid) return;

    grid.innerHTML = '<div style="text-align:center;color:#64748b;padding:20px;">Loading fleet...</div>';

    // Filtreleri al
    const type = document.getElementById('filterType') ? document.getElementById('filterType').value : '';
    const priceType = document.getElementById('filterPriceType') ? document.getElementById('filterPriceType').value : '';
    const minDwt = document.getElementById('filterMinDwt') ? document.getElementById('filterMinDwt').value : '';
    const maxDwt = document.getElementById('filterMaxDwt') ? document.getElementById('filterMaxDwt').value : '';

    let query = `/api/marketplace/listings?status=ACTIVE`;
    if (type) query += `&type=${type}`;
    if (priceType) query += `&priceType=${priceType}`;
    if (minDwt) query += `&minDwt=${minDwt}`;
    if (maxDwt) query += `&maxDwt=${maxDwt}`;

    try {
        const res = await fetch(query);
        const data = await res.json();

        if (!data.success || !data.listings || data.listings.length === 0) {
            grid.innerHTML = '<div style="text-align:center;color:#64748b;padding:20px;">No vessels found matching criteria.</div>';
            return;
        }

        grid.innerHTML = '';

        data.listings.forEach(vessel => {
            const card = document.createElement('div');
            card.className = 'doc-card';
            card.style.cursor = 'pointer';
            card.onclick = () => openVesselDetail(vessel._id);

            // Fiyat formatı
            let priceDisplay = '';
            if (vessel.priceType === 'SALE') {
                priceDisplay = `$${(vessel.price / 1000000).toFixed(2)}M`;
            } else {
                priceDisplay = `$${vessel.price.toLocaleString()}/day`;
            }

            // Resim (Varsa ilki, yoksa ikon)
            let imgHTML = '<div style="height:150px;display:flex;align-items:center;justify-content:center;background:#050505;"><i class="fa-solid fa-ship" style="font-size:50px;color:#333;"></i></div>';
            if (vessel.images && vessel.images.length > 0) {
                imgHTML = `<img src="${vessel.images[0]}" style="width:100%;height:150px;object-fit:cover;border-radius:4px 4px 0 0;">`;
            }

            card.innerHTML = `
                ${imgHTML}
                <div style="padding:10px;">
                    <div class="doc-title" style="margin-bottom:5px;">${vessel.vesselName}</div>
                    <div style="color:var(--neon-gold);font-weight:bold;margin-bottom:5px;">${priceDisplay}</div>
                    <div class="doc-desc">${vessel.vesselType} | ${vessel.dwt.toLocaleString()} DWT</div>
                    <div style="font-size:0.75rem;color:#64748b;margin-top:5px;">Built: ${vessel.yearBuilt} | ${vessel.flag}</div>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (e) {
        console.error(e);
        grid.innerHTML = '<div style="text-align:center;color:#ef4444;">Connection error.</div>';
    }
}

async function openVesselDetail(id) {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';

    try {
        const res = await fetch(`/api/marketplace/listing/${id}`);
        const data = await res.json();

        if (!data.success) throw new Error("Vessel not found");
        const v = data.listing;

        document.getElementById('vesselDetailTitle').innerText = v.vesselName;

        // Galeri
        let galleryHTML = '';
        if (v.images && v.images.length > 0) {
            galleryHTML = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px;">';
            v.images.forEach(img => {
                galleryHTML += `<img src="${img}" style="width:100%;height:200px;object-fit:cover;border:1px solid #333;">`;
            });
            galleryHTML += '</div>';
        }

        // Detaylar
        const html = `
            ${galleryHTML}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:20px;font-size:0.9rem;">
                <div><span style="color:#64748b;">Type:</span> <span style="color:#fff;">${v.vesselType}</span></div>
                <div><span style="color:#64748b;">DWT:</span> <span style="color:#fff;">${v.dwt.toLocaleString()}</span></div>
                <div><span style="color:#64748b;">Built:</span> <span style="color:#fff;">${v.yearBuilt}</span></div>
                <div><span style="color:#64748b;">Flag:</span> <span style="color:#fff;">${v.flag}</span></div>
                <div><span style="color:#64748b;">IMO:</span> <span style="color:#fff;">${v.imoNumber || 'N/A'}</span></div>
                <div><span style="color:#64748b;">Class:</span> <span style="color:#fff;">${v.classification || 'N/A'}</span></div>
            </div>
            
            <div style="background:#111;padding:15px;border-left:3px solid var(--neon-gold);margin-bottom:20px;">
                <div style="color:var(--neon-gold);font-weight:bold;font-size:1.2rem;">
                    ${v.priceType === 'SALE' ? 'ASKING PRICE' : 'CHARTER RATE'}: 
                    ${v.priceType === 'SALE' ? `$${(v.price / 1000000).toFixed(2)}M` : `$${v.price.toLocaleString()}/day`}
                </div>
                ${v.charterDuration ? `<div style="font-size:0.8rem;color:#aaa;">Duration: ${v.charterDuration}</div>` : ''}
            </div>

            <div style="margin-bottom:20px;">
                <h4 style="color:#fff;border-bottom:1px solid #333;padding-bottom:5px;margin-bottom:10px;">DESCRIPTION</h4>
                <p style="color:#ccc;line-height:1.6;font-size:0.9rem;">${v.description || 'No description provided.'}</p>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;background:#050505;padding:15px;border:1px solid #333;">
                <div>
                    <div style="color:#64748b;font-size:0.8rem;">LISTED BY</div>
                    <div style="color:#fff;font-weight:bold;">${v.sellerName}</div>
                </div>
                ${currentUser && currentUser.id !== v.seller ? 
                    `<button class="btn-action" style="width:auto;margin:0;" onclick="openChat('${v.seller}', '${v.sellerName}', '${v._id}')">
                        <i class="fa-solid fa-comments"></i> CONTACT
                    </button>` : 
                    '<span style="color:var(--neon-cyan);font-size:0.8rem;">YOUR LISTING</span>'
                }
            </div>
        `;

        document.getElementById('vesselDetailBody').innerHTML = html;
        document.getElementById('vesselDetailModal').style.display = 'block';

    } catch (e) {
        alert("Error loading details.");
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

function openCreateListingModal() {
    if (!currentUser) { openAuthModal(); return; }
    document.getElementById('createListingModal').style.display = 'block';
    uploadedImages = [];
    document.getElementById('imagePreview').innerHTML = '';
}

function toggleCharterFields() {
    const type = document.getElementById('listPriceType').value;
    const durField = document.getElementById('charterDurationField');
    const priceLbl = document.getElementById('priceLabel');
    
    if (type === 'SALE') {
        durField.style.display = 'none';
        priceLbl.innerText = 'Price (USD) *';
    } else {
        durField.style.display = 'block';
        priceLbl.innerText = 'Daily Rate (USD) *';
    }
}

function handleImageUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    uploadedImages = [];

    if (files.length > 4) { alert("Max 4 images allowed."); return; }

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Resmi küçültme (Canvas ile)
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                // Max width 800px
                const scaleFactor = 800 / img.width;
                canvas.width = 800;
                canvas.height = img.height * scaleFactor;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.7); // %70 kalite
                uploadedImages.push(resizedDataUrl);
                
                const pImg = document.createElement('img');
                pImg.src = resizedDataUrl;
                pImg.style.width = '100%';
                pImg.style.height = '80px';
                pImg.style.objectFit = 'cover';
                pImg.style.border = '1px solid #444';
                preview.appendChild(pImg);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function submitListing() {
    const token = localStorage.getItem('viya_token');
    if (!token) return;

    const data = {
        vesselName: document.getElementById('listVesselName').value,
        vesselType: document.getElementById('listVesselType').value,
        dwt: document.getElementById('listDWT').value,
        yearBuilt: document.getElementById('listYear').value,
        flag: document.getElementById('listFlag').value,
        imoNumber: document.getElementById('listIMO').value,
        price: document.getElementById('listPrice').value,
        priceType: document.getElementById('listPriceType').value,
        charterDuration: document.getElementById('listCharterDuration').value,
        location: document.getElementById('listLocation').value,
        description: document.getElementById('listDescription').value,
        images: uploadedImages
    };

    if (!data.vesselName || !data.price || !data.dwt) {
        alert("Please fill required fields (*)");
        return;
    }

    const btn = document.querySelector('#createListingModal .btn-action');
    const oldText = btn.innerText;
    btn.innerText = "PUBLISHING...";
    btn.disabled = true;

    try {
        const res = await fetch('/api/marketplace/create-listing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        
        if (json.success) {
            alert("Vessel listed successfully!");
            closeModal('createListingModal');
            loadMarketplaceListings();
        } else {
            alert("Error: " + json.error);
        }
    } catch (e) {
        alert("System error.");
    } finally {
        btn.innerText = oldText;
        btn.disabled = false;
    }
}

// ==========================================
// 7. MESSAGING & CHAT LOGIC
// ==========================================

async function openInbox() {
    const token = localStorage.getItem('viya_token');
    if (!token) return;

    document.getElementById('inboxModal').style.display = 'block';
    const container = document.getElementById('inboxContent');
    container.innerHTML = '<div style="text-align:center;color:#666;">Loading...</div>';

    try {
        const res = await fetch('/api/messages/inbox', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.conversations.length > 0) {
            container.innerHTML = '';
            data.conversations.forEach(c => {
                const otherId = c._id; // Group ID is the other user ID
                const isUnread = c.unreadCount > 0;
                
                // Fetch user name? Backend just gives ID in group. 
                // For simplicity, we assume we open chat to load details or store names in local cache.
                // In production, aggregate should populate names.
                // Fallback:
                const displayName = "User " + otherId.substr(0,6); 

                const item = document.createElement('div');
                item.style.padding = '15px';
                item.style.borderBottom = '1px solid #333';
                item.style.cursor = 'pointer';
                item.style.background = isUnread ? 'rgba(0, 242, 255, 0.05)' : 'transparent';
                item.onclick = () => { closeModal('inboxModal'); openChat(otherId, displayName); };
                
                item.innerHTML = `
                    <div style="font-weight:bold;color:#fff;">
                        ${isUnread ? '<i class="fa-solid fa-circle" style="color:var(--neon-cyan);font-size:8px;"></i> ' : ''} 
                        Conversation
                    </div>
                    <div style="font-size:0.8rem;color:#888;margin-top:5px;">
                        ${c.lastMessage.message.substring(0, 40)}...
                    </div>
                    <div style="font-size:0.7rem;color:#555;text-align:right;">
                        ${new Date(c.lastMessage.timestamp).toLocaleDateString()}
                    </div>
                `;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">No messages yet.</div>';
        }
    } catch (e) {
        console.error(e);
    }
}

function updateInboxBadge() {
    // Poll for unread count if needed, or update via socket events
    // For V18.1, simple visual cue
    const badge = document.getElementById('inboxBadge');
    if(badge) {
        badge.style.display = 'inline-block';
        badge.innerText = '!';
    }
}

async function openChat(userId, userName, vesselId = null) {
    if (!currentUser) { openAuthModal(); return; }

    currentChatUserId = userId;
    currentChatUserName = userName; // For video call
    currentChatVesselId = vesselId;

    document.getElementById('chatWithName').innerText = userName || 'Chat';
    document.getElementById('messagingModal').style.display = 'block';
    
    const history = document.getElementById('messageHistory');
    history.innerHTML = '<div style="text-align:center;color:#666;">Loading history...</div>';

    const token = localStorage.getItem('viya_token');
    try {
        const res = await fetch(`/api/messages/conversation/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        history.innerHTML = '';
        if (data.success) {
            data.messages.forEach(displayMessage);
        }
        history.scrollTop = history.scrollHeight;
    } catch (e) {
        history.innerHTML = 'Error loading.';
    }
}

function displayMessage(msg) {
    const history = document.getElementById('messageHistory');
    const isMe = msg.from === currentUser.id;
    
    const div = document.createElement('div');
    div.style.alignSelf = isMe ? 'flex-end' : 'flex-start';
    div.style.maxWidth = '70%';
    div.style.background = isMe ? 'var(--neon-blue)' : '#222';
    div.style.color = '#fff';
    div.style.padding = '10px';
    div.style.borderRadius = '8px';
    div.style.fontSize = '0.9rem';
    div.style.border = isMe ? '1px solid var(--neon-cyan)' : '1px solid #444';
    
    div.innerHTML = `
        <div>${msg.message}</div>
        <div style="font-size:0.65rem;color:rgba(255,255,255,0.5);text-align:right;margin-top:5px;">
            ${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
    `;
    
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text || !currentChatUserId) return;

    const token = localStorage.getItem('viya_token');
    
    // Optimistic UI update
    const tempMsg = {
        from: currentUser.id,
        message: text,
        timestamp: new Date()
    };
    displayMessage(tempMsg);
    input.value = '';

    try {
        await fetch('/api/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                toUserId: currentChatUserId,
                message: text,
                vesselListingId: currentChatVesselId
            })
        });
        // Socket will handle the rest for receiver
    } catch (e) {
        console.error("Send failed", e);
    }
}

// ==========================================
// 8. VIDEO CALL LOGIC (FULL WEB-RTC IMPLEMENTATION)
// ==========================================

// WebRTC Ayarları (Google STUN Sunucuları - Bağlantı için şart)
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

async function startVideoCall() {
    if (!currentChatUserId) {
        alert("Please select a user to call.");
        return;
    }
    
    // 1. Arayan (Caller) için Peer Connection oluştur
    await createPeerConnection();

    // 2. Video odası oluştur (Backend Kaydı)
    const token = localStorage.getItem('viya_token');
    try {
        const res = await fetch('/api/video/create-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ vesselListingId: currentChatVesselId })
        });
        const data = await res.json();
        
        if (data.success) {
            currentRoomId = data.room.roomId;
            openVideoModal(true); // true = Arayan kişi (Caller)
            
            // 3. Teklif (Offer) oluştur
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            // 4. Sinyali gönder
            socket.emit('call_user', {
                toUserId: currentChatUserId,
                from: currentUser.id,
                fromName: currentUser.fullName,
                roomId: currentRoomId,
                offer: offer // SDP verisini gönderiyoruz
            });
        }
    } catch (e) {
        console.error("Call start error:", e);
        alert("Failed to start call.");
    }
}

async function answerCall(data) {
    currentRoomId = data.roomId;
    currentChatUserId = data.from; // Arayan kişiyi set et
    
    openVideoModal(false); // false = Cevaplayan (Callee)
    
    // 1. Cevaplayan için Peer Connection oluştur
    await createPeerConnection();

    // 2. Gelen teklifi (Offer) kabul et
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

    // 3. Cevap (Answer) oluştur
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // 4. Cevabı gönder
    socket.emit('answer_call', {
        toUserId: data.from,
        answer: answer
    });
}

async function createPeerConnection() {
    // Varsa eski bağlantıyı temizle
    if (peerConnection) {
        peerConnection.close();
    }

    peerConnection = new RTCPeerConnection(rtcConfig);

    // 1. ICE Adaylarını Yönet (Yol bulma işlemi)
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice_candidate', {
                toUserId: currentChatUserId,
                candidate: event.candidate
            });
        }
    };

    // 2. Karşı tarafın videosu geldiğinde ekrana bas
    peerConnection.ontrack = (event) => {
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) {
            remoteVideo.srcObject = event.streams[0];
            document.getElementById('remoteUserName').innerText = "Connected";
        }
    };

    // 3. Kendi kameramızı ve mikrofonumuzu akışa ekle
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('localVideo').srcObject = localStream;
        
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    } catch (err) {
        console.error("Camera Error:", err);
        alert("Camera access denied! Call cannot proceed.");
        endVideoCall();
    }
}

// Socket.io Listener'larını Güncelle (app.js initSocket içine eklenecek mantıklar burayla uyumlu çalışır)
// Not: Aşağıdaki eventler initSocket() içinde zaten var, sadece mantığını teyit et:
/*
    socket.on('call_answered', async (data) => {
        if (peerConnection) {
            // Arayan kişi, karşı tarafın cevabını kaydeder
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
    });

    socket.on('ice_candidate', async (data) => {
        if (peerConnection && data.candidate) {
            // Yeni internet yolu (candidate) bulunduğunda ekle
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) { console.error("Error adding candidate", e); }
        }
    });
*/

function openVideoModal(isCaller) {
    document.getElementById('videoCallModal').style.display = 'block';
    document.getElementById('currentRoomId').innerText = currentRoomId || "Connecting...";
    document.getElementById('remoteUserName').innerText = isCaller ? "Calling..." : "Connecting...";
}

function endVideoCall() {
    // 1. Akışları durdur
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    // 2. Bağlantıyı kapat
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    // 3. Modalı kapat
    document.getElementById('videoCallModal').style.display = 'none';
    
    // 4. Karşı tarafa kapatma sinyali gönder (Eğer hala bağlıysak)
    if (currentChatUserId && socket) {
        socket.emit('end_call', { 
            toUserId: currentChatUserId, 
            from: currentUser ? currentUser.id : null 
        });
    }
    currentRoomId = null;
}

function toggleMute() {
    if (localStream) {
        isMuted = !isMuted;
        localStream.getAudioTracks()[0].enabled = !isMuted;
        const btn = document.getElementById('muteBtn');
        btn.innerHTML = isMuted ? '<i class="fa-solid fa-microphone-slash"></i>' : '<i class="fa-solid fa-microphone"></i>';
        btn.style.background = isMuted ? '#ef4444' : 'rgba(255,255,255,0.1)';
    }
}

function toggleVideo() {
    if (localStream) {
        isVideoOff = !isVideoOff;
        localStream.getVideoTracks()[0].enabled = !isVideoOff;
        const btn = document.getElementById('videoBtn');
        btn.innerHTML = isVideoOff ? '<i class="fa-solid fa-video-slash"></i>' : '<i class="fa-solid fa-video"></i>';
        btn.style.background = isVideoOff ? '#ef4444' : 'rgba(255,255,255,0.1)';
    }
}

async function shareScreen() {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Mevcut video izini (track) bul ve ekran paylaşımıyla değiştir
        const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
        if(sender) {
            sender.replaceTrack(screenTrack);
        }
        
        document.getElementById('localVideo').srcObject = screenStream;
        
        // Paylaşım durunca kameraya geri dön
        screenTrack.onended = () => {
            if(localStream) {
                const cameraTrack = localStream.getVideoTracks()[0];
                if(sender) sender.replaceTrack(cameraTrack);
                document.getElementById('localVideo').srcObject = localStream;
            }
        };
    } catch(e) {
        console.error("Screen share failed", e);
    }
}

// ==========================================
// 9. DOCUMENT STUDIO LOGIC
// ==========================================

async function loadDocumentTemplates() {
    try {
        const res = await fetch('/api/document-templates');
        const data = await res.json();
        
        if (data.success && data.templates) {
            const weather = data.templates.filter(t => t.category === 'Weather Related');
            const cargo = data.templates.filter(t => t.category === 'Cargo Issues');
            const port = data.templates.filter(t => t.category === 'Port/Terminal');
            const laytime = data.templates.filter(t => t.category === 'Laytime Disputes');
            const bunker = data.templates.filter(t => t.category === 'Bunker Quality');

            renderTemplates('weatherTemplates', weather);
            renderTemplates('cargoTemplates', cargo);
            renderTemplates('portTemplates', port);
            renderTemplates('laytimeTemplates', laytime);
            renderTemplates('bunkerTemplates', bunker);
        }
    } catch (e) { console.error(e); }
}

function renderTemplates(id, list) {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = '';
    list.forEach(t => {
        const div = document.createElement('div');
        div.className = 'doc-card';
        div.innerHTML = `
            <div class="doc-title"><i class="fa-solid fa-file-contract"></i> ${t.title}</div>
            <button class="btn-download" onclick="openDocGenerator('${t.type}', '${t.templateKey}', '${t.title.replace(/'/g, "\\'")}')">SELECT</button>
        `;
        container.appendChild(div);
    });
}

function openDocGenerator(type, key, title) {
    currentTemplateType = type;
    currentTemplateKey = key;
    document.getElementById('docGenTitle').innerText = title;
    document.getElementById('docGenForm').style.display = 'block';
    document.getElementById('generatedDocArea').style.display = 'none';
    document.getElementById('genVesselName').value = '';
    document.getElementById('docGeneratorModal').style.display = 'block';
}

async function generateDocument() {
    const inputs = {
        VESSEL_NAME: document.getElementById('genVesselName').value || 'TBA',
        IMO_NUMBER: document.getElementById('genIMO').value || 'TBA',
        LOAD_PORT: document.getElementById('genLoadPort').value || 'TBA',
        DISCHARGE_PORT: document.getElementById('genDischPort').value || 'TBA',
        CARGO_TYPE: document.getElementById('genCargo').value || 'TBA',
        CARGO_QUANTITY: document.getElementById('genQty').value || 'TBA',
        DATE: new Date().toLocaleDateString()
    };

    const btn = document.querySelector('#docGenForm button');
    btn.innerText = 'GENERATING...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/generate-document', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                templateType: currentTemplateType,
                templateKey: currentTemplateKey,
                userInputs: inputs
            })
        });
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('docOutput').value = data.document;
            document.getElementById('docGenForm').style.display = 'none';
            document.getElementById('generatedDocArea').style.display = 'block';
        } else {
            alert("Error: " + data.error);
        }
    } catch(e) { alert("System Error"); }
    finally {
        btn.innerText = 'GENERATE WITH AI';
        btn.disabled = false;
    }
}

function copyToClipboard() {
    const el = document.getElementById('docOutput');
    el.select();
    document.execCommand('copy');
    alert("Copied!");
}

function downloadGeneratedDoc() {
    const text = document.getElementById('docOutput').value;
    const blob = new Blob([text], {type: "text/plain"});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "VIYA_DOCUMENT.txt";
    a.click();
}

// ==========================================
// 10. CONTENT LOADERS (V17 KORUNDU)
// ==========================================

function loadAcademy() {
    const g = document.getElementById('academyGrid');
    if (!g) return;
    g.innerHTML = `
        <div class="doc-card"><div class="doc-title"><i class="fa-solid fa-graduation-cap"></i> Laytime & Demurrage</div><div class="doc-desc">Comprehensive guide to laytime calculations.</div><button class="btn-download" onclick="openContentModal('Laytime', 'Laytime content...')">READ</button></div>
        <div class="doc-card"><div class="doc-title"><i class="fa-solid fa-globe"></i> Incoterms 2020</div><div class="doc-desc">FOB, CIF, CFR explained.</div><button class="btn-download" onclick="openContentModal('Incoterms', 'Incoterms content...')">READ</button></div>
    `;
}

function loadDocs() {
    const c = document.getElementById('docsContainer');
    if(!c) return;
    c.innerHTML = `
        <div class="doc-card"><div class="doc-title"><i class="fa-solid fa-file-pdf"></i> GENCON 94</div><button class="btn-download">DOWNLOAD PDF</button></div>
        <div class="doc-card"><div class="doc-title"><i class="fa-solid fa-file-pdf"></i> NYPE 2015</div><button class="btn-download">DOWNLOAD PDF</button></div>
    `;
}

function loadRegulations() {
    const g = document.getElementById('regsGrid');
    if(!g) return;
    g.innerHTML = `
        <div class="doc-card"><div class="doc-title"><i class="fa-solid fa-life-ring"></i> SOLAS</div><div class="doc-desc">Safety of Life at Sea convention.</div><button class="btn-download">ACCESS</button></div>
        <div class="doc-card"><div class="doc-title"><i class="fa-solid fa-water"></i> MARPOL</div><div class="doc-desc">Prevention of Pollution.</div><button class="btn-download">ACCESS</button></div>
    `;
}

// ==========================================
// 11. AUTH & PROFILE
// ==========================================

function openAuthModal() { document.getElementById('authModal').style.display = 'block'; }
function openProfileModal() { document.getElementById('profileModal').style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openContentModal(t,c) { document.getElementById('modalTitle').innerText=t; document.getElementById('modalBody').innerText=c; document.getElementById('docModal').style.display='block'; }

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(e => { e.classList.remove('active'); e.style.color = '#888'; });
    document.querySelectorAll('.auth-form').forEach(e => e.style.display = 'none');
    if (tab === 'login') {
        document.querySelectorAll('.auth-tab')[0].classList.add('active');
        document.querySelectorAll('.auth-tab')[0].style.color = 'var(--neon-cyan)';
        document.getElementById('loginForm').style.display = 'block';
    } else {
        document.querySelectorAll('.auth-tab')[1].classList.add('active');
        document.querySelectorAll('.auth-tab')[1].style.color = 'var(--neon-cyan)';
        document.getElementById('registerForm').style.display = 'block';
    }
}

async function doLogin() {
    const email = document.getElementById('lEmail').value;
    const pass = document.getElementById('lPass').value;
    try {
        const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email, password:pass}) });
        const data = await res.json();
        if(data.success) {
            localStorage.setItem('viya_token', data.token);
            localStorage.setItem('viya_user', JSON.stringify(data.user));
            currentUser = data.user;
            if(socket) socket.emit('join_room', currentUser.id);
            enterSystem();
            closeModal('authModal');
            document.getElementById('userArea').style.display='block';
            document.getElementById('inboxArea').style.display='block';
            document.getElementById('navUserName').innerText = currentUser.fullName.split(' ')[0].toUpperCase();
        } else {
            document.getElementById('authMsg').innerText = data.error;
            document.getElementById('authMsg').style.color = '#ef4444';
        }
    } catch(e) { console.error(e); }
}

async function doRegister() {
    // Register logic similar to login...
    const name = document.getElementById('rName').value;
    const email = document.getElementById('rEmail').value;
    const pass = document.getElementById('rPass').value;
    const kvkk = document.getElementById('kvkkCheck').checked;
    
    if(!kvkk) { alert("Accept Privacy Policy"); return; }
    
    try {
        const res = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({fullName:name, email, password:pass, kvkkAccepted:kvkk}) });
        const data = await res.json();
        if(data.success) {
            alert("Registered! Please login.");
            switchAuthTab('login');
        } else {
            alert(data.error);
        }
    } catch(e) {}
}

function logout() {
    localStorage.removeItem('viya_token');
    localStorage.removeItem('viya_user');
    location.reload();
}

// ==========================================
// 12. AI CHATBOT (V17 KORUNDU)
// ==========================================

function toggleChat() { 
    const w = document.getElementById('chatWindow'); 
    w.style.display = w.style.display === 'flex' ? 'none' : 'flex'; 
}
function handleEnter(e) { if(e.key === 'Enter') sendChat(); }

async function sendChat() {
    const input = document.getElementById('chatInput');
    const msg = input.value;
    if(!msg) return;
    
    addChatMessage('user', msg);
    input.value = '';
    
    try {
        const res = await fetch('/api/chat', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message:msg})});
        const data = await res.json();
        addChatMessage('ai', data.reply);
    } catch(e) { addChatMessage('ai', 'Error connecting.'); }
}

function addChatMessage(role, text) {
    const d = document.createElement('div');
    d.className = `msg ${role}`;
    d.innerHTML = text.replace(/\n/g, '<br>');
    document.getElementById('chatBody').appendChild(d);
    document.getElementById('chatBody').scrollTop = document.getElementById('chatBody').scrollHeight;
}

// Window Onload (Start)
document.addEventListener("DOMContentLoaded", () => {
    // Check auth on load
    const u = localStorage.getItem('viya_user');
    if(u) {
        currentUser = JSON.parse(u);
        document.querySelector('.lp-btn-login').innerText = "ENTER TERMINAL";
        document.querySelector('.lp-btn-login').onclick = enterSystem;
        document.getElementById('userArea').style.display='block';
        document.getElementById('inboxArea').style.display='block';
        document.getElementById('navUserName').innerText = currentUser.fullName.split(' ')[0].toUpperCase();
    }
});
