// public/app.js
// VIYA BROKER - COMMAND INTERFACE (V2.7 "ADMIRAL PATCHED")

// GLOBAL DEĞİŞKENLER
let currentVoyageData = null; 
let REGS_DB = [], DOCS_DB = [];
let currentLang = 'en';
let mapRouteLayer = null; // Rota çizgisi için katman

// Dil İsimleri (AI Chat İçin)
const LANG_NAMES = {
    en: "English", tr: "Turkish", de: "German", it: "Italian", 
    fr: "French", es: "Spanish", gr: "Greek"
};

// [FULL LOCALIZATION PACK - 7 LANGUAGES]
const TRANSLATIONS = {
    en: {
        landing_title: "NEXT GEN MARITIME INTELLIGENCE", landing_sub: "Advanced Voyage Estimation & Legal AI.",
        btn_login: "LOG IN", btn_enter_term: "ENTER TERMINAL", btn_learn_more: "LEARN MORE", btn_register: "BECOME MEMBER",
        nav_term: "Terminal", nav_kb: "Academy", nav_reg: "Regulations", nav_docs: "Docs", nav_mem: "Membership",
        menu_home: "Home", menu_about: "About Us", menu_mission: "Mission", menu_contact: "Contact",
        lbl_vessel: "VESSEL CLASS", lbl_port: "POSITION", lbl_speed: "SPEED", lbl_qty: "CARGO", lbl_lrate: "LOAD RATE", lbl_drate: "DISCH RATE",
        btn_scan: "CALCULATE VOYAGE", panel_params: "PARAMETERS", panel_estim: "ESTIMATION",
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
        btn_read: "READ", btn_download: "DOWNLOAD", btn_view: "DETAILS"
    },
    tr: {
        landing_title: "YENİ NESİL DENİZCİLİK ZEKASI", landing_sub: "İleri Sefer Tahmini & Hukuki AI.",
        btn_login: "GİRİŞ", btn_enter_term: "TERMİNALE GİR", btn_learn_more: "DAHA FAZLA", btn_register: "ÜYE OL",
        nav_term: "Terminal", nav_kb: "Akademi", nav_reg: "Mevzuat", nav_docs: "Evraklar", nav_mem: "Üyelik",
        menu_home: "Anasayfa", menu_about: "Hakkımızda", menu_mission: "Misyon", menu_contact: "İletişim",
        lbl_vessel: "GEMİ TİPİ", lbl_port: "KONUM", lbl_speed: "HIZ", lbl_qty: "YÜK", lbl_lrate: "YÜKLEME HIZI", lbl_drate: "TAHLİYE HIZI",
        btn_scan: "SEFER HESAPLA", panel_params: "PARAMETRELER", panel_estim: "TAHMİN",
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
        btn_read: "OKU", btn_download: "İNDİR", btn_view: "DETAYLAR"
    },
};

// =================================================================
// 1. SYSTEM INITIALIZATION (Matrix Style)
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
            // Gizli Efekt: Girişte Kaptan'a selam çak
            const welcomeMsg = TRANSLATIONS[currentLang]?.ai_welcome || "System Online";
            addChatMessage('ai', welcomeMsg);
        }, 800);
    }
}

async function init() {
    console.log("⚓ VIYA SYSTEM INITIALIZING...");
    try {
        // [YENİ EKLENDİ] Dashboard Rotalarını Yükle (Undefined Hatasını Çözen Yer)
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
        
        // Market Verisini Yükle (Simülasyon veya Gerçek)
        const mRes = await fetch('/api/market'); 
        const m = await mRes.json();
        
        const oilEl = document.getElementById('oilPrice');
        const vlsfoEl = document.getElementById('vlsfoPrice');
        
        if(m.brent) { 
            if(oilEl) {
                oilEl.innerText = "$" + m.brent.toFixed(2); 
                // Eğer veri simülasyonsa belli et
                if(m.source === 'SIMULATED') {
                    oilEl.style.color = '#f59e0b';
                    oilEl.title = "Simulated Data";
                }
            }
            if(vlsfoEl) vlsfoEl.innerText = "$" + m.vlsfo; 
        } else {
            if(oilEl) oilEl.innerText = "N/A"; 
            if(vlsfoEl) vlsfoEl.innerText = "N/A"; 
        }

        // İçerikleri Yükle
        loadAcademy(); loadDocs(); loadRegulations();

    } catch(e) {
        console.error("System Init Error:", e);
    }
}
window.onload = init;

