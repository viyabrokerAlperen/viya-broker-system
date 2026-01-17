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
    
    currentChatUserId = userId;
    currentChatUserName = userName;
    currentChatVesselId = vesselId;
    
    document.getElementById('chatWithName').innerText = `Chat: ${userName}`;
    document.getElementById('messageHistory').innerHTML = '<div style="text-align:center;color:#64748b;">Loading...</div>';
    document.getElementById('messagingModal').style.display = 'block';
    
    try {
        const token = localStorage.getItem('viya_token');
        const res = await fetch(`/api/messages/conversation/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const history = document.getElementById('messageHistory');
        history.innerHTML = '';
        
        if (data.success && data.messages.length > 0) {
            data.messages.forEach(msg => displayMessage(msg));
        } else {
            history.innerHTML = '<div style="text-align:center;color:#64748b;padding:20px;">Henüz mesaj yok.</div>';
        }
        history.scrollTop = history.scrollHeight;
    } catch (e) { console.error(e); }
}

function displayMessage(msg) {
    const history = document.getElementById('messageHistory');
    if (!history) return;
    
    if (history.querySelector('div[style*="text-align:center"]')) history.innerHTML = '';
    
    const isOwn = currentUser && (msg.from === currentUser.id || msg.from?._id === currentUser.id);
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `margin-bottom:10px;text-align:${isOwn ? 'right' : 'left'};`;
    
    msgDiv.innerHTML = `
        <div style="display:inline-block;max-width:70%;background:${isOwn ? '#1e3a8a' : '#1a1a1a'};padding:10px 15px;border-radius:12px;">
            <div style="font-size:0.75rem;color:#94a3b8;margin-bottom:5px;">${isOwn ? 'You' : (msg.fromName || 'User')}</div>
            <div style="color:#fff;">${msg.message}</div>
            <div style="font-size:0.7rem;color:#64748b;margin-top:5px;">${new Date(msg.timestamp).toLocaleTimeString()}</div>
        </div>
    `;
    
    history.appendChild(msgDiv);
    history.scrollTop = history.scrollHeight;
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
    document.getElementById('modalBody').innerText = content;
    document.getElementById('docModal').style.display = 'block';
}

function loadAcademy() {
    const aGrid = document.getElementById('academyGrid');
    if (!aGrid) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    aGrid.innerHTML = "";
    
    const data = [
        { icon: "fa-scale-balanced", title: "Laytime Basics", desc: "SHINC vs SHEX", content: "Laytime is the amount of time allowed..." },
        { icon: "fa-globe", title: "INCOTERMS 2020", desc: "FOB, CIF, CFR", content: "Incoterms define responsibilities..." },
        { icon: "fa-ship", title: "Charter Parties", desc: "Gencon vs NYPE", content: "A charter party is a maritime contract..." },
        { icon: "fa-anchor", title: "Demurrage", desc: "Time is money", content: "Demurrage is a charge payable..." },
        { icon: "fa-file-contract", title: "Bills of Lading", desc: "Document of title", content: "A Bill of Lading is a legal document..." }
    ];
    
    data.forEach(item => {
        aGrid.innerHTML += `<div class="doc-card">
            <i class="fa-solid ${item.icon} doc-icon" style="color:var(--neon-purple)"></i>
            <div class="doc-title">${item.title}</div>
            <div class="doc-desc">${item.desc}</div>
            <button class="btn-download" onclick="openContentModal('${item.title}', '${item.content.replace(/'/g, "\\'")}')"><i class="fa-solid fa-book-open"></i> ${t.btn_read || 'READ'}</button>
        </div>`;
    });
}

async function loadDocs() {
    const container = document.getElementById('docsContainer');
    if (!container) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    
    const data = [
        { category: "Standard Contracts", items: [{ title: "GENCON 94", desc: "Voyage Charter", content: "PART I..." }, { title: "NYPE 2015", desc: "Time Charter", content: "Time Charter..." }] },
        { category: "Bill of Ladings", items: [{ title: "Congenbill 2016", desc: "For Charter Parties", content: "Shipper..." }] }
    ];
    
    container.innerHTML = "";
    data.forEach(cat => {
        let html = `<div class="category-header">${cat.category}</div><div class="docs-grid">`;
        cat.items.forEach(item => {
            html += `<div class="doc-card">
                <i class="fa-solid fa-file-contract doc-icon" style="color:var(--neon-cyan)"></i>
                <div class="doc-title">${item.title}</div>
                <div class="doc-desc">${item.desc}</div>
                <button class="btn-download" onclick="openContentModal('${item.title}', '${item.content}')"><i class="fa-solid fa-eye"></i> ${t.btn_read || 'READ'}</button>
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
    
    const data = [
        { code: "SOLAS", title: "Safety of Life at Sea", summary: "Minimum safety standards", content: "Chapter I..." },
        { code: "MARPOL", title: "Marine Pollution", summary: "Prevention of pollution", content: "Annex I..." },
        { code: "ISM Code", title: "Safety Management", summary: "Safe ship operations", content: "Part A..." }
    ];
    
    rGrid.innerHTML = "";
    data.forEach(reg => {
        rGrid.innerHTML += `<div class="doc-card">
            <i class="fa-solid fa-gavel doc-icon" style="color:var(--neon-gold)"></i>
            <div class="doc-title">${reg.code}</div>
            <div class="doc-desc" style="color:#fff;">${reg.title}</div>
            <div class="doc-desc">${reg.summary}</div>
            <button class="btn-download" onclick="openContentModal('${reg.title}', '${reg.content}')"><i class="fa-solid fa-book"></i> ${t.btn_view || 'VIEW'}</button>
        </div>`;
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
