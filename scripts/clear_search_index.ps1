# Clear Windows Search Index Cache
# 清除 Windows Search 索引缓存

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "CLEAR WINDOWS SEARCH INDEX CACHE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verify Windows Search is stopped
$wsearch = Get-Service -Name "WSearch"
Write-Host "[1/4] Windows Search Status: $($wsearch.Status)" -ForegroundColor Yellow

if ($wsearch.Status -eq "Running") {
    Write-Host "      Stopping Windows Search..." -ForegroundColor Yellow
    Stop-Service -Name "WSearch" -Force
    Write-Host "      Stopped" -ForegroundColor Green
}

# 2. Delete Index files
$indexPath = "C:\ProgramData\Microsoft\Search\Data\Applications\Windows"
if (Test-Path $indexPath) {
    Write-Host ""
    Write-Host "[2/4] Deleting index files..." -ForegroundColor Yellow

    try {
        Remove-Item "$indexPath\*" -Recurse -Force -ErrorAction Stop
        Write-Host "      Index files deleted" -ForegroundColor Green
    } catch {
        Write-Host "      Warning: Some files may be in use" -ForegroundColor Yellow
    }
}

# 3. Exclude project from indexing
Write-Host ""
Write-Host "[3/4] Excluding project from indexing..." -ForegroundColor Yellow

$projectPath = "D:\_100W\rrxsxyz_next"

# Add to Windows Search exclusion list
Add-MpPreference -ExclusionPath $projectPath -ErrorAction SilentlyContinue
Write-Host "      Project excluded from indexing" -ForegroundColor Green

# 4. Verify phantom files
Write-Host ""
Write-Host "[4/4] Verifying phantom files..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$nulCount = (Get-ChildItem "$projectPath" -Recurse -Filter "nul" -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host "      Current nul file count: $nulCount" -ForegroundColor $(if($nulCount -gt 0){'Yellow'}else{'Green'})

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "1. Restart Explorer: taskkill /F /IM explorer.exe && start explorer.exe" -ForegroundColor White
Write-Host "2. Wait 30 seconds for cache to clear" -ForegroundColor White
Write-Host "3. Check again: Get-ChildItem 'D:\_100W\rrxsxyz_next' -Filter 'nul' -Recurse" -ForegroundColor White
Write-Host ""
