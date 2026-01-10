// public/app.js
// VIYA BROKER - COMMAND INTERFACE (V18.0 - Marketplace + Messaging Added)
// Features: Voyage Calc, Map, Auth, Document Studio, MARKETPLACE, REAL-TIME MESSAGING

// GLOBAL VARIABLES
let currentVoyageData = null; 
let currentLang = 'en';
let currentTemplateType = null;
let currentTemplateKey = null;
let socket = null;
let currentUser = null;
let currentChatUserId = null;
let currentChatVesselId = null;
let uploadedImages = [];

// SOCKET.IO CONNECTION
function initSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        if(currentUser) {
            socket.emit('join_room', currentUser.id);
        }
    });
    
    socket.on('new_message', (data) => {
        console.log('📩 New message received:', data);
        if(currentChatUserId && (data.from === currentChatUserId || data.to === currentChatUserId)) {
            displayMessage(data);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
    });
}

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
            addChatMessage('ai', 'Hello Captain! I am VIYA AI. Systems Online.');
        }, 800);
    }
}

async function init() {
    console.log("⚓ VIYA SYSTEM V18.0 INITIALIZING...");
    try {
        // Socket.io başlat
        initSocket();
        
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
        if(m.brent && oilEl) { 
            oilEl.innerText = "$" + m.brent.toFixed(2); 
        }

        // İçerikleri Yükle
        loadAcademy(); 
        loadDocumentTemplates();
        loadMarketplaceListings();

    } catch(e) {
        console.error("System Init Error:", e);
    }
}
window.onload = init;

function switchView(id) { 
    document.querySelectorAll('.view-section').forEach(e => e.classList.remove('active')); 
    document.getElementById(id).classList.add('active'); 
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    const navMap = {'dashboard':0, 'marketplace':1, 'document-studio':2, 'academy':3};
    if(navMap[id] !== undefined) {
        const items = document.querySelectorAll('.nav-item');
        if(items[navMap[id]]) items[navMap[id]].classList.add('active');
    }
    
    if(id === 'dashboard' && map) setTimeout(() => map.invalidateSize(), 100);
    if(id === 'marketplace') loadMarketplaceListings();
}

// =================================================================
// 2. MAP & VOYAGE ENGINE
// =================================================================

const map = L.map('map', {zoomControl: false}).setView([34, 26], 3); 
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
        }
    } catch(e){}
}

async function scanMarket() {
    const lat = parseFloat(document.getElementById('vLat').value);
    const lng = parseFloat(document.getElementById('vLng').value);
    
    if(isNaN(lat) || isNaN(lng)) { 
        alert("Please enter vessel position!"); 
        return; 
    }

    const loader = document.getElementById('loader');
    if(loader) loader.style.display = 'grid';

    try {
        const res = await fetch('/api/analyze', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({
                shipLat: lat, 
                shipLng: lng, 
                cargoQty: document.getElementById('vQty').value
            }) 
        });
        
        const data = await res.json();
        
        if(data.success && data.voyages.length > 0) {
            renderList(data.voyages);
        } else {
            alert("No profitable voyages found.");
        }

    } catch(e) { 
        console.error(e);
        alert("Connection error."); 
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
                <span style="font-weight:bold; color:white;">${v.params.loadPort} → ${v.params.dischPort}</span>
                <span class="tce-badge">$${Math.floor(v.financials.tce).toLocaleString()}</span>
            </div>
            <div class="ci-bot">
                <span>${v.params.cargo} (${parseInt(v.params.qty/1000)}k)</span>
                <span class="${profitClass}">$${Math.floor(v.financials.profit/1000)}k</span>
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

    document.getElementById('aiOutput').innerHTML = v.aiAnalysis;

    shipLayer.clearLayers();
    
    const shipPos = [document.getElementById('vLat').value, document.getElementById('vLng').value];
    const loadPos = [v.loadGeo?.lat || 0, v.loadGeo?.lng || 0];
    const dischPos = [v.dischGeo?.lat || 0, v.dischGeo?.lng || 0];

    L.circleMarker(shipPos, {radius:8, color:'#3b82f6', fillColor:'#3b82f6', fillOpacity:0.8})
      .addTo(shipLayer).bindPopup("<b>SHIP</b>").openPopup();
    
    L.circleMarker(loadPos, {radius:8, color:'#eab308', fillColor:'#eab308', fillOpacity:0.8})
      .addTo(shipLayer).bindPopup(`<b>LOAD:</b> ${v.params.loadPort}`);
    
    L.circleMarker(dischPos, {radius:8, color:'#ef4444', fillColor:'#ef4444', fillOpacity:0.8})
      .addTo(shipLayer).bindPopup(`<b>DISCH:</b> ${v.params.dischPort}`);

    const bounds = L.latLngBounds([shipPos, loadPos, dischPos]);
    map.fitBounds(bounds, {padding:[50,50]});
}

