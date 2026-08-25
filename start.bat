@echo off
title FILE CONV - Launcher
echo ===================================================
echo   Starting FILE CONV Platform (Backend + Frontend)
echo ===================================================
echo.

echo [1/2] Launching Backend FastAPI Server (Port 8000)...
start "FILE CONV - Backend" cmd /k "cd /d %~dp0backend && (if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload) else (uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload || python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload))"

echo [2/2] Launching Frontend Vite Dev Server (Port 5173)...
start "FILE CONV - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo   Services are running!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://127.0.0.1:8000
echo   - API Docs: http://127.0.0.1:8000/api/docs
echo ===================================================
echo.
