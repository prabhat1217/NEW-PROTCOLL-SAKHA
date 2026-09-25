// Run AFTER "npx cap add android".
// 1) Signs every build with the SAME key -> new APK installs over the old one and keeps all data.
// 2) Asks Android to keep app data when the app is uninstalled ("Keep data" option), and allows Documents backup.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const app = path.join(root, 'android', 'app');
if (!fs.existsSync(app)) { console.error('android project not found. Run: npx cap add android'); process.exit(1); }
fs.copyFileSync(path.join(root, 'android-signing', 'protocol-sakha.keystore'), path.join(app, 'protocol-sakha.keystore'));

const gp = path.join(app, 'build.gradle');
let g = fs.readFileSync(gp, 'utf8');
if (!g.includes('protocol-sakha.keystore')) {
  const cfg = "{ storeFile file('protocol-sakha.keystore'); storePassword 'ProtocolSakha@2026'; keyAlias 'protocolsakha'; keyPassword 'ProtocolSakha@2026' }";
  g = g.replace(/(buildTypes\s*\{\s*release\s*\{)/, '$1\n            signingConfig signingConfigs.release');
  g = g.replace(/buildTypes\s*\{/, 'signingConfigs {\n        debug ' + cfg + '\n        release ' + cfg + '\n    }\n    buildTypes {');
  g = g.replace(/versionCode\s+\d+/, 'versionCode ' + Math.floor(Date.now() / 60000));
  g = g.replace(/versionName\s+"[^"]*"/, 'versionName "' + require('../package.json').version + '"');
  fs.writeFileSync(gp, g);
}

const mp = path.join(app, 'src', 'main', 'AndroidManifest.xml');
let m = fs.readFileSync(mp, 'utf8');
if (!m.includes('hasFragileUserData')) {
  m = m.replace('<application', '<application android:hasFragileUserData="true" android:requestLegacyExternalStorage="true"');
  m = m.replace('</manifest>', '    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />\n    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />\n</manifest>');
  fs.writeFileSync(mp, m);
}
console.log('Android signing + data-keep settings applied');
