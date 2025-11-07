<#
  auto_append_timestamps.ps1
  非交互式脚本：自动备份并向核心文件追加时间戳

  行为：
  - 备份 `CLAUDE.md`, `Project_CPG.md`, `Progress_CPG.md` 到 `.claude/backups/`（按短时间戳命名）
  - 向 `CLAUDE.md` 追加完整时间戳（格式：YYYY-MM-DD HH:mm:ss）作为一行：**Last Updated**: ...
  - 向 `Project_CPG.md` 与 `Progress_CPG.md` 追加短时间戳（格式：YYMMDDHHmm）作为一行：Last Updated: ...
  - 非交互式执行，不会提示用户；默认直接执行（应仅在 AcceptEdits=FULL 或用户授权的环境下运行）

  调用示例（立即执行，无提示）：
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/auto_append_timestamps.ps1

  调用示例（dry-run，不写入，仅显示将要操作的文件）：
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/auto_append_timestamps.ps1 -DryRun
#>

param(
    [switch]$DryRun
)

function Make-BackupDirIfNeeded($dir) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$claude = Join-Path $repoRoot 'CLAUDE.md'
$proj = Join-Path $repoRoot 'Project_CPG.md'
$prog = Join-Path $repoRoot 'Progress_CPG.md'
$backupDir = Join-Path $repoRoot '.claude\backups'

Make-BackupDirIfNeeded $backupDir

$shortTs = Get-Date -Format 'yyMMddHHmm'
$fullTs = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

$files = @($claude, $proj, $prog)

Write-Host "Auto timestamp script started. DryRun=$DryRun"

foreach ($f in $files) {
    if (-not (Test-Path $f)) {
        Write-Warning "File not found: $f - skipping"
        continue
    }

    $base = Split-Path $f -Leaf
    $bakName = "$base.$shortTs.bak"
    $bakPath = Join-Path $backupDir $bakName

    Write-Host "Backing up $base -> $bakPath"
    if (-not $DryRun) { Copy-Item -Path $f -Destination $bakPath -Force }

    if ($base -ieq 'CLAUDE.md') {
        $line = "**Last Updated**: $fullTs"
        Write-Host "Appending full timestamp to ${base}: $line"
        if (-not $DryRun) { Add-Content -Path $f -Value "`n$line" }
    }
    else {
        $line = "Last Updated: $shortTs"
        Write-Host "Appending short timestamp to ${base}: $line"
        if (-not $DryRun) { Add-Content -Path $f -Value "`n$line" }
    }
}

Write-Host "Auto timestamp finished. Written timestamps (if DryRun not set). shortTs=$shortTs fullTs=$fullTs"
