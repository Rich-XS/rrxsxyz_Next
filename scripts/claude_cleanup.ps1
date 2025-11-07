# Claude Configuration Cleanup Script
# Purpose: Clean up large Claude history files

$claudeDir = "C:\Users\rrxs\.claude"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "CLAUDE CONFIGURATION CLEANUP" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Calculate current size
$currentSize = (Get-ChildItem -Path $claudeDir -Recurse | Measure-Object -Sum Length).Sum / 1MB
Write-Host "Current size: $([math]::Round($currentSize, 2)) MB" -ForegroundColor Yellow

# Find old session files (older than 7 days)
$oldFiles = Get-ChildItem -Path "$claudeDir\sessions" -Filter "*.jsonl" -ErrorAction SilentlyContinue |
    Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)}

$oldCount = ($oldFiles | Measure-Object).Count
$oldSize = ($oldFiles | Measure-Object -Sum Length).Sum / 1MB

Write-Host ""
Write-Host "Found $oldCount old session files (>7 days)" -ForegroundColor Yellow
Write-Host "Size to free: $([math]::Round($oldSize, 2)) MB" -ForegroundColor Yellow

if ($oldCount -gt 0) {
    Write-Host ""
    $confirm = Read-Host "Delete old session files? (y/n)"
    if ($confirm -eq 'y') {
        $oldFiles | Remove-Item -Force
        Write-Host "Deleted $oldCount old files" -ForegroundColor Green
    }
}

# Clean shell snapshots
$snapshots = Get-ChildItem -Path "$claudeDir\shell-snapshots" -ErrorAction SilentlyContinue
$snapshotSize = ($snapshots | Measure-Object -Sum Length).Sum / 1MB

if ($snapshots.Count -gt 0) {
    Write-Host ""
    Write-Host "Found $($snapshots.Count) shell snapshot files" -ForegroundColor Yellow
    Write-Host "Size: $([math]::Round($snapshotSize, 2)) MB" -ForegroundColor Yellow

    $confirm = Read-Host "Delete shell snapshots? (y/n)"
    if ($confirm -eq 'y') {
        Remove-Item -Path "$claudeDir\shell-snapshots\*" -Force
        Write-Host "Deleted shell snapshots" -ForegroundColor Green
    }
}

# Final size
Write-Host ""
$finalSize = (Get-ChildItem -Path $claudeDir -Recurse | Measure-Object -Sum Length).Sum / 1MB
$freed = $currentSize - $finalSize

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "CLEANUP RESULTS:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Original size: $([math]::Round($currentSize, 2)) MB" -ForegroundColor Yellow
Write-Host "Current size: $([math]::Round($finalSize, 2)) MB" -ForegroundColor Green
Write-Host "Space freed: $([math]::Round($freed, 2)) MB" -ForegroundColor Green
Write-Host ""
Write-Host "Cleanup complete!" -ForegroundColor Cyan