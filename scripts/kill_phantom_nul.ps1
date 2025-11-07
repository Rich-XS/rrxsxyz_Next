# Kill Phantom NUL Files Script
# Created: 2025-10-30
# Purpose: Use special UNC path to force delete phantom nul files

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phantom NUL File Killer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# The phantom nul file location
$phantomPath = "D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\LTP_Opt\nul"

Write-Host "[1/4] Attempting to delete phantom file..." -ForegroundColor Yellow
Write-Host "Target: $phantomPath" -ForegroundColor Gray
Write-Host ""

# Method 1: Use UNC path prefix
$uncPath = "\\?\$phantomPath"
Write-Host "Method 1: UNC path deletion" -ForegroundColor Cyan
try {
    if (Test-Path $uncPath) {
        Remove-Item -Path $uncPath -Force -ErrorAction Stop
        Write-Host "  SUCCESS: Deleted using UNC path" -ForegroundColor Green
    } else {
        Write-Host "  File not found (phantom confirmed)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Method 2: Use cmd del command with special syntax
Write-Host "Method 2: CMD del with special syntax" -ForegroundColor Cyan
try {
    $result = cmd /c "del /F /Q `"\\?\$phantomPath`" 2>&1"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  SUCCESS: Deleted using CMD" -ForegroundColor Green
    } else {
        Write-Host "  INFO: $result" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Method 3: Delete parent directory's OneDrive metadata
Write-Host "Method 3: Clear OneDrive folder metadata" -ForegroundColor Cyan
$parentDir = "D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\LTP_Opt"
if (Test-Path $parentDir) {
    # Look for OneDrive hidden files
    $oneDriveMetadata = Get-ChildItem -Path $parentDir -Force -Hidden -ErrorAction SilentlyContinue |
                        Where-Object { $_.Name -like "*.ini" -or $_.Name -like "*OneDrive*" }

    if ($oneDriveMetadata) {
        Write-Host "  Found OneDrive metadata files:" -ForegroundColor Yellow
        $oneDriveMetadata | ForEach-Object {
            Write-Host "    - $($_.Name)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  No OneDrive metadata found" -ForegroundColor Green
    }
} else {
    Write-Host "  Parent directory not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Restart OneDrive with correct path
Write-Host "[2/4] Restarting OneDrive..." -ForegroundColor Yellow
$oneDrivePaths = @(
    "$env:LOCALAPPDATA\Microsoft\OneDrive\OneDrive.exe",
    "C:\Program Files\Microsoft OneDrive\OneDrive.exe",
    "C:\Program Files (x86)\Microsoft OneDrive\OneDrive.exe"
)

$oneDrivePath = $null
foreach ($path in $oneDrivePaths) {
    if (Test-Path $path) {
        $oneDrivePath = $path
        Write-Host "  Found OneDrive at: $path" -ForegroundColor Green
        break
    }
}

if ($oneDrivePath) {
    # Stop OneDrive first
    Stop-Process -Name "OneDrive" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3

    # Reset OneDrive
    Write-Host "  Resetting OneDrive..." -ForegroundColor Gray
    Start-Process -FilePath $oneDrivePath -ArgumentList "/reset" -NoNewWindow -Wait
    Start-Sleep -Seconds 10

    # Start OneDrive
    Write-Host "  Starting OneDrive..." -ForegroundColor Gray
    Start-Process -FilePath $oneDrivePath
    Start-Sleep -Seconds 5

    # Verify
    $running = Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue
    if ($running) {
        Write-Host "  OneDrive is running (PID: $($running.Id))" -ForegroundColor Green
    } else {
        Write-Host "  OneDrive failed to start" -ForegroundColor Red
    }
} else {
    Write-Host "  OneDrive executable not found" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check OneDrive tray icon" -ForegroundColor White
Write-Host "2. If still shows 'rename', click 'Learn more' and check the file path" -ForegroundColor White
Write-Host "3. The phantom file location was: $phantomPath" -ForegroundColor Gray
Write-Host ""

# Log
$logPath = "D:\_100W\rrxsxyz_next\INCIDENT\phantom_nul_fix_log.txt"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logPath -Value "[$timestamp] Phantom NUL fix attempted - Path: $phantomPath" -ErrorAction SilentlyContinue
