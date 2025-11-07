# OneDrive Deep Diagnostic and Fix Script
# Created: 2025-10-30
# Purpose: Find and remove nul files in OneDrive sync directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OneDrive Deep Diagnostic and Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check OneDrive root directory
Write-Host "[1/6] Checking OneDrive root directory..." -ForegroundColor Yellow
$oneDriveRoot = $env:OneDrive
if ($oneDriveRoot -and (Test-Path $oneDriveRoot)) {
    Write-Host "OneDrive root: $oneDriveRoot" -ForegroundColor Green

    # Search for nul files
    Write-Host "Searching for nul files..." -ForegroundColor Gray
    $nulFiles = @()
    Get-ChildItem -Path $oneDriveRoot -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
        if ($_.Name -eq 'nul') {
            $nulFiles += $_
            Write-Host "  Found: $($_.FullName)" -ForegroundColor Red
        }
    }

    if ($nulFiles.Count -eq 0) {
        Write-Host "  No nul files found in OneDrive directory" -ForegroundColor Green
    } else {
        Write-Host "  Total: $($nulFiles.Count) nul files" -ForegroundColor Red
    }
} else {
    Write-Host "OneDrive directory not found" -ForegroundColor Red
}
Write-Host ""

# Step 2: Check project directory
Write-Host "[2/6] Checking project directory..." -ForegroundColor Yellow
$projectDir = "D:\_100W\rrxsxyz_next"
if (Test-Path $projectDir) {
    $projectNulFiles = @()
    Get-ChildItem -Path $projectDir -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
        if ($_.Name -eq 'nul') {
            $projectNulFiles += $_
            Write-Host "  Found: $($_.FullName)" -ForegroundColor Red
        }
    }

    if ($projectNulFiles.Count -eq 0) {
        Write-Host "  No nul files in project directory" -ForegroundColor Green
    } else {
        Write-Host "  Total: $($projectNulFiles.Count) nul files" -ForegroundColor Red
    }
} else {
    Write-Host "Project directory not found" -ForegroundColor Red
}
Write-Host ""

# Step 3: Stop OneDrive
Write-Host "[3/6] Stopping OneDrive..." -ForegroundColor Yellow
Stop-Process -Name "OneDrive" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "  OneDrive stopped" -ForegroundColor Green
Write-Host ""

# Step 4: Delete all found nul files
Write-Host "[4/6] Deleting nul files..." -ForegroundColor Yellow
$totalDeleted = 0

if ($nulFiles.Count -gt 0) {
    foreach ($file in $nulFiles) {
        try {
            Remove-Item -Path $file.FullName -Force -ErrorAction Stop
            Write-Host "  Deleted: $($file.FullName)" -ForegroundColor Green
            $totalDeleted++
        } catch {
            Write-Host "  Failed: $($file.FullName) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

if ($projectNulFiles.Count -gt 0) {
    foreach ($file in $projectNulFiles) {
        try {
            Remove-Item -Path $file.FullName -Force -ErrorAction Stop
            Write-Host "  Deleted: $($file.FullName)" -ForegroundColor Green
            $totalDeleted++
        } catch {
            Write-Host "  Failed: $($file.FullName) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "  Total deleted: $totalDeleted files" -ForegroundColor Green
Write-Host ""

# Step 5: Clear OneDrive cache
Write-Host "[5/6] Clearing OneDrive cache..." -ForegroundColor Yellow
$oneDriveSettingsPath = "$env:LOCALAPPDATA\Microsoft\OneDrive\settings"
if (Test-Path $oneDriveSettingsPath) {
    try {
        Remove-Item -Path "$oneDriveSettingsPath\*" -Recurse -Force -ErrorAction Stop
        Write-Host "  Cache cleared" -ForegroundColor Green
    } catch {
        Write-Host "  Cache clear failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Settings directory not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Reset and restart OneDrive
Write-Host "[6/6] Resetting and restarting OneDrive..." -ForegroundColor Yellow
$oneDrivePath = "$env:LOCALAPPDATA\Microsoft\OneDrive\onedrive.exe"
if (Test-Path $oneDrivePath) {
    # Reset OneDrive
    Start-Process -FilePath $oneDrivePath -ArgumentList "/reset" -NoNewWindow -ErrorAction SilentlyContinue
    Write-Host "  OneDrive reset initiated" -ForegroundColor Green
    Write-Host "  Waiting 30 seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 30

    # Restart OneDrive
    Start-Process -FilePath $oneDrivePath -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 5
    Write-Host "  OneDrive restarted" -ForegroundColor Green
} else {
    Write-Host "  OneDrive executable not found" -ForegroundColor Red
}
Write-Host ""

# Verification
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$oneDriveRunning = Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue
if ($oneDriveRunning) {
    Write-Host "OneDrive is running (PID: $($oneDriveRunning.Id))" -ForegroundColor Green
} else {
    Write-Host "OneDrive is not running" -ForegroundColor Red
}
Write-Host ""
Write-Host "Please check OneDrive tray icon for 'rename' warning" -ForegroundColor Yellow
Write-Host ""

# Log
$logPath = "D:\_100W\rrxsxyz_next\INCIDENT\onedrive_deep_fix_log.txt"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logPath -Value "[$timestamp] Deep fix completed - Deleted $totalDeleted nul files" -ErrorAction SilentlyContinue
