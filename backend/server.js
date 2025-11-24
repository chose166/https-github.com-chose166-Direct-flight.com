import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import NodeCache from 'node-cache';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// Cache for 6 months (routes don't change frequently)
// 180 days * 24 hours * 60 minutes * 60 seconds = 15552000 seconds
const cache = new NodeCache({ stdTTL: 15552000 });

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'DirectFlights API is running' });
});

// Get airports from OurAirports (free, comprehensive)
app.get('/api/airports', async (req, res) => {
  try {
    // Check cache first
    const cachedAirports = cache.get('airports');
    if (cachedAirports) {
      console.log('Returning cached airports');
      return res.json(cachedAirports);
    }

    console.log('Fetching airports from OurAirports...');
    const response = await fetch(
      'https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv'
    );

    const csvText = await response.text();
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');

    const airports = lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',');
        const airport = {};
        headers.forEach((header, i) => {
          airport[header] = values[i]?.replace(/"/g, '');
        });
        return airport;
      })
      .filter(a =>
        a.scheduled_service === 'yes' &&
        a.iata_code &&
        a.longitude_deg &&
        a.latitude_deg &&
        (a.type === 'large_airport' || a.type === 'medium_airport')
      )
      .map(a => ({
        ...a,
        longitude_deg: parseFloat(a.longitude_deg),
        latitude_deg: parseFloat(a.latitude_deg),
      }));

    cache.set('airports', airports);
    console.log(`Cached ${airports.length} airports`);
    res.json(airports);
  } catch (error) {
    console.error('Error fetching airports:', error);
    res.status(500).json({ error: 'Failed to fetch airports' });
  }
});

// Verify route exists using AeroDataBox (REAL-TIME DATA!)
app.get('/api/verify-route/:from/:to', async (req, res) => {
  try {
    const { from, to } = req.params;

    // Check cache first
    const cacheKey = `verify_${from}_${to}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult !== undefined) {
      console.log(`Returning cached route verification: ${from} -> ${to}`);
      return res.json(cachedResult);
    }

    console.log(`Verifying route ${from} -> ${to} with AeroDataBox...`);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Fetch daily routes from departure airport
    const url = `https://aerodatabox.p.rapidapi.com/airports/iata/${from}/stats/routes/daily/${today}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error(`AeroDataBox API error: ${response.status} ${response.statusText}`);
      // Fallback to OpenFlights data if AeroDataBox fails
      return res.json({ exists: null, source: 'unavailable', error: response.statusText });
    }

    const routeStats = await response.json();

    // Check if destination airport exists in the routes
    const routeExists = routeStats.routes && routeStats.routes.some(route =>
      route.destination && route.destination.iata === to
    );

    const result = {
      exists: routeExists,
      source: 'aerodatabox',
      date: today,
      ...( routeExists && { stats: routeStats.routes.find(r => r.destination?.iata === to) })
    };

    // Cache for 6 months
    cache.set(cacheKey, result);

    console.log(`Route ${from} -> ${to}: ${routeExists ? 'EXISTS' : 'NOT FOUND'}`);
    res.json(result);

  } catch (error) {
    console.error('Error verifying route:', error);
    res.status(500).json({
      error: 'Failed to verify route',
      message: error.message
    });
  }
});

