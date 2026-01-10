// public/app.js
// VIYA BROKER - COMMAND INTERFACE (V17.0 - Document Generator Added)
// Features: Voyage Calc, Smart Map, Auth, Profile Management, Chatbot, DOCUMENT STUDIO

// GLOBAL DEĞİŞKENLER
let currentVoyageData = null; 
let REGS_DB = [], DOCS_DB = [];
let currentLang = 'en';
let mapRouteLayer = null; 
let currentTemplateType = null;
let currentTemplateKey = null;

// Dil İsimleri (AI Chat İçin)
const LANG_NAMES = {
    en: "English", tr: "Turkish", de: "German", it: "Italian", 
    fr: "French", es: "Spanish", gr: "Greek"
};

// [FULL LOCALIZATION PACK]
const TRANSLATIONS = {
    en: {
        landing_title: "NEXT GEN MARITIME INTELLIGENCE", landing_sub: "Advanced Voyage Estimation & Legal AI.",
        btn_login: "LOG IN", btn_enter_term: "ENTER TERMINAL", btn_learn_more: "LEARN MORE", btn_register: "BECOME MEMBER",
        nav_term: "Terminal", nav_docstudio: "Document Studio", nav_kb: "Academy", nav_reg: "Regulations", nav_docs: "Docs", nav_mem: "Membership",
        menu_home: "Home", menu_about: "About Us", menu_mission: "Mission", menu_contact: "Contact",
        lbl_vessel: "VESSEL CLASS", lbl_port: "POSITION", lbl_speed: "SPEED", lbl_qty: "CARGO", lbl_lrate: "LOAD RATE", lbl_drate: "DISCH RATE",
        btn_scan: "SCAN MARKET", panel_params: "PARAMETERS", panel_estim: "ESTIMATION",
        stat_profit: "Net Profit", btn_breakdown: "VIEW FULL BREAKDOWN", empty_state: "Awaiting Inputs...",
        modal_fin_title: "FINANCIAL BREAKDOWN",
        fin_rev: "REVENUE", fin_freight: "Gross Freight", fin_net: "NET REVENUE",
        fin_voy: "VOYAGE COSTS", fin_bunkers: "A. Bunkers", fin_main: "Main Engine", fin_aux: "Aux Engine", fin_lubes: "Lubricants",
        fin_port: "B. Port Charges", fin_dues: "Dues", fin_pilot: "Pilotage", fin_tow: "Towage", fin_total_port: "Total Port Costs",
        fin_cargo: "C. Cargo/Canal", fin_misc: "Misc/Cleaning", fin_canal: "Canal Transit", fin_comm: "Commission",
        fin_opex: "OPEX", fin_daily_opex: "Daily OPEX", fin_total_opex: "TOTAL OPEX", fin_profit: "NET PROFIT",
        sec_kb: "KNOWLEDGE BASE", sec_reg: "REGULATIONS", sec_doc: "DOCUMENT CENTER",
        ai_welcome: "Hello Captain! I am VIYA AI. Systems Online.", chat_placeholder: "Ask me anything about the market...",
        footer_rights: "© 2026 VIYA BROKER. All Rights Reserved.",
        btn_read: "READ", btn_download: "DOWNLOAD", btn_view: "DETAILS", btn_generate: "GENERATE"
    },
    tr: {
        landing_title: "YENİ NESİL DENİZCİLİK ZEKASI", landing_sub: "İleri Sefer Tahmini & Hukuki AI.",
        btn_login: "GİRİŞ", btn_enter_term: "TERMİNALE GİR", btn_learn_more: "DAHA FAZLA", btn_register: "ÜYE OL",
        nav_term: "Terminal", nav_docstudio: "Doküman Stüdyosu", nav_kb: "Akademi", nav_reg: "Mevzuat", nav_docs: "Evraklar", nav_mem: "Üyelik",
        menu_home: "Anasayfa", menu_about: "Hakkımızda", menu_mission: "Misyon", menu_contact: "İletişim",
        lbl_vessel: "GEMİ TİPİ", lbl_port: "KONUM", lbl_speed: "HIZ", lbl_qty: "YÜK", lbl_lrate: "YÜKLEME HIZI", lbl_drate: "TAHLİYE HIZI",
        btn_scan: " PİYASAYI TARA", panel_params: "PARAMETRELER", panel_estim: "TAHMİN",
        stat_profit: "Net Kâr", btn_breakdown: "DETAYLI DÖKÜM", empty_state: "Veri Bekleniyor...",
        modal_fin_title: "FİNANSAL DÖKÜM",
        fin_rev: "GELİRLER", fin_freight: "Brüt Navlun", fin_net: "NET GELİR",
        fin_voy: "SEFER GİDERLERİ", fin_bunkers: "A. Yakıt", fin_main: "Ana Makine", fin_aux: "Yardımcı Makine", fin_lubes: "Yağlar",
        fin_port: "B. Liman Giderleri", fin_dues: "Rüsumlar", fin_pilot: "Kılavuz", fin_tow: "Römorkör", fin_total_port: "Toplam Liman",
        fin_cargo: "C. Yük & Kanal", fin_misc: "Dunnage/Temizlik", fin_canal: "Kanal", fin_comm: "Komisyon",
        fin_opex: "İŞLETME (OPEX)", fin_daily_opex: "Günlük OPEX", fin_total_opex: "TOPLAM OPEX", fin_profit: "NET KÂR",
        sec_kb: "BİLGİ BANKASI", sec_reg: "YÖNETMELİKLER", sec_doc: "DOKÜMAN MERKEZİ",
        ai_welcome: "Merhaba Reis! Ben VIYA AI. Sistemler Aktif.", chat_placeholder: "Piyasa veya sefer hakkında sor...",
        footer_rights: "© 2026 VIYA BROKER. Tüm Hakları Saklıdır.",
        btn_read: "OKU", btn_download: "İNDİR", btn_view: "DETAYLAR", btn_generate: "OLUŞTUR"
    },
};

