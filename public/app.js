// =================================================================
// 1. GLOBAL STATE & CONFIG
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

// --- A'DAN Z'YE TÜM DİL DESTEĞİ ---
const TRANSLATIONS = {
    en: {
        // UI
        landing_title: "NEXT GEN MARITIME INTELLIGENCE", landing_sub: "Advanced Voyage Estimation & Legal AI.",
        btn_login: "LOG IN", btn_enter_term: "ENTER TERMINAL", btn_learn_more: "LEARN MORE",
        nav_term: "Terminal", nav_kb: "Academy", nav_reg: "Regulations", nav_docs: "Docs", nav_mem: "Membership",
        lbl_vessel: "VESSEL CLASS", lbl_port: "POSITION", lbl_speed: "SPEED", lbl_qty: "CARGO", lbl_lrate: "LOAD RATE", lbl_drate: "DISCH RATE",
        btn_scan: "CALCULATE VOYAGE", panel_params: "PARAMETERS", panel_estim: "ESTIMATION",
        stat_profit: "Net Profit", btn_breakdown: "VIEW FULL BREAKDOWN", empty_state: "Awaiting Inputs...",
        sec_kb: "KNOWLEDGE BASE", sec_reg: "REGULATIONS", sec_doc: "DOCUMENT CENTER",
        ai_welcome: "Hello Captain! I am VIYA AI. Ready to assist.", computing: "SYSTEM PROCESSING...",
        menu_home: "Home", menu_about: "About Us", menu_mission: "Mission", menu_contact: "Contact",
        footer_rights: "© 2026 VIYA BROKER. All Rights Reserved.", modal_fin_title: "FINANCIAL BREAKDOWN",
        
        // FINANCIAL TABLE (DETAYLI)
        fin_rev: "REVENUE", fin_freight: "Gross Freight", fin_net: "NET REVENUE",
        fin_voy: "VOYAGE COSTS", fin_bunkers: "A. Bunkers", fin_main: "Main Engine (Sea)", fin_aux: "Aux Engine (Port)", fin_lubes: "Lubricants",
        fin_port: "B. Port Charges", fin_dues: "Port Dues", fin_pilot: "Pilotage", fin_tow: "Towage", fin_lines: "Line Handling", fin_berth: "Berth Hire", fin_agency: "Agency/Misc",
        fin_cargo: "C. Cargo/Canal", fin_dunnage: "Dunnage/Lashing", fin_clean: "Hold Cleaning", fin_canal: "Canal Transit", fin_comm: "Commission",
        fin_opex: "3. OPEX (Operating Expenses)", fin_crew: "Crewing Costs", fin_maint: "Maintenance & Repair", fin_ins: "Insurance (H&M/P&I)", fin_store: "Stores & Supplies", fin_admin: "Admin/Mgmt",
        fin_total_opex: "TOTAL OPEX", fin_daily_opex: "Daily Cost", fin_profit: "NET PROFIT"
    },
    tr: {
        // ARAYÜZ
        landing_title: "YENİ NESİL DENİZCİLİK ZEKASI", landing_sub: "İleri Sefer Tahmini & Hukuki AI.",
        btn_login: "GİRİŞ YAP", btn_enter_term: "TERMİNALE GİR", btn_learn_more: "DAHA FAZLA",
        nav_term: "Terminal", nav_kb: "Akademi", nav_reg: "Mevzuat", nav_docs: "Evraklar", nav_mem: "Üyelik",
        lbl_vessel: "GEMİ TİPİ", lbl_port: "KONUM", lbl_speed: "HIZ", lbl_qty: "YÜK", lbl_lrate: "YÜKLEME HIZI", lbl_drate: "TAHLİYE HIZI",
        btn_scan: "SEFER HESAPLA", panel_params: "PARAMETRELER", panel_estim: "TAHMİN",
        stat_profit: "Net Kâr", btn_breakdown: "DETAYLI DÖKÜM", empty_state: "Veri Bekleniyor...",
        sec_kb: "BİLGİ BANKASI", sec_reg: "YÖNETMELİKLER", sec_doc: "DOKÜMAN MERKEZİ",
        ai_welcome: "Merhaba Kaptan! Ben VIYA AI. Yardıma hazırım.", computing: "HESAPLANIYOR...",
        menu_home: "Anasayfa", menu_about: "Hakkımızda", menu_mission: "Misyon", menu_contact: "İletişim",
        footer_rights: "© 2026 VIYA BROKER. Tüm Hakları Saklıdır.", modal_fin_title: "FİNANSAL DÖKÜM",

        // FİNANSAL TABLO (DETAYLI - TÜRKÇE)
        fin_rev: "1. GELİRLER", fin_freight: "Brüt Navlun", fin_net: "NET GELİR",
        fin_voy: "2. SEFER MALİYETLERİ", fin_bunkers: "A. Yakıt Giderleri", fin_main: "Ana Makine (Seyir)", fin_aux: "Yardımcı Makine", fin_lubes: "Yağlar",
        fin_port: "B. Liman Giderleri", fin_dues: "Liman/Fener Rüsumu", fin_pilot: "Kılavuzluk", fin_tow: "Römorkör", fin_lines: "Palamar", fin_berth: "Rıhtım İşgaliye", fin_agency: "Acente/Atık",
        fin_cargo: "C. Yük & Kanal", fin_dunnage: "Dunnage/Lashing", fin_clean: "Ambar Temizliği", fin_canal: "Kanal Geçişi", fin_comm: "Komisyon",
        fin_opex: "3. İŞLETME MALİYETLERİ (OPEX)", fin_crew: "Personel Giderleri", fin_maint: "Bakım & Onarım", fin_ins: "Sigorta (H&M/P&I)", fin_store: "Malzeme & İkmal", fin_admin: "Yönetim",
        fin_total_opex: "TOPLAM OPEX", fin_daily_opex: "Günlük Maliyet", fin_profit: "NET KÂR"
    },
    // Diğer diller için de temel çeviriler (Özet geçiyorum, uzamaması için)
    de: { landing_title: "MARITIME INTELLIGENZ", btn_enter_term: "TERMINAL BETRETEN", nav_term: "Terminal", stat_profit: "Reingewinn", fin_rev: "EINNAHMEN", fin_voy: "REISEKOSTEN", fin_opex: "BETRIEBSKOSTEN", fin_profit: "NETTOGEWINN" },
    fr: { landing_title: "INTELLIGENCE MARITIME", btn_enter_term: "ENTRER AU TERMINAL", nav_term: "Terminal", stat_profit: "Bénéfice Net", fin_rev: "REVENUS", fin_voy: "FRAIS DE VOYAGE", fin_opex: "FRAIS D'EXPLOITATION", fin_profit: "BÉNÉFICE NET" },
    es: { landing_title: "INTELIGENCIA MARÍTIMA", btn_enter_term: "ENTRAR AL TERMINAL", nav_term: "Terminal", stat_profit: "Beneficio Neto", fin_rev: "INGRESOS", fin_voy: "GASTOS DE VIAJE", fin_opex: "GASTOS OPERATIVOS", fin_profit: "BENEFICIO NETO" },
    it: { landing_title: "INTELLIGENZA MARITTIMA", btn_enter_term: "ENTRA NEL TERMINAL", nav_term: "Terminale", stat_profit: "Utile Netto", fin_rev: "ENTRATE", fin_voy: "COSTI DI VIAGGIO", fin_opex: "COSTI OPERATIVI", fin_profit: "UTILE NETTO" },
    gr: { landing_title: "ΝΑΥΤΙΛΙΑΚΗ ΝΟΗΜΟΣΥΝΗ", btn_enter_term: "ΕΙΣΟΔΟΣ", nav_term: "Τερματικό", stat_profit: "Καθαρό Κέρδος", fin_rev: "ΕΣΟΔΑ", fin_voy: "ΕΞΟΔΑ ΤΑΞΙΔΙΟΥ", fin_opex: "ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ", fin_profit: "ΚΑΘΑΡΟ ΚΕΡΔΟΣ" }
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
    
    if(id==='dashboard') document.querySelectorAll('.nav-item')[0].classList.add('active');
    else if(id==='academy') document.querySelectorAll('.nav-item')[1].classList.add('active');
    else if(id==='regulations') document.querySelectorAll('.nav-item')[2].classList.add('active');
    else if(id==='docs') document.querySelectorAll('.nav-item')[3].classList.add('active');
    else if(id==='pricing') document.querySelectorAll('.nav-item')[4].classList.add('active');

    if(id === 'dashboard') setTimeout(() => map.invalidateSize(), 100); 
}

