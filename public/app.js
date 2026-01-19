// public/app.js - VIYA BROKER V18.1 COMPLETE
// All V17 Features + Marketplace + Messaging + Video Call

// ==========================================
// GLOBAL VARIABLES
// ==========================================
let currentVoyageData = null;
let currentLang = 'en';
let currentTemplateType = null;
let currentTemplateKey = null;
let socket = null;
let currentUser = null;
let currentChatUserId = null;
let currentChatUserName = null;
let currentChatVesselId = null;
let uploadedImages = [];
let localStream = null;
let peerConnection = null;
let currentRoomId = null;
let isMuted = false;
let isVideoOff = false;
let otpEmail = null; // OTP için email saklama

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };
const LANG_NAMES = { en: "English", tr: "Turkish", de: "German", it: "Italian", fr: "French", es: "Spanish", gr: "Greek" };

// ==========================================
// TRANSLATIONS
// ==========================================
const TRANSLATIONS = {
    en: {
        landing_title: "NEXT GEN MARITIME INTELLIGENCE", landing_sub: "Advanced Voyage Estimation & Legal AI.",
        btn_login: "LOG IN", btn_enter_term: "ENTER TERMINAL", btn_learn_more: "LEARN MORE",
        nav_term: "Terminal", nav_market: "Market", nav_docstudio: "Document Studio", nav_kb: "Academy", nav_reg: "Regulations", nav_docs: "Docs", nav_mem: "Membership",
        menu_home: "Home", menu_about: "About Us", menu_mission: "Mission", menu_contact: "Contact",
        lbl_vessel: "VESSEL CLASS", lbl_port: "POSITION", lbl_speed: "SPEED", lbl_qty: "CARGO", lbl_lrate: "LOAD RATE", lbl_drate: "DISCH RATE",
        btn_scan: "SCAN MARKET", btn_sell_charter: "SELL / CHARTER", panel_params: "PARAMETERS", panel_estim: "ESTIMATION",
        stat_profit: "Net Profit", btn_breakdown: "VIEW FULL BREAKDOWN", empty_state: "Awaiting Inputs...",
        modal_fin_title: "FINANCIAL BREAKDOWN", fin_rev: "REVENUE", fin_freight: "Gross Freight", fin_net: "NET REVENUE",
        fin_voy: "VOYAGE COSTS", fin_bunkers: "Bunkers", fin_port: "Port Charges", fin_canal: "Canal", fin_comm: "Commission",
        fin_opex: "OPEX", fin_daily_opex: "Daily OPEX", fin_profit: "NET PROFIT",
        sec_kb: "KNOWLEDGE BASE", sec_reg: "REGULATIONS", sec_doc: "DOCUMENT CENTER", sec_market: "GLOBAL SHIP MARKET",
        ai_welcome: "Hello Captain! I am VIYA AI. Systems Online.", chat_placeholder: "Ask me anything...",
        footer_rights: "© 2026 VIYA BROKER. All Rights Reserved.",
        btn_read: "READ", btn_download: "DOWNLOAD", btn_view: "DETAILS", btn_generate: "GENERATE"
    },
    tr: {
        landing_title: "YENİ NESİL DENİZCİLİK ZEKASI", landing_sub: "İleri Sefer Tahmini & Hukuki AI.",
        btn_login: "GİRİŞ", btn_enter_term: "TERMİNALE GİR", btn_learn_more: "DAHA FAZLA",
        nav_term: "Terminal", nav_market: "Pazar", nav_docstudio: "Doküman Stüdyosu", nav_kb: "Akademi", nav_reg: "Mevzuat", nav_docs: "Evraklar", nav_mem: "Üyelik",
        menu_home: "Anasayfa", menu_about: "Hakkımızda", menu_mission: "Misyon", menu_contact: "İletişim",
        lbl_vessel: "GEMİ TİPİ", lbl_port: "KONUM", lbl_speed: "HIZ", lbl_qty: "YÜK", lbl_lrate: "YÜKLEME HIZI", lbl_drate: "TAHLİYE HIZI",
        btn_scan: "PİYASAYI TARA", btn_sell_charter: "SAT / KİRALA", panel_params: "PARAMETRELER", panel_estim: "TAHMİN",
        stat_profit: "Net Kâr", btn_breakdown: "DETAYLI DÖKÜM", empty_state: "Veri Bekleniyor...",
        modal_fin_title: "FİNANSAL DÖKÜM", fin_rev: "GELİRLER", fin_freight: "Brüt Navlun", fin_net: "NET GELİR",
        fin_voy: "SEFER GİDERLERİ", fin_bunkers: "Yakıt", fin_port: "Liman", fin_canal: "Kanal", fin_comm: "Komisyon",
        fin_opex: "İŞLETME", fin_daily_opex: "Günlük OPEX", fin_profit: "NET KÂR",
        sec_kb: "BİLGİ BANKASI", sec_reg: "YÖNETMELİKLER", sec_doc: "DOKÜMAN MERKEZİ", sec_market: "GEMİ PAZARI",
        ai_welcome: "Merhaba Kaptan! Ben VIYA AI. Sistemler Aktif.", chat_placeholder: "Bana sor...",
        footer_rights: "© 2026 VIYA BROKER. Tüm Hakları Saklıdır.",
        btn_read: "OKU", btn_download: "İNDİR", btn_view: "DETAY", btn_generate: "OLUŞTUR"
    },
    de: { landing_title: "MARITIME INTELLIGENZ", btn_login: "ANMELDEN", ai_welcome: "Hallo Kapitän!" },
    fr: { landing_title: "INTELLIGENCE MARITIME", btn_login: "CONNEXION", ai_welcome: "Bonjour Capitaine!" },
    es: { landing_title: "INTELIGENCIA MARÍTIMA", btn_login: "ENTRAR", ai_welcome: "¡Hola Capitán!" },
    it: { landing_title: "INTELLIGENZA MARITTIMA", btn_login: "ACCEDI", ai_welcome: "Ciao Capitano!" },
    gr: { landing_title: "ΝΑΥΤΙΛΙΑΚΗ ΝΟΗΜΟΣΥΝΗ", btn_login: "ΣΥΝΔΕΣΗ", ai_welcome: "Γεια σας!" }
};

// ==========================================
// 1. INITIALIZATION
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
            // Chatbot'a başlangıç mesajı ekle (sadece bir kez)
            const chatBody = document.getElementById('chatBody');
            if (chatBody && chatBody.children.length === 0) {
                addChatMessage('ai', TRANSLATIONS[currentLang]?.ai_welcome || "Hello Captain! I'm VIYA AI, your maritime assistant. How can I help you today?");
            }
        }, 800);
    }
}

async function init() {
    console.log("⚓ VIYA SYSTEM V18.1 INITIALIZING...");
    try {
        initSocket();
        
        // Load Ports
        const pRes = await fetch('/api/ports');
        const ports = await pRes.json();
        const dl = document.getElementById('portList');
        if (dl) {
            dl.innerHTML = "";
            ports.forEach(p => { const o = document.createElement('option'); o.value = p; dl.appendChild(o); });
        }
        
        // Load Market Data
        await loadMarketData();
        
        // Load Content
        loadAcademy();
        loadDocs();
        loadRegulations();
        loadDocumentTemplates();
        loadMarketplaceListings();
        
    } catch (e) {
        console.error("Init Error:", e);
    }
}

async function loadMarketData() {
    try {
        const m = await (await fetch('/api/market')).json();
        const oilEl = document.getElementById('oilPrice');
        const vlsfoEl = document.getElementById('vlsfoPrice');
        const mgoEl = document.getElementById('mgoPrice');
        const srcEl = document.getElementById('dataSource');
        
        if (m.brent && oilEl) {
            oilEl.innerText = "$" + m.brent.toFixed(2);
            oilEl.style.color = m.source === 'SIMULATED' ? '#f59e0b' : '#4ade80';
        }
        if (m.vlsfo && vlsfoEl) vlsfoEl.innerText = "$" + m.vlsfo;
        if (m.mgo && mgoEl) mgoEl.innerText = "$" + m.mgo;
        if (srcEl) { srcEl.innerText = m.source === 'LIVE' ? ' 🟢' : ' 🟡'; srcEl.title = m.source; }
    } catch (e) { console.error("Market error:", e); }
}

window.onload = init;

// ==========================================
// 2. SOCKET.IO
// ==========================================
function initSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        if (currentUser) socket.emit('join_room', currentUser.id);
    });
    
    socket.on('new_message', (data) => {
        console.log('📩 New message:', data);
        if (currentChatUserId) displayMessage(data);
    });
    
    socket.on('incoming_call', async (data) => {
        console.log('📞 Incoming call from:', data.fromName);
        if (confirm(`${data.fromName} sizi arıyor. Kabul ediyor musunuz?`)) {
            currentChatUserId = data.from;
            currentChatUserName = data.fromName;
            await answerCall(data);
        }
    });
    
    socket.on('call_answered', async (data) => {
        console.log('✅ Call Answered! Setting remote description...');
        if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
    });
    
    socket.on('ice_candidate', async (data) => {
        console.log('🧊 Received ICE candidate');
        if (peerConnection && data.candidate) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                console.log('✅ Added remote ICE candidate');
            } catch (e) { console.error('ICE error:', e); }
        }
    });
    
    socket.on('call_ended', () => {
        console.log('📴 Call ended by remote');
        endVideoCall();
    });
    
    socket.on('user_joined_room', (data) => {
        console.log('👤 User joined:', data.userName);
        document.getElementById('remoteUserName').innerText = data.userName;
    });
    
    socket.on('disconnect', () => console.log('❌ Socket disconnected'));
}

// ==========================================
// 3. VIEW & LANGUAGE
// ==========================================
function switchView(id) {
    document.querySelectorAll('.view-section').forEach(e => e.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    const navMap = { 'dashboard': 0, 'marketplace': 1, 'document-studio': 2, 'academy': 3, 'regulations': 4, 'docs': 5, 'pricing': 6 };
    if (navMap[id] !== undefined) {
        const items = document.querySelectorAll('.nav-item');
        if (items[navMap[id]]) items[navMap[id]].classList.add('active');
    }
    
    // Harita boyutunu güncelle (dashboard ve calculator için)
    if (id === 'dashboard' && map) setTimeout(() => map.invalidateSize(), 100);
    if (id === 'calculator' && map) setTimeout(() => map.invalidateSize(), 100);
    if (id === 'marketplace') loadMarketplaceListings();
    if (id === 'news') loadNews();
}

function changeLanguage(lang) {
    currentLang = lang;
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        if (t[k]) el.innerText = t[k];
    });
    loadAcademy(); loadDocs(); loadRegulations();
}

// ==========================================
// 4. MAP & VOYAGE ENGINE
// ==========================================
const map = L.map('map', { zoomControl: false }).setView([34, 26], 3);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 10, attribution: 'VIYA MAPS' }).addTo(map);
L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

// Harita boyutunu başlangıçta ayarla
setTimeout(() => {
    if (map) map.invalidateSize();
}, 500);

// High Risk Area
L.polygon([[12.5, 43.5], [15.0, 55.0], [5.0, 60.0], [-5.0, 50.0], [0.0, 40.0]], {
    color: 'red', fillColor: '#f03', fillOpacity: 0.1, weight: 1, dashArray: '5, 10'
}).addTo(map).bindPopup("HIGH RISK AREA (HRA) - Piracy");

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
    shipLayer.clearLayers();
    L.circleMarker([lat, lng], { radius: 8, color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.8, weight: 2 })
        .addTo(shipLayer).bindPopup("VESSEL POSITION");
    map.setView([lat, lng], 5);
}

