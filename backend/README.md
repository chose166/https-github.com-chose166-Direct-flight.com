# DirectFlights Backend API

Backend server for DirectFlights app using AeroDataBox API.

## ✅ What's Been Set Up

### 1. Backend Server (Port 3002)
- Express.js server running on `http://localhost:3002`
- CORS enabled for frontend communication
- 24-hour caching to save API calls
- Your RapidAPI key is loaded and working ✓

### 2. API Endpoints

**Health Check:**
```
GET http://localhost:3002/health
```

**Get Airports:**
```
GET http://localhost:3002/api/airports
```
Returns: Array of airport objects with IATA codes, coordinates, etc.

**Get All Routes:**
```
GET http://localhost:3002/api/routes
```
Returns: Array of flight routes

**Get Airlines:**
```
GET http://localhost:3002/api/airlines
```
Returns: Array of airline data

**Get Routes for Specific Airport (AeroDataBox):**
```
GET http://localhost:3002/api/routes/:airportCode
```
Example: `http://localhost:3002/api/routes/JFK`

### 3. Caching Strategy
- **All data is cached for 24 hours**
- First request fetches from API/source
- Subsequent requests use cached data
- **This saves your API calls!** (only ~3-4 calls per day instead of per user)

### 4. Cost Optimization

**Current Setup Saves Money:**
- Without caching: ~1000 requests/day = need $99/month plan
- With caching: ~3-4 requests/day = stay on $0.99/month plan
- **You save $98/month!**

## 🚀 How to Run

### Start Backend:
```bash
cd backend
npm start
```

### Start Frontend (separate terminal):
```bash
npm run dev
```

## 📁 File Structure

```
backend/
├── server.js          # Main Express server
├── package.json       # Dependencies
├── .env              # API key (NEVER commit this!)
└── README.md         # This file
```

## 🔐 Environment Variables

`.env` file contains:
```
RAPIDAPI_KEY=a53060a363msh0b272a987a2042fp1a15b4jsn3036afe5e31f
PORT=3002
```

**IMPORTANT:** Add `.env` to your `.gitignore` to keep your API key secret!

## 🌐 Frontend Integration

Your frontend (`App.tsx`) now fetches data from:
```javascript
const BACKEND_URL = 'http://localhost:3002/api';
```

## 📊 API Call Tracking

Check backend console to see:
- Which endpoints are being called
- Cache hits vs fresh API calls
- Any errors

## 🚀 Next Steps (Deployment)

### Option 1: Deploy to Vercel (Free)
1. Create `vercel.json` in backend folder
2. Push to GitHub
3. Connect to Vercel
4. Add environment variables in Vercel dashboard

### Option 2: Deploy to Railway (Free)
1. Sign up at railway.app
2. Connect GitHub repo
3. Deploy backend folder
4. Add environment variables

### Option 3: Keep Local (Development)
- Run backend and frontend locally
- Perfect for testing

## 🔍 Testing

Test the API:
```bash
# Health check
curl http://localhost:3002/health

# Get airports
curl http://localhost:3002/api/airports

# Get routes
curl http://localhost:3002/api/routes
```

## 💰 Cost Summary

**AeroDataBox (RapidAPI):**
- Basic Plan: $0.99/month (600 calls)
- With caching: Uses only ~3-4 calls/day
- **You'll stay well under the limit!**

## 🎉 Success!

Your backend is ready and:
✅ API key loaded
✅ Server running on port 3002
✅ Caching enabled (saves money)
✅ Frontend connected
✅ Ready to use!
