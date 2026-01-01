// GLOBAL
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

// [FULL LOCALIZATION PACK - 7 LANGUAGES]
const TRANSLATIONS = {
    en: {
        // UI
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
        fin_port: "B. Port Charges", fin_dues: "Dues", fin_pilot: "Pilotage", fin_tow: "Towage", fin_lines: "Lines", fin_berth: "Berth Hire", fin_agency: "Agency",
        fin_cargo: "C. Cargo/Canal", fin_dunnage: "Dunnage", fin_clean: "Cleaning", fin_canal: "Canal Transit", fin_comm: "Commission",
        fin_opex: "OPEX", fin_crew: "Crew", fin_maint: "Maintenance", fin_ins: "Insurance", fin_store: "Stores", fin_admin: "Admin",
        fin_total_opex: "TOTAL OPEX", fin_profit: "NET PROFIT",
        sec_kb: "KNOWLEDGE BASE", sec_reg: "REGULATIONS", sec_doc: "DOCUMENT CENTER",
        ai_welcome: "Hello Captain! I am VIYA AI. Ready to assist.", chat_placeholder: "Type your question...",
        footer_rights: "© 2026 VIYA BROKER. All Rights Reserved.",
        btn_read: "READ", btn_download: "DOWNLOAD", btn_view: "DETAILS",
        plan_basic: "CADET", plan_pro: "BROKER PRO", plan_prem: "FLEET OWNER",
        plan_basic_btn: "CURRENT", plan_pro_btn: "UPGRADE", plan_prem_btn: "CONTACT",
        feat_unl: "Unlimited Scans", feat_live: "Live Market Data", feat_api: "API Access"
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
        fin_port: "B. Liman Giderleri", fin_dues: "Rüsumlar", fin_pilot: "Kılavuz", fin_tow: "Römorkör", fin_lines: "Palamar", fin_berth: "İşgaliye", fin_agency: "Acente",
        fin_cargo: "C. Yük & Kanal", fin_dunnage: "Dunnage", fin_clean: "Temizlik", fin_canal: "Kanal", fin_comm: "Komisyon",
        fin_opex: "İŞLETME (OPEX)", fin_crew: "Personel", fin_maint: "Bakım", fin_ins: "Sigorta", fin_store: "Malzeme", fin_admin: "Yönetim",
        fin_total_opex: "TOPLAM OPEX", fin_profit: "NET KÂR",
        sec_kb: "BİLGİ BANKASI", sec_reg: "YÖNETMELİKLER", sec_doc: "DOKÜMAN MERKEZİ",
        ai_welcome: "Merhaba Kaptan! Ben VIYA AI. Yardıma hazırım.", chat_placeholder: "Sorunuzu yazın...",
        footer_rights: "© 2026 VIYA BROKER. Tüm Hakları Saklıdır.",
        btn_read: "OKU", btn_download: "İNDİR", btn_view: "DETAYLAR",
        plan_basic: "STAJYER", plan_pro: "BROKER PRO", plan_prem: "FİLO SAHİBİ",
        plan_basic_btn: "MEVCUT", plan_pro_btn: "YÜKSELT", plan_prem_btn: "İLETİŞİM",
        feat_unl: "Sınırsız Tarama", feat_live: "Canlı Piyasa", feat_api: "API Erişimi"
    },
    de: {
        landing_title: "MARITIME INTELLIGENZ", landing_sub: "Erweiterte Reiseschätzung & Legal AI.",
        btn_login: "ANMELDEN", btn_enter_term: "TERMINAL STARTEN", btn_learn_more: "MEHR ERFAHREN", btn_register: "REGISTRIEREN",
        nav_term: "Terminal", nav_kb: "Akademie", nav_reg: "Vorschriften", nav_docs: "Dokumente", nav_mem: "Mitgliedschaft",
        menu_home: "Startseite", menu_about: "Über Uns", menu_mission: "Mission", menu_contact: "Kontakt",
        lbl_vessel: "SCHIFFSTYP", lbl_port: "POSITION", lbl_speed: "GESCHWINDIGKEIT", lbl_qty: "LADUNG", lbl_lrate: "LADERATE", lbl_drate: "LÖSCHRATE",
        btn_scan: "BERECHNEN", panel_params: "PARAMETER", panel_estim: "SCHÄTZUNG",
        stat_profit: "Reingewinn", btn_breakdown: "DETAILS ANZEIGEN", empty_state: "Warten auf Eingabe...",
        modal_fin_title: "FINANZÜBERSICHT",
        fin_rev: "EINNAHMEN", fin_freight: "Bruttofracht", fin_net: "NETTOEINNAHMEN",
        fin_voy: "REISEKOSTEN", fin_bunkers: "A. Treibstoff", fin_main: "Hauptmaschine", fin_aux: "Hilfsmaschine", fin_lubes: "Schmierstoffe",
        fin_port: "B. Hafengebühren", fin_dues: "Gebühren", fin_pilot: "Lotse", fin_tow: "Schlepper", fin_lines: "Festmacher", fin_berth: "Liegeplatz", fin_agency: "Agentur",
        fin_cargo: "C. Ladung/Kanal", fin_dunnage: "Stauholz", fin_clean: "Reinigung", fin_canal: "Kanal", fin_comm: "Kommission",
        fin_opex: "BETRIEBSKOSTEN", fin_crew: "Besatzung", fin_maint: "Wartung", fin_ins: "Versicherung", fin_store: "Vorräte", fin_admin: "Verwaltung",
        fin_total_opex: "GESAMT OPEX", fin_profit: "NETTOGEWINN",
        sec_kb: "WISSENSDATENBANK", sec_reg: "VORSCHRIFTEN", sec_doc: "DOKUMENTENZENTRUM",
        ai_welcome: "Hallo Kapitän! Ich bin VIYA AI. Bereit zu helfen.", chat_placeholder: "Frage eingeben...",
        footer_rights: "© 2026 VIYA BROKER. Alle Rechte vorbehalten.",
        btn_read: "LESEN", btn_download: "HERUNTERLADEN", btn_view: "DETAILS",
        plan_basic: "KADETT", plan_pro: "MAKLER PRO", plan_prem: "REEDER",
        plan_basic_btn: "AKTUELL", plan_pro_btn: "UPGRADE", plan_prem_btn: "KONTAKT",
        feat_unl: "Unbegrenzte Scans", feat_live: "Live-Marktdaten", feat_api: "API-Zugriff"
    },
    it: {
        landing_title: "INTELLIGENZA MARITTIMA", landing_sub: "Stima Avanzata del Viaggio e AI Legale.",
        btn_login: "ACCEDI", btn_enter_term: "ENTRA NEL TERMINAL", btn_learn_more: "SCOPRI DI PIÙ", btn_register: "REGISTRATI",
        nav_term: "Terminale", nav_kb: "Accademia", nav_reg: "Regolamenti", nav_docs: "Documenti", nav_mem: "Abbonamento",
        menu_home: "Home", menu_about: "Chi Siamo", menu_mission: "Missione", menu_contact: "Contatto",
        lbl_vessel: "CLASSE NAVE", lbl_port: "POSIZIONE", lbl_speed: "VELOCITÀ", lbl_qty: "CARICO", lbl_lrate: "RATA CARICO", lbl_drate: "RATA SCARICO",
        btn_scan: "CALCOLA VIAGGIO", panel_params: "PARAMETRI", panel_estim: "STIMA",
        stat_profit: "Utile Netto", btn_breakdown: "VEDI DETTAGLI", empty_state: "In attesa di dati...",
        modal_fin_title: "DETTAGLIO FINANZIARIO",
        fin_rev: "ENTRATE", fin_freight: "Nolo Lordo", fin_net: "ENTRATE NETTE",
        fin_voy: "COSTI DI VIAGGIO", fin_bunkers: "A. Carburante", fin_main: "Motore Principale", fin_aux: "Generatore", fin_lubes: "Lubrificanti",
        fin_port: "B. Tasse Portuali", fin_dues: "Diritti", fin_pilot: "Pilota", fin_tow: "Rimorchiatori", fin_lines: "Ormeggiatori", fin_berth: "Banchina", fin_agency: "Agenzia",
        fin_cargo: "C. Carico/Canale", fin_dunnage: "Pagliolato", fin_clean: "Pulizia", fin_canal: "Canale", fin_comm: "Commissione",
        fin_opex: "COSTI OPERATIVI", fin_crew: "Equipaggio", fin_maint: "Manutenzione", fin_ins: "Assicurazione", fin_store: "Provviste", fin_admin: "Amm.",
        fin_total_opex: "TOTALE OPEX", fin_profit: "UTILE NETTO",
        sec_kb: "BASE DI CONOSCENZA", sec_reg: "REGOLAMENTI", sec_doc: "CENTRO DOCUMENTI",
        ai_welcome: "Ciao Capitano! Sono VIYA AI. Pronto ad assistere.", chat_placeholder: "Scrivi la tua domanda...",
        footer_rights: "© 2026 VIYA BROKER. Tutti i diritti riservati.",
        btn_read: "LEGGERE", btn_download: "SCARICARE", btn_view: "DETTAGLI",
        plan_basic: "CADETTO", plan_pro: "BROKER PRO", plan_prem: "ARMATORE",
        plan_basic_btn: "ATTUALE", plan_pro_btn: "AGGIORNA", plan_prem_btn: "CONTATTO",
        feat_unl: "Scansioni Illimitate", feat_live: "Dati Mercato Live", feat_api: "Accesso API"
    },
    fr: {
        landing_title: "INTELLIGENCE MARITIME", landing_sub: "Estimation Avancée et IA Juridique.",
        btn_login: "CONNEXION", btn_enter_term: "ENTRER AU TERMINAL", btn_learn_more: "EN SAVOIR PLUS", btn_register: "S'INSCRIRE",
        nav_term: "Terminal", nav_kb: "Académie", nav_reg: "Règlements", nav_docs: "Docs", nav_mem: "Abonnement",
        menu_home: "Accueil", menu_about: "À Propos", menu_mission: "Mission", menu_contact: "Contact",
        lbl_vessel: "TYPE DE NAVIRE", lbl_port: "POSITION", lbl_speed: "VITESSE", lbl_qty: "CARGAISON", lbl_lrate: "CADENCE CHARG.", lbl_drate: "CADENCE DÉCH.",
        btn_scan: "CALCULER VOYAGE", panel_params: "PARAMÈTRES", panel_estim: "ESTIMATION",
        stat_profit: "Bénéfice Net", btn_breakdown: "VOIR DÉTAILS", empty_state: "En attente...",
        modal_fin_title: "DÉTAILS FINANCIERS",
        fin_rev: "REVENUS", fin_freight: "Fret Brut", fin_net: "REVENUS NETS",
        fin_voy: "FRAIS DE VOYAGE", fin_bunkers: "A. Soutes", fin_main: "Moteur Principal", fin_aux: "Générateur", fin_lubes: "Lubrifiants",
        fin_port: "B. Frais Portuaires", fin_dues: "Droits", fin_pilot: "Pilotage", fin_tow: "Remorquage", fin_lines: "Lamanage", fin_berth: "Quai", fin_agency: "Agence",
        fin_cargo: "C. Cargaison/Canal", fin_dunnage: "Fardage", fin_clean: "Nettoyage", fin_canal: "Canal", fin_comm: "Commission",
        fin_opex: "FRAIS D'EXPLOITATION", fin_crew: "Équipage", fin_maint: "Maintenance", fin_ins: "Assurance", fin_store: "Vivres", fin_admin: "Admin",
        fin_total_opex: "TOTAL OPEX", fin_profit: "BÉNÉFICE NET",
        sec_kb: "BASE DE CONNAISSANCES", sec_reg: "RÈGLEMENTS", sec_doc: "CENTRE DOCUMENTAIRE",
        ai_welcome: "Bonjour Capitaine! Je suis VIYA AI. Prêt à aider.", chat_placeholder: "Posez votre question...",
        footer_rights: "© 2026 VIYA BROKER. Tous droits réservés.",
        btn_read: "LIRE", btn_download: "TÉLÉCHARGER", btn_view: "DÉTAILS",
        plan_basic: "CADET", plan_pro: "COURTIER PRO", plan_prem: "ARMATEUR",
        plan_basic_btn: "ACTUEL", plan_pro_btn: "METTRE À NIVEAU", plan_prem_btn: "CONTACT",
        feat_unl: "Scans Illimités", feat_live: "Marché en Direct", feat_api: "Accès API"
    },
    es: {
        landing_title: "INTELIGENCIA MARÍTIMA", landing_sub: "Estimación Avanzada y IA Legal.",
        btn_login: "INICIAR SESIÓN", btn_enter_term: "ENTRAR AL TERMINAL", btn_learn_more: "SABER MÁS", btn_register: "REGISTRARSE",
        nav_term: "Terminal", nav_kb: "Academia", nav_reg: "Regulaciones", nav_docs: "Docs", nav_mem: "Membresía",
        menu_home: "Inicio", menu_about: "Nosotros", menu_mission: "Misión", menu_contact: "Contacto",
        lbl_vessel: "TIPO DE BUQUE", lbl_port: "POSICIÓN", lbl_speed: "VELOCIDAD", lbl_qty: "CARGA", lbl_lrate: "RITMO CARGA", lbl_drate: "RITMO DESCARGA",
        btn_scan: "CALCULAR VIAJE", panel_params: "PARÁMETROS", panel_estim: "ESTIMACIÓN",
        stat_profit: "Beneficio Neto", btn_breakdown: "VER DETALLES", empty_state: "Esperando datos...",
        modal_fin_title: "DESGLOSE FINANCIERO",
        fin_rev: "INGRESOS", fin_freight: "Flete Bruto", fin_net: "INGRESOS NETOS",
        fin_voy: "GASTOS DE VIAJE", fin_bunkers: "A. Combustible", fin_main: "Motor Principal", fin_aux: "Generador", fin_lubes: "Lubricantes",
        fin_port: "B. Gastos Portuarios", fin_dues: "Tasas", fin_pilot: "Practicaje", fin_tow: "Remolque", fin_lines: "Amarre", fin_berth: "Muelle", fin_agency: "Agencia",
        fin_cargo: "C. Carga/Canal", fin_dunnage: "Trincaje", fin_clean: "Limpieza", fin_canal: "Canal", fin_comm: "Comisión",
        fin_opex: "GASTOS OPERATIVOS", fin_crew: "Tripulación", fin_maint: "Mantenimiento", fin_ins: "Seguro", fin_store: "Provisiones", fin_admin: "Admin",
        fin_total_opex: "TOTAL OPEX", fin_profit: "BENEFICIO NETO",
        sec_kb: "BASE DE CONOCIMIENTOS", sec_reg: "REGULACIONES", sec_doc: "CENTRO DE DOCUMENTOS",
        ai_welcome: "¡Hola Capitán! Soy VIYA AI. Listo para ayudar.", chat_placeholder: "Escriba su pregunta...",
        footer_rights: "© 2026 VIYA BROKER. Todos los derechos reservados.",
        btn_read: "LEER", btn_download: "DESCARGAR", btn_view: "DETALLES",
        plan_basic: "CADETE", plan_pro: "BROKER PRO", plan_prem: "ARMADOR",
        plan_basic_btn: "ACTUAL", plan_pro_btn: "MEJORAR", plan_prem_btn: "CONTACTO",
        feat_unl: "Escaneos Ilimitados", feat_live: "Mercado en Vivo", feat_api: "Acceso API"
    },
    gr: {
        landing_title: "ΝΑΥΤΙΛΙΑΚΗ ΝΟΗΜΟΣΥΝΗ", landing_sub: "Προηγμένη Εκτίμηση Ταξιδιού & Νομική AI.",
        btn_login: "ΕΙΣΟΔΟΣ", btn_enter_term: "ΕΙΣΟΔΟΣ ΣΤΟ ΤΕΡΜΑΤΙΚΟ", btn_learn_more: "ΜΑΘΕΤΕ ΠΕΡΙΣΣΟΤΕΡΑ", btn_register: "ΕΓΓΡΑΦΗ",
        nav_term: "Τερματικό", nav_kb: "Ακαδημία", nav_reg: "Κανονισμοί", nav_docs: "Έγγραφα", nav_mem: "Συνδρομή",
        menu_home: "Αρχική", menu_about: "Σχετικά", menu_mission: "Αποστολή", menu_contact: "Επικοινωνία",
        lbl_vessel: "ΤΥΠΟΣ ΠΛΟΙΟΥ", lbl_port: "ΘΕΣΗ", lbl_speed: "ΤΑΧΥΤΗΤΑ", lbl_qty: "ΦΟΡΤΙΟ", lbl_lrate: "ΡΥΘΜΟΣ ΦΟΡΤ.", lbl_drate: "ΡΥΘΜΟΣ ΕΚΦ.",
        btn_scan: "ΥΠΟΛΟΓΙΣΜΟΣ", panel_params: "ΠΑΡΑΜΕΤΡΟΙ", panel_estim: "ΕΚΤΙΜΗΣΗ",
        stat_profit: "Καθαρό Κέρδος", btn_breakdown: "ΛΕΠΤΟΜΕΡΕΙΕΣ", empty_state: "Αναμονή...",
        modal_fin_title: "ΟΙΚΟΝΟΜΙΚΗ ΑΝΑΛΥΣΗ",
        fin_rev: "ΕΣΟΔΑ", fin_freight: "Μικτός Ναύλος", fin_net: "ΚΑΘΑΡΑ ΕΣΟΔΑ",
        fin_voy: "ΕΞΟΔΑ ΤΑΞΙΔΙΟΥ", fin_bunkers: "Α. Καύσιμα", fin_main: "Κύρια Μηχανή", fin_aux: "Ηλεκτρομηχανή", fin_lubes: "Λιπαντικά",
        fin_port: "Β. Λιμενικά Έξοδα", fin_dues: "Τέλη", fin_pilot: "Πλοήγηση", fin_tow: "Ρυμούλκηση", fin_lines: "Κάβοι", fin_berth: "Παραβολή", fin_agency: "Πρακτόρευση",
        fin_cargo: "Γ. Φορτίο/Διώρυγα", fin_dunnage: "Υλικά", fin_clean: "Καθαρισμός", fin_canal: "Διώρυγα", fin_comm: "Προμήθεια",
        fin_opex: "ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ", fin_crew: "Πλήρωμα", fin_maint: "Συντήρηση", fin_ins: "Ασφάλιση", fin_store: "Εφόδια", fin_admin: "Διοίκηση",
        fin_total_opex: "ΣΥΝΟΛΟ OPEX", fin_profit: "ΚΑΘΑΡΟ ΚΕΡΔΟΣ",
        sec_kb: "ΒΑΣΗ ΓΝΩΣΕΩΝ", sec_reg: "ΚΑΝΟΝΙΣΜΟΙ", sec_doc: "ΚΕΝΤΡΟ ΕΓΓΡΑΦΩΝ",
        ai_welcome: "Γεια σου Καπετάνιε! Είμαι η VIYA AI.", chat_placeholder: "Πληκτρολογήστε την ερώτησή σας...",
        footer_rights: "© 2026 VIYA BROKER. Με επιφύλαξη παντός δικαιώματος.",
        btn_read: "ΑΝΑΓΝΩΣΗ", btn_download: "ΛΗΨΗ", btn_view: "ΛΕΠΤΟΜΕΡΕΙΕΣ",
        plan_basic: "ΔΟΚΙΜΟΣ", plan_pro: "ΜΕΣΙΤΗΣ PRO", plan_prem: "ΠΛΟΙΟΚΤΗΤΗΣ",
        plan_basic_btn: "ΤΡΕΧΟΝ", plan_pro_btn: "ΑΝΑΒΑΘΜΙΣΗ", plan_prem_btn: "ΕΠΙΚΟΙΝΩΝΙΑ",
        feat_unl: "Απεριόριστες Σαρώσεις", feat_live: "Ζωντανή Αγορά", feat_api: "Πρόσβαση API"
    }
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
    
    const navIndex = ['dashboard', 'academy', 'regulations', 'docs', 'pricing'].indexOf(id);
    if(navIndex >= 0) document.querySelectorAll('.nav-item')[navIndex].classList.add('active');

    if(id === 'dashboard') setTimeout(() => map.invalidateSize(), 100); 
}

