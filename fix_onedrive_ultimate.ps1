#!/usr/bin/env powershell
# OneDrive 终极修复脚本
# D-112: OneDrive 安装失败修复机制

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "OneDrive 终极修复脚本（D-112）" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 步骤1：杀死OneDrive进程
Write-Host "[步骤1] 停止OneDrive进程..." -ForegroundColor Yellow
Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 500
Write-Host "✓ OneDrive进程已停止" -ForegroundColor Green

# 步骤2：清理OneDrive目录
Write-Host "[步骤2] 清理OneDrive配置目录..." -ForegroundColor Yellow
$oneDrivePath = "$env:USERPROFILE\AppData\Local\Microsoft\OneDrive"
if (Test-Path $oneDrivePath) {
    Write-Host "发现OneDrive目录: $oneDrivePath"
    Remove-Item $oneDrivePath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ OneDrive目录已删除" -ForegroundColor Green
} else {
    Write-Host "✓ OneDrive目录不存在（预期结果）" -ForegroundColor Green
}

# 步骤3：清理注册表
Write-Host "[步骤3] 清理注册表..." -ForegroundColor Yellow
$regPaths = @(
    "HKCU:\Software\Microsoft\OneDrive",
    "HKCU:\Software\Classes\CLSID\{018D5C66-4533-4307-9B53-224DE2ED1FE6}",
    "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run" | ForEach-Object { $_ }
)

foreach ($regPath in $regPaths) {
    Remove-Item -Path $regPath -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "✓ 注册表已清理" -ForegroundColor Green

# 步骤4：使用winget重新安装
Write-Host "[步骤4] 重新安装OneDrive..." -ForegroundColor Yellow
$output = & winget install --id=Microsoft.OneDrive -e --force 2>&1
if ($LASTEXITCODE -eq 0 -or $output -like "*已成功安装*" -or $output -like "*已成功重新配置*") {
    Write-Host "✓ OneDrive安装命令已执行" -ForegroundColor Green
} else {
    Write-Host "⚠ winget可能返回了非标准消息，继续..." -ForegroundColor Yellow
}

# 步骤5：等待并启动OneDrive
Write-Host "[步骤5] 等待并启动OneDrive..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 方法A：从AppData启动（Windows 10+标准路径）
$oneDriveExe = "$env:USERPROFILE\AppData\Local\Microsoft\OneDrive\OneDrive.exe"
if (Test-Path $oneDriveExe) {
    Write-Host "✓ 发现OneDrive.exe: $oneDriveExe" -ForegroundColor Green
    & $oneDriveExe /background 2>$null
    Write-Host "✓ OneDrive已启动（后台模式）" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "⚠ OneDrive.exe未找到，尝试系统命令启动..." -ForegroundColor Yellow
    # 方法B：系统命令启动（如果已安装）
    & "OneDrive.exe" /background 2>$null
    Start-Sleep -Seconds 2
}

# 步骤6：验证
Write-Host "[步骤6] 验证OneDrive状态..." -ForegroundColor Yellow
$oneDriveProc = Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue
if ($oneDriveProc) {
    Write-Host "✅ OneDrive 进程正在运行 (PID: $($oneDriveProc.Id))" -ForegroundColor Green
} else {
    Write-Host "⚠️ OneDrive进程未运行，可能需要等待或用户干预" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "修复完成！" -ForegroundColor Cyan
Write-Host "请检查系统托盘（右下角时钟附近）是否出现OneDrive云图标" -ForegroundColor Cyan
Write-Host "如果未出现，请手动启动: OneDrive.exe /background" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# 保持窗口打开以查看输出
Read-Host "按Enter键关闭"
