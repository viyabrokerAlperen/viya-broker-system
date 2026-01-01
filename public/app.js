// =================================================================
// 1. GLOBAL CONFIG
// =================================================================
let currentVoyageData = null; 
let REGS_DB = [], DOCS_DB = [];
let currentLang = 'en';

const CLIENT_VESSEL_SPECS = {
    "HANDYSIZE": { default_speed: 13.0 }, "HANDYMAX": { default_speed: 13.0 }, "SUPRAMAX": { default_speed: 13.5 },
    "ULTRAMAX": { default_speed: 13.5 }, "PANAMAX": { default_speed: 13.0 }, "KAMSARMAX": { default_speed: 13.0 },
    "CAPESIZE": { default_speed: 12.5 }, "NEWCASTLEMAX": { default_speed: 12.5 }, "SMALL_CHEM": { default_speed: 13.0 },
    "MR_TANKER": { default_speed: 13.0 }, "LR1": { default_speed: 13.0 }, "AFRAMAX": { default_speed: 12.5 },
    "SUEZMAX": { default_speed: 12.5 }, "VLCC": { default_speed: 12.0 }, "LPG_MGC": { default_speed: 16.0 },
    "LPG_VLGC": { default_speed: 16.5 }, "LNG_CONV": { default_speed: 19.0 }, "LNG_Q_FLEX": { default_speed: 19.5 }
};

