# Check global npm packages for 'claude' or 'anthropic'
$out = 'D:\_100W\rrxsxyz_next\INCIDENT\npm_global.txt'
$matchOut = 'D:\_100W\rrxsxyz_next\INCIDENT\npm_matches.txt'
if (Test-Path $out) { Remove-Item $out -Force }
if (Test-Path $matchOut) { Remove-Item $matchOut -Force }
if (Get-Command npm -ErrorAction SilentlyContinue) {
    try {
        npm list -g --depth=0 2>$null | Out-File -FilePath $out -Encoding utf8
        Select-String -Path $out -Pattern 'claude|anthropic' -SimpleMatch | Out-File -FilePath $matchOut -Encoding utf8
        if ((Get-Content $matchOut -ErrorAction SilentlyContinue) -ne $null) {
            Write-Output "Potential matches written to $matchOut"
        } else {
            Write-Output 'No matches found in global npm.'
        }
    } catch {
        Write-Output 'Error running npm list.'
    }
} else {
    Write-Output 'npm not found on PATH.'
}
