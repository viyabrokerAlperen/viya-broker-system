// GLOBAL STATE
let currentVoyageData = null; 
let REGS_DB = [], DOCS_DB = [];

// INIT FUNCTIONS
function enterSystem() { 
    document.getElementById('landing-view').style.display = 'none'; 
    document.getElementById('mainNav').style.display = 'flex'; 
    document.getElementById('dashboard').classList.add('active'); 
    map.invalidateSize(); 
}

function switchView(id) { 
    document.querySelectorAll('.view-section').forEach(e => e.classList.remove('active')); 
    document.getElementById(id).classList.add('active'); 
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // Highlight Nav
    if(id==='dashboard') document.querySelectorAll('.nav-item')[0].classList.add('active');
    if(id==='academy') document.querySelectorAll('.nav-item')[1].classList.add('active');
    if(id==='regulations') document.querySelectorAll('.nav-item')[2].classList.add('active');
    if(id==='docs') document.querySelectorAll('.nav-item')[3].classList.add('active');
    if(id==='pricing') document.querySelectorAll('.nav-item')[4].classList.add('active');

    if(id === 'dashboard') setTimeout(() => map.invalidateSize(), 100); 
}

// DATA LOADING
async function init() {
    try {
        const pRes = await fetch('/api/ports'); const ports = await pRes.json();
        const dl = document.getElementById('portList');
        ports.forEach(p => { const o = document.createElement('option'); o.value = p; dl.appendChild(o); });
        const mRes = await fetch('/api/market'); const m = await mRes.json();
        if(m.brent) { 
            document.getElementById('oilPrice').innerText = "$" + m.brent.toFixed(2); 
            document.getElementById('hoPrice').innerText = "$" + m.mgo; 
            document.getElementById('vlsfoPrice').innerText = "$" + m.vlsfo; 
        }
        loadAcademy();
        loadDocs();
        loadRegulations();
    } catch(e) {}
}

function loadAcademy() {
    const aGrid = document.getElementById('academyGrid');
    aGrid.innerHTML = "";
    const ACADEMY_DATA = [
        {icon: "fa-scale-balanced", title: "Laytime & Demurrage", desc: "Calculating time saved/lost. Key concepts: SHINC, SHEX."},
        {icon: "fa-globe", title: "INCOTERMS 2020", desc: "Responsibility transfer points: FOB vs CIF vs CFR."},
        {icon: "fa-file-signature", title: "Bill of Lading", desc: "Functions of B/L: Receipt, Title, Contract of Carriage."},
        {icon: "fa-anchor", title: "General Average", desc: "York-Antwerp Rules and shared loss principles."},
        {icon: "fa-smog", title: "ECA Regulations", desc: "Sulphur caps (0.1% vs 0.5%) and scrubber usage."}
    ];
    ACADEMY_DATA.forEach(item => {
        let html = `<div class="doc-card">
                   <i class="fa-solid ${item.icon} doc-icon" style="color:var(--neon-purple)"></i>
                   <div class="doc-title">${item.title}</div>
                   <div class="doc-desc">${item.desc}</div>
                   <button class="btn-download">READ</button>
                   </div>`;
        aGrid.innerHTML += html;
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
                html += `<div class="doc-card">
                        <i class="fa-solid fa-file-contract doc-icon" style="color:var(--neon-cyan)"></i>
                        <div class="doc-title">${item.title}</div>
                        <div class="doc-desc">${item.desc}</div>
                        <button class="btn-download" onclick="openDoc('${item.id}')">READ</button>
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
                <button class="btn-download" onclick="openReg('${reg.id}')">VIEW STATUTE</button>
                </div>`;
        });
    } catch(e) {}
}

// MODAL LOGIC
function openDoc(id) {
    const doc = DOCS_DB.flatMap(c => c.items).find(i => i.id === id);
    if(doc) showModal(doc.title, doc.content);
}
function openReg(id) {
    const reg = REGS_DB.find(r => r.id === id);
    if(reg) showModal(reg.title + " (" + reg.code + ")", reg.content);
}
function showModal(title, content) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalBody').innerText = content;
    document.getElementById('docModal').style.display = 'block';
}
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function downloadCurrentDoc() { alert("Secure Download Started..."); }
window.onclick = function(event) { if (event.target.classList.contains('modal')) event.target.style.display = 'none'; }

// MAP & CALCULATION LOGIC
const map = L.map('map', {zoomControl: false, attributionControl: false}).setView([30, 0], 2);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 10 }).addTo(map);
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
function updateShipMarker(lat, lng) { if(shipLayer) shipLayer.clearLayers(); L.circleMarker([lat, lng], {radius:7, color:'#f59e0b'}).addTo(shipLayer).bindPopup("VESSEL"); map.setView([lat, lng], 4); }
function updateSpeed() { 
    // Simplified client speed update
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
    document.querySelectorAll('.cargo-item').forEach(x => x.classList.remove('active')); el.classList.add('active');
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

// FINANCIAL MODAL
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
            
            <tr><th colspan="2" class="fin-lbl" style="padding-top:20px; font-size:1rem; border-bottom:2px solid var(--neon-cyan);">2. VOYAGE COSTS</th></tr>
            <tr><td class="fin-lbl"><strong>A. Bunkers</strong></td><td><strong>$${Math.floor(vc.fuel.total).toLocaleString()}</strong></td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Main Engine</td><td>$${Math.floor(vc.fuel.main).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Aux / Lubes</td><td>$${Math.floor(vc.fuel.aux + vc.fuel.lubes).toLocaleString()}</td></tr>
            
            <tr><td class="fin-lbl"><strong>B. Port Charges</strong></td><td><strong>$${Math.floor(vc.port.total).toLocaleString()}</strong></td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Dues & Pilotage</td><td>$${Math.floor(vc.port.dues + vc.port.pilot).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Towage & Agency</td><td>$${Math.floor(vc.port.towage + vc.port.agency).toLocaleString()}</td></tr>

            <tr><td class="fin-lbl"><strong>C. Cargo/Canal/Comm</strong></td><td><strong>$${Math.floor(vc.cargo.total + vc.canal + vc.comm).toLocaleString()}</strong></td></tr>
            
            <tr class="fin-section-total"><td class="fin-lbl">TOTAL VOYAGE COSTS</td><td>$${Math.floor(vc.total).toLocaleString()}</td></tr>

            <tr><th colspan="2" class="fin-lbl" style="padding-top:20px; font-size:1rem; border-bottom:2px solid var(--neon-cyan);">3. OPEX (DAILY)</th></tr>
            <tr><td class="fin-lbl">Total OPEX (${currentVoyageData.totalDays.toFixed(1)} days)</td><td><strong>$${Math.floor(ox.total).toLocaleString()}</strong></td></tr>
            <tr class="fin-sub-row"><td class="fin-lbl">- Crew / Ins / Maint</td><td>$${Math.floor(ox.crew + ox.insurance + ox.maintenance).toLocaleString()}</td></tr>

            <tr><th colspan="2" style="padding-top:30px;"></th></tr>
            <tr class="fin-grand-total"><td class="fin-lbl">NET PROFIT</td><td>$${Math.floor(currentVoyageData.financials.profit).toLocaleString()}</td></tr>
        </table>`;
    document.getElementById('finBody').innerHTML = html;
    document.getElementById('finModal').style.display = 'block';
}

// CHAT
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

// Initialize on Load
init();