async function scanMarket() {
    const lat = parseFloat(document.getElementById('vLat').value);
    const lng = parseFloat(document.getElementById('vLng').value);
    
    if (isNaN(lat) || isNaN(lng)) { alert("Lütfen önce gemi konumunu girin!"); return; }
    
    updateShipMarker(lat, lng);
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'grid';
    
    try {
        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                shipLat: lat, shipLng: lng,
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
            alert(data.msg || "Kârlı sefer bulunamadı.");
        }
    } catch (e) {
        console.error(e);
        alert("Bağlantı hatası.");
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
        const profitClass = v.financials.profit > 0 ? 'text-green-400' : 'text-red-400';
        
        el.innerHTML = `
            <div class="ci-top">
                <span style="font-weight:bold;color:white;">${v.params.loadPort} → ${v.params.dischPort}</span>
                <span class="tce-badge">$${Math.floor(v.financials.tce).toLocaleString()}</span>
            </div>
            <div class="ci-bot">
                <span>${v.params.cargo} (${parseInt(v.params.qty / 1000)}k)</span>
                <span class="${profitClass}">$${Math.floor(v.financials.profit / 1000)}k</span>
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
    
    let distHTML = "";
    if (v.dist) {
        distHTML = `
            <div class="detail-row"><span class="d-lbl">Ballast</span><span class="d-val">${Math.floor(v.dist.ballast)} nm</span></div>
            <div class="detail-row"><span class="d-lbl">Laden</span><span class="d-val">${Math.floor(v.dist.laden)} nm</span></div>
            <div class="detail-row"><span class="d-lbl"><b>Total</b></span><span class="d-val"><b>${Math.floor(v.dist.total)} nm</b></span></div>
        `;
    }
    
    document.getElementById('financialDetails').innerHTML = `
        <div class="detail-row"><span class="d-lbl">Duration</span><span class="d-val">${v.duration.total} days</span></div>
        <div class="detail-row"><span class="d-lbl">Break-Even</span><span class="d-val">$${v.financials.breakEvenRate.toFixed(2)}/ton</span></div>
        <hr style="border-color:#334155;margin:8px 0;">
        ${distHTML}
    `;
    
    document.getElementById('aiOutput').innerHTML = v.aiAnalysis;
    
    // Update Map
    shipLayer.clearLayers();
    const shipPos = [document.getElementById('vLat').value, document.getElementById('vLng').value];
    const loadPos = [v.loadGeo?.lat || 0, v.loadGeo?.lng || 0];
    const dischPos = [v.dischGeo?.lat || 0, v.dischGeo?.lng || 0];
    
    L.circleMarker(shipPos, { radius: 8, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.8 }).addTo(shipLayer).bindPopup("<b>SHIP</b>");
    L.circleMarker(loadPos, { radius: 8, color: '#eab308', fillColor: '#eab308', fillOpacity: 0.8 }).addTo(shipLayer).bindPopup(`<b>LOAD:</b> ${v.params.loadPort}`);
    L.circleMarker(dischPos, { radius: 8, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.8 }).addTo(shipLayer).bindPopup(`<b>DISCH:</b> ${v.params.dischPort}`);
    
    map.fitBounds(L.latLngBounds([shipPos, loadPos, dischPos]), { padding: [50, 50] });
}

function showFinancials() {
    if (!currentVoyageData) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    const bd = currentVoyageData.breakdown;
    const vc = bd.voyage_costs;
    const ox = bd.opex;
    
    const html = `
        <table class="fin-table">
            <tr><th colspan="2" style="border-bottom:2px solid var(--neon-cyan)">${t.fin_rev || 'REVENUE'}</th></tr>
            <tr><td>${t.fin_freight || 'Freight'}</td><td class="text-green-400">$${Math.floor(bd.revenue).toLocaleString()}</td></tr>
            <tr class="fin-section-total"><td>${t.fin_net || 'NET'}</td><td>$${Math.floor(bd.revenue - vc.commission).toLocaleString()}</td></tr>
            
            <tr><th colspan="2" style="padding-top:20px;border-bottom:2px solid var(--neon-cyan)">${t.fin_voy || 'VOYAGE COSTS'}</th></tr>
            <tr><td>${t.fin_bunkers || 'Bunkers'}</td><td class="text-red-300">-$${Math.floor(vc.fuel.total).toLocaleString()}</td></tr>
            <tr><td>${t.fin_port || 'Port'}</td><td class="text-red-300">-$${Math.floor(vc.port.total).toLocaleString()}</td></tr>
            <tr><td>${t.fin_canal || 'Canal'} (${vc.cargo_canal.names || 'None'})</td><td class="text-red-300">-$${Math.floor(vc.cargo_canal.total).toLocaleString()}</td></tr>
            <tr><td>${t.fin_comm || 'Commission'}</td><td class="text-red-300">-$${Math.floor(vc.commission).toLocaleString()}</td></tr>
            
            <tr><th colspan="2" style="padding-top:20px;border-bottom:2px solid var(--neon-cyan)">${t.fin_opex || 'OPEX'}</th></tr>
            <tr><td>${t.fin_daily_opex || 'Daily'} ($${ox.daily})</td><td class="text-orange-300">-$${Math.floor(ox.total).toLocaleString()}</td></tr>
            
            <tr class="fin-grand-total">
                <td>${t.fin_profit || 'NET PROFIT'}</td>
                <td style="color:${currentVoyageData.financials.profit > 0 ? '#4ade80' : '#ef4444'}">$${Math.floor(currentVoyageData.financials.profit).toLocaleString()}</td>
            </tr>
        </table>`;
    
    document.getElementById('finBody').innerHTML = html;
    document.getElementById('finModal').style.display = 'block';
}

// ==========================================
// 5. MARKETPLACE
// ==========================================
async function loadMarketplaceListings() {
    const grid = document.getElementById('marketplaceGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div style="text-align:center;color:#64748b;padding:50px;">Loading vessels...</div>';
    
    try {
        const type = document.getElementById('filterType')?.value || '';
        const priceType = document.getElementById('filterPriceType')?.value || '';
        const minDwt = document.getElementById('filterMinDwt')?.value || '';
        const maxDwt = document.getElementById('filterMaxDwt')?.value || '';
        
        let url = '/api/marketplace/listings?';
        if (type) url += `type=${type}&`;
        if (priceType) url += `priceType=${priceType}&`;
        if (minDwt) url += `minDwt=${minDwt}&`;
        if (maxDwt) url += `maxDwt=${maxDwt}&`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.success || !data.listings || data.listings.length === 0) {
            grid.innerHTML = '<div style="text-align:center;color:#64748b;padding:50px;">No vessels listed. Be the first!</div>';
            return;
        }
        
        grid.innerHTML = '';
        
        data.listings.forEach(vessel => {
            const card = document.createElement('div');
            card.className = 'doc-card vessel-card';
            
            const priceText = vessel.priceType === 'SALE' ? `$${(vessel.price / 1000000).toFixed(2)}M` : `$${vessel.price.toLocaleString()}/day`;
            const typeLabel = vessel.priceType === 'SALE' ? 'FOR SALE' : vessel.priceType === 'TIME_CHARTER' ? 'TIME CHARTER' : 'VOYAGE CHARTER';
            
            card.innerHTML = `
                <div class="vessel-image">
                    ${vessel.images && vessel.images[0] ? `<img src="${vessel.images[0]}" alt="${vessel.vesselName}">` : '<i class="fa-solid fa-ship"></i>'}
                    <span class="vessel-type-badge">${typeLabel}</span>
                </div>
                <div class="doc-title">${vessel.vesselName}</div>
                <div class="doc-desc">${vessel.vesselType} | ${vessel.dwt.toLocaleString()} DWT</div>
                <div style="color:#94a3b8;font-size:0.8rem;">Built: ${vessel.yearBuilt} | ${vessel.flag}</div>
                <div style="color:var(--neon-gold);font-weight:bold;font-size:1.1rem;margin:10px 0;">${priceText}</div>
                <button class="btn-download" onclick="openVesselDetail('${vessel._id}')"><i class="fa-solid fa-eye"></i> VIEW</button>
            `;
            grid.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        grid.innerHTML = '<div style="text-align:center;color:#ef4444;">Failed to load.</div>';
    }
}

function openCreateListingModal() {
    if (!currentUser) { alert('Lütfen giriş yapın.'); openAuthModal(); return; }
    
    document.getElementById('listVesselName').value = '';
    document.getElementById('listDWT').value = '';
    document.getElementById('listYear').value = '';
    document.getElementById('listFlag').value = '';
    document.getElementById('listIMO').value = '';
    document.getElementById('listPrice').value = '';
    document.getElementById('listDescription').value = '';
    document.getElementById('listLocation').value = '';
    document.getElementById('imagePreview').innerHTML = '';
    uploadedImages = [];
    
    document.getElementById('createListingModal').style.display = 'block';
}

function toggleCharterFields() {
    const priceType = document.getElementById('listPriceType').value;
    const durationField = document.getElementById('charterDurationField');
    const priceLabel = document.getElementById('priceLabel');
    
    if (priceType === 'SALE') {
        durationField.style.display = 'none';
        priceLabel.innerText = 'Price (USD) *';
    } else {
        durationField.style.display = 'block';
        priceLabel.innerText = 'Daily Rate (USD) *';
    }
}

function handleImageUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    uploadedImages = [];
    
    Array.from(files).slice(0, 4).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImages.push(e.target.result);
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'width:100%;height:80px;object-fit:cover;border:1px solid #333;border-radius:4px;';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

async function submitListing() {
    const token = localStorage.getItem('viya_token');
    if (!token) { alert('Lütfen giriş yapın.'); return; }
    
    const vesselName = document.getElementById('listVesselName').value;
    const vesselType = document.getElementById('listVesselType').value;
    const dwt = parseInt(document.getElementById('listDWT').value);
    const yearBuilt = parseInt(document.getElementById('listYear').value);
    const flag = document.getElementById('listFlag').value;
    const imoNumber = document.getElementById('listIMO').value;
    const price = parseFloat(document.getElementById('listPrice').value);
    const priceType = document.getElementById('listPriceType').value;
    const charterDuration = document.getElementById('listCharterDuration')?.value;
    const description = document.getElementById('listDescription').value;
    const currentLocation = document.getElementById('listLocation').value;
    
    if (!vesselName || !dwt || !yearBuilt || !flag || !price) {
        alert('Lütfen zorunlu alanları doldurun.');
        return;
    }
    
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'grid';
    
    try {
        const res = await fetch('/api/marketplace/create-listing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ vesselName, vesselType, dwt, yearBuilt, flag, imoNumber, price, priceType, charterDuration, description, currentLocation, images: uploadedImages })
        });
        
        const data = await res.json();
        
        if (data.success) {
            alert('İlan başarıyla oluşturuldu!');
            closeModal('createListingModal');
            loadMarketplaceListings();
        } else {
            alert('Hata: ' + (data.error || 'Bilinmeyen'));
        }
    } catch (e) {
        console.error(e);
        alert('Bağlantı hatası.');
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

async function openVesselDetail(listingId) {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'grid';
    
    try {
        const res = await fetch(`/api/marketplace/listing/${listingId}`);
        const data = await res.json();
        
        if (!data.success) { alert('Gemi bulunamadı.'); return; }
        
        const vessel = data.listing;
        document.getElementById('vesselDetailTitle').innerText = vessel.vesselName;
        
        const priceText = vessel.priceType === 'SALE' ? `Sale: $${(vessel.price / 1000000).toFixed(2)}M` : `Charter: $${vessel.price.toLocaleString()}/day`;
        
        let imagesHTML = '';
        if (vessel.images && vessel.images.length > 0) {
            imagesHTML = `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px;">`;
            vessel.images.forEach(img => { imagesHTML += `<img src="${img}" style="width:100%;height:180px;object-fit:cover;border:1px solid #333;border-radius:8px;">`; });
            imagesHTML += `</div>`;
        }
        
        document.getElementById('vesselDetailBody').innerHTML = `
            ${imagesHTML}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:20px;">
                <div><strong style="color:#94a3b8;">Type:</strong> ${vessel.vesselType}</div>
                <div><strong style="color:#94a3b8;">DWT:</strong> ${vessel.dwt.toLocaleString()} MT</div>
                <div><strong style="color:#94a3b8;">Built:</strong> ${vessel.yearBuilt}</div>
                <div><strong style="color:#94a3b8;">Flag:</strong> ${vessel.flag}</div>
                <div><strong style="color:#94a3b8;">IMO:</strong> ${vessel.imoNumber || 'N/A'}</div>
                <div><strong style="color:#94a3b8;">Views:</strong> ${vessel.views}</div>
            </div>
            <div style="background:#0a0a0a;border:1px solid var(--neon-gold);padding:15px;margin-bottom:20px;border-radius:8px;">
                <strong style="color:var(--neon-gold);font-size:1.2rem;">${priceText}</strong>
            </div>
            <div style="margin-bottom:20px;"><strong style="color:#fff;">Description:</strong><p style="color:#94a3b8;margin-top:10px;">${vessel.description || 'No description.'}</p></div>
            <div style="background:#0a0a0a;border:1px solid #333;padding:15px;border-radius:8px;">
                <strong style="color:#fff;">Seller:</strong> ${vessel.sellerName}<br><strong style="color:#fff;">Contact:</strong> ${vessel.sellerEmail}
            </div>
            ${currentUser && currentUser.id !== vessel.seller ? `
                <div style="display:flex;gap:10px;margin-top:20px;">
                    <button class="btn-action" onclick="openChat('${vessel.seller}', '${vessel.sellerName}', '${vessel._id}')" style="flex:1;"><i class="fa-solid fa-comments"></i> MESSAGE</button>
                    <button class="btn-action" onclick="startVideoCall()" style="flex:1;background:var(--neon-gold);color:#000;"><i class="fa-solid fa-video"></i> VIDEO</button>
                </div>
            ` : ''}
        `;
        
        document.getElementById('vesselDetailModal').style.display = 'block';
    } catch (e) {
        console.error(e);
        alert('Hata oluştu.');
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

function viewMyListings() { closeModal('profileModal'); switchView('marketplace'); }

// ==========================================
// 6. MESSAGING
// ==========================================
async function openChat(userId, userName, vesselId) {
    if (!currentUser) { alert('Lütfen giriş yapın.'); return; }
    
    console.log('💬 Opening chat with:', { userId, userName, currentUser: currentUser.id });
    
    currentChatUserId = userId;
    currentChatUserName = userName;
    currentChatVesselId = vesselId;
    
    document.getElementById('chatWithName').innerText = `Chat: ${userName}`;
    document.getElementById('messageHistory').innerHTML = '<div style="text-align:center;color:#64748b;padding:20px;">Loading messages...</div>';
    document.getElementById('messagingModal').style.display = 'block';
    
    try {
        const token = localStorage.getItem('viya_token');
        const res = await fetch(`/api/messages/conversation/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        
        console.log('📬 Loaded messages:', data);
        
        const history = document.getElementById('messageHistory');
        history.innerHTML = '';
        
        if (data.success && data.messages && data.messages.length > 0) {
            console.log(`✅ Displaying ${data.messages.length} messages`);
            data.messages.forEach(msg => displayMessage(msg));
        } else {
            console.log('ℹ️ No messages found');
            history.innerHTML = '<div style="text-align:center;color:#64748b;padding:20px;">Henüz mesaj yok. İlk mesajı siz gönderin!</div>';
        }
        
        // Scroll to bottom with animation
        setTimeout(() => {
            history.scrollTop = history.scrollHeight;
        }, 200);
    } catch (e) { 
        console.error('❌ Error loading messages:', e);
        const history = document.getElementById('messageHistory');
        history.innerHTML = '<div style="text-align:center;color:#ef4444;padding:20px;">Mesajlar yüklenirken hata oluştu.</div>';
    }
}

function displayMessage(msg) {
    const history = document.getElementById('messageHistory');
    if (!history) {
        console.error('❌ messageHistory element not found!');
        return;
    }
    
    // Loading yazısını temizle
    const loadingDiv = history.querySelector('div[style*="text-align:center"]');
    if (loadingDiv && loadingDiv.textContent.includes('Loading')) {
        history.innerHTML = '';
    }
    
    // Debug log
    console.log('📨 Display Message:', {
        message: msg.message,
        from: msg.from,
        fromName: msg.fromName,
        currentUserId: currentUser?.id,
        timestamp: msg.timestamp
    });
    
    // currentUser kontrolü - DETAYLI
    let isOwn = false;
    if (currentUser) {
        const msgFrom = typeof msg.from === 'object' ? msg.from._id : msg.from;
        const userId = typeof currentUser.id === 'object' ? currentUser.id._id : currentUser.id;
        
        if (msgFrom === userId || 
            msgFrom?.toString() === userId?.toString() ||
            msg.from === currentUser.email) {
            isOwn = true;
        }
    }
    
    console.log(`   → isOwn: ${isOwn}`);
    
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message-item';
    msgDiv.style.cssText = `
        margin-bottom: 12px; 
        text-align: ${isOwn ? 'right' : 'left'};
        animation: messageSlideIn 0.3s ease;
    `;
    
    msgDiv.innerHTML = `
        <div style="
            display: inline-block; 
            max-width: 70%; 
            background: ${isOwn ? '#1e3a8a' : '#1a1a1a'}; 
            padding: 12px 16px; 
            border-radius: ${isOwn ? '12px 12px 4px 12px' : '12px 12px 12px 4px'};
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
            <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 6px; font-weight: 600;">
                ${isOwn ? 'You' : (msg.fromName || 'User')}
            </div>
            <div style="color: #fff; line-height: 1.5; word-wrap: break-word;">
                ${msg.message}
            </div>
            <div style="font-size: 0.7rem; color: #64748b; margin-top: 6px;">
                ${new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>
    `;
    
    history.appendChild(msgDiv);
    
    // Smooth scroll to bottom
    setTimeout(() => {
        history.scrollTop = history.scrollHeight;
    }, 100);
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (!message) return;
    
    const token = localStorage.getItem('viya_token');
    if (!token) return;
    
    try {
        const res = await fetch('/api/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ toUserId: currentChatUserId, message: message, vesselListingId: currentChatVesselId })
        });
        
        const data = await res.json();
        
        if (data.success) {
            displayMessage({ ...data.message, from: currentUser.id });
            input.value = '';
            socket.emit('send_message', { toUserId: currentChatUserId, message: message, fromName: currentUser.fullName });
        }
    } catch (e) { console.error(e); }
}

async function openInbox() {
    if (!currentUser) return;
    
    document.getElementById('inboxContent').innerHTML = '<div style="text-align:center;color:#64748b;">Loading...</div>';
    document.getElementById('inboxModal').style.display = 'block';
    
    try {
        const token = localStorage.getItem('viya_token');
        const res = await fetch('/api/messages/inbox', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const content = document.getElementById('inboxContent');
        
        if (!data.success || !data.conversations || data.conversations.length === 0) {
            content.innerHTML = '<div style="text-align:center;color:#64748b;padding:30px;">No messages yet.</div>';
            return;
        }
        
        content.innerHTML = '';
        data.conversations.forEach(conv => {
            const item = document.createElement('div');
            item.style.cssText = 'padding:15px;border-bottom:1px solid #333;cursor:pointer;';
            item.onmouseover = () => item.style.background = 'rgba(0,242,255,0.05)';
            item.onmouseout = () => item.style.background = 'transparent';
            
            const otherUser = conv.lastMessage.from === currentUser.id ? conv.lastMessage.toName : conv.lastMessage.fromName;
            
            item.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="color:#fff;font-weight:bold;">${otherUser}</div>
                        <div style="color:#94a3b8;font-size:0.85rem;margin-top:5px;">${conv.lastMessage.message.substring(0, 50)}...</div>
                    </div>
                    ${conv.unreadCount > 0 ? `<span style="background:var(--neon-cyan);color:#000;padding:2px 8px;border-radius:10px;font-size:0.8rem;">${conv.unreadCount}</span>` : ''}
                </div>
            `;
            
            item.onclick = () => { closeModal('inboxModal'); openChat(conv._id, otherUser, null); };
            content.appendChild(item);
        });
    } catch (e) { console.error(e); }
}

// ==========================================
// 7. VIDEO CALL (WebRTC)
// ==========================================
async function startVideoCall() {
    if (!currentUser) { alert('Lütfen giriş yapın.'); return; }
    if (!currentChatUserId) { alert('Önce bir kullanıcıyla sohbet başlatın.'); return; }
    
    console.log('📹 Starting Call...');
    
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('localVideo').srcObject = localStream;
        
        const token = localStorage.getItem('viya_token');
        const roomRes = await fetch('/api/video/create-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ vesselListingId: currentChatVesselId })
        });
        
        const roomData = await roomRes.json();
        if (!roomData.success) { alert('Room oluşturulamadı.'); return; }
        
        currentRoomId = roomData.room.roomId;
        document.getElementById('currentRoomId').innerText = currentRoomId;
        document.getElementById('videoCallModal').style.display = 'block';
        closeModal('messagingModal');
        
        await createPeerConnection();
        
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        console.log('📤 Sending Offer...');
        socket.emit('call_user', { toUserId: currentChatUserId, from: currentUser.id, fromName: currentUser.fullName, roomId: currentRoomId, offer: offer });
        
    } catch (e) {
        console.error('Video error:', e);
        alert('Kamera/mikrofon hatası: ' + e.message);
    }
}

async function answerCall(data) {
    console.log('📞 Answering Call...');
    
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('localVideo').srcObject = localStream;
        
        currentRoomId = data.roomId;
        document.getElementById('currentRoomId').innerText = currentRoomId;
        document.getElementById('remoteUserName').innerText = data.fromName;
        document.getElementById('videoCallModal').style.display = 'block';
        
        await createPeerConnection();
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        console.log('📤 Sending Answer...');
        socket.emit('answer_call', { toUserId: data.from, answer: answer });
        
    } catch (e) { console.error('Answer error:', e); }
}

async function createPeerConnection() {
    peerConnection = new RTCPeerConnection(ICE_SERVERS);
    
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    
    peerConnection.ontrack = (event) => {
        console.log('🎥 Remote stream received!');
        document.getElementById('remoteVideo').srcObject = event.streams[0];
    };
    
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('🧊 Sending ICE candidate...');
            socket.emit('ice_candidate', { toUserId: currentChatUserId, candidate: event.candidate });
        }
    };
    
    peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE state:', peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === 'connected') {
            document.getElementById('remoteUserName').innerText = currentChatUserName || 'Connected';
        }
    };
}

function toggleMute() {
    if (!localStream) return;
    isMuted = !isMuted;
    localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
    document.getElementById('muteBtn').innerHTML = isMuted ? '<i class="fa-solid fa-microphone-slash"></i>' : '<i class="fa-solid fa-microphone"></i>';
}

function toggleVideo() {
    if (!localStream) return;
    isVideoOff = !isVideoOff;
    localStream.getVideoTracks().forEach(track => track.enabled = !isVideoOff);
    document.getElementById('videoBtn').innerHTML = isVideoOff ? '<i class="fa-solid fa-video-slash"></i>' : '<i class="fa-solid fa-video"></i>';
}

async function shareScreen() {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
        screenTrack.onended = () => {
            const videoTrack = localStream.getVideoTracks()[0];
            if (sender && videoTrack) sender.replaceTrack(videoTrack);
        };
    } catch (e) { console.error('Screen share error:', e); }
}

function endVideoCall() {
    console.log('📴 Ending call...');
    if (socket && currentChatUserId) socket.emit('end_call', { toUserId: currentChatUserId, from: currentUser?.id });
    if (peerConnection) { peerConnection.close(); peerConnection = null; }
    if (localStream) { localStream.getTracks().forEach(track => track.stop()); localStream = null; }
    document.getElementById('localVideo').srcObject = null;
    document.getElementById('remoteVideo').srcObject = null;
    document.getElementById('videoCallModal').style.display = 'none';
    isMuted = false; isVideoOff = false; currentRoomId = null;
}

function copyRoomLink() {
    navigator.clipboard.writeText(`${window.location.origin}?room=${currentRoomId}`);
    alert('Link kopyalandı!');
}

// ==========================================
// 8. DOCUMENT STUDIO
// ==========================================
async function loadDocumentTemplates() {
    try {
        const res = await fetch('/api/document-templates');
        const data = await res.json();
        if (!data.success || !data.templates) return;
        
        const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
        const weather = data.templates.filter(x => x.category === 'Weather Related');
        const cargo = data.templates.filter(x => x.category === 'Cargo Issues');
        const port = data.templates.filter(x => x.category === 'Port/Terminal');
        const laytime = data.templates.filter(x => x.category === 'Laytime Disputes');
        const bunker = data.templates.filter(x => x.category === 'Bunker Quality');
        
        renderTemplateCards('weatherTemplates', weather, t);
        renderTemplateCards('cargoTemplates', cargo, t);
        renderTemplateCards('portTemplates', port, t);
        renderTemplateCards('laytimeTemplates', laytime, t);
        renderTemplateCards('bunkerTemplates', bunker, t);
    } catch (e) { console.error('Template error:', e); }
}

function renderTemplateCards(containerId, templates, t) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    templates.forEach(tmpl => {
        const card = document.createElement('div');
        card.className = 'doc-card';
        card.innerHTML = `
            <i class="fa-solid fa-file-contract doc-icon" style="color:var(--neon-cyan)"></i>
            <div class="doc-title">${tmpl.title}</div>
            <div class="doc-desc">${tmpl.category}</div>
            <button class="btn-download" onclick="openDocGenerator('${tmpl.type}', '${tmpl.templateKey}', '${tmpl.title.replace(/'/g, "\\'")}')">
                <i class="fa-solid fa-wand-magic-sparkles"></i> ${t.btn_generate || 'GENERATE'}
            </button>
        `;
        container.appendChild(card);
    });
}

function openDocGenerator(templateType, templateKey, templateTitle) {
    currentTemplateType = templateType;
    currentTemplateKey = templateKey;
    document.getElementById('docGenTitle').innerText = templateTitle;
    document.getElementById('docGenForm').style.display = 'block';
    document.getElementById('generatedDocArea').style.display = 'none';
    document.getElementById('genVesselName').value = '';
    document.getElementById('genIMO').value = '';
    document.getElementById('genLoadPort').value = '';
    document.getElementById('genDischPort').value = '';
    document.getElementById('genCargo').value = '';
    document.getElementById('genQty').value = '';
    document.getElementById('docGeneratorModal').style.display = 'block';
}

async function generateDocument() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'grid';
    
    const userInputs = {
        VESSEL_NAME: document.getElementById('genVesselName').value || 'TO BE COMPLETED',
        IMO_NUMBER: document.getElementById('genIMO').value || 'XXXXXXX',
        LOAD_PORT: document.getElementById('genLoadPort').value || 'TO BE COMPLETED',
        DISCHARGE_PORT: document.getElementById('genDischPort').value || 'TO BE COMPLETED',
        CARGO_TYPE: document.getElementById('genCargo').value || 'TO BE COMPLETED',
        CARGO_QUANTITY: document.getElementById('genQty').value || 'XXXXX',
        DATE: new Date().toLocaleDateString('en-GB'),
        CHARTERERS_NAME: 'TO BE COMPLETED BY USER'
    };
    
    try {
        const res = await fetch('/api/generate-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ templateType: currentTemplateType, templateKey: currentTemplateKey, userInputs: userInputs })
        });
        
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('docGenForm').style.display = 'none';
            document.getElementById('generatedDocArea').style.display = 'block';
            document.getElementById('docOutput').value = data.document;
        } else {
            alert('Hata: ' + (data.error || 'Bilinmeyen'));
        }
    } catch (e) { console.error(e); alert('Bağlantı hatası.'); }
    finally { if (loader) loader.style.display = 'none'; }
}

function downloadGeneratedDoc() {
    const content = document.getElementById('docOutput').value;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VIYA_${currentTemplateKey}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function copyToClipboard() {
    document.getElementById('docOutput').select();
    document.execCommand('copy');
    alert('Panoya kopyalandı!');
}

// ==========================================
// 9. CONTENT LOADERS
// ==========================================
function openContentModal(title, content) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('docModal').style.display = 'block';
}

