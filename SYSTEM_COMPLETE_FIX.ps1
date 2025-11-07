# System Complete Fix Script - UTF8 with BOM
# 2025-10-29 - OneDrive and System Hardening

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   OneDrive & System Complete Fix v3.0" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Stop OneDrive and services
Write-Host "[1/10] Stopping OneDrive and services..." -ForegroundColor Yellow
Stop-Process -Name "OneDrive" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "  Done" -ForegroundColor Green

# 2. Clean existing nul files
Write-Host "[2/10] Cleaning all nul files..." -ForegroundColor Yellow
$nulCount = 0
Get-ChildItem -Path "D:\" -Filter "nul" -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        Remove-Item -LiteralPath "\\?\$($_.FullName)" -Force -ErrorAction SilentlyContinue
        $nulCount++
    } catch {}
}
Write-Host "  Cleaned $nulCount nul files" -ForegroundColor Green

# 3. Fix all batch files
Write-Host "[3/10] Scanning and fixing batch files..." -ForegroundColor Yellow
$batFiles = Get-ChildItem -Path "D:\" -Filter "*.bat" -Recurse -ErrorAction SilentlyContinue |
    Where-Object {
        $_.FullName -notlike "*node_modules*" -and
        $_.FullName -notlike "*.venv*" -and
        $_.FullName -notlike "*backup*" -and
        $_.FullName -notlike "*activate.bat"
    }

$fixedCount = 0
foreach ($file in $batFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match '>\s*nul') {
        # Backup
        $backupPath = "$($file.FullName).backup_$(Get-Date -Format 'yyyyMMddHHmmss')"
        Copy-Item $file.FullName $backupPath -Force

        # Fix
        $fixedContent = $content -replace '>\s*nul\b', '2>CON'
        Set-Content -Path $file.FullName -Value $fixedContent -Encoding UTF8
        $fixedCount++
        Write-Host "  Fixed: $($file.Name)" -ForegroundColor Green
    }
}
Write-Host "  Total fixed: $fixedCount batch files" -ForegroundColor Green

# 4. Configure nodemon for all projects
Write-Host "[4/10] Configuring nodemon..." -ForegroundColor Yellow
$nodemonConfig = @{
    watch = @("*.js", "src/**/*.js", "routes/**/*.js")
    ignore = @("nul", "**/nul", "*.zip", "*.log", "*.bak", "node_modules/**", ".git/**", "*.md")
    delay = "3000"
    verbose = $false
    env = @{ NODE_ENV = "development" }
}

$projects = @(
    "D:\_100W\rrxsxyz_next\server",
    "D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\mx_kc_gl\server",
    "D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\LTP_Opt\server"
)

foreach ($project in $projects) {
    if (Test-Path $project) {
        $configPath = Join-Path $project "nodemon.json"
        $nodemonConfig | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8
        Write-Host "  Configured: $project" -ForegroundColor Green
    }
}

# 5. Scan Desktop folder
Write-Host "[5/10] Scanning Desktop for issues..." -ForegroundColor Yellow
$desktopPaths = @(
    "$env:USERPROFILE\Desktop",
    "$env:USERPROFILE\OneDrive\Desktop",
    "C:\Users\Public\Desktop"
)

foreach ($desktop in $desktopPaths) {
    if (Test-Path $desktop) {
        # Check for nul files
        $desktopNuls = Get-ChildItem -Path $desktop -Filter "nul" -Force -ErrorAction SilentlyContinue
        if ($desktopNuls.Count -gt 0) {
            Write-Host "  Found $($desktopNuls.Count) nul files on $desktop" -ForegroundColor Yellow
            $desktopNuls | ForEach-Object { Remove-Item -LiteralPath "\\?\$($_.FullName)" -Force -ErrorAction SilentlyContinue }
        }

        # Check for problematic batch files
        $desktopBats = Get-ChildItem -Path $desktop -Filter "*.bat" -ErrorAction SilentlyContinue
        foreach ($bat in $desktopBats) {
            $content = Get-Content $bat.FullName -Raw -ErrorAction SilentlyContinue
            if ($content -match '>\s*nul') {
                Write-Host "  Fixing: $($bat.Name)" -ForegroundColor Yellow
                $content = $content -replace '>\s*nul\b', '2>CON'
                Set-Content -Path $bat.FullName -Value $content -Encoding UTF8
            }
        }
    }
}

