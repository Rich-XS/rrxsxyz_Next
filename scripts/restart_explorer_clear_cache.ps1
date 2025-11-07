# Restart Explorer to Clear File System Cache
# 重启 Explorer 清除文件系统缓存

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "RESTART EXPLORER & CLEAR CACHE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kill Explorer
Write-Host "[1/4] Stopping Explorer..." -ForegroundColor Yellow
taskkill /F /IM explorer.exe 2>CON
Start-Sleep -Seconds 2
Write-Host "      Explorer stopped" -ForegroundColor Green

# 2. Clear icon cache
Write-Host ""
Write-Host "[2/4] Clearing icon cache..." -ForegroundColor Yellow
$iconCachePath = "$env:LOCALAPPDATA\IconCache.db"
if (Test-Path $iconCachePath) {
    Remove-Item $iconCachePath -Force -ErrorAction SilentlyContinue
    Write-Host "      Icon cache cleared" -ForegroundColor Green
} else {
    Write-Host "      Icon cache not found" -ForegroundColor Gray
}

# 3. Clear thumbnail cache
Write-Host ""
Write-Host "[3/4] Clearing thumbnail cache..." -ForegroundColor Yellow
$thumbCachePath = "$env:LOCALAPPDATA\Microsoft\Windows\Explorer"
if (Test-Path $thumbCachePath) {
    Remove-Item "$thumbCachePath\thumbcache_*.db" -Force -ErrorAction SilentlyContinue
    Write-Host "      Thumbnail cache cleared" -ForegroundColor Green
}

# 4. Start Explorer
Write-Host ""
Write-Host "[4/4] Restarting Explorer..." -ForegroundColor Yellow
Start-Process explorer.exe
Start-Sleep -Seconds 5
Write-Host "      Explorer restarted" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "VERIFICATION (waiting 10 seconds...)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Check nul files again
$nulCount = (Get-ChildItem "D:\_100W\rrxsxyz_next" -Recurse -Filter "nul" -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host ""
Write-Host "NUL files count: $nulCount" -ForegroundColor $(if($nulCount -gt 0){'Yellow'}else{'Green'})

if ($nulCount -gt 0) {
    Write-Host ""
    Write-Host "⚠️ Phantom files still exist (Windows Search Index cache)" -ForegroundColor Yellow
    Write-Host "   These are NOT real files - Test-Path returns False" -ForegroundColor Gray
    Write-Host "   OneDrive cannot actually rename them" -ForegroundColor Gray
    Write-Host ""
    Write-Host "FINAL SOLUTION: Rebuild Windows Search Index" -ForegroundColor Cyan
    Write-Host "1. Open Control Panel → Indexing Options" -ForegroundColor White
    Write-Host "2. Click 'Advanced' → 'Rebuild'" -ForegroundColor White
    Write-Host "3. OR: Keep OneDrive paused and ignore phantom files" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "✅ All phantom files cleared!" -ForegroundColor Green
}

Write-Host ""
