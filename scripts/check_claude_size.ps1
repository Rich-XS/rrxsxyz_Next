# Check Claude directory sizes
Write-Host "Analyzing Claude configuration directory sizes..." -ForegroundColor Cyan
Write-Host ""

$claudeDir = "C:\Users\rrxs\.claude"

# Check sessions directory
$sessionsDir = Join-Path $claudeDir "sessions"
if (Test-Path $sessionsDir) {
    $sessionSize = (Get-ChildItem $sessionsDir -File -Recurse -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum / 1MB
    $sessionCount = (Get-ChildItem $sessionsDir -File -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Host "Sessions: $([math]::Round($sessionSize, 2)) MB ($sessionCount files)" -ForegroundColor Yellow
}

# Check shell-snapshots directory
$snapshotsDir = Join-Path $claudeDir "shell-snapshots"
if (Test-Path $snapshotsDir) {
    $snapshotSize = (Get-ChildItem $snapshotsDir -File -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum / 1MB
    $snapshotCount = (Get-ChildItem $snapshotsDir -File -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Host "Shell Snapshots: $([math]::Round($snapshotSize, 2)) MB ($snapshotCount files)" -ForegroundColor Yellow
}

# Check logs directory
$logsDir = Join-Path $claudeDir "logs"
if (Test-Path $logsDir) {
    $logSize = (Get-ChildItem $logsDir -File -Recurse -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum / 1MB
    $logCount = (Get-ChildItem $logsDir -File -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Host "Logs: $([math]::Round($logSize, 2)) MB ($logCount files)" -ForegroundColor Yellow
}

# Check for other directories
Get-ChildItem $claudeDir -Directory | Where-Object { $_.Name -notin @('sessions', 'shell-snapshots', 'logs') } | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -File -Recurse -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum / 1MB
    $count = (Get-ChildItem $_.FullName -File -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Host "$($_.Name): $([math]::Round($size, 2)) MB ($count files)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Total: $([math]::Round(((Get-ChildItem $claudeDir -File -Recurse -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum / 1MB), 2)) MB" -ForegroundColor Green