function loadAcademy() {
    const aGrid = document.getElementById('academyGrid');
    if (!aGrid) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    aGrid.innerHTML = '';
    
    const data = [
        { 
            icon: "fa-clock", 
            title: "Laytime & Demurrage Fundamentals", 
            desc: "SHINC, SHEX, Running Days & Time Management",
            level: "Beginner",
            duration: "2.5 hours",
            content: `<h3>Laytime & Demurrage: Complete Guide</h3>
            
            <h4>📌 What is Laytime?</h4>
            <p>Laytime is the permitted time allocated by the Charterer to the Shipowner for loading and discharging cargo. It represents one of the most critical commercial aspects of voyage charter parties.</p>
            
            <h4>⏱️ Types of Laytime Terms:</h4>
            <ul>
                <li><strong>SHINC (Sundays & Holidays Included):</strong> All days count including Sundays and holidays</li>
                <li><strong>SHEX (Sundays & Holidays Excluded):</strong> These days do not count towards laytime</li>
                <li><strong>SHEXEIU (SHEX Even If Used):</strong> Sundays/holidays excluded even if vessel works</li>
                <li><strong>Weather Working Days (WWD):</strong> Only days when weather permits work</li>
                <li><strong>Running Days:</strong> All days count, no exceptions (24/7 operation)</li>
            </ul>
            
            <h4>💰 Demurrage & Despatch</h4>
            <p><strong>Demurrage:</strong> Liquidated damages paid by Charterer when loading/discharging exceeds agreed laytime. Rate typically stated as USD per day or pro rata.</p>
            <p><strong>Despatch:</strong> Bonus paid by Owner to Charterer for completing operations faster than permitted laytime. Usually calculated at 50% of demurrage rate.</p>
            
            <h4>🔢 Calculation Example:</h4>
            <div style="background:#f1f5f9;padding:15px;border-radius:8px;margin:10px 0;">
                <strong>Vessel:</strong> M/V VIYA STAR<br>
                <strong>Cargo:</strong> 50,000 MT Grain<br>
                <strong>Loading Rate:</strong> 15,000 MT PDPR (Per Day Per Running)<br>
                <strong>Laytime Allowed:</strong> 50,000 ÷ 15,000 = 3.33 days<br>
                <strong>Actual Time Used:</strong> 4.5 days<br>
                <strong>Demurrage Rate:</strong> $25,000/day<br>
                <strong>Demurrage Due:</strong> (4.5 - 3.33) × $25,000 = <strong>$29,250</strong>
            </div>
            
            <h4>⚖️ Legal Considerations</h4>
            <p>Laytime disputes are among the most common in shipping. Key principles established by case law (Hague Rules, Maredelanto, Darrah).</p>`
        },
        { 
            icon: "fa-globe", 
            title: "INCOTERMS® 2020", 
            desc: "International Commercial Terms - FOB, CIF, CFR, DAP, DDP",
            level: "Intermediate",
            duration: "3 hours",
            content: `<h3>INCOTERMS® 2020: Complete Reference Guide</h3>
            
            <h4>🌍 What are INCOTERMS?</h4>
            <p>International Commercial Terms published by ICC (International Chamber of Commerce). Define responsibilities, costs, and risks between buyers and sellers in international trade.</p>
            
            <h4>📦 The 11 INCOTERMS® 2020:</h4>
            
            <div style="background:#e6f0ff;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>🚢 RULES FOR ANY MODE OF TRANSPORT:</h5>
                <ul>
                    <li><strong>EXW (Ex Works):</strong> Seller makes goods available at their premises. Buyer bears all costs/risks.</li>
                    <li><strong>FCA (Free Carrier):</strong> Seller delivers goods to carrier nominated by buyer.</li>
                    <li><strong>CPT (Carriage Paid To):</strong> Seller pays freight to destination, risk transfers at delivery to carrier.</li>
                    <li><strong>CIP (Carriage & Insurance Paid):</strong> Like CPT but seller must obtain insurance (110% value).</li>
                    <li><strong>DAP (Delivered At Place):</strong> Seller delivers when goods available for unloading at destination.</li>
                    <li><strong>DPU (Delivered at Place Unloaded):</strong> Seller delivers & unloads at named place.</li>
                    <li><strong>DDP (Delivered Duty Paid):</strong> Seller bears all costs including import duties.</li>
                </ul>
            </div>
            
            <div style="background:#fef3c7;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>⚓ SEA & INLAND WATERWAY TRANSPORT ONLY:</h5>
                <ul>
                    <li><strong>FAS (Free Alongside Ship):</strong> Seller delivers when goods placed alongside vessel.</li>
                    <li><strong>FOB (Free On Board):</strong> Seller delivers when goods pass ship's rail. Most common in bulk shipping.</li>
                    <li><strong>CFR (Cost & Freight):</strong> Seller pays freight but risk transfers at FOB point.</li>
                    <li><strong>CIF (Cost, Insurance & Freight):</strong> Like CFR but seller must obtain marine insurance (110% value).</li>
                </ul>
            </div>
            
            <h4>📊 FOB vs CIF Comparison Table:</h4>
            <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                <tr style="background:#1e293b;color:white;">
                    <th style="padding:10px;border:1px solid #334155;">Aspect</th>
                    <th style="padding:10px;border:1px solid #334155;">FOB</th>
                    <th style="padding:10px;border:1px solid #334155;">CIF</th>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Freight Payment</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Buyer pays</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Seller pays</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;">Insurance</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Buyer arranges</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Seller provides (110% value)</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Risk Transfer</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">When goods pass ship's rail</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">When goods pass ship's rail</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;">Best for</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Buyers with own freight contracts</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Buyers preferring convenience</td>
                </tr>
            </table>
            
            <h4>⚠️ Common Mistakes to Avoid:</h4>
            <p>1. Using maritime-only terms (FOB, CFR, CIF) for containerized cargo<br>
            2. Confusing risk transfer with cost transfer<br>
            3. Not specifying the exact named place clearly<br>
            4. Assuming INCOTERMS cover payment terms (they don't!)</p>`
        },
        { 
            icon: "fa-file-contract", 
            title: "Charter Party Agreements", 
            desc: "GENCON, NYPE, SHELLVOY - Types & Clauses",
            level: "Advanced",
            duration: "4 hours",
            content: `<h3>Charter Party Agreements: Master Guide</h3>
            
            <h4>📄 What is a Charter Party (C/P)?</h4>
            <p>A Charter Party is a maritime contract between a Shipowner and a Charterer for the hire of a vessel. It's one of the oldest forms of commercial contracts, dating back to medieval times.</p>
            
            <h4>🚢 Three Main Types:</h4>
            
            <div style="background:#d1fae5;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>1️⃣ VOYAGE CHARTER (VC)</h5>
                <p><strong>Definition:</strong> Ship hired for specific voyage(s) from A to B</p>
                <p><strong>Payment:</strong> Freight per ton or lumpsum</p>
                <p><strong>Common Forms:</strong> GENCON 94/2015, BPVOY4</p>
                <p><strong>Owner Responsibility:</strong> All vessel operating costs (fuel, port charges, crew)</p>
                <p><strong>Charterer Responsibility:</strong> Cargo operations, cargo insurance, laytime/demurrage</p>
                <p><strong>Best For:</strong> Single cargo movements, spot market</p>
            </div>
            
            <div style="background:#fef3c7;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>2️⃣ TIME CHARTER (TC)</h5>
                <p><strong>Definition:</strong> Ship hired for specific period (e.g., 6 months - 5 years)</p>
                <p><strong>Payment:</strong> Daily/monthly hire rate</p>
                <p><strong>Common Forms:</strong> NYPE 2015, BALTIME 1939/2001</p>
                <p><strong>Owner Responsibility:</strong> Crew, maintenance, insurance, stores</p>
                <p><strong>Charterer Responsibility:</strong> Fuel, port charges, canal dues, cargo operations</p>
                <p><strong>Best For:</strong> Regular trades, industrial cargo owners</p>
            </div>
            
            <div style="background:#e0e7ff;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>3️⃣ BAREBOAT/DEMISE CHARTER (BBC)</h5>
                <p><strong>Definition:</strong> Charterer takes complete control, like renting a car</p>
                <p><strong>Payment:</strong> Monthly hire</p>
                <p><strong>Common Forms:</strong> BARECON 2017</p>
                <p><strong>Owner Responsibility:</strong> Provide empty vessel only</p>
                <p><strong>Charterer Responsibility:</strong> Everything! (crew, insurance, maintenance, operations)</p>
                <p><strong>Best For:</strong> Long-term arrangements, purchase financing</p>
            </div>
            
            <h4>📋 Essential Charter Party Clauses:</h4>
            <ul style="line-height:1.8;">
                <li><strong>Description Clause:</strong> Vessel name, flag, class, capacity, speed/consumption</li>
                <li><strong>Period/Voyage Clause:</strong> Duration or voyage details</li>
                <li><strong>Hire/Freight Clause:</strong> Rate and payment terms</li>
                <li><strong>Off-Hire Clause:</strong> When charterer doesn't pay (TC only)</li>
                <li><strong>Withdrawal Clause:</strong> Owner's right to withdraw vessel for non-payment</li>
                <li><strong>Laytime Clause:</strong> Permitted loading/discharging time (VC only)</li>
                <li><strong>Cancelling Clause:</strong> Latest delivery date</li>
                <li><strong>War/Ice Clauses:</strong> Special circumstances provisions</li>
                <li><strong>BIMCO Clauses:</strong> Sanctions, cyber, pandemic</li>
            </ul>
            
            <h4>⚖️ GENCON vs NYPE Quick Reference:</h4>
            <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                <tr style="background:#1e293b;color:white;">
                    <th style="padding:10px;border:1px solid #334155;">Feature</th>
                    <th style="padding:10px;border:1px solid #334155;">GENCON (Voyage)</th>
                    <th style="padding:10px;border:1px solid #334155;">NYPE (Time)</th>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Charter Duration</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Single voyage</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Time period</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;">Fuel Costs</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Owner pays</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Charterer pays</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Port Charges</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Owner pays</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Charterer pays</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;">Commercial Control</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Owner has master</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Charterer directs</td>
                </tr>
            </table>
            
            <h4>💡 Pro Tips:</h4>
            <p>• Always use BIMCO standard forms - widely recognized and legally tested<br>
            • Don't alter printed clauses heavily - causes interpretation issues<br>
            • Use typed addendums for special terms<br>
            • "Time lost waiting for berth counts as laytime" - Wipon clause<br>
            • NYPE 2015 > NYPE 1946/93 - more modern and balanced</p>`
        },
        { 
            icon: "fa-anchor", 
            title: "Port Operations & NOR", 
            desc: "Notice of Readiness, Port Procedures, Statements of Facts",
            level: "Intermediate",
            duration: "2 hours",
            content: `<h3>Port Operations & Notice of Readiness</h3>
            
            <h4>📍 Port Arrival Procedures</h4>
            <p>When a vessel arrives at load or discharge port, a specific sequence of events must occur. Understanding this process is crucial for laytime calculation and avoiding disputes.</p>
            
            <h4>📝 Notice of Readiness (NOR)</h4>
            <p><strong>Definition:</strong> Official notice from Master to Charterer/Shipper/Receiver that vessel has arrived and is ready to load/discharge in all respects.</p>
            
            <div style="background:#e6f0ff;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>NOR Must State:</h5>
                <ul>
                    <li>✓ Vessel name and flag</li>
                    <li>✓ Date and time of tendering</li>
                    <li>✓ Location (anchorage, berth, port limits)</li>
                    <li>✓ Cargo details</li>
                    <li>✓ Confirmation vessel is ready in all respects</li>
                    <li>✓ Contact details (Master, Agent)</li>
                </ul>
            </div>
            
            <h4>⏰ When Does Laytime Start?</h4>
            <p>Laytime typically commences when:</p>
            <ol>
                <li>Valid NOR tendered</li>
                <li>Vessel arrives at specified location (berth/anchorage)</li>
                <li>Notice period expires (e.g., "6 hours after NOR")</li>
                <li>If WIBON clause: "Whether in berth or not"</li>
                <li>If WCCON clause: "Whether customs cleared or not"</li>
            </ol>
            
            <h4>📊 Statement of Facts (SOF)</h4>
            <p>Detailed chronological record of all port operations. Critical document for laytime/demurrage calculations.</p>
            
            <div style="background:#fef3c7;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>SOF Includes:</h5>
                <table style="width:100%;line-height:1.8;">
                    <tr><td><strong>Arrival Time:</strong></td><td>Date/time vessel anchored or berthed</td></tr>
                    <tr><td><strong>NOR Tendered:</strong></td><td>When and where notice given</td></tr>
                    <tr><td><strong>Commenced Loading:</strong></td><td>First cargo on board</td></tr>
                    <tr><td><strong>Interruptions:</strong></td><td>Weather, breakdown, waiting time</td></tr>
                    <tr><td><strong>Completed Loading:</strong></td><td>Last cargo loaded</td></tr>
                    <tr><td><strong>Departure:</strong></td><td>Cast off time</td></tr>
                </table>
            </div>
            
            <h4>🚫 Common NOR Rejection Reasons:</h4>
            <ul>
                <li>Vessel not physically arrived at designated area</li>
                <li>Holds not clean/cargo-worthy</li>
                <li>Documents incomplete (customs, health certificates)</li>
                <li>Tanks not ready (for tankers)</li>
                <li>Vessel under repair or off-hire</li>
                <li>Notice given outside office hours (if C/P specifies)</li>
            </ul>
            
            <h4>⚖️ Key Case Law:</h4>
            <p><strong>The Kyzikos [2008]:</strong> Vessel must be arrived ship - physically present and legally free to work<br>
            <strong>The Tres Flores [1973]:</strong> Premature NOR invalid even if vessel eventually becomes ready<br>
            <strong>The Mexico I [1990]:</strong> "In all respects ready" is strict requirement</p>
            
            <h4>💼 Best Practices:</h4>
            <p>• Tender NOR in writing (email acceptable if C/P allows)<br>
            • Keep copies of all tendered NORs with time stamps<br>
            • Record weather conditions affecting operations<br>
            • Document any delays beyond vessel's control<br>
            • Agent should sign SOF jointly with terminal<br>
            • Disputes? Protect through Letter of Protest (LOP)</p>`
        },
        { 
            icon: "fa-file-invoice-dollar", 
            title: "Bills of Lading (B/L)", 
            desc: "Document of Title, Types, and Legal Implications",
            level: "Advanced",
            duration: "3.5 hours",
            content: `<h3>Bills of Lading: Complete Legal Guide</h3>
            
            <h4>📜 What is a Bill of Lading?</h4>
            <p>A Bill of Lading (B/L) is arguably the most important document in international trade. It serves three critical functions:</p>
            
            <div style="background:#d1fae5;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>Three Functions of B/L:</h5>
                <ol style="line-height:2;">
                    <li><strong>📄 Receipt for Goods:</strong> Confirms carrier received cargo as described</li>
                    <li><strong>📋 Evidence of Contract:</strong> Proves contract of carriage exists</li>
                    <li><strong>🔑 Document of Title:</strong> Represents ownership - who holds B/L controls cargo</li>
                </ol>
            </div>
            
            <h4>📦 Types of Bills of Lading:</h4>
            
            <div style="background:#e6f0ff;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>1. SHIPPED B/L (On Board B/L)</h5>
                <p>✓ States cargo actually loaded on vessel<br>
                ✓ Most secure for buyer<br>
                ✓ Required for Letters of Credit<br>
                ✓ Example: "Shipped on board M/V VIYA STAR on 15/01/2026"</p>
            </div>
            
            <div style="background:#fef3c7;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>2. RECEIVED FOR SHIPMENT B/L</h5>
                <p>✓ Cargo received but not yet loaded<br>
                ✓ Can be converted to Shipped B/L later<br>
                ✓ Common in container shipping<br>
                ⚠️ Banks may reject for L/C</p>
            </div>
            
            <div style="background:#fee2e2;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>3. STRAIGHT (Non-Negotiable) B/L</h5>
                <p>✓ Consigned to named party only<br>
                ✓ Cannot be transferred/sold<br>
                ✓ Not a document of title<br>
                ⚠️ Delivery without surrender possible</p>
            </div>
            
            <div style="background:#e0e7ff;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>4. ORDER B/L (To Order)</h5>
                <p>✓ "To Order" or "To Order of [Bank]"<br>
                ✓ Fully negotiable instrument<br>
                ✓ Can be endorsed and transferred<br>
                ✓ Most common in international trade</p>
            </div>
            
            <h4>⚠️ Claused vs Clean B/L:</h4>
            <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                <tr style="background:#1e293b;color:white;">
                    <th style="padding:10px;border:1px solid #334155;">CLEAN B/L</th>
                    <th style="padding:10px;border:1px solid #334155;">CLAUSED B/L</th>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;">✓ No remarks about defective condition<br>✓ "Shipped in apparent good order"<br>✓ Acceptable for L/C payment<br>✓ Protects carrier liability</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">✗ Contains remarks/clauses<br>✗ "Bags torn", "Rusty drums"<br>✗ Banks usually reject<br>✗ Carrier protects itself</td>
                </tr>
            </table>
            
            <h4>📝 Essential B/L Information:</h4>
            <ul style="line-height:1.8;">
                <li><strong>Shipper:</strong> Party delivering cargo (usually seller)</li>
                <li><strong>Consignee:</strong> Party to receive cargo (buyer or "To Order")</li>
                <li><strong>Notify Party:</strong> Who carrier informs on arrival</li>
                <li><strong>Vessel Name & Voyage:</strong> Identification</li>
                <li><strong>Port of Loading/Discharge:</strong> Routing</li>
                <li><strong>Description of Goods:</strong> Quantity, weight, marks</li>
                <li><strong>Freight Payment:</strong> Prepaid or Collect</li>
                <li><strong>Number of Originals:</strong> Usually 3 (one suffices for delivery)</li>
                <li><strong>Date & Place of Issue:</strong> Critical for laytime</li>
            </ul>
            
            <h4>⚖️ Legal Framework:</h4>
            <p><strong>Hague-Visby Rules:</strong> Most common - carrier liability $500 per package or $2/kg<br>
            <strong>Hamburg Rules:</strong> Shipper-friendly - up to $2.50/kg<br>
            <strong>Rotterdam Rules:</strong> Modern but not widely ratified yet</p>
            
            <h4>🚨 Common Issues & Solutions:</h4>
            <div style="background:#fee2e2;padding:15px;border-radius:8px;margin:15px 0;">
                <p><strong>Missing B/L (Lost at Sea/Mail):</strong><br>
                ➜ Letter of Indemnity (LOI) from bank-backed shipper<br>
                ➜ Court order for cargo release<br>
                ➜ Wait for limitation period expiry (risky!)</p>
                
                <p><strong>Delivery Without B/L:</strong><br>
                ➜ Carrier liable for misdelivery<br>
                ➜ "DP World v Banyan Tree" case - $1.8M damages<br>
                ➜ Never deliver without original B/L surrender</p>
            </div>
            
            <h4>💡 Industry Trends:</h4>
            <p><strong>Electronic B/L (eBL):</strong><br>
            • Platforms: Bolero, essDOCS, WAVE, CargoX<br>
            • Blockchain-based solutions emerging<br>
            • UK COGSA 2023 recognizes eBL legally<br>
            • Saves 5-7 days vs courier<br>
            • Reduces fraud risk</p>
            
            <h4>🎯 Quick Decision Tree:</h4>
            <p>Need negotiability? → Use "To Order" B/L<br>
            Selling cargo in transit? → Must be Order B/L<br>
            Letter of Credit? → Shipped, Clean B/L required<br>
            Sister company trade? → Straight B/L acceptable<br>
            Valuable cargo? → Ensure "freight prepaid" on 3/3 originals</p>`
        },
        { 
            icon: "fa-shield-halved", 
            title: "P&I Clubs & Marine Insurance", 
            desc: "Protection & Indemnity, Hull & Machinery, Cargo Insurance",
            level: "Advanced",
            duration: "3 hours",
            content: `<h3>Maritime Insurance: P&I Clubs & Coverage</h3>
            
            <h4>🛡️ What are P&I Clubs?</h4>
            <p>Protection & Indemnity (P&I) Clubs are mutual insurance associations owned by shipowners. They cover third-party liabilities that Hull & Machinery (H&M) insurance doesn't cover.</p>
            
            <h4>📊 International Group of P&I Clubs:</h4>
            <p>13 clubs providing coverage for approximately 90% of world's ocean-going tonnage:</p>
            <ul>
                <li>UK P&I Club (London)</li>
                <li>Gard (Norway)</li>
                <li>Skuld (Norway)</li>
                <li>Swedish Club</li>
                <li>West of England</li>
                <li>American Club</li>
                <li>Japan Club</li>
                <li>And 6 more...</li>
            </ul>
            
            <h4>💰 P&I Coverage (Typical):</h4>
            <div style="background:#d1fae5;padding:15px;border-radius:8px;margin:15px 0;">
                <ul style="line-height:1.8;">
                    <li>✓ Crew injury/death/illness (up to $3B per incident)</li>
                    <li>✓ Cargo damage/shortage claims</li>
                    <li>✓ Collision liability (1/4 collision clause)</li>
                    <li>✓ Oil pollution (CLC/Bunker Convention)</li>
                    <li>✓ Wreck removal expenses</li>
                    <li>✓ Stowaways and refugees</li>
                    <li>✓ Fines (customs, environmental)</li>
                    <li>✓ Legal costs and defense</li>
                </ul>
            </div>
            
            <h4>⚓ Hull & Machinery (H&M) Insurance:</h4>
            <p>Covers physical damage to vessel itself:</p>
            <div style="background:#e6f0ff;padding:15px;border-radius:8px;margin:15px 0;">
                <ul>
                    <li>Total loss (actual or constructive)</li>
                    <li>Partial loss (collision, grounding, fire)</li>
                    <li>Machinery breakdown</li>
                    <li>3/4 Collision Liability</li>
                    <li>Salvage costs</li>
                    <li>General Average contributions</li>
                </ul>
                <p><strong>Typical Premium:</strong> 0.1% - 1% of vessel value depending on age, flag, trading area</p>
            </div>
            
            <h4>💼 Cargo Insurance:</h4>
            <p>Institute Cargo Clauses (ICC) - London market standard:</p>
            <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                <tr style="background:#1e293b;color:white;">
                    <th style="padding:10px;border:1px solid #334155;">Coverage Type</th>
                    <th style="padding:10px;border:1px solid #334155;">What's Covered</th>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>ICC (A) - All Risks</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Broadest coverage - all risks except named exclusions</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>ICC (B) - Named Perils</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Fire, explosion, vessel stranding, collision, discharge, earthquake, general average</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>ICC (C) - Minimum</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Total loss, fire/explosion, collision, general average only</td>
                </tr>
            </table>
            
            <h4>⚖️ General Average (GA):</h4>
            <p>Ancient maritime law principle: "Voluntary sacrifice for common safety"</p>
            <div style="background:#fef3c7;padding:15px;border-radius:8px;margin:15px 0;">
                <p><strong>Example:</strong> Ship on fire at sea. Master jettisons 100 containers to save vessel, crew, and remaining cargo.</p>
                <p><strong>Result:</strong> Loss shared proportionally among all parties (shipowner, all cargo owners) based on saved values.</p>
                <p><strong>Process:</strong> Average Adjuster appointed → Security provided → Settlement (can take years)</p>
                <p><strong>York-Antwerp Rules 2016:</strong> Governs GA worldwide</p>
            </div>`
        },
        { 
            icon: "fa-gavel", 
            title: "Maritime Law & Arbitration", 
            desc: "COGSA, Hague Rules, London/New York Arbitration",
            level: "Expert",
            duration: "5 hours",
            content: `<h3>Maritime Law & Dispute Resolution</h3>
            
            <h4>⚖️ Key International Conventions:</h4>
            
            <div style="background:#e6f0ff;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>1. Hague-Visby Rules (1968)</h5>
                <p>Governs carrier liability for cargo damage/loss:</p>
                <ul>
                    <li>Carrier liability: SDR 666.67 per package or SDR 2 per kg (whichever higher)</li>
                    <li>1-year time bar for claims</li>
                    <li>Burden of proof on carrier for due diligence</li>
                    <li>17 excepted perils (Act of God, perils of sea, etc.)</li>
                </ul>
            </div>
            
            <div style="background:#fef3c7;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>2. Hamburg Rules (1992)</h5>
                <p>More shipper-friendly but less adopted:</p>
                <ul>
                    <li>Higher liability: SDR 835 per package or 2.5 per kg</li>
                    <li>2-year time bar</li>
                    <li>Carrier must prove exercised due diligence</li>
                    <li>Only 41 countries ratified vs 100+ for Hague-Visby</li>
                </ul>
            </div>
            
            <div style="background:#d1fae5;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>3. Rotterdam Rules (2009)</h5>
                <p>Modern "door-to-door" regime but minimal adoption:</p>
                <ul>
                    <li>Covers multimodal transport</li>
                    <li>Electronic transport documents recognized</li>
                    <li>Only 5 countries ratified (needs 20 to enter force)</li>
                    <li>Industry resistance due to uncertainty</li>
                </ul>
            </div>
            
            <h4>🗂️ US COGSA 1936:</h4>
            <p>US Carriage of Goods by Sea Act - based on Hague Rules but with differences:</p>
            <ul>
                <li>$500 per package limitation (unless higher declared)</li>
                <li>Applies "tackle-to-tackle" (loading to discharge)</li>
                <li>Mandatory for US import/export by sea</li>
                <li>Clause Paramount incorporates COGSA into B/L</li>
            </ul>
            
            <h4>🤝 Maritime Arbitration:</h4>
            
            <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                <tr style="background:#1e293b;color:white;">
                    <th style="padding:10px;border:1px solid #334155;">London Maritime Arbitration</th>
                    <th style="padding:10px;border:1px solid #334155;">New York (SMA)</th>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;">
                        • LMAA Terms (2021)<br>
                        • English law (usually)<br>
                        • 3 arbitrators typical<br>
                        • Costs follow event rule<br>
                        • Appeals to High Court (limited)<br>
                        • ~75% of maritime arbitration
                    </td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">
                        • SMA Rules<br>
                        • US law or chosen law<br>
                        • 3 arbitrators<br>
                        • Each party pays own costs<br>
                        • Very limited court intervention<br>
                        • Strong in tanker trades
                    </td>
                </tr>
            </table>
            
            <h4>💡 Other Arbitration Seats:</h4>
            <ul>
                <li><strong>Singapore (SCMA):</strong> Growing, Asia-Pacific focus</li>
                <li><strong>Hong Kong (HKMAG):</strong> China trade gateway</li>
                <li><strong>Tokyo (TOMAC):</strong> Japanese market</li>
                <li><strong>Dubai (DMCA):</strong> Middle East hub</li>
            </ul>
            
            <h4>📋 Dispute Resolution Clauses:</h4>
            <div style="background:#fee2e2;padding:15px;border-radius:8px;margin:15px 0;">
                <p><strong>Arbitration Clause Example:</strong></p>
                <p style="font-style:italic;">"Any dispute arising out of this Charter Party shall be referred to arbitration in London in accordance with the Arbitration Act 1996 and the LMAA Terms current at the time. English law to apply."</p>
                
                <p style="margin-top:15px;"><strong>Jurisdiction Clause Example:</strong></p>
                <p style="font-style:italic;">"The Courts of England shall have exclusive jurisdiction over any dispute arising under this contract and English law shall apply."</p>
            </div>
            
            <h4>⏱️ Time Bars - Critical Deadlines:</h4>
            <table style="width:100%;border-collapse:collapse;margin:15px 0;line-height:1.8;">
                <tr><td><strong>Cargo Claims:</strong></td><td>1 year from delivery (Hague-Visby)</td></tr>
                <tr style="background:#f9fafb;"><td><strong>Collision Claims:</strong></td><td>2 years from incident</td></tr>
                <tr><td><strong>Personal Injury:</strong></td><td>3 years (UK law)</td></tr>
                <tr style="background:#f9fafb;"><td><strong>Pollution Claims:</strong></td><td>3 years from damage occurred</td></tr>
                <tr><td><strong>Salvage:</strong></td><td>2 years from completion</td></tr>
            </table>
            
            <h4>🎯 Pro Tips for Avoiding Disputes:</h4>
            <ol>
                <li>Use BIMCO standard forms - battle-tested clauses</li>
                <li>Clear laytime definitions and demurrage rates</li>
                <li>Specify arbitration seat and governing law</li>
                <li>Time bar tracking system essential</li>
                <li>Letter of Protest within 24 hours of incident</li>
                <li>Contemporaneous records (logs, emails, photos)</li>
                <li>Engage P&I Club early - they provide defense</li>
            </ol>`
        },
        { 
            icon: "fa-leaf", 
            title: "Green Shipping & Decarbonization", 
            desc: "IMO 2030/2050 Targets, Alternative Fuels, CII, EEXI",
            level: "Intermediate",
            duration: "2.5 hours",
            content: `<h3>Green Shipping & IMO Environmental Regulations</h3>
            
            <h4>🌍 IMO Decarbonization Strategy:</h4>
            <div style="background:#d1fae5;padding:20px;border-radius:8px;margin:15px 0;">
                <h5>🎯 Key Targets:</h5>
                <ul style="line-height:2;">
                    <li><strong>2030:</strong> 40% reduction in carbon intensity (vs 2008 baseline)</li>
                    <li><strong>2050:</strong> 50% reduction in total GHG emissions</li>
                    <li><strong>2050:</strong> Phase out GHG emissions entirely (revised 2023 target)</li>
                </ul>
            </div>
            
            <h4>📊 New Regulatory Framework:</h4>
            
            <div style="background:#e6f0ff;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>1. EEXI (Energy Efficiency Existing Ship Index)</h5>
                <p><strong>Effective:</strong> January 1, 2023</p>
                <p><strong>Applies to:</strong> Vessels ≥400 GT</p>
                <p><strong>Purpose:</strong> Technical/design efficiency standard</p>
                <p><strong>Compliance:</strong> Engine power limitation, energy-saving devices, shaft generators</p>
                <p><strong>One-time certification required</strong></p>
            </div>
            
            <div style="background:#fef3c7;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>2. CII (Carbon Intensity Indicator)</h5>
                <p><strong>Effective:</strong> January 1, 2023</p>
                <p><strong>Applies to:</strong> Vessels ≥5,000 GT</p>
                <p><strong>Purpose:</strong> Operational efficiency - annual rating</p>
                <p><strong>Rating:</strong> A (best) to E (worst)</p>
                <p><strong>Consequence:</strong> 3 consecutive D or 1 E = corrective action plan required</p>
                <p><strong>Formula:</strong> CO₂ emissions ÷ (DWT × distance traveled)</p>
            </div>
            
            <h4>⚡ Alternative Fuels:</h4>
            
            <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                <tr style="background:#1e293b;color:white;">
                    <th style="padding:10px;border:1px solid #334155;">Fuel Type</th>
                    <th style="padding:10px;border:1px solid #334155;">GHG Reduction</th>
                    <th style="padding:10px;border:1px solid #334155;">Status</th>
                    <th style="padding:10px;border:1px solid #334155;">Challenges</th>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>LNG</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">20-25%</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">✓ Commercially available</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Methane slip, infrastructure limited</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Methanol</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">10-15%</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">✓ Growing adoption (Maersk)</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Toxic, corrosive, lower energy density</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Ammonia</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">80-100%</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">⏳ Testing phase (2025-2027)</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Highly toxic, NOx emissions, storage</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Hydrogen</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">100%</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">⏳ R&D stage</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Storage (cryogenic), production cost, safety</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Biofuels</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">70-90%</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">✓ Drop-in solution</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Supply limited, sustainability concerns</td>
                </tr>
            </table>
            
            <h4>💰 Market-Based Measures:</h4>
            
            <div style="background:#fee2e2;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>EU ETS (Emissions Trading System) for Shipping</h5>
                <p><strong>Phase-in:</strong> 2024-2026</p>
                <ul>
                    <li>2024: 40% of emissions covered</li>
                    <li>2025: 70% of emissions covered</li>
                    <li>2026: 100% of emissions covered</li>
                </ul>
                <p><strong>Applies to:</strong> Vessels >5,000 GT calling EU ports</p>
                <p><strong>Coverage:</strong> 50% of emissions from voyages to/from EU, 100% within EU</p>
                <p><strong>Estimated Cost:</strong> €20-30 per tonne of CO₂ initially (rising to €100+)</p>
            </div>
            
            <h4>🔧 Operational Measures to Improve CII:</h4>
            <ol style="line-height:1.8;">
                <li><strong>Slow Steaming:</strong> Reduce speed 10% = 20% fuel savings (cubic relationship)</li>
                <li><strong>Weather Routing:</strong> Optimize routes using weather data</li>
                <li><strong>Hull Cleaning:</strong> Reduce biofouling - up to 10% savings</li>
                <li><strong>Propeller Polishing:</strong> 3-5% efficiency gain</li>
                <li><strong>Just-in-Time Arrival:</strong> Reduce port waiting at anchor</li>
                <li><strong>Digital Twins:</strong> AI-powered performance monitoring</li>
            </ol>
            
            <h4>🚀 Emerging Technologies:</h4>
            <ul>
                <li><strong>Wind-Assisted Propulsion:</strong> Rotor sails, wing sails (5-20% savings)</li>
                <li><strong>Air Lubrication:</strong> Bubble carpet under hull (5-10% savings)</li>
                <li><strong>Shore Power:</strong> Use grid electricity at berth (zero emissions in port)</li>
                <li><strong>Nuclear Propulsion:</strong> Zero emissions but regulatory/public acceptance issues</li>
            </ul>
            
            <h4>📈 Financial Impact:</h4>
            <p><strong>Example Capesize Bulk Carrier:</strong></p>
            <div style="background:#f1f5f9;padding:15px;border-radius:8px;margin:10px 0;">
                <p>Annual fuel consumption: 10,000 MT<br>
                CO₂ emissions: ~31,000 tonnes<br>
                EU ETS cost (2026, €80/tonne): €2.48M/year<br>
                CII Rating D → IMO corrective plan + charter rate penalties<br>
                Methanol retrofit: $10-15M capex + 10% higher opex</p>
            </div>`
        }
    ];
    
    // Level color mapping for badges
    const levelColors = {
        'Beginner': { bg: '#10B98120', color: '#10B981' },
        'Intermediate': { bg: '#F59E0B20', color: '#F59E0B' },
        'Advanced': { bg: '#EF444420', color: '#EF4444' },
        'Expert': { bg: '#7C3AED20', color: '#7C3AED' }
    };
    
    // Icon colors for variety
    const iconColors = ['#0066FF', '#10B981', '#F59E0B', '#EF4444', '#7C3AED', '#EC4899', '#06B6D4', '#D97706'];
    
    data.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'doc-card';
        card.style.cursor = 'pointer';
        
        const levelStyle = levelColors[item.level] || levelColors['Beginner'];
        const iconColor = iconColors[index % iconColors.length];
        
        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
                <i class="fa-solid ${item.icon} doc-icon" style="color:${iconColor};font-size:40px;"></i>
                <span style="background:${levelStyle.bg};color:${levelStyle.color};padding:6px 12px;border-radius:20px;font-size:11px;font-weight:700;">
                    ${item.level}
                </span>
            </div>
            <div class="doc-title" style="font-size:19px;margin-bottom:8px;">${item.title}</div>
            <div class="doc-desc" style="margin-bottom:12px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                ${item.desc}
            </div>
            <div style="display:flex;align-items:center;gap:15px;margin-bottom:16px;font-size:13px;color:#6b7280;padding-top:12px;border-top:1px solid #e5e7eb;">
                <span style="display:flex;align-items:center;gap:5px;">
                    <i class="fa-solid fa-clock"></i>
                    ${item.duration}
                </span>
                <span style="display:flex;align-items:center;gap:5px;">
                    <i class="fa-solid fa-signal"></i>
                    ${item.level}
                </span>
            </div>
            <button class="btn-download" style="width:100%;">
                <i class="fa-solid fa-book-open"></i> 
                ${t.btn_read || 'START LEARNING'}
            </button>
        `;
        
        card.onclick = () => openContentModal(item.title, item.content);
        aGrid.appendChild(card);
    });
}

async function loadDocs() {
    const container = document.getElementById('docsContainer');
    if (!container) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    
    const data = [
        {
            category: "Charter Party Forms",
            items: [
                {
                    title: "GENCON 94",
                    desc: "General Purpose Voyage Charter Party",
                    content: `<h3>CODE NAME: "GENCON 94"</h3>
<p><strong>THE BALTIC AND INTERNATIONAL MARITIME COUNCIL (BIMCO)</strong><br>
UNIFORM GENERAL CHARTER (AS REVISED 1922, 1976 and 1994)</p>

<h4>PART I</h4>
<p><strong>1. Shipbroker:</strong> [BROKER_NAME]</p>
<p><strong>2. Place and Date:</strong> [PLACE], [DATE]</p>
<p><strong>3. Owners/Disponent Owners:</strong> [OWNERS_NAME]<br>Place of business: [ADDRESS]</p>
<p><strong>4. Charterers:</strong> [CHARTERERS_NAME]<br>Place of business: [ADDRESS]</p>
<p><strong>5. Vessel's name:</strong> [VESSEL_NAME]</p>
<p><strong>6. GT/NT:</strong> [GT] / [NT]</p>
<p><strong>7. DWT:</strong> [DWT] metric tons (abt) on summer freeboard</p>
<p><strong>8. Present position:</strong> [POSITION]</p>
<p><strong>9. Expected ready to load (abt):</strong> [DATE]</p>
<p><strong>10. Loading port or place:</strong> [LOAD_PORT]</p>
<p><strong>11. Discharging port or place:</strong> [DISCHARGE_PORT]</p>
<p><strong>12. Cargo:</strong> [CARGO_TYPE]<br>Quantity (abt): [QUANTITY] metric tons</p>
<p><strong>13. Freight rate:</strong> [RATE] per metric ton</p>
<p><strong>14. Freight payment:</strong> Prepaid / On right delivery<br>Final payment: [TERMS]</p>
<p><strong>15. Loading rate:</strong> [RATE] MT per WWD of 24 hours</p>
<p><strong>16. Discharging rate:</strong> [RATE] MT per WWD of 24 hours</p>
<p><strong>17. Laytime:</strong> Commence at [TIME] on [CONDITIONS]</p>
<p><strong>18. Demurrage:</strong> USD [AMOUNT] per day pro rata</p>
<p><strong>19. Despatch:</strong> [%] of demurrage rate</p>
<p><strong>20. General Average:</strong> York-Antwerp Rules [YEAR]</p>

<div style="background:#f3f4f6;padding:12px;margin:15px 0;border-left:4px solid #3b82f6;">
<strong>⚠️ TEMPLATE DOCUMENT</strong><br>
This is a template for reference only. Professional legal review required before execution.
</div>`
                },
                {
                    title: "NYPE 2015",
                    desc: "New York Produce Exchange Time Charter",
                    content: `<h3>CODE NAME: "NYPE 2015"</h3>
<p><strong>NEW YORK PRODUCE EXCHANGE TIME CHARTER</strong> (As amended 2015)</p>

<h4>PART I</h4>
<p><strong>1. Shipbroker:</strong> [BROKER_NAME]</p>
<p><strong>2. Place and Date:</strong> [PLACE], [DATE]</p>
<p><strong>3. Owners:</strong> [OWNERS_NAME] | Email: [EMAIL]</p>
<p><strong>4. Charterers:</strong> [CHARTERERS_NAME] | Email: [EMAIL]</p>
<p><strong>5. Vessel's Name:</strong> [VESSEL_NAME]</p>
<p><strong>6. GT/NT:</strong> [GT] / [NT]</p>
<p><strong>7. DWT:</strong> [DWT] metric tons on summer draft</p>
<p><strong>8. Grain capacity:</strong> [CAPACITY] cubic meters</p>
<p><strong>9. Delivery Port:</strong> [DELIVERY_PORT]</p>
<p><strong>10. Date of Delivery:</strong> [DATE] (Cancelling: [DATE])</p>
<p><strong>11. Redelivery Port:</strong> [REDELIVERY_PORT]</p>
<p><strong>12. Period:</strong> [MONTHS] months +/- [OPTIONS]</p>
<p><strong>13. Hire Rate:</strong> USD [AMOUNT] per day</p>
<p><strong>14. Payment:</strong> Semi-monthly in advance</p>
<p><strong>15. Trading Limits:</strong> [TRADING_AREA]</p>
<p><strong>16. Speed & Consumption:</strong><br>
- Laden: About [SPEED] kts on about [CONS] mt IFO/day<br>
- Ballast: About [SPEED] kts on about [CONS] mt IFO/day<br>
- Idle: About [CONS] mt IFO/day</p>
<p><strong>17. Bunkers on Delivery:</strong> About [QTY] mt IFO, [QTY] mt MGO</p>
<p><strong>18. Cargo Exclusions:</strong> [EXCLUDED_CARGOES]</p>

<h4>KEY CLAUSES</h4>
<p><strong>1. Description:</strong> Owners guarantee class, speed, consumption<br>
<strong>2. Period:</strong> Charter period as Box 12<br>
<strong>3. Payment:</strong> Hire payable semi-monthly advance<br>
<strong>4. Off-hire:</strong> Vessel off-hire when unable to perform<br>
<strong>5. Withdrawal:</strong> Owners may withdraw for non-payment</p>

<div style="background:#f3f4f6;padding:12px;margin:15px 0;border-left:4px solid #3b82f6;">
<strong>⚠️ TEMPLATE DOCUMENT</strong><br>
Legal review mandatory before execution.
</div>`
                },
                {
                    title: "BALTIME 2001",
                    desc: "Uniform Time Charter Party",
                    content: `<h3>CODE NAME: "BALTIME 2001"</h3>
<p><strong>UNIFORM TIME CHARTER PARTY (BIMCO)</strong></p>

<h4>PART I - BOX LAYOUT</h4>
<p><strong>Vessel:</strong> [VESSEL_NAME] | <strong>DWT:</strong> [DWT] MT<br>
<strong>Owners:</strong> [OWNERS_NAME]<br>
<strong>Charterers:</strong> [CHARTERERS_NAME]<br>
<strong>Period:</strong> [MONTHS] months from delivery<br>
<strong>Hire:</strong> USD [AMOUNT] per day<br>
<strong>Delivery:</strong> [PORT] on/about [DATE]<br>
<strong>Trading Limits:</strong> Worldwide excluding war risk zones</p>

<p><strong>Speed & Consumption:</strong><br>
About [SPEED] knots on about [CONS] tons fuel oil per day</p>

<div style="background:#f3f4f6;padding:12px;margin:15px 0;border-left:4px solid #3b82f6;">
<strong>⚠️ TEMPLATE</strong> - Professional review required
</div>`
                },
                {
                    title: "SHELLVOY 6",
                    desc: "Shell Tanker Voyage Charter Party",
                    content: `<h3>CODE NAME: "SHELLVOY 6"</h3>
<p><strong>SHELL TANKER VOYAGE CHARTER PARTY</strong></p>

<h4>MAIN TERMS</h4>
<p><strong>Vessel:</strong> [VESSEL_NAME]<br>
<strong>DWT:</strong> [DWT] MT on [DRAFT]m draft<br>
<strong>Cargo:</strong> [CARGO_TYPE] - [QUANTITY] MT<br>
<strong>Load Port:</strong> [LOAD_PORT]<br>
<strong>Discharge Port:</strong> [DISCHARGE_PORT]<br>
<strong>Freight:</strong> USD [RATE] per MT Worldscale [WS_RATE]<br>
<strong>Laytime:</strong> [HOURS] hours SHINC<br>
<strong>Demurrage:</strong> USD [RATE] per hour</p>

<p><strong>Special Provisions:</strong><br>
- ISPS/MTSA compliance required<br>
- Vessel Vetting approval mandatory<br>
- SIRE report within 6 months</p>

<div style="background:#f3f4f6;padding:12px;margin:15px 0;border-left:4px solid #3b82f6;">
<strong>⚠️ TEMPLATE</strong> - Tanker-specific terms apply
</div>`
                },
                {
                    title: "BPVOY 4",
                    desc: "BP Voyage Charter Party",
                    content: `<h3>CODE NAME: "BPVOY 4"</h3>
<p><strong>BP VOYAGE CHARTER PARTY (Edition 4)</strong></p>

<h4>PARTICULARS</h4>
<p><strong>Owners:</strong> [OWNERS]<br>
<strong>Charterers:</strong> BP Shipping Limited<br>
<strong>Vessel:</strong> [VESSEL_NAME] | DWT: [DWT]<br>
<strong>Cargo:</strong> [CRUDE_OIL/PRODUCTS]<br>
<strong>Quantity:</strong> [QTY] MT +/- 5%<br>
<strong>Freight:</strong> Worldscale [WS] = USD [RATE]/MT</p>

<p><strong>Vetting:</strong> Valid SIRE required<br>
<strong>Laytime:</strong> 24 hours SHINC port time<br>
<strong>Demurrage/Despatch:</strong> USD [RATE]/hour</p>

<div style="background:#f3f4f6;padding:12px;margin:15px 0;">
<strong>⚠️ TEMPLATE</strong>
</div>`
                },
                {
                    title: "ASBATANKVOY",
                    desc: "American Tanker Voyage Charter",
                    content: `<h3>ASBATANKVOY</h3>
<p><strong>AMERICAN STANDARD TANKER VOYAGE CHARTER</strong></p>

<p><strong>Vessel/Cargo:</strong> [VESSEL] / [CARGO] [QTY]MT<br>
<strong>Route:</strong> [LOAD] → [DISCHARGE]<br>
<strong>Freight:</strong> USD [RATE] per MT<br>
<strong>Laytime:</strong> 72 hours total<br>
<strong>Demurrage:</strong> USD [RATE]/day</p>

<div style="background:#f3f4f6;padding:12px;margin:15px 0;">
<strong>⚠️ TEMPLATE</strong>
</div>`
                },
                {
                    title: "BARECON 2017",
                    desc: "Bareboat Charter Party",
                    content: `<h3>CODE NAME: "BARECON 2017"</h3>
<p><strong>BAREBOAT CHARTER (BIMCO Standard Form)</strong></p>

<h4>TERMS</h4>
<p><strong>Vessel:</strong> [VESSEL_NAME]<br>
<strong>Hire:</strong> USD [AMOUNT] per month<br>
<strong>Period:</strong> [YEARS] years<br>
<strong>Delivery:</strong> [PORT] [DATE]<br>
<strong>Insurance:</strong> Charterers' responsibility<br>
<strong>Maintenance:</strong> Charterers' responsibility</p>

<div style="background:#f3f4f6;padding:12px;margin:15px 0;">
<strong>⚠️ TEMPLATE</strong>
</div>`
                },
                {
                    title: "SUPPLYTIME 2017",
                    desc: "Offshore Supply Vessel Time Charter",
                    content: `<h3>CODE NAME: "SUPPLYTIME 2017"</h3>
<p><strong>OFFSHORE SUPPLY VESSEL TIME CHARTER</strong></p>

<p><strong>Vessel:</strong> [VESSEL_NAME]<br>
<strong>Type:</strong> PSV/AHTS/DSV<br>
<strong>Hire:</strong> USD [RATE] per day<br>
<strong>Period:</strong> [MONTHS] months<br>
<strong>Trading Area:</strong> [OFFSHORE_AREA]</p>

<div style="background:#f3f4f6;padding:12px;margin:15px 0;">
<strong>⚠️ TEMPLATE</strong>
</div>`
                }
            ]
        },
        {
            category: "Bills of Lading",
            items: [
                {
                    title: "CONGENBILL 2016",
                    desc: "BIMCO General Purpose Bill of Lading",
                    content: `<h3>BILL OF LADING - CODE NAME: "CONGENBILL 2016"</h3>

<p><strong>Shipper:</strong> [SHIPPER_NAME], [ADDRESS]</p>
<p><strong>Consignee:</strong> [CONSIGNEE or "TO ORDER"]</p>
<p><strong>Notify Party:</strong> [NOTIFY_NAME], [ADDRESS], [EMAIL]</p>

<p><strong>Port of Loading:</strong> [LOAD_PORT]<br>
<strong>Port of Discharge:</strong> [DISCHARGE_PORT]<br>
<strong>Vessel:</strong> [VESSEL_NAME] | Voyage: [VOY_NO]</p>

<h4>PARTICULARS FURNISHED BY SHIPPER</h4>
<table>
<tr><th>Marks & Numbers</th><th>Packages</th><th>Description</th><th>Weight</th><th>Measurement</th></tr>
<tr><td>[MARKS]</td><td>[NO]</td><td>[DESC]</td><td>[KGS]</td><td>[CBM]</td></tr>
</table>

<p><strong>Freight:</strong> [PREPAID / COLLECT] - USD [AMOUNT]</p>
<p><strong>No. of Original B/Ls:</strong> THREE (3)</p>

<p><strong>Shipped on board:</strong> [DATE]</p>

<h4>TERMS & CONDITIONS</h4>
<p><strong>1. Carrier's Responsibility:</strong> Port to Port (Tackle to Tackle)<br>
<strong>2. Applicable Law:</strong> Hague-Visby Rules apply<br>
<strong>3. Limitation:</strong> SDR 666.67 per package or SDR 2 per kg<br>
<strong>4. Notice:</strong> Loss/damage notice within 3 days<br>
<strong>5. Time Bar:</strong> 1 year from delivery</p>

<div style="background:#f3f4f6;padding:12px;margin:15px 0;border-left:4px solid #3b82f6;">
<strong>⚠️ STANDARD TEMPLATE</strong><br>
Subject to complete T&Cs on reverse.
</div>`
                },
                {
                    title: "CONLINEBILL 2016",
                    desc: "BIMCO Liner Bill of Lading",
                    content: `<h3>LINER BILL OF LADING - "CONLINEBILL 2016"</h3>

<p><strong>Carrier:</strong> [LINER_COMPANY]<br>
<strong>Service:</strong> [SERVICE_NAME]</p>

<p><strong>Shipper/Consignee/Notify:</strong><br>
[DETAILS]</p>

<p><strong>Place of Receipt:</strong> [PLACE]<br>
<strong>Port of Loading:</strong> [PORT]<br>
<strong>Port of Discharge:</strong> [PORT]<br>
<strong>Place of Delivery:</strong> [PLACE]</p>

<h4>CONTAINER DETAILS</h4>
<table>
<tr><th>Container No.</th><th>Seal No.</th><th>Packages</th><th>Description</th><th>Weight</th></tr>
<tr><td>[CONT_NO]</td><td>[SEAL]</td><td>[PKGS]</td><td>[DESC]</td><td>[KGS]</td></tr>
</table>

<p><strong>Freight:</strong> [PREPAID/COLLECT]</p>

<div style="background:#f3f4f6;padding:12px;margin:15px 0;">
<strong>⚠️ TEMPLATE</strong>
</div>`
                },
                {
                    title: "MULTIDOC 95",
                    desc: "Multimodal Transport B/L (BIMCO)",
                    content: `<h3>MULTIDOC 95 - MULTIMODAL TRANSPORT B/L</h3>

<p><strong>Place of Receipt:</strong> [PLACE]<br>
<strong>Place of Delivery:</strong> [PLACE]<br>
<strong>Vessel/Voyage:</strong> [VESSEL] / [VOY]</p>

<p><strong>Transport Modes:</strong> Sea + Road/Rail/Air</p>

<table>
<tr><th>Container</th><th>Seal</th><th>Packages</th><th>Weight</th></tr>
<tr><td>[CONT]</td><td>[SEAL]</td><td>[PKGS]</td><td>[KGS]</td></tr>
</table>

<div style="background:#f3f4f6;padding:12px;margin:15px 0;">
<strong>⚠️ TEMPLATE</strong>
</div>`
                },
                {
                    title: "SEA WAYBILL",
                    desc: "Non-negotiable Sea Waybill",
                    content: `<h3>SEA WAYBILL (Non-negotiable)</h3>

<p><strong>Carrier:</strong> [CARRIER]<br>
<strong>Shipper:</strong> [SHIPPER]<br>
<strong>Consignee:</strong> [CONSIGNEE] (Named - Non-negotiable)</p>

<p><strong>Vessel:</strong> [VESSEL] | Voyage: [VOY]<br>
<strong>Port of Loading:</strong> [LOAD_PORT]<br>
<strong>Port of Discharge:</strong> [DISCHARGE_PORT]</p>

<table>
<tr><th>Description</th><th>Quantity</th><th>Weight</th></tr>
<tr><td>[DESC]</td><td>[QTY]</td><td>[KGS]</td></tr>
</table>

<p><strong>⚠️ NON-NEGOTIABLE DOCUMENT</strong><br>
Cargo deliverable to named Consignee without presentation of original.</p>

<div style="background:#f3f4f6;padding:12px;margin:15px 0;">
<strong>⚠️ TEMPLATE</strong>
</div>`
                },
                {
                    title: "MATE'S RECEIPT",
                    desc: "Mate's Receipt Template",
                    content: `<h3>MATE'S RECEIPT</h3>

<p><strong>Vessel:</strong> M/V [VESSEL_NAME]<br>
<strong>Port:</strong> [PORT] | Date: [DATE]</p>

<p><strong>Received from:</strong> [SHIPPER]<br>
<strong>For account of:</strong> [ACCOUNT]</p>

<h4>CARGO RECEIVED</h4>
<table>
<tr><th>Marks</th><th>Packages</th><th>Description</th><th>Weight</th></tr>
<tr><td>[MARKS]</td><td>[PKGS]</td><td>[DESC]</td><td>[KGS]</td></tr>
</table>

<p><strong>Condition:</strong> [GOOD ORDER / EXCEPTIONS NOTED]</p>

<p><strong>Exceptions/Remarks:</strong><br>
[ANY_DAMAGE_OR_EXCEPTIONS]</p>

<p><strong>Signed by:</strong><br>
Chief Officer: ________________<br>
Date/Time: [DATE] [TIME]</p>

<div style="background:#f3f4f6;padding:12px;margin:15px 0;">
<strong>Note:</strong> This receipt to be exchanged for Bill of Lading.
</div>`
                },
                {
                    title: "SWITCH B/L",
                    desc: "Switch Bill of Lading Template",
                    content: `<h3>SWITCH BILL OF LADING</h3>

<p><strong>Original B/L No:</strong> [ORIGINAL_BL_NO]<br>
<strong>Switch B/L No:</strong> [SWITCH_BL_NO]<br>
<strong>Issue Date:</strong> [DATE]</p>

<p><strong>Original Shipper:</strong> [ORIGINAL_SHIPPER]<br>
<strong>New Shipper:</strong> [NEW_SHIPPER]</p>

<p><strong>Original Consignee:</strong> [ORIGINAL]<br>
<strong>New Consignee:</strong> [NEW]</p>

<p><strong>Vessel/Voyage:</strong> [VESSEL] / [VOY]<br>
<strong>Cargo:</strong> [DESCRIPTION]</p>

<p><strong>Original B/L surrendered:</strong> [YES/NO]</p>

<div style="background:#fff3cd;padding:12px;margin:15px 0;border-left:4px solid #ffc107;">
<strong>⚠️ IMPORTANT:</strong> All original B/Ls must be surrendered before issuing switch B/L. Subject to carrier's approval and local law.
</div>`
                }
            ]
        },
        {
            category: "Notices & Statements",
            items: [
                {
                    title: "NOTICE OF READINESS (NOR)",
                    desc: "Notice of Readiness Template",
                    content: `<h3>NOTICE OF READINESS</h3>

<p><strong>To:</strong> [CHARTERERS/RECEIVERS/SHIPPERS]<br>
[ADDRESS]</p>

<p><strong>Vessel:</strong> M/V [VESSEL_NAME]<br>
<strong>Voyage:</strong> [VOYAGE_NO]<br>
<strong>Port:</strong> [PORT_NAME]</p>

<p><strong>Date:</strong> [DATE]<br>
<strong>Time:</strong> [TIME] (Local Time)</p>

<p>Dear Sirs,</p>

<p>We hereby give you <strong>NOTICE</strong> that the above vessel arrived at [LOCATION] and is now <strong>READY IN ALL RESPECTS</strong> to [LOAD/DISCHARGE] cargo per Charter Party dated [CP_DATE].</p>

<h4>VESSEL DETAILS</h4>
<ul>
<li>IMO: [IMO_NUMBER] | Flag: [FLAG]</li>
<li>GT/NT: [GT]/[NT] | DWT: [DWT] MT</li>
<li>LOA: [LENGTH]m | Draft: [DRAFT]m</li>
</ul>

<p><strong>Cargo:</strong> [CARGO_TYPE] - [QUANTITY] MT</p>

<h4>VESSEL STATUS</h4>
<p>✓ Anchored at designated anchorage<br>
✓ Free pratique granted<br>
✓ All holds cleaned and inspected<br>
✓ Cargo gear tested and ready<br>
✓ All documentation complete<br>
✓ No repairs affecting operations</p>

<p><strong>Customs/Health:</strong> COMPLETED</p>

<p>We are ready to commence immediately upon berth allocation.</p>

<p>Yours faithfully,</p>

<p>_______________________<br>
Master, M/V [VESSEL_NAME]</p>

<p><strong>Time NOR Tendered:</strong> [DATE] [TIME] Local<br>
<strong>NOR Accepted:</strong> __________ (Receivers)</p>

<div style="background:#f3f4f6;padding:12px;margin:15px 0;">
<strong>Note:</strong> Valid subject to C/P terms regarding time counting.
</div>`
                },
                {
                    title: "STATEMENT OF FACTS (SOF)",
                    desc: "Port Operations Time Sheet",
                    content: `<h3>STATEMENT OF FACTS</h3>

<p><strong>Vessel:</strong> M/V [VESSEL_NAME] | Voyage: [VOY]<br>
<strong>Port:</strong> [PORT] | Operation: [LOAD/DISCHARGE]<br>
<strong>Charter Party:</strong> [CP] dated [DATE]<br>
<strong>Cargo:</strong> [CARGO] - [QTY] MT</p>

<h4>CHRONOLOGY</h4>
<table>
<tr><th>Date</th><th>Time</th><th>Event</th></tr>
<tr><td>[DD/MM]</td><td>[HH:MM]</td><td>Arrived pilot station</td></tr>
<tr><td>[DD/MM]</td><td>[HH:MM]</td><td>Pilot on board</td></tr>
<tr><td>[DD/MM]</td><td>[HH:MM]</td><td>All fast / Anchored</td></tr>
<tr><td>[DD/MM]</td><td>[HH:MM]</td><td>NOR tendered</td></tr>
<tr><td>[DD/MM]</td><td>[HH:MM]</td><td>NOR accepted</td></tr>
<tr><td>[DD/MM]</td><td>[HH:MM]</td><td>Free Pratique</td></tr>
<tr><td>[DD/MM]</td><td>[HH:MM]</td><td>Operations commenced</td></tr>
<tr><td>[DD/MM]</td><td>[HH:MM]</td><td>Operations completed</td></tr>
<tr><td>[DD/MM]</td><td>[HH:MM]</td><td>Vessel sailed</td></tr>
</table>

<h4>CARGO SUMMARY</h4>
<p>Total: [QTY] MT<br>
B/L Figure: [BL_QTY] MT<br>
Shore Figure: [SHORE_QTY] MT<br>
Ship Figure: [SHIP_QTY] MT</p>

<p><strong>Rate Achieved:</strong> [RATE] MT/hour</p>

<h4>DELAYS</h4>
<p>[DATE] [TIME-TIME] [DURATION] [REASON]</p>

<p><strong>Prepared by:</strong><br>
Master: _____ | Agent: _____ | Terminal: _____</p>

<div style="background:#f3f4f6;padding:12px;margin:15px 0;">
Signed without prejudice, subject to verification.
</div>`
                },
                {
                    title: "TIME SHEET",
                    desc: "Laytime Calculation Statement",
                    content: `<h3>LAYTIME STATEMENT / TIME SHEET</h3>

<p><strong>Vessel:</strong> M/V [VESSEL_NAME]<br>
<strong>Port:</strong> [PORT] | Cargo: [CARGO] [QTY]MT<br>
<strong>C/P:</strong> [CP_NAME] dated [DATE]<br>
<strong>Terms:</strong> [SHINC/SHEX/WWD]</p>

<h4>CALCULATION</h4>

<p><strong>1. NOR:</strong><br>
Tendered: [DATE] [TIME]<br>
Accepted: [DATE] [TIME]</p>

<p><strong>2. LAYTIME START:</strong> [DATE] [TIME]</p>

<p><strong>3. TIME USED:</strong><br>
Ops Start: [DATE] [TIME]<br>
Ops End: [DATE] [TIME]<br>
Gross Time: [X]h [Y]m</p>

<p><strong>4. DEDUCTIONS:</strong></p>

<p>A. Sundays/Holidays (SHEX): [HOURS]h<br>
B. Weather (WWD): [HOURS]h<br>
C. Charterers' Time: [HOURS]h<br>
D. Exceptions: [HOURS]h</p>

<p>Total Deductions: [X]h [Y]m</p>

<p><strong>5. NET TIME USED:</strong><br>
Gross: [X]h [Y]m<br>
Less Deductions: [X]h [Y]m<br>
<strong>NET: [X.XX] days</strong></p>

<p><strong>6. TIME ALLOWED:</strong><br>
[QTY] MT ÷ [RATE] MT/day = <strong>[X.XX] days</strong></p>

<p><strong>7. RESULT:</strong><br>
Used: [X.XX] days | Allowed: [X.XX] days</p>

<p>☐ <strong>DESPATCH:</strong> [X.XX] days × USD [RATE] = USD [AMOUNT]<br>
☐ <strong>DEMURRAGE:</strong> [X.XX] days × USD [RATE] = USD [AMOUNT]</p>

<h4>PAYMENT</h4>
<p>Within [X] days to:<br>
Bank: [BANK] | Account: [ACCOUNT] | SWIFT: [SWIFT]</p>

<p><strong>Prepared by:</strong> [NAME], [DATE]</p>

<div style="background:#f3f4f6;padding:12px;margin:15px 0;">
Subject to verification and C/P arbitration clause.
</div>`
                },
                {
                    title: "LETTER OF INDEMNITY (LOI)",
                    desc: "Letter of Indemnity for delivering without B/L",
                    content: `<h3>LETTER OF INDEMNITY</h3>

<p><strong>To:</strong> [CARRIER_NAME] (The Carrier)<br>
<strong>Date:</strong> [DATE]</p>

<p><strong>RE: Vessel:</strong> M/V [VESSEL_NAME] | Voyage: [VOY]<br>
<strong>Cargo:</strong> [DESCRIPTION]<br>
<strong>B/L No:</strong> [BL_NUMBER]</p>

<p>Dear Sirs,</p>

<p>We, the undersigned [REQUESTOR_NAME], hereby request you to deliver the above cargo to [RECEIVER_NAME] at [PORT] <strong>WITHOUT PRODUCTION OF THE ORIGINAL BILL OF LADING</strong>.</p>

<p>In consideration of your complying with our request, we hereby agree:</p>

<p><strong>1.</strong> To indemnify you and hold you harmless against all consequences of delivering without original B/L;</p>

<p><strong>2.</strong> To pay on demand all claims, losses, damages, costs, and expenses;</p>

<p><strong>3.</strong> To provide security if required by your P&I Club;</p>

<p><strong>4.</strong> This indemnity covers all parties including vessel owners, time/voyage charterers, agents, and servants;</p>

<p><strong>5.</strong> This indemnity governed by [GOVERNING_LAW] and jurisdiction of [JURISDICTION].</p>

<p><strong>For and on behalf of [COMPANY]:</strong></p>

<p>_______________________<br>
Authorized Signatory<br>
Name: [NAME]<br>
Title: [TITLE]<br>
Date: [DATE]</p>

<p><strong>COUNTER-SIGNED BY BANK:</strong></p>

<p>_______________________<br>
[BANK_NAME]<br>
[BANK_STAMP]</p>

<div style="background:#fff3cd;padding:12px;margin:15px 0;border-left:4px solid #ffc107;">
<strong>⚠️ WARNING:</strong> This LOI must be counter-signed by acceptable bank and approved by P&I Club before delivery.
</div>`
                },
                {
                    title: "LETTER OF UNDERTAKING (LOU)",
                    desc: "P&I Club Guarantee",
                    content: `<h3>LETTER OF UNDERTAKING</h3>

<p><strong>From:</strong> [P&I_CLUB_NAME]<br>
<strong>To:</strong> [CLAIMANT/AUTHORITY]<br>
<strong>Date:</strong> [DATE]</p>

<p><strong>RE: M/V [VESSEL_NAME]</strong><br>
<strong>IMO:</strong> [IMO_NO] | <strong>Flag:</strong> [FLAG]<br>
<strong>Owner:</strong> [OWNER_NAME]</p>

<p>Dear Sirs,</p>

<p>We, [P&I_CLUB_NAME], hereby <strong>UNDERTAKE</strong> to pay on behalf of the Owners of the above vessel:</p>

<p><strong>Amount:</strong> Up to USD [AMOUNT]</p>

<p><strong>In respect of:</strong> [CLAIM_DESCRIPTION]</p>

<p>This undertaking is subject to:</p>

<p>1. Our liability limited to USD [AMOUNT]<br>
2. Payment within [DAYS] days of receiving evidence of loss<br>
3. Governed by [LAW] and jurisdiction [COURT]<br>
4. Valid until [EXPIRY_DATE]</p>

<p>Yours faithfully,</p>

<p>_______________________<br>
[P&I_CLUB_NAME]<br>
Authorized Claims Manager<br>
[CONTACT_DETAILS]</p>

<div style="background:#d1fae5;padding:12px;margin:15px 0;border-left:4px solid #10b981;">
<strong>✓ CLUB GUARANTEE:</strong> This LOU issued by recognized P&I Club.
</div>`
                }
            ]
        },
        {
            category: "Cargo Documents",
            items: [
                {
                    title: "COMMERCIAL INVOICE",
                    desc: "Commercial Invoice Template",
                    content: `<h3>COMMERCIAL INVOICE</h3>

<p><strong>Invoice No:</strong> [INV_NUMBER]<br>
<strong>Date:</strong> [DATE]</p>

<p><strong>Exporter/Seller:</strong><br>
[COMPANY_NAME]<br>
[ADDRESS]<br>
Tax ID: [TAX_ID]</p>

<p><strong>Importer/Buyer:</strong><br>
[BUYER_NAME]<br>
[ADDRESS]<br>
Tax ID: [TAX_ID]</p>

<p><strong>Vessel:</strong> [VESSEL_NAME]<br>
<strong>Port of Loading:</strong> [LOAD_PORT]<br>
<strong>Port of Discharge:</strong> [DISCHARGE_PORT]<br>
<strong>Payment Terms:</strong> [TERMS]</p>

<h4>GOODS DESCRIPTION</h4>
<table>
<tr><th>Item</th><th>HS Code</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
<tr><td>1</td><td>[HS_CODE]</td><td>[DESC]</td><td>[QTY]</td><td>[PRICE]</td><td>[TOTAL]</td></tr>
</table>

<p><strong>Subtotal:</strong> USD [SUBTOTAL]<br>
<strong>Freight:</strong> USD [FREIGHT]<br>
<strong>Insurance:</strong> USD [INSURANCE]<br>
<strong>Total CIF:</strong> USD [TOTAL]</p>

<p>_______________________<br>
Authorized Signature</p>`
                },
                {
                    title: "PACKING LIST",
                    desc: "Packing List Template",
                    content: `<h3>PACKING LIST</h3>

<p><strong>Ref:</strong> [REF_NO] | <strong>Date:</strong> [DATE]</p>

<p><strong>Shipper:</strong> [SHIPPER]<br>
<strong>Consignee:</strong> [CONSIGNEE]<br>
<strong>Invoice:</strong> [INV_NO]</p>

<h4>PACKING DETAILS</h4>
<table>
<tr><th>Package No.</th><th>Type</th><th>Contents</th><th>Qty</th><th>Net Wt</th><th>Gross Wt</th><th>CBM</th></tr>
<tr><td>1-10</td><td>Carton</td><td>[ITEM]</td><td>[QTY]</td><td>[NET]kg</td><td>[GROSS]kg</td><td>[CBM]</td></tr>
</table>

<p><strong>Total Packages:</strong> [TOTAL]<br>
<strong>Total Gross Weight:</strong> [WEIGHT] kg<br>
<strong>Total Volume:</strong> [CBM] CBM</p>`
                },
                {
                    title: "CERTIFICATE OF ORIGIN",
                    desc: "Certificate of Origin",
                    content: `<h3>CERTIFICATE OF ORIGIN</h3>

<p><strong>Certificate No:</strong> [CERT_NO]<br>
<strong>Issue Date:</strong> [DATE]</p>

<p><strong>Exporter:</strong> [EXPORTER_NAME], [COUNTRY]</p>

<p><strong>Consignee:</strong> [CONSIGNEE], [COUNTRY]</p>

<p><strong>Goods Description:</strong><br>
[DESCRIPTION]</p>

<p><strong>HS Code:</strong> [HS_CODE]<br>
<strong>Quantity:</strong> [QTY]<br>
<strong>Value:</strong> USD [VALUE]</p>

<p>We hereby certify that the goods originated in <strong>[COUNTRY_OF_ORIGIN]</strong>.</p>

<p>_______________________<br>
Chamber of Commerce<br>
[STAMP]</p>`
                },
                {
                    title: "FUMIGATION CERTIFICATE",
                    desc: "Fumigation Certificate",
                    content: `<h3>FUMIGATION CERTIFICATE</h3>

<p><strong>Certificate No:</strong> [CERT_NO]<br>
<strong>Date:</strong> [DATE]</p>

<p><strong>Vessel:</strong> M/V [VESSEL_NAME]<br>
<strong>Location:</strong> [PORT]</p>

<p><strong>Fumigant Used:</strong> [CHEMICAL]<br>
<strong>Concentration:</strong> [CONCENTRATION]<br>
<strong>Exposure Time:</strong> [HOURS] hours<br>
<strong>Temperature:</strong> [TEMP]°C</p>

<p><strong>Areas Treated:</strong> [HOLDS/SPACES]</p>

<p>This certifies that fumigation was performed according to ISPM-15 standards.</p>

<p><strong>Valid Until:</strong> [EXPIRY_DATE]</p>

<p>_______________________<br>
Licensed Fumigator<br>
License No: [LICENSE]</p>`
                }
            ]
        },
        {
            category: "Vessel Certificates",
            items: [
                {
                    title: "DOC/SMC",
                    desc: "Document of Compliance / Safety Management Certificate",
                    content: `<h3>SAFETY MANAGEMENT CERTIFICATE (SMC)</h3>

<p><strong>Issued under ISM CODE (SOLAS Chapter IX)</strong></p>

<p><strong>Vessel Name:</strong> [VESSEL_NAME]<br>
<strong>IMO Number:</strong> [IMO_NO]<br>
<strong>Type of Ship:</strong> [TYPE]<br>
<strong>GT:</strong> [GT]<br>
<strong>Flag:</strong> [FLAG]</p>

<p><strong>Company:</strong> [COMPANY_NAME]<br>
<strong>Address:</strong> [ADDRESS]</p>

<p><strong>DOC No:</strong> [DOC_NUMBER]<br>
<strong>SMC No:</strong> [SMC_NUMBER]</p>

<p>This certificate is valid until <strong>[EXPIRY_DATE]</strong></p>

<p>Intermediate verification due: [DATE]</p>

<p><strong>Issued by:</strong><br>
[FLAG_STATE / RO_NAME]<br>
Date: [DATE]<br>
Place: [PORT]</p>

<div style="background:#d1fae5;padding:12px;margin:15px 0;border-left:4px solid #10b981;">
<strong>✓ ISM COMPLIANT:</strong> Safety Management System verified
</div>`
                },
                {
                    title: "TONNAGE CERTIFICATE",
                    desc: "International Tonnage Certificate",
                    content: `<h3>INTERNATIONAL TONNAGE CERTIFICATE (1969)</h3>

<p><strong>Vessel:</strong> [VESSEL_NAME]<br>
<strong>IMO:</strong> [IMO_NO]<br>
<strong>Port of Registry:</strong> [PORT]<br>
<strong>Flag:</strong> [FLAG]</p>

<p><strong>TONNAGES:</strong><br>
Gross Tonnage: <strong>[GT]</strong><br>
Net Tonnage: <strong>[NT]</strong></p>

<p>Issued under the International Convention on Tonnage Measurement of Ships, 1969.</p>

<p><strong>Issued:</strong> [DATE]<br>
<strong>Expires:</strong> PERMANENT</p>

<p>_______________________<br>
[FLAG_STATE]</p>`
                },
                {
                    title: "LOAD LINE CERTIFICATE",
                    desc: "Load Line Certificate",
                    content: `<h3>INTERNATIONAL LOAD LINE CERTIFICATE</h3>

<p><strong>Vessel:</strong> [VESSEL_NAME] | <strong>IMO:</strong> [IMO]<br>
<strong>Type:</strong> [TYPE] | <strong>Flag:</strong> [FLAG]</p>

<p><strong>FREEBOARD:</strong><br>
Summer: [S]mm<br>
Winter: [W]mm<br>
Tropical: [T]mm<br>
Fresh Water: [F]mm</p>

<p><strong>Issue Date:</strong> [DATE]<br>
<strong>Valid Until:</strong> [EXPIRY]</p>

<p><strong>Annual Surveys:</strong><br>
1st: [DATE] | 2nd: [DATE] | 3rd: [DATE] | 4th: [DATE]</p>

<p>_______________________<br>
Classification Society / Flag State</p>`
                },
                {
                    title: "CLASS CERTIFICATE",
                    desc: "Classification Certificate",
                    content: `<h3>CERTIFICATE OF CLASSIFICATION</h3>

<p><strong>Classification Society:</strong> [CLASS_SOCIETY]<br>
(e.g., Lloyd's Register, DNV, ABS, Bureau Veritas)</p>

<p><strong>Vessel:</strong> [VESSEL_NAME]<br>
<strong>IMO:</strong> [IMO_NO]<br>
<strong>Hull No:</strong> [HULL_NO]</p>

<p><strong>Class Notation:</strong><br>
<strong>[CLASS_NOTATION]</strong><br>
(e.g., ✠ 100A1 Ice Class 1A)</p>

<p><strong>Built:</strong> [YEAR] at [SHIPYARD]</p>

<p><strong>Valid Until:</strong> [DATE]</p>

<p><strong>Next Special Survey:</strong> [DATE]<br>
<strong>Next Annual Survey:</strong> [DATE]</p>

<p>This vessel maintains class in good standing.</p>

<p>_______________________<br>
[CLASS_SOCIETY]<br>
Surveyor: [NAME]</p>`
                }
            ]
        },
        {
            category: "Operational Forms",
            items: [
                {
                    title: "CARGO STOWAGE PLAN",
                    desc: "Stowage Plan / Cargo Plan",
                    content: `<h3>CARGO STOWAGE PLAN</h3>

<p><strong>Vessel:</strong> M/V [VESSEL_NAME]<br>
<strong>Voyage:</strong> [VOYAGE_NO]<br>
<strong>Load Port:</strong> [PORT] | <strong>Date:</strong> [DATE]</p>

<h4>HOLD ALLOCATION</h4>
<table>
<tr><th>Hold</th><th>Cargo</th><th>Quantity (MT)</th><th>Destination</th></tr>
<tr><td>Hold 1</td><td>[CARGO_TYPE]</td><td>[QTY]</td><td>[PORT]</td></tr>
<tr><td>Hold 2</td><td>[CARGO_TYPE]</td><td>[QTY]</td><td>[PORT]</td></tr>
<tr><td>Hold 3</td><td>[CARGO_TYPE]</td><td>[QTY]</td><td>[PORT]</td></tr>
</table>

<p><strong>Total Cargo:</strong> [TOTAL] MT<br>
<strong>Departure Draft:</strong> Fwd [FWD]m / Aft [AFT]m<br>
<strong>GM:</strong> [GM] meters</p>

<p><strong>Segregation:</strong> [DETAILS]</p>

<p>Prepared by Chief Officer: _______<br>
Approved by Master: _______</p>`
                },
                {
                    title: "OIL RECORD BOOK",
                    desc: "Oil Record Book (Part I/II)",
                    content: `<h3>OIL RECORD BOOK - PART I (MACHINERY)</h3>

<p><strong>Vessel:</strong> M/V [VESSEL_NAME] | <strong>IMO:</strong> [IMO]</p>

<p><strong>Date:</strong> [DATE] | <strong>Time:</strong> [TIME]<br>
<strong>Position:</strong> [LAT]/[LONG] | <strong>Port:</strong> [PORT]</p>

<h4>OPERATION CODE</h4>
<p>☐ (A) Ballasting/cleaning of fuel oil tanks<br>
☐ (B) Discharge of ballast from fuel oil tanks<br>
☐ (C) Collection/disposal of oil residues<br>
☐ (D) Disposal of bilge water<br>
☐ (E) Bunkering operations</p>

<p><strong>Code:</strong> [CODE] - [DESCRIPTION]</p>

<p><strong>Quantity:</strong> [QUANTITY] liters<br>
<strong>Method:</strong> [METHOD]<br>
<strong>Tank:</strong> [TANK_NAME]</p>

<p><strong>Remarks:</strong><br>
[DETAILS]</p>

<p>Signed: ______ (Chief Engineer)<br>
Counter-signed: ______ (Master)</p>`
                },
                {
                    title: "DECK LOG BOOK",
                    desc: "Deck Log Book Template",
                    content: `<h3>DECK LOG BOOK</h3>

<p><strong>Vessel:</strong> M/V [VESSEL_NAME]<br>
<strong>Date:</strong> [DATE]<br>
<strong>Position at Noon:</strong> [LAT]/[LONG]</p>

<h4>0800-1200 WATCH</h4>
<table>
<tr><th>Time</th><th>Course</th><th>Speed</th><th>Log</th><th>Event</th></tr>
<tr><td>0800</td><td>[COURSE]°</td><td>[SPEED]kts</td><td>[LOG]nm</td><td>Watch commenced</td></tr>
<tr><td>0900</td><td>[COURSE]°</td><td>[SPEED]kts</td><td>[LOG]nm</td><td>[EVENT]</td></tr>
</table>

<p><strong>Weather:</strong> Wind [DIR] [FORCE]BF, Sea [STATE], Visibility [VIS]nm<br>
<strong>Barometer:</strong> [PRESSURE]mb | <strong>Temp:</strong> [TEMP]°C</p>

<p><strong>Distance Run:</strong> [DISTANCE]nm<br>
<strong>Remarks:</strong> [REMARKS]</p>

<p>Officer of Watch: _______</p>`
                },
                {
                    title: "ENGINE LOG BOOK",
                    desc: "Engine Room Log Template",
                    content: `<h3>ENGINE ROOM LOG</h3>

<p><strong>Vessel:</strong> M/V [VESSEL_NAME]<br>
<strong>Date:</strong> [DATE] | <strong>Watch:</strong> [WATCH_HOURS]</p>

<h4>MAIN ENGINE</h4>
<p>Running Hours: [HOURS]<br>
RPM: [RPM]<br>
Load: [LOAD]%<br>
Fuel Consumption: [CONS] MT/day</p>

<h4>TEMPERATURES & PRESSURES</h4>
<table>
<tr><th>Parameter</th><th>Reading</th><th>Normal Range</th></tr>
<tr><td>Lub Oil Inlet</td><td>[TEMP]°C</td><td>40-50°C</td></tr>
<tr><td>Cooling Water</td><td>[TEMP]°C</td><td>75-85°C</td></tr>
<tr><td>Exhaust Gas</td><td>[TEMP]°C</td><td>300-400°C</td></tr>
</table>

<p><strong>Fuel Oil ROB:</strong> [QTY] MT<br>
<strong>Remarks:</strong> [REMARKS]</p>

<p>Engineer on Watch: _______</p>`
                }
            ]
        }
    ];
    
    const categoryColors = {
        'Charter Party Forms': '#0066FF',
        'Bills of Lading': '#D4A853',
        'Notices & Statements': '#10B981',
        'Vessel Certificates': '#7C3AED',
        'Cargo Documents': '#F59E0B',
        'Operational Forms': '#EF4444'
    };
    
    const categoryIcons = {
        'Charter Party Forms': 'fa-file-contract',
        'Bills of Lading': 'fa-file-invoice',
        'Notices & Statements': 'fa-bell',
        'Vessel Certificates': 'fa-certificate',
        'Cargo Documents': 'fa-boxes-stacked',
        'Operational Forms': 'fa-clipboard-list'
    };
    
    container.innerHTML = "";
    data.forEach(cat => {
        let html = `<div class="category-header">${cat.category}</div><div class="docs-grid">`;
        const color = categoryColors[cat.category] || '#0066FF';
        const icon = categoryIcons[cat.category] || 'fa-file';
        
        cat.items.forEach(item => {
            const safeContent = item.content.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
            const code = item.title;
            const extraInfo = item.extraInfo || 'Standard Template';
            
            html += `<div class="doc-card" style="cursor:pointer;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
                    <i class="fa-solid ${icon} doc-icon" style="color:${color};font-size:40px;"></i>
                    <span style="background:${color}20;color:${color};padding:6px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.5px;">
                        ${cat.category.toUpperCase()}
                    </span>
                </div>
                <div style="font-size:15px;font-weight:700;color:${color};margin-bottom:6px;letter-spacing:0.5px;">
                    ${code}
                </div>
                <div class="doc-title" style="font-size:18px;margin-bottom:8px;color:#111827;">
                    ${item.desc}
                </div>
                <div class="doc-desc" style="margin-bottom:12px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                    ${item.desc}
                </div>
                <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#6b7280;margin-bottom:16px;padding-top:12px;border-top:1px solid #e5e7eb;">
                    <i class="fa-solid fa-code"></i>
                    <span>${extraInfo}</span>
                </div>
                <button class="btn-download" style="width:100%;" onclick='openContentModal("${item.title}", \`${safeContent}\`)'>
                    <i class="fa-solid fa-eye"></i>
                    ${t.btn_read || 'VIEW DOCUMENT'}
                </button>
            </div>`;
        });
        html += '</div>';
        container.innerHTML += html;
    });
}

async function loadRegulations() {
    const rGrid = document.getElementById('regsGrid');
    if (!rGrid) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    rGrid.innerHTML = '';
    
    const data = [
        { 
            code: "SOLAS 1974", 
            title: "Safety of Life at Sea", 
            summary: "International Convention - Minimum Safety Standards",
            category: "Safety",
            updated: "2024 Amendments",
            content: `<h3>SOLAS 1974 - International Convention for Safety of Life at Sea</h3>
            
            <h4>📜 Overview</h4>
            <p>SOLAS is the most important treaty addressing maritime safety. First version adopted in 1914 after Titanic disaster. Current version from 1974, continuously updated.</p>
            
            <h4>📊 14 Chapters Overview:</h4>
            <div style="background:#e6f0ff;padding:15px;border-radius:8px;margin:15px 0;">
                <ul style="line-height:1.8;">
                    <li><strong>Chapter I:</strong> General Provisions (application, surveys, certificates)</li>
                    <li><strong>Chapter II-1:</strong> Construction (subdivision, stability, machinery, electrical)</li>
                    <li><strong>Chapter II-2:</strong> Fire Protection, Detection & Extinction</li>
                    <li><strong>Chapter III:</strong> Life-Saving Appliances (lifeboats, rafts, LSA)</li>
                    <li><strong>Chapter IV:</strong> Radio Communications (GMDSS)</li>
                    <li><strong>Chapter V:</strong> Navigation Safety (AIS, VDR, ECDIS, bridge design)</li>
                    <li><strong>Chapter VI:</strong> Carriage of Cargoes (grain, dangerous goods)</li>
                    <li><strong>Chapter VII:</strong> Dangerous Goods (IMDG Code)</li>
                    <li><strong>Chapter VIII:</strong> Nuclear Ships</li>
                    <li><strong>Chapter IX:</strong> ISM Code (Safety Management)</li>
                    <li><strong>Chapter X:</strong> High Speed Craft (HSC Code)</li>
                    <li><strong>Chapter XI-1:</strong> Special Measures - Enhanced Maritime Safety</li>
                    <li><strong>Chapter XI-2:</strong> ISPS Code (Ship & Port Facility Security)</li>
                    <li><strong>Chapter XIV:</strong> Polar Code (Arctic/Antarctic operations)</li>
                </ul>
            </div>
            
            <h4>🚢 Key Requirements by Vessel Size:</h4>
            <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                <tr style="background:#1e293b;color:white;">
                    <th style="padding:10px;border:1px solid #334155;">Requirement</th>
                    <th style="padding:10px;border:1px solid #334155;">Applies to</th>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Fire Detection System</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">All vessels ≥500 GT</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;">AIS (Automatic Identification System)</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">All vessels ≥300 GT + passenger ships</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;">VDR (Voyage Data Recorder)</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Passenger ships + vessels ≥3,000 GT (built after 2002)</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;">ECDIS (Electronic Chart Display)</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Phased in 2012-2018 for vessels ≥500 GT</td>
                </tr>
            </table>
            
            <h4>📅 Recent Amendments (2024):</h4>
            <p>• Enhanced fire safety for vehicle/Ro-Ro spaces<br>
            • Structural fire protection improvements<br>
            • Updated life-saving appliance testing protocols<br>
            • Cyber risk management mandatory in SMS (since 2021)</p>
            
            <h4>⚖️ Enforcement:</h4>
            <p>Port State Control (PSC) enforces SOLAS. Non-compliance = detention, deficiencies, fines.</p>`
        },
        { 
            code: "MARPOL 73/78", 
            title: "Marine Pollution Prevention", 
            summary: "International Convention - Oil, Garbage, Sewage, Air Emissions",
            category: "Environment",
            updated: "IMO 2020 Sulphur Cap",
            content: `<h3>MARPOL 73/78 - International Convention for Prevention of Pollution from Ships</h3>
            
            <h4>🌊 Overview</h4>
            <p>MARPOL = Marine Pollution. Adopted 1973, Protocol 1978. Covers all technical aspects of pollution from ships (except dumping). 159 countries, 99% of world tonnage.</p>
            
            <h4>📋 Six Annexes:</h4>
            
            <div style="background:#fef3c7;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>Annex I - Oil Pollution (1983)</h5>
                <p><strong>Mandatory</strong> | Covers crude oil, fuel oil, sludge, oily bilge water</p>
                <ul>
                    <li>15 ppm limit for oil discharge at sea (>12nm from land)</li>
                    <li>Oil Record Book (ORB) mandatory</li>
                    <li>Segregated Ballast Tanks (SBT) for tankers >20,000 DWT</li>
                    <li>Double hull requirements for oil tankers</li>
                </ul>
            </div>
            
            <div style="background:#fee2e2;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>Annex II - Noxious Liquid Substances (1987)</h5>
                <p><strong>Mandatory</strong> | Chemical tankers</p>
                <ul>
                    <li>Cargo Record Book required</li>
                    <li>Categories: X (no discharge), Y (limited), Z (allowed), OS (other)</li>
                    <li>Prewash requirements for Category X</li>
                </ul>
            </div>
            
            <div style="background:#e0e7ff;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>Annex III - Harmful Substances in Packaged Form (1992)</h5>
                <p><strong>Mandatory</strong> | IMDG Code compliance</p>
                <ul>
                    <li>Packaging, labeling, documentation standards</li>
                    <li>Stowage requirements</li>
                </ul>
            </div>
            
            <div style="background:#d1fae5;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>Annex IV - Sewage (2003)</h5>
                <p><strong>Mandatory</strong> | Human waste discharge</p>
                <ul>
                    <li>No discharge within 3nm of land (unless treated + approved system)</li>
                    <li>12nm: Comminuted & disinfected sewage allowed</li>
                    <li>Sewage treatment plant or holding tank required</li>
                </ul>
            </div>
            
            <div style="background:#fce7f3;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>Annex V - Garbage (1988, Revised 2013)</h5>
                <p><strong>Mandatory</strong> | Solid waste management</p>
                <ul>
                    <li><strong>Plastics:</strong> Complete ban on discharge (anywhere, anytime)</li>
                    <li><strong>Food waste:</strong> ≥12nm from land (comminuted: ≥3nm)</li>
                    <li><strong>Cargo residues:</strong> ≥12nm (non-HME) / ≥25nm (HME)</li>
                    <li>Garbage Management Plan + Record Book mandatory (≥400 GT)</li>
                </ul>
            </div>
            
            <div style="background:#e6f0ff;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>Annex VI - Air Pollution (2005, Amended 2020)</h5>
                <p><strong>Mandatory</strong> | NOx, SOx, GHG, ODS</p>
                <ul>
                    <li><strong>Global Sulphur Cap:</strong> 0.50% since Jan 1, 2020 (was 3.50%)</li>
                    <li><strong>ECA Zones:</strong> 0.10% sulphur (Baltic, North Sea, North America, Caribbean)</li>
                    <li><strong>NOx Tiers:</strong> Tier I/II/III based on build year (Tier III: 80% reduction in ECAs)</li>
                    <li><strong>EEDI/EEXI/CII:</strong> Energy efficiency regulations</li>
                    <li><strong>Scrubbers:</strong> Allowed as alternative to low-sulphur fuel</li>
                </ul>
            </div>
            
            <h4>💰 Compliance Costs:</h4>
            <div style="background:#f1f5f9;padding:15px;border-radius:8px;">
                <p><strong>IMO 2020 Sulphur Cap Impact:</strong><br>
                VLSFO (0.5%) vs HSFO (3.5%): $150-250/MT price premium<br>
                Scrubber installation: $2-10M depending on vessel size<br>
                Non-compliance fine: Up to $50,000/day in some jurisdictions</p>
            </div>
            
            <h4>🔍 Enforcement:</h4>
            <p>• Port State Control inspections<br>
            • Fuel sampling (MARPOL Annex VI)<br>
            • ORB/Garbage Record Book audits<br>
            • Satellite surveillance (oil spills)</p>`
        },
        { 
            code: "ISM Code", 
            title: "International Safety Management", 
            summary: "Mandatory SMS - Chapter IX SOLAS",
            category: "Management",
            updated: "2024 Edition",
            content: `<h3>ISM Code - International Safety Management Code</h3>
            
            <h4>📋 What is ISM?</h4>
            <p>ISM Code became mandatory 1998 (passenger/tanker/bulk) and 2002 (all commercial ships ≥500 GT). Part of SOLAS Chapter IX. Requires documented Safety Management System (SMS).</p>
            
            <h4>🎯 Objectives:</h4>
            <ol style="line-height:1.8;">
                <li>Provide safe practices in ship operation</li>
                <li>Provide safe working environment</li>
                <li>Establish safeguards against identified risks</li>
                <li>Continuously improve safety management skills</li>
                <li>Ensure compliance with mandatory rules/regulations</li>
            </ol>
            
            <h4>📊 13 Elements of ISM Code:</h4>
            
            <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                <tr style="background:#1e293b;color:white;">
                    <th style="padding:10px;border:1px solid #334155;">Element</th>
                    <th style="padding:10px;border:1px solid #334155;">Requirement</th>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>1. General</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Objectives & functional requirements</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>2. Safety & Environmental Policy</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Company must establish policy signed by management</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>3. Company Responsibilities</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">DPA (Designated Person Ashore) mandatory</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>4. Designated Person(s)</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Shore-based link with direct access to management</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>5. Master's Responsibility</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Authority, overriding authority in safety matters</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>6. Resources & Personnel</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Qualified, medically fit, certified crew</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>7. Development of Plans</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Emergency procedures, drills, contingency plans</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>8. Emergency Preparedness</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Identify potential emergency scenarios</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>9. Reports & Analysis</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Non-conformities, accidents, hazards reporting</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>10. Maintenance</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Planned Maintenance System (PMS)</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>11. Documentation</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">SMS Manual, procedures, records control</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>12. Company Verification</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Internal audits (annually minimum)</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>13. Certification & Verification</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">DOC (Company) + SMC (Ship) certificates</td>
                </tr>
            </table>
            
            <h4>📜 Mandatory Certificates:</h4>
            <div style="background:#e6f0ff;padding:15px;border-radius:8px;margin:15px 0;">
                <p><strong>DOC (Document of Compliance):</strong><br>
                • Issued to Company (not vessel)<br>
                • Valid 5 years<br>
                • Intermediate verification between 2nd-3rd year<br>
                • Covers fleet managed by company</p>
                
                <p style="margin-top:15px;"><strong>SMC (Safety Management Certificate):</strong><br>
                • Issued to individual vessel<br>
                • Valid 5 years<br>
                • Intermediate audits: 2nd & 3rd year<br>
                • Additional audits if deficiencies found</p>
            </div>
            
            <h4>🔍 ISM Audit Process:</h4>
            <ol style="line-height:1.8;">
                <li><strong>Initial Audit:</strong> DOC/SMC issuance (company + ship)</li>
                <li><strong>Intermediate Audits:</strong> Between 2nd-3rd anniversary years</li>
                <li><strong>Renewal Audit:</strong> Before certificate expiry (5 years)</li>
                <li><strong>Additional Audits:</strong> For major non-conformities</li>
            </ol>
            
            <h4>⚠️ Common Non-Conformities:</h4>
            <ul>
                <li>Incomplete risk assessments</li>
                <li>Inadequate near-miss reporting system</li>
                <li>Missing internal audit records</li>
                <li>DPA not accessible or ineffective</li>
                <li>Crew unfamiliar with SMS procedures</li>
                <li>PMS not followed correctly</li>
                <li>Emergency drills not conducted as required</li>
            </ul>
            
            <h4>💡 Best Practices:</h4>
            <p>• SMS should be user-friendly, not bureaucratic<br>
            • Crew buy-in essential - they must understand "why"<br>
            • Near-miss reporting culture saves lives<br>
            • DPA must visit ships regularly<br>
            • Management review meetings critical<br>
            • Root Cause Analysis for incidents</p>`
        },
        { 
            code: "ISPS Code", 
            title: "Ship & Port Facility Security", 
            summary: "SOLAS XI-2 - Maritime Security Post-9/11",
            category: "Security",
            updated: "Ongoing Amendments",
            content: `<h3>ISPS Code - International Ship & Port Facility Security Code</h3>
            
            <h4>🔒 Background</h4>
            <p>Adopted December 2002 (post-9/11), entered force July 1, 2004. Part of SOLAS Chapter XI-2. Addresses maritime security threats including terrorism, piracy, smuggling.</p>
            
            <h4>📊 Two Parts:</h4>
            <div style="background:#fee2e2;padding:15px;border-radius:8px;margin:15px 0;">
                <p><strong>Part A - Mandatory:</strong> Governments, port authorities, shipping companies must comply</p>
                <p><strong>Part B - Guidance:</strong> Recommendations on implementation</p>
            </div>
            
            <h4>🚢 Applies To:</h4>
            <ul style="line-height:1.8;">
                <li>Passenger ships (international voyages)</li>
                <li>Cargo ships ≥500 GT (international voyages)</li>
                <li>Mobile offshore drilling units</li>
                <li>Port facilities serving above ships</li>
            </ul>
            
            <h4>📋 Three Security Levels:</h4>
            
            <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                <tr style="background:#1e293b;color:white;">
                    <th style="padding:10px;border:1px solid #334155;">Level</th>
                    <th style="padding:10px;border:1px solid #334155;">Threat</th>
                    <th style="padding:10px;border:1px solid #334155;">Measures</th>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Level 1 - Normal</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Day-to-day minimum</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">ID checks, access control, patrols</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Level 2 - Heightened</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Increased risk</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Additional checks, escorts, surveillance, reduced access</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Level 3 - Exceptional</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Specific threat</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Prepared security measures, possible evacuation</td>
                </tr>
            </table>
            
            <h4>📜 Required Documents:</h4>
            
            <div style="background:#e6f0ff;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>1. Ship Security Plan (SSP)</h5>
                <p>Vessel-specific security procedures addressing:</p>
                <ul>
                    <li>Security organization</li>
                    <li>Ship security equipment</li>
                    <li>Location of restricted areas</li>
                    <li>Emergency procedures</li>
                    <li>Training requirements</li>
                </ul>
            </div>
            
            <div style="background:#fef3c7;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>2. International Ship Security Certificate (ISSC)</h5>
                <p>Valid 5 years<br>
                Intermediate verifications required<br>
                Issued after SSP approval + verification audit</p>
            </div>
            
            <div style="background:#d1fae5;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>3. Continuous Synopsis Record (CSR)</h5>
                <p>"Passport" of ship containing:<br>
                • Ship's history (name changes, owners, flags)<br>
                • Updated throughout vessel's life<br>
                • Must be on board at all times</p>
            </div>
            
            <h4>👤 Key Personnel:</h4>
            <ul style="line-height:1.8;">
                <li><strong>Company Security Officer (CSO):</strong> Shore-based, responsible for company fleet security</li>
                <li><strong>Ship Security Officer (SSO):</strong> On board, implements SSP, reports to CSO & Master</li>
                <li><strong>Port Facility Security Officer (PFSO):</strong> Port-side security management</li>
            </ul>
            
            <h4>🔐 Physical Security Measures:</h4>
            <ul>
                <li>Ship Security Alert System (SSAS) - silent alarm to authorities</li>
                <li>AIS (cannot be switched off except exceptional circumstances)</li>
                <li>Access control (gangway watch, ID cards)</li>
                <li>Restricted areas clearly marked</li>
                <li>CCTV surveillance</li>
                <li>Lighting requirements</li>
                <li>Fencing and barriers</li>
            </ul>
            
            <h4>📄 Declaration of Security (DoS):</h4>
            <p>Agreement between ship and port/other ship when security levels differ or specific operations require it.<br>
            Mandatory when vessel operating at Security Level 2 or 3.<br>
            Optional at Level 1 if parties agree.</p>
            
            <h4>⚠️ Port State Control:</h4>
            <p>PSC can verify ISSC validity but <strong>cannot</strong> inspect SSP details (security sensitive).<br>
            SSP = Confidential document<br>
            Only flag state/RSO can inspect SSP content</p>`
        },
        { 
            code: "MLC 2006", 
            title: "Maritime Labour Convention", 
            summary: "Seafarers' Bill of Rights - Living & Working Conditions",
            category: "Labour",
            updated: "2024 Amendments",
            content: `<h3>MLC 2006 - Maritime Labour Convention</h3>
            
            <h4>👨‍✈️ Overview</h4>
            <p>"Seafarers' Bill of Rights" - Consolidates 68 maritime labour instruments. Entered force August 20, 2013. Applies to all commercial vessels ≥500 GT (some requirements to <500 GT).</p>
            
            <h4>📋 Five Titles (Principles + Rights):</h4>
            
            <div style="background:#e6f0ff;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>Title 1 - Minimum Requirements for Seafarers to Work on Ship</h5>
                <ul>
                    <li>Minimum age: 16 years (18 for hazardous work)</li>
                    <li>Medical certificate valid (max 2 years, 1 year if under 18)</li>
                    <li>Training and qualifications per STCW</li>
                    <li>Recruitment through licensed agencies</li>
                </ul>
            </div>
            
            <div style="background:#d1fae5;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>Title 2 - Conditions of Employment</h5>
                <ul>
                    <li>Written Seafarer Employment Agreement (SEA) mandatory</li>
                    <li>Wages paid monthly, bank transfer</li>
                    <li>Minimum monthly wage: ILO sets floor (currently ~$658/month for AB)</li>
                    <li>Hours of work/rest: Max 14 hours/day, 72 hours/week</li>
                    <li>Paid annual leave: 2.5 days per month minimum</li>
                    <li>Repatriation rights (including if ship lost)</li>
                </ul>
            </div>
            
            <div style="background:#fef3c7;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>Title 3 - Accommodation, Recreational Facilities, Food & Catering</h5>
                <ul>
                    <li>Cabin size minimums (newer ships: 4.5m² single berth)</li>
                    <li>Headroom minimum: 2.03m</li>
                    <li>Separate facilities for men/women</li>
                    <li>Mess rooms required</li>
                    <li>Recreational facilities</li>
                    <li>Food quality and variety standards</li>
                    <li>Qualified ship's cook required (vessels with 10+ crew)</li>
                </ul>
            </div>
            
            <div style="background:#fee2e2;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>Title 4 - Health Protection, Medical Care, Welfare & Social Security</h5>
                <ul>
                    <li>Medical care on board and ashore at no cost</li>
                    <li>Minimum medical equipment/medicines per WHO guidelines</li>
                    <li>Ship ≥100+ persons: Doctor required</li>
                    <li>Seafarers Welfare facilities in ports</li>
                    <li>Social security protection (sickness, injury, death)</li>
                    <li>Financial security for abandonment, death, long-term disability</li>
                </ul>
            </div>
            
            <div style="background:#e0e7ff;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>Title 5 - Compliance & Enforcement</h5>
                <ul>
                    <li>Flag state responsibilities</li>
                    <li>Port State Control inspection (PSC)</li>
                    <li>On-board complaint procedures</li>
                    <li>Marine Labour Certificate + DMLC (Parts I & II)</li>
                </ul>
            </div>
            
            <h4>📜 Mandatory Certificates:</h4>
            <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                <tr style="background:#1e293b;color:white;">
                    <th style="padding:10px;border:1px solid #334155;">Certificate</th>
                    <th style="padding:10px;border:1px solid #334155;">Details</th>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>MLC Certificate</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Valid 5 years, Intermediate inspection required</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>DMLC Part I</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">National requirements (prepared by flag state)</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>DMLC Part II</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Company measures (how compliance achieved)</td>
                </tr>
            </table>
            
            <h4>💰 Financial Security Requirements (2017 Amendments):</h4>
            <p>Mandatory insurance/guarantee for:</p>
            <ul>
                <li><strong>Abandonment:</strong> 4 months wages + repatriation</li>
                <li><strong>Death/Long-term Disability:</strong> $100,000 minimum</li>
                <li>Certificate of financial security must be carried on board</li>
                <li>P&I Clubs typically provide MLC Blue Cards</li>
            </ul>
            
            <h4>📞 On-Board Complaint Procedure:</h4>
            <p>Seafarers have right to lodge complaint without reprisal:<br>
            Step 1: Master/HOD<br>
            Step 2: Company<br>
            Step 3: Flag state authority<br>
            Step 4: Port state (if unresolved)</p>
            
            <h4>🔍 PSC Inspection:</h4>
            <p>Inspectors can board to verify MLC compliance. Common deficiencies:<br>
            • Expired medical certificates<br>
            • Unpaid wages (>2 months = detention)<br>
            • Inadequate food/water<br>
            • Excessive working hours<br>
            • Substandard accommodation</p>`
        },
        { 
            code: "STCW 1978/2010", 
            title: "Standards of Training, Certification & Watchkeeping", 
            summary: "Seafarer Competency Standards - The Manila Amendments",
            category: "Training",
            updated: "Manila 2010 Amendments",
            content: `<h3>STCW Convention 1978 - Standards of Training, Certification and Watchkeeping</h3>
            
            <h4>📚 Overview</h4>
            <p>First adopted 1978, major revision 1995 (STCW 95), further amended 2010 (Manila Amendments). Sets minimum qualification standards for masters, officers, ratings. Applies to seafarers serving on seagoing ships entitled to fly flag of a Party.</p>
            
            <h4>📊 Key Components:</h4>
            <div style="background:#e6f0ff;padding:15px;border-radius:8px;margin:15px 0;">
                <ul style="line-height:1.8;">
                    <li><strong>Annex:</strong> Mandatory standards (6 chapters)</li>
                    <li><strong>STCW Code:</strong> Part A (Mandatory) + Part B (Guidance)</li>
                    <li><strong>White List:</strong> Countries proven to meet STCW standards</li>
                </ul>
            </div>
            
            <h4>📋 Six Chapters:</h4>
            
            <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                <tr style="background:#1e293b;color:white;">
                    <th style="padding:10px;border:1px solid #334155;">Chapter</th>
                    <th style="padding:10px;border:1px solid #334155;">Coverage</th>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Chapter I</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">General Provisions (quality standards, medical, training)</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Chapter II</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Master and Deck Department</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Chapter III</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Engine Department</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Chapter IV</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Radio Communications (GMDSS)</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Chapter V</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Special Training (tankers, passenger ships, etc.)</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Chapter VI</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Emergency, Occupational Safety, Medical Care, Survival</td>
                </tr>
            </table>
            
            <h4>👨‍✈️ Certificate Hierarchy (Deck):</h4>
            <div style="background:#d1fae5;padding:15px;border-radius:8px;margin:15px 0;">
                <p><strong>Officer of the Watch (OOW) - ≥500 GT:</strong><br>
                • 36 months seagoing service (12 months as rating)<br>
                • Approved training<br>
                • Watchkeeping qualification</p>
                
                <p style="margin-top:15px;"><strong>Chief Mate - ≥3,000 GT:</strong><br>
                • Hold OOW certificate<br>
                • 12 months service as OOW<br>
                • Approved advanced training</p>
                
                <p style="margin-top:15px;"><strong>Master - ≥3,000 GT:</strong><br>
                • Hold Chief Mate certificate<br>
                • 12 months service as Chief Mate<br>
                • Leadership & management training</p>
            </div>
            
            <h4>🔧 Manila 2010 Key Amendments:</h4>
            <ul style="line-height:1.8;">
                <li><strong>Hours of Rest:</strong> Min 10 hours/24hr period (6 consecutive + 4 can be split max 2 periods)</li>
                <li><strong>Medical Fitness:</strong> Eyesight & hearing standards strengthened</li>
                <li><strong>Anti-Drug/Alcohol:</strong> 0.05% BAC limit, drug testing mandatory</li>
                <li><strong>Modern Training:</strong> ECDIS, Bridge Resource Management (BRM), Leadership</li>
                <li><strong>Security Training:</strong> Ship security awareness mandatory for all seafarers</li>
                <li><strong>Revalidation:</strong> Certificates valid 5 years, requires approved seagoing service or training</li>
            </ul>
            
            <h4>📜 Mandatory Training Courses:</h4>
            <table style="width:100%;border-collapse:collapse;margin:15px 0;line-height:1.6;">
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Basic Safety Training (BST):</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Fire prevention, survival, first aid, PPE</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>GMDSS (GOC/ROC):</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Radio operators</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Advanced Fire Fighting:</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Officers, fire teams</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Medical First Aid/Care:</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">All seafarers / designated persons</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>ECDIS:</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Deck officers on ECDIS-equipped ships</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;"><strong>Tanker Familiarization:</strong></td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Oil/Chemical/Gas tanker crew</td>
                </tr>
            </table>
            
            <h4>🎓 Competency-Based Training:</h4>
            <p>STCW uses "competency tables" - must demonstrate ability to perform tasks to required standard. Assessed through:<br>
            • Approved seagoing service<br>
            • Simulator assessments<br>
            • Practical demonstrations<br>
            • Examinations</p>`
        },
        { 
            code: "BWM Convention", 
            title: "Ballast Water Management", 
            summary: "Prevention of Invasive Aquatic Species Transfer",
            category: "Environment",
            updated: "Effective Sept 2017",
            content: `<h3>BWM Convention 2004 - Ballast Water Management</h3>
            
            <h4>🌊 Background</h4>
            <p>Adopted February 2004, entered force September 8, 2017. Addresses transfer of harmful aquatic organisms via ballast water. Estimated 3-5 billion tons of ballast water transferred globally each year.</p>
            
            <h4>⚓ What is Ballast Water?</h4>
            <p>Water carried in ship's tanks to improve stability, trim, structural integrity. Ships discharge ballast from origin port and take on new ballast at destination → transfers organisms thousands of miles.</p>
            
            <h4>🦠 The Problem:</h4>
            <ul style="line-height:1.8;">
                <li><strong>Zebra Mussels:</strong> From Caspian Sea to Great Lakes (billions in damage)</li>
                <li><strong>Toxic Algae:</strong> Cholera outbreaks</li>
                <li><strong>Comb Jellyfish:</strong> Collapsed Black Sea fisheries</li>
                <li>10,000+ species transported daily</li>
            </ul>
            
            <h4>📊 Two Standards:</h4>
            
            <div style="background:#fef3c7;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>Regulation D-1 (Ballast Water Exchange)</h5>
                <p><strong>Applicable:</strong> Ships built before September 2017 (during transition)</p>
                <p><strong>Requirement:</strong> Exchange 95% of ballast water at least 200nm from land and ≥200m depth</p>
                <p><strong>Method:</strong> Flow-through, sequential, or dilution</p>
            </div>
            
            <div style="background:#d1fae5;padding:15px;border-radius:8px;margin:15px 0;">
                <h5>Regulation D-2 (Ballast Water Performance Standard)</h5>
                <p><strong>Final Standard:</strong> Must treat ballast to achieve:</p>
                <table style="width:100%;margin-top:10px;border-collapse:collapse;">
                    <tr style="background:#1e293b;color:white;">
                        <th style="padding:8px;border:1px solid #334155;">Organism Size</th>
                        <th style="padding:8px;border:1px solid #334155;">Maximum Allowed</th>
                    </tr>
                    <tr>
                        <td style="padding:8px;border:1px solid #e5e7eb;">≥50 micrometers</td>
                        <td style="padding:8px;border:1px solid #e5e7eb;">&lt;10 viable organisms/m³</td>
                    </tr>
                    <tr style="background:#f9fafb;">
                        <td style="padding:8px;border:1px solid #e5e7eb;">10-50 micrometers</td>
                        <td style="padding:8px;border:1px solid #e5e7eb;">&lt;10 viable organisms/ml</td>
                    </tr>
                    <tr>
                        <td style="padding:8px;border:1px solid #e5e7eb;">Bacteria (Vibrio cholerae)</td>
                        <td style="padding:8px;border:1px solid #e5e7eb;">&lt;1 cfu/100ml</td>
                    </tr>
                    <tr style="background:#f9fafb;">
                        <td style="padding:8px;border:1px solid #e5e7eb;">E. coli</td>
                        <td style="padding:8px;border:1px solid #e5e7eb;">&lt;250 cfu/100ml</td>
                    </tr>
                </table>
            </div>
            
            <h4>⚙️ Ballast Water Treatment Systems (BWTS):</h4>
            <p><strong>Approved Methods:</strong></p>
            <ul>
                <li><strong>Filtration:</strong> Mechanical removal of organisms</li>
                <li><strong>UV Treatment:</strong> Ultraviolet radiation kills organisms</li>
                <li><strong>Electrolysis:</strong> Generates chlorine/hypochlorite</li>
                <li><strong>Ozonation:</strong> Ozone injection</li>
                <li><strong>Chemical Treatment:</strong> Approved biocides</li>
                <li><strong>Combination Systems:</strong> Filtration + UV/Electrolysis (most common)</li>
            </ul>
            
            <h4>📅 Implementation Timeline (D-2 Compliance):</h4>
            <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                <tr style="background:#1e293b;color:white;">
                    <th style="padding:10px;border:1px solid #334155;">Ship Built</th>
                    <th style="padding:10px;border:1px solid #334155;">D-2 Compliance Date</th>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Before 2009</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">By IOPP renewal after Sept 8, 2017 (but no later than Sept 8, 2024)</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;">2009-2011</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">By first IOPP renewal after Sept 8, 2016</td>
                </tr>
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;">2012-2016</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">By first IOPP renewal after Sept 8, 2019</td>
                </tr>
                <tr style="background:#f9fafb;">
                    <td style="padding:10px;border:1px solid #e5e7eb;">After Sept 8, 2017</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">Immediately upon delivery</td>
                </tr>
            </table>
            
            <h4>📜 Documentation Required:</h4>
            <ul style="line-height:1.8;">
                <li><strong>Ballast Water Management Certificate:</strong> Valid 5 years</li>
                <li><strong>Ballast Water Management Plan:</strong> Vessel-specific procedures</li>
                <li><strong>Ballast Water Record Book:</strong> All operations logged</li>
                <li><strong>Type Approval Certificate:</strong> For BWTS installed</li>
            </ul>
            
            <h4>💰 Costs:</h4>
            <div style="background:#fee2e2;padding:15px;border-radius:8px;margin:15px 0;">
                <p><strong>BWTS Installation Cost:</strong><br>
                Handysize: $500k - $1M<br>
                Panamax: $1M - $1.5M<br>
                Capesize: $1.5M - $3M<br>
                VLCC: $2M - $5M</p>
                
                <p style="margin-top:10px;"><strong>Operating Costs:</strong><br>
                Power consumption: 100-500 kW<br>
                Maintenance: $50k-150k/year<br>
                Spares & consumables</p>
            </div>
            
            <h4>🔍 PSC Enforcement:</h4>
            <p>• BWM Certificate validity<br>
            • Record Book entries<br>
            • BWTS operational<br>
            • Sampling/testing (rare but increasing)<br>
            • Non-compliance = detention + fines ($25k-100k)</p>
            
            <h4>🇺🇸 US VGP (Vessel General Permit):</h4>
            <p>US has separate, stricter requirements via EPA/USCG:<br>
            • Numeric discharge limits (similar to D-2 but some differences)<br>
            • USCG Type Approval separate from IMO<br>
            • Additional state requirements (California, Great Lakes)<br>
            • Both BWM Certificate AND VGP required for US waters</p>`
        }
    ];
    
    // Category colors for regulations
    const categoryColors = {
        'Safety': '#EF4444',
        'Environment': '#10B981',
        'Navigation': '#0066FF',
        'Cargo Safety': '#F59E0B',
        'Crewing': '#7C3AED',
        'Labor Rights': '#EC4899',
        'Cargo Liability': '#D97706',
        'Security': '#DC2626',
        'Safety Management': '#8B5CF6',
        'Management': '#8B5CF6',
        'Liability': '#B91C1C',
        'Legal': '#991B1B',
        'Commercial': '#059669',
        'Technical': '#4F46E5',
        'Administrative': '#6366F1'
    };
    
    data.forEach(reg => {
        const card = document.createElement('div');
        card.className = 'doc-card';
        card.style.cursor = 'pointer';
        
        const color = categoryColors[reg.category] || '#6B7280';
        
        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
                <i class="fa-solid fa-gavel doc-icon" style="color:${color};font-size:40px;"></i>
                <span style="background:${color}20;color:${color};padding:6px 12px;border-radius:20px;font-size:11px;font-weight:700;">
                    ${reg.category}
                </span>
            </div>
            <div style="font-size:15px;font-weight:700;color:${color};margin-bottom:6px;letter-spacing:0.5px;">
                ${reg.code}
            </div>
            <div class="doc-title" style="font-size:18px;margin-bottom:8px;color:#111827;">
                ${reg.title}
            </div>
            <div class="doc-desc" style="margin-bottom:12px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                ${reg.summary}
            </div>
            <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#6b7280;margin-bottom:16px;padding-top:12px;border-top:1px solid #e5e7eb;">
                <i class="fa-solid fa-calendar-check"></i>
                <span>${reg.updated}</span>
            </div>
            <button class="btn-download" style="width:100%;">
                <i class="fa-solid fa-book"></i> 
                ${t.btn_view || 'VIEW REGULATION'}
            </button>
        `;
        
        card.onclick = () => openContentModal(reg.code + ' - ' + reg.title, reg.content);
        rGrid.appendChild(card);
    });
}

