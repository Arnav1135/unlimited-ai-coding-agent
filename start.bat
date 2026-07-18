@echo off
echo ========================================================
echo   Unlimited AI Coding Agent - Local Startup Script
echo ========================================================
echo.

echo [1/3] Starting Docker Infrastructure (Postgres, Redis, ChromaDB)...
if not exist ".env" (
    echo Creating default .env file...
    copy .env.example .env
)
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker services. Ensure Docker Desktop is running.
    pause
    exit /b %errorlevel%
)
echo.

echo [2/3] Setting up and starting Next.js Frontend...
cd frontend
if not exist "node_modules\" (
    echo Installing Node dependencies...
    call npm install
)
if not exist "out\" (
    echo Building Next.js static export...
    call npm run build
)
cd ..
echo.

echo [3/3] Setting up and starting Python Backend (FastAPI)...
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing Python dependencies...
call pip install -r requirements.txt
start "AI Coding Agent" cmd /c "uvicorn main:app --reload --port 3000"
echo.

echo ========================================================
echo   Stack is running natively on a single port! 
echo   - App URL: http://localhost:3000
echo   - Ensure Ollama is running separately for AI features.
echo ========================================================
pause
