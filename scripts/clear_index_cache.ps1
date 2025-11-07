# Clear Windows Search Index Cache
Write-Host "Clearing Windows Search Index Cache..." -ForegroundColor Green

# Stop Windows Search if running
Stop-Service -Name WSearch -Force -ErrorAction SilentlyContinue

# Delete index files
$indexPath = "$env:ProgramData\Microsoft\Search\Data\Applications\Windows"
if (Test-Path $indexPath) {
    Write-Host "Removing index files from: $indexPath" -ForegroundColor Yellow
    Remove-Item -Path "$indexPath\*" -Recurse -Force -ErrorAction SilentlyContinue
}

# Clear thumbnail cache (may contain references)
Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache*.db" -Force -ErrorAction SilentlyContinue

# Clear file history cache
Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\Windows\FileHistory\*" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Index cache cleared." -ForegroundColor Green
Write-Host ""
Write-Host "Restarting Windows Search service..." -ForegroundColor Green
Start-Service -Name WSearch -ErrorAction SilentlyContinue

Write-Host "Done! Index will rebuild automatically." -ForegroundColor Cyan