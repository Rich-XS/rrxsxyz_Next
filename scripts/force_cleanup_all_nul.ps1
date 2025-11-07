# Force cleanup all phantom NUL files
# Created: 2025-10-30
# Purpose: Clean up 4303 phantom NUL entries in file system metadata

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Force Cleanup - 4303 Phantom NUL Files" -ForegroundColor Cyan
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
    Read-Host "Press Enter to exit"
    exit 0
}

# Ask for confirmation
Write-Host "WARNING: This will attempt to remove all $totalCount phantom NUL entries" -ForegroundColor Red
Write-Host "This operation cannot be undone." -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "Do you want to continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 0
}

Write-Host ""
Write-Host "Step 2: Removing phantom NUL files..." -ForegroundColor Yellow

$successCount = 0
$failCount = 0
$errors = @()

foreach ($file in $nulFiles) {
    try {
        # Try using special UNC path
        $specialPath = "\\?\" + $file.FullName
        Remove-Item -Path $specialPath -Force -ErrorAction Stop
        $successCount++
        Write-Host "." -NoNewline -ForegroundColor Green
    } catch {
        $failCount++
        $errors += $file.FullName
        Write-Host "x" -NoNewline -ForegroundColor Red
    }

    # Progress indicator every 100 files
    if (($successCount + $failCount) % 100 -eq 0) {
        Write-Host "" # New line
        Write-Host "Progress: $($successCount + $failCount) / $totalCount" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Cleanup Results" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Total found:    $totalCount" -ForegroundColor White
Write-Host "Successfully removed: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })

if ($failCount -gt 0) {
    Write-Host ""
    Write-Host "Failed files (first 10):" -ForegroundColor Yellow
    $errors | Select-Object -First 10 | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
}

Write-Host ""
Write-Host "Step 3: Verifying cleanup..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$remainingCount = (Get-ChildItem -Path "D:\_100W" -Recurse -Filter "nul" -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host "Remaining phantom files: $remainingCount" -ForegroundColor $(if ($remainingCount -eq 0) { "Green" } else { "Yellow" })

Write-Host ""
if ($remainingCount -eq 0) {
    Write-Host "SUCCESS: All phantom NUL files have been removed!" -ForegroundColor Green
} else {
    Write-Host "WARNING: $remainingCount phantom files still remain" -ForegroundColor Yellow
    Write-Host "You may need to reboot the system again to clear these" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press Enter to close..." -ForegroundColor Gray
Read-Host
