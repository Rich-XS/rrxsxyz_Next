# Verify if NUL files really exist
$projectPath = "D:\_100W\rrxsxyz_next"

Write-Host "Checking if NUL files are real or phantom..." -ForegroundColor Cyan
Write-Host ""

# Get all nul files
$nulFiles = Get-ChildItem -Path $projectPath -Recurse -Filter "nul" -ErrorAction SilentlyContinue

if ($nulFiles.Count -eq 0) {
    Write-Host "No NUL files found by Get-ChildItem" -ForegroundColor Green
} else {
    Write-Host "Get-ChildItem reports: $($nulFiles.Count) NUL files" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Testing first 10 files existence:" -ForegroundColor Cyan

    $real = 0
    $phantom = 0

    $nulFiles | Select-Object -First 10 | ForEach-Object {
        $exists = Test-Path -LiteralPath $_.FullName
        if ($exists) {
            Write-Host "[REAL] $($_.FullName)" -ForegroundColor Red
            $real++
        } else {
            Write-Host "[PHANTOM] $($_.FullName)" -ForegroundColor Gray
            $phantom++
        }
    }

    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "Real files: $real" -ForegroundColor Red
    Write-Host "Phantom files (index cache): $phantom" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Recommendation:" -ForegroundColor Green
if ($phantom -gt 0) {
    Write-Host "These are PHANTOM files from Windows Search Index cache!" -ForegroundColor Yellow
    Write-Host "Solution: Run exclude_from_index.bat to exclude project from indexing" -ForegroundColor Green
} elseif ($real -gt 0) {
    Write-Host "These are REAL files that need to be deleted!" -ForegroundColor Red
    Write-Host "Solution: Run ULTIMATE_NUL_REMOVER.bat as Administrator" -ForegroundColor Green
} else {
    Write-Host "System is clean - no NUL files found!" -ForegroundColor Green
}