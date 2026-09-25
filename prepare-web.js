// Copies PDF libraries into www/lib so PDF works offline (APK + EXE)
const fs = require('fs'), path = require('path');
const lib = path.join(__dirname, '..', 'www', 'lib');
fs.mkdirSync(lib, { recursive: true });
const files = [
  ['jspdf/dist/jspdf.umd.min.js', 'jspdf.umd.min.js'],
  ['html2canvas/dist/html2canvas.min.js', 'html2canvas.min.js']
];
for (const [from, to] of files) {
  fs.copyFileSync(path.join(__dirname, '..', 'node_modules', from), path.join(lib, to));
}
console.log('PDF libraries copied to www/lib');