// =================================================================
// 1. SYSTEM INITIALIZATION
// =================================================================

function enterSystem() { 
    const landing = document.getElementById('landing-page');
    const app = document.getElementById('app-container');
    if(landing && app) {
        landing.style.opacity = '0';
        landing.style.transition = 'opacity 0.8s ease';
        setTimeout(() => {
            landing.style.display = 'none'; 
            app.style.display = 'block';
            if(map) map.invalidateSize(); 
            const welcomeMsg = TRANSLATIONS[currentLang]?.ai_welcome || "System Online";
            addChatMessage('ai', welcomeMsg);
        }, 800);
    }
}

async function init() {
    console.log("⚓ VIYA SYSTEM INITIALIZING...");
    try {
        loadDashboardRoutes();

        // Limanları Yükle
        const pRes = await fetch('/api/ports'); 
        const ports = await pRes.json();
        const dl = document.getElementById('portList');
        if(dl) { 
            dl.innerHTML = ""; 
            ports.forEach(p => { 
                const o = document.createElement('option'); 
                o.value = p; 
                dl.appendChild(o); 
            }); 
        }
        
        // Market Verisi
        const mRes = await fetch('/api/market'); 
        const m = await mRes.json();
        
        const oilEl = document.getElementById('oilPrice');
        const vlsfoEl = document.getElementById('vlsfoPrice');
        
        if(m.brent) { 
            if(oilEl) {
                oilEl.innerText = "$" + m.brent.toFixed(2); 
                if(m.source === 'SIMULATED') {
                    oilEl.style.color = '#f59e0b';
                    oilEl.title = "Simulated Data";
                }
            }
            if(vlsfoEl) vlsfoEl.innerText = "$" + m.vlsfo; 
        }

        // İçerikleri Yükle
        loadAcademy(); 
        loadDocs(); 
        loadRegulations();
        loadDocumentTemplates(); // YENİ!

    } catch(e) {
        console.error("System Init Error:", e);
    }
}
window.onload = init;

