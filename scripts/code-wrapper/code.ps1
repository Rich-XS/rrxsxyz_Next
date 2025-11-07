param([Parameter(ValueFromRemainingArguments=$true)][string[]]$args)
$log = 'D:\_100W\rrxsxyz_next\INCIDENT\code_invocations.log'
$ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$line = "$ts  $($args -join ' ')"
$line | Out-File -FilePath $log -Append -Encoding utf8
# Also write a short message to stdout so tests like `code --version` won't hang
Write-Output "[code-wrapper] Logged invocation: $line"
exit 0
