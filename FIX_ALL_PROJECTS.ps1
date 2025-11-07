# PowerShell脚本 - 全面修复所有项目的nul问题
# 作者: Claude
# 日期: 2025-10-29
# 用途: 根治所有项目中的 > nul 问题

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  全项目NUL问题根治脚本 v2.0" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 定义需要修复的项目列表
$projects = @(
    @{Path="D:\_100W\rrxsxyz_next"; Name="rrxsxyz_next"},
    @{Path="D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\mx_kc_gl"; Name="mx_kc_gl"},
    @{Path="D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\LTP_Opt"; Name="LTP_Opt"},
    @{Path="D:\OneDrive_RRXS\OneDrive\_AIGPT\CCA_Instructions"; Name="CCA_Instructions"}
)

# 统计
$totalFixed = 0
$totalBacked = 0

# 修复函数
function Fix-BatchFile {
    param([string]$FilePath)

    if (Test-Path $FilePath) {
        # 备份
        $backupPath = "$FilePath.backup_$(Get-Date -Format 'yyyyMMddHHmmss')"
        Copy-Item $FilePath $backupPath -Force
        Write-Host "  备份: $backupPath" -ForegroundColor Gray

        # 读取并修复
        $content = Get-Content $FilePath -Raw
        $fixedContent = $content -replace '> nul\b', '2>CON'
        $fixedContent = $fixedContent -replace '>nul\b', '2>CON'

        # 保存
        Set-Content -Path $FilePath -Value $fixedContent -Encoding UTF8
        Write-Host "  ✅ 已修复: $FilePath" -ForegroundColor Green

        return $true
    }
    return $false
}

# 处理每个项目
foreach ($project in $projects) {
    Write-Host ""
    Write-Host "[$($project.Name)] 开始处理..." -ForegroundColor Yellow

    if (Test-Path $project.Path) {
        # 查找所有批处理文件
        $batFiles = Get-ChildItem -Path $project.Path -Filter "*.bat" -Recurse -ErrorAction SilentlyContinue |
                    Where-Object { $_.Name -notlike "*.backup*" -and $_.Name -ne "activate.bat" }

        foreach ($batFile in $batFiles) {
            # 检查是否包含 > nul
            $content = Get-Content $batFile.FullName -Raw -ErrorAction SilentlyContinue
            if ($content -match '>\s*nul') {
                Write-Host "  发现问题文件: $($batFile.Name)" -ForegroundColor Red
                if (Fix-BatchFile -FilePath $batFile.FullName) {
                    $totalFixed++
                    $totalBacked++
                }
            }
        }

        # 创建/更新nodemon.json（如果有server目录）
        $serverPath = Join-Path $project.Path "server"
        if (Test-Path $serverPath) {
            $nodemonConfig = @{
                watch = @("server.js", "src/**/*.js", "routes/**/*.js")
                ignore = @("nul", "**/nul", "*.zip", "*.log", "*.bak", "node_modules/**", ".git/**")
                delay = "2500"
                verbose = $false
            }
            $nodemonPath = Join-Path $serverPath "nodemon.json"
            $nodemonConfig | ConvertTo-Json -Depth 10 | Set-Content $nodemonPath -Encoding UTF8
            Write-Host "  ✅ nodemon.json 已更新" -ForegroundColor Green
        }

        # 更新.gitignore
        $gitignorePath = Join-Path $project.Path ".gitignore"
        if (Test-Path $gitignorePath) {
            $gitignoreContent = Get-Content $gitignorePath -Raw
            if ($gitignoreContent -notmatch '\bnul\b') {
                Add-Content $gitignorePath "`n# 防止nul文件`nnul`n**/nul`n*.nul"
                Write-Host "  ✅ .gitignore 已更新" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "  ⚠️ 项目路径不存在: $($project.Path)" -ForegroundColor Yellow
    }
}

# 清理现有nul文件
Write-Host ""
Write-Host "清理所有nul文件..." -ForegroundColor Yellow
$nulFiles = Get-ChildItem -Path "D:\" -Filter "nul" -Recurse -Force -ErrorAction SilentlyContinue
$nulCount = $nulFiles.Count

foreach ($nulFile in $nulFiles) {
    try {
        # 使用特殊路径删除
        cmd /c "del `"\\?\$($nulFile.FullName)`"" 2>&1 | Out-Null
        Write-Host "  删除: $($nulFile.FullName)" -ForegroundColor Gray
    } catch {
        Write-Host "  ❌ 无法删除: $($nulFile.FullName)" -ForegroundColor Red
    }
}

# 总结
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  修复完成统计" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  修复文件数: $totalFixed" -ForegroundColor Green
Write-Host "  备份文件数: $totalBacked" -ForegroundColor Green
Write-Host "  清理nul文件: $nulCount" -ForegroundColor Green
Write-Host ""
Write-Host "✅ 根治方案执行完成！" -ForegroundColor Green
Write-Host ""
Write-Host "后续建议：" -ForegroundColor Yellow
Write-Host "1. 运行 chkdsk D: /f 检查文件系统"
Write-Host "2. 暂时关闭OneDrive同步"
Write-Host "3. 重启系统后再启动服务"