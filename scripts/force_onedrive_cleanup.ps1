# Force OneDrive Cleanup Script - Admin Mode
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Force OneDrive Cleanup (Admin)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill processes
Write-Host "[1] Killing OneDrive and Explorer processes..." -ForegroundColor Yellow
taskkill /F /IM OneDrive.exe 2>$null | Out-Null
taskkill /F /IM explorer.exe 2>$null | Out-Null
Start-Sleep -Seconds 2

# Step 2: Remove directories with force
Write-Host "[2] Removing OneDrive directories..." -ForegroundColor Yellow

$dirs = @(
    "C:\Users\rrxs\AppData\Local\Microsoft\OneDrive",
    "C:\Program Files\Microsoft OneDrive",
    "C:\Program Files (x86)\Microsoft OneDrive"
)

foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "  Removing: $dir"
        Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "  Already removed: $dir"
    }
}

# Step 3: Clean registry
Write-Host "[3] Cleaning registry..." -ForegroundColor Yellow
Remove-Item -Path 'HKCU:\Software\Microsoft\OneDrive' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path 'HKLM:\Software\Microsoft\OneDrive' -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  Registry cleaned"

# Step 4: Restart Explorer
Write-Host "[4] Restarting Windows Explorer..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
Start-Process explorer.exe
Start-Sleep -Seconds 2

# Step 5: Verify
Write-Host "[5] Verifying removal..." -ForegroundColor Yellow
$remaining = 0
foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "  WARNING: $dir still exists" -ForegroundColor Red
        $remaining++
    } else {
        Write-Host "  OK: $dir removed" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
if ($remaining -eq 0) {
    Write-Host " OneDrive Cleanup SUCCESSFUL" -ForegroundColor Green
} else {
    Write-Host " OneDrive Cleanup PARTIAL ($remaining directories remain)" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Download OneDrive from Microsoft Store"
Write-Host "2. Or run: winget install Microsoft.OneDrive"
Write-Host "3. Sign in with your Microsoft account"
Write-Host ""
