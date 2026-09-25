@echo off
cd /d "%~dp0"
echo === PROTOCOL SAKHA: APK banavi rahya chhe (JDK 17 + Android SDK jaruri) ===
call npm install
call npm run prepare:web
if not exist android call npx cap add android
call node scripts/android-config.js
call node scripts/android-icons.js
call npx cap sync android
cd android
call gradlew.bat assembleDebug
cd ..
if not exist dist mkdir dist
copy /Y android\app\build\outputs\apk\debug\app-debug.apk dist\PROTOCOL-SAKHA.apk
echo.
echo Taiyar! dist\PROTOCOL-SAKHA.apk
pause
