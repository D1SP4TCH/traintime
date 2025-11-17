// Script to build stop name mapping from MTA GTFS data
// This script can be run to download and parse GTFS stops.txt

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as zlib from "zlib";

// MTA GTFS static data URL (you may need to update this)
// Check https://new.mta.info/developers for the latest URL
const GTFS_STOPS_URL = "https://new.mta.info/document/20490";

// Alternative: Use a CSV parser and download stops.txt directly
// For now, we'll create a helper that uses a known source

async function downloadStopsTxt(): Promise<string> {
  // This is a placeholder - you'll need to:
  // 1. Download the GTFS zip from MTA
  // 2. Extract stops.txt
  // 3. Parse it
  
  console.log("To get stop names:");
  console.log("1. Download MTA GTFS static data from: https://new.mta.info/developers");
  console.log("2. Extract stops.txt from the zip");
  console.log("3. Run: node scripts/parse-stops.js <path-to-stops.txt>");
  
  return "";
}

// Better: Create a simple parser for stops.txt
function parseStopsTxt(content: string): Record<string, string> {
  const lines = content.split("\n");
  const mapping: Record<string, string> = {};
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV (simple version - may need proper CSV parsing for quoted fields)
    const parts = line.split(",");
    if (parts.length >= 2) {
      const stopId = parts[0].trim();
      const stopName = parts[1].trim();
      if (stopId && stopName) {
        mapping[stopId] = stopName;
      }
    }
  }
  
  return mapping;
}

// Export for use in server
export { parseStopsTxt };

