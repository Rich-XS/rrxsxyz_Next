# 导出 CCR/进程/审计 快照到 ./logs 目录
# 生成的文件示例：logs\ccr_audit_tail_20251010_0330.txt, logs\ccr_snapshots_list_20251010_0330.txt, logs\netstat_8080_20251010_0330.txt, logs\process_list_20251010_0330.txt

# 创建 logs 目录（若不存在）
New-Item -ItemType Directory -Path .\logs -Force | Out-Null

# 导出 .claude 审计日志最近 500 行（若存在）
if (Test-Path .\.claude\audit.log) {
    Get-Content .\.claude\audit.log -Tail 500 | Out-File -Encoding utf8 .\logs\ccr_audit_tail_20251010_0330.txt
}

# 列出最近快照文件（前5项）到列表
if (Test-Path .\.claude\snapshots) {
    Get-ChildItem .\.claude\snapshots\ -File | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object { $_.FullName } | Out-File .\logs\ccr_snapshots_list_20251010_0330.txt
}

# netstat 检查 8080 监听（若有）
netstat -ano | findstr :8080 > .\logs\netstat_8080_20251010_0330.txt

# 导出相关进程列表（node / progress-recorder / claude 等）
Get-Process | Where-Object { $_.ProcessName -match 'node|progress-recorder|CCR|claude' } | Sort-Object CPU -Descending | Format-Table -AutoSize | Out-File .\logs\process_list_20251010_0330.txt

# 如果剪贴板已有终端内容，保存为快照（可选）
try {
    $clip = Get-Clipboard -ErrorAction Stop
    if ($clip) {
        $clip | Out-File .\logs\ccr_snapshot_from_clipboard_20251010_0330.txt -Encoding utf8
    }
} catch { }

# 列出 logs 目录下生成的文件（简要表）
Get-ChildItem .\logs\ -File | Select-Object Name,LastWriteTime,Length | Format-Table -AutoSize | Out-String | Out-File .\logs\ccr_export_summary_20251010_0330.txt

# 在控制台也输出简要结果
Get-ChildItem .\logs\ -File | Select-Object Name,LastWriteTime,Length | Format-Table -AutoSize
