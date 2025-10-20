
@echo off
REM ÇALIŞTIR - Grand Filo Fatura Panel v3 (Windows)
echo Installing dependencies (only first run)...
npm install
REM Open browser
start http://localhost:3000
REM Start server
node server.js
pause
