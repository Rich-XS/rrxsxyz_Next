@echo off
echo 正在同步文件时间...

powershell -Command "$claudeTime = (Get-ItemProperty 'CLAUDE.md').LastWriteTime; Set-ItemProperty 'progress.md' -Name LastWriteTime -Value $claudeTime; echo '✓ 文件时间已同步'"

echo 同步完成！
pause