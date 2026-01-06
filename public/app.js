// public/app.js
// VIYA BROKER - PROFESSIONAL INTERFACE (V4.0)

// GLOBAL DEĞİŞKENLER
let currentVoyageData = null; 
let currentLang = 'en';

// Kurumsal Dil Paketi
const TRANSLATIONS = {
    en: { 
        ai_welcome: "Viya Broker Systems Online.", 
        chat_placeholder: "Inquire about market or voyages...",
        btn_read: "VIEW", btn_download: "PDF"
    },
    tr: { 
        ai_welcome: "Viya Broker Sistemleri Çevrimiçi.", 
        chat_placeholder: "Piyasa veya sefer hakkında bilgi alınız...",
        btn_read: "İNCELE", btn_download: "İNDİR"
    }
};

// =================================================================
// 1. BAŞLANGIÇ VE DATA YÜKLEME
// =================================================================

function enterSystem() { 
    const landing = document.getElementById('landing-page');
    const app = document.getElementById('app-container');
    if(landing && app) {
        landing.style.opacity = '0';
        setTimeout(() => {
            landing.style.display = 'none'; 
            app.style.display = 'block';
            if(map) map.invalidateSize(); 
            addChatMessage('ai', TRANSLATIONS[currentLang].ai_welcome);
        }, 800);
    }
}

async function init() {
    console.log("⚓ VIYA SYSTEM INITIALIZING...");
    try {
        loadDashboardRoutes();
        loadAcademy(); loadDocs(); loadRegulations();
        loadMarketData();

        // Liman Listesi
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
    } catch(e) { console.error("Init Error", e); }
}
window.onload = init;

// PİYASA VERİLERİ (MGO EKLENDİ)
async function loadMarketData() {
    try {
        const res = await fetch('/api/market');
        const data = await res.json();
        
        const oilEl = document.getElementById('oilPrice');
        const vlsfoEl = document.getElementById('vlsfoPrice');
        // HTML'de MGO için bir yer yoksa, VLSFO yanına ekleyebilir veya console'a basabiliriz.
        // Mevcut yapıda VLSFO altına ekliyoruz:
        
        if(oilEl) oilEl.innerText = `$${data.brent.toFixed(2)}`;
        if(vlsfoEl) {
            vlsfoEl.innerHTML = `
                <div class="flex flex-col">
                    <span>VLSFO: $${data.vlsfo}</span>
                    <span class="text-xs text-gray-400">MGO: $${data.mgo}</span>
                </div>
            `;
        }
    } catch(e) { console.log("Market Data Error"); }
}

// =================================================================
// 2. DASHBOARD & ROTA LİSTESİ
// =================================================================