// [MASTER TRANSLATION OBJECT]
const TRANSLATIONS = {
    en: {
        // Landing & Nav
        landing_title: "NEXT GEN MARITIME INTELLIGENCE", landing_sub: "Advanced Voyage Estimation & Legal AI.",
        btn_login: "LOG IN", btn_enter_term: "ENTER TERMINAL", btn_learn_more: "LEARN MORE",
        nav_term: "Terminal", nav_kb: "Academy", nav_reg: "Regulations", nav_docs: "Docs", nav_mem: "Membership",
        menu_home: "Home", menu_about: "About Us", menu_mission: "Mission", menu_contact: "Contact",
        
        // Terminal Inputs
        lbl_vessel: "VESSEL CLASS", lbl_port: "POSITION", lbl_speed: "SPEED", lbl_qty: "CARGO", lbl_lrate: "LOAD RATE", lbl_drate: "DISCH RATE",
        btn_scan: "CALCULATE VOYAGE", panel_params: "PARAMETERS", panel_estim: "ESTIMATION",
        
        // Results & Financials
        stat_profit: "Net Profit", btn_breakdown: "VIEW FULL BREAKDOWN", empty_state: "Awaiting Inputs...",
        modal_fin_title: "FINANCIAL BREAKDOWN",
        fin_rev: "REVENUE", fin_voy: "VOYAGE COSTS", fin_opex: "OPEX", fin_profit: "NET PROFIT",
        
        // Sections Headers
        sec_kb: "KNOWLEDGE BASE", sec_reg: "REGULATIONS", sec_doc: "DOCUMENT CENTER",
        
        // Dynamic Content (Docs/Chat/Pricing)
        ai_welcome: "Hello Captain! I am VIYA AI. Ask me about Charter Parties, Clauses, or Port Regulations.",
        btn_read: "READ MODULE", btn_download: "DOWNLOAD", btn_view: "VIEW DETAILS",
        plan_basic_btn: "CURRENT PLAN", plan_pro_btn: "UPGRADE NOW", plan_prem_btn: "CONTACT SALES",
        feat_unl: "Unlimited Scans", feat_live: "Live Market Data", feat_api: "API Access",
        chat_placeholder: "Type your maritime question...",
        footer_rights: "© 2026 VIYA BROKER. All Rights Reserved."
    },
    tr: {
        landing_title: "YENİ NESİL DENİZCİLİK ZEKASI", landing_sub: "İleri Sefer Tahmini & Hukuki AI.",
        btn_login: "GİRİŞ YAP", btn_enter_term: "TERMİNALE GİR", btn_learn_more: "DAHA FAZLA",
        nav_term: "Terminal", nav_kb: "Akademi", nav_reg: "Mevzuat", nav_docs: "Evraklar", nav_mem: "Üyelik",
        menu_home: "Anasayfa", menu_about: "Hakkımızda", menu_mission: "Misyon", menu_contact: "İletişim",
        
        lbl_vessel: "GEMİ TİPİ", lbl_port: "KONUM", lbl_speed: "HIZ", lbl_qty: "YÜK", lbl_lrate: "YÜKLEME HIZI", lbl_drate: "TAHLİYE HIZI",
        btn_scan: "SEFER HESAPLA", panel_params: "PARAMETRELER", panel_estim: "TAHMİN",
        
        stat_profit: "Net Kâr", btn_breakdown: "DETAYLI DÖKÜM", empty_state: "Veri Bekleniyor...",
        modal_fin_title: "FİNANSAL DÖKÜM",
        fin_rev: "GELİRLER", fin_voy: "SEFER GİDERLERİ", fin_opex: "İŞLETME GİDERLERİ", fin_profit: "NET KÂR",
        
        sec_kb: "BİLGİ BANKASI", sec_reg: "YÖNETMELİKLER", sec_doc: "DOKÜMAN MERKEZİ",
        
        ai_welcome: "Merhaba Kaptan! Ben VIYA AI. Navlun sözleşmeleri veya liman kuralları hakkında soru sorabilirsiniz.",
        btn_read: "İNCELE", btn_download: "İNDİR", btn_view: "DETAYLAR",
        plan_basic_btn: "MEVCUT PLAN", plan_pro_btn: "YÜKSELT", plan_prem_btn: "SATIŞLA GÖRÜŞ",
        feat_unl: "Sınırsız Tarama", feat_live: "Canlı Piyasa", feat_api: "API Erişimi",
        chat_placeholder: "Denizcilik sorunuzu yazın...",
        footer_rights: "© 2026 VIYA BROKER. Tüm Hakları Saklıdır."
    },
    // Diğer diller için kısa özet (Yer tutucu)
    de: { landing_title: "MARITIME INTELLIGENZ", btn_enter_term: "TERMINAL BETRETEN", nav_term: "Terminal", ai_welcome: "Hallo Kapitän! Ich bin VIYA AI.", btn_scan: "BERECHNEN" },
    fr: { landing_title: "INTELLIGENCE MARITIME", btn_enter_term: "ENTRER AU TERMINAL", nav_term: "Terminal", ai_welcome: "Bonjour Capitaine! Je suis VIYA AI.", btn_scan: "CALCULER" },
    es: { landing_title: "INTELIGENCIA MARÍTIMA", btn_enter_term: "ENTRAR AL TERMINAL", nav_term: "Terminal", ai_welcome: "¡Hola Capitán! Soy VIYA AI.", btn_scan: "CALCULAR" },
    it: { landing_title: "INTELLIGENZA MARITTIMA", btn_enter_term: "ENTRA NEL TERMINAL", nav_term: "Terminale", ai_welcome: "Ciao Capitano! Sono VIYA AI.", btn_scan: "CALCOLARE" },
    gr: { landing_title: "ΝΑΥΤΙΛΙΑΚΗ ΝΟΗΜΟΣΥΝΗ", btn_enter_term: "ΕΙΣΟΔΟΣ", nav_term: "Τερματικό", ai_welcome: "Γεια σου Καπετάνιε!", btn_scan: "ΥΠΟΛΟΓΙΣΜΟΣ" }
};

// =================================================================
// 2. INITIALIZATION
// =================================================================

function enterSystem() { 
    const landing = document.getElementById('landing-page');
    const app = document.getElementById('app-container');
    if(landing && app) {
        landing.style.opacity = '0';
        landing.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            landing.style.display = 'none'; app.style.display = 'block';
            if(map) map.invalidateSize(); 
        }, 500);
    }
}

function switchView(id) { 
    document.querySelectorAll('.view-section').forEach(e => e.classList.remove('active')); 
    document.getElementById(id).classList.add('active'); 
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // Highlight Nav Item
    const navIndex = ['dashboard', 'academy', 'regulations', 'docs', 'pricing'].indexOf(id);
    if(navIndex >= 0) document.querySelectorAll('.nav-item')[navIndex].classList.add('active');

    if(id === 'dashboard') setTimeout(() => map.invalidateSize(), 100); 
}