// =================================================================
// 3. MARKETPLACE (YENİ!)
// =================================================================

async function loadMarketplaceListings() {
    const grid = document.getElementById('marketplaceGrid');
    if(!grid) return;
    
    grid.innerHTML = '<div style="text-align:center; color:#64748b;">Loading vessels...</div>';
    
    try {
        const res = await fetch('/api/marketplace/listings');
        const data = await res.json();
        
        if(!data.success || !data.listings || data.listings.length === 0) {
            grid.innerHTML = '<div style="text-align:center; color:#64748b;">No vessels listed yet.</div>';
            return;
        }
        
        grid.innerHTML = '';
        
        data.listings.forEach(vessel => {
            const card = document.createElement('div');
            card.className = 'doc-card';
            card.style.cursor = 'pointer';
            
            const priceText = vessel.priceType === 'SALE' ? 
                `$${(vessel.price / 1000000).toFixed(2)}M` : 
                `$${vessel.price.toLocaleString()}/day`;
            
            card.innerHTML = `
                <div style="height:150px; background:#0a0a0a; margin:-15px -15px 15px -15px; display:flex; align-items:center; justify-content:center; border-bottom:1px solid #333;">
                    ${vessel.images && vessel.images[0] ? 
                        `<img src="${vessel.images[0]}" style="width:100%; height:100%; object-fit:cover;">` : 
                        '<i class="fa-solid fa-ship" style="font-size:60px; color:#333;"></i>'}
                </div>
                <div class="doc-title">${vessel.vesselName}</div>
                <div class="doc-desc">${vessel.vesselType} | ${vessel.dwt.toLocaleString()} DWT</div>
                <div style="color:#94a3b8; font-size:0.85rem; margin-top:5px;">
                    Built: ${vessel.yearBuilt} | Flag: ${vessel.flag}
                </div>
                <div style="color:var(--neon-gold); font-weight:bold; font-size:1.1rem; margin-top:10px;">
                    ${priceText}
                </div>
                <button class="btn-download" onclick="openVesselDetail('${vessel._id}'); event.stopPropagation();">
                    <i class="fa-solid fa-eye"></i> VIEW DETAILS
                </button>
            `;
            
            grid.appendChild(card);
        });
        
    } catch(e) {
        console.error(e);
        grid.innerHTML = '<div style="text-align:center; color:#ef4444;">Failed to load vessels.</div>';
    }
}

function openCreateListingModal() {
    if(!currentUser) {
        alert('Please login to create a listing.');
        return;
    }
    
    document.getElementById('listVesselName').value = '';
    document.getElementById('listDWT').value = '';
    document.getElementById('listYear').value = '';
    document.getElementById('listFlag').value = '';
    document.getElementById('listPrice').value = '';
    document.getElementById('listDescription').value = '';
    document.getElementById('imagePreview').innerHTML = '';
    uploadedImages = [];
    
    document.getElementById('createListingModal').style.display = 'block';
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
            img.style.width = '100%';
            img.style.height = '100px';
            img.style.objectFit = 'cover';
            img.style.border = '1px solid #333';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

async function submitListing() {
    const token = localStorage.getItem('viya_token');
    if(!token) {
        alert('Please login first.');
        return;
    }
    
    const vesselName = document.getElementById('listVesselName').value;
    const vesselType = document.getElementById('listVesselType').value;
    const dwt = parseInt(document.getElementById('listDWT').value);
    const yearBuilt = parseInt(document.getElementById('listYear').value);
    const flag = document.getElementById('listFlag').value;
    const price = parseFloat(document.getElementById('listPrice').value);
    const description = document.getElementById('listDescription').value;
    
    if(!vesselName || !dwt || !yearBuilt || !flag || !price) {
        alert('Please fill all required fields.');
        return;
    }
    
    const loader = document.getElementById('loader');
    if(loader) loader.style.display = 'grid';
    
    try {
        const res = await fetch('/api/marketplace/create-listing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                vesselName,
                vesselType,
                dwt,
                yearBuilt,
                flag,
                price,
                priceType: 'SALE',
                description,
                images: uploadedImages
            })
        });
        
        const data = await res.json();
        
        if(data.success) {
            alert('Listing created successfully!');
            closeModal('createListingModal');
            loadMarketplaceListings();
        } else {
            alert('Failed: ' + (data.error || 'Unknown error'));
        }
        
    } catch(e) {
        console.error(e);
        alert('Connection error.');
    } finally {
        if(loader) loader.style.display = 'none';
    }
}

