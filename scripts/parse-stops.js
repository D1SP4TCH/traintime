#!/usr/bin/env node
// Simple script to parse MTA GTFS stops.txt and generate a stop name mapping
// Usage: node scripts/parse-stops.js <path-to-stops.txt> > stop-names.json

const fs = require('fs');
const path = require('path');

const stopsFile = process.argv[2];

if (!stopsFile) {
  console.error('Usage: node scripts/parse-stops.js <path-to-stops.txt>');
  console.error('');
  console.error('To get stops.txt:');
  console.error('1. Download MTA GTFS static data from: https://new.mta.info/developers');
  console.error('2. Extract stops.txt from the zip file');
  console.error('3. Run this script with the path to stops.txt');
  process.exit(1);
}

if (!fs.existsSync(stopsFile)) {
  console.error(`Error: File not found: ${stopsFile}`);
  process.exit(1);
}

const content = fs.readFileSync(stopsFile, 'utf-8');
const lines = content.split('\n');
const mapping = {};

// Parse CSV (handles quoted fields)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Skip header
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const parts = parseCSVLine(line);
  if (parts.length >= 2) {
    const stopId = parts[0];
    const stopName = parts[1];
    if (stopId && stopName) {
      mapping[stopId] = stopName;
    }
  }
}

console.log(JSON.stringify(mapping, null, 2));

