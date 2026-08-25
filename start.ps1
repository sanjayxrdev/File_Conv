Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Starting FILE CONV Platform (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# 1. Start Backend in a new window
Write-Host "`n[1/2] Launching Backend FastAPI Server (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; if (Test-Path '.venv\Scripts\Activate.ps1') { .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload } else { python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload }"

# 2. Start Frontend in a new window
Write-Host "[2/2] Launching Frontend Vite Dev Server (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev"

Write-Host "`n===================================================" -ForegroundColor Green
Write-Host "  Services launched successfully!" -ForegroundColor Green
Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  - Backend:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  - API Docs: http://127.0.0.1:8000/api/docs" -ForegroundColor White
Write-Host "===================================================`n" -ForegroundColor Green