function changeLanguage(lang) {
    currentLang = lang;
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    
    // 1. Text Content Updates
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        if(t[k]) el.innerText = t[k];
    });

    // 2. Dynamic Component Updates
    document.getElementById('chatInput').placeholder = t.chat_placeholder || "...";
    
    // Update contents by reloading them with new lang
    loadAcademy(); 
    loadDocs();
    loadRegulations();
    
    // Update Chat Welcome if empty
    const chatBody = document.getElementById('chatBody');
    if(chatBody.children.length === 1) { // Only if standard welcome exists
        chatBody.innerHTML = `<div class="msg ai">${t.ai_welcome}</div>`;
    }
}

async function init() {
    try {
        const pRes = await fetch('/api/ports'); const ports = await pRes.json();
        const dl = document.getElementById('portList');
        if(dl) { dl.innerHTML = ""; ports.forEach(p => { const o = document.createElement('option'); o.value = p; dl.appendChild(o); }); }
        
        const mRes = await fetch('/api/market'); const m = await mRes.json();
        if(m.brent) { 
            document.getElementById('oilPrice').innerText = "$" + m.brent.toFixed(2); 
            document.getElementById('vlsfoPrice').innerText = "$" + m.vlsfo; 
        }
        loadAcademy(); loadDocs(); loadRegulations();
    } catch(e) {}
}
window.onload = init;

// =================================================================
// 3. CONTENT LOADERS (TRANSLATION ENABLED)
// =================================================================

function loadAcademy() {
    const aGrid = document.getElementById('academyGrid');
    if(!aGrid) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    
    aGrid.innerHTML = "";
    const ACADEMY_DATA = [
        {icon: "fa-scale-balanced", title: "Laytime & Demurrage", desc: "Calculating time saved/lost."},
        {icon: "fa-globe", title: "INCOTERMS 2020", desc: "FOB, CIF, CFR, FAS principles."},
        {icon: "fa-file-signature", title: "Bill of Lading", desc: "Receipt, Title, Contract."},
        {icon: "fa-anchor", title: "General Average", desc: "York-Antwerp Rules."},
        {icon: "fa-smog", title: "ECA Regulations", desc: "Sulphur caps (0.50%)."}
    ];
    ACADEMY_DATA.forEach(item => {
        aGrid.innerHTML += `<div class="doc-card">
            <i class="fa-solid ${item.icon} doc-icon" style="color:var(--neon-purple)"></i>
            <div class="doc-title">${item.title}</div>
            <div class="doc-desc">${item.desc}</div>
            <button class="btn-download" onclick="downloadFile('${item.title}', 'Sample content')">
                <i class="fa-solid fa-book-open"></i> ${t.btn_read || "READ"}
            </button>
        </div>`;
    });
}

async function loadDocs() {
    const dContainer = document.getElementById('docsContainer');
    if(!dContainer) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    
    try {
        if(DOCS_DB.length === 0) { const res = await fetch('/api/documents'); DOCS_DB = await res.json(); }
        dContainer.innerHTML = "";
        DOCS_DB.forEach(cat => {
            let html = `<div class="category-header">${cat.category}</div><div class="docs-grid">`;
            cat.items.forEach(item => {
                let icon = item.type === 'pdf' ? 'fa-file-pdf' : 'fa-file-lines';
                html += `<div class="doc-card">
                        <i class="fa-solid ${icon} doc-icon" style="color:var(--neon-cyan)"></i>
                        <div class="doc-title">${item.title}</div>
                        <div class="doc-desc">${item.desc}</div>
                        <button class="btn-download" onclick="downloadFile('${item.title}', 'Content...')">
                            <i class="fa-solid fa-download"></i> ${t.btn_download || "DOWNLOAD"}
                        </button>
                        </div>`;
            });
            html += '</div>';
            dContainer.innerHTML += html;
        });
    } catch(e) {}
}