// --- [YENİ FONKSİYON] DASHBOARD ROTALARINI ÇEKME ---
async function loadDashboardRoutes() {
    // HTML'de bu ID'ye sahip bir liste olmalı (genelde sağ panelde veya ana ekranda)
    const routeList = document.getElementById('route-list');
    if(!routeList) return; // Eğer HTML'de yoksa hata verme, sessizce çık

    routeList.innerHTML = '<div class="text-center text-cyan-400 p-2 text-xs">Veriler taranıyor...</div>';

    try {
        const response = await fetch('/api/routes');
        if(!response.ok) throw new Error('API Hatası');
        
        const routes = await response.json();
        routeList.innerHTML = ''; // Temizle

        routes.forEach(route => {
            // BURASI ÖNEMLİ: Server'dan gelen 'origin', 'destination', 'distance' anahtarlarını kullanıyoruz.
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
        console.log("Rota yükleme hatası:", error);
        routeList.innerHTML = '<div class="text-red-400 text-xs text-center">Bağlantı yok.</div>';
    }
}

function switchView(id) { 
    document.querySelectorAll('.view-section').forEach(e => e.classList.remove('active')); 
    document.getElementById(id).classList.add('active'); 
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // Basit Navigasyon Eşleşmesi
    const navMap = {'dashboard':0, 'academy':1, 'regulations':2, 'docs':3, 'pricing':4};
    if(navMap[id] !== undefined) {
        const items = document.querySelectorAll('.nav-item');
        if(items[navMap[id]]) items[navMap[id]].classList.add('active');
    }

    if(id === 'dashboard' && map) setTimeout(() => map.invalidateSize(), 100); 
}

function changeLanguage(lang) {
    currentLang = lang;
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    
    // Statik Metinleri Güncelle
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        if(t[k]) el.innerText = t[k];
    });

    // Placeholder Güncelle
    const chatInput = document.getElementById('chatInput');
    if(chatInput) chatInput.placeholder = t.chat_placeholder || "...";

    // İçerikleri Yenile
    loadAcademy(); loadDocs(); loadRegulations();
    
    // Eğer Finansal Tablo açıksa yenile
    if(currentVoyageData && document.getElementById('finModal').style.display === 'block') {
        showFinancials();
    }
}

// =================================================================
// 2. MAP & VOYAGE ENGINE (The Brain)
// =================================================================

const map = L.map('map', {zoomControl: false}).setView([34, 26], 3); // Akdeniz odaklı başla
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { 
    maxZoom: 10, 
    attribution: 'VIYA MAPS' 
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
    // Gemi ikonu yerine havalı bir daire
    L.circleMarker([lat, lng], {
        radius: 8, 
        color: '#0ea5e9', // Sky Blue
        fillColor: '#0ea5e9',
        fillOpacity: 0.8, 
        weight: 2
    }).addTo(shipLayer).bindPopup("VESSEL POS"); 
    
    map.setView([lat, lng], 5); 
}

// --- ANA HESAPLAMA FONKSİYONU ---
async function scanMarket() {
    const lat = parseFloat(document.getElementById('vLat').value);
    const lng = parseFloat(document.getElementById('vLng').value);
    
    if(isNaN(lat) || isNaN(lng)) { 
        alert("Reis, geminin konumunu girmeden rota çizemem!"); 
        return; 
    }

    updateShipMarker(lat, lng);
    
    // Loader'ı Göster
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
        
        // Kârlılığa göre renk ver
        let profitClass = 'text-gray-400';
        if(v.financials.profit > 0) profitClass = 'text-green-400';
        else profitClass = 'text-red-400';

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
        
        // İlk seferi otomatik seç
        if(index === 0) showDetails(v, el);
    });
}

