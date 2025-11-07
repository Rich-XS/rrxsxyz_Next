# Frontend Startup Script
# Port: 8080

Write-Host "========================================"
Write-Host "  Frontend Server Startup"
Write-Host "  Port: 8080"
Write-Host "========================================"
Write-Host ""

# Check current directory
$currentDir = Get-Location
Write-Host "Current Directory: $currentDir"

# Ensure in project root
if (-not (Test-Path ".\duomotai")) {
    Write-Host "ERROR: duomotai directory not found"
    Write-Host "Please run from project root"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check port 8080
Write-Host "Checking port 8080..."
$portCheck = netstat -ano | Select-String ":8080"

if ($portCheck) {
    Write-Host ""
    Write-Host "WARNING: Port 8080 is in use"
    Write-Host $portCheck
    Write-Host ""

    $choice = Read-Host "Clean old processes? (y/n)"

    if ($choice -eq 'y' -or $choice -eq 'Y') {
        Write-Host "Cleaning port 8080..."

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

# Check Python
Write-Host "Checking Python..."

# Use system Python (avoid broken venv config)
$pythonExe = "C:\Users\Richard\AppData\Local\Programs\Python\Python314\python.exe"

if (-not (Test-Path $pythonExe)) {
    Write-Host "ERROR: Python314 not found at $pythonExe"
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    $pythonVersion = & $pythonExe --version 2>&1
    Write-Host "  Python version: $pythonVersion"
} catch {
    Write-Host "ERROR: Python check failed"
    Write-Host "  Error: $_"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check critical files
Write-Host "Checking files..."
$files = @(".\index.html", ".\duomotai\index.html", ".\baiwen.html")
$missing = @()

foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        $missing += $file
    }
}

if ($missing.Count -gt 0) {
    Write-Host "WARNING: Missing files:"
    foreach ($file in $missing) {
        Write-Host "  - $file"
    }
}

# Start frontend
Write-Host ""
Write-Host "========================================"
Write-Host "Starting Frontend Server..."
Write-Host "========================================"
Write-Host ""
Write-Host "Home: http://localhost:8080/"
Write-Host "Duomotai: http://localhost:8080/duomotai/"
Write-Host "Baiwen: http://localhost:8080/baiwen.html"
Write-Host ""
Write-Host "Press Ctrl+C to stop"
Write-Host ""

try {
    & $pythonExe -m http.server 8080
} catch {
    Write-Host ""
    Write-Host "ERROR: Server startup failed"
    Write-Host "Error: $_"
}

Write-Host ""
Write-Host "Server stopped"
