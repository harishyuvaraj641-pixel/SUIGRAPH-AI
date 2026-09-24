@echo off
title SuiGraph AI — 3D Pipeline Digital Twin
color 0B
echo.
echo   =============================================
echo     SuiGraph AI - 3D Pipeline Digital Twin
echo     AI-Based Leak Localization System
echo   =============================================
echo.
echo   Starting server...
echo.

cd /d "%~dp0"

:: Check if Node.js is available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo   [ERROR] Node.js is not installed or not in PATH.
    echo   Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Open browser after a short delay
start "" /min cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

:: Start the server
node local-server.js

pause