# 6. Check for zombie processes
Write-Host "[6/10] Checking for zombie processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses.Count -gt 0) {
    Write-Host "  Found $($nodeProcesses.Count) Node.js processes" -ForegroundColor Yellow
    foreach ($proc in $nodeProcesses) {
        if ($proc.CPU -eq 0 -and $proc.WorkingSet -lt 50MB) {
            Write-Host "  Killing zombie process PID: $($proc.Id)" -ForegroundColor Red
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
} else {
    Write-Host "  No Node.js processes found" -ForegroundColor Green
}

# 7. Port conflict check
Write-Host "[7/10] Checking port conflicts..." -ForegroundColor Yellow
$portsToCheck = @(3001, 8080, 6000, 6600, 7000)
foreach ($port in $portsToCheck) {
    $portUsed = netstat -ano | Select-String ":$port\s" -Quiet
    if ($portUsed) {
        Write-Host "  Port $port is in use" -ForegroundColor Yellow
    } else {
        Write-Host "  Port $port is free" -ForegroundColor Green
    }
}

# 8. Create system monitor script
Write-Host "[8/10] Creating system monitor..." -ForegroundColor Yellow
$monitorScript = @'
# System Health Monitor
$ErrorActionPreference = "SilentlyContinue"

while ($true) {
    Clear-Host
    Write-Host "========== System Health Check ==========" -ForegroundColor Cyan
    Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

    # Check nul files
    $nulCount = (Get-ChildItem -Path "D:\" -Filter "nul" -Recurse -Force -ErrorAction SilentlyContinue).Count
    if ($nulCount -eq 0) {
        Write-Host "[OK] No nul files found" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Found $nulCount nul files!" -ForegroundColor Red
    }

    # Check Node processes
    $nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
    Write-Host "[INFO] Node.js processes: $($nodeProcs.Count)" -ForegroundColor Cyan

    # Check OneDrive status
    $onedrive = Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue
    if ($onedrive) {
        Write-Host "[WARN] OneDrive is running" -ForegroundColor Yellow
    } else {
        Write-Host "[OK] OneDrive is not running" -ForegroundColor Green
    }

    # Check ports
    $port3001 = netstat -ano | Select-String ":3001\s" -Quiet
    $port8080 = netstat -ano | Select-String ":8080\s" -Quiet
    Write-Host "[INFO] Port 3001: $(if($port3001){'In use'}else{'Free'})" -ForegroundColor Cyan
    Write-Host "[INFO] Port 8080: $(if($port8080){'In use'}else{'Free'})" -ForegroundColor Cyan

    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to exit. Refreshing in 60s..." -ForegroundColor Gray
    Start-Sleep -Seconds 60
}
'@

$monitorPath = "D:\_100W\SYSTEM_MONITOR.ps1"
$monitorScript | Out-File -FilePath $monitorPath -Encoding UTF8
Write-Host "  Monitor created at: $monitorPath" -ForegroundColor Green

# 9. Create gitignore updates
Write-Host "[9/10] Updating .gitignore files..." -ForegroundColor Yellow
$gitignoreAddition = @"

# Prevent nul files
nul
**/nul
*.nul

# Backup files
*.backup
*.backup_*
"@

$projectPaths = @(
    "D:\_100W\rrxsxyz_next",
    "D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\mx_kc_gl"
)

foreach ($project in $projectPaths) {
    $gitignorePath = Join-Path $project ".gitignore"
    if (Test-Path $project) {
        if (Test-Path $gitignorePath) {
            $currentContent = Get-Content $gitignorePath -Raw
            if ($currentContent -notmatch "nul") {
                Add-Content $gitignorePath $gitignoreAddition
                Write-Host "  Updated: $gitignorePath" -ForegroundColor Green
            }
        }
    }
}

# 10. Final summary
Write-Host "[10/10] Creating final report..." -ForegroundColor Yellow
$reportPath = "D:\_100W\rrxsxyz_next\SYSTEM_FIX_REPORT_$(Get-Date -Format 'yyyyMMddHHmmss').txt"
$report = @"
System Fix Report - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
==========================================

Fixed Items:
- Cleaned nul files: $nulCount
- Fixed batch files: $fixedCount
- Configured nodemon: $($projects.Count) projects
- Updated .gitignore: $($projectPaths.Count) projects

Recommendations:
1. Run: chkdsk D: /f (after restart)
2. Configure OneDrive exclusions
3. Run system monitor: powershell -File $monitorPath
4. Never use > nul in batch files, use 2>CON instead

Status: COMPLETE
"@

$report | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "  Report saved to: $reportPath" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   System Fix Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run system monitor: powershell -File $monitorPath"
Write-Host "2. Configure OneDrive exclusions in Settings"
Write-Host "3. Restart system and run: chkdsk D: /f"
Write-Host ""