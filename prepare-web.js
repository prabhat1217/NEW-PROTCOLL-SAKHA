// Prepares web files for offline PDF support and Electron/Capacitor
// Used by both APK and EXE builds.

const fs = require('fs');
const path = require('path');

const root = __dirname;
const nodeModules = path.join(root, 'node_modules');
const www = path.join(root, 'www');
const lib = path.join(www, 'lib');

// Create www directories
fs.mkdirSync(www, { recursive: true });
fs.mkdirSync(lib, { recursive: true });

// ------------------------------------------------------------
// Copy main web files into www
// ------------------------------------------------------------

const webFiles = [
  ['index.html', 'index.html'],
  ['app.html', 'app.html']
];

for (const [sourceName, destinationName] of webFiles) {
  const source = path.join(root, sourceName);
  const destination = path.join(www, destinationName);

  if (!fs.existsSync(source)) {
    throw new Error(`Required web file not found: ${source}`);
  }

  fs.copyFileSync(source, destination);

  console.log(`Copied: ${source}`);
  console.log(`To:     ${destination}`);
}

// ------------------------------------------------------------
// Copy PDF libraries into www/lib
// ------------------------------------------------------------

const files = [
  [
    path.join(
      nodeModules,
      'jspdf',
      'dist',
      'jspdf.umd.min.js'
    ),
    path.join(lib, 'jspdf.umd.min.js')
  ],
  [
    path.join(
      nodeModules,
      'html2canvas',
      'dist',
      'html2canvas.min.js'
    ),
    path.join(lib, 'html2canvas.min.js')
  ]
];

for (const [source, destination] of files) {
  if (!fs.existsSync(source)) {
    throw new Error(`Required file not found: ${source}`);
  }

  fs.copyFileSync(source, destination);

  console.log(`Copied: ${source}`);
  console.log(`To:     ${destination}`);
}

console.log('Web files prepared successfully.');
console.log('PDF libraries copied successfully to www/lib.');
console.log('www/index.html is ready for Electron.');
