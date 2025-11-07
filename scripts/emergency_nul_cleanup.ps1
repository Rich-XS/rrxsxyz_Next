# Emergency NUL File Cleanup Script
# Date: 2025-10-29
# Purpose: Clean up NUL files in the project directory

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "EMERGENCY NUL FILE CLEANUP" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Project path
$projectPath = "D:\_100W\rrxsxyz_next"

# Step 1: Count NUL files
Write-Host "[Step 1] Scanning for NUL files..." -ForegroundColor Green
$nulFiles = Get-ChildItem -Path $projectPath -Recurse -Filter "nul" -ErrorAction SilentlyContinue
$nulCount = ($nulFiles | Measure-Object).Count

Write-Host "Found $nulCount NUL files" -ForegroundColor Yellow

if ($nulCount -eq 0) {
    Write-Host "No NUL files found. System is clean!" -ForegroundColor Green
    exit 0
}

# Step 2: Delete NUL files
Write-Host ""
Write-Host "[Step 2] Deleting NUL files..." -ForegroundColor Green

$deleted = 0
$failed = 0

foreach ($file in $nulFiles) {
    try {
        # Use \\?\ prefix to bypass Windows reserved name restrictions
        $fullPath = "\\?\$($file.FullName)"
        Remove-Item -LiteralPath $fullPath -Force -ErrorAction Stop
        $deleted++
        Write-Host "." -NoNewline -ForegroundColor Green
    } catch {
        $failed++
        Write-Host "x" -NoNewline -ForegroundColor Red
    }
}

Write-Host ""
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "CLEANUP RESULTS:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Total NUL files found: $nulCount" -ForegroundColor Yellow
Write-Host "Successfully deleted: $deleted" -ForegroundColor Green
if ($failed -gt 0) {
    Write-Host "Failed to delete: $failed" -ForegroundColor Red
}

# Step 3: Verify cleanup
Write-Host ""
Write-Host "[Step 3] Verifying cleanup..." -ForegroundColor Green
$remaining = (Get-ChildItem -Path $projectPath -Recurse -Filter "nul" -ErrorAction SilentlyContinue | Measure-Object).Count

if ($remaining -eq 0) {
    Write-Host "SUCCESS! All NUL files have been cleaned." -ForegroundColor Green
} else {
    Write-Host "WARNING: $remaining NUL files still remain." -ForegroundColor Red
    Write-Host "These files may be locked by OneDrive or other processes." -ForegroundColor Yellow
    Write-Host "Please pause OneDrive sync and try again." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Cleanup complete at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan