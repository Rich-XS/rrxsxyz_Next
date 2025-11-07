# Force NUL File Cleanup with CMD
# Using Windows DEL command with /F /Q flags

@echo off
echo ============================================
echo FORCE NUL FILE CLEANUP (CMD)
echo ============================================
echo.

cd /d "D:\_100W\rrxsxyz_next"

echo [Step 1] Forcing deletion of NUL files...
echo.

REM Delete all nul files recursively
for /r %%i in (nul) do (
    echo Deleting: %%i
    del /f /q "\\?\%%i" 2>CON
)

echo.
echo [Step 2] Second pass with different method...
echo.

REM Alternative method using direct path
for /f "tokens=*" %%a in ('dir /s /b nul 2^>CON') do (
    echo Removing: %%a
    del /f /q "\\?\%%a" 2>CON
)

echo.
echo ============================================
echo Cleanup attempt complete.
echo ============================================
pause