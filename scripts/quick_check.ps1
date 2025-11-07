# Quick OneDrive Status Check
Write-Host "OneDrive Status:" -ForegroundColor Cyan
$od = Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue
if ($od) {
    Write-Host "  Running (PID: $($od.Id))" -ForegroundColor Green
} else {
    Write-Host "  Not running" -ForegroundColor Red
}