async function openVesselDetail(listingId) {
    const loader = document.getElementById('loader');
    if(loader) loader.style.display = 'grid';
    
    try {
        const res = await fetch(`/api/marketplace/listing/${listingId}`);
        const data = await res.json();
        
        if(!data.success) {
            alert('Vessel not found.');
            return;
        }
        
        const vessel = data.listing;
        
        document.getElementById('vesselDetailTitle').innerText = vessel.vesselName;
        
        const priceText = vessel.priceType === 'SALE' ? 
            `Sale Price: $${(vessel.price / 1000000).toFixed(2)}M` : 
            `Charter Rate: $${vessel.price.toLocaleString()}/day`;
        
        let imagesHTML = '';
        if(vessel.images && vessel.images.length > 0) {
            imagesHTML = `<div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:20px;">`;
            vessel.images.forEach(img => {
                imagesHTML += `<img src="${img}" style="width:100%; height:200px; object-fit:cover; border:1px solid #333;">`;
            });
            imagesHTML += `</div>`;
        }
        
        const detailHTML = `
            ${imagesHTML}
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:20px;">
                <div><strong style="color:#94a3b8;">Type:</strong> ${vessel.vesselType}</div>
                <div><strong style="color:#94a3b8;">DWT:</strong> ${vessel.dwt.toLocaleString()} MT</div>
                <div><strong style="color:#94a3b8;">Built:</strong> ${vessel.yearBuilt}</div>
                <div><strong style="color:#94a3b8;">Flag:</strong> ${vessel.flag}</div>
                <div><strong style="color:#94a3b8;">IMO:</strong> ${vessel.imoNumber || 'N/A'}</div>
                <div><strong style="color:#94a3b8;">Views:</strong> ${vessel.views}</div>
            </div>
            <div style="background:#0a0a0a; border:1px solid var(--neon-gold); padding:15px; margin-bottom:20px;">
                <strong style="color:var(--neon-gold);">${priceText}</strong>
            </div>
            <div style="margin-bottom:20px;">
                <strong style="color:#fff;">Description:</strong>
                <p style="color:#94a3b8; margin-top:10px;">${vessel.description || 'No description provided.'}</p>
            </div>
            <div style="background:#0a0a0a; border:1px solid #333; padding:15px;">
                <strong style="color:#fff;">Seller:</strong> ${vessel.sellerName}<br>
                <strong style="color:#fff;">Contact:</strong> ${vessel.sellerEmail}
            </div>
            ${currentUser && currentUser.id !== vessel.seller ? 
                `<button class="btn-action" onclick="openChat('${vessel.seller}', '${vessel.sellerName}', '${vessel._id}')" style="margin-top:20px; width:100%;">
                    <i class="fa-solid fa-comments"></i> CONTACT SELLER
                </button>` : ''}
        `;
        
        document.getElementById('vesselDetailBody').innerHTML = detailHTML;
        document.getElementById('vesselDetailModal').style.display = 'block';
        
    } catch(e) {
        console.error(e);
        alert('Error loading vessel details.');
    } finally {
        if(loader) loader.style.display = 'none';
    }
}

// =================================================================
// 4. MESSAGING SYSTEM (YENİ!)
// =================================================================

