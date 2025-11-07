$patterns = @('claude','anthropic','claude-code','--continue','--force --install-extension','code --force')
foreach ($pat in $patterns) {
    Write-Output "=== Searching for pattern: $pat ==="
    $procs = Get-WmiObject Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -and $_.CommandLine -like "*$pat*" }
    if ($procs) {
        foreach ($p in $procs) {
            $p | Select-Object ProcessId, ParentProcessId, Name, CommandLine | Format-List
            Write-Output '----'
        }
    } else {
        Write-Output "No matches for $pat"
    }
}
