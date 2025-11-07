# Backup script: creates a timestamped ZIP of the project with keyword 'Nginx' in the filename
try {
    $ts = Get-Date -Format yyyyMMdd_HHmm
    $destDir = 'D:\_100W'
    if (-not (Test-Path -Path $destDir)) {
        New-Item -Path $destDir -ItemType Directory -Force | Out-Null
    }
    $dest = Join-Path $destDir ("backup_${ts}_Nginx.zip")
    Write-Output "Creating backup: $dest"

    # Use Compress-Archive to zip the whole project folder contents
    Compress-Archive -Path 'D:\_100W\rrxsxyz_next\*' -DestinationPath $dest -Force

    Write-Output "BACKUP_DONE:$ts"
    exit 0
} catch {
    Write-Error "Backup failed: $_"
    exit 1
}