async function loadRegulations() {
    const rGrid = document.getElementById('regsGrid');
    if(!rGrid) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    
    try {
        if(REGS_DB.length === 0) { const res = await fetch('/api/regulations'); REGS_DB = await res.json(); }
        rGrid.innerHTML = "";
        REGS_DB.forEach(reg => {
            rGrid.innerHTML += `<div class="doc-card">
                <i class="fa-solid fa-gavel doc-icon" style="color:var(--neon-gold)"></i>
                <div class="doc-title">${reg.code}</div>
                <div class="doc-desc" style="font-weight:bold; color:#fff;">${reg.title}</div>
                <div class="doc-desc">${reg.summary}</div>
                <button class="btn-download" onclick="openRegModal('${reg.id}')">${t.btn_view || "DETAILS"}</button>
                </div>`;
        });
    } catch(e) {}
}

// =================================================================
// 4. CALCULATIONS & MAP
// =================================================================

const map = L.map('map', {zoomControl: false}).setView([30, 0], 2);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { 
    maxZoom: 10, attribution: '&copy; CartoDB'
}).addTo(map);
let shipLayer = L.layerGroup().addTo(map);

async function fillCoords() {
    const p = document.getElementById('refPort').value.toUpperCase();
    if(!p) return;
    try {
        const res = await fetch('/api/port-coords?port='+p);
        const d = await res.json();
        if(d.lat) {
            document.getElementById('vLat').value = d.lat;
            document.getElementById('vLng').value = d.lng;
            updateShipMarker(d.lat, d.lng);
        }
    } catch(e){}
}

function updateShipMarker(lat, lng) { 
    if(shipLayer) shipLayer.clearLayers(); 
    L.circleMarker([lat, lng], {radius:8, color:'#fbbf24', fillOpacity: 1, weight:2}).addTo(shipLayer).bindPopup("VESSEL"); 
    map.setView([lat, lng], 4); 
}

function updateSpeed() { /* ... */ }

