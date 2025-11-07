# Scan running processes for 'claude' or 'anthropic' and write findings
$out = 'D:\_100W\rrxsxyz_next\INCIDENT\claude_processes.txt'
if (Test-Path $out) { Remove-Item $out -Force }
Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -and ($_.CommandLine -match 'claude|anthropic' -or $_.Name -match 'claude') } | Select-Object ProcessId,ParentProcessId,Name,CommandLine | Format-List | Out-File -FilePath $out -Encoding utf8
if ((Get-Content $out | Measure-Object -Line).Lines -gt 0) {
    Add-Content 'D:\_100W\rrxsxyz_next\INCIDENT\OPERATION_LOG.md' -Value ("[scan] claude processes found at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
    Write-Output "Matches written to $out"
} else {
    Write-Output 'No matching processes found.'
}
