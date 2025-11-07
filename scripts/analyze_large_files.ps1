  # 分析大文件 - 找出占用空间的文件
  $sourcePath = "D:\_100W\rrxsxyz_next"

  # 排除的目录（和备份脚本保持一致）
  $excludePatterns = @(
      '*\node_modules\*',
      '*\.venv\*',
      '*\.git\*',
      '*\dist\*',
      '*\build\*',
      '*\logs\*',
      '*\Backup\*',
      '*\.cache\*',
      '*\.claude\backups\*',
      '*\.claude\snapshots\*'
  )

  Write-Host "Finding large files..." -ForegroundColor Yellow

  Get-ChildItem -Path $sourcePath -Recurse -File -ErrorAction SilentlyContinue |
      Where-Object {
          $file = $_
          $include = $true
          foreach ($pattern in $excludePatterns) {
              if ($file.FullName -like $pattern) { $include = $false; break }
          }
          $include -and $file.Name -ne 'nul'
      } |
      Sort-Object Length -Descending |
      Select-Object -First 30 @{Name='Size(MB)';Expression={[math]::Round($_.Length/1MB,2)}}, Name,        
  DirectoryName |
      Format-Table -AutoSize