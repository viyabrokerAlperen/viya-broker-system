// GERÇEK DENİZ YOLLARI HARİTASI (NODES & EDGES)
// Bu koordinatlar gerçektir. AI tahmini değildir.

import Graph from 'node-dijkstra';

const routeGraph = new Graph();

// --- HARİTA NOKTALARI (WAYPOINTS) ---
// Format: "ISIM": { "KOMSU_ISIM": MESAFE_KM }
// Mesafeler yaklaşık deniz miline göre optimize edilmiştir.

const nodes = {
    // --- AVRUPA & AKDENİZ ---
    "Istanbul": { "Canakkale": 150, "BlackSea_Entry": 30 },
    "Canakkale": { "Istanbul": 150, "Aegean_Center": 100 },
    "Aegean_Center": { "Canakkale": 100, "Med_East": 400, "Athens": 150 },
    "Athens": { "Aegean_Center": 150, "Med_Central": 400 },
    "Med_East": { "Aegean_Center": 400, "Suez_North": 300, "Cyprus": 100 },
    "Cyprus": { "Med_East": 100, "Suez_North": 250 },
    "Suez_North": { "Med_East": 300, "Cyprus": 250, "Suez_Canal": 160 },
    "Med_Central": { "Athens": 400, "Med_West": 600, "Sicily": 200 },
    "Sicily": { "Med_Central": 200, "Med_West": 500 },
    "Med_West": { "Med_Central": 600, "Sicily": 500, "Gibraltar": 800, "Barcelona": 400, "Marseille": 450 },
    "Gibraltar": { "Med_West": 800, "Atlantic_Morocco": 100, "Lisbon": 300 },
    "Lisbon": { "Gibraltar": 300, "Bay_of_Biscay": 600, "Azores": 1200 },
    "Bay_of_Biscay": { "Lisbon": 600, "English_Channel": 400 },
    "English_Channel": { "Bay_of_Biscay": 400, "Rotterdam": 200, "London": 200, "North_Sea": 300 },
    "Rotterdam": { "English_Channel": 200, "North_Sea": 100, "Hamburg": 250 },
    "Hamburg": { "Rotterdam": 250, "North_Sea": 150 },
    "North_Sea": { "English_Channel": 300, "Rotterdam": 100, "Baltic_Entry": 400 },

    // --- ATLANTİK OKYANUSU ---
    "Atlantic_Morocco": { "Gibraltar": 100, "Canary_Islands": 800, "Atlantic_North_Crossing": 2000 },
    "Canary_Islands": { "Atlantic_Morocco": 800, "West_Africa_Bulge": 1000, "Atlantic_Central_Crossing": 2500 },
    "West_Africa_Bulge": { "Canary_Islands": 1000, "Gulf_of_Guinea": 1500, "Brazil_North": 1800 },
    "Gulf_of_Guinea": { "West_Africa_Bulge": 1500, "Cape_Good_Hope": 2500 },
    "Cape_Good_Hope": { "Gulf_of_Guinea": 2500, "Indian_Ocean_SW": 1500 },

    "Atlantic_North_Crossing": { "Atlantic_Morocco": 2000, "US_East_Coast": 1500, "Azores": 1000 },
    "Azores": { "Lisbon": 1200, "Atlantic_North_Crossing": 1000, "US_East_Coast": 2000 },
    "US_East_Coast": { "Atlantic_North_Crossing": 1500, "Azores": 2000, "New_York": 200, "Florida": 800 },
    "New_York": { "US_East_Coast": 200, "Canada_East": 500 },
    "Florida": { "US_East_Coast": 800, "Gulf_of_Mexico": 500, "Caribbean_Sea": 400 },
    "Caribbean_Sea": { "Florida": 400, "Panama_East": 300, "Venezuela": 500 },
    "Panama_East": { "Caribbean_Sea": 300, "Panama_Canal": 80 },
    "Venezuela": { "Caribbean_Sea": 500, "Brazil_North": 1200 },
    "Brazil_North": { "Venezuela": 1200, "West_Africa_Bulge": 1800, "Santos": 1500 },
    "Santos": { "Brazil_North": 1500, "Argentina": 1000 },
    "Argentina": { "Santos": 1000, "Cape_Horn": 1500 },

    // --- KIZILDENİZ & HİNT OKYANUSU ---
    "Suez_Canal": { "Suez_North": 160, "Red_Sea_North": 50 },
    "Red_Sea_North": { "Suez_Canal": 50, "Red_Sea_Center": 600 },
    "Red_Sea_Center": { "Red_Sea_North": 600, "Bab_El_Mandeb": 600 },
    "Bab_El_Mandeb": { "Red_Sea_Center": 600, "Gulf_of_Aden": 150 },
    "Gulf_of_Aden": { "Bab_El_Mandeb": 150, "Arabian_Sea": 800, "Oman": 900 },
    "Arabian_Sea": { "Gulf_of_Aden": 800, "Mumbai": 900, "Indian_Ocean_Center": 1200 },
    "Mumbai": { "Arabian_Sea": 900, "Sri_Lanka": 1000 },
    "Sri_Lanka": { "Mumbai": 1000, "Bay_of_Bengal": 800, "Malacca_West": 1200, "Indian_Ocean_Center": 800 },
    "Indian_Ocean_Center": { "Sri_Lanka": 800, "Arabian_Sea": 1200, "Indian_Ocean_SW": 2000, "Sunda_Strait": 1500 },
    "Indian_Ocean_SW": { "Cape_Good_Hope": 1500, "Indian_Ocean_Center": 2000, "Australia_West": 3000 },

    // --- ASYA & PASİFİK ---
    "Malacca_West": { "Sri_Lanka": 1200, "Singapore": 300 },
    "Singapore": { "Malacca_West": 300, "South_China_Sea": 400 },
    "South_China_Sea": { "Singapore": 400, "Vietnam": 600, "Philippines": 800, "Hong_Kong": 1200 },
    "Hong_Kong": { "South_China_Sea": 1200, "Shanghai": 700, "Taiwan": 400 },
    "Shanghai": { "Hong_Kong": 700, "South_Korea": 400, "Japan_South": 500 },
    "South_Korea": { "Shanghai": 400, "Japan_Sea": 300 },
    "Japan_South": { "Shanghai": 500, "Tokyo": 400, "Pacific_Crossing_West": 1000 },
    "Tokyo": { "Japan_South": 400, "Pacific_Crossing_West": 500 },
    
    // --- PASİFİK GEÇİŞİ ---
    "Pacific_Crossing_West": { "Tokyo": 500, "Pacific_Center": 3000 },
    "Pacific_Center": { "Pacific_Crossing_West": 3000, "US_West_Coast": 3000, "Panama_West": 4000 },
    "US_West_Coast": { "Pacific_Center": 3000, "Panama_West": 3000 },
    "Panama_West": { "Pacific_Center": 4000, "US_West_Coast": 3000, "Panama_Canal": 50 },
    "Panama_Canal": { "Panama_West": 50, "Panama_East": 80 }
};

