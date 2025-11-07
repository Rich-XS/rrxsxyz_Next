@echo off
REM OneDrive修复脚本 - 强制卸载旧版本并清理残留

echo ================================================
echo OneDrive 强制修复脚本
echo ================================================
echo.

REM 步骤1：停止所有OneDrive进程
echo [步骤1] 停止OneDrive进程...
taskkill /F /IM OneDrive.exe 2>CON
timeout /t 2 /nobreak

REM 步骤2：清理OneDrive用户数据（非系统文件）
echo [步骤2] 清理OneDrive配置文件...
cd /d "%USERPROFILE%\AppData\Local"
if exist "Microsoft\OneDrive" (
    echo 正在删除OneDrive配置...
    REM 移到临时目录而不是直接删除（更安全）
    move "Microsoft\OneDrive" "Microsoft\OneDrive.old.backup" 2>CON
    echo 已备份至OneDrive.old.backup
) else (
    echo OneDrive配置目录不存在
)

REM 步骤3：清理OneDrive注册表项（禁用自启动）
echo [步骤3] 清理注册表...
reg delete "HKCU\Software\Microsoft\OneDrive" /f 2>CON
reg delete "HKCU\Software\Classes\CLSID\{018D5C66-4533-4307-9B53-224DE2ED1FE6}" /f 2>CON

REM 步骤4：清理Programs Files中的旧OneDrive（如果有）
echo [步骤4] 检查Program Files...
if exist "%ProgramFiles%\Microsoft OneDrive" (
    echo 发现旧OneDrive，正在移除...
    ren "%ProgramFiles%\Microsoft OneDrive" "Microsoft OneDrive.old" 2>CON
)

REM 步骤5：使用winget强制重新安装
echo [步骤5] 重新安装OneDrive（通过winget）...
winget install --id=Microsoft.OneDrive -e --force --silent 2>CON

REM 步骤6：等待并验证
echo [步骤6] 等待安装完成...
timeout /t 5 /nobreak

REM 步骤7：启动OneDrive
echo [步骤7] 启动OneDrive...
start /min OneDrive.exe

echo.
echo ================================================
echo 修复完成！请稍候几秒钟，OneDrive应该在后台启动
echo 可以在系统托盘（右下角时钟附近）看到OneDrive云图标
echo ================================================
pause
