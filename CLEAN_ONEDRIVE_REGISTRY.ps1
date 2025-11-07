# OneDrive Registry Batch Cleanup Script
# D-113 Safe Mode Deep Registry Cleaning

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OneDrive Registry Batch Cleanup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check admin rights
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "ERROR: This script requires administrator privileges!" -ForegroundColor Red
    Write-Host "Please run as Administrator" -ForegroundColor Red
    exit 1
}

Write-Host "Running with administrator privileges..." -ForegroundColor Green
Write-Host ""

$paths = @(
    'HKCR:\AppID\OneDrive.EXE',
    'HKCR:\CLSID\{021E4F06-9DCC-49AD-88CF-ECC2DA314C8A}',
    'HKCR:\CLSID\{07CA83F0-DF06-4E67-89DD-E80924A49512}',
    'HKCR:\CLSID\{0827D883-485C-4D62-BA2C-A332DBF3D4B0}',
    'HKCR:\CLSID\{1BF42E4C-4AF4-4CFD-A1A0-CF2960B8F63E}',
    'HKCR:\CLSID\{1F80F4F0-5D28-40D3-A252-4D3662D5E4BA}',
    'HKCR:\CLSID\{20894375-46AE-46E2-BAFD-CB38975CDCE6}',
    'HKCR:\CLSID\{2e7c0a19-0438-41e9-81e3-3ad3d64f55ba}',
    'HKCR:\CLSID\{389510b7-9e58-40d7-98bf-60b911cb0ea9}',
    'HKCR:\CLSID\{3A308EFE-656D-46BB-9963-0A41C0D6BCA2}',
    'HKCR:\CLSID\{4410DC33-BC7C-496B-AA84-4AEA3EEE75F7}',
    'HKCR:\CLSID\{47E6DCAF-41F8-441C-BD0E-A50D5FE6C4D1}',
    'HKCR:\CLSID\{544c4c52-de0b-4d14-9510-21745381d5ca}',
    'HKCR:\CLSID\{5999E1EE-711E-48D2-9884-851A709F543D}',
    'HKCR:\CLSID\{5AB7172C-9C11-405C-8DD5-AF20F3606282}',
    'HKCR:\CLSID\{6bb93b4e-44d8-40e2-bd97-42dbcf18a40f}',
    'HKCR:\CLSID\{71DCE5D6-4B57-496B-AC21-CD5B54EB93FD}',
    'HKCR:\CLSID\{7AE67172-9863-42B1-8750-2B85084FD8E8}',
    'HKCR:\CLSID\{7AFDFDDB-F914-11E4-8377-6C3BE50D980C}',
    'HKCR:\CLSID\{7B37E4E2-C62F-4914-9620-8FB5062718CC}',
    'HKCR:\CLSID\{82CA8DE3-01AD-4CEA-9D75-BE4C51810A9E}',
    'HKCR:\CLSID\{917E8742-AA3B-7318-FA12-10485FB322A2}',
    'HKCR:\CLSID\{94269C4E-071A-4116-90E6-52E557067E4E}',
    'HKCR:\CLSID\{9489FEB2-1925-4D01-B788-6D912C70F7F2}',
    'HKCR:\CLSID\{9AA2F32D-362A-42D9-9328-24A483E2CCC3}',
    'HKCR:\CLSID\{9BE266B4-A97C-486E-B993-EAEBAA798D69}',
    'HKCR:\CLSID\{A0396A93-DC06-4AEF-BEE9-95FFCCAEF20E}',
    'HKCR:\CLSID\{A3CA1CF4-5F3E-4AC0-91B9-0D3716E1EAC3}',
    'HKCR:\grvopen',
    'HKCR:\Interface\{6A821279-AB49-48F8-9A27-F6C59B4FF024}',
    'HKCR:\Interface\{A91EFACB-8B83-4B84-B797-1C8CF3AB3DCB}',
    'HKCR:\Interface\{B05D37A9-03A2-45CF-8850-F660DF0CBF07}',
    'HKCR:\Interface\{C47B67D4-BA96-44BC-AB9E-1CAC8EEA9E93}',
    'HKCR:\Local Settings\MrtCache\C:%5CProgram Files%5CMicrosoft OneDrive%5C24.206.1013.0004%5Cresources.pri',
    'HKCR:\Local Settings\Software\Microsoft\Windows\CurrentVersion\AppModel\PackageRepository\Packages\Microsoft.OneDriveSync_25199.1012.2.0_neutral__8wekyb3d8bbwe',
    'HKCR:\Local Settings\Software\Microsoft\Windows\CurrentVersion\AppModel\PolicyCache\Microsoft.OneDriveSync_8wekyb3d8bbwe'
)

$deletedCount = 0
$failedCount = 0

Write-Host "Deleting registry entries..." -ForegroundColor Yellow
Write-Host ""

foreach ($path in $paths) {
    if (Test-Path $path -ErrorAction SilentlyContinue) {
        try {
            Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
            Write-Host "[OK] $path" -ForegroundColor Green
            $deletedCount++
        } catch {
            Write-Host "[FAIL] $path - $_" -ForegroundColor Red
            $failedCount++
        }
    } else {
        Write-Host "[SKIP] $path (not found)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deleted: $deletedCount" -ForegroundColor Green
Write-Host "Failed: $failedCount" -ForegroundColor Yellow
Write-Host ""
Write-Host "Registry cleanup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Run E:\Downloads\OneDriveSetup.exe" -ForegroundColor Yellow
Write-Host ""
pause
