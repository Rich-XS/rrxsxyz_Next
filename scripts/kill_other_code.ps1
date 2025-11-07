# Kill Code.exe processes except interactive ones (those with a MainWindowTitle)
$interactive = Get-Process Code -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -ne '' }
if (-not $interactive) {
    Write-Output 'No interactive Code process found; aborting.'
    exit 2
}
$interactiveIds = $interactive | Select-Object -ExpandProperty Id
Write-Output "Interactive Code PIDs to keep: $($interactiveIds -join ',')"
$targets = Get-Process Code -ErrorAction SilentlyContinue | Where-Object { $interactiveIds -notcontains $_.Id }
if (-not $targets) {
    Write-Output 'No other Code processes to kill.'
    exit 0
}
Write-Output '=== Candidates to be killed ==='
$targets | Select-Object Id,ProcessName,StartTime,Path,@{Name='MainWindowTitle';Expression={$_.MainWindowTitle}} | Format-Table -AutoSize
Write-Output 'Killing now...'
foreach ($t in $targets) {
    try {
        Stop-Process -Id $t.Id -Force -ErrorAction Stop
        Write-Output "Killed PID:$($t.Id)"
    } catch {
        Write-Output "Failed to kill PID:$($t.Id) - $_"
    }
}
Write-Output 'Done.'