// Get routes for a specific airport using AeroDataBox (WEEKLY DATA!)
app.get('/api/airport-routes/:airportCode', async (req, res) => {
  try {
    const { airportCode } = req.params;

    // Check cache first
    const cacheKey = `airport_routes_weekly_${airportCode}`;
    const cachedRoutes = cache.get(cacheKey);
    if (cachedRoutes) {
      console.log(`Returning cached weekly routes for ${airportCode}`);
      return res.json(cachedRoutes);
    }

    console.log(`Fetching 7-day routes for ${airportCode} from AeroDataBox...`);

    // Fetch routes for the next 7 days to get complete weekly schedule
    const routesByDestination = new Map();
    const today = new Date();

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      const url = `https://aerodatabox.p.rapidapi.com/airports/iata/${airportCode}/stats/routes/daily/${dateStr}`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
          }
        });

        if (response.ok) {
          const routeStats = await response.json();

          // Aggregate routes by destination
          if (routeStats.routes) {
            routeStats.routes.forEach(route => {
              if (route.destination?.iata) {
                const destCode = route.destination.iata;
                if (!routesByDestination.has(destCode)) {
                  routesByDestination.set(destCode, {
                    from: airportCode,
                    to: destCode,
                    toName: route.destination.name,
                    operators: new Set(),
                    daysOperating: [],
                    totalFlights: 0
                  });
                }
                const routeData = routesByDestination.get(destCode);
                routeData.daysOperating.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                routeData.totalFlights += route.flights || 0;

                // Collect operators
                if (route.operators) {
                  route.operators.forEach(op => {
                    if (op.name) routeData.operators.add(op.name);
                  });
                }
              }
            });
          }
        }
      } catch (dayError) {
        console.error(`Error fetching ${dateStr}:`, dayError.message);
      }
    }

    // Convert to array format and filter by frequency
    // Direct flights typically operate at least 3-4 times per week
    const routes = Array.from(routesByDestination.values())
      .filter(route => route.daysOperating.length >= 3) // Filter: at least 3 days per week
      .map(route => ({
        from: route.from,
        to: route.to,
        toName: route.toName,
        operators: Array.from(route.operators),
        daysOperating: [...new Set(route.daysOperating)], // Remove duplicates
        frequency: route.daysOperating.length,
        avgDailyFlights: route.totalFlights / 7
      }));

    const result = {
      airport: airportCode,
      period: '7-day',
      totalRoutes: routes.length,
      routes: routes,
      source: 'aerodatabox-weekly'
    };

    cache.set(cacheKey, result);
    console.log(`Found ${routes.length} unique routes for ${airportCode} over 7 days (filtered for frequency ≥3 days/week)`);

    res.json(result);
  } catch (error) {
    console.error('Error fetching airport routes:', error);
    res.status(500).json({
      error: 'Failed to fetch airport routes',
      message: error.message
    });
  }
});

// Get all routes (Hybrid: OpenFlights + AeroDataBox for specific airports)
app.get('/api/routes', async (req, res) => {
  try {
    const { from } = req.query; // Optional: get routes from specific airport

    if (from) {
      // Fetch AeroDataBox weekly routes for this specific airport
      const cacheKey = `airport_routes_weekly_${from}`;
      let aerodataboxRoutes = cache.get(cacheKey);

      if (!aerodataboxRoutes) {
        // Fetch it if not cached
        console.log(`Fetching AeroDataBox routes for ${from}...`);
        const routesByDestination = new Map();
        const today = new Date();

        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const date = new Date(today);
          date.setDate(today.getDate() + dayOffset);
          const dateStr = date.toISOString().split('T')[0];

          const url = `https://aerodatabox.p.rapidapi.com/airports/iata/${from}/stats/routes/daily/${dateStr}`;

          try {
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
              }
            });

            if (response.ok) {
              const routeStats = await response.json();
              if (routeStats.routes) {
                routeStats.routes.forEach(route => {
                  if (route.destination?.iata) {
                    const destCode = route.destination.iata;
                    if (!routesByDestination.has(destCode)) {
                      routesByDestination.set(destCode, {
                        source_airport: from,
                        destination_airport: destCode,
                        airline: route.operators?.[0]?.iata || '',
                        airline_id: '',
                        stops: '0',
                        equipment: '',
                        source: 'aerodatabox',
                        daysOperating: []
                      });
                    }
                    routesByDestination.get(destCode).daysOperating.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                  }
                });
              }
            }
          } catch (err) {
            console.error(`Error fetching ${dateStr}:`, err.message);
          }
        }

        // Filter routes: at least 3 days per week (direct flights)
        aerodataboxRoutes = Array.from(routesByDestination.values())
          .filter(route => route.daysOperating.length >= 3)
          .map(route => {
            delete route.daysOperating; // Remove this field from response
            return route;
          });

        cache.set(cacheKey, aerodataboxRoutes);
        console.log(`Cached ${aerodataboxRoutes.length} AeroDataBox routes for ${from} (filtered for ≥3 days/week)`);
      }

      return res.json(aerodataboxRoutes);
    }

    // No specific airport - return all OpenFlights routes
    const cachedRoutes = cache.get('all_routes');
    if (cachedRoutes) {
      console.log('Returning cached OpenFlights routes');
      return res.json(cachedRoutes);
    }

    console.log('Fetching all routes from OpenFlights...');

    const response = await fetch(
      'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat'
    );

    const routesText = await response.text();
    const ROUTE_HEADERS = [
      'airline', 'airline_id', 'source_airport', 'source_airport_id',
      'destination_airport', 'destination_airport_id', 'codeshare', 'stops', 'equipment'
    ];

    const routes = routesText.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',');
        const route = {};
        ROUTE_HEADERS.forEach((header, i) => {
          route[header] = values[i];
        });
        return route;
      });

    cache.set('all_routes', routes);
    console.log(`Cached ${routes.length} routes`);
    res.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// Get airlines data
