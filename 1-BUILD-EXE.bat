@echo off
cd /d "%~dp0"
echo === PROTOCOL SAKHA: EXE banavi rahya chhe (internet jaruri) ===
call npm install
call npm run exe
echo.
echo Taiyar! "dist" folder ma PROTOCOL-SAKHA-Setup.exe ane PROTOCOL-SAKHA-Portable.exe juo.
pause