function changeLanguage(lang) {
    currentLang = lang;
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    
    // Static Text Updates
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        if(t[k]) el.innerText = t[k];
    });

    // Placeholder Update
    const chatInput = document.getElementById('chatInput');
    if(chatInput) chatInput.placeholder = t.chat_placeholder || "...";

    // Reload Dynamic Content with new language
    loadAcademy(); 
    loadDocs(); 
    loadRegulations();
    
    // Refresh Financial Table if open
    if(currentVoyageData && document.getElementById('finModal').style.display === 'block') {
        showFinancials();
    }
    
    // Update Chat Welcome Message
    const chatBody = document.getElementById('chatBody');
    // Eğer sadece ilk karşılama mesajı varsa güncelle, sohbet geçmişini silme
    if(chatBody && chatBody.children.length === 1 && chatBody.children[0].classList.contains('ai')) {
        chatBody.children[0].innerText = t.ai_welcome;
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
        } else {
            document.getElementById('oilPrice').innerText = "..."; 
            document.getElementById('vlsfoPrice').innerText = "..."; 
        }
        loadAcademy(); loadDocs(); loadRegulations();
    } catch(e) {}
}
window.onload = init;

// =================================================================
// 3. CONTENT LOADERS (TRANSLATION ENABLED)
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
                let contentSafe = item.content ? item.content.replace(/'/g, "\\'").replace(/\n/g, "\\n") : "Content loading...";
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
            let contentSafe = reg.content ? reg.content.replace(/'/g, "\\'").replace(/\n/g, "\\n") : "Content loading...";
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

// =================================================================
// 4. MAP & CALCULATIONS
// =================================================================

const map = L.map('map', {zoomControl: false}).setView([30, 0], 2);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 10, attribution: 'CartoDB' }).addTo(map);
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
    L.circleMarker([lat, lng], {radius:8, color:'#f59e0b', fillOpacity: 1, weight:2}).addTo(shipLayer).bindPopup("VESSEL"); 
    map.setView([lat, lng], 4); 
}

