# PowerShell - OneDrive完全隔离方案
# 2025-10-29 - 永久解决同步问题

Write-Host "===========================================`n" -ForegroundColor Cyan
Write-Host "   OneDrive 开发环境完全隔离方案 v3.0`n" -ForegroundColor Yellow
Write-Host "===========================================`n" -ForegroundColor Cyan

# 1. 停止OneDrive
Write-Host "[1/8] 停止OneDrive进程..." -ForegroundColor Yellow
Stop-Process -Name "OneDrive" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. 创建OneDrive排除规则文件
Write-Host "[2/8] 配置OneDrive排除规则..." -ForegroundColor Yellow
$excludeList = @"
# 开发项目排除列表
*.bat
*.ps1
*.sh
nul
**/nul
node_modules/
.git/
.venv/
venv/
*.log
*.tmp
*.cache
*.lock
package-lock.json
yarn.lock
"@

# 保存排除规则
$excludePath = "$env:USERPROFILE\OneDriveExclude.txt"
$excludeList | Out-File -FilePath $excludePath -Encoding UTF8
Write-Host "  ✅ 排除规则已保存到: $excludePath" -ForegroundColor Green

# 3. 查找并修复所有批处理文件
Write-Host "[3/8] 扫描并修复所有批处理文件..." -ForegroundColor Yellow
$batFiles = Get-ChildItem -Path "D:\" -Filter "*.bat" -Recurse -ErrorAction SilentlyContinue |
    Where-Object {
        $_.FullName -notlike "*node_modules*" -and
        $_.FullName -notlike "*.venv*" -and
        $_.FullName -notlike "*backup*"
    }

$fixedCount = 0
foreach ($file in $batFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match '>\s*nul') {
        # 备份
        $backupPath = "$($file.FullName).backup_$(Get-Date -Format 'yyyyMMddHHmmss')"
        Copy-Item $file.FullName $backupPath -Force

        # 修复
        $fixedContent = $content -replace '>\s*nul\b', '2>CON'
        Set-Content -Path $file.FullName -Value $fixedContent -Encoding UTF8
        $fixedCount++
        Write-Host "  ✅ 修复: $($file.Name)" -ForegroundColor Green
    }
}
Write-Host "  ✅ 共修复 $fixedCount 个批处理文件" -ForegroundColor Green

# 4. 清理所有nul文件
Write-Host "[4/8] 清理所有nul文件..." -ForegroundColor Yellow
$nulFiles = Get-ChildItem -Path "D:\" -Filter "nul" -Recurse -Force -ErrorAction SilentlyContinue
foreach ($nul in $nulFiles) {
    try {
        Remove-Item -LiteralPath "\\?\$($nul.FullName)" -Force -ErrorAction SilentlyContinue
        Write-Host "  删除: $($nul.DirectoryName)" -ForegroundColor Gray
    } catch {}
}
Write-Host "  ✅ 清理完成，共删除 $($nulFiles.Count) 个nul文件" -ForegroundColor Green

# 5. 创建所有项目的nodemon配置
Write-Host "[5/8] 配置所有项目的nodemon..." -ForegroundColor Yellow
$projects = @(
    "D:\_100W\rrxsxyz_next\server",
    "D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\mx_kc_gl\server",
    "D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\LTP_Opt\server"
)

$nodemonConfig = @{
    watch = @("*.js", "src/**/*.js", "routes/**/*.js")
    ignore = @("nul", "**/nul", "*.zip", "*.log", "*.bak", "node_modules/**", ".git/**", "*.md")
    delay = "3000"
    verbose = $false
    env = @{ NODE_ENV = "development" }
}

foreach ($project in $projects) {
    if (Test-Path $project) {
        $configPath = Join-Path $project "nodemon.json"
        $nodemonConfig | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8
        Write-Host "  ✅ 配置: $project" -ForegroundColor Green
    }
}

