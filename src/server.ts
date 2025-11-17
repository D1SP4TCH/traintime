// src/server.ts
import express from "express";
import * as GtfsRealtimeBindings from "gtfs-realtime-bindings";
import * as fs from "fs";
import * as path from "path";

// node-fetch v2 uses CommonJS, so we use require
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// MTA GTFS-Realtime feed URLs
// Different lines use different endpoints
// Set MTA_FEED_URLS as comma-separated list, or use defaults
const MTA_FEED_URLS = process.env.MTA_FEED_URLS
  ? process.env.MTA_FEED_URLS.split(",")
  : [
      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace",   // A, C, E
      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",       // 1, 2, 3, 4, 5, 6, 7
      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",  // B, D, F, M
      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw",  // N, Q, R, W
      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz",    // J, Z
      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g",     // G
      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l",     // L
      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si",    // SIR (Staten Island Railway)
    ];

// MTA API key (get from https://api.mta.info/)
const MTA_API_KEY = process.env.MTA_API_KEY || "";

type Departure = {
  stopId: string;
  stationName: string;
  route: string;
  direction: "N" | "S" | "E" | "W" | string;
  time: number; // epoch ms
  destination?: string;
};

// Station name mapping - loaded from GTFS static data or manual mapping
// To populate this automatically, see scripts/parse-stops.js
let STOP_NAME_MAP: Record<string, string> = {};

// Try to load stop names from a JSON file if it exists
try {
  const stopNamesPath = path.join(__dirname, "../data/stop-names.json");
  if (fs.existsSync(stopNamesPath)) {
    const stopNamesContent = fs.readFileSync(stopNamesPath, "utf-8");
    STOP_NAME_MAP = JSON.parse(stopNamesContent);
    console.log(`Loaded ${Object.keys(STOP_NAME_MAP).length} stop names from data/stop-names.json`);
  }
} catch (err) {
  // File doesn't exist or can't be loaded - that's okay
  console.log("No stop-names.json found - using manual mappings only");
}

// Fallback manual mappings (will be overridden by loaded data)
const MANUAL_STOP_NAMES: Record<string, string> = {
  "R16N": "Times Sq–42 St (Uptown)",
  "R16S": "Times Sq–42 St (Downtown)",
};

// Merge manual mappings (they take precedence if loaded data doesn't have them)
Object.assign(STOP_NAME_MAP, MANUAL_STOP_NAMES);

// Simple in-memory cache
let cachedDepartures: Departure[] = [];
let lastFetch = 0;

async function fetchSubwayFeed(): Promise<void> {
  const allDepartures: Departure[] = [];
  
  // Fetch from all configured feeds
  for (const feedUrl of MTA_FEED_URLS) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/x-protobuf",
      };
      
      if (MTA_API_KEY) {
        headers["x-api-key"] = MTA_API_KEY;
      }

      const res = await fetch(feedUrl.trim(), { headers });
      
      if (!res.ok) {
        console.error(`HTTP ${res.status} for ${feedUrl}: ${res.statusText}`);
        continue;
      }

      const buffer = await res.arrayBuffer();
      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(buffer)
      );

      feed.entity.forEach(entity => {
        const tu = entity.tripUpdate;
        if (!tu || !tu.trip || !tu.stopTimeUpdate) return;

        const route = tu.trip.routeId || "??";
        // tripHeadsign may not exist on all trip descriptors, use optional access
        const tripHeadsign = (tu.trip as any).tripHeadsign || "";
        
        // Get the final destination stop (last stop in the trip)
        // Sort stopTimeUpdates by stop_sequence if available, or use the last one
        const stopUpdates = Array.from(tu.stopTimeUpdate);
        let finalStopId = "";
        if (stopUpdates.length > 0) {
          // Try to find the last stop by sequence, or just use the last one
          const sortedStops = stopUpdates.sort((a, b) => {
            const seqA = (a as any).stopSequence || 0;
            const seqB = (b as any).stopSequence || 0;
            return seqB - seqA; // Descending order
          });
          finalStopId = sortedStops[0]?.stopId || stopUpdates[stopUpdates.length - 1]?.stopId || "";
        }
        const finalDestination = finalStopId ? (STOP_NAME_MAP[finalStopId] || finalStopId) : tripHeadsign;

        tu.stopTimeUpdate.forEach(stu => {
          const stopId = stu.stopId;
          if (!stopId) return;

          // Use arrival time if available, otherwise departure time
          // Protobuf Long values need to be converted to numbers
          const arrivalTime = stu.arrival?.time;
          const departureTime = stu.departure?.time;
          const timeValue = arrivalTime || departureTime;
          
          if (!timeValue) return;

          // Convert Long to number if needed, then to milliseconds
          const timeSeconds = typeof timeValue === 'number' 
            ? timeValue 
            : (timeValue as any).toNumber ? (timeValue as any).toNumber() : Number(timeValue);
          const timeMs = timeSeconds * 1000;

          allDepartures.push({
            stopId,
            stationName: STOP_NAME_MAP[stopId] || stopId,
            route,
            direction: stopId.slice(-1),
            time: timeMs,
            destination: finalDestination || tripHeadsign,
          });
        });
      });

      console.log(`Fetched ${feed.entity.length} entities from ${feedUrl}`);
    } catch (err) {
      console.error(`Error fetching MTA feed ${feedUrl}:`, err);
    }
  }

  cachedDepartures = allDepartures;
  lastFetch = Date.now();
  console.log(`Updated departures: ${allDepartures.length} total`);
}

// Refresh every 20 seconds
setInterval(fetchSubwayFeed, 20000);
fetchSubwayFeed(); // Initial fetch

// API endpoint
app.get("/api/departures", (req, res) => {
  const stops = (req.query.stops as string | undefined)?.split(",") || [];
  let results = cachedDepartures;

  if (stops.length > 0) {
    results = results.filter(d => stops.includes(d.stopId));
  }

  // Filter future departures only, sort by time, limit to next 20
  const now = Date.now();
  results = results
    .filter(d => d.time >= now)
    .sort((a, b) => a.time - b.time)
    .slice(0, 20);

  res.json({
    updatedAt: lastFetch,
    departures: results,
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    lastFetch,
    cachedCount: cachedDepartures.length 
  });
});

// Debug endpoint to see available stops
app.get("/api/debug/stops", (req, res) => {
  const stopMap: Record<string, { routes: Set<string>, count: number }> = {};

  cachedDepartures.forEach(dep => {
    if (!stopMap[dep.stopId]) {
      stopMap[dep.stopId] = { routes: new Set(), count: 0 };
    }
    stopMap[dep.stopId].routes.add(dep.route);
    stopMap[dep.stopId].count++;
  });

  const stops = Object.entries(stopMap)
    .map(([stopId, info]) => ({
      stopId,
      routes: Array.from(info.routes).sort(),
      count: info.count,
      stationName: STOP_NAME_MAP[stopId] || stopId
    }))
    .sort((a, b) => a.stopId.localeCompare(b.stopId));

  res.json({ stops, total: stops.length });
});

// API endpoint to get stop names mapping
app.get("/api/stop-names", (req, res) => {
  res.json(STOP_NAME_MAP);
});

// Serve static frontend from /public
app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`MTA API Key: ${MTA_API_KEY ? "Set" : "Not set (may be required)"}`);
  console.log(`Fetching from ${MTA_FEED_URLS.length} feed(s):`);
  MTA_FEED_URLS.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
});

