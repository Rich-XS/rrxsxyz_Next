# inspect_image_cache.ps1
# 在项目中查找图片缓存痕迹：最近修改图片、data:image 内嵌、VSCode workspaceStorage 最近文件

$root = 'D:\_100W\rrxsxyz_next'
Write-Host "=== 最近修改的图片（过去 1 天） ==="
Get-ChildItem -Path $root -Recurse -Include *.png,*.jpg,*.jpeg,*.webp,*.gif -File -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-1) } |
    Select-Object FullName,LastWriteTime |
    Format-Table -AutoSize

Write-Host "`n=== 项目中所有图片（按时间降序，前 200） ==="
Get-ChildItem -Path $root -Recurse -Include *.png,*.jpg,*.jpeg,*.webp,*.gif -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 200 FullName,LastWriteTime |
    Format-Table -AutoSize

Write-Host "`n=== 搜索 data:image 内嵌图片（前 200 条匹配） ==="
Select-String -Path (Join-Path $root "**\*") -Pattern 'data:image' -SimpleMatch -ErrorAction SilentlyContinue |
    Select-Object -First 200 | Format-Table -AutoSize

Write-Host "`n=== VSCode workspaceStorage 最近修改文件（前 50） ==="
$ws = Join-Path $env:APPDATA 'Code\User\workspaceStorage'
if (Test-Path $ws) {
    Get-ChildItem -Path $ws -Recurse -File -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 50 @{Name='FullName';Expression={$_.FullName}},LastWriteTime |
        Format-Table -AutoSize
} else {
    Write-Host "workspaceStorage 路径不存在: $ws"
}

Write-Host "`n=== 完成 ==="