async function openChat(userId, userName, vesselId) {
    if(!currentUser) {
        alert('Please login to send messages.');
        return;
    }
    
    currentChatUserId = userId;
    currentChatVesselId = vesselId;
    
    document.getElementById('chatWithName').innerText = `Chat with ${userName}`;
    document.getElementById('messageHistory').innerHTML = '<div style="text-align:center; color:#64748b;">Loading messages...</div>';
    document.getElementById('messagingModal').style.display = 'block';
    
    try {
        const token = localStorage.getItem('viya_token');
        const res = await fetch(`/api/messages/conversation/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await res.json();
        
        const history = document.getElementById('messageHistory');
        history.innerHTML = '';
        
        if(data.success && data.messages.length > 0) {
            data.messages.forEach(msg => {
                displayMessage(msg);
            });
        } else {
            history.innerHTML = '<div style="text-align:center; color:#64748b;">No messages yet. Start the conversation!</div>';
        }
        
        history.scrollTop = history.scrollHeight;
        
    } catch(e) {
        console.error(e);
        document.getElementById('messageHistory').innerHTML = '<div style="text-align:center; color:#ef4444;">Failed to load messages.</div>';
    }
}

function displayMessage(msg) {
    const history = document.getElementById('messageHistory');
    const isOwn = msg.from === currentUser.id;
    
    const msgDiv = document.createElement('div');
    msgDiv.style.marginBottom = '15px';
    msgDiv.style.textAlign = isOwn ? 'right' : 'left';
    
    msgDiv.innerHTML = `
        <div style="display:inline-block; max-width:70%; background:${isOwn ? '#1e3a8a' : '#1a1a1a'}; padding:10px; border-radius:10px; text-align:left;">
            <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:5px;">${isOwn ? 'You' : msg.fromName}</div>
            <div style="color:#fff;">${msg.message}</div>
            <div style="font-size:0.7rem; color:#64748b; margin-top:5px;">${new Date(msg.timestamp).toLocaleTimeString()}</div>
        </div>
    `;
    
    history.appendChild(msgDiv);
    history.scrollTop = history.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if(!message) return;
    
    const token = localStorage.getItem('viya_token');
    if(!token) {
        alert('Please login.');
        return;
    }
    
    try {
        const res = await fetch('/api/messages/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                toUserId: currentChatUserId,
                message: message,
                vesselListingId: currentChatVesselId
            })
        });
        
        const data = await res.json();
        
        if(data.success) {
            displayMessage(data.message);
            input.value = '';
            
            // Socket.io ile gerçek zamanlı gönder
            if(socket) {
                socket.emit('send_message', {
                    toUserId: currentChatUserId,
                    message: message
                });
            }
        } else {
            alert('Failed to send message.');
        }
        
    } catch(e) {
        console.error(e);
        alert('Connection error.');
    }
}

// =================================================================
// PART 1 BİTTİ - PART 2'YE DEVAM EDECEK
// =================================================================
// =================================================================
// PART 2 OF 2 - DOCUMENT STUDIO, AI CHAT, AUTH
// =================================================================

// =================================================================
// 5. DOCUMENT STUDIO
// =================================================================

async function loadDocumentTemplates() {
    try {
        const res = await fetch('/api/document-templates');
        const data = await res.json();
        
        if(!data.success || !data.templates) return;
        
        const weather = data.templates.filter(t => t.category === 'Weather Related');
        
        renderTemplateCards('weatherTemplates', weather);
        
    } catch(e) {
        console.error('Template load error:', e);
    }
}

function renderTemplateCards(containerId, templates) {
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
                <i class="fa-solid fa-wand-magic-sparkles"></i> GENERATE
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
    
    document.getElementById('docGeneratorModal').style.display = 'block';
}

async function generateDocument() {
    const loader = document.getElementById('loader');
    if(loader) loader.style.display = 'grid';
    
    const userInputs = {
        VESSEL_NAME: document.getElementById('genVesselName').value || 'TO BE COMPLETED',
        DATE: new Date().toLocaleDateString('en-GB'),
        CHARTERERS_NAME: 'TO BE COMPLETED BY USER'
    };
    
    try {
        const res = await fetch('/api/generate-document', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
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
// 6. AI CHATBOT
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
        const res = await fetch('/api/chat', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({message: msg}) 
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
// 7. CONTENT LOADERS
// =================================================================

function loadAcademy() {
    const aGrid = document.getElementById('academyGrid');
    if(!aGrid) return;
    aGrid.innerHTML = "";
    
    const ACADEMY_DATA = [
        {icon: "fa-scale-balanced", title: "Laytime Basics", desc: "SHINC vs SHEX explained."},
        {icon: "fa-globe", title: "INCOTERMS 2020", desc: "FOB, CIF, CFR risks."},
        {icon: "fa-ship", title: "Charter Parties", desc: "Gencon 94 vs NYPE."}
    ];

    ACADEMY_DATA.forEach(item => {
        aGrid.innerHTML += `<div class="doc-card">
            <i class="fa-solid ${item.icon} doc-icon" style="color:var(--neon-purple)"></i>
            <div class="doc-title">${item.title}</div>
            <div class="doc-desc">${item.desc}</div>
            <button class="btn-download"><i class="fa-solid fa-book-open"></i> READ</button>
        </div>`;
    });
}

function closeModal(id) { 
    document.getElementById(id).style.display = 'none'; 
}

window.onclick = function(event) { 
    if (event.target.classList.contains('modal')) event.target.style.display = 'none'; 
}

// =================================================================
// 8. AUTHENTICATION & PROFILE
// =================================================================

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
        
        // Socket'e kullanıcıyı kaydet
        if(socket && socket.connected) {
            socket.emit('join_room', currentUser.id);
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
            
            // Socket'e kullanıcıyı kaydet
            if(socket && socket.connected) {
                socket.emit('join_room', currentUser.id);
            }
            
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

    if(!kvkk) { msg.innerText = "Please accept Privacy Policy."; msg.style.color = "#ef4444"; return; }
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
    
    document.getElementById('profileModal').style.display = 'block';
}

function logout() {
    if(confirm("Are you sure you want to abandon ship, Captain?")) {
        localStorage.removeItem('viya_token');
        localStorage.removeItem('viya_user');
        currentUser = null;
        if(socket) socket.disconnect();
        window.location.reload();
    }
}

console.log("⚓ VIYA BROKER V18.0 - MARKETPLACE + MESSAGING ONLINE");
