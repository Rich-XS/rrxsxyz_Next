# 10-minute Code.exe creation monitor
$log = 'D:\_100W\rrxsxyz_next\INCIDENT\code_creation.log'
if (-not (Test-Path $log)) {
    New-Item -Path $log -ItemType File -Force | Out-Null
}
$op = 'D:\_100W\rrxsxyz_next\INCIDENT\OPERATION_LOG.md'
$query = "TargetInstance isa 'Win32_Process' and TargetInstance.Name='Code.exe'"
$action = {
    $t = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $p = $Event.SourceEventArgs.NewEvent.TargetInstance
    $line = "$t PID:$($p.ProcessId) Parent:$($p.ParentProcessId) Cmd:$($p.CommandLine)"
    Add-Content -Path 'D:\_100W\rrxsxyz_next\INCIDENT\code_creation.log' -Value $line
    Add-Content -Path 'D:\_100W\rrxsxyz_next\INCIDENT\OPERATION_LOG.md' -Value ("[monitor] " + $line)
}
$sub = Register-WmiEvent -Query $query -Action $action
Write-Output "Monitor started at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - will run 600 seconds"
Start-Sleep -Seconds 600
Unregister-Event -SubscriptionId $sub.Id
Write-Output 'Monitor duration complete.'
