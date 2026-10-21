
@echo off
title PulseMesh Launcher
cd /d "%~dp0"

echo =================================
echo       STARTING PULSEMESH
echo =================================

if not exist "backend\.venv\Scripts\python.exe" (
    echo ERROR: Please run setup.bat first.
    pause
    exit /b 1
)

echo Starting Main API...
start "PulseMesh Main API" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

echo Starting Auth Service...
start "PulseMesh Auth" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python.exe -m uvicorn services.auth_service.main:app --host 127.0.0.1 --port 8001"

timeout /t 2 /nobreak >nul

echo Starting Payment Service...
start "PulseMesh Payment" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python.exe -m uvicorn services.payment_service.main:app --host 127.0.0.1 --port 8002"

timeout /t 2 /nobreak >nul

echo Starting Frontend...
start "PulseMesh Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo =================================
echo PULSEMESH START COMMANDS SENT!
echo =================================
echo Wait for the frontend URL in its window.
pause