function changeLanguage(lang) {
    currentLang = lang;
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        if(t[k]) el.innerText = t[k];
    });
    // Finansal tablo açıksa onu da güncelle
    if(currentVoyageData && document.getElementById('finModal').style.display === 'block') {
        showFinancials();
    }
}

async function init() {
    try {
        const pRes = await fetch('/api/ports'); const ports = await pRes.json();
        const dl = document.getElementById('portList');
        if(dl) {
            dl.innerHTML = "";
            ports.forEach(p => { const o = document.createElement('option'); o.value = p; dl.appendChild(o); });
        }
        
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
// 3. CONTENT LOADERS
// =================================================================

function loadAcademy() {
    const aGrid = document.getElementById('academyGrid');
    if(!aGrid) return;
    aGrid.innerHTML = "";
    const ACADEMY_DATA = [
        {icon: "fa-scale-balanced", title: "Laytime & Demurrage", desc: "SHINC/SHEX, WWD, Despatch calculations."},
        {icon: "fa-globe", title: "INCOTERMS 2020", desc: "FOB, CIF, CFR, FAS principles."},
        {icon: "fa-file-signature", title: "Bill of Lading", desc: "Receipt, Title, Contract of Carriage."},
        {icon: "fa-anchor", title: "General Average", desc: "York-Antwerp Rules principles."},
        {icon: "fa-smog", title: "ECA Regulations", desc: "Sulphur caps (0.50%) and emissions."}
    ];
    ACADEMY_DATA.forEach(item => {
        aGrid.innerHTML += `<div class="doc-card">
            <i class="fa-solid ${item.icon} doc-icon" style="color:var(--neon-purple)"></i>
            <div class="doc-title">${item.title}</div>
            <div class="doc-desc">${item.desc}</div>
            <button class="btn-download" onclick="downloadFile('${item.title}', 'Sample content...')"><i class="fa-solid fa-book-open"></i> READ</button>
        </div>`;
    });
}

async function loadDocs() {
    const dContainer = document.getElementById('docsContainer');
    if(!dContainer) return;
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
                        <button class="btn-download" onclick="downloadFile('${item.title}', '${item.content ? item.content.replace(/'/g, "\\'").replace(/\n/g, "\\n") : ""}')"><i class="fa-solid fa-download"></i> GET</button>
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
    try {
        if(REGS_DB.length === 0) { const res = await fetch('/api/regulations'); REGS_DB = await res.json(); }
        rGrid.innerHTML = "";
        REGS_DB.forEach(reg => {
            rGrid.innerHTML += `<div class="doc-card">
                <i class="fa-solid fa-gavel doc-icon" style="color:var(--neon-gold)"></i>
                <div class="doc-title">${reg.code}</div>
                <div class="doc-desc" style="font-weight:bold; color:#fff;">${reg.title}</div>
                <div class="doc-desc">${reg.summary}</div>
                <button class="btn-download" onclick="openRegModal('${reg.id}')">DETAILS</button>
                </div>`;
        });
    } catch(e) {}
}

// =================================================================
// 4. MAP & CALCULATIONS
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
    L.circleMarker([lat, lng], {radius:7, color:'#f59e0b', fillOpacity: 0.8}).addTo(shipLayer).bindPopup("VESSEL"); 
    map.setView([lat, lng], 4); 
}