app.get('/api/airlines', async (req, res) => {
  try {
    // Check cache first
    const cachedAirlines = cache.get('airlines');
    if (cachedAirlines) {
      console.log('Returning cached airlines');
      return res.json(cachedAirlines);
    }

    console.log('Fetching airlines from OpenFlights...');
    const response = await fetch(
      'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat'
    );

    const airlinesText = await response.text();
    const AIRLINE_HEADERS = [
      'airline_id', 'name', 'alias', 'iata', 'icao', 'callsign', 'country', 'active'
    ];

    const airlines = airlinesText.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',');
        const airline = {};
        AIRLINE_HEADERS.forEach((header, i) => {
          airline[header] = values[i];
        });
        return airline;
      });

    cache.set('airlines', airlines);
    console.log(`Cached ${airlines.length} airlines`);
    res.json(airlines);
  } catch (error) {
    console.error('Error fetching airlines:', error);
    res.status(500).json({ error: 'Failed to fetch airlines' });
  }
});

// Get flight schedule for specific route (next 30 days)
app.get('/api/flight-schedule/:from/:to', async (req, res) => {
  try {
    const { from, to } = req.params;

    // Check cache first
    const cacheKey = `schedule_${from}_${to}`;
    const cachedSchedule = cache.get(cacheKey);
    if (cachedSchedule) {
      console.log(`Returning cached schedule for ${from} -> ${to}`);
      return res.json(cachedSchedule);
    }

    console.log(`Fetching flight schedule for ${from} -> ${to} (next 30 days)...`);

    const availableDates = [];
    const today = new Date();

    // Check next 30 days
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      // Fetch daily routes from departure airport
      const url = `https://aerodatabox.p.rapidapi.com/airports/iata/${from}/stats/routes/daily/${dateStr}`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
          }
        });

        if (response.ok) {
          const routeStats = await response.json();

          // Check if destination exists in routes for this day
          const routeExists = routeStats.routes && routeStats.routes.some(route =>
            route.destination && route.destination.iata === to
          );

          if (routeExists) {
            availableDates.push(dateStr);
          }
        }
      } catch (dayError) {
        console.error(`Error fetching schedule for ${dateStr}:`, dayError.message);
      }
    }

    const result = {
      from,
      to,
      availableDates,
      totalDays: availableDates.length,
      source: 'aerodatabox'
    };

    // Cache for 6 months
    cache.set(cacheKey, result);

    console.log(`Found flights on ${availableDates.length} days for ${from} -> ${to}`);
    res.json(result);

  } catch (error) {
    console.error('Error fetching flight schedule:', error);
    res.status(500).json({
      error: 'Failed to fetch flight schedule',
      message: error.message
    });
  }
});

// Get API stats
app.get('/api/stats', (req, res) => {
  const stats = cache.keys().reduce((acc, key) => {
    const data = cache.get(key);
    acc[key] = {
      cached: true,
      ttl: cache.getTtl(key) ? Math.round((cache.getTtl(key) - Date.now()) / 1000) : 0,
      size: Array.isArray(data) ? data.length : 'object'
    };
    return acc;
  }, {});

  res.json({
    totalCachedKeys: cache.keys().length,
    stats: stats,
    rapidApiKeyLoaded: !!RAPIDAPI_KEY
  });
});

app.listen(PORT, () => {
  console.log(`🚀 DirectFlights API server running on http://localhost:${PORT}`);
  console.log(`📊 Hybrid approach: OpenFlights (base) + AeroDataBox (verification)`);
  console.log(`💰 Cost-effective: ~3-10 AeroDataBox calls/day`);
  console.log(`🔑 RapidAPI Key: ${RAPIDAPI_KEY ? '✓ Loaded' : '✗ Missing'}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET /health - Health check`);
  console.log(`  GET /api/airports - All airports`);
  console.log(`  GET /api/routes - All routes (OpenFlights)`);
  console.log(`  GET /api/airlines - All airlines`);
  console.log(`  GET /api/verify-route/:from/:to - Verify route with AeroDataBox`);
  console.log(`  GET /api/airport-routes/:code - Get routes for airport (AeroDataBox)`);
  console.log(`  GET /api/flight-schedule/:from/:to - Get flight availability (30 days)`);
  console.log(`  GET /api/stats - Cache statistics`);
});
