@echo off
REM 批处理脚本：批量替换项目中的旧路径
REM 从 D:\_100W 替换为 D:\OneDrive_New\_AIGPT\_100W_New

setlocal enabledelayedexpansion

set "projectRoot=D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next"
set "oldPath=D:\_100W"
set "newPath=D:\OneDrive_New\_AIGPT\_100W_New"

echo.
echo ============================================
echo 路径更新脚本 - 批量替换
echo ============================================
echo.
echo 旧路径: %oldPath%
echo 新路径: %newPath%
echo 项目根: %projectRoot%
echo.

REM 扫描并统计需要更新的文件
set count=0
for /r "%projectRoot%" %%F in (*.md *.ps1 *.bat *.js *.json *.txt) do (
    findstr /i "%oldPath%" "%%F" >nul 2>&1
    if !errorlevel! equ 0 (
        set /a count+=1
        echo 找到: %%F
    )
)

echo.
echo ============================================
echo 统计结果: 发现 %count% 个文件需要更新
echo ============================================
echo.

REM 如果是在自动化脚本中，建议使用 PowerShell 版本或手动检查
echo 建议: 使用以下 PowerShell 单行命令执行批量替换:
echo.
echo Get-ChildItem -Path "%projectRoot%" -File -Recurse ^|
echo   Where-Object { $_.Extension -in '.md','.ps1','.bat','.js','.json' } ^|
echo   ForEach-Object {
echo     $content = Get-Content $_.FullName -Encoding UTF8
echo     if ($content -match "%oldPath%") {
echo       $newContent = $content -replace "%oldPath%", "%newPath%"
echo       Set-Content $_.FullName -Value $newContent -Encoding UTF8
echo     }
echo   }
echo.
pause
