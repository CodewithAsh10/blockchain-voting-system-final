@echo off
setlocal enabledelayedexpansion

REM === Go to backend directory ===
cd /d %~dp0backend

REM === Check if venv exists, create if not ===
if not exist venv (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

REM === Activate venv ===
call venv\Scripts\activate

REM === Install Python requirements ===
pip install -r requirements.txt

REM === Start app.py in a new window ===
start "Backend API" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && python app.py"

REM === Start ws_server.py in a new window ===
start "WebSocket Server" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && python ws_server.py"

REM === Return to project root ===
cd /d %~dp0

REM === Go to frontend-new directory ===
cd frontend-new

REM === Try npm start first ===
echo [INFO] Trying npm start first...
npm start
if errorlevel 1 (
    echo [INFO] npm start failed, running npm install...
    npm install --no-audit --no-fund
    if errorlevel 1 (
        echo [ERROR] npm install failed. See above for details.
        pause
        exit /b 1
    )
    echo [INFO] Retrying npm start...
    npm start
    if errorlevel 1 (
        echo [ERROR] npm start failed again. See above for details.
        pause
        exit /b 1
    )
)

REM === Start frontend in a new window ===
start "Frontend" cmd /k "cd /d %~dp0frontend-new && npm start && pause"

REM === Return to project root ===
cd /d %~dp0

echo [INFO] All servers attempted to start! Check the opened windows for errors.
pause
