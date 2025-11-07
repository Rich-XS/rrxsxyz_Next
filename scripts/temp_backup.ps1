
# PowerShell 备份脚本
$ErrorActionPreference = "Stop"

$sourcePath = "D:\_100W\rrxsxyz_next"
$destPath = "D:\_100W\rrxsxyz_next-202510232323.zip"

# 排除模式
$excludePatterns = @(
    'node_modules',
    '.git',
    'snapshots',
    'archive_*',
    'UserInfo',
    'logs',
    '*.log',
    'temp*',
    'tmp*',
    'nul',
    '*.zip'
)

Write-Host "正在收集需要备份的文件..."

# 获取所有文件，排除指定模式
$files = Get-ChildItem -Path $sourcePath -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $file = $_
    $shouldInclude = $true

    foreach ($pattern in $excludePatterns) {
        if ($file.FullName -like "*$pattern*") {
            $shouldInclude = $false
            break
        }
    }

    $shouldInclude
}

Write-Host "找到 $($files.Count) 个文件需要备份"

# 删除旧的备份文件（如果存在）
if (Test-Path $destPath) {
    Remove-Item $destPath -Force
    Write-Host "已删除旧的备份文件"
}

Write-Host "正在压缩文件（这可能需要几分钟）..."

# 使用 Compress-Archive
try {
    Compress-Archive -Path $files.FullName -DestinationPath $destPath -CompressionLevel Optimal -Force
    Write-Host "✅ 压缩完成"
} catch {
    Write-Host "❌ 压缩失败: $_"
    exit 1
}
