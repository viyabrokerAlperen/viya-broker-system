// =================================================================
// 1. GLOBAL STATE & CONFIG
// =================================================================
let currentVoyageData = null; 
let REGS_DB = [], DOCS_DB = [];
let currentLang = 'en';

// İstemci tarafı gemi verileri (Hızlı arayüz güncellemeleri için)
const CLIENT_VESSEL_SPECS = {
    "HANDYSIZE": { default_speed: 13.0 }, "HANDYMAX": { default_speed: 13.0 }, "SUPRAMAX": { default_speed: 13.5 },
    "ULTRAMAX": { default_speed: 13.5 }, "PANAMAX": { default_speed: 13.0 }, "KAMSARMAX": { default_speed: 13.0 },
    "CAPESIZE": { default_speed: 12.5 }, "NEWCASTLEMAX": { default_speed: 12.5 }, "SMALL_CHEM": { default_speed: 13.0 },
    "MR_TANKER": { default_speed: 13.0 }, "LR1": { default_speed: 13.0 }, "AFRAMAX": { default_speed: 12.5 },
    "SUEZMAX": { default_speed: 12.5 }, "VLCC": { default_speed: 12.0 }, "LPG_MGC": { default_speed: 16.0 },
    "LPG_VLGC": { default_speed: 16.5 }, "LNG_CONV": { default_speed: 19.0 }, "LNG_Q_FLEX": { default_speed: 19.5 }
};

// 7 DİL DESTEĞİ (TR, EN, DE, FR, ES, IT, GR)
const TRANSLATIONS = {
    en: {
        landing_title: "NEXT GEN MARITIME INTELLIGENCE", landing_sub: "Advanced Voyage Estimation & Legal AI.",
        btn_login: "LOGIN TO TERMINAL", btn_register: "BECOME A MEMBER",
        nav_term: "Terminal", nav_kb: "Academy", nav_reg: "Regulations", nav_docs: "Docs", nav_mem: "Membership",
        lbl_vessel: "VESSEL CLASS", lbl_port: "POSITION", lbl_speed: "SPEED", lbl_qty: "CARGO", lbl_lrate: "LOAD RATE", lbl_drate: "DISCH RATE",
        btn_scan: "CALCULATE VOYAGE", panel_params: "PARAMETERS", panel_estim: "ESTIMATION",
        stat_profit: "Net Profit", btn_breakdown: "VIEW FULL BREAKDOWN", empty_state: "Awaiting Inputs...",
        sec_kb: "KNOWLEDGE BASE", sec_reg: "REGULATIONS", sec_doc: "DOCUMENT CENTER",
        ai_welcome: "Hello Captain! I am VIYA AI. Ready to assist.", computing: "SYSTEM PROCESSING...",
        menu_about: "About Us", menu_mission: "Mission", menu_contact: "Contact",
        footer_rights: "© 2026 VIYA BROKER. All Rights Reserved."
    },
    tr: {
        landing_title: "YENİ NESİL DENİZCİLİK ZEKASI", landing_sub: "İleri Sefer Tahmini & Hukuki AI.",
        btn_login: "TERMİNALE GİRİŞ", btn_register: "ÜYE OL",
        nav_term: "Terminal", nav_kb: "Akademi", nav_reg: "Mevzuat", nav_docs: "Evraklar", nav_mem: "Üyelik",
        lbl_vessel: "GEMİ TİPİ", lbl_port: "KONUM", lbl_speed: "HIZ", lbl_qty: "YÜK", lbl_lrate: "YÜKLEME HIZI", lbl_drate: "TAHLİYE HIZI",
        btn_scan: "SEFER HESAPLA", panel_params: "PARAMETRELER", panel_estim: "TAHMİN",
        stat_profit: "Net Kâr", btn_breakdown: "DETAYLI DÖKÜM", empty_state: "Veri Bekleniyor...",
        sec_kb: "BİLGİ BANKASI", sec_reg: "YÖNETMELİKLER", sec_doc: "DOKÜMAN MERKEZİ",
        ai_welcome: "Merhaba Kaptan! Ben VIYA AI. Yardıma hazırım.", computing: "HESAPLANIYOR...",
        menu_about: "Hakkımızda", menu_mission: "Misyon", menu_contact: "İletişim",
        footer_rights: "© 2026 VIYA BROKER. Tüm Hakları Saklıdır."
    },
    de: { landing_title: "MARITIME INTELLIGENZ", btn_login: "TERMINAL BETRETEN", nav_term: "Terminal", stat_profit: "Reingewinn", empty_state: "Warten...", btn_scan: "BERECHNEN" },
    fr: { landing_title: "INTELLIGENCE MARITIME", btn_login: "ENTRER AU TERMINAL", nav_term: "Terminal", stat_profit: "Bénéfice Net", empty_state: "Attente...", btn_scan: "CALCULER" },
    es: { landing_title: "INTELIGENCIA MARÍTIMA", btn_login: "ENTRAR AL TERMINAL", nav_term: "Terminal", stat_profit: "Beneficio Neto", empty_state: "Esperando...", btn_scan: "CALCULAR" },
    it: { landing_title: "INTELLIGENZA MARITTIMA", btn_login: "ENTRA NEL TERMINAL", nav_term: "Terminale", stat_profit: "Utile Netto", empty_state: "In Attesa...", btn_scan: "CALCOLARE" },
    gr: { landing_title: "ΝΑΥΤΙΛΙΑΚΗ ΝΟΗΜΟΣΥΝΗ", btn_login: "ΕΙΣΟΔΟΣ", nav_term: "Τερματικό", stat_profit: "Καθαρό Κέρδος", empty_state: "Αναμονή...", btn_scan: "ΥΠΟΛΟΓΙΣΜΟΣ" }
};

