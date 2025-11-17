// Script to fetch and parse subway station names from MTA GTFS
const https = require('https');
const fs = require('fs');
const path = require('path');

// Download static GTFS feed
const GTFS_URL = 'https://data.ny.gov/api/views/39hk-dx4f/files/86d93045-91da-4cc3-9cc7-2d67835549e6?download=true&filename=google_transit.zip';

console.log('Fetching MTA subway GTFS data...');

https.get(GTFS_URL, (res) => {
  if (res.statusCode === 302 || res.statusCode === 301) {
    // Follow redirect
    https.get(res.headers.location, downloadAndProcess);
  } else {
    downloadAndProcess(res);
  }
});

function downloadAndProcess(res) {
  const zipPath = path.join(__dirname, '../data/subway_static.zip');
  const fileStream = fs.createWriteStream(zipPath);

  res.pipe(fileStream);

  fileStream.on('finish', () => {
    fileStream.close();
    console.log('Download complete. Unzip manually and run parse script.');
    console.log(`File saved to: ${zipPath}`);
  });
}
