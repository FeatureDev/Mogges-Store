#!/usr/bin/env pwsh
# Start Mogges Store Server

Write-Host "🚀 Starting Mogges Store..." -ForegroundColor Cyan
Write-Host ""

# Kill any existing node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Start the server
npm start