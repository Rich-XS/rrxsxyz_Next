@REM 批量路径更新脚本 (简化版)
@REM 从 D:\_100W 批量替换为 D:\OneDrive_New\_AIGPT\_100W_New

setlocal enabledelayedexpansion

set "projectRoot=D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next"
set "oldPath=D:\\_100W"
set "newPath=D:\OneDrive_New\\_AIGPT\\_100W_New"

cd /d "%projectRoot%"

echo.
echo ============================================
echo 批量路径更新脚本
echo ============================================
echo.

echo [使用 node 执行批量替换...]
node "%projectRoot%\update_paths.js"

echo.
echo [验证替换结果...]
findstr /r "D:\\" CLAUDE.md progress.md | findstr "_100W" >nul && (
    echo ⚠️  仍有旧路径存在
) || (
    echo ✅ CLAUDE.md 和 progress.md 已更新!
)

echo.
echo 操作完成!
echo.
pause