function showDetails(v, el) {
    currentVoyageData = v; 
    document.querySelectorAll('.cargo-item').forEach(x => x.classList.remove('active')); 
    if(el) el.classList.add('active');
    
    // Paneli Aç
    document.getElementById('emptyState').style.display = 'none'; 
    document.getElementById('analysisPanel').style.display = 'block';
    
    // Değerleri Yaz
    document.getElementById('dispTCE').innerText = "$" + Math.floor(v.financials.tce).toLocaleString();
    
    const profitEl = document.getElementById('dispProfit');
    profitEl.innerText = "$" + Math.floor(v.financials.profit).toLocaleString();
    profitEl.style.color = v.financials.profit > 0 ? '#4ade80' : '#f87171';

    // Detay Satırları
    document.getElementById('financialDetails').innerHTML = `
        <div class="detail-row"><span class="d-lbl">Sea/Port Days</span> <span class="d-val">${v.duration.sea} / ${v.duration.port}</span></div>
        <div class="detail-row"><span class="d-lbl">Total Duration</span> <span class="d-val">${v.duration.total} days</span></div>
        <div class="detail-row"><span class="d-lbl">Break-Even</span> <span class="d-val">$${v.financials.breakEvenRate.toFixed(2)} / ton</span></div>
    `;

    // AI Yorumunu Bas (Backend'den HTML geliyor)
    document.getElementById('aiOutput').innerHTML = v.aiAnalysis;

    // --- HARİTA GÜNCELLEME (GİZLİ YETENEK: ROTA ÇİZİMİ) ---
    shipLayer.clearLayers();
    if(mapRouteLayer) map.removeLayer(mapRouteLayer); // Eski çizgiyi sil

    const shipPos = [document.getElementById('vLat').value, document.getElementById('vLng').value];
    const loadPos = [v.loadGeo?.lat || 0, v.loadGeo?.lng || 0];
    const dischPos = [v.dischGeo?.lat || 0, v.dischGeo?.lng || 0];

    const routePoints = [shipPos, loadPos, dischPos];
    
    mapRouteLayer = L.polyline(routePoints, {
        color: '#10b981', // Emerald
        weight: 3,
        opacity: 0.7,
        dashArray: '5, 10' // Kesikli çizgi
    }).addTo(map);

    // Noktalar
    L.circleMarker(shipPos, {radius:6, color:'#3b82f6', fillOpacity:1}).addTo(shipLayer).bindPopup("SHIP");
    L.circleMarker(loadPos, {radius:6, color:'#eab308', fillOpacity:1}).addTo(shipLayer).bindPopup("LOAD: " + v.params.loadPort);
    L.circleMarker(dischPos, {radius:6, color:'#ef4444', fillOpacity:1}).addTo(shipLayer).bindPopup("DISCH: " + v.params.dischPort);

    // Haritayı Sığdır
    const bounds = L.latLngBounds(routePoints);
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
            <tr class="fin-sub-row"><td>- ${t.fin_canal}</td><td>-$${Math.floor(vc.cargo_canal.canal).toLocaleString()}</td></tr>

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
// 3. AI CHATBOT (Typewriter Effect)
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
    
    // Geçici "Yazıyor..." mesajı
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
        
        // Geçici mesajı sil ve gerçeğini yazdır (Typewriter efektiyle)
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

// Gizli Yetenek: Daktilo Efekti
function typeWriterEffect(text) {
    const body = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = 'msg ai';
    body.appendChild(div);
    
    let i = 0;
    const speed = 15; // ms
    
    function type() {
        if (i < text.length) {
            // HTML taglerini atla
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
// 4. CONTENT LOADERS (Standard)
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
        {icon: "fa-scale-balanced", title: "Laytime & Demurrage", desc: "SHINC/SHEX...", content: "Full explanation of Laytime..."},
        {icon: "fa-globe", title: "INCOTERMS 2020", desc: "FOB, CIF, CFR...", content: "Full explanation of Incoterms..."}
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
    try {
        if(DOCS_DB.length === 0) { const res = await fetch('/api/documents'); DOCS_DB = await res.json(); }
        dContainer.innerHTML = "";
        DOCS_DB.forEach(cat => {
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
            let contentSafe = reg.content ? reg.content.replace(/'/g, "\\'").replace(/\n/g, "\\n") : "...";
            rGrid.innerHTML += `<div class="doc-card">
                <i class="fa-solid fa-gavel doc-icon" style="color:var(--neon-gold)"></i>
                <div class="doc-title">${reg.code}</div>
                <div class="doc-desc" style="font-weight:bold; color:#fff;">${reg.title}</div>
                <div class="doc-desc">${reg.summary}</div>
                <button class="btn-download" onclick="openContentModal('${reg.title}', '${contentSafe}')"><i class="fa-solid fa-book"></i> ${t.btn_view}</button>
                </div>`;
        });
    } catch(e) {}
}

// UTILS
function downloadFile(filename, content) {
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename + ".txt"; 
    document.body.appendChild(element);
    element.click();
}
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
window.onclick = function(event) { if (event.target.classList.contains('modal')) event.target.style.display = 'none'; }
