#!/usr/bin/env pwsh
# Backup script excluding project logs and .log files to avoid file-lock errors
param(
    [string]$Keyword = "Nginx"
)

try {
    # timestamp without embedded underscore: YYYYMMDDHHmm
    $ts = Get-Date -Format yyyyMMddHHmm
    $destDir = 'D:\_100W'
    if (-not (Test-Path -Path $destDir)) { New-Item -Path $destDir -ItemType Directory -Force | Out-Null }

    # sanitize keyword: replace spaces with underscore, remove characters illegal in filenames
    $sanitized = $Keyword -replace '\\s+', '_' -replace '[<>:\"/\\|?*]', '' -replace "'", ''
    if ([string]::IsNullOrWhiteSpace($sanitized)) { $sanitized = 'misc' }

    # filename format: rrxsxyz_next_<YYYYMMDDHHmm>_<keyword>.zip
    $dest = Join-Path $destDir ("rrxsxyz_next_${ts}_${sanitized}.zip")
    Write-Output "Creating backup (excluding /logs and *.log): $dest"

    $root = 'D:\_100W\rrxsxyz_next'
    # Collect all files except those under \logs\ and files with .log extension
    $files = Get-ChildItem -Path $root -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch "\\logs\\" -and $_.Extension -ne ".log" } |
        Select-Object -ExpandProperty FullName

    if (-not $files) {
        Write-Error "No files found to archive."
        exit 1
    }

    # Compress-Archive accepts pipeline input of file paths
    $files | Compress-Archive -DestinationPath $dest -Force

    Write-Output "BACKUP_DONE:$ts"
    exit 0
} catch {
    Write-Error "Backup failed: $_"
    exit 1
}
