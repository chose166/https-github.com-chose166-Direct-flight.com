import React, { useState, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import Globe from './components/Globe';
import LeftPanel from './components/LeftPanel';
import Header from './components/Header';
import BottomAd from './components/BottomAd';
import { trackRouteSearch } from './utils/analytics';

const App: React.FC = () => {
  const [worldData, setWorldData] = useState<any>(null);
  const [airportData, setAirportData] = useState<any>(null);
  const [routesData, setRoutesData] = useState<any>(null);
  const [baseRoutesData, setBaseRoutesData] = useState<any>(null);
  const [airlineData, setAirlineData] = useState<any>(null);
  const [statesData, setStatesData] = useState<any>(null);
  const [lakesData, setLakesData] = useState<any>(null);
  const [departure, setDeparture] = useState<any | null>(null);
  const [arrival, setArrival] = useState<any | null>(null);
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);
  const [selectedRouteInfo, setSelectedRouteInfo] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [is3DView, setIs3DView] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1280);
  const [loadingAeroDataBox, setLoadingAeroDataBox] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1280);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clear URL parameters and selections on page load
  useEffect(() => {
    if (airportData && !urlParamsProcessed) {
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);

      // Ensure departure and arrival are null on fresh load
      setDeparture(null);
      setArrival(null);

      setUrlParamsProcessed(true);
    }
  }, [airportData, urlParamsProcessed]);

  // Update URL when departure/arrival changes
  useEffect(() => {
    if (urlParamsProcessed) {
      const params = new URLSearchParams();

      if (departure) {
        params.set('from', departure.iata_code);
      }

      if (arrival) {
        params.set('to', arrival.iata_code);
      }

      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;

      window.history.replaceState({}, '', newUrl);
    }
  }, [departure, arrival, urlParamsProcessed]);

  const effectiveIs3DView = (isMobile || isTablet) ? false : is3DView;
  const isMobileOrTablet = isMobile || isTablet;

  const airportMap = useMemo(() => {
    if (!airportData) return new Map();
    return new Map(airportData.map((d: any) => [d.iata_code, d]));
  }, [airportData]);

  const airlineMap = useMemo(() => {
    if (!airlineData) return new Map();
    return new Map(airlineData.map((d: any) => [d.airline_id, d.name]));
  }, [airlineData]);

  useEffect(() => {
    const TOPOJSON_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';
    const AIRPORT_DATA_URL = 'https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv';
    const ROUTES_DATA_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat';
    const AIRLINES_DATA_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat';
    const STATES_DATA_URL = 'https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/50m/cultural/ne_50m_admin_1_states_provinces_lines.json';
    const LAKES_DATA_URL = 'https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/50m/physical/ne_50m_lakes.json';

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
      d3.text(AIRLINES_DATA_URL),
      d3.json(STATES_DATA_URL),
      d3.json(LAKES_DATA_URL)
    ])
      .then(([world, airports, routesText, airlinesText, states, lakes]) => {
        setWorldData(world);
        setStatesData(states);
        setLakesData(lakes);

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

        const routes = parseCsvWithHeaders(routesText, ROUTE_HEADERS);
        setRoutesData(routes);
        setBaseRoutesData(routes); // Store base routes separately
        setAirlineData(parseCsvWithHeaders(airlinesText, AIRLINE_HEADERS));
      })
      .catch((err: any) => {
        console.error("Error fetching data: ", err);
        setError("Failed to load map data. Please try refreshing the page.");
      });
  }, []);

  // Fetch AeroDataBox routes when departure airport is selected
  // Use hybrid approach: AeroDataBox for current routes + OpenFlights stops filtering
  useEffect(() => {
    if (departure && baseRoutesData) {
      // IMMEDIATELY show base routes so Globe doesn't lose routes during fetch
      setRoutesData(baseRoutesData);
      setLoadingAeroDataBox(true);

      fetch(`http://localhost:3002/api/routes?from=${departure.iata_code}`)
        .then(res => res.json())
        .then(aerodataboxRoutes => {
          // If AeroDataBox returns routes, use them. Otherwise keep OpenFlights routes.
          if (aerodataboxRoutes.length > 0) {
            // Merge AeroDataBox routes with base OpenFlights routes
            // Remove OpenFlights routes from this airport first
            const otherRoutes = baseRoutesData.filter((r: any) => r.source_airport !== departure.iata_code);
            const mergedRoutes = [...otherRoutes, ...aerodataboxRoutes];
            setRoutesData(mergedRoutes);
          } else {
            // AeroDataBox returned 0 routes - keep OpenFlights routes as fallback
            setRoutesData(baseRoutesData);
          }

          setLoadingAeroDataBox(false);
        })
        .catch(err => {
          console.error('Error fetching AeroDataBox routes:', err);
          // Fall back to base routes
          setRoutesData(baseRoutesData);
          setLoadingAeroDataBox(false);
        });
    } else if (!departure && baseRoutesData) {
      // No departure selected - use base routes
      setRoutesData(baseRoutesData);
      setLoadingAeroDataBox(false);
    }
  }, [departure, baseRoutesData]);

  useEffect(() => {
    if (departure && arrival && routesData) {
      // Filter for DIRECT flights only (0 stops)
      const matchingRoutes = routesData.filter((r: any) =>
        (r.source_airport === departure.iata_code && r.destination_airport === arrival.iata_code && r.stops === '0')
      );

      if (matchingRoutes.length > 0) {
        // Track the route search
        trackRouteSearch(departure.iata_code, arrival.iata_code);

        // Calculate distance
        const R = 6371;
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
        const distance = R * c;

        const avgSpeed = 870;
        const durationHours = distance / avgSpeed;
        const totalMinutes = (durationHours * 60) + 30;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);

        const airlines = [...new Set(matchingRoutes.map((r: any) => airlineMap.get(r.airline_id)).filter(Boolean))];
        const equipment = [...new Set(matchingRoutes.flatMap((r: any) => r.equipment.split(' ')))].join(', ');

        // Verify route with AeroDataBox API
        fetch(`http://localhost:3002/api/verify-route/${departure.iata_code}/${arrival.iata_code}`)
          .then(res => res.json())
          .then(verification => {
            const dailyFlights = verification.stats?.averageDailyFlights || 0;
            const routeExists = verification.source === 'aerodatabox' && verification.exists;
            const isLowFrequency = verification.source === 'aerodatabox' && dailyFlights < 0.5;

            // Always show route info, but mark verification status
            setSelectedRouteInfo({
              departure,
              arrival,
              distance: Math.round(distance),
              duration: `${hours}h ${minutes}m`,
              airlines: routeExists && verification.stats?.operators
                ? verification.stats.operators.map((op: any) => op.name)
                : airlines,
              equipment,
              verified: routeExists && !isLowFrequency,
              verificationSource: verification.source,
              dailyFlights: dailyFlights > 0 ? dailyFlights : null
            });
          })
          .catch(err => {
            console.error('Error verifying route:', err);
            // Fallback to OpenFlights data - show as unverified
            setSelectedRouteInfo({
              departure,
              arrival,
              distance: Math.round(distance),
              duration: `${hours}h ${minutes}m`,
              airlines,
              equipment,
              verified: null,
              verificationSource: 'openflights'
            });
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
      ) : (worldData && airportData && routesData && airlineData && statesData && lakesData) ? (
        <>
          <Header
            airports={airportData}
            departure={departure}
            setDeparture={setDeparture}
            arrival={arrival}
            setArrival={setArrival}
            is3DView={effectiveIs3DView}
            setIs3DView={setIs3DView}
            isMobileOrTablet={isMobileOrTablet}
            selectedRouteInfo={selectedRouteInfo}
          />
          <div className="flex flex-grow overflow-hidden relative">
            <LeftPanel
              info={selectedRouteInfo}
              clearRoute={() => { setDeparture(null); setArrival(null); }}
              isMobileOrTablet={isMobileOrTablet}
            />
            <main className="flex-grow relative">
              <Globe
                worldData={worldData}
                airportData={airportData}
                routesData={routesData}
                airportMap={airportMap}
                statesData={statesData}
                lakesData={lakesData}
                departure={departure}
                setDeparture={setDeparture}
                arrival={arrival}
                setArrival={setArrival}
                is3DView={effectiveIs3DView}
              />
            </main>
            <div className="absolute z-10 bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 md:bottom-4 md:left-4 md:w-full md:translate-x-0 md:max-w-none md:px-0 lg:left-96 lg:right-4 lg:ml-4 lg:w-auto">
              <BottomAd />
            </div>
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