function downloadFile(filename, content) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    a.download = filename + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ==========================================
// 10. AUTH & PROFILE
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('viya_token');
    const userStr = localStorage.getItem('viya_user');
    
    if (token && userStr) {
        currentUser = JSON.parse(userStr);
        const loginBtn = document.querySelector('.lp-btn-login');
        if (loginBtn) { loginBtn.innerText = "ENTER TERMINAL"; loginBtn.onclick = enterSystem; }
        const userArea = document.getElementById('userArea');
        if (userArea) { userArea.style.display = 'block'; document.getElementById('navUserName').innerText = currentUser.fullName.split(' ')[0].toUpperCase(); }
        const inboxArea = document.getElementById('inboxArea');
        if (inboxArea) inboxArea.style.display = 'block';
        if (socket && socket.connected) socket.emit('join_room', currentUser.id);
    }
});

function openAuthModal() {
    if (currentUser) { enterSystem(); return; }
    document.getElementById('authModal').style.display = 'block';
}

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

async function showKVKK() {
    try {
        const data = await (await fetch('/api/kvkk')).json();
        document.getElementById('kvkkTitle').innerText = data.title;
        document.getElementById('kvkkContent').innerText = data.content;
        document.getElementById('kvkkModal').style.display = 'block';
    } catch (e) { }
}

