# Aggressive OneDrive Cleanup - Force Delete with UNC paths
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Aggressive OneDrive Cleanup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all explorer instances
Write-Host "[1] Terminating all explorer processes..." -ForegroundColor Yellow
taskkill /F /IM explorer.exe 2>$null | Out-Null
taskkill /F /IM OneDrive.exe 2>$null | Out-Null
Start-Sleep -Seconds 3

# Step 2: Force delete with UNC paths
Write-Host "[2] Force deleting with UNC paths..." -ForegroundColor Yellow

$paths = @(
    "C:\Users\rrxs\AppData\Local\Microsoft\OneDrive",
    "C:\Program Files\Microsoft OneDrive"
)

foreach ($path in $paths) {
    if (Test-Path $path) {
        Write-Host "  Attempting to delete: $path"
        try {
            # Method 1: Direct force delete
            Remove-Item -LiteralPath $path -Recurse -Force -ErrorAction Stop
            Write-Host "    Success (Method 1)" -ForegroundColor Green
        } catch {
            Write-Host "    Method 1 failed: $_" -ForegroundColor Yellow
            try {
                # Method 2: UNC path with takeown
                cmd /c "takeown /F `"$path`" /R /D Y 2>$null"
                cmd /c "icacls `"$path`" /grant administrators:F /T 2>$null"
                Remove-Item -LiteralPath $path -Recurse -Force -ErrorAction Stop
                Write-Host "    Success (Method 2 - takeown)" -ForegroundColor Green
            } catch {
                Write-Host "    Method 2 failed: $_" -ForegroundColor Red
            }
        }
    }
}

# Step 3: Clean OneDrive cache and temp files
Write-Host "[3] Cleaning OneDrive cache..." -ForegroundColor Yellow
Remove-Item -Path "$env:LocalAppData\Microsoft\OneDrive\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\Microsoft\OneDrive\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  Cache cleaned"

# Step 4: Restart Explorer
Write-Host "[4] Restarting Explorer..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
Start-Process explorer.exe
Start-Sleep -Seconds 3

# Step 5: Final verification
Write-Host "[5] Final verification..." -ForegroundColor Yellow
$count = 0
foreach ($path in $paths) {
    if (Test-Path $path) {
        Write-Host "  REMAINING: $path" -ForegroundColor Red
        $count++
    } else {
        Write-Host "  REMOVED: $path" -ForegroundColor Green
    }
}

Write-Host ""
if ($count -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " Cleanup SUCCESSFUL" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host " Cleanup PARTIAL ($count remain)" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
}