// =================================================================
// 2. INITIALIZATION & UI LOGIC
// =================================================================

function enterSystem() { 
    document.getElementById('landing-view').style.display = 'none'; 
    document.getElementById('app-container').style.display = 'block';
    map.invalidateSize(); 
}

function switchView(id) { 
    document.querySelectorAll('.view-section').forEach(e => e.classList.remove('active')); 
    document.getElementById(id).classList.add('active'); 
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // Basit navigasyon mantığı
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
    // DOM üzerindeki textleri güncelle
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        if(t[k]) el.innerText = t[k];
    });
    // İçerikleri dile göre yeniden yükle (İleride içerik çevirisi gelirse burası işe yarar)
    loadAcademy(); 
}

async function init() {
    try {
        const pRes = await fetch('/api/ports'); const ports = await pRes.json();
        const dl = document.getElementById('portList');
        ports.forEach(p => { const o = document.createElement('option'); o.value = p; dl.appendChild(o); });
        const mRes = await fetch('/api/market'); const m = await mRes.json();
        if(m.brent) { 
            document.getElementById('oilPrice').innerText = "$" + m.brent.toFixed(2); 
            document.getElementById('vlsfoPrice').innerText = "$" + m.vlsfo; 
        }
        loadAcademy();
        loadDocs();
        loadRegulations();
    } catch(e) {}
}
init();

// =================================================================
// 3. CONTENT LOADERS (DOCS & REGS)
// =================================================================

function loadAcademy() {
    const aGrid = document.getElementById('academyGrid');
    aGrid.innerHTML = "";
    // Statik Akademi Verileri (Hızlı erişim için)
    const ACADEMY_DATA = [
        {icon: "fa-scale-balanced", title: "Laytime & Demurrage", desc: "Calculating time saved/lost. SHINC/SHEX terms."},
        {icon: "fa-globe", title: "INCOTERMS 2020", desc: "Risk transfer points: FOB, CIF, CFR, FAS principles."},
        {icon: "fa-file-signature", title: "Bill of Lading", desc: "Functions: Receipt, Title, Contract of Carriage."},
        {icon: "fa-anchor", title: "General Average", desc: "York-Antwerp Rules and shared loss principles."},
        {icon: "fa-smog", title: "ECA Regulations", desc: "Sulphur caps (0.50% vs 0.10%) and scrubber usage."}
    ];
    ACADEMY_DATA.forEach(item => {
        aGrid.innerHTML += `<div class="doc-card">
            <i class="fa-solid ${item.icon} doc-icon" style="color:var(--neon-purple)"></i>
            <div class="doc-title">${item.title}</div>
            <div class="doc-desc">${item.desc}</div>
            <button class="btn-download" onclick="downloadFile('${item.title}', 'Sample academy content...')"><i class="fa-solid fa-book-open"></i> READ MODULE</button>
        </div>`;
    });
}