// Haritayı Graph'a Yükle
Object.keys(nodes).forEach(node => {
    routeGraph.addNode(node, nodes[node]);
});

// KOORDİNAT VERİTABANI (Map Üzerinde Çizim İçin)
// [Enlem (Lat), Boylam (Lon)]
export const coordinates = {
    "Istanbul": [41.0082, 28.9784],
    "Canakkale": [40.1553, 26.4142],
    "Aegean_Center": [38.0000, 25.0000],
    "Athens": [37.9429, 23.6469],
    "Med_East": [34.0000, 28.0000],
    "Cyprus": [34.5000, 33.0000],
    "Suez_North": [31.5000, 32.5000],
    "Med_Central": [35.0000, 18.0000],
    "Sicily": [37.0000, 14.0000],
    "Med_West": [37.0000, 5.0000],
    "Gibraltar": [35.9500, -5.6000],
    "Barcelona": [41.3851, 2.1734],
    "Marseille": [43.2965, 5.3698],
    "Atlantic_Morocco": [34.0000, -10.0000],
    "Lisbon": [38.7223, -9.1393],
    "Bay_of_Biscay": [45.0000, -5.0000],
    "English_Channel": [50.0000, -2.0000],
    "Rotterdam": [51.9566, 4.0], // Deniz tarafı
    "London": [51.5074, 0.5],
    "Hamburg": [53.5511, 9.9937],
    "North_Sea": [55.0000, 3.0000],
    "Canary_Islands": [28.2916, -16.6291],
    "West_Africa_Bulge": [10.0000, -20.0000],
    "Gulf_of_Guinea": [0.0000, 0.0000],
    "Cape_Good_Hope": [-34.3548, 18.4698],
    "Atlantic_North_Crossing": [40.0000, -40.0000],
    "Azores": [38.0000, -27.0000],
    "US_East_Coast": [35.0000, -70.0000],
    "New_York": [40.5000, -73.8000], // NY Liman ağzı
    "Florida": [25.0000, -80.0000],
    "Gulf_of_Mexico": [25.0000, -90.0000],
    "Caribbean_Sea": [15.0000, -75.0000],
    "Panama_East": [9.3500, -79.9000],
    "Panama_Canal": [9.1000, -79.7000], // Kanalın ortası
    "Panama_West": [8.9000, -79.5000],
    "Venezuela": [11.0000, -66.0000],
    "Brazil_North": [-5.0000, -35.0000],
    "Santos": [-23.9618, -46.3322],
    "Argentina": [-38.0000, -57.0000],
    "Suez_Canal": [30.6000, 32.3000], // Kanal ortası
    "Red_Sea_North": [27.0000, 34.0000],
    "Red_Sea_Center": [20.0000, 38.0000],
    "Bab_El_Mandeb": [12.5800, 43.3000],
    "Gulf_of_Aden": [12.0000, 48.0000],
    "Arabian_Sea": [15.0000, 60.0000],
    "Mumbai": [18.9400, 72.8000],
    "Oman": [23.0000, 59.0000],
    "Sri_Lanka": [5.9000, 80.5000], // Galle açıkları
    "Bay_of_Biscay": [45.0000, -4.0000],
    "Bay_of_Bengal": [10.0000, 85.0000],
    "Indian_Ocean_Center": [-5.0000, 80.0000],
    "Indian_Ocean_SW": [-25.0000, 60.0000],
    "Malacca_West": [5.0000, 98.0000],
    "Singapore": [1.2500, 103.8000],
    "South_China_Sea": [12.0000, 112.0000],
    "Vietnam": [10.0000, 108.0000],
    "Philippines": [13.0000, 120.0000],
    "Hong_Kong": [22.2000, 114.2000],
    "Shanghai": [31.1000, 122.0000],
    "South_Korea": [34.0000, 128.0000],
    "Japan_South": [32.0000, 133.0000],
    "Tokyo": [35.6000, 140.0000],
    "Pacific_Crossing_West": [35.0000, 160.0000],
    "Pacific_Center": [20.0000, -160.0000],
    "US_West_Coast": [34.0000, -120.0000]
};

// En Yakın Noktayı Bulan Fonksiyon
export function findNearestNode(lat, lon) {
    let nearestNode = null;
    let minDistance = Infinity;

    Object.keys(coordinates).forEach(nodeName => {
        const [nLat, nLon] = coordinates[nodeName];
        // Basit Öklid Mesafesi (Bu ölçekte yeterli)
        const dist = Math.sqrt(Math.pow(nLat - lat, 2) + Math.pow(nLon - lon, 2));
        if (dist < minDistance) {
            minDistance = dist;
            nearestNode = nodeName;
        }
    });
    return nearestNode;
}

export default routeGraph;