function updateSpeed() { 
    const type = document.getElementById('vType').value;
    if(type && CLIENT_VESSEL_SPECS[type]) document.getElementById('vSpeed').value = CLIENT_VESSEL_SPECS[type].default_speed;
}

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
    const list = document.getElementById('cargoResultList'); 
    list.innerHTML = '';
    
    if(voyages.length === 0) {
        list.innerHTML = '<div style="padding:10px; color:#aaa;">No profitable voyages found.</div>';
        return;
    }

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
    
    document.getElementById('financialDetails').innerHTML = 
        `<div class="detail-row"><span class="d-lbl">Ballast</span> <span class="d-val neg">${v.ballastDist} NM</span></div>
        <div class="detail-row"><span class="d-lbl">Laden</span> <span class="d-val">${v.ladenDist} NM</span></div>
        <div class="detail-row"><span class="d-lbl">Total Days</span> <span class="d-val">${v.totalDays.toFixed(1)}</span></div>
        <div class="detail-row"><span class="d-lbl">Revenue</span> <span class="d-val pos">$${Math.floor(v.breakdown.revenue).toLocaleString()}</span></div>`;
    
    document.getElementById('aiOutput').innerHTML = v.aiAnalysis;
    
    shipLayer.clearLayers();
    L.circleMarker([document.getElementById('vLat').value, document.getElementById('vLng').value], {radius:7, color:'#f59e0b'}).addTo(shipLayer);
    L.circleMarker([v.loadGeo.lat, v.loadGeo.lng], {radius:7, color:'#10b981'}).addTo(shipLayer).bindPopup("LOAD: " + v.loadPort);
    L.circleMarker([v.dischGeo.lat, v.dischGeo.lng], {radius:7, color:'#ef4444'}).addTo(shipLayer).bindPopup("DISCH: " + v.dischPort);
    
    const bounds = L.latLngBounds([
        [document.getElementById('vLat').value, document.getElementById('vLng').value],
        [v.loadGeo.lat, v.loadGeo.lng],
        [v.dischGeo.lat, v.dischGeo.lng]
    ]);
    map.fitBounds(bounds, {padding:[50,50]});
}