async function loadDocs() {
    const dContainer = document.getElementById('docsContainer');
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
                        <button class="btn-download" onclick="downloadFile('${item.title}', '${item.content.replace(/'/g, "\\'").replace(/\n/g, "\\n")}')"><i class="fa-solid fa-download"></i> DOWNLOAD</button>
                        </div>`;
            });
            html += '</div>';
            dContainer.innerHTML += html;
        });
    } catch(e) {}
}

async function loadRegulations() {
    const rGrid = document.getElementById('regsGrid');
    try {
        if(REGS_DB.length === 0) { const res = await fetch('/api/regulations'); REGS_DB = await res.json(); }
        rGrid.innerHTML = "";
        REGS_DB.forEach(reg => {
            rGrid.innerHTML += `<div class="doc-card">
                <i class="fa-solid fa-gavel doc-icon" style="color:var(--neon-gold)"></i>
                <div class="doc-title">${reg.code}</div>
                <div class="doc-desc" style="font-weight:bold; color:#fff;">${reg.title}</div>
                <div class="doc-desc">${reg.summary}</div>
                <button class="btn-download" onclick="openRegModal('${reg.id}')">VIEW DETAILS</button>
                </div>`;
        });
    } catch(e) {}
}

// =================================================================
// 4. MAP & CALCULATIONS
// =================================================================

// [YENİLİK] Harita Katmanı: CartoDB Voyager (Aydınlık ve Modern)
const map = L.map('map', {zoomControl: false}).setView([30, 0], 2);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { 
    maxZoom: 10, 
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
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
    const list = document.getElementById('cargoResultList'); list.innerHTML = ''; list.style.display = 'block';
    if(voyages.length === 0) { list.innerHTML = '<div style="padding:10px;">No cargoes found.</div>'; return; }
    voyages.forEach(v => {
        const el = document.createElement('div'); el.className = 'cargo-item';
        el.innerHTML = `<div class="ci-top"><span>${v.loadPort} -> ${v.dischPort}</span><span class="tce-badge">$${Math.floor(v.financials.tce).toLocaleString()}/day</span></div><div class="ci-bot"><span>${v.commodity}</span><span>Bal: ${v.ballastDist} NM</span></div>`;
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
        <div class="detail-row"><span class="d-lbl">Gross Revenue</span> <span class="d-val pos">$${Math.floor(v.breakdown.revenue).toLocaleString()}</span></div>
        <div class="detail-row"><span class="d-lbl">Total Expenses</span> <span class="d-val neg">-$${Math.floor(v.breakdown.total_expenses).toLocaleString()}</span></div>`;
    
    document.getElementById('aiOutput').innerHTML = v.aiAnalysis;
    
    shipLayer.clearLayers();
    L.circleMarker([document.getElementById('vLat').value, document.getElementById('vLng').value], {radius:7, color:'#f59e0b'}).addTo(shipLayer);
    L.circleMarker([v.loadGeo.lat, v.loadGeo.lng], {radius:7, color:'#10b981'}).addTo(shipLayer).bindPopup("LOAD");
    L.circleMarker([v.dischGeo.lat, v.dischGeo.lng], {radius:7, color:'#ef4444'}).addTo(shipLayer).bindPopup("DISCH");
    map.fitBounds([[document.getElementById('vLat').value, document.getElementById('vLng').value], [v.loadGeo.lat, v.loadGeo.lng], [v.dischGeo.lat, v.dischGeo.lng]], {padding:[50,50]});
}