// DASHBOARD ROTALARI
async function loadDashboardRoutes() {
    const routeList = document.getElementById('route-list');
    if(!routeList) return; 

    routeList.innerHTML = '<div class="text-center text-cyan-400 p-2 text-xs">Veriler taranıyor...</div>';

    try {
        const response = await fetch('/api/routes');
        if(!response.ok) throw new Error('API Hatası');
        
        const routes = await response.json();
        routeList.innerHTML = ''; 

        routes.forEach(route => {
            const card = document.createElement('div');
            card.className = 'bg-slate-800/50 border border-slate-700 p-3 rounded mb-2 cursor-pointer hover:border-cyan-400/50 transition-all';
            
            card.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <div class="text-[10px] text-gray-500 mb-1">${route.date || 'Tarih Yok'}</div>
                        <div class="text-sm font-bold text-gray-200">
                            ${route.origin} <span class="text-cyan-500">➜</span> ${route.destination}
                        </div>
                        <div class="text-[10px] text-slate-400 mt-1">${route.vessel_name || 'Spot'} • ${route.cargo}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-emerald-400 font-mono font-bold text-sm bg-emerald-900/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            $${route.price ? route.price.toLocaleString() : '0'}
                        </div>
                        <div class="text-xs text-gray-500 mt-1 font-mono">${route.distance} NM</div>
                    </div>
                </div>
            `;
            routeList.appendChild(card);
        });

    } catch (error) {
        routeList.innerHTML = '<div class="text-red-400 text-xs text-center">Bağlantı yok.</div>';
    }
}

function switchView(id) { 
    document.querySelectorAll('.view-section').forEach(e => e.classList.remove('active')); 
    document.getElementById(id).classList.add('active'); 
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    const navMap = {'dashboard':0, 'document-studio':1, 'academy':2, 'regulations':3, 'docs':4, 'pricing':5};
    if(navMap[id] !== undefined) {
        const items = document.querySelectorAll('.nav-item');
        if(items[navMap[id]]) items[navMap[id]].classList.add('active');
    }
    if(id === 'dashboard' && map) setTimeout(() => map.invalidateSize(), 100); 
}

function changeLanguage(lang) {
    currentLang = lang;
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        if(t[k]) el.innerText = t[k];
    });

    const chatInput = document.getElementById('chatInput');
    if(chatInput) chatInput.placeholder = t.chat_placeholder || "...";

    loadAcademy(); loadDocs(); loadRegulations();
    if(currentVoyageData && document.getElementById('finModal').style.display === 'block') {
        showFinancials();
    }
}

// =================================================================
// 2. MAP & VOYAGE ENGINE (The Brain)
// =================================================================

const map = L.map('map', {zoomControl: false}).setView([34, 26], 3); 
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { 
    maxZoom: 10, 
    attribution: 'VIYA MAPS' 
}).addTo(map);

// --- YENİ HARİTA KATMANLARI (SEAMARK & NO-GO) ---
L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'OpenSeaMap'
}).addTo(map);

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
    L.circleMarker([lat, lng], {
        radius: 8, 
        color: '#0ea5e9',
        fillColor: '#0ea5e9',
        fillOpacity: 0.8, 
        weight: 2
    }).addTo(shipLayer).bindPopup("VESSEL POS"); 
    
    map.setView([lat, lng], 5); 
}

async function scanMarket() {
    const lat = parseFloat(document.getElementById('vLat').value);
    const lng = parseFloat(document.getElementById('vLng').value);
    
    if(isNaN(lat) || isNaN(lng)) { 
        alert("Reis, geminin konumunu girmeden rota çizemem!"); 
        return; 
    }

    updateShipMarker(lat, lng);
    
    const loader = document.getElementById('loader');
    if(loader) loader.style.display = 'grid';

    try {
        const res = await fetch('/api/analyze', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
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
        
        if(data.success && data.voyages.length > 0) {
            renderList(data.voyages);
        } else {
            alert(data.msg || "Kriterlere uygun kârlı sefer bulunamadı Reis.");
        }

    } catch(e) { 
        console.error(e);
        alert("Bağlantı hatası Reis. Telsiz çekmiyor."); 
    } finally { 
        if(loader) loader.style.display = 'none'; 
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
                <span style="font-weight:bold; color:white;">${v.params.loadPort} <i class="fa-solid fa-arrow-right" style="font-size:0.8em; color:#64748b"></i> ${v.params.dischPort}</span>
                <span class="tce-badge">$${Math.floor(v.financials.tce).toLocaleString()}</span>
            </div>
            <div class="ci-bot">
                <span>${v.params.cargo} (${parseInt(v.params.qty/1000)}k)</span>
                <span class="${profitClass}">$${Math.floor(v.financials.profit/1000)}k Net</span>
            </div>
        `;
        el.onclick = () => showDetails(v, el); 
        list.appendChild(el);
        if(index === 0) showDetails(v, el);
    });
}

function showDetails(v, el) {
    currentVoyageData = v; 
    document.querySelectorAll('.cargo-item').forEach(x => x.classList.remove('active')); 
    if(el) el.classList.add('active');
    
    document.getElementById('emptyState').style.display = 'none'; 
    document.getElementById('analysisPanel').style.display = 'block';
    
    document.getElementById('dispTCE').innerText = "$" + Math.floor(v.financials.tce).toLocaleString();
    
    const profitEl = document.getElementById('dispProfit');
    profitEl.innerText = "$" + Math.floor(v.financials.profit).toLocaleString();
    profitEl.style.color = v.financials.profit > 0 ? '#4ade80' : '#f87171';

    let distDisplay = "";
    if(v.dist && typeof v.dist === 'object') {
         distDisplay = `
         <div class="detail-row"><span class="d-lbl" style="color:#94a3b8">Ballast (To Load)</span> <span class="d-val text-cyan-400">${Math.floor(v.dist.ballast)} nm</span></div>
         <div class="detail-row"><span class="d-lbl" style="color:#94a3b8">Laden (To Disch)</span> <span class="d-val text-cyan-400">${Math.floor(v.dist.laden)} nm</span></div>
         <div class="detail-row"><span class="d-lbl font-bold">Total Distance</span> <span class="d-val font-bold text-white">${Math.floor(v.dist.total)} nm</span></div>
         `;
    } else {
         distDisplay = `<div class="detail-row"><span class="d-lbl">Distance</span> <span class="d-val">${v.dist} nm</span></div>`;
    }

    document.getElementById('financialDetails').innerHTML = `
        <div class="detail-row"><span class="d-lbl">Sea/Port Days</span> <span class="d-val">${v.duration.sea} / ${v.duration.port}</span></div>
        <div class="detail-row"><span class="d-lbl">Total Duration</span> <span class="d-val">${v.duration.total} days</span></div>
        <div class="detail-row"><span class="d-lbl">Break-Even</span> <span class="d-val">$${v.financials.breakEvenRate.toFixed(2)} / ton</span></div>
        <hr style="border-color:#334155; margin:8px 0;">
        ${distDisplay}
    `;

    document.getElementById('aiOutput').innerHTML = v.aiAnalysis;

    // --- HARİTA GÜNCELLEME ---
    shipLayer.clearLayers();
    
    const shipPos = [document.getElementById('vLat').value, document.getElementById('vLng').value];
    const loadPos = [v.loadGeo?.lat || 0, v.loadGeo?.lng || 0];
    const dischPos = [v.dischGeo?.lat || 0, v.dischGeo?.lng || 0];

    L.circleMarker(shipPos, {radius:8, color:'#3b82f6', fillColor:'#3b82f6', fillOpacity:0.8})
      .addTo(shipLayer).bindPopup("<b>SHIP POSITION</b>").openPopup();
    
    L.circleMarker(loadPos, {radius:8, color:'#eab308', fillColor:'#eab308', fillOpacity:0.8})
      .addTo(shipLayer).bindPopup(`<b>LOAD:</b> ${v.params.loadPort}`);
    
    L.circleMarker(dischPos, {radius:8, color:'#ef4444', fillColor:'#ef4444', fillOpacity:0.8})
      .addTo(shipLayer).bindPopup(`<b>DISCH:</b> ${v.params.dischPort}`);

    const bounds = L.latLngBounds([shipPos, loadPos, dischPos]);
    map.fitBounds(bounds, {padding:[50,50]});
}

function showFinancials() {
    if(!currentVoyageData) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    const bd = currentVoyageData.breakdown;
    const vc = bd.voyage_costs;
    const ox = bd.opex;

    const html = `
        <table class="fin-table">
            <tr><th colspan="2" style="border-bottom:2px solid var(--neon-cyan)">${t.fin_rev}</th></tr>
            <tr><td>${t.fin_freight} (${currentVoyageData.params.qty}mt @ $${currentVoyageData.params.freightRate})</td>
                <td class="text-green-400">$${Math.floor(bd.revenue).toLocaleString()}</td></tr>
            <tr class="fin-section-total"><td>${t.fin_net}</td>
                <td>$${Math.floor(bd.revenue - vc.commission).toLocaleString()}</td></tr>
            
            <tr><th colspan="2" style="padding-top:20px; border-bottom:2px solid var(--neon-cyan)">${t.fin_voy}</th></tr>
            <tr><td>${t.fin_bunkers} (Total)</td><td class="text-red-300">-$${Math.floor(vc.fuel.total).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_main}</td><td>-$${Math.floor(vc.fuel.main).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_aux}</td><td>-$${Math.floor(vc.fuel.aux).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_lubes}</td><td>-$${Math.floor(vc.fuel.lubes).toLocaleString()}</td></tr>

            <tr><td>${t.fin_port}</td><td class="text-red-300">-$${Math.floor(vc.port.total).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_dues}</td><td>-$${Math.floor(vc.port.dues).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_pilot}</td><td>-$${Math.floor(vc.port.pilot).toLocaleString()}</td></tr>
            
            <tr><td>${t.fin_cargo}</td><td class="text-red-300">-$${Math.floor(vc.cargo_canal.total).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_canal} (${vc.cargo_canal.names || 'None'})</td><td>-$${Math.floor(vc.cargo_canal.canal).toLocaleString()}</td></tr>

            <tr><td>${t.fin_comm}</td><td class="text-red-300">-$${Math.floor(vc.commission).toLocaleString()}</td></tr>

            <tr><th colspan="2" style="padding-top:20px; border-bottom:2px solid var(--neon-cyan)">${t.fin_opex}</th></tr>
            <tr><td>${t.fin_daily_opex} ($${ox.daily})</td><td class="text-orange-300">-$${Math.floor(ox.total).toLocaleString()}</td></tr>
            
            <tr><th colspan="2" style="padding-top:30px;"></th></tr>
            <tr class="fin-grand-total">
                <td>${t.fin_profit}</td>
                <td style="color:${currentVoyageData.financials.profit > 0 ? '#4ade80' : '#ef4444'}">
                    $${Math.floor(currentVoyageData.financials.profit).toLocaleString()}
                </td>
            </tr>
        </table>`;
        
    document.getElementById('finBody').innerHTML = html;
    document.getElementById('finModal').style.display = 'block';
}

// =================================================================
// 3. DOCUMENT STUDIO (YENİ!)
// =================================================================

async function loadDocumentTemplates() {
    try {
        const res = await fetch('/api/document-templates');
        const data = await res.json();
        
        if(!data.success || !data.templates) return;
        
        const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
        
        // Kategorilere göre ayır
        const weather = data.templates.filter(t => t.category === 'Weather Related');
        const cargo = data.templates.filter(t => t.category === 'Cargo Issues');
        const port = data.templates.filter(t => t.category === 'Port/Terminal');
        const laytime = data.templates.filter(t => t.category === 'Laytime Disputes');
        const bunker = data.templates.filter(t => t.category === 'Bunker Quality');
        
        renderTemplateCards('weatherTemplates', weather, t);
        renderTemplateCards('cargoTemplates', cargo, t);
        renderTemplateCards('portTemplates', port, t);
        renderTemplateCards('laytimeTemplates', laytime, t);
        renderTemplateCards('bunkerTemplates', bunker, t);
        
    } catch(e) {
        console.error('Template load error:', e);
    }
}

function renderTemplateCards(containerId, templates, translations) {
    const container = document.getElementById(containerId);
    if(!container) return;
    
    container.innerHTML = '';
    
    templates.forEach(tmpl => {
        const card = document.createElement('div');
        card.className = 'doc-card';
        card.innerHTML = `
            <i class="fa-solid fa-file-contract doc-icon" style="color:var(--neon-cyan)"></i>
            <div class="doc-title">${tmpl.title}</div>
            <div class="doc-desc">${tmpl.category}</div>
            <button class="btn-download" onclick="openDocGenerator('${tmpl.type}', '${tmpl.templateKey}', '${tmpl.title.replace(/'/g, "\\'")}')">
                <i class="fa-solid fa-wand-magic-sparkles"></i> ${translations.btn_generate || 'GENERATE'}
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
    
    // Form'u temizle
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
    if(loader) loader.style.display = 'grid';
    
    const userInputs = {
        VESSEL_NAME: document.getElementById('genVesselName').value || 'TO BE COMPLETED',
        IMO_NUMBER: document.getElementById('genIMO').value || 'XXXXXXX',
        LOAD_PORT: document.getElementById('genLoadPort').value || 'TO BE COMPLETED',
        DISCHARGE_PORT: document.getElementById('genDischPort').value || 'TO BE COMPLETED',
        CARGO_TYPE: document.getElementById('genCargo').value || 'TO BE COMPLETED',
        CARGO_QUANTITY: document.getElementById('genQty').value || 'XXXXX',
        DATE: new Date().toLocaleDateString('en-GB'),
        CHARTERERS_NAME: 'TO BE COMPLETED BY USER',
        FLAG: 'TO BE COMPLETED'
    };
    
    try {
        const res = await fetch('/api/generate-document', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                templateType:
                    // =================================================================
// PART 2 OF 2 - DOCUMENT GENERATOR + AI CHAT + CONTENT LOADERS
// =================================================================

// (generateDocument fonksiyonunun devamı)
                templateType: currentTemplateType,
                templateKey: currentTemplateKey,
                userInputs: userInputs
            })
        });
        
        const data = await res.json();
        
        if(data.success) {
            document.getElementById('docGenForm').style.display = 'none';
            document.getElementById('generatedDocArea').style.display = 'block';
            document.getElementById('docOutput').value = data.document;
        } else {
            alert('Document generation failed: ' + (data.error || 'Unknown error'));
        }
        
    } catch(e) {
        console.error('Generation error:', e);
        alert('Connection error. Please try again.');
    } finally {
        if(loader) loader.style.display = 'none';
    }
}

function downloadGeneratedDoc() {
    const content = document.getElementById('docOutput').value;
    const blob = new Blob([content], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VIYA_${currentTemplateKey}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function copyToClipboard() {
    const textarea = document.getElementById('docOutput');
    textarea.select();
    document.execCommand('copy');
    alert('Document copied to clipboard!');
}

// =================================================================
// 4. AI CHATBOT
// =================================================================

function toggleChat() { 
    const win = document.getElementById('chatWindow');
    win.style.display = win.style.display==='flex' ? 'none' : 'flex'; 
}

function handleEnter(e) { if(e.key === 'Enter') sendChat(); }

async function sendChat() {
    const inp = document.getElementById('chatInput');
    const msg = inp.value.trim();
    if(!msg) return;
    
    addChatMessage('user', msg);
    inp.value = ''; 
    const tempId = 'temp-' + Date.now();
    addChatMessage('ai', '<span class="typing-dot">...</span>', tempId);

    try {
        const langName = LANG_NAMES[currentLang] || "English";
        const res = await fetch('/api/chat', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({message: msg, language: langName}) 
        });
        
        const d = await res.json();
        const tempEl = document.getElementById(tempId);
        if(tempEl) tempEl.remove();
        
        typeWriterEffect(d.reply);

    } catch(e) { 
        document.getElementById(tempId).innerText = "Error: Connection lost."; 
    }
}

function addChatMessage(role, html, id=null) {
    const body = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    if(id) div.id = id;
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
    const speed = 15; 
    
    function type() {
        if (i < text.length) {
            if(text.charAt(i) === '<') {
                const closeIdx = text.indexOf('>', i);
                div.innerHTML += text.substring(i, closeIdx+1);
                i = closeIdx + 1;
            } else {
                div.innerHTML += text.charAt(i);
                i++;
            }
            body.scrollTop = body.scrollHeight;
            setTimeout(type, speed);
        }
    }
    type();
}

// =================================================================
// 5. CONTENT LOADERS
// =================================================================

function openContentModal(title, content) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalBody').innerText = content;
    document.getElementById('docModal').style.display = 'block';
}

function loadAcademy() {
    const aGrid = document.getElementById('academyGrid');
    if(!aGrid) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    aGrid.innerHTML = "";
    
    const ACADEMY_DATA = [
        {icon: "fa-scale-balanced", title: "Laytime Basics", desc: "SHINC vs SHEX explained.", content: "Laytime is the amount of time allowed..."},
        {icon: "fa-globe", title: "INCOTERMS 2020", desc: "FOB, CIF, CFR risks.", content: "Incoterms define the responsibilities of buyers and sellers..."},
        {icon: "fa-ship", title: "Charter Parties", desc: "Gencon 94 vs NYPE.", content: "A charter party is a maritime contract..."}
    ];

    ACADEMY_DATA.forEach(item => {
        aGrid.innerHTML += `<div class="doc-card">
            <i class="fa-solid ${item.icon} doc-icon" style="color:var(--neon-purple)"></i>
            <div class="doc-title">${item.title}</div>
            <div class="doc-desc">${item.desc}</div>
            <button class="btn-download" onclick="openContentModal('${item.title}', '${item.content}')"><i class="fa-solid fa-book-open"></i> ${t.btn_read}</button>
        </div>`;
    });
}

async function loadDocs() {
    const dContainer = document.getElementById('docsContainer');
    if(!dContainer) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    
    const FALLBACK_DOCS = [
        {
            category: "Standard Contracts",
            items: [
                {title: "GENCON 94", desc: "Standard Voyage Charter", content: "PART I\n1. Shipbroker..."},
                {title: "NYPE 2015", desc: "Time Charter Party", content: "Time Charter Agreement..."}
            ]
        },
        {
            category: "Bill of Ladings",
            items: [
                {title: "Congenbill 2016", desc: "To be used with Charter Parties", content: "Shipper..."}
            ]
        }
    ];

    let data = [];
    try {
        const res = await fetch('/api/documents');
        const json = await res.json();
        if(json && json.length > 0) data = json;
        else data = FALLBACK_DOCS;
    } catch(e) {
        data = FALLBACK_DOCS;
    }

    dContainer.innerHTML = "";
    data.forEach(cat => {
        let html = `<div class="category-header">${cat.category}</div><div class="docs-grid">`;
        cat.items.forEach(item => {
            let contentSafe = item.content ? item.content.replace(/'/g, "\\'").replace(/\n/g, "\\n") : "...";
            html += `<div class="doc-card">
                    <i class="fa-solid fa-file-contract doc-icon" style="color:var(--neon-cyan)"></i>
                    <div class="doc-title">${item.title}</div>
                    <div class="doc-desc">${item.desc}</div>
                    <div style="display:flex; gap:10px; width:100%;">
                        <button class="btn-download" onclick="openContentModal('${item.title}', '${contentSafe}')"><i class="fa-solid fa-eye"></i> ${t.btn_read}</button>
                        <button class="btn-download" onclick="downloadFile('${item.title}', '${contentSafe}')"><i class="fa-solid fa-download"></i></button>
                    </div>
                    </div>`;
        });
        html += '</div>';
        dContainer.innerHTML += html;
    });
}

async function loadRegulations() {
    const rGrid = document.getElementById('regsGrid');
    if(!rGrid) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];

    const FALLBACK_REGS = [
        {code: "SOLAS", title: "Safety of Life at Sea", summary: "Minimum safety standards for construction, equipment...", content: "Chapter I..."},
        {code: "MARPOL", title: "Marine Pollution", summary: "Prevention of pollution by ships (Oil, Chemicals, Sewage)...", content: "Annex I..."}
    ];

    let data = [];
    try {
        const res = await fetch('/api/regulations');
        const json = await res.json();
        if(json && json.length > 0) data = json;
        else data = FALLBACK_REGS;
    } catch(e) {
        data = FALLBACK_REGS;
    }

    rGrid.innerHTML = "";
    data.forEach(reg => {
        let contentSafe = reg.content ? reg.content.replace(/'/g, "\\'").replace(/\n/g, "\\n") : "...";
        rGrid.innerHTML += `<div class="doc-card">
            <i class="fa-solid fa-gavel doc-icon" style="color:var(--neon-gold)"></i>
            <div class="doc-title">${reg.code}</div>
            <div class="doc-desc" style="font-weight:bold; color:#fff;">${reg.title}</div>
            <div class="doc-desc">${reg.summary}</div>
            <button class="btn-download" onclick="openContentModal('${reg.title}', '${contentSafe}')"><i class="fa-solid fa-book"></i> ${t.btn_view}</button>
            </div>`;
    });
}

function downloadFile(filename, content) {
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename + ".txt"; 
    document.body.appendChild(element);
    element.click();
}

function closeModal(id) { 
    document.getElementById(id).style.display = 'none'; 
}

window.onclick = function(event) { 
    if (event.target.classList.contains('modal')) event.target.style.display = 'none'; 
}

// =================================================================
// 6. AUTHENTICATION & PROFILE LOGIC
// =================================================================

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('viya_token');
    const userStr = localStorage.getItem('viya_user');
    
    if (token && userStr) {
        currentUser = JSON.parse(userStr);
        
        const loginBtn = document.querySelector('.lp-btn-login');
        if(loginBtn) {
            loginBtn.innerText = "ENTER TERMINAL";
            loginBtn.onclick = enterSystem;
        }

        const userArea = document.getElementById('userArea');
        if(userArea) {
            userArea.style.display = 'block';
            document.getElementById('navUserName').innerText = currentUser.fullName.split(' ')[0].toUpperCase();
        }
    }
});

function openAuthModal() {
    if (currentUser) { enterSystem(); return; }
    document.getElementById('authModal').style.display = 'block';
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(e => {
        e.classList.remove('active');
        e.style.color = '#888';
    });
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
        const res = await fetch('/api/kvkk');
        const data = await res.json();
        document.getElementById('kvkkTitle').innerText = data.title;
        document.getElementById('kvkkContent').innerText = data.content;
        document.getElementById('kvkkModal').style.display = 'block';
    } catch(e) {}
}

async function doLogin() {
    const email = document.getElementById('lEmail').value;
    const pass = document.getElementById('lPass').value;
    const msg = document.getElementById('authMsg');
    
    msg.innerText = "Connecting..."; msg.style.color = "yellow";

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password: pass})
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('viya_token', data.token);
            localStorage.setItem('viya_user', JSON.stringify(data.user));
            currentUser = data.user;
            msg.innerText = "Access Granted."; msg.style.color = "#4ade80";
            setTimeout(() => { closeModal('authModal'); enterSystem(); window.location.reload(); }, 1000);
        } else {
            msg.innerText = data.error || "Login Failed"; msg.style.color = "#ef4444";
        }
    } catch(e) { msg.innerText = "Connection Error"; }
}

async function doRegister() {
    const name = document.getElementById('rName').value;
    const email = document.getElementById('rEmail').value;
    const pass = document.getElementById('rPass').value;
    const kvkk = document.getElementById('kvkkCheck').checked;
    const msg = document.getElementById('authMsg');

    if(!kvkk) { msg.innerText = "Please accept KVKK."; msg.style.color = "#ef4444"; return; }
    msg.innerText = "Creating ID...";

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({fullName: name, email, password: pass, kvkkAccepted: kvkk})
        });
        const data = await res.json();

        if(data.success) {
            msg.innerText = "ID Created! Please Login."; msg.style.color = "#4ade80";
            setTimeout(() => switchAuthTab('login'), 1500);
        } else {
            msg.innerText = data.error; msg.style.color = "#ef4444";
        }
    } catch(e) { msg.innerText = "Error"; }
}

function openProfileModal() {
    if(!currentUser) return;
    
    document.getElementById('pName').innerText = currentUser.fullName;
    document.getElementById('pEmail').innerText = currentUser.email;
    document.getElementById('pPlan').innerText = currentUser.role === 'admin' ? 'ADMIRAL' : 'FREE CADET';
    
    document.getElementById('profileModal').style.display = 'block';
}

function logout() {
    if(confirm("Are you sure you want to abandon ship, Captain?")) {
        localStorage.removeItem('viya_token');
        localStorage.removeItem('viya_user');
        currentUser = null;
        window.location.reload();
    }
}

// =================================================================
// 7. UTILITY FUNCTIONS
// =================================================================

function toggleExpand() {
    const chatWindow = document.getElementById('chatWindow');
    if(chatWindow.style.height === '80vh') {
        chatWindow.style.height = '500px';
        chatWindow.style.width = '380px';
    } else {
        chatWindow.style.height = '80vh';
        chatWindow.style.width = '600px';
    }
}

console.log("⚓ VIYA BROKER V17.0 - DOCUMENT GENERATOR ONLINE");
