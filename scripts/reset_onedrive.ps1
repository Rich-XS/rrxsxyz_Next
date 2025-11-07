# OneDrive Reset Script
# Purpose: Reset OneDrive sync database to clear phantom NUL files records

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " OneDrive Reset Script (Plan B)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Define OneDrive path
$oneDrivePath = "C:\Program Files\Microsoft OneDrive\onedrive.exe"

# Check if OneDrive exists
if (-not (Test-Path $oneDrivePath)) {
    Write-Host "ERROR: OneDrive not found at $oneDrivePath" -ForegroundColor Red
    Write-Host "Please check OneDrive installation." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Step 1: Shutting down OneDrive..." -ForegroundColor Yellow
try {
    & $oneDrivePath /shutdown
    Write-Host "OneDrive shutdown command sent." -ForegroundColor Green
    Start-Sleep -Seconds 5
} catch {
    Write-Host "Warning: Shutdown command failed (OneDrive may not be running)" -ForegroundColor Yellow
}

# Verify OneDrive process is stopped
$oneDriveProcess = Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue
if ($oneDriveProcess) {
    Write-Host "Force stopping OneDrive process..." -ForegroundColor Yellow
    Stop-Process -Name "OneDrive" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "Step 2: Resetting OneDrive sync database..." -ForegroundColor Yellow
try {
    & $oneDrivePath /reset
    Write-Host "OneDrive reset command sent." -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: OneDrive will automatically restart in 2-3 minutes." -ForegroundColor Cyan
    Write-Host "If it doesn't restart within 5 minutes, run:" -ForegroundColor Cyan
    Write-Host "  Start-Process '$oneDrivePath'" -ForegroundColor White
} catch {
    Write-Host "ERROR: Reset command failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 3: Waiting for OneDrive to restart..." -ForegroundColor Yellow
Write-Host "(This may take 2-5 minutes)" -ForegroundColor Gray

# Wait up to 5 minutes for OneDrive to restart
$maxWaitSeconds = 300
$elapsedSeconds = 0
$restartDetected = $false

while ($elapsedSeconds -lt $maxWaitSeconds) {
    Start-Sleep -Seconds 10
    $elapsedSeconds += 10

    $oneDriveProcess = Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue
    if ($oneDriveProcess) {
        $restartDetected = $true
        Write-Host ""
        Write-Host "SUCCESS: OneDrive has restarted!" -ForegroundColor Green
        Write-Host "OneDrive is now re-scanning your files." -ForegroundColor Cyan
        break
    }

    Write-Host "." -NoNewline -ForegroundColor Gray
}

Write-Host ""
Write-Host ""

if ($restartDetected) {
    Write-Host "================================================" -ForegroundColor Green
    Write-Host " OneDrive Reset Completed Successfully" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Wait for OneDrive to finish re-scanning (10-30 minutes)" -ForegroundColor White
    Write-Host "2. Check if 'Rename 2620 files' error is gone" -ForegroundColor White
    Write-Host "3. Verify project files are intact" -ForegroundColor White
    Write-Host ""
    Write-Host "You can check sync status by:" -ForegroundColor Cyan
    Write-Host "  Right-click OneDrive icon -> View sync status" -ForegroundColor White
} else {
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host " OneDrive did not auto-restart" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please manually start OneDrive by running:" -ForegroundColor Yellow
    Write-Host "  Start-Process '$oneDrivePath'" -ForegroundColor White
    Write-Host ""
    Write-Host "Or search 'OneDrive' in Start Menu and launch it." -ForegroundColor White
}

Write-Host ""
Write-Host "Press Enter to close..." -ForegroundColor Gray
Read-Host
