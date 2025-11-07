# Aggressive Claude Cleanup Script
# Target: Free ~750MB by cleaning projects and file-history

$claudeDir = "C:\Users\rrxs\.claude"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "AGGRESSIVE CLAUDE CLEANUP" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Show current size
$beforeSize = (Get-ChildItem $claudeDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum / 1MB
Write-Host "Current total: $([math]::Round($beforeSize, 2)) MB" -ForegroundColor Yellow
Write-Host ""

# Target 1: Projects directory (660MB)
$projectsDir = Join-Path $claudeDir "projects"
if (Test-Path $projectsDir) {
    $projectsSize = (Get-ChildItem $projectsDir -File -Recurse -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum / 1MB
    Write-Host "Found: projects directory ($([math]::Round($projectsSize, 2)) MB)" -ForegroundColor Yellow
    Write-Host "This contains old project session data" -ForegroundColor Gray
    Write-Host ""

    $confirm = Read-Host "Delete projects directory? (y/n)"
    if ($confirm -eq 'y') {
        Remove-Item $projectsDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Deleted projects directory" -ForegroundColor Green
    }
}

# Target 2: File-history directory (132MB)
$fileHistoryDir = Join-Path $claudeDir "file-history"
if (Test-Path $fileHistoryDir) {
    $historySize = (Get-ChildItem $fileHistoryDir -File -Recurse -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum / 1MB
    Write-Host ""
    Write-Host "Found: file-history directory ($([math]::Round($historySize, 2)) MB)" -ForegroundColor Yellow
    Write-Host "This contains file edit snapshots" -ForegroundColor Gray
    Write-Host ""

    $confirm = Read-Host "Delete file-history directory? (y/n)"
    if ($confirm -eq 'y') {
        Remove-Item $fileHistoryDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Deleted file-history directory" -ForegroundColor Green
    }
}

# Target 3: Debug directory (68MB)
$debugDir = Join-Path $claudeDir "debug"
if (Test-Path $debugDir) {
    $debugSize = (Get-ChildItem $debugDir -File -Recurse -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum / 1MB
    Write-Host ""
    Write-Host "Found: debug directory ($([math]::Round($debugSize, 2)) MB)" -ForegroundColor Yellow
    Write-Host "This contains debug logs" -ForegroundColor Gray
    Write-Host ""

    $confirm = Read-Host "Delete debug directory? (y/n)"
    if ($confirm -eq 'y') {
        Remove-Item $debugDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Deleted debug directory" -ForegroundColor Green
    }
}

# Target 4: Shell snapshots
$snapshotsDir = Join-Path $claudeDir "shell-snapshots"
if (Test-Path $snapshotsDir) {
    Write-Host ""
    Write-Host "Found: shell-snapshots (295 files)" -ForegroundColor Yellow
    $confirm = Read-Host "Delete shell snapshots? (y/n)"
    if ($confirm -eq 'y') {
        Remove-Item "$snapshotsDir\*" -Force -ErrorAction SilentlyContinue
        Write-Host "Deleted shell snapshots" -ForegroundColor Green
    }
}

# Show final size
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
$afterSize = (Get-ChildItem $claudeDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum / 1MB
$freed = $beforeSize - $afterSize

Write-Host "Original: $([math]::Round($beforeSize, 2)) MB" -ForegroundColor Yellow
Write-Host "Current: $([math]::Round($afterSize, 2)) MB" -ForegroundColor Green
Write-Host "Freed: $([math]::Round($freed, 2)) MB" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Cleanup complete!" -ForegroundColor Green