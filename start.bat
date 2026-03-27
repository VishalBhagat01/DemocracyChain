@echo off
title VoteChain - Startup Script
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                                                              ║
echo  ║   🗳️  VoteChain - Decentralized Voting System                ║
echo  ║                                                              ║
echo  ║   Starting all services...                                   ║
echo  ║                                                              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: Set the project root directory
set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

:: Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Node.js is not installed or not in PATH
    echo     Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Check if Python is installed (for ML and Graph services)
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  ⚠️  Python not found - ML and Graph services will not start
    set PYTHON_AVAILABLE=0
) else (
    set PYTHON_AVAILABLE=1
)

echo.
echo  ┌──────────────────────────────────────────────────────────────┐
echo  │  Services to start:                                         │
echo  │                                                              │
echo  │  1. Backend API Server     (Port 8080)                      │
echo  │  2. React Dashboard        (Port 5173)                      │
echo  │  3. ML Service             (Port 8001)                      │
echo  │  4. Graph Service          (Port 8002)                      │
echo  └──────────────────────────────────────────────────────────────┘
echo.

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo  📦 Installing root dependencies...
    call npm install
)

if not exist "frontend\node_modules" (
    echo  📦 Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

if not exist "frontend\apps\dashboard\node_modules" (
    echo  📦 Installing dashboard dependencies...
    cd frontend\apps\dashboard
    call npm install
    cd ..\..\..
)

echo.
echo  🚀 Starting services...
echo.

:: Start Backend Server (Express.js on port 8080)
echo  [1/4] Starting Backend Server on port 8080...
start "VoteChain - Backend (8080)" cmd /k "cd /d %PROJECT_ROOT%frontend && node server.js"
timeout /t 2 /nobreak >nul

:: Start React Dashboard (Vite on port 5173)
echo  [2/4] Starting React Dashboard on port 5173...
start "VoteChain - Dashboard (5173)" cmd /k "cd /d %PROJECT_ROOT%frontend\apps\dashboard && npm run dev"
timeout /t 2 /nobreak >nul

:: Start ML Service (FastAPI on port 8001)
if %PYTHON_AVAILABLE%==1 (
    if exist "frontend\apps\ml-service\main.py" (
        echo  [3/4] Starting ML Service on port 8001...
        start "VoteChain - ML Service (8001)" cmd /k "cd /d %PROJECT_ROOT%frontend\apps\ml-service && python -m uvicorn main:app --reload --port 8001"
        timeout /t 2 /nobreak >nul
    ) else (
        echo  [3/4] ML Service not found - skipping
    )
) else (
    echo  [3/4] Python not available - skipping ML Service
)

:: Start Graph Service (FastAPI on port 8002)
if %PYTHON_AVAILABLE%==1 (
    if exist "frontend\apps\graph-service\main.py" (
        echo  [4/4] Starting Graph Service on port 8002...
        start "VoteChain - Graph Service (8002)" cmd /k "cd /d %PROJECT_ROOT%frontend\apps\graph-service && python -m uvicorn main:app --reload --port 8002"
        timeout /t 2 /nobreak >nul
    ) else (
        echo  [4/4] Graph Service not found - skipping
    )
) else (
    echo  [4/4] Python not available - skipping Graph Service
)

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                                                              ║
echo  ║   ✅ All services started!                                   ║
echo  ║                                                              ║
echo  ║   Access the application:                                    ║
echo  ║                                                              ║
echo  ║   🌐 Dashboard:  http://localhost:5173                       ║
echo  ║      (Unified dashboard for Admin and Voter)                 ║
echo  ║                                                              ║
echo  ║   🔧 Backend:    http://localhost:8080                       ║
echo  ║   🤖 ML API:     http://localhost:8001                       ║
echo  ║   📊 Graph API:  http://localhost:8002                       ║
echo  ║                                                              ║
echo  ║   Login credentials:                                         ║
echo  ║   - Admin:  admin / Admin@123                                ║
echo  ║     (Elections, Candidates, Voters, Booths, Analytics)       ║
echo  ║   - Voter:  voter001 / Voter@001                             ║
echo  ║     (Vote, Results, Receipt, Profile)                        ║
echo  ║                                                              ║
echo  ║   Press any key to open the dashboard in browser...          ║
echo  ║                                                              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

pause >nul

:: Open dashboard in default browser
start "" "http://localhost:5173"

echo.
echo  💡 Tip: Close this window to keep services running
echo         Or close individual service windows to stop them
echo.
pause
