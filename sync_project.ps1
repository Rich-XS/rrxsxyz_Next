# 项目文件一键同步脚本
# 快捷键： Ctrl+Shift+S

param(
    [switch]$Auto,    # 自动模式，不显示确认
    [switch]$Status   # 只显示状态，不执行同步
)

$CLAUDE_FILE = "CLAUDE.md"
$PROGRESS_FILE = "progress.md"

function Show-FileStatus {
    if (!(Test-Path $CLAUDE_FILE) -or !(Test-Path $PROGRESS_FILE)) {
        Write-Host "❌ 项目文件不存在" -ForegroundColor Red
        return $false
    }
    
    $claudeTime = (Get-ItemProperty $CLAUDE_FILE).LastWriteTime
    $progressTime = (Get-ItemProperty $PROGRESS_FILE).LastWriteTime
    $timeDiff = [Math]::Abs(($claudeTime - $progressTime).TotalMinutes)
    
    Write-Host "`n📊 文件状态报告" -ForegroundColor Cyan
    Write-Host "=================" -ForegroundColor Cyan
    Write-Host "CLAUDE.md:    $($claudeTime.ToString('yyyy/MM/dd HH:mm:ss'))" -ForegroundColor White
    Write-Host "progress.md:  $($progressTime.ToString('yyyy/MM/dd HH:mm:ss'))" -ForegroundColor White
    
    if ($timeDiff -lt 1) {
        Write-Host "状态:         ✅ 完全同步" -ForegroundColor Green
    } elseif ($timeDiff -lt 5) {
        Write-Host "状态:         🟡 轻微差异 ($([Math]::Round($timeDiff, 1))分钟)" -ForegroundColor Yellow
    } else {
        Write-Host "状态:         🔴 需要同步 ($([Math]::Round($timeDiff, 1))分钟)" -ForegroundColor Red
    }
    
    return $timeDiff
}

function Sync-Files {
    try {
        $claudeTime = (Get-ItemProperty $CLAUDE_FILE).LastWriteTime
        $progressTime = (Get-ItemProperty $PROGRESS_FILE).LastWriteTime
        
        # 同步到较新的时间
        if ($claudeTime -gt $progressTime) {
            Set-ItemProperty $PROGRESS_FILE -Name LastWriteTime -Value $claudeTime
            Write-Host "🔄 progress.md 已同步到 CLAUDE.md 的时间" -ForegroundColor Green
        } elseif ($progressTime -gt $claudeTime) {
            Set-ItemProperty $CLAUDE_FILE -Name LastWriteTime -Value $progressTime
            Write-Host "🔄 CLAUDE.md 已同步到 progress.md 的时间" -ForegroundColor Green
        } else {
            Write-Host "✅ 文件时间已经同步" -ForegroundColor Green
        }
        
        return $true
    } catch {
        Write-Host "❌ 同步失败: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 主程序逻辑
Write-Host "🔧 项目文件同步工具" -ForegroundColor Cyan

$timeDiff = Show-FileStatus

if ($Status) {
    exit 0
}

if ($timeDiff -eq $false) {
    exit 1
}

if ($timeDiff -lt 1) {
    Write-Host "`n✅ 文件已经同步，无需操作" -ForegroundColor Green
    exit 0
}

if (!$Auto -and $timeDiff -gt 0) {
    $response = Read-Host "`n是否执行同步? (y/N)"
    if ($response -notmatch '^[Yy]') {
        Write-Host "操作已取消" -ForegroundColor Yellow
        exit 0
    }
}

if (Sync-Files) {
    Write-Host "`n✅ 同步完成！" -ForegroundColor Green
    Show-FileStatus | Out-Null
} else {
    Write-Host "`n❌ 同步失败！" -ForegroundColor Red
    exit 1
}