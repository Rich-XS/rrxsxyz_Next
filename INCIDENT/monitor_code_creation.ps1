# Monitor creation of Code.exe and log parent/commandline info
Register-WmiEvent -Query "SELECT * FROM __InstanceCreationEvent WITHIN 1 WHERE TargetInstance ISA 'Win32_Process' AND TargetInstance.Name='Code.exe'" -SourceIdentifier CodeCreateMonitor -Action {
    $t = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $proc = $Event.SourceEventArgs.NewEvent.TargetInstance
    $line = "${t} PID:$($proc.ProcessId) Parent:$($proc.ParentProcessId) Cmd:`"$($proc.CommandLine)`""
    $line | Out-File -FilePath 'D:\_100W\rrxsxyz_next\INCIDENT\code_creation.log' -Append -Encoding utf8
    Write-Host $line -ForegroundColor Cyan
}
# Keep the script running; this file is intended to be launched as a background process
while ($true) { Start-Sleep -Seconds 60 }
