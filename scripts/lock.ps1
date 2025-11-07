<#
  scripts/lock.ps1
  Simple file lock helper for agent workflows.
  Usage:
    # Acquire lock (returns 0 on success)
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/lock.ps1 -Acquire -Name "progress-md-lock" -Timeout 10

    # Release lock
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/lock.ps1 -Release -Name "progress-md-lock"
#>

param(
  [switch]$Acquire,
  [switch]$Release,
  [string]$Name = 'progress-md-lock',
  [int]$Timeout = 10
)

$lockFile = Join-Path $env:TEMP ($Name + '.lock')

function Acquire-Lock {
  $sw = Get-Date
  while (Test-Path $lockFile) {
    Start-Sleep -Seconds 1
    if ((Get-Date) - $sw -gt (New-TimeSpan -Seconds $Timeout)) {
      Write-Error "Lock timeout waiting for $lockFile"
      exit 2
    }
  }
  # create lock
  try {
    '' | Out-File -FilePath $lockFile -Encoding utf8 -Force
    Write-Output "LOCK_ACQUIRED:$lockFile"
    exit 0
  } catch {
    Write-Error "Failed to create lock: $_"
    exit 3
  }
}

function Release-Lock {
  if (Test-Path $lockFile) {
    try {
      Remove-Item $lockFile -Force
      Write-Output "LOCK_RELEASED:$lockFile"
      exit 0
    } catch {
      Write-Error "Failed to remove lock: $_"
      exit 4
    }
  } else {
    Write-Output "LOCK_NOT_FOUND:$lockFile"
    exit 1
  }
}

if ($Acquire) { Acquire-Lock }
elseif ($Release) { Release-Lock }
else {
  Write-Output "Usage: -Acquire|-Release [-Name <lockname>] [-Timeout <sec>]"
  exit 1
}