async function scanMarket() {
    const lat = parseFloat(document.getElementById('vLat').value);
    const lng = parseFloat(document.getElementById('vLng').value);
    if(isNaN(lat) || isNaN(lng)) { alert("Please select a port first."); return; }
    
    updateShipMarker(lat, lng);
    document.getElementById('loader').style.display = 'grid';
    
    try {
        const res = await fetch('/api/analyze', { 
            method: 'POST', headers: {'Content-Type': 'application/json'}, 
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
        if(data.success && data.voyages.length > 0) renderList(data.voyages);
        else alert("No profitable voyages found nearby. Try another region.");
    } catch(e) { alert("Calculation failed."); }
    finally { document.getElementById('loader').style.display = 'none'; }
}

function renderList(voyages) {
    const list = document.getElementById('cargoResultList'); 
    list.innerHTML = '';
    voyages.forEach(v => {
        const el = document.createElement('div'); el.className = 'cargo-item';
        el.innerHTML = `<div class="ci-top"><span>${v.loadPort} -> ${v.dischPort}</span><span class="tce-badge">$${Math.floor(v.financials.tce).toLocaleString()}</span></div><div class="ci-bot"><span>${v.commodity}</span><span>${v.ballastDist} NM</span></div>`;
        el.onclick = () => showDetails(v, el); list.appendChild(el);
    });
    showDetails(voyages[0], list.children[0]);
}

function showDetails(v, el) {
    currentVoyageData = v; 
    document.querySelectorAll('.cargo-item').forEach(x => x.classList.remove('active')); if(el) el.classList.add('active');
    document.getElementById('emptyState').style.display = 'none'; document.getElementById('analysisPanel').style.display = 'block';
    
    document.getElementById('dispTCE').innerText = "$" + Math.floor(v.financials.tce).toLocaleString();
    document.getElementById('dispProfit').innerText = "$" + Math.floor(v.financials.profit).toLocaleString();
    document.getElementById('aiOutput').innerHTML = v.aiAnalysis;
    
    // Map Update
    shipLayer.clearLayers();
    L.circleMarker([document.getElementById('vLat').value, document.getElementById('vLng').value], {radius:8, color:'#fbbf24'}).addTo(shipLayer);
    L.polyline([[v.loadGeo.lat, v.loadGeo.lng], [v.dischGeo.lat, v.dischGeo.lng]], {color: '#00f2ff', weight: 2, dashArray: '5, 10'}).addTo(shipLayer);
    L.circleMarker([v.loadGeo.lat, v.loadGeo.lng], {radius:6, color:'#10b981'}).addTo(shipLayer).bindPopup("LOAD: "+v.loadPort);
    L.circleMarker([v.dischGeo.lat, v.dischGeo.lng], {radius:6, color:'#ef4444'}).addTo(shipLayer).bindPopup("DISCH: "+v.dischPort);
    
    map.fitBounds([[v.loadGeo.lat, v.loadGeo.lng], [v.dischGeo.lat, v.dischGeo.lng]], {padding:[50,50]});
}

function showFinancials() {
    if(!currentVoyageData) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    const b = currentVoyageData.breakdown;
    const vc = b.voyage_costs;
    const ox = b.opex;
    
    const html = `
        <table class="fin-table">
            <tr><th colspan="2" style="border-bottom:2px solid var(--neon-cyan)">${t.fin_rev}</th></tr>
            <tr><td>Gross Freight (${currentVoyageData.qty}mt)</td><td>$${Math.floor(b.revenue).toLocaleString()}</td></tr>
            <tr class="fin-section-total"><td>NET REVENUE</td><td>$${Math.floor(b.revenue - vc.comm).toLocaleString()}</td></tr>
            
            <tr><th colspan="2" style="padding-top:20px; border-bottom:2px solid var(--neon-cyan)">${t.fin_voy}</th></tr>
            <tr><td>Bunkers</td><td>$${Math.floor(vc.fuel.total).toLocaleString()}</td></tr>
            <tr><td>Port Charges</td><td>$${Math.floor(vc.port.total).toLocaleString()}</td></tr>
            <tr><td>Cargo/Canal</td><td>$${Math.floor(vc.cargo.total + vc.canal).toLocaleString()}</td></tr>
            
            <tr><th colspan="2" style="padding-top:20px; border-bottom:2px solid var(--neon-cyan)">${t.fin_opex}</th></tr>
            <tr><td>Crew & Maint</td><td>$${Math.floor(ox.crew + ox.maintenance).toLocaleString()}</td></tr>
            <tr class="fin-section-total"><td>TOTAL OPEX</td><td>$${Math.floor(ox.total).toLocaleString()}</td></tr>

            <tr><th colspan="2" style="padding-top:30px;"></th></tr>
            <tr class="fin-grand-total"><td>${t.fin_profit}</td><td>$${Math.floor(currentVoyageData.financials.profit).toLocaleString()}</td></tr>
        </table>`;
    document.getElementById('finBody').innerHTML = html;
    document.getElementById('finModal').style.display = 'block';
}

// =================================================================
// 5. UTILITIES
// =================================================================
function downloadFile(filename, content) { alert("Downloading: " + filename + "..."); }
function openRegModal(id) { 
    const reg = REGS_DB.find(r => r.id === id); 
    if(reg) { 
        document.getElementById('modalTitle').innerText = reg.title; 
        document.getElementById('modalBody').innerText = reg.content; 
        document.getElementById('docModal').style.display = 'block'; 
    }
}
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
window.onclick = function(event) { if (event.target.classList.contains('modal')) event.target.style.display = 'none'; }
function toggleChat() { document.getElementById('chatWindow').style.display = document.getElementById('chatWindow').style.display==='flex'?'none':'flex'; }
function toggleExpand() { document.getElementById('chatWindow').classList.toggle('expanded'); }
function handleEnter(e) { if(e.key === 'Enter') sendChat(); }
async function sendChat() { 
    const inp = document.getElementById('chatInput');
    if(!inp.value.trim()) return;
    const body = document.getElementById('chatBody');
    body.innerHTML += `<div class="msg user">${inp.value}</div>`;
    
    // Simulate AI for visual feedback immediately
    const lid = Date.now();
    body.innerHTML += `<div class="msg ai" id="${lid}">...</div>`;
    
    try {
        const res = await fetch('/api/chat', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({message: inp.value})
        });
        const d = await res.json();
        document.getElementById(lid).innerText = d.reply;
    } catch(e) { document.getElementById(lid).innerText = "Error."; }
    inp.value = ''; body.scrollTop = body.scrollHeight;
}
