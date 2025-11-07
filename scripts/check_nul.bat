@echo off
cls
echo Checking for remaining NUL files...
echo.

set count=0
for /r "D:\_100W\rrxsxyz_next" %%i in (nul) do set /a count+=1

if %count%==0 (
    color 0A
    echo SUCCESS! No NUL files found!
    echo System is clean.
) else (
    color 0C
    echo WARNING: Found %count% NUL files!
    echo.
    echo Listing first 10 files:
    echo ----------------------
    set shown=0
    for /r "D:\_100W\rrxsxyz_next" %%i in (nul) do (
        if !shown! LSS 10 (
            echo %%i
            set /a shown+=1
        )
    )
)

echo.
pause