function updateSpeed() { /* ... */ }

async function scanMarket() {
    const lat = parseFloat(document.getElementById('vLat').value);
    const lng = parseFloat(document.getElementById('vLng').value);
    if(isNaN(lat) || isNaN(lng)) { alert("Enter coordinates."); return; }
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
        else alert("No profitable voyages.");
    } catch(e) { alert("Error."); }
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
    document.getElementById('financialDetails').innerHTML = `<div class="detail-row"><span class="d-lbl">Duration</span> <span class="d-val">${v.totalDays.toFixed(1)} days</span></div>`;
    document.getElementById('aiOutput').innerHTML = v.aiAnalysis;
    shipLayer.clearLayers();
    L.circleMarker([document.getElementById('vLat').value, document.getElementById('vLng').value], {radius:8, color:'#f59e0b'}).addTo(shipLayer);
    L.circleMarker([v.loadGeo.lat, v.loadGeo.lng], {radius:6, color:'#10b981'}).addTo(shipLayer).bindPopup("LOAD");
    L.circleMarker([v.dischGeo.lat, v.dischGeo.lng], {radius:6, color:'#ef4444'}).addTo(shipLayer).bindPopup("DISCH");
    map.fitBounds([[v.loadGeo.lat, v.loadGeo.lng], [v.dischGeo.lat, v.dischGeo.lng]], {padding:[50,50]});
}

