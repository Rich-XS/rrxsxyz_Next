# Safe Claude Cleanup - Move to Temp First
# 安全清理方案：先移动到临时目录，验证无问题后再删除

$claudeDir = "C:\Users\rrxs\.claude"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "C:\Temp\claude_backup_$timestamp"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "SAFE CLAUDE CLEANUP (Move to Temp)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Create backup directory
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
Write-Host "Created backup directory: $backupDir" -ForegroundColor Green
Write-Host ""

# Show current size
$beforeSize = (Get-ChildItem $claudeDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum / 1MB
Write-Host "Current total: $([math]::Round($beforeSize, 2)) MB" -ForegroundColor Yellow
Write-Host ""

$totalFreed = 0

# Move projects directory (660MB)
$projectsDir = Join-Path $claudeDir "projects"
if (Test-Path $projectsDir) {
    $projectsSize = (Get-ChildItem $projectsDir -File -Recurse -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum / 1MB
    Write-Host "[1/4] Moving projects directory ($([math]::Round($projectsSize, 2)) MB)..." -ForegroundColor Yellow

    try {
        Move-Item -Path $projectsDir -Destination $backupDir -Force -ErrorAction Stop
        Write-Host "      Moved to: $backupDir\projects" -ForegroundColor Green
        $totalFreed += $projectsSize
    } catch {
        Write-Host "      Failed: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Move file-history directory (132MB)
$fileHistoryDir = Join-Path $claudeDir "file-history"
if (Test-Path $fileHistoryDir) {
    $historySize = (Get-ChildItem $fileHistoryDir -File -Recurse -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum / 1MB
    Write-Host "[2/4] Moving file-history directory ($([math]::Round($historySize, 2)) MB)..." -ForegroundColor Yellow

    try {
        Move-Item -Path $fileHistoryDir -Destination $backupDir -Force -ErrorAction Stop
        Write-Host "      Moved to: $backupDir\file-history" -ForegroundColor Green
        $totalFreed += $historySize
    } catch {
        Write-Host "      Failed: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Move debug directory (68MB)
$debugDir = Join-Path $claudeDir "debug"
if (Test-Path $debugDir) {
    $debugSize = (Get-ChildItem $debugDir -File -Recurse -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum / 1MB
    Write-Host "[3/4] Moving debug directory ($([math]::Round($debugSize, 2)) MB)..." -ForegroundColor Yellow

    try {
        Move-Item -Path $debugDir -Destination $backupDir -Force -ErrorAction Stop
        Write-Host "      Moved to: $backupDir\debug" -ForegroundColor Green
        $totalFreed += $debugSize
    } catch {
        Write-Host "      Failed: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Move shell snapshots
$snapshotsDir = Join-Path $claudeDir "shell-snapshots"
if (Test-Path $snapshotsDir) {
    Write-Host "[4/4] Moving shell-snapshots (295 files)..." -ForegroundColor Yellow

    $snapshotBackup = Join-Path $backupDir "shell-snapshots"
    New-Item -Path $snapshotBackup -ItemType Directory -Force | Out-Null

    try {
        Get-ChildItem $snapshotsDir -File | ForEach-Object {
            Move-Item -Path $_.FullName -Destination $snapshotBackup -Force -ErrorAction SilentlyContinue
        }
        Write-Host "      Moved to: $snapshotBackup" -ForegroundColor Green
    } catch {
        Write-Host "      Failed: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Show final size
$afterSize = (Get-ChildItem $claudeDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum / 1MB

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "CLEANUP RESULTS:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Original size: $([math]::Round($beforeSize, 2)) MB" -ForegroundColor Yellow
Write-Host "Current size: $([math]::Round($afterSize, 2)) MB" -ForegroundColor Green
Write-Host "Space freed: $([math]::Round($totalFreed, 2)) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backup location: $backupDir" -ForegroundColor Magenta
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "1. Test Claude Code to ensure it works normally" -ForegroundColor White
Write-Host "2. If OK: Run delete_backup.bat to permanently delete" -ForegroundColor White
Write-Host "3. If PROBLEM: Run restore_backup.bat to restore files" -ForegroundColor White
Write-Host ""

# Create helper scripts
$deleteBat = @"
@echo off
echo Permanently deleting Claude backup...
echo Location: $backupDir
echo.
pause
rd /s /q "$backupDir"
echo.
echo Backup deleted successfully!
pause
"@

$restoreBat = @"
@echo off
echo Restoring Claude backup...
echo.
if not exist "$backupDir" (
    echo ERROR: Backup directory not found!
    pause
    exit /b 1
)

echo Moving files back to C:\Users\rrxs\.claude...
xcopy /E /I /Y "$backupDir\*" "C:\Users\rrxs\.claude\"

echo.
echo Restore complete!
echo.
echo Backup files are still in: $backupDir
echo You can delete them manually if restore was successful.
pause
"@

Set-Content -Path "$backupDir\delete_backup.bat" -Value $deleteBat -Encoding ASCII
Set-Content -Path "$backupDir\restore_backup.bat" -Value $restoreBat -Encoding ASCII

Write-Host "Helper scripts created in backup directory:" -ForegroundColor Green
Write-Host "  - delete_backup.bat  (permanently delete backup)" -ForegroundColor Gray
Write-Host "  - restore_backup.bat (restore if needed)" -ForegroundColor Gray
Write-Host ""
Write-Host "Cleanup complete! Please test Claude Code now." -ForegroundColor Green