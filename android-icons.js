// Run AFTER "npx cap add android": puts PROTOCOL SAKHA icon + splash into the Android project
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const res = path.join(root, 'android', 'app', 'src', 'main', 'res');
if (!fs.existsSync(res)) { console.error('android project not found. Run: npx cap add android'); process.exit(1); }
fs.cpSync(path.join(root, 'assets', 'android-res'), res, { recursive: true, force: true });
for (const d of fs.readdirSync(res)) {
  const f = path.join(res, d, 'splash.png');
  if (/^drawable/.test(d) && fs.existsSync(f)) fs.copyFileSync(path.join(root, 'assets', 'splash.png'), f);
}
console.log('Icon + splash applied');
