param(
    [int[]]$pids = @(8220,3316)
)
function Get-ParentChain($startPid){
    $chain = @()
    $cur = Get-WmiObject Win32_Process -Filter "ProcessId=$startPid" -ErrorAction SilentlyContinue
    while ($cur) {
        $chain += @{Pid=$cur.ProcessId; Name=$cur.Name; Parent=$cur.ParentProcessId; Cmd=$cur.CommandLine}
        if ($cur.ParentProcessId -eq 0 -or $cur.ParentProcessId -eq $null) { break }
        $cur = Get-WmiObject Win32_Process -Filter "ProcessId=$($cur.ParentProcessId)" -ErrorAction SilentlyContinue
    }
    return $chain
}
foreach ($curPid in $pids) {
    Write-Output "===== Trace for PID $curPid ====="
    $chain = Get-ParentChain $curPid
    foreach ($item in $chain) {
        Write-Output "PID: $($item.Pid)  Name: $($item.Name)  Parent: $($item.Parent)"
        Write-Output "Cmd: $($item.Cmd)"
        Write-Output "----"
    }
}