async function doLogin() {
    const email = document.getElementById('lEmail').value;
    const pass = document.getElementById('lPass').value;
    const msg = document.getElementById('authMsg');
    
    msg.innerText = "Connecting..."; msg.style.color = "yellow";
    
    try {
        const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) });
        const data = await res.json();
        
        if (data.success) {
            localStorage.setItem('viya_token', data.token);
            localStorage.setItem('viya_user', JSON.stringify(data.user));
            currentUser = data.user;
            msg.innerText = "Access Granted."; msg.style.color = "#4ade80";
            if (socket && socket.connected) socket.emit('join_room', currentUser.id);
            setTimeout(() => { closeModal('authModal'); enterSystem(); window.location.reload(); }, 1000);
        } else {
            msg.innerText = data.error || "Login Failed"; msg.style.color = "#ef4444";
        }
    } catch (e) { msg.innerText = "Connection Error"; msg.style.color = "#ef4444"; }
}

async function doRegister() {
    const name = document.getElementById('rName').value.trim();
    const email = document.getElementById('rEmail').value.trim();
    const pass = document.getElementById('rPass').value;
    const kvkk = document.getElementById('kvkkCheck').checked;
    const msg = document.getElementById('authMsg');
    
    // Validations
    if (!name) { msg.innerText = "Lütfen adınızı giriniz."; msg.style.color = "#ef4444"; return; }
    if (!email) { msg.innerText = "Lütfen e-posta adresinizi giriniz."; msg.style.color = "#ef4444"; return; }
    if (!pass) { msg.innerText = "Lütfen şifrenizi giriniz."; msg.style.color = "#ef4444"; return; }
    if (pass.length < 6) { msg.innerText = "Şifre en az 6 karakter olmalı."; msg.style.color = "#ef4444"; return; }
    if (!kvkk) { msg.innerText = "KVKK onayı gerekli."; msg.style.color = "#ef4444"; return; }
    
    msg.innerText = "Kayıt yapılıyor..."; msg.style.color = "#f59e0b";
    
    try {
        const res = await fetch('/api/auth/register', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ fullName: name, email, password: pass, kvkkAccepted: kvkk }) 
        });
        const data = await res.json();
        
        if (data.success && data.requiresOTP) {
            // OTP gerekli
            msg.innerText = data.message || "Doğrulama kodu gönderildi!"; 
            msg.style.color = "#4ade80";
            
            // Email'i sakla
            otpEmail = email;
            
            // Resend için geçici bilgileri sakla (sadece OTP süresi boyunca - 10 dakika)
            sessionStorage.setItem('temp_fullName', name);
            sessionStorage.setItem('temp_password', pass);
            
            // Auth modal'ı kapat, OTP modal'ı aç
            setTimeout(() => {
                closeModal('authModal');
                openOTPModal(email);
            }, 1000);
            
        } else if (data.success) {
            // Direkt kayıt başarılı (eski akış)
            msg.innerText = "Hesap oluşturuldu!"; msg.style.color = "#4ade80";
            setTimeout(() => switchAuthTab('login'), 1500);
        } else {
            msg.innerText = data.error || "Kayıt başarısız."; msg.style.color = "#ef4444";
        }
    } catch (e) { 
        console.error('Register error:', e);
        msg.innerText = "Bağlantı hatası. Lütfen tekrar deneyin."; 
        msg.style.color = "#ef4444"; 
    }
}

