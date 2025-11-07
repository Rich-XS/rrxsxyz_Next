# VSCode/VSCodium 完整卸载重装脚本
# 作者: Claude Code (progress-recorder agent)
# 创建时间: 2025-10-29 20:40 (GMT+8)
# 用途: 彻底卸载 VSCode/VSCodium 并重新安装

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("Backup", "Uninstall", "Verify", "Install", "Restore", "Full")]
    [string]$Action = "Full",

    [Parameter(Mandatory=$false)]
    [string]$BackupPath = "D:\_100W\IDE_Backup_$(Get-Date -Format 'yyyyMMdd_HHmm')"
)

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "VSCode/VSCodium 完整卸载重装脚本" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限（建议）
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  建议以管理员权限运行此脚本（用于清理注册表）" -ForegroundColor Yellow
    Write-Host "当前以普通用户权限运行，将跳过注册表清理步骤" -ForegroundColor Yellow
    Write-Host ""
    $confirm = Read-Host "是否继续？(y/n)"
    if ($confirm -ne 'y') {
        exit
    }
}

# ============================================
# 函数定义
# ============================================

function Backup-IDEConfigs {
    Write-Host "[步骤 1/5] 备份关键配置和扩展列表..." -ForegroundColor Green

    # 创建备份目录
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    Write-Host "备份目录: $BackupPath" -ForegroundColor Cyan

    # 备份 VSCode 用户设置
    $vscodeSettings = "$env:APPDATA\Code\User\settings.json"
    if (Test-Path $vscodeSettings) {
        Copy-Item -Path $vscodeSettings -Destination "$BackupPath\vscode_settings.json" -Force
        Write-Host "✅ VSCode 设置已备份" -ForegroundColor Green
    } else {
        Write-Host "⚠️  未找到 VSCode 设置文件" -ForegroundColor Yellow
    }

    # 备份 VSCode 扩展列表
    try {
        & code --list-extensions > "$BackupPath\vscode_extensions.txt" 2>&1
        Write-Host "✅ VSCode 扩展列表已备份" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  VSCode 命令不可用，跳过扩展备份" -ForegroundColor Yellow
    }

    # 备份 VSCodium 用户设置
    $vscodiumSettings = "$env:APPDATA\VSCodium\User\settings.json"
    if (Test-Path $vscodiumSettings) {
        Copy-Item -Path $vscodiumSettings -Destination "$BackupPath\vscodium_settings.json" -Force
        Write-Host "✅ VSCodium 设置已备份" -ForegroundColor Green
    } else {
        Write-Host "⚠️  未找到 VSCodium 设置文件" -ForegroundColor Yellow
    }

    # 备份 VSCodium 扩展列表
    try {
        & codium --list-extensions > "$BackupPath\vscodium_extensions.txt" 2>&1
        Write-Host "✅ VSCodium 扩展列表已备份" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  VSCodium 命令不可用，跳过扩展备份" -ForegroundColor Yellow
    }

    # 备份 Claude Code 配置
    $claudeConfig = "$env:USERPROFILE\.claude"
    if (Test-Path $claudeConfig) {
        Copy-Item -Path $claudeConfig -Destination "$BackupPath\.claude_backup" -Recurse -Force
        Write-Host "✅ Claude Code 配置已备份" -ForegroundColor Green
    } else {
        Write-Host "⚠️  未找到 Claude Code 配置" -ForegroundColor Yellow
    }

    # 记录当前 Claude Code 版本
    try {
        & claude-code --version > "$BackupPath\claude_code_version.txt" 2>&1
        Write-Host "✅ Claude Code 版本已记录" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  claude-code 命令不可用" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "✅ 备份完成: $BackupPath" -ForegroundColor Green
    Write-Host ""
}

function Stop-IDEProcesses {
    Write-Host "[步骤 2/5] 关闭所有相关进程..." -ForegroundColor Green

    # 查找并关闭所有包含 "code" 的进程
    $codeProcesses = Get-Process | Where-Object {$_.Name -like "*code*" -or $_.Name -like "*Code*"}

    if ($codeProcesses) {
        Write-Host "发现以下进程:" -ForegroundColor Yellow
        $codeProcesses | Format-Table Name, Id, Path -AutoSize

        $confirm = Read-Host "是否停止这些进程？(y/n)"
        if ($confirm -eq 'y') {
            foreach ($proc in $codeProcesses) {
                try {
                    Write-Host "停止进程: $($proc.Name) (PID: $($proc.Id))" -ForegroundColor Cyan
                    Stop-Process -Id $proc.Id -Force -ErrorAction Stop
                } catch {
                    Write-Host "⚠️  无法停止进程 $($proc.Name): $_" -ForegroundColor Yellow
                }
            }

            # 等待进程完全退出
            Write-Host "等待 5 秒，确保进程完全退出..." -ForegroundColor Cyan
            Start-Sleep -Seconds 5

            Write-Host "✅ 所有进程已停止" -ForegroundColor Green
        } else {
            Write-Host "⚠️  用户取消，进程未停止" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ 未发现运行中的 IDE 进程" -ForegroundColor Green
    }

    Write-Host ""
}

function Uninstall-IDEs {
    Write-Host "[步骤 3/5] 卸载 VSCode 和 VSCodium..." -ForegroundColor Green
    Write-Host ""

    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "手动卸载指引（推荐方式）" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "请按照以下步骤手动卸载:" -ForegroundColor Yellow
    Write-Host "1. 打开【开始】→【设置】→【应用】→【已安装的应用】" -ForegroundColor White
    Write-Host "2. 搜索 'Visual Studio Code'" -ForegroundColor White
    Write-Host "3. 点击【...】→【卸载】" -ForegroundColor White
    Write-Host "4. ⚠️  重要：选择【同时删除用户数据】" -ForegroundColor Red
    Write-Host "5. 重复步骤 2-4 卸载 'VSCodium'" -ForegroundColor White
    Write-Host ""

    Read-Host "完成卸载后，按回车继续..."

    Write-Host ""
    Write-Host "开始清理残留文件..." -ForegroundColor Green

    # VSCode 残留文件位置
    $vscodeLocations = @(
        "$env:APPDATA\Code",
        "$env:USERPROFILE\.vscode",
        "$env:LOCALAPPDATA\Programs\Microsoft VS Code"
    )

    # VSCodium 残留文件位置
    $vscodiumLocations = @(
        "$env:APPDATA\VSCodium",
        "$env:USERPROFILE\.vscodium",
        "$env:LOCALAPPDATA\Programs\VSCodium"
    )

    # 删除 VSCode 残留
    Write-Host "清理 VSCode 残留文件..." -ForegroundColor Cyan
    foreach ($path in $vscodeLocations) {
        if (Test-Path $path) {
            Write-Host "  删除: $path" -ForegroundColor Yellow
            Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
        } else {
            Write-Host "  跳过: $path (不存在)" -ForegroundColor Gray
        }
    }

    # 删除 VSCodium 残留
    Write-Host "清理 VSCodium 残留文件..." -ForegroundColor Cyan
    foreach ($path in $vscodiumLocations) {
        if (Test-Path $path) {
            Write-Host "  删除: $path" -ForegroundColor Yellow
            Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
        } else {
            Write-Host "  跳过: $path (不存在)" -ForegroundColor Gray
        }
    }

    # 清理注册表（仅管理员权限）
    if ($isAdmin) {
        Write-Host ""
        Write-Host "清理注册表项..." -ForegroundColor Cyan
        $confirm = Read-Host "是否清理注册表？(y/n)"

        if ($confirm -eq 'y') {
            # VSCode 注册表项（示例，实际路径可能不同）
            $regPaths = @(
                "HKCU:\Software\Classes\VSCode*",
                "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*Code*"
            )

            foreach ($regPath in $regPaths) {
                try {
                    if (Test-Path $regPath) {
                        Write-Host "  删除注册表项: $regPath" -ForegroundColor Yellow
                        Remove-Item -Path $regPath -Recurse -Force -ErrorAction SilentlyContinue
                    }
                } catch {
                    Write-Host "  ⚠️  无法删除注册表项: $regPath" -ForegroundColor Yellow
                }
            }

            Write-Host "✅ 注册表已清理" -ForegroundColor Green
        } else {
            Write-Host "⚠️  用户取消，注册表未清理" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  非管理员权限，跳过注册表清理" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "✅ 残留文件清理完成" -ForegroundColor Green
    Write-Host ""
}

function Verify-Cleanup {
    Write-Host "[步骤 4/5] 验证卸载完整性..." -ForegroundColor Green

    $issues = @()

    # 检查进程
    Write-Host "检查进程..." -ForegroundColor Cyan
    $codeProcesses = Get-Process | Where-Object {$_.Name -like "*code*"}
    if ($codeProcesses) {
        Write-Host "⚠️  发现残留进程:" -ForegroundColor Yellow
        $codeProcesses | Format-Table Name, Id, Path -AutoSize
        $issues += "残留进程"
    } else {
        Write-Host "✅ 无残留进程" -ForegroundColor Green
    }

    # 检查文件
    Write-Host "检查文件..." -ForegroundColor Cyan
    $allLocations = @(
        "$env:APPDATA\Code",
        "$env:USERPROFILE\.vscode",
        "$env:LOCALAPPDATA\Programs\Microsoft VS Code",
        "$env:APPDATA\VSCodium",
        "$env:USERPROFILE\.vscodium",
        "$env:LOCALAPPDATA\Programs\VSCodium"
    )

    $remainingFiles = $allLocations | Where-Object { Test-Path $_ }

    if ($remainingFiles) {
        Write-Host "⚠️  发现残留文件:" -ForegroundColor Yellow
        $remainingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
        $issues += "残留文件"
    } else {
        Write-Host "✅ 无残留文件" -ForegroundColor Green
    }

    # 检查环境变量
    Write-Host "检查环境变量..." -ForegroundColor Cyan
    $pathEnv = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($pathEnv -like "*Code*") {
        Write-Host "⚠️  PATH 环境变量中仍包含 Code 路径" -ForegroundColor Yellow
        Write-Host "请手动清理: 系统设置 → 高级系统设置 → 环境变量 → 用户变量 → Path" -ForegroundColor Yellow
        $issues += "PATH环境变量"
    } else {
        Write-Host "✅ 环境变量已清理" -ForegroundColor Green
    }

    Write-Host ""
    if ($issues.Count -eq 0) {
        Write-Host "✅ 卸载验证通过，无残留项" -ForegroundColor Green
    } else {
        Write-Host "⚠️  发现 $($issues.Count) 个问题需要处理:" -ForegroundColor Yellow
        $issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    }
    Write-Host ""
}

function Install-IDEs {
    Write-Host "[步骤 5/5] 安装 VSCode 和 VSCodium..." -ForegroundColor Green
    Write-Host ""

    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "手动安装指引（推荐方式）" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "VSCode 安装:" -ForegroundColor Yellow
    Write-Host "1. 访问 https://code.visualstudio.com/" -ForegroundColor White
    Write-Host "2. 下载 User Installer (推荐，无需管理员权限)" -ForegroundColor White
    Write-Host "3. 安装选项:" -ForegroundColor White
    Write-Host "   ✅ 添加到 PATH" -ForegroundColor Green
    Write-Host "   ✅ 将'通过 Code 打开'添加到文件资源管理器上下文菜单" -ForegroundColor Green
    Write-Host "   ✅ 将'通过 Code 打开'添加到目录资源管理器上下文菜单" -ForegroundColor Green
    Write-Host "   ✅ 注册 Code 为受支持文件类型的编辑器" -ForegroundColor Green
    Write-Host "4. 完成安装后，启动 VSCode" -ForegroundColor White
    Write-Host ""

    Write-Host "VSCodium 安装:" -ForegroundColor Yellow
    Write-Host "1. 访问 https://vscodium.com/" -ForegroundColor White
    Write-Host "2. 下载 Windows 64-bit User Installer" -ForegroundColor White
    Write-Host "3. 安装选项同 VSCode" -ForegroundColor White
    Write-Host "4. 完成安装后，启动 VSCodium" -ForegroundColor White
    Write-Host ""

    Read-Host "完成安装后，按回车继续..."

    Write-Host ""
    Write-Host "✅ 安装完成" -ForegroundColor Green
    Write-Host ""
}

function Restore-IDEConfigs {
    Write-Host "[额外步骤] 恢复配置和扩展..." -ForegroundColor Green

    if (-not (Test-Path $BackupPath)) {
        Write-Host "⚠️  备份目录不存在: $BackupPath" -ForegroundColor Yellow
        Write-Host "请手动指定备份路径" -ForegroundColor Yellow
        $BackupPath = Read-Host "请输入备份路径"

        if (-not (Test-Path $BackupPath)) {
            Write-Host "❌ 无效路径，跳过恢复" -ForegroundColor Red
            return
        }
    }

    Write-Host "从备份目录恢复: $BackupPath" -ForegroundColor Cyan
    Write-Host ""

    # 恢复 VSCode 设置
    $vscodeSettingsBackup = "$BackupPath\vscode_settings.json"
    if (Test-Path $vscodeSettingsBackup) {
        $vscodeSettingsTarget = "$env:APPDATA\Code\User\settings.json"
        New-Item -ItemType Directory -Path (Split-Path $vscodeSettingsTarget) -Force | Out-Null
        Copy-Item -Path $vscodeSettingsBackup -Destination $vscodeSettingsTarget -Force
        Write-Host "✅ VSCode 设置已恢复" -ForegroundColor Green
    } else {
        Write-Host "⚠️  未找到 VSCode 设置备份" -ForegroundColor Yellow
    }

    # 恢复 VSCode 扩展
    $vscodeExtensionsBackup = "$BackupPath\vscode_extensions.txt"
    if (Test-Path $vscodeExtensionsBackup) {
        Write-Host "恢复 VSCode 扩展..." -ForegroundColor Cyan
        Get-Content $vscodeExtensionsBackup | ForEach-Object {
            Write-Host "  安装扩展: $_" -ForegroundColor Gray
            & code --install-extension $_ --force 2>&1 | Out-Null
        }
        Write-Host "✅ VSCode 扩展已恢复" -ForegroundColor Green
    } else {
        Write-Host "⚠️  未找到 VSCode 扩展备份" -ForegroundColor Yellow
    }

    # 恢复 VSCodium 设置
    $vscodiumSettingsBackup = "$BackupPath\vscodium_settings.json"
    if (Test-Path $vscodiumSettingsBackup) {
        $vscodiumSettingsTarget = "$env:APPDATA\VSCodium\User\settings.json"
        New-Item -ItemType Directory -Path (Split-Path $vscodiumSettingsTarget) -Force | Out-Null
        Copy-Item -Path $vscodiumSettingsBackup -Destination $vscodiumSettingsTarget -Force
        Write-Host "✅ VSCodium 设置已恢复" -ForegroundColor Green
    } else {
        Write-Host "⚠️  未找到 VSCodium 设置备份" -ForegroundColor Yellow
    }

    # 恢复 VSCodium 扩展
    $vscodiumExtensionsBackup = "$BackupPath\vscodium_extensions.txt"
    if (Test-Path $vscodiumExtensionsBackup) {
        Write-Host "恢复 VSCodium 扩展..." -ForegroundColor Cyan
        Get-Content $vscodiumExtensionsBackup | ForEach-Object {
            Write-Host "  安装扩展: $_" -ForegroundColor Gray
            & codium --install-extension $_ --force 2>&1 | Out-Null
        }
        Write-Host "✅ VSCodium 扩展已恢复" -ForegroundColor Green
    } else {
        Write-Host "⚠️  未找到 VSCodium 扩展备份" -ForegroundColor Yellow
    }

    # 恢复 Claude Code 配置
    $claudeConfigBackup = "$BackupPath\.claude_backup"
    if (Test-Path $claudeConfigBackup) {
        $claudeConfigTarget = "$env:USERPROFILE\.claude"
        Copy-Item -Path "$claudeConfigBackup\*" -Destination $claudeConfigTarget -Recurse -Force
        Write-Host "✅ Claude Code 配置已恢复" -ForegroundColor Green
    } else {
        Write-Host "⚠️  未找到 Claude Code 配置备份" -ForegroundColor Yellow
    }

    # 验证 Claude Code 版本
    Write-Host ""
    Write-Host "验证 Claude Code 版本:" -ForegroundColor Cyan
    try {
        & claude-code --version
        Write-Host "✅ Claude Code 正常工作" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  claude-code 命令不可用" -ForegroundColor Yellow
        Write-Host "请在 VSCode 中手动安装 Claude Code 扩展" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "✅ 恢复完成" -ForegroundColor Green
    Write-Host "请重启 VSCode/VSCodium 以确保所有扩展正常加载" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================
# 主流程
# ============================================

switch ($Action) {
    "Backup" {
        Backup-IDEConfigs
    }
    "Uninstall" {
        Stop-IDEProcesses
        Uninstall-IDEs
        Verify-Cleanup
    }
    "Verify" {
        Verify-Cleanup
    }
    "Install" {
        Install-IDEs
    }
    "Restore" {
        Restore-IDEConfigs
    }
    "Full" {
        Write-Host "执行完整卸载重装流程..." -ForegroundColor Cyan
        Write-Host ""

        Backup-IDEConfigs
        Stop-IDEProcesses
        Uninstall-IDEs
        Verify-Cleanup
        Install-IDEs

        Write-Host ""
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host "是否恢复配置和扩展？" -ForegroundColor Cyan
        Write-Host "============================================" -ForegroundColor Cyan
        $restore = Read-Host "是否恢复？(y/n)"

        if ($restore -eq 'y') {
            Restore-IDEConfigs
        } else {
            Write-Host "⚠️  跳过恢复步骤" -ForegroundColor Yellow
            Write-Host "如需恢复，请运行: .\vscode_complete_reinstall.ps1 -Action Restore -BackupPath '$BackupPath'" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "脚本执行完成" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "备份位置: $BackupPath" -ForegroundColor Green
Write-Host "日志时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Green
Write-Host ""
