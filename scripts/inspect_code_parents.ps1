$pidsToCheck = @(3316,3484,4204,5944,6292,8220,8420,10008,16412,16588,20840,21320,22188)
foreach ($p in $pidsToCheck) {
    $proc = Get-WmiObject Win32_Process -Filter "ProcessId=$p" -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Output "=== PID $p ==="
        $proc | Select-Object ProcessId, ParentProcessId, CommandLine | Format-List
    } else {
        Write-Output "PID $p not found"
    }
}