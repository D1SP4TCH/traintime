# MTA Departure Board

A real-time subway departure board designed for tablet display. Polls MTA GTFS-Realtime feeds and displays upcoming train departures.

## Features

- Real-time MTA subway departure information
- Clean, tablet-optimized UI
- Auto-refreshing every 15-30 seconds
- Filter by specific stations and directions
- Automatic station name mapping from GTFS static data

## Setup

### Prerequisites

- Node.js 18+ and npm
- MTA API key (get from [MTA Developer Resources](https://api.mta.info/))

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your MTA API key.

4. **Get Station Names (Important!)**:
   
   The app needs to map stop IDs (like "104N") to station names (like "Times Square"). You have two options:
   
   **Option A: Download GTFS Static Data (Recommended)**
   ```bash
   # 1. Download MTA GTFS static data from:
   #    https://new.mta.info/developers
   #    Look for "GTFS Schedule Data" and download the zip file
   
   # 2. Extract stops.txt from the zip
   
   # 3. Parse it to generate stop names:
   node scripts/parse-stops.js <path-to-stops.txt> > data/stop-names.json
   
   # 4. Restart the server - it will automatically load the names!
   ```
   
   **Option B: Manual Mapping**
   - Edit `src/server.ts` and add entries to `MANUAL_STOP_NAMES`
   - Or use the stops browser at `http://localhost:3000/stops.html` to see stop IDs, then add them manually

5. Configure your stations:
   - Edit `public/index.html` and update the `STOPS` array in the JavaScript
   - Station names will automatically appear if you've loaded the GTFS data!

### Finding Station Stop IDs

Stop IDs vary by line:
- **Numeric lines (1, 2, 3, etc.)**: Use numeric IDs like `104N`, `104S`
- **Letter lines (A, C, E, etc.)**: Use letter-number combinations like `A33N`, `A41S`

**Easy way to find your stops:**
1. Start the server: `npm run dev`
2. Visit `http://localhost:3000/stops.html` to see all available stops
3. Or use the API: `curl http://localhost:3000/api/debug/stops`

**Note:** Different subway lines require different feed URLs. The default feeds include:
- A, C, E lines
- 1, 2, 3 lines

For other lines (like R, N, Q, etc.), you'll need to add their feed URLs to `MTA_FEED_URLS`. Check [MTA Developer Resources](https://api.mta.info/) for all available feeds.

## Running Locally

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Building for Production

```bash
npm run build
npm start
```

## Deployment

### Option 1: Cloud Platforms

Deploy to Render, Railway, Fly.io, or Heroku:

1. Push to GitHub
2. Create a new service/web app
3. Set environment variables:
   - `MTA_API_KEY` - Your MTA API key
   - `PORT` - (optional) Server port
4. Deploy

### Option 2: Raspberry Pi / Local Network

1. Install Node.js on your Pi
2. Clone this repo
3. Set up environment variables
4. Run `npm run build && npm start`
5. Access from tablet at `http://your-pi-ip:3000`

## Using on a Tablet

1. Connect tablet to Wi-Fi
2. Open the app URL in Chrome/Safari
3. Add to home screen / "Install app"
4. Enable full-screen mode
5. Disable auto-sleep or use a kiosk app

## API Endpoints

- `GET /` - Frontend departure board
- `GET /api/departures?stops=R16N,R16S` - JSON API for departures
- `GET /api/debug/stops` - List all available stops with routes
- `GET /health` - Health check endpoint
- `GET /stops.html` - Browse available stops in a web interface

## Configuration

### MTA Feed URLs

The MTA provides multiple GTFS-Realtime feeds for different subway lines. The app defaults to fetching from two feeds:
- `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace` - A, C, E lines
- `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs` - 1, 2, 3 lines

To customize feeds, set `MTA_FEED_URLS` environment variable as a comma-separated list:
```bash
MTA_FEED_URLS=https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace,https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs
```

Additional feeds are available on [MTA Developer Resources](https://api.mta.info/).

### Station Name Mapping

Station names are loaded from `data/stop-names.json` if it exists. To generate this file:

1. Download MTA GTFS static data from [MTA Developer Resources](https://new.mta.info/developers)
2. Extract `stops.txt` from the zip file
3. Run: `node scripts/parse-stops.js <path-to-stops.txt> > data/stop-names.json`
4. Restart the server

The server will automatically load station names on startup. If a stop ID isn't in the mapping, it will display the stop ID itself.

## Troubleshooting

- **No departures showing**: Check that your stop IDs are correct and the MTA API key is valid
- **Feed errors**: Verify the MTA feed URL is correct and accessible
- **No station names**: Make sure you've generated `data/stop-names.json` from GTFS static data
- **CORS issues**: The frontend and backend should be on the same origin (or configure CORS)

## License

MIT
