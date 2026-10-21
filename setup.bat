
@echo off
title PulseMesh Setup
cd /d "%~dp0"

echo =================================
echo       PULSEMESH SETUP
echo =================================

echo.
echo Checking Python...
python --version
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python first.
    pause
    exit /b 1
)

echo.
echo Checking Node.js and npm...
npm --version
if errorlevel 1 (
    echo ERROR: Node.js and npm are not installed or not in PATH.
    pause
    exit /b 1
)

echo.
echo Creating Python virtual environment...
if not exist "backend\.venv\Scripts\python.exe" (
    python -m venv backend\.venv
    if errorlevel 1 goto error
)

echo.
echo Installing Python dependencies...
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
if errorlevel 1 goto error

echo.
echo Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 goto error
cd ..

echo.
echo =================================
echo       SETUP COMPLETED!
echo =================================
echo You can now run start.bat.
pause
exit /b 0

:error
echo.
echo SETUP FAILED. Please check the error above.
pause
exit /b 1
