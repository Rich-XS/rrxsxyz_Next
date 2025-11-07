# Simple verification script after reboot
# Check if any real nul files exist

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Phantom NUL Files Verification (Post-Reboot)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Count real nul files
$realCount = 0
Get-ChildItem -Path "D:\_100W\rrxsxyz_next" -Recurse -Filter "nul" -ErrorAction SilentlyContinue | ForEach-Object {
    if (Test-Path $_.FullName) {
        $realCount++
    }
}

Write-Host "Real nul files found: $realCount" -ForegroundColor $(if ($realCount -eq 0) { "Green" } else { "Red" })

# Check Windows Search service status
$wsearch = Get-Service -Name "wsearch" -ErrorAction SilentlyContinue
if ($wsearch) {
    Write-Host "Windows Search Status: $($wsearch.Status) | StartType: $($wsearch.StartType)" -ForegroundColor $(if ($wsearch.Status -eq "Stopped") { "Green" } else { "Yellow" })
} else {
    Write-Host "Windows Search: Not found" -ForegroundColor Gray
}

Write-Host ""
if ($realCount -eq 0) {
    Write-Host "SUCCESS: Reboot worked! No phantom files found." -ForegroundColor Green
    Write-Host "You can now safely resume OneDrive sync." -ForegroundColor Green
} else {
    Write-Host "WARNING: $realCount nul files still exist!" -ForegroundColor Red
    Write-Host "Please execute Plan B (Reset OneDrive sync database)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press Enter to close..." -ForegroundColor Gray
Read-Host
