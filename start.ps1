# =============================================================================
# RRXS.XYZ 项目统一启动脚本
# 描述：从项目根目录启动前端/后端/全栈服务
# =============================================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     RRXS.XYZ 项目启动管理器           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 检查当前目录
$currentDir = Get-Location
Write-Host "当前目录: $currentDir" -ForegroundColor Yellow

if (-not ((Test-Path ".\server") -and (Test-Path ".\duomotai"))) {
    Write-Host ""
    Write-Host "❌ 错误: 不在项目根目录" -ForegroundColor Red
    Write-Host "   请在项目根目录下运行此脚本" -ForegroundColor Red
    Write-Host "   正确路径示例: D:\_100W\rrxsxyz_next\" -ForegroundColor Yellow
    Read-Host "按Enter键退出"
    exit 1
}

Write-Host ""
Write-Host "请选择启动方式:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [1] 仅启动前端 (端口 8080)" -ForegroundColor Green
Write-Host "  [2] 仅启动后端 (端口 3001)" -ForegroundColor Green
Write-Host "  [3] 启动全栈 (前端 + 后端)" -ForegroundColor Green
Write-Host "  [4] 查看端口状态" -ForegroundColor Yellow
Write-Host "  [5] 清理端口进程" -ForegroundColor Yellow
Write-Host "  [0] 退出" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "请输入选项 (0-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "启动前端服务..." -ForegroundColor Cyan
        & ".\start_frontend.ps1"
    }

    "2" {
        Write-Host ""
        Write-Host "启动后端服务..." -ForegroundColor Cyan
        & ".\start_backend.ps1"
    }

    "3" {
        Write-Host ""
        Write-Host "启动全栈服务..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚠️  注意: 全栈模式将同时启动前后端" -ForegroundColor Yellow
        Write-Host "   前端: http://localhost:8080" -ForegroundColor Gray
        Write-Host "   后端: http://localhost:3001" -ForegroundColor Gray
        Write-Host ""

        # 启动后端（后台）
        Write-Host "1/2 启动后端服务（后台）..." -ForegroundColor Cyan
        Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", ".\start_backend.ps1"

        Start-Sleep -Seconds 3

        # 启动前端（前台）
        Write-Host "2/2 启动前端服务（前台）..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "提示: 关闭此窗口将停止前端服务" -ForegroundColor Yellow
        Write-Host "      后端服务在独立窗口运行，请手动关闭" -ForegroundColor Yellow
        Write-Host ""

        Start-Sleep -Seconds 2
        & ".\start_frontend.ps1"
    }

    "4" {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  端口状态检查" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""

        # 检查8080端口
        Write-Host "📡 端口 8080 (前端):" -ForegroundColor Yellow
        $port8080 = netstat -ano | Select-String ":8080"
        if ($port8080) {
            Write-Host $port8080 -ForegroundColor Green
        } else {
            Write-Host "   未占用" -ForegroundColor Gray
        }

        Write-Host ""

        # 检查3001端口
        Write-Host "📡 端口 3001 (后端):" -ForegroundColor Yellow
        $port3001 = netstat -ano | Select-String ":3001"
        if ($port3001) {
            Write-Host $port3001 -ForegroundColor Green
        } else {
            Write-Host "   未占用" -ForegroundColor Gray
        }

        Write-Host ""
        Read-Host "按Enter键返回主菜单"

        # 递归调用自己，返回主菜单
        & $MyInvocation.MyCommand.Path
    }

    "5" {
        Write-Host ""
        Write-Host "清理端口进程..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚠️  警告: 将终止占用端口 8080 和 3001 的进程" -ForegroundColor Yellow
        $confirm = Read-Host "确认继续? (y/n)"

        if ($confirm -eq 'y' -or $confirm -eq 'Y') {
            # 使用安全清理脚本
            if (Test-Path ".\scripts\safe_port_cleanup.ps1") {
                & ".\scripts\safe_port_cleanup.ps1"
            } else {
                Write-Host "   正在清理端口 8080..." -ForegroundColor Gray
                $pids8080 = netstat -ano | Select-String ":8080" | ForEach-Object {
                    $_ -replace '.*\s+(\d+)\s*$', '$1'
                } | Select-Object -Unique

                foreach ($pid in $pids8080) {
                    taskkill /F /PID $pid 2>$null
                }

                Write-Host "   正在清理端口 3001..." -ForegroundColor Gray
                $pids3001 = netstat -ano | Select-String ":3001" | ForEach-Object {
                    $_ -replace '.*\s+(\d+)\s*$', '$1'
                } | Select-Object -Unique

                foreach ($pid in $pids3001) {
                    taskkill /F /PID $pid 2>$null
                }

                Write-Host "   ✅ 清理完成" -ForegroundColor Green
            }

            Write-Host ""
            Read-Host "按Enter键返回主菜单"
            & $MyInvocation.MyCommand.Path
        } else {
            Write-Host "   已取消" -ForegroundColor Gray
            & $MyInvocation.MyCommand.Path
        }
    }

    "0" {
        Write-Host ""
        Write-Host "退出启动管理器" -ForegroundColor Gray
        exit 0
    }

    default {
        Write-Host ""
        Write-Host "❌ 无效选项，请重新选择" -ForegroundColor Red
        Start-Sleep -Seconds 2
        & $MyInvocation.MyCommand.Path
    }
}
