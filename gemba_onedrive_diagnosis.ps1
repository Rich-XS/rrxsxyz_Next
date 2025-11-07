# OneDrive Go-Gemba 现地验证脚本

$ErrorActionPreference = 'SilentlyContinue'

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "OneDrive Go-Gemba 现地现物验证" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "[GEMBA STEP 1] 诊断 OneDrive 当前状态" -ForegroundColor Yellow
Write-Host ""

# 检查进程
$onedrive_process = Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue
if ($onedrive_process) {
    Write-Host "✅ OneDrive 进程: 运行中 (PID: $($onedrive_process.Id))" -ForegroundColor Green
} else {
    Write-Host "❌ OneDrive 进程: 未运行" -ForegroundColor Red
}

# 检查文件位置
Write-Host ""
Write-Host "[GEMBA STEP 2] 检查OneDrive.exe位置" -ForegroundColor Yellow

$onedrive_paths = @(
    "$env:USERPROFILE\AppData\Local\Microsoft\OneDrive\OneDrive.exe",
    "C:\Program Files\Microsoft OneDrive\OneDrive.exe",
    "C:\Program Files (x86)\Microsoft OneDrive\OneDrive.exe"
)

$found_path = $null
foreach ($path in $onedrive_paths) {
    if (Test-Path $path) {
        Write-Host "✅ 找到: $path" -ForegroundColor Green
        $found_path = $path
    }
}

if (-not $found_path) {
    Write-Host "❌ OneDrive.exe 未找到在任何预期位置" -ForegroundColor Red
}

# 检查注册表
Write-Host ""
Write-Host "[GEMBA STEP 3] 检查注册表" -ForegroundColor Yellow

$reg_path = "HKCU:\Software\Microsoft\OneDrive"
if (Test-Path $reg_path) {
    Write-Host "✅ 注册表项存在: $reg_path" -ForegroundColor Green
    $reg_props = Get-ItemProperty -Path $reg_path -ErrorAction SilentlyContinue
    if ($reg_props.UserFolder) {
        Write-Host "   用户文件夹: $($reg_props.UserFolder)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ 注册表项不存在: $reg_path" -ForegroundColor Red
}

# 检查应用安装
Write-Host ""
Write-Host "[GEMBA STEP 4] 检查应用商店安装" -ForegroundColor Yellow

$app_package = Get-AppxPackage -Name "*OneDrive*" -ErrorAction SilentlyContinue
if ($app_package) {
    Write-Host "✅ OneDrive 应用包: 已安装" -ForegroundColor Green
    Write-Host "   包名: $($app_package.Name)" -ForegroundColor Gray
    Write-Host "   版本: $($app_package.Version)" -ForegroundColor Gray
} else {
    Write-Host "❌ OneDrive 应用包: 未安装" -ForegroundColor Red
}

# 总体诊断结果
Write-Host ""
Write-Host "[GEMBA STEP 5] 诊断结果" -ForegroundColor Yellow

$issues = @()
if (-not $onedrive_process) { $issues += "OneDrive 进程未运行" }
if (-not $found_path) { $issues += "OneDrive.exe 未找到" }
if (-not (Test-Path $reg_path)) { $issues += "注册表项不存在" }
if (-not $app_package) { $issues += "应用商店包未安装" }

if ($issues.Count -eq 0) {
    Write-Host "✅ OneDrive 已完整安装，仅需启动进程" -ForegroundColor Green
} else {
    Write-Host "❌ 发现以下问题:" -ForegroundColor Red
    $issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

# 修复步骤
Write-Host ""
Write-Host "[GEMBA STEP 6] 修复建议" -ForegroundColor Yellow

if ($issues.Count -gt 0) {
    Write-Host ""
    Write-Host "方案A: 从Microsoft Store重新安装 (推荐)" -ForegroundColor Cyan
    Write-Host "  1. Win+I 打开 Windows 设置" -ForegroundColor Gray
    Write-Host "  2. 搜索 'Microsoft Store'" -ForegroundColor Gray
    Write-Host "  3. 在 Store 中搜索 'OneDrive'" -ForegroundColor Gray
    Write-Host "  4. 点击'安装'或'获取'" -ForegroundColor Gray
    Write-Host "  5. 等待安装完成（约2-3分钟）" -ForegroundColor Gray
    Write-Host ""
    Write-Host "方案B: 使用 winget 安装" -ForegroundColor Cyan
    Write-Host "  winget install --id=Microsoft.OneDrive -e" -ForegroundColor Gray
    Write-Host ""
    Write-Host "方案C: 从官方网站下载" -ForegroundColor Cyan
    Write-Host "  https://www.microsoft.com/en-us/microsoft-365/onedrive/download" -ForegroundColor Gray
}

# 启动OneDrive（如果已安装）
if ($found_path -and -not $onedrive_process) {
    Write-Host ""
    Write-Host "[GEMBA STEP 7] 尝试启动OneDrive..." -ForegroundColor Yellow
    try {
        Start-Process -FilePath $found_path
        Write-Host "✅ OneDrive 启动命令已发送" -ForegroundColor Green
        Start-Sleep -Seconds 3

        $check = Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue
        if ($check) {
            Write-Host "✅ OneDrive 已成功启动 (PID: $($check.Id))" -ForegroundColor Green
        } else {
            Write-Host "⚠️  OneDrive 启动命令已发送，但进程未立即出现（可能需要几秒钟）" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ 启动失败: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Go-Gemba 诊断完成！" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan
