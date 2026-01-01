// GLOBAL STATE
let currentVoyageData = null; 
let REGS_DB = [], DOCS_DB = [];

// INIT
function enterSystem() { document.getElementById('landing-view').style.display='none'; document.getElementById('mainNav').style.display='flex'; document.getElementById('dashboard').classList.add('active'); map.invalidateSize(); }
function switchView(id) { document.querySelectorAll('.view-section').forEach(e=>e.classList.remove('active')); document.getElementById(id).classList.add('active'); if(id==='dashboard') setTimeout(()=>map.invalidateSize(),100); }

async function init() {
    const pRes = await fetch('/api/ports'); const ports = await pRes.json();
    const dl = document.getElementById('portList');
    ports.forEach(p => { const o = document.createElement('option'); o.value = p; dl.appendChild(o); });
    const mRes = await fetch('/api/market'); const m = await mRes.json();
    if(m.brent) { document.getElementById('oilPrice').innerText="$"+m.brent; document.getElementById('vlsfoPrice').innerText="$"+m.vlsfo; }
    loadData();
}
init();

async function loadData() {
    const rRes = await fetch('/api/regulations'); REGS_DB = await rRes.json();
    const rGrid = document.getElementById('regsGrid');
    REGS_DB.forEach(r => { rGrid.innerHTML += `<div class="doc-card"><div class="doc-title">${r.code}</div><div class="doc-desc">${r.title}</div></div>`; });
    
    const dRes = await fetch('/api/documents'); DOCS_DB = await dRes.json();
    // Doc loading logic same as V101...
}

const map = L.map('map', {zoomControl:false}).setView([30,0],2);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:10}).addTo(map);
let shipLayer = L.layerGroup().addTo(map);

async function fillCoords() {
    const p = document.getElementById('refPort').value.toUpperCase();
    const res = await fetch('/api/port-coords?port='+p);
    const d = await res.json();
    if(d.lat) { document.getElementById('vLat').value=d.lat; document.getElementById('vLng').value=d.lng; }
}

async function scanMarket() {
    const lat = document.getElementById('vLat').value;
    const lng = document.getElementById('vLng').value;
    if(!lat) return alert("Position?");
    document.getElementById('loader').style.display = 'grid';
    
    try {
        const res = await fetch('/api/analyze', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({
                shipLat:lat, shipLng:lng, 
                vType:document.getElementById('vType').value,
                shipSpeed:document.getElementById('vSpeed').value,
                cargoQty:document.getElementById('vQty').value,
                loadRate:document.getElementById('vLoadRate').value,
                dischRate:document.getElementById('vDischRate').value
            })
        });
        const data = await res.json();
        if(data.success) {
            const list = document.getElementById('cargoResultList');
            list.innerHTML = ""; list.style.display = 'block';
            data.voyages.forEach(v => {
                const div = document.createElement('div'); div.className = 'cargo-item';
                div.innerHTML = `<div class="ci-top"><span>${v.loadPort}->${v.dischPort}</span><span>$${Math.floor(v.financials.tce)}</span></div>`;
                div.onclick = () => renderDetail(v);
                list.appendChild(div);
            });
            renderDetail(data.voyages[0]);
        }
    } catch(e) {}
    document.getElementById('loader').style.display = 'none';
}

function renderDetail(v) {
    currentVoyageData = v;
    document.getElementById('emptyState').style.display='none';
    document.getElementById('analysisPanel').style.display='block';
    document.getElementById('dispTCE').innerText = "$"+Math.floor(v.financials.tce);
    document.getElementById('dispProfit').innerText = "$"+Math.floor(v.financials.profit);
    document.getElementById('aiOutput').innerHTML = v.aiAnalysis;
    document.getElementById('financialDetails').innerHTML = 
        `<div class="detail-row"><span class="d-lbl">Total Expenses</span> <span class="d-val neg">-$${Math.floor(v.breakdown.total_expenses).toLocaleString()}</span></div>`;
    
    shipLayer.clearLayers();
    L.circleMarker([v.loadGeo.lat, v.loadGeo.lng], {color:'#10b981'}).addTo(shipLayer);
}

function showFinancials() {
    if(!currentVoyageData) return;
    const b = currentVoyageData.breakdown;
    const vc = b.voyage_costs;
    const ox = b.opex;
    const html = `
        <table class="fin-table">
            <tr><th colspan="2">REVENUE</th></tr>
            <tr><td>Gross Freight</td><td>$${Math.floor(b.revenue).toLocaleString()}</td></tr>
            <tr><th colspan="2">VOYAGE COSTS</th></tr>
            <tr><td>Fuel</td><td>$${Math.floor(vc.fuel.total).toLocaleString()}</td></tr>
            <tr><td>Port</td><td>$${Math.floor(vc.port.total).toLocaleString()}</td></tr>
            <tr><th colspan="2">OPEX</th></tr>
            <tr><td>Total</td><td>$${Math.floor(ox.total).toLocaleString()}</td></tr>
            <tr class="fin-grand-total"><td>NET PROFIT</td><td>$${Math.floor(currentVoyageData.financials.profit).toLocaleString()}</td></tr>
        </table>`;
    document.getElementById('finBody').innerHTML = html;
    document.getElementById('finModal').style.display = 'block';
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function toggleChat() { document.getElementById('chatWindow').style.display = document.getElementById('chatWindow').style.display==='flex'?'none':'flex'; }
function toggleExpand() { document.getElementById('chatWindow').classList.toggle('expanded'); }
async function sendChat() { /* Chat logic */ }
