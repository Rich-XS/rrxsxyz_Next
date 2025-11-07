Start-Sleep -Seconds 5
$od = Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue
if ($od) {
    Write-Host "SUCCESS: OneDrive is running (PID: $($od.Id))" -ForegroundColor Green
} else {
    Write-Host "ERROR: OneDrive failed to start" -ForegroundColor Red
}
