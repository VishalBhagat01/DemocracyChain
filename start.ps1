# DemocracyChain - Project Startup Script
# Launches all services in separate PowerShell windows

$ProjectRoot = $PSScriptRoot
$VenvActivate = "$ProjectRoot\venv\Scripts\Activate.ps1"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   DemocracyChain - Starting All Services" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Hardhat Local Node ---
$hardhatRunning = $false
try {
    $test = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 8545)
    $test.Close()
    $hardhatRunning = $true
} catch {}

if ($hardhatRunning) {
    Write-Host "[1/5] Hardhat Node already running on :8545 - reusing it" -ForegroundColor Green
} else {
    Write-Host "[1/5] Starting Hardhat Node..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot'; Write-Host 'Hardhat Node' -ForegroundColor Cyan; npx hardhat node"
    Write-Host "      Waiting for Hardhat to initialize (8s)..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 8
}

# --- Deploy contract ---
Write-Host "      Deploying contract to local Hardhat node..." -ForegroundColor DarkGray
$deployResult = & npm run deploy:local 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "      Contract deployed OK" -ForegroundColor Green
    Write-Host "      Open http://localhost:8080/admin to create your first election" -ForegroundColor DarkGray
} else {
    Write-Host "      WARNING: Contract deploy failed" -ForegroundColor Red
}

# --- 2. Frontend Server (Express) ---
Write-Host "[2/5] Starting Frontend Server (Port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot'; Write-Host 'Frontend Server' -ForegroundColor Green; node frontend/server.js"

Start-Sleep -Seconds 2

# --- 3. ML Service (FastAPI, Port 8001) ---
Write-Host "[3/5] Starting ML Service (Port 8001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot\frontend\apps\ml-service'; Write-Host 'ML Service' -ForegroundColor Magenta; & '$VenvActivate'; uvicorn main:app --reload --port 8001"

Start-Sleep -Seconds 2

# --- 4. Graph Service (FastAPI, Port 8002) ---
Write-Host "[4/5] Starting Graph Service (Port 8002)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot\frontend\apps\graph-service'; Write-Host 'Graph Service' -ForegroundColor Blue; & '$VenvActivate'; uvicorn main:app --reload --port 8002"

Start-Sleep -Seconds 2

# --- 5. Dashboard (Vite Dev Server) ---
Write-Host "[5/5] Starting Dashboard Dev Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot\frontend\apps\dashboard'; Write-Host 'Dashboard' -ForegroundColor DarkYellow; npm run dev"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " All services launched!" -ForegroundColor Green
Write-Host ""
Write-Host "  Hardhat Node    : http://127.0.0.1:8545" -ForegroundColor White
Write-Host "  Frontend Server : http://localhost:8080"  -ForegroundColor White
Write-Host "  ML Service      : http://localhost:8001"  -ForegroundColor White
Write-Host "  Graph Service   : http://localhost:8002"  -ForegroundColor White
Write-Host "  Dashboard       : http://localhost:5173"  -ForegroundColor White
Write-Host ""
Write-Host "  Login credentials:" -ForegroundColor Yellow
Write-Host "  - Admin: admin / Admin@123" -ForegroundColor White
Write-Host "    (Elections, Candidates, Voters, Booths, Analytics)" -ForegroundColor DarkGray
Write-Host "  - Voter: voter001 / Voter@001" -ForegroundColor White
Write-Host "    (Vote, Results, Receipt, Profile)" -ForegroundColor DarkGray
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
