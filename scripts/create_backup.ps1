# V5.4 Backup Script
param(
    [string]$Keyword = "V54_ExpertSpeech300to400",
    [string]$TaskId = "V54"
)

$excludeDirs = @(
    'node_modules',
    '.git',
    'test_reports',
    'logs',
    'temp',
    'test-screenshots',
    'screenshots',
    '.vscode',
    '.claude\shell-snapshots'
)

$timestamp = Get-Date -Format 'yyyyMMdd_HHmm'
$backupName = "rrxsxyz_next_${timestamp}_${TaskId}_${Keyword}.zip"
# 使用脚本相对路径自动获取项目根目录
$sourcePath = if ($env:PROJECT_ROOT) { $env:PROJECT_ROOT } else { Split-Path -Parent $PSScriptRoot }
$parentDir = Split-Path -Parent $sourcePath
$destPath = Join-Path $parentDir $backupName

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Creating Backup: $backupName" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Create temporary directory
$tempDir = Join-Path $parentDir "temp_backup_$timestamp"
Write-Host "Creating temporary directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy files with exclusions
Write-Host "Copying files (excluding: $($excludeDirs -join ', '))..." -ForegroundColor Yellow
$fileCount = 0

Get-ChildItem -Path $sourcePath -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    $exclude = $false
    foreach($dir in $excludeDirs) {
        if($_.FullName -like "*\$dir\*") {
            $exclude = $true
            break
        }
    }

    if(-not $exclude) {
        $targetPath = $_.FullName.Replace($sourcePath, $tempDir)

        if($_.PSIsContainer) {
            New-Item -ItemType Directory -Path $targetPath -Force -ErrorAction SilentlyContinue | Out-Null
        } else {
            $targetDir = Split-Path -Parent $targetPath
            if(-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force -ErrorAction SilentlyContinue | Out-Null
            }
            Copy-Item -Path $_.FullName -Destination $targetPath -Force -ErrorAction SilentlyContinue
            $fileCount++

            if($fileCount % 100 -eq 0) {
                Write-Host "  Copied $fileCount files..." -ForegroundColor Gray
            }
        }
    }
}

Write-Host "Total files copied: $fileCount" -ForegroundColor Green

# Create zip archive
Write-Host ""
Write-Host "Creating zip archive..." -ForegroundColor Yellow
Compress-Archive -Path "$tempDir\*" -DestinationPath $destPath -Force

# Clean up temporary directory
Write-Host "Cleaning up temporary directory..." -ForegroundColor Yellow
Remove-Item -Path $tempDir -Recurse -Force

# Display results
$size = (Get-Item $destPath).Length
$sizeMB = [math]::Round($size/1MB, 2)

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Backup Completed Successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup file: $backupName" -ForegroundColor White
Write-Host "Location: $parentDir\" -ForegroundColor White
Write-Host "Size: $size bytes ($sizeMB MB)" -ForegroundColor White
Write-Host "Timestamp: BACKUP_DONE:$timestamp" -ForegroundColor White
Write-Host ""
