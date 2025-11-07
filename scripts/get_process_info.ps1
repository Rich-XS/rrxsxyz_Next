$proc = Get-WmiObject Win32_Process -Filter "ProcessId = 11720"
if ($proc) {
    Write-Host "CommandLine: $($proc.CommandLine)"
    Write-Host "ParentProcessId: $($proc.ParentProcessId)"
} else {
    Write-Host "Process not found"
}
