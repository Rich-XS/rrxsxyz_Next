@echo off
title Exclude Project from Windows Index
cls

echo ============================================
echo EXCLUDE PROJECT FROM WINDOWS SEARCH INDEX
echo ============================================
echo.
echo This will exclude D:\_100W from Windows indexing
echo to prevent false positives and improve performance.
echo.
pause

echo.
echo Opening Indexing Options...
start ms-settings:search-moredetails

echo.
echo ============================================
echo MANUAL STEPS:
echo ============================================
echo.
echo 1. Click "Modify" button
echo 2. Expand "D:\" drive
echo 3. UNCHECK "_100W" folder
echo 4. Click OK
echo 5. Click "Advanced" button
echo 6. Click "Rebuild" to clear old index
echo.
echo This will:
echo - Stop indexing the project folder
echo - Clear cached nul file references
echo - Improve system performance
echo.
echo ============================================
pause