async function loadDashboardRoutes() {
    const routeList = document.getElementById('route-list');
    if(!routeList) return; 

    routeList.innerHTML = '<div class="text-center text-cyan-400 p-2 text-xs">Veriler güncelleniyor...</div>';

    try {
        const response = await fetch('/api/routes');
        const routes = await response.json();
        routeList.innerHTML = ''; 

        routes.forEach(route => {
            let distShow = typeof route.dist === 'object' ? route.dist.total : route.dist;
            
            const card = document.createElement('div');
            card.className = 'bg-slate-800/50 border border-slate-700 p-3 rounded mb-2 cursor-pointer hover:border-cyan-400/50 transition-all';
            card.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <div class="text-[10px] text-gray-500 mb-1">${route.date}</div>
                        <div class="text-sm font-bold text-gray-200">
                            ${route.origin} <span class="text-cyan-500">➜</span> ${route.destination}
                        </div>
                        <div class="text-[10px] text-slate-400 mt-1">${route.vessel_name} • ${route.cargo}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-emerald-400 font-mono font-bold text-sm bg-emerald-900/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            $${route.price.toLocaleString()}
                        </div>
                        <div class="text-xs text-gray-500 mt-1 font-mono">${distShow} NM</div>
                    </div>
                </div>
            `;
            routeList.appendChild(card);
        });
    } catch (error) {
        routeList.innerHTML = '<div class="text-red-400 text-xs text-center">Bağlantı yok.</div>';
    }
}

// =================================================================
// 3. ANALİZ MOTORU
// =================================================================

const map = L.map('map', {zoomControl: false}).setView([34, 26], 3); 
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { 
    maxZoom: 10, attribution: 'VIYA MAPS' 
}).addTo(map);

let shipLayer = L.layerGroup().addTo(map);

async function scanMarket() {
    const lat = document.getElementById('vLat').value;
    const lng = document.getElementById('vLng').value;
    
    if(!lat || !lng) { alert("Lütfen gemi pozisyonunu giriniz."); return; }

    updateShipMarker(lat, lng);
    
    const loader = document.getElementById('loader');
    if(loader) loader.style.display = 'grid';

    try {
        const res = await fetch('/api/analyze', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ 
                shipLat: parseFloat(lat), shipLng: parseFloat(lng),
                vType: document.getElementById('vType').value,
                cargoQty: document.getElementById('vQty').value
            }) 
        });
        const data = await res.json();
        
        if(data.success && data.voyages.length > 0) {
            renderResultList(data.voyages);
        } else {
            alert("Kriterlere uygun sefer bulunamadı.");
        }
    } catch(e) { console.error(e); alert("Sistem hatası."); } 
    finally { if(loader) loader.style.display = 'none'; }
}

function updateShipMarker(lat, lng) {
    if(shipLayer) shipLayer.clearLayers();
    L.circleMarker([lat, lng], {
        radius: 6, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 1
    }).addTo(shipLayer).bindPopup("VESSEL POS").openPopup();
    map.setView([lat, lng], 5);
}

function renderResultList(voyages) {
    const list = document.getElementById('cargoResultList'); 
    list.innerHTML = '';
    
    voyages.forEach((v, index) => {
        const el = document.createElement('div'); 
        el.className = 'cargo-item';
        el.onclick = () => showDetails(v, el); 
        
        let profitColor = v.financials.profit > 0 ? 'text-green-400' : 'text-red-400';
        
        el.innerHTML = `
            <div class="ci-top">
                <span class="font-bold text-white text-sm">${v.params.loadPort} ➜ ${v.params.dischPort}</span>
            </div>
            <div class="ci-bot flex justify-between mt-1">
                <span class="text-xs text-gray-400">${v.params.cargo}</span>
                <span class="text-xs font-mono ${profitColor}">$${Math.floor(v.financials.profit/1000)}k</span>
            </div>
        `;
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

    document.getElementById('dispTCE').innerText = `$${Math.floor(v.financials.tce).toLocaleString()}`;
    const pEl = document.getElementById('dispProfit');
    pEl.innerText = `$${Math.floor(v.financials.profit).toLocaleString()}`;
    pEl.style.color = v.financials.profit > 0 ? '#4ade80' : '#f87171';

    // Detaylar
    const distBallast = v.dist?.ballast || 0;
    const distLaden = v.dist?.laden || 0;
    const distTotal = v.dist?.total || (distBallast + distLaden);

    document.getElementById('financialDetails').innerHTML = `
        <div class="detail-row"><span class="d-lbl">Voyage Duration</span> <span class="d-val text-white">${v.duration.total} days</span></div>
        <div class="detail-row"><span class="d-lbl">Sea / Port</span> <span class="d-val text-white">${v.duration.sea} / ${v.duration.port}</span></div>
        <hr class="border-slate-700 my-2">
        <div class="detail-row"><span class="d-lbl text-slate-400">Ballast Leg</span> <span class="d-val text-cyan-400">${distBallast} nm</span></div>
        <div class="detail-row"><span class="d-lbl text-slate-400">Laden Leg</span> <span class="d-val text-emerald-400">${distLaden} nm</span></div>
        <div class="detail-row"><span class="d-lbl font-bold text-white">Total Distance</span> <span class="d-val font-bold text-white">${distTotal} nm</span></div>
    `;

    // AI ANALİZ (UNDEFINED FIX)
    const aiText = v.aiAnalysis ? v.aiAnalysis : '<span class="text-gray-500 italic">Analiz oluşturuluyor...</span>';
    document.getElementById('aiOutput').innerHTML = aiText;

    // HARİTA GÜNCELLEME (SADECE NOKTA)
    shipLayer.clearLayers();
    const shipPos = [document.getElementById('vLat').value, document.getElementById('vLng').value];
    const loadPos = [v.loadGeo.lat, v.loadGeo.lng];
    const dischPos = [v.dischGeo.lat, v.dischGeo.lng];

    L.circleMarker(shipPos, {radius:6, color:'#3b82f6', fillColor:'#3b82f6', fillOpacity:1}).addTo(shipLayer).bindPopup("SHIP").openPopup();
    L.circleMarker(loadPos, {radius:6, color:'#eab308', fillColor:'#eab308', fillOpacity:1}).addTo(shipLayer).bindPopup(`LOAD: ${v.params.loadPort}`);
    L.circleMarker(dischPos, {radius:6, color:'#ef4444', fillColor:'#ef4444', fillOpacity:1}).addTo(shipLayer).bindPopup(`DISCH: ${v.params.dischPort}`);

    const bounds = L.latLngBounds([shipPos, loadPos, dischPos]);
    map.fitBounds(bounds, {padding:[50,50]});
}

// =================================================================
// 4. İÇERİK YÖNETİMİ
// =================================================================

function openContentModal(title, content) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalBody').innerText = content;
    document.getElementById('docModal').style.display = 'block';
}

async function loadDocs() {
    const dContainer = document.getElementById('docsContainer');
    if(!dContainer) return;
    try {
        const res = await fetch('/api/documents');
        const data = await res.json();
        dContainer.innerHTML = "";
        data.forEach(cat => {
            let html = `<div class="category-header">${cat.category}</div><div class="docs-grid">`;
            cat.items.forEach(item => {
                html += `<div class="doc-card">
                        <i class="fa-solid fa-file-contract doc-icon" style="color:var(--neon-cyan)"></i>
                        <div class="doc-title">${item.title}</div>
                        <div class="doc-desc">${item.desc}</div>
                        <button class="btn-download" onclick="openContentModal('${item.title}', '${item.content}')"><i class="fa-solid fa-eye"></i> İNCELE</button>
                        </div>`;
            });
            html += '</div>';
            dContainer.innerHTML += html;
        });
    } catch(e) { dContainer.innerHTML = "Veri yüklenemedi."; }
}

async function loadRegulations() {
    const rGrid = document.getElementById('regsGrid');
    if(!rGrid) return;
    try {
        const res = await fetch('/api/regulations');
        const data = await res.json();
        rGrid.innerHTML = "";
        data.forEach(reg => {
            rGrid.innerHTML += `<div class="doc-card">
                <i class="fa-solid fa-gavel doc-icon" style="color:var(--neon-gold)"></i>
                <div class="doc-title">${reg.code}</div>
                <div class="doc-desc" style="font-weight:bold; color:#fff;">${reg.title}</div>
                <button class="btn-download" onclick="openContentModal('${reg.title}', '${reg.content}')"><i class="fa-solid fa-book"></i> İNCELE</button>
                </div>`;
        });
    } catch(e) {}
}

async function loadAcademy() {
    const aGrid = document.getElementById('academyGrid');
    if(!aGrid) return;
    // Academy statik kalabilir veya API'den çekilebilir
    aGrid.innerHTML = `
        <div class="doc-card">
            <i class="fa-solid fa-graduation-cap doc-icon" style="color:var(--neon-purple)"></i>
            <div class="doc-title">Chartering 101</div>
            <div class="doc-desc">Temel Kavramlar</div>
            <button class="btn-download" onclick="openContentModal('Laytime', 'Laytime is the time allowed...')">OKU</button>
        </div>
    `;
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }
window.onclick = function(e) { if(e.target.classList.contains('modal')) e.target.style.display = 'none'; }

// Chat Fonksiyonu
async function sendChat() {
    const inp = document.getElementById('chatInput');
    const msg = inp.value.trim();
    if(!msg) return;
    
    addChatMessage('user', msg);
    inp.value = ''; 
    const tempId = 'temp-' + Date.now();
    addChatMessage('ai', '<span class="typing-dot">...</span>', tempId);

    try {
        const res = await fetch('/api/chat', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message: msg}) 
        });
        const d = await res.json();
        const tempEl = document.getElementById(tempId);
        if(tempEl) tempEl.remove();
        addChatMessage('ai', d.reply);
    } catch(e) { document.getElementById(tempId).innerText = "Bağlantı hatası."; }
}
function handleEnter(e) { if(e.key==='Enter') sendChat(); }
function addChatMessage(role, html, id=null) {
    const body = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    if(id) div.id = id;
    div.innerHTML = html;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}
