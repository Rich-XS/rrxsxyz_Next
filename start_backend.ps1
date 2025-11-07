# Backend Startup Script
# Port: 3001

Write-Host "========================================"
Write-Host "  Backend API Server Startup"
Write-Host "  Port: 3001"
Write-Host "========================================"
Write-Host ""

# Check current directory
$currentDir = Get-Location
Write-Host "Current Directory: $currentDir"

# Ensure in project root
if (-not (Test-Path ".\server")) {
    Write-Host "ERROR: server directory not found"
    Write-Host "Please run from project root"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check port 3001
Write-Host "Checking port 3001..."
$portCheck = netstat -ano | Select-String ":3001"

if ($portCheck) {
    Write-Host ""
    Write-Host "WARNING: Port 3001 is in use"
    Write-Host $portCheck
    Write-Host ""

    $choice = Read-Host "Clean old processes? (y/n)"

    if ($choice -eq 'y' -or $choice -eq 'Y') {
        Write-Host "Cleaning port 3001..."

        # Use safe cleanup script
        if (Test-Path ".\scripts\safe_port_cleanup.ps1") {
            & ".\scripts\safe_port_cleanup.ps1"
        }

        Start-Sleep -Seconds 2
        Write-Host "Port cleanup complete"
        Write-Host ""
    } else {
        Write-Host "Startup cancelled"
        Read-Host "Press Enter to exit"
        exit 0
    }
}

# Check Node.js
Write-Host "Checking Node.js..."
try {
    $nodeVersion = node --version
    Write-Host "  Node.js version: $nodeVersion"
} catch {
    Write-Host "ERROR: Node.js not found"
    Write-Host "  Install from: https://nodejs.org/"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check dependencies
Write-Host "Checking dependencies..."
if (-not (Test-Path ".\server\node_modules")) {
    Write-Host "  Installing dependencies..."
    Set-Location ".\server"
    npm install
    Set-Location ".."
    Write-Host "Dependencies installed"
} else {
    Write-Host "Dependencies OK"
}

# Check .env
Write-Host "Checking environment..."
if (-not (Test-Path ".\server\.env")) {
    Write-Host "WARNING: .env file not found"
} else {
    Write-Host "Environment OK"
}

# Start backend
Write-Host ""
Write-Host "========================================"
Write-Host "Starting Backend API Server..."
Write-Host "========================================"
Write-Host ""
Write-Host "URL: http://localhost:3001"
Write-Host "Health: http://localhost:3001/health"
Write-Host ""
Write-Host "Press Ctrl+C to stop"
Write-Host ""

Set-Location ".\server"

try {
    npm run dev
} catch {
    Write-Host ""
    Write-Host "ERROR: Server startup failed"
    Write-Host "Error: $_"
} finally {
    Set-Location ".."
}

Write-Host ""
Write-Host "Server stopped"
