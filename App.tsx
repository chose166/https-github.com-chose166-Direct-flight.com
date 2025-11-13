import React, { useState, useEffect, useMemo } from 'react';
import Globe from './components/Globe';
import LeftPanel from './components/LeftPanel';
import BottomAd from './components/BottomAd';
import Header from './components/Header';

// Since d3 is loaded from a CDN, we can declare it as a global
declare const d3: any;

const App: React.FC = () => {
  const [worldData, setWorldData] = useState<any>(null);
  const [airportData, setAirportData] = useState<any>(null);
  const [routesData, setRoutesData] = useState<any>(null);
  const [airlineData, setAirlineData] = useState<any>(null);
  const [departure, setDeparture] = useState<any | null>(null);
  const [arrival, setArrival] = useState<any | null>(null);
  const [selectedRouteInfo, setSelectedRouteInfo] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [is3DView, setIs3DView] = useState<boolean>(true);

  const airportMap = useMemo(() => {
    if (!airportData) return new Map();
    return new Map(airportData.map((d: any) => [d.iata_code, d]));
  }, [airportData]);

  const airlineMap = useMemo(() => {
    if (!airlineData) return new Map();
    // Maps Airline ID to Airline Name
    return new Map(airlineData.map((d: any) => [d.airline_id, d.name]));
  }, [airlineData]);

  useEffect(() => {
    const TOPOJSON_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';
    const AIRPORT_DATA_URL = 'https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv';
    const ROUTES_DATA_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat';
    const AIRLINES_DATA_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat';

    const ROUTE_HEADERS = [
        'airline', 'airline_id', 'source_airport', 'source_airport_id', 
        'destination_airport', 'destination_airport_id', 'codeshare', 'stops', 'equipment'
    ];
    const AIRLINE_HEADERS = [
        'airline_id', 'name', 'alias', 'iata', 'icao', 'callsign', 'country', 'active'
    ];
    
    Promise.all([
      d3.json(TOPOJSON_URL),
      d3.csv(AIRPORT_DATA_URL),
      d3.text(ROUTES_DATA_URL),
      d3.text(AIRLINES_DATA_URL)
    ])
    .then(([world, airports, routesText, airlinesText]) => {
      setWorldData(world);
      
      const processedAirports = airports
        .filter((d: any) => 
            d.scheduled_service === 'yes' &&
            d.iata_code &&
            d.longitude_deg && 
            d.latitude_deg &&
            (d.type === 'large_airport' || d.type === 'medium_airport')
        )
        .map((d: any) => ({
          ...d,
          longitude_deg: +d.longitude_deg,
          latitude_deg: +d.latitude_deg,
        }));
      setAirportData(processedAirports);

      const parseCsvWithHeaders = (text: string, headers: string[]) => {
          return d3.csvParseRows(text).map((row: string[]) => {
              const obj: { [key: string]: any } = {};
              headers.forEach((header, i) => {
                  obj[header] = row[i];
              });
              return obj;
          });
      };

      setRoutesData(parseCsvWithHeaders(routesText, ROUTE_HEADERS));
      setAirlineData(parseCsvWithHeaders(airlinesText, AIRLINE_HEADERS));
    })
    .catch((err: any) => {
      console.error("Error fetching data: ", err);
      setError("Failed to load map data. Please try refreshing the page.");
    });
  }, []);
  
  // Calculate route info when departure and arrival are set
  useEffect(() => {
    if (departure && arrival) {
        const matchingRoutes = routesData.filter((r: any) => 
            (r.source_airport === departure.iata_code && r.destination_airport === arrival.iata_code)
        );

        if (matchingRoutes.length > 0) {
            // Haversine formula for distance
            const R = 6371; // Radius of Earth in kilometers
            const toRad = (deg: number) => deg * Math.PI / 180;
            const lat1 = toRad(departure.latitude_deg);
            const lon1 = toRad(departure.longitude_deg);
            const lat2 = toRad(arrival.latitude_deg);
            const lon2 = toRad(arrival.longitude_deg);

            const dLat = lat2 - lat1;
            const dLon = lon2 - lon1;

            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(lat1) * Math.cos(lat2) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c; // in km
            
            // Estimate duration
            const avgSpeed = 870; // km/h
            const durationHours = distance / avgSpeed;
            const totalMinutes = (durationHours * 60) + 30; // add 30 mins for taxi/takeoff/landing
            const hours = Math.floor(totalMinutes / 60);
            const minutes = Math.round(totalMinutes % 60);

            const airlines = [...new Set(matchingRoutes.map((r: any) => airlineMap.get(r.airline_id)).filter(Boolean))];
            const equipment = [...new Set(matchingRoutes.flatMap((r: any) => r.equipment.split(' ')))].join(', ');

            setSelectedRouteInfo({
                departure,
                arrival,
                distance: Math.round(distance),
                duration: `${hours}h ${minutes}m`,
                airlines,
                equipment
            });
        } else {
             setSelectedRouteInfo(null);
        }
    } else {
        setSelectedRouteInfo(null);
    }
  }, [departure, arrival, routesData, airlineMap]);

  return (
    <div className="bg-blue-50 text-gray-800 h-screen font-sans flex flex-col overflow-hidden">
        {error ? (
             <div className="flex items-center justify-center w-full h-full">
               <p className="text-xl text-red-500">{error}</p>
             </div>
          ) : (worldData && airportData && routesData && airlineData) ? (
            <>
              <Header 
                  airports={airportData}
                  departure={departure}
                  setDeparture={setDeparture}
                  arrival={arrival}
                  setArrival={setArrival}
                  is3DView={is3DView}
                  setIs3DView={setIs3DView}
              />
              <div className="flex flex-grow h-full overflow-hidden">
                  <LeftPanel 
                    info={selectedRouteInfo}
                    clearRoute={() => { setDeparture(null); setArrival(null); }}
                  />
                  <main className="flex-grow h-full relative">
                    <Globe 
                      worldData={worldData} 
                      airportData={airportData} 
                      routesData={routesData}
                      airportMap={airportMap}
                      departure={departure}
                      setDeparture={setDeparture}
                      arrival={arrival}
                      setArrival={setArrival}
                      is3DView={is3DView}
                    />
                    <BottomAd />
                  </main>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
              <p className="ml-4 text-xl">Loading Globe Data...</p>
            </div>
          )}
    </div>
  );
};

export default App;