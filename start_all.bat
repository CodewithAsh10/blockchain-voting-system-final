@echo off
REM === Go to backend directory ===
cd backend

REM === Check if venv exists, create if not ===
if not exist venv (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

REM === Activate venv ===
call venv\Scripts\activate

REM === Check if requirements are installed ===
python -c "import pkg_resources, sys; reqs = [r.strip() for r in open('requirements.txt') if r.strip() and not r.startswith('#')]; missing = [r for r in reqs if not pkg_resources.working_set.by_key.get(r.split('==')[0].lower())]; sys.exit(1 if missing else 0)"
if errorlevel 1 (
    echo [INFO] Installing missing Python packages...
    pip install -r requirements.txt
) else (
    echo [INFO] All Python requirements already installed.
)

REM === Start app.py in a new window ===
start cmd /k "call venv\Scripts\activate && python app.py"

REM === Start ws_server.py in a new window ===
start cmd /k "call venv\Scripts\activate && python ws_server.py"

REM === Return to project root ===
cd ..

REM === Go to frontend-new directory ===
cd frontend-new

REM === Check if npm is installed ===
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install Node.js and npm first.
    pause
    exit /b 1
)

REM === Check if node_modules exists, if not then install ===
if not exist node_modules (
    echo [INFO] Installing npm packages...
    npm install
) else (
    REM === Check if react is installed in node_modules ===
    if not exist node_modules\react (
        echo [INFO] React not found. Running npm install to fix dependencies...
        npm install
    ) else (
        echo [INFO] npm packages already installed.
    )
)

REM === Start frontend in a new window ===
start cmd /k "npm start"

REM === Return to project root ===
cd ..

echo [INFO] All servers started!
pause
