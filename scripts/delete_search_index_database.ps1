# Delete Windows Search Index Database Files
# 物理删除 Windows Search 索引数据库文件（彻底清除 phantom 文件）

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DELETE WINDOWS SEARCH INDEX DATABASE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verify Windows Search is stopped and disabled
Write-Host "[1/5] Verifying Windows Search status..." -ForegroundColor Yellow
$wsearch = Get-Service -Name "WSearch"
Write-Host "      Status: $($wsearch.Status)" -ForegroundColor $(if($wsearch.Status -eq 'Stopped'){'Green'}else{'Red'})
Write-Host "      StartType: $($wsearch.StartType)" -ForegroundColor $(if($wsearch.StartType -eq 'Disabled'){'Green'}else{'Yellow'})

if ($wsearch.Status -ne "Stopped") {
    Write-Host ""
    Write-Host "      Stopping Windows Search..." -ForegroundColor Yellow
    Stop-Service -Name "WSearch" -Force
    Start-Sleep -Seconds 3
    Write-Host "      Stopped" -ForegroundColor Green
}

# 2. Delete Index Database Files
Write-Host ""
Write-Host "[2/5] Deleting index database files..." -ForegroundColor Yellow

$indexPaths = @(
    "C:\ProgramData\Microsoft\Search\Data\Applications\Windows",
    "C:\ProgramData\Microsoft\Search\Data\Temp"
)

$deletedSize = 0

foreach ($path in $indexPaths) {
    if (Test-Path $path) {
        try {
            # Calculate size before deletion
            $size = (Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum / 1MB

            Write-Host "      Deleting: $path ($([math]::Round($size, 2)) MB)" -ForegroundColor Yellow

            # Delete all files
            Remove-Item "$path\*" -Recurse -Force -ErrorAction Stop

            $deletedSize += $size
            Write-Host "      ✓ Deleted" -ForegroundColor Green
        } catch {
            Write-Host "      ✗ Error: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "      Path not found: $path" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "      Total deleted: $([math]::Round($deletedSize, 2)) MB" -ForegroundColor Cyan

# 3. Restart Explorer again
Write-Host ""
Write-Host "[3/5] Restarting Explorer..." -ForegroundColor Yellow
taskkill /F /IM explorer.exe 2>CON
Start-Sleep -Seconds 2
Start-Process explorer.exe
Start-Sleep -Seconds 5
Write-Host "      Explorer restarted" -ForegroundColor Green

# 4. Wait for system to stabilize
Write-Host ""
Write-Host "[4/5] Waiting for system to stabilize (20 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# 5. Verify phantom files are gone
Write-Host ""
Write-Host "[5/5] Verifying phantom files..." -ForegroundColor Yellow

$projectPath = "D:\_100W\rrxsxyz_next"
$nulCount = (Get-ChildItem $projectPath -Recurse -Filter "nul" -ErrorAction SilentlyContinue | Measure-Object).Count

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "RESULTS:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Phantom NUL files: $nulCount" -ForegroundColor $(if($nulCount -eq 0){'Green'}elseif($nulCount -lt 100){'Yellow'}else{'Red'})

if ($nulCount -eq 0) {
    Write-Host ""
    Write-Host "🎉 SUCCESS! All phantom files cleared!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now safely resume OneDrive sync:" -ForegroundColor White
    Write-Host "1. Open OneDrive icon in system tray" -ForegroundColor White
    Write-Host "2. Click 'Resume sync'" -ForegroundColor White
    Write-Host ""
} elseif ($nulCount -lt 100) {
    Write-Host ""
    Write-Host "⚠️ Significant improvement ($nulCount remaining)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Remaining files are likely deep cache entries." -ForegroundColor Gray
    Write-Host "Options:" -ForegroundColor White
    Write-Host "1. Resume OneDrive (it may ignore these few files)" -ForegroundColor White
    Write-Host "2. Reboot system for complete cache clear" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Phantom files persist ($nulCount remaining)" -ForegroundColor Red
    Write-Host ""
    Write-Host "This indicates deep system cache. Recommended:" -ForegroundColor Yellow
    Write-Host "1. Reboot system" -ForegroundColor White
    Write-Host "2. Run this script again after reboot" -ForegroundColor White
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Cyan
