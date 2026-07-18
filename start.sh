#!/bin/bash

echo "========================================================"
echo "  Unlimited AI Coding Agent - Local Startup Script"
echo "========================================================"
echo ""

echo "[1/3] Starting Docker Infrastructure (Postgres, Redis, ChromaDB)..."
if [ ! -f ".env" ]; then
    echo "Creating default .env file..."
    cp .env.example .env
fi
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to start Docker services. Ensure Docker Desktop/Daemon is running."
    exit 1
fi
echo ""

echo "[2/3] Setting up Next.js Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
fi
if [ ! -d "out" ]; then
    echo "Building Next.js static export..."
    npm run build
fi
cd ..
echo ""

echo "[3/3] Setting up and starting Python Backend (FastAPI)..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "Installing Python dependencies..."
pip install -r requirements.txt
# Run in background
uvicorn main:app --reload --port 3000 &
BACKEND_PID=$!
cd ..
echo ""

echo "========================================================"
echo "  Stack is running natively on a single port!"
echo "  - App URL: http://localhost:3000"
echo "  - Ensure Ollama is running separately for AI features."
echo "  Press Ctrl+C to stop all services."
echo "========================================================"

# Wait for user interrupt to kill background processes
trap "kill $BACKEND_PID" SIGINT
wait