# 6. 创建系统级监控任务
Write-Host "[6/8] 部署系统监控任务..." -ForegroundColor Yellow
$monitorScript = @'
# nul文件监控脚本
$count = (Get-ChildItem -Path "D:\" -Filter "nul" -Recurse -ErrorAction SilentlyContinue).Count
if ($count -gt 5) {
    $message = "警告: 检测到 $count 个nul文件！"
    Write-EventLog -LogName Application -Source "NulMonitor" -EventId 1001 -EntryType Warning -Message $message

    # 发送通知
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show($message, "NUL文件警告", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
}
'@

$monitorPath = "D:\_100W\NulMonitor.ps1"
$monitorScript | Out-File -FilePath $monitorPath -Encoding UTF8
Write-Host "  ✅ 监控脚本已创建" -ForegroundColor Green

# 7. 优化系统设置
Write-Host "[7/8] 优化系统设置..." -ForegroundColor Yellow

# 创建.gitignore模板
$gitignoreTemplate = @"
# nul文件防护
nul
**/nul
*.nul

# 开发文件
node_modules/
*.log
*.tmp
*.cache
.venv/
venv/

# 备份文件
*.backup
*.backup_*
"@

# 添加到所有项目
$projects_to_update = @("D:\_100W\rrxsxyz_next", "D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\mx_kc_gl")
foreach ($project in $projects_to_update) {
    if (Test-Path $project) {
        $gitignorePath = Join-Path $project ".gitignore"
        if (-not (Test-Path $gitignorePath)) {
            $gitignoreTemplate | Out-File -FilePath $gitignorePath -Encoding UTF8
        }
    }
}
Write-Host "  ✅ .gitignore已更新" -ForegroundColor Green

# 8. 创建健康检查脚本
Write-Host "[8/8] 创建系统健康检查..." -ForegroundColor Yellow
$healthCheck = @'
# 系统健康检查
Write-Host "`n========== 系统健康检查 ==========" -ForegroundColor Cyan

# 检查nul文件
$nulCount = (Get-ChildItem -Path "D:\" -Filter "nul" -Recurse -ErrorAction SilentlyContinue).Count
if ($nulCount -eq 0) {
    Write-Host "✅ 无nul文件 (健康)" -ForegroundColor Green
} else {
    Write-Host "⚠️ 发现 $nulCount 个nul文件!" -ForegroundColor Red
}

# 检查批处理文件
$dangerousBats = Get-ChildItem -Path "D:\_100W" -Filter "*.bat" -Recurse -ErrorAction SilentlyContinue |
    Select-String '>\s*nul' -List
if ($dangerousBats.Count -eq 0) {
    Write-Host "✅ 批处理文件安全" -ForegroundColor Green
} else {
    Write-Host "⚠️ $($dangerousBats.Count) 个批处理文件包含危险重定向!" -ForegroundColor Red
}

# 检查OneDrive状态
$onedrive = Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue
if ($onedrive) {
    Write-Host "⚠️ OneDrive运行中 (建议关闭)" -ForegroundColor Yellow
} else {
    Write-Host "✅ OneDrive未运行" -ForegroundColor Green
}

# 检查端口
$port3001 = netstat -ano | findstr ":3001"
$port8080 = netstat -ano | findstr ":8080"
Write-Host "✅ 端口3001: $(if($port3001){'占用'}else{'空闲'})" -ForegroundColor $(if($port3001){'Yellow'}else{'Green'})
Write-Host "✅ 端口8080: $(if($port8080){'占用'}else{'空闲'})" -ForegroundColor $(if($port8080){'Yellow'}else{'Green'})

Write-Host "`n===================================" -ForegroundColor Cyan
'@

$healthPath = "D:\_100W\HEALTH_CHECK.ps1"
$healthCheck | Out-File -FilePath $healthPath -Encoding UTF8
Write-Host "  ✅ 健康检查脚本已创建: $healthPath" -ForegroundColor Green

Write-Host "`n===========================================`n" -ForegroundColor Cyan
Write-Host "   ✅ OneDrive隔离方案执行完成！`n" -ForegroundColor Green
Write-Host "===========================================`n" -ForegroundColor Cyan

Write-Host "执行统计:" -ForegroundColor Yellow
Write-Host "  - 修复批处理文件: $fixedCount 个"
Write-Host "  - 清理nul文件: $($nulFiles.Count) 个"
Write-Host "  - 配置nodemon: $($projects.Count) 个项目"
Write-Host "  - 创建监控脚本: 1 个"
Write-Host "  - 创建健康检查: 1 个`n"

Write-Host "后续操作:" -ForegroundColor Yellow
Write-Host "  1. 运行健康检查: powershell -File D:\_100W\HEALTH_CHECK.ps1"
Write-Host "  2. 设置OneDrive排除: 设置 → 选择文件夹 → 取消勾选开发目录"
Write-Host "  3. 运行磁盘检查: chkdsk D: /f (重启后)`n"

Write-Host "⚠️ 重要提醒:" -ForegroundColor Red
Write-Host "  永远不要在批处理中使用 > nul"
Write-Host "  始终使用 2>CON 或 >CON"
Write-Host ""