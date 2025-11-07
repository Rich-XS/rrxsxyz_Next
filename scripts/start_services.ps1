# Start RRXS.XYZ Services with logging
# 使用脚本相对路径自动获取项目根目录
$projectDir = if ($env:PROJECT_ROOT) { $env:PROJECT_ROOT } else { Split-Path -Parent $PSScriptRoot }
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting RRXS.XYZ Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ports are already occupied
$port3001 = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -eq 3001}
$port8080 = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -eq 8080}

if ($port3001) {
    Write-Host "WARNING: Port 3001 is already in use (PID: $($port3001.OwningProcess))" -ForegroundColor Yellow
}

if ($port8080) {
    Write-Host "WARNING: Port 8080 is already in use (PID: $($port8080.OwningProcess))" -ForegroundColor Yellow
}

# Start backend
Write-Host "[1/2] Starting backend service (port 3001)..." -ForegroundColor Cyan
$backendLogFile = Join-Path $projectDir "logs\backend_$timestamp.log"
New-Item -ItemType Directory -Path (Join-Path $projectDir "logs") -Force -ErrorAction SilentlyContinue | Out-Null

try {
    $backendArgs = "/C cd /d `"$projectDir\server`" && npm run dev > `"$backendLogFile`" 2>&1"
    Start-Process -FilePath "cmd.exe" -ArgumentList $backendArgs -WindowStyle Minimized
    Write-Host "  Backend started. Log: $backendLogFile" -ForegroundColor Green
    Start-Sleep -Seconds 3
} catch {
    Write-Host "  Backend failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Start frontend
Write-Host "[2/2] Starting frontend service (port 8080)..." -ForegroundColor Cyan
$frontendLogFile = Join-Path $projectDir "logs\frontend_$timestamp.log"

try {
    $frontendArgs = "/C cd /d `"$projectDir`" && python -m http.server 8080 > `"$frontendLogFile`" 2>&1"
    Start-Process -FilePath "cmd.exe" -ArgumentList $frontendArgs -WindowStyle Minimized
    Write-Host "  Frontend started. Log: $frontendLogFile" -ForegroundColor Green
    Start-Sleep -Seconds 2
} catch {
    Write-Host "  Frontend failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Verify
Write-Host ""
Write-Host "Verifying services..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

$port3001After = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -eq 3001}
$port8080After = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -eq 8080}

if ($port3001After) {
    Write-Host "  Backend (3001): LISTENING (PID: $($port3001After.OwningProcess))" -ForegroundColor Green
} else {
    Write-Host "  Backend (3001): NOT LISTENING - Check log: $backendLogFile" -ForegroundColor Red
}

if ($port8080After) {
    Write-Host "  Frontend (8080): LISTENING (PID: $($port8080After.OwningProcess))" -ForegroundColor Green
} else {
    Write-Host "  Frontend (8080): NOT LISTENING - Check log: $frontendLogFile" -ForegroundColor Red
}

Write-Host ""
Write-Host "Services URLs:" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:3001/health" -ForegroundColor White
Write-Host "  Frontend: http://localhost:8080/" -ForegroundColor White
Write-Host ""
