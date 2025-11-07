# Force cleanup all phantom NUL files - Auto-confirm version
# Created: 2025-10-30
# Purpose: Clean up 4303 phantom NUL entries in file system metadata

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Force Cleanup - Phantom NUL Files (AUTO-CONFIRM)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Find all nul files
Write-Host "Step 1: Scanning for phantom NUL files..." -ForegroundColor Yellow
$nulFiles = Get-ChildItem -Path "D:\_100W" -Recurse -Filter "nul" -ErrorAction SilentlyContinue
$totalCount = $nulFiles.Count

Write-Host "Found $totalCount phantom NUL entries" -ForegroundColor Cyan
Write-Host ""

if ($totalCount -eq 0) {
    Write-Host "No phantom files found. Exiting..." -ForegroundColor Green
    exit 0
}

Write-Host "Step 2: Removing phantom NUL files..." -ForegroundColor Yellow
Write-Host "Starting cleanup of $totalCount entries..." -ForegroundColor White
Write-Host ""

$successCount = 0
$failCount = 0
$errors = @()
$startTime = Get-Date

foreach ($file in $nulFiles) {
    try {
        # Try using special UNC path
        $specialPath = "\\?\" + $file.FullName
        Remove-Item -Path $specialPath -Force -ErrorAction Stop
        $successCount++

        # Show progress every 50 files
        if ($successCount % 50 -eq 0) {
            $elapsed = (Get-Date) - $startTime
            $rate = $successCount / $elapsed.TotalSeconds
            $remaining = ($totalCount - $successCount) / $rate
            Write-Host "Progress: $successCount / $totalCount ($(($successCount/$totalCount*100).ToString('0.0'))%) - ETA: $($remaining.ToString('0'))s" -ForegroundColor Green
        }
    } catch {
        $failCount++
        $errors += @{
            Path = $file.FullName
            Error = $_.Exception.Message
        }
    }
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Cleanup Results" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Total found:          $totalCount" -ForegroundColor White
Write-Host "Successfully removed: $successCount" -ForegroundColor Green
Write-Host "Failed:               $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "Duration:             $($duration.TotalSeconds.ToString('0.0')) seconds" -ForegroundColor Gray
Write-Host ""

if ($failCount -gt 0) {
    Write-Host "Failed files (first 10):" -ForegroundColor Yellow
    $errors | Select-Object -First 10 | ForEach-Object {
        Write-Host "  Path: $($_.Path)" -ForegroundColor Gray
        Write-Host "  Error: $($_.Error)" -ForegroundColor Gray
        Write-Host ""
    }
}

Write-Host "Step 3: Verifying cleanup..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$remainingCount = (Get-ChildItem -Path "D:\_100W" -Recurse -Filter "nul" -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host "Remaining phantom files: $remainingCount" -ForegroundColor $(if ($remainingCount -eq 0) { "Green" } else { "Yellow" })

Write-Host ""
if ($remainingCount -eq 0) {
    Write-Host "SUCCESS: All phantom NUL files have been removed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Check OneDrive sync status" -ForegroundColor White
    Write-Host "2. Verify 'Rename 1 item' error is gone" -ForegroundColor White
    Write-Host "3. If error persists, run OneDrive reset again" -ForegroundColor White
} else {
    Write-Host "WARNING: $remainingCount phantom files still remain" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Recommendations:" -ForegroundColor Cyan
    Write-Host "1. Reboot the system to clear kernel memory cache" -ForegroundColor White
    Write-Host "2. Run CHKDSK D: /F to repair file system metadata" -ForegroundColor White
    Write-Host "3. Check Event Viewer for disk errors" -ForegroundColor White
}

Write-Host ""
Write-Host "Cleanup completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