function showFinancials() {
    if(!currentVoyageData) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    const b = currentVoyageData.breakdown;
    const vc = b.voyage_costs;
    const ox = b.opex;
    
    // Dinamik HTML oluştururken seçilen dili kullan
    const html = `
        <table class="fin-table">
            <tr><th colspan="2" style="border-bottom:2px solid var(--neon-cyan)">${t.fin_rev}</th></tr>
            <tr><td>${t.fin_freight} (${currentVoyageData.qty}mt)</td><td>$${Math.floor(b.revenue).toLocaleString()}</td></tr>
            <tr class="fin-section-total"><td>${t.fin_net}</td><td>$${Math.floor(b.revenue - vc.comm).toLocaleString()}</td></tr>
            
            <tr><th colspan="2" style="padding-top:20px; border-bottom:2px solid var(--neon-cyan)">${t.fin_voy}</th></tr>
            <tr><td>${t.fin_bunkers}</td><td>$${Math.floor(vc.fuel.total).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_main}</td><td>$${Math.floor(vc.fuel.main).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_aux}</td><td>$${Math.floor(vc.fuel.aux).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_lubes}</td><td>$${Math.floor(vc.fuel.lubes).toLocaleString()}</td></tr>

            <tr><td>${t.fin_port}</td><td>$${Math.floor(vc.port.total).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_dues}</td><td>$${Math.floor(vc.port.dues).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_pilot}</td><td>$${Math.floor(vc.port.pilot).toLocaleString()}</td></tr>
            <tr class="fin-sub-row"><td>- ${t.fin_tow}</td><td>$${Math.floor(vc.port.towage).toLocaleString()}</td></tr>
            
            <tr><td>${t.fin_cargo}</td><td>$${Math.floor(vc.cargo.total + vc.canal).toLocaleString()}</td></tr>
            
            <tr><th colspan="2" style="padding-top:20px; border-bottom:2px solid var(--neon-cyan)">${t.fin_opex}</th></tr>
            <tr><td>${t.fin_crew}</td><td>$${Math.floor(ox.crew).toLocaleString()}</td></tr>
            <tr><td>${t.fin_maint}</td><td>$${Math.floor(ox.maintenance).toLocaleString()}</td></tr>
            <tr><td>${t.fin_ins}</td><td>$${Math.floor(ox.insurance).toLocaleString()}</td></tr>
            <tr class="fin-section-total"><td>${t.fin_total_opex}</td><td>$${Math.floor(ox.total).toLocaleString()}</td></tr>

            <tr><th colspan="2" style="padding-top:30px;"></th></tr>
            <tr class="fin-grand-total"><td>${t.fin_profit}</td><td>$${Math.floor(currentVoyageData.financials.profit).toLocaleString()}</td></tr>
        </table>`;
    document.getElementById('finBody').innerHTML = html;
    document.getElementById('finModal').style.display = 'block';
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
function toggleChat() { document.getElementById('chatWindow').style.display = document.getElementById('chatWindow').style.display==='flex'?'none':'flex'; }
function toggleExpand() { document.getElementById('chatWindow').classList.toggle('expanded'); }
function handleEnter(e) { if(e.key === 'Enter') sendChat(); }

async function sendChat() {
    const inp = document.getElementById('chatInput');
    const msg = inp.value.trim();
    if(!msg) return;
    const body = document.getElementById('chatBody');
    body.innerHTML += `<div class="msg user">${msg}</div>`;
    inp.value = ''; body.scrollTop = body.scrollHeight;
    
    const lid = 'l-' + Date.now();
    body.innerHTML += `<div class="msg ai" id="${lid}">...</div>`;
    
    try {
        const res = await fetch('/api/chat', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message: msg, language: TRANSLATIONS[currentLang].lang_name || currentLang}) // Dili gönder
        });
        const d = await res.json();
        document.getElementById(lid).innerText = d.reply;
    } catch(e) { document.getElementById(lid).innerText = "Error."; }
    body.scrollTop = body.scrollHeight;
}
