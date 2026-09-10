@echo off
title ScanToPrint - Auto Print Spooler
color 0A

echo =======================================================
echo           SCAN TO PRINT - PRINTER SPOOLER
echo =======================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed on this computer!
    echo Please download and install Node.js from https://nodejs.org
    echo.
    pause
    exit /b
)

:: 2. Navigate to script directory
cd /d "%~dp0"

:: 3. Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo [SETUP] Installing required dependencies...
    call npm install
    echo.
)

:: 4. Start Spooler Agent
echo [STATUS] Connecting to Cloud Spooler...
echo Keep this window open while the print counter is active.
echo =======================================================
echo.

node agent.js

:: If it crashes, keep window open to see the error
echo.
color 0C
echo [ALERT] Spooler stopped unexpectedly!
pause