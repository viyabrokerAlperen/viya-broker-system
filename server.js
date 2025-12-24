import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- 1. GLOBAL PORT DATABASE ---
const PORT_DB = {
    "ISTANBUL": { lat: 41.00, lng: 28.97 },
    "ROTTERDAM": { lat: 51.90, lng: 4.40 },
    "HAMBURG": { lat: 53.55, lng: 9.99 },
    "ANTWERP": { lat: 51.21, lng: 4.40 },
    "NEW YORK": { lat: 40.71, lng: -74.00 },
    "HOUSTON": { lat: 29.76, lng: -95.36 },
    "SANTOS": { lat: -23.96, lng: -46.33 },
    "SHANGHAI": { lat: 31.23, lng: 121.47 },
    "SINGAPORE": { lat: 1.29, lng: 103.81 },
    "TOKYO": { lat: 35.68, lng: 139.69 },
    "JEBEL ALI": { lat: 25.02, lng: 55.02 },
    "GIBRALTAR": { lat: 36.14, lng: -5.35 },
    "SUEZ": { lat: 29.97, lng: 32.55 },
    "RICHARDS BAY": { lat: -28.78, lng: 32.03 },
    "NOVOROSSIYSK": { lat: 44.71, lng: 37.77 },
    "CONSTANTA": { lat: 44.17, lng: 28.63 },
    "LONDON": { lat: 51.50, lng: 0.12 },
    "BARCELONA": { lat: 41.38, lng: 2.17 }
};

// --- 2. STRATEJİK GEÇİŞ NOKTALARI ---
const WAYPOINTS = {
    "GIBRALTAR": [-5.6, 35.95],
    "SUEZ_N": [32.56, 31.26],
    "SUEZ_S": [32.56, 29.92],
    "BAB_EL_MANDEB": [43.4, 12.6],
    "SRI_LANKA": [80.6, 5.9],
    "MALACCA": [103.8, 1.3],
    "AEGEAN_EXIT": [26.0, 36.0],
    "ATLANTIC_MID": [-40.0, 35.0]
};

// Mesafe Hesaplama (Haversine)
function calculateDistance(coord1, coord2) {
    const R = 3440; // NM
    const lat1 = coord1[1];
    const lon1 = coord1[0];
    const lat2 = coord2[1];
    const lon2 = coord2[0];

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// --- 3. ANA API ENDPOINT ---
app.get('/sefer_onerisi', (req, res) => {
    try {
        const konumRaw = req.query.konum || "ISTANBUL";
        const bolgeRaw = req.query.bolge || "NEW YORK";
        
        const originName = konumRaw.toUpperCase().trim();
        const destName = bolgeRaw.toUpperCase().trim();
        
        const gemiTipi = req.query.gemiTipi || "Dry Bulk";
        const dwt = parseInt(req.query.dwt) || 50000;
        const hiz = parseFloat(req.query.hiz) || 13.5;

        const startPort = PORT_DB[originName];
        const endPort = PORT_DB[destName];

        if (!startPort || !endPort) {
            return res.json({ 
                basari: false, 
                error: `Liman veritabanında bulunamadı: ${!startPort ? originName : destName}` 
            });
        }

        // --- 4. ROTA ALGORİTMASI ---
        let path = [];
        let routeDescription = "Direct";
        let canalFee = 0;

        const startCoords = [startPort.lng, startPort.lat];
        const endCoords = [endPort.lng, endPort.lat];

        const isMed = (lat, lng) => (lat > 30 && lat < 46 && lng > -6 && lng < 36);
        const isAmericas = (lng) => (lng < -30);
        const isAsia = (lng) => (lng > 60);

        if (isMed(startPort.lat, startPort.lng) && isAmericas(endPort.lng)) {
            let prefix = [startCoords];
            if(startPort.lng > 25) prefix.push(WAYPOINTS.AEGEAN_EXIT);

            path = [
                ...prefix,
                WAYPOINTS.GIBRALTAR,
                WAYPOINTS.ATLANTIC_MID,
                endCoords
            ];
            routeDescription = "Via Gibraltar (Trans-Atlantic)";
        }
        else if ((isMed(startPort.lat, startPort.lng) || startPort.lng < 30) && isAsia(endPort.lng)) {
            let prefix = [];
            if (startPort.lat > 48) { 
                prefix = [startCoords, WAYPOINTS.GIBRALTAR];
            } else {
                prefix = [startCoords];
                if(startPort.lng > 25 && startPort.lng < 30) prefix.push(WAYPOINTS.AEGEAN_EXIT);
            }

            path = [
                ...prefix,
                WAYPOINTS.SUEZ_N,
                WAYPOINTS.SUEZ_S,
                WAYPOINTS.BAB_EL_MANDEB,
                WAYPOINTS.SRI_LANKA,
                WAYPOINTS.MALACCA,
                endCoords
            ];
            routeDescription = "Via Suez Canal";
            canalFee = 250000; 
        }
        else {
            path = [startCoords, endCoords];
            routeDescription = "Direct / Coastal Route";
        }

        // --- 5. FİNANSAL HESAPLAMA ---
        let totalDistNM = 0;
        for(let i=0; i<path.length-1; i++) {
            totalDistNM += calculateDistance(path[i], path[i+1]);
        }
        
        totalDistNM = Math.round(totalDistNM * 1.1); 

        const days = totalDistNM / (hiz * 24);
        const dailyFuelCons = 20 + (dwt / 10000) * 1.5; 
        const fuelPrice = 620; 
        
        const fuelCost = days * dailyFuelCons * fuelPrice;
        const dailyOpex = 5500 + (dwt / 10000) * 200; 
        const totalOpex = days * dailyOpex;
        const portDues = 40000 + (dwt * 0.5); 

        const marketFreightRate = 22.5; 
        const revenue = dwt * 0.95 * marketFreightRate; 

        const totalExpense = fuelCost + totalOpex + portDues + canalFee;
        const netProfit = revenue - totalExpense;

        const responseData = {
            basari: true,
            tavsiye: {
                tavsiyeGerekcesi: `Route optimized via ${routeDescription}. Distance: ${totalDistNM} NM. Market analysis included.`,
                tumRotlarinAnalizi: [
                    {
                        rotaAdi: routeDescription,
                        detay: `${totalDistNM} NM @ ${hiz} kts`,
                        geoJSON: {
                            type: "LineString",
                            coordinates: path
                        },
                        finans: {
                            navlunUSD: Math.round(revenue),
                            ballastYakitUSD: 0,
                            ladenYakitUSD: Math.round(fuelCost),
                            netKarUSD: Math.round(netProfit),
                            detaylar: {
                                fuel: Math.round(fuelCost),
                                opex: Math.round(totalOpex),
                                port: Math.round(portDues),
                                canal: Math.round(canalFee)
                            }
                        }
                    }
                ]
            }
        };

        res.json(responseData);

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ basari: false, error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`VIYA BROKER Server listening on port ${port}`);
});
