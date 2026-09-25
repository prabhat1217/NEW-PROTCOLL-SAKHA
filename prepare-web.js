// Copies PDF libraries into www/lib so PDF works offline (APK + EXE)

const fs = require('fs');
const path = require('path');

const root = __dirname;
const nodeModules = path.join(root, 'node_modules');
const lib = path.join(root, 'www', 'lib');

fs.mkdirSync(lib, { recursive: true });

const files = [
  [
    path.join(nodeModules, 'jspdf', 'dist', 'jspdf.umd.min.js'),
    path.join(lib, 'jspdf.umd.min.js')
  ],
  [
    path.join(nodeModules, 'html2canvas', 'dist', 'html2canvas.min.js'),
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

console.log('PDF libraries copied successfully to www/lib');
