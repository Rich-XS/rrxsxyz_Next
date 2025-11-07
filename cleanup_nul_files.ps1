# 批量删除所有nul文件（Windows保留设备名）
# 2025-10-19 20:28 - 清理意外创建的nul文件

$nulFiles = Get-ChildItem -Path "D:\_100W\rrxsxyz_next" -Recurse -Filter "nul" -File -ErrorAction SilentlyContinue

Write-Host "找到 $($nulFiles.Count) 个nul文件，正在删除..."

$deleted = 0
$failed = 0

foreach ($file in $nulFiles) {
    try {
        # 使用特殊路径语法删除nul文件
        $specialPath = "\\.\$($file.FullName)"
        Remove-Item -LiteralPath $specialPath -Force -ErrorAction Stop
        $deleted++
        Write-Host "✓ 已删除: $($file.FullName)"
    } catch {
        # 如果特殊路径失败，尝试cmd del命令
        try {
            cmd /c "del `"\\.\$($file.FullName)`"" 2>&1 | Out-Null
            $deleted++
            Write-Host "✓ 已删除(cmd): $($file.FullName)"
        } catch {
            $failed++
            Write-Host "✗ 删除失败: $($file.FullName)"
        }
    }
}

Write-Host "Delete completed: Success=$deleted, Failed=$failed"