function openProfileModal() {
    if (!currentUser) return;
    document.getElementById('pName').innerText = currentUser.fullName;
    document.getElementById('pEmail').innerText = currentUser.email;
    document.getElementById('pPlan').innerText = currentUser.role === 'admin' ? 'ADMIRAL' : 'FREE';
    document.getElementById('profileModal').style.display = 'block';
}

function logout() {
    if (confirm("Çıkış yapmak istediğinize emin misiniz?")) {
        localStorage.removeItem('viya_token');
        localStorage.removeItem('viya_user');
        currentUser = null;
        if (socket) socket.disconnect();
        window.location.reload();
    }
}

// ==========================================
// 11. AI CHATBOT
// ==========================================
function toggleChat() {
    const win = document.getElementById('chatWindow');
    win.style.display = win.style.display === 'flex' ? 'none' : 'flex';
}

function toggleExpand() {
    const chat = document.getElementById('chatWindow');
    if (chat.style.height === '80vh') { chat.style.height = '500px'; chat.style.width = '380px'; }
    else { chat.style.height = '80vh'; chat.style.width = '600px'; }
}

function handleEnter(e) { if (e.key === 'Enter') sendChat(); }

async function sendChat() {
    const inp = document.getElementById('chatInput');
    const msg = inp.value.trim();
    if (!msg) return;
    
    addChatMessage('user', msg);
    inp.value = '';
    const tempId = 'temp-' + Date.now();
    addChatMessage('ai', '<span class="typing-dot">...</span>', tempId);
    
    try {
        const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, language: LANG_NAMES[currentLang] || "English" }) });
        const d = await res.json();
        document.getElementById(tempId)?.remove();
        typeWriterEffect(d.reply);
    } catch (e) { document.getElementById(tempId).innerText = "Error: Connection lost."; }
}

function addChatMessage(role, html, id = null) {
    const body = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    if (id) div.id = id;
    div.innerHTML = html;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

function typeWriterEffect(text) {
    const body = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = 'msg ai';
    body.appendChild(div);
    
    let i = 0;
    function type() {
        if (i < text.length) {
            if (text.charAt(i) === '<') { const closeIdx = text.indexOf('>', i); div.innerHTML += text.substring(i, closeIdx + 1); i = closeIdx + 1; }
            else { div.innerHTML += text.charAt(i); i++; }
            body.scrollTop = body.scrollHeight;
            setTimeout(type, 15);
        }
    }
    type();
}

// ==========================================
// 12. OTP VERIFICATION FUNCTIONS
// ==========================================

function openOTPModal(email) {
    document.getElementById('otpEmailDisplay').innerText = email;
    document.getElementById('otpModal').style.display = 'block';
    
    // Tüm OTP inputlarını temizle
    for (let i = 1; i <= 6; i++) {
        document.getElementById(`otp${i}`).value = '';
    }
    
    // Hata mesajını gizle
    document.getElementById('otpErrorMsg').style.display = 'none';
    
    // İlk input'a focus
    setTimeout(() => document.getElementById('otp1').focus(), 300);
}

function moveToNext(current, nextFieldId) {
    if (current.value.length === 1) {
        // Sadece rakam girişine izin ver
        if (!/^\d$/.test(current.value)) {
            current.value = '';
            return;
        }
        
        current.classList.add('filled');
        
        const nextField = document.getElementById(nextFieldId);
        if (nextField) {
            nextField.focus();
        }
    }
}

function moveToPrev(event, prevFieldId) {
    if (event.key === 'Backspace' && event.target.value === '') {
        const prevField = document.getElementById(prevFieldId);
        if (prevField) {
            prevField.focus();
        }
    }
}

function handleOTPPaste(event) {
    event.preventDefault();
    const pastedData = event.clipboardData.getData('text').trim();
    
    // Sadece 6 haneli rakam kabul et
    if (/^\d{6}$/.test(pastedData)) {
        for (let i = 0; i < 6; i++) {
            document.getElementById(`otp${i + 1}`).value = pastedData[i];
        }
        document.getElementById('otp6').focus();
        // Otomatik submit
        setTimeout(() => verifyOTP(), 300);
    }
}

function submitOTPIfComplete() {
    let otp = '';
    for (let i = 1; i <= 6; i++) {
        otp += document.getElementById(`otp${i}`).value;
    }
    
    if (otp.length === 6) {
        // Son kutucuk dolduysa 500ms sonra otomatik gönder
        setTimeout(() => verifyOTP(), 500);
    }
}

async function verifyOTP() {
    // OTP'yi topla
    let otp = '';
    for (let i = 1; i <= 6; i++) {
        otp += document.getElementById(`otp${i}`).value;
    }
    
    // Validation
    if (otp.length !== 6) {
        showOTPError('Lütfen 6 haneli kodu giriniz.');
        return;
    }
    
    if (!otpEmail) {
        showOTPError('Email adresi bulunamadı. Lütfen tekrar kayıt olun.');
        return;
    }
    
    const errorDiv = document.getElementById('otpErrorMsg');
    errorDiv.style.display = 'none';
    
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'grid';
    
    try {
        const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: otpEmail, otp: otp })
        });
        
        const data = await res.json();
        
        if (data.success) {
            // Başarılı! Token ve user bilgisini kaydet
            localStorage.setItem('viya_token', data.token);
            localStorage.setItem('viya_user', JSON.stringify(data.user));
            currentUser = data.user;
            
            // Geçici bilgileri temizle
            sessionStorage.removeItem('temp_fullName');
            sessionStorage.removeItem('temp_password');
            
            // Socket'e bağlan
            if (socket && socket.connected) socket.emit('join_room', currentUser.id);
            
            // Başarı mesajı
            showOTPSuccess('Hesabınız başarıyla oluşturuldu! Yönlendiriliyorsunuz...');
            
            // 1.5 saniye sonra dashboard'a yönlendir
            setTimeout(() => {
                closeModal('otpModal');
                enterSystem();
                window.location.reload();
            }, 1500);
            
        } else {
            showOTPError(data.error || 'Doğrulama başarısız. Lütfen tekrar deneyin.');
        }
        
    } catch (e) {
        console.error('OTP Verify Error:', e);
        showOTPError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

async function resendOTP() {
    if (!otpEmail) {
        showOTPError('Email adresi bulunamadı.');
        return;
    }
    
    const btn = event.target.closest('.btn-resend-otp');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gönderiliyor...';
    
    try {
        // Register endpoint'ini tekrar çağır (aynı email)
        const rName = sessionStorage.getItem('temp_fullName') || 'Captain';
        const rPass = sessionStorage.getItem('temp_password') || '';
        
        if (!rPass) {
            showOTPError('Kayıt bilgileri bulunamadı. Lütfen tekrar kayıt olun.');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Tekrar Gönder';
            return;
        }
        
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                fullName: rName, 
                email: otpEmail, 
                password: rPass, 
                kvkkAccepted: true 
            })
        });
        
        const data = await res.json();
        
        if (data.success && data.requiresOTP) {
            showOTPSuccess('✅ Yeni doğrulama kodu gönderildi!');
            
            // Inputları temizle
            for (let i = 1; i <= 6; i++) {
                document.getElementById(`otp${i}`).value = '';
            }
            document.getElementById('otp1').focus();
            
        } else {
            showOTPError(data.error || 'Kod gönderilemedi.');
        }
        
    } catch (e) {
        console.error('Resend OTP Error:', e);
        showOTPError('Bağlantı hatası.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Tekrar Gönder';
    }
}