// [MODIFIED] DETAYLI FİNANSAL TABLO (DİL DESTEKLİ)
function showFinancials() {
    if(!currentVoyageData) return;
    
    // Dil nesnesini al (yoksa İngilizce kullan)
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    
    const b = currentVoyageData.breakdown;
    const vc = b.voyage_costs;
    const ox = b.opex;
    
    const html = `
        <table class="fin-table">
            <tr><th colspan="2" class="fin-lbl" style="font-size:1rem; border-bottom:2px solid var(--neon-cyan);">${t.fin_rev || "REVENUE"}</th></tr>
            <tr><td class="fin-lbl">${t.fin_freight || "Gross Freight"} (${currentVoyageData.qty}mt)</td><td>$${Math.floor(b.revenue).toLocaleString()}</td></tr>
            <tr class="fin-section-total"><td class="fin-lbl">${t.fin_net || "NET REVENUE"}</td><td>$${Math.floor(b.revenue - vc.comm).toLocaleString()}</td></tr>
            
            <tr><th colspan="2" class="fin-lbl" style="padding-top:20px; font-size:1rem; border-bottom:2px solid var(--neon-cyan);">${t.fin_voy || "VOYAGE COSTS"}</th></tr>
            
            <tr><td class="fin-lbl"><strong>${t.fin_bunkers || "A. Bunkers"}</strong></td><td><strong>$${Math.floor(vc.fuel.total).toLocaleString()}</strong></td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_main || "Main Engine"}</td><td>$${Math.floor(vc.fuel.main).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_aux || "Aux Engine"}</td><td>$${Math.floor(vc.fuel.aux).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_lubes || "Lubricants"}</td><td>$${Math.floor(vc.fuel.lubes).toLocaleString()}</td></tr>
            
            <tr><td class="fin-lbl"><strong>${t.fin_port || "B. Port Charges"}</strong></td><td><strong>$${Math.floor(vc.port.total).toLocaleString()}</strong></td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_dues || "Dues"}</td><td>$${Math.floor(vc.port.dues).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_pilot || "Pilotage"}</td><td>$${Math.floor(vc.port.pilot).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_tow || "Towage"}</td><td>$${Math.floor(vc.port.towage).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_lines || "Lines"}</td><td>$${Math.floor(vc.port.lines).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_berth || "Berth"}</td><td>$${Math.floor(vc.port.berth).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_agency || "Agency"}</td><td>$${Math.floor(vc.port.agency).toLocaleString()}</td></tr>

            <tr><td class="fin-lbl"><strong>${t.fin_cargo || "C. Cargo/Canal"}</strong></td><td></td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_dunnage || "Dunnage/Lashing"}</td><td>$${Math.floor(vc.cargo.dunnage).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_clean || "Cleaning"}</td><td>$${Math.floor(vc.cargo.cleaning).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_canal || "Canal Transit"}</td><td>$${Math.floor(vc.canal).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_comm || "Commission"}</td><td>$${Math.floor(vc.comm).toLocaleString()}</td></tr>
            
            <tr><th colspan="2" class="fin-lbl" style="padding-top:20px; font-size:1rem; border-bottom:2px solid var(--neon-cyan);">${t.fin_opex || "3. OPEX"}</th></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_crew || "Crew"}</td><td>$${Math.floor(ox.crew).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_maint || "Maintenance"}</td><td>$${Math.floor(ox.maintenance).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_ins || "Insurance"}</td><td>$${Math.floor(ox.insurance).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_store || "Stores"}</td><td>$${Math.floor(ox.stores).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- ${t.fin_admin || "Admin"}</td><td>$${Math.floor(ox.admin).toLocaleString()}</td></tr>
            <tr class="fin-section-total"><td class="fin-lbl">${t.fin_total_opex || "TOTAL OPEX"} (${currentVoyageData.totalDays.toFixed(1)} days)</td><td>$${Math.floor(ox.total).toLocaleString()}</td></tr>

            <tr><th colspan="2" style="padding-top:30px;"></th></tr>
            <tr class="fin-grand-total">
                <td class="fin-lbl">${t.fin_profit || "NET PROFIT"}</td>
                <td>$${Math.floor(currentVoyageData.financials.profit).toLocaleString()}</td>
            </tr>
            <tr>
                <td class="fin-lbl" style="color:#aaa;">TCE</td>
                <td style="color:var(--neon-cyan); font-weight:bold;">$${Math.floor(currentVoyageData.financials.tce).toLocaleString()} / day</td>
            </tr>
        </table>`;
    document.getElementById('finBody').innerHTML = html;
    document.getElementById('finModal').style.display = 'block';
}

// =================================================================
// 5. UTILITIES
// =================================================================

function downloadFile(filename, content) {
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename + ".txt"; 
    document.body.appendChild(element);
    element.click();
}

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
