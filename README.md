# MTA Departure Board

A real-time subway departure board designed for tablet display. Polls MTA GTFS-Realtime feeds and displays upcoming train departures.

## Features

- Real-time MTA subway departure information across all lines
- Clean, tablet-optimized UI
- Auto-refreshing every 15 seconds
- Multi-station selection with search
- Interactive station picker UI
- Automatic station name mapping from GTFS static data
- Groups departures by station for easy viewing
- **Smart feed optimization** - automatically fetches only the subway lines you're tracking

## Setup

### Prerequisites

- Node.js 18+ and npm

### Quick Start

1. Clone or download this repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser

5. On first visit, you'll see a welcome screen - click "Choose Stations" to select your stations

That's it! The app comes pre-configured with station names and popular stations. The MTA API is public and doesn't require an API key for basic use.

### Station Selection

The app includes a built-in station picker:
- Click the settings (⚙️) button to open station selection
- Browse popular stations or use the search box
- Select multiple stations by clicking them
- Click "Save" to update your departure board

Station selections are saved in your browser's local storage.

**Performance Note**: When you save your station selections, the app automatically configures the server to only fetch MTA feeds for the subway lines you're tracking. For example, if you only select stations on the 1 and A lines, the server will only fetch 2 feeds instead of all 8, reducing bandwidth usage by 75%!

## Advanced Configuration

### MTA API Key (Optional)

The MTA API is public and works without an API key. However, if you have rate limiting issues or want to use an API key, you can set it via environment variable:

```bash
MTA_API_KEY=your_api_key_here
```

Get your API key from [MTA Developer Resources](https://api.mta.info/) if needed.

### How Feed Optimization Works

The app intelligently manages which MTA feeds to fetch:

**Automatic Mode** (Recommended):
- When you select stations in the UI, the app automatically determines which subway lines you need
- The server then only fetches feeds for those specific lines
- This happens transparently - no configuration needed!

**Manual Override** (Optional):
If you want to manually control which feeds are fetched regardless of station selection, set the `MTA_FEED_URLS` environment variable:

```bash
# Only fetch A/C/E and 1/2/3/4/5/6/7 lines
MTA_FEED_URLS=https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace,https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs
```

**Available Feed URLs:**
- **A, C, E**: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace`
- **1, 2, 3, 4, 5, 6, 7**: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs`
- **B, D, F, M**: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm`
- **N, Q, R, W**: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw`
- **J, Z**: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz`
- **G**: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g`
- **L**: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l`
- **SIR**: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si`

More feeds available at [MTA Developer Resources](https://api.mta.info/).

### Viewing Available Stops

To see all available stops and their IDs:
1. Start the server: `npm run dev`
2. Visit `http://localhost:3000/api/debug/stops` to see a JSON list of all stops
3. Or use the built-in station picker in the UI (click the ⚙️ button)

Stop ID format:
- **Numeric lines (1, 2, 3, etc.)**: `104N`, `104S` (N=Northbound, S=Southbound)
- **Letter lines (A, C, E, etc.)**: `A33N`, `A41S`

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
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. (Optional) Set environment variables:
   - `MTA_API_KEY` - MTA API key (not required)
   - `PORT` - Server port (usually auto-detected)
6. Deploy

### Option 2: Raspberry Pi / Local Network

1. Install Node.js on your Pi
2. Clone this repo and install dependencies: `npm install`
3. Build the project: `npm run build`
4. Start the server: `npm start`
5. Access from tablet at `http://your-pi-ip:3000`

## Using on a Tablet

1. Connect tablet to Wi-Fi
2. Open the app URL in Chrome/Safari
3. Add to home screen / "Install app"
4. Enable full-screen mode
5. Disable auto-sleep or use a kiosk app

## API Endpoints

- `GET /` - Frontend departure board UI
- `GET /api/departures?stops=126N,126S` - Get departures for specific stops (JSON)
- `GET /api/debug/stops` - List all available stops with routes (JSON)
- `GET /api/stop-names` - Get station name mappings (JSON)
- `POST /api/configure-feeds` - Configure which subway line feeds to fetch (JSON body: `{"routes": ["1", "A"]}`)
- `GET /health` - Health check endpoint

## Developer Information

### Station Name Data

Station names are pre-loaded from `data/stop-names.json`. This file is included in the repository and contains mappings from stop IDs to station names.

To regenerate this file (if needed):
1. Download GTFS static data from [MTA Developer Resources](https://new.mta.info/developers)
2. Extract `stops.txt` from the zip file
3. Run: `node scripts/parse-stops.js <path-to-stops.txt> > data/stop-names.json`
4. Restart the server

### Project Structure

```
traintime/
├── src/
│   └── server.ts          # Express server & MTA API integration
├── public/
│   └── index.html         # Frontend UI with station picker
├── data/
│   └── stop-names.json    # Station name mappings
├── scripts/
│   └── parse-stops.js     # GTFS data parser
└── dist/                  # Compiled TypeScript output
```

## Troubleshooting

- **No departures showing**:
  - Make sure you've selected stations using the settings (⚙️) button
  - Check that the MTA feeds are accessible (the API doesn't require authentication)
  - Check browser console for any errors

- **Station names showing as IDs**:
  - The `data/stop-names.json` file should be included in the repo
  - If missing, see "Developer Information" section to regenerate it

- **Can't select stations**:
  - Try clearing the search box - stations should appear
  - Check browser console for JavaScript errors

- **Feed errors**:
  - MTA feeds occasionally have outages - check [MTA Status](https://www.mta.info/)
  - Try again in a few minutes

## License

MIT
