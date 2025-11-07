# Check if ports 3001 and 8080 are listening
Write-Host "Checking ports 3001 and 8080..." -ForegroundColor Cyan

$ports = @(3001, 8080)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -eq $port}
    if ($conn) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        Write-Host "  Port $port : LISTENING (PID: $($conn.OwningProcess), Process: $($proc.ProcessName))" -ForegroundColor Green
    } else {
        Write-Host "  Port $port : NOT LISTENING" -ForegroundColor Red
    }
}

# Also try to test accessibility
Write-Host "`nTesting accessibility..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "  Backend (3001/health): OK - Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  Backend (3001/health): FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "  Frontend (8080/): OK - Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  Frontend (8080/): FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