// [GÜNCELLENMİŞ] FİNANSAL TABLO (DETAYLI)
function showFinancials() {
    if(!currentVoyageData) return;
    const b = currentVoyageData.breakdown;
    const vc = b.voyage_costs;
    const ox = b.opex;
    
    const html = `
        <table class="fin-table">
            <tr><th colspan="2" class="fin-lbl" style="font-size:1rem; border-bottom:2px solid var(--neon-cyan);">1. REVENUE (GELİR)</th></tr>
            <tr><td class="fin-lbl">Gross Freight (${currentVoyageData.qty}mt)</td><td>$${Math.floor(b.revenue).toLocaleString()}</td></tr>
            <tr class="fin-section-total"><td class="fin-lbl">NET REVENUE (After Comm)</td><td>$${Math.floor(b.revenue - vc.comm).toLocaleString()}</td></tr>
            
            <tr><th colspan="2" class="fin-lbl" style="padding-top:20px; font-size:1rem; border-bottom:2px solid var(--neon-cyan);">2. VOYAGE COSTS (SEFER GİDERLERİ)</th></tr>
            <tr><td class="fin-lbl"><strong>A. Bunkers (Yakıt)</strong></td><td><strong>$${Math.floor(vc.fuel.total).toLocaleString()}</strong></td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Main Engine (Seyir)</td><td>$${Math.floor(vc.fuel.main).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Aux Engine (Liman)</td><td>$${Math.floor(vc.fuel.aux).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Lubricants (Yağ)</td><td>$${Math.floor(vc.fuel.lubes).toLocaleString()}</td></tr>
            
            <tr><td class="fin-lbl"><strong>B. Port Charges (Liman)</strong></td><td><strong>$${Math.floor(vc.port.total).toLocaleString()}</strong></td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Dues (Rüsum)</td><td>$${Math.floor(vc.port.dues).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Pilotage (Kılavuz)</td><td>$${Math.floor(vc.port.pilot).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Towage (Römorkör)</td><td>$${Math.floor(vc.port.towage).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Agency & Misc</td><td>$${Math.floor(vc.port.agency + vc.port.waste).toLocaleString()}</td></tr>

            <tr><td class="fin-lbl"><strong>C. Cargo Handling</strong></td><td><strong>$${Math.floor(vc.cargo.total).toLocaleString()}</strong></td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Hold Cleaning / Lashing</td><td>$${Math.floor(vc.cargo.total).toLocaleString()}</td></tr>

            <tr><td class="fin-lbl"><strong>D. Others</strong></td><td></td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Canal Transit</td><td>$${Math.floor(vc.canal).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Brokerage Comm</td><td>$${Math.floor(vc.comm).toLocaleString()}</td></tr>
            
            <tr class="fin-section-total"><td class="fin-lbl">TOTAL VOYAGE COSTS</td><td>$${Math.floor(vc.total).toLocaleString()}</td></tr>

            <tr><th colspan="2" class="fin-lbl" style="padding-top:20px; font-size:1rem; border-bottom:2px solid var(--neon-cyan);">3. OPERATING EXPENSES (OPEX - GÜNLÜK)</th></tr>
            <tr><td class="fin-lbl">Total OPEX (${currentVoyageData.totalDays.toFixed(1)} days)</td><td><strong>$${Math.floor(ox.total).toLocaleString()}</strong></td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Crewing (Personel)</td><td>$${Math.floor(ox.crew).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Insurance (H&M, P&I)</td><td>$${Math.floor(ox.insurance).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Maintenance & Stores</td><td>$${Math.floor(ox.maintenance + ox.stores).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Victualling & Admin</td><td>$${Math.floor(ox.victualling + ox.admin).toLocaleString()}</td></tr>

            <tr><th colspan="2" style="padding-top:30px;"></th></tr>
            <tr class="fin-grand-total">
                <td class="fin-lbl">NET PROFIT (KÂR)</td>
                <td>$${Math.floor(currentVoyageData.financials.profit).toLocaleString()}</td>
            </tr>
            <tr>
                <td class="fin-lbl" style="color:#aaa;">TCE (Time Charter Equivalent)</td>
                <td style="color:var(--neon-cyan); font-weight:bold;">$${Math.floor(currentVoyageData.financials.tce).toLocaleString()} / day</td>
            </tr>
        </table>`;
    document.getElementById('finBody').innerHTML = html;
    document.getElementById('finModal').style.display = 'block';
}

// =================================================================
// 5. UTILITIES (DOWNLOAD, MODALS, CHAT)
// =================================================================

// [YENİLİK] DOSYA İNDİRME SİMÜLASYONU
function downloadFile(filename, content) {
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename + ".txt"; // Şimdilik .txt olarak indiriyor
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
