#!/bin/bash
# Quick Start Script for ProWorker AI Assistant

echo "🚀 ProWorker AI Assistant - Quick Start"
echo "======================================"
echo ""
echo "1️⃣  Starting Backend (Port 3001)..."
cd server
npm run dev &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
echo ""

echo "2️⃣  Starting Frontend (Port 5173)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
echo ""

echo "✅ Both servers started!"
echo ""
echo "📌 Open your browser:"
echo "   http://localhost:5173"
echo ""
echo "📌 Backend API:"
echo "   http://localhost:3001"
echo ""
echo "⏸️  To stop servers:"
echo "   kill $BACKEND_PID (backend)"
echo "   kill $FRONTEND_PID (frontend)"
echo ""
echo "💡 Tip: Use Ctrl+C in each terminal instead"
echo ""