function showOTPError(message) {
    const errorDiv = document.getElementById('otpErrorMsg');
    errorDiv.innerText = message;
    errorDiv.style.display = 'block';
    errorDiv.style.background = '#FEE2E2';
    errorDiv.style.color = '#EF4444';
}

function showOTPSuccess(message) {
    const errorDiv = document.getElementById('otpErrorMsg');
    errorDiv.innerText = message;
    errorDiv.style.display = 'block';
    errorDiv.style.background = '#D1FAE5';
    errorDiv.style.color = '#10B981';
}

// ==========================================
// 13. UTILITIES
// ==========================================
function closeModal(id) { 
    document.getElementById(id).style.display = 'none'; 
    
    // OTP modal kapanırken email'i temizle
    if (id === 'otpModal') {
        otpEmail = null;
    }
}

window.onclick = function (event) { if (event.target.classList.contains('modal')) event.target.style.display = 'none'; }

console.log("⚓ VIYA BROKER V18.1 - ALL SYSTEMS OPERATIONAL");

function showPassword(inputId) {
    document.getElementById(inputId).type = 'text';
}

function hidePassword(inputId) {
    document.getElementById(inputId).type = 'password';
}

function openForgotPasswordModal() {
    closeModal('authModal');
    document.getElementById('forgotStep1').style.display = 'block';
    document.getElementById('forgotStep2').style.display = 'none';
    document.getElementById('forgotEmail').value = '';
    document.getElementById('forgotMsg').innerText = '';
    document.getElementById('forgotPasswordModal').style.display = 'block';
}

async function sendResetLink() {
    const email = document.getElementById('forgotEmail').value.trim();
    const msg = document.getElementById('forgotMsg');
    
    if (!email) {
        msg.innerText = 'Lütfen mail adresinizi girin';
        msg.style.color = '#EF4444';
        return;
    }
    
    msg.innerText = 'Gönderiliyor...';
    msg.style.color = '#F59E0B';
    
    try {
        const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('forgotStep1').style.display = 'none';
            document.getElementById('forgotStep2').style.display = 'block';
            msg.innerText = '';
        } else {
            msg.innerText = data.error || 'Bir hata oluştu';
            msg.style.color = '#EF4444';
        }
    } catch (e) {
        msg.innerText = 'Bağlantı hatası';
        msg.style.color = '#EF4444';
    }
}

async function resetPassword() {
    const password = document.getElementById('newPassword').value;
    const confirm = document.getElementById('newPasswordConfirm').value;
    const msg = document.getElementById('resetMsg');
    
    if (password.length < 6) {
        msg.innerText = 'Şifre en az 6 karakter olmalı';
        msg.style.color = '#EF4444';
        return;
    }
    
    if (password !== confirm) {
        msg.innerText = 'Şifreler eşleşmiyor';
        msg.style.color = '#EF4444';
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('reset');
    
    if (!token) {
        msg.innerText = 'Geçersiz sıfırlama linki';
        msg.style.color = '#EF4444';
        return;
    }
    
    msg.innerText = 'Kaydediliyor...';
    msg.style.color = '#F59E0B';
    
    try {
        const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password })
        });
        const data = await res.json();
        
        if (data.success) {
            msg.innerText = 'Şifreniz güncellendi! Giriş yapabilirsiniz.';
            msg.style.color = '#10B981';
            setTimeout(() => {
                closeModal('resetPasswordModal');
                window.history.replaceState({}, document.title, window.location.pathname);
                openAuthModal('login');
            }, 2000);
        } else {
            msg.innerText = data.error || 'Bir hata oluştu';
            msg.style.color = '#EF4444';
        }
    } catch (e) {
        msg.innerText = 'Bağlantı hatası';
        msg.style.color = '#EF4444';
    }
}

// Sayfa yüklendiğinde reset token kontrolü
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('reset');
    if (resetToken) {
        document.getElementById('resetPasswordModal').style.display = 'block';
    }
});

async function submitContactForm(event) {
    event.preventDefault();
    
    const form = document.getElementById('contactForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Form verilerini al
    const formData = new FormData(form);
    const name = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const subject = form.querySelector('select').value;
    const message = form.querySelector('textarea').value;
    
    if (!name || !email || !message) {
        alert('Lütfen tüm alanları doldurun');
        return;
    }
    
    // Buton durumunu değiştir
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gönderiliyor...';
    submitBtn.disabled = true;
    
    try {
        const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, subject, message })
        });
        
        const data = await res.json();
        
        if (data.success) {
            alert('Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.');
            form.reset();
        } else {
            alert('Bir hata oluştu: ' + (data.error || 'Bilinmeyen hata'));
        }
    } catch (error) {
        alert('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Sidebar Toggle Function
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

// Theme Toggle Function
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('themeIcon');
    
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('viya_theme', 'dark');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('viya_theme', 'light');
    }
}

// Sayfa yüklendiğinde tema tercihini kontrol et
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('viya_theme');
    const icon = document.getElementById('themeIcon');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
});

// Maritime News Loader
async function loadNews() {
    const newsGrid = document.getElementById('newsGrid');
    console.log('newsGrid element:', newsGrid);
    
    if (!newsGrid) {
        console.error('newsGrid bulunamadı!');
        return;
    }
    
    console.log('✅ newsGrid bulundu, haberler yükleniyor...');
    newsGrid.innerHTML = '<div style="text-align:center; padding:50px; color:#64748b;"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;"></i><p style="margin-top:10px;">Haberler yükleniyor...</p></div>';
    
    try {
        const res = await fetch('/api/maritime-news');
        const data = await res.json();
        
        console.log('Frontend Gelen Veri:', data);
        console.log('data.news uzunluğu:', data.news ? data.news.length : 0);
        
        if (!data.news || !Array.isArray(data.news) || data.news.length === 0) {
            console.log('⚠️ Haber bulunamadı');
            newsGrid.innerHTML = '<div style="text-align:center; padding:50px; color:#64748b;">Haber bulunamadı.</div>';
            return;
        }
        
        console.log(`✅ ${data.news.length} haber işlenecek...`);
        newsGrid.innerHTML = '';
        
        data.news.forEach((item, index) => {
            console.log(`Haber ${index + 1}:`, item.title);
            
            const date = new Date(item.date).toLocaleDateString('tr-TR', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
            });
            
            const card = document.createElement('div');
            card.className = 'news-card-item';
            card.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px;';
            
            let imageHTML = '';
            if (item.image) {
                imageHTML = `<img src="${item.image}" alt="${item.title}" style="width:100%; height:200px; object-fit:cover; border-radius:8px; margin-bottom:16px;">`;
            } else {
                imageHTML = `
                    <div style="width:100%; height:200px; background:#f1f5f9; border-radius:8px; margin-bottom:16px; display:flex; align-items:center; justify-content:center;">
                        <i class="fa-solid fa-ship" style="font-size:48px; color:#94a3b8;"></i>
                    </div>
                `;
            }
            
            card.innerHTML = `
                ${imageHTML}
                <div class="news-card-header">
                    <span class="news-source">${item.source || 'Google News'}</span>
                    <span class="news-date">${date}</span>
                </div>
                <h3 class="news-title">${item.title}</h3>
                <p class="news-snippet">${item.snippet || ''}</p>
                <a href="${item.link}" target="_blank" class="news-read-more">
                    Devamını Oku <i class="fa-solid fa-arrow-right"></i>
                </a>
            `;
            newsGrid.appendChild(card);
        });
        
        console.log(`✅ ${data.news.length} haber DOM'a eklendi!`);
        
    } catch (error) {
        console.error('❌ News error:', error);
        newsGrid.innerHTML = '<div style="text-align:center; padding:50px; color:#ef4444;">Haberler yüklenirken hata oluştu.</div>';
    }
}
