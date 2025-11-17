# How to Get Station Names for Stop IDs

The MTA uses stop IDs (like `104N`, `A33S`) that don't directly tell you the station name. To map these to actual station names (like "Times Square", "59th St"), you need to use the MTA's GTFS static data.

## Quick Method

1. **Download MTA GTFS Static Data**:
   - Go to: https://new.mta.info/developers
   - Look for "GTFS Schedule Data" or "Static GTFS Data"
   - Download the zip file (usually named something like `google_transit.zip`)

2. **Extract `stops.txt`**:
   - Unzip the downloaded file
   - Find `stops.txt` inside

3. **Generate the mapping**:
   ```bash
   node scripts/parse-stops.js <path-to-stops.txt> > data/stop-names.json
   ```
   
   Example:
   ```bash
   node scripts/parse-stops.js ~/Downloads/google_transit/stops.txt > data/stop-names.json
   ```

4. **Restart your server**:
   ```bash
   npm run dev
   ```
   
   You should see: `Loaded X stop names from data/stop-names.json`

5. **Verify it worked**:
   - Visit `http://localhost:3000/stops.html`
   - You should now see actual station names instead of just stop IDs!

## Alternative: Manual Lookup

If you just need a few stations:

1. Visit `http://localhost:3000/stops.html` to see available stop IDs
2. Look up the station name using:
   - MTA's official map: https://new.mta.info/maps
   - Or search online for "MTA stop ID [your-stop-id]"
3. Add to `src/server.ts` in the `MANUAL_STOP_NAMES` object:
   ```typescript
   const MANUAL_STOP_NAMES: Record<string, string> = {
     "104N": "Times Sq-42 St (Uptown)",
     "104S": "Times Sq-42 St (Downtown)",
     // Add more...
   };
   ```

## Understanding Stop IDs

Stop IDs follow patterns:
- **Numeric lines (1, 2, 3, etc.)**: `104N`, `104S` - where 104 is the station number
- **Letter lines (A, C, E, etc.)**: `A33N`, `A41S` - where A33 is the station identifier
- **Direction**: `N` = Northbound/Uptown, `S` = Southbound/Downtown, `E` = Eastbound, `W` = Westbound

The same physical station will have different stop IDs for each direction and sometimes for each line that serves it.

## Troubleshooting

- **"No stop-names.json found"**: This is normal if you haven't generated it yet. The app will still work, just showing stop IDs instead of names.
- **Can't find stops.txt**: Make sure you downloaded the GTFS **static** data (schedule data), not the real-time feeds.
- **Wrong station names**: The GTFS data is updated periodically. Re-download and regenerate if names seem outdated.

