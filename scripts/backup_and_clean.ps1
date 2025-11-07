  # 备份脚本 - 版本 011 (修正版)
  # 任务编号：011
  # 关键字：Opus500502Opted

  $ErrorActionPreference = "Stop"

  Write-Host "========================================" -ForegroundColor Cyan
  Write-Host "  Project Backup - Opus500502Opted" -ForegroundColor Cyan
  Write-Host "========================================" -ForegroundColor Cyan
  Write-Host ""

  $timestamp = Get-Date -Format "yyyyMMddHHmm"
  $taskNumber = "011"
  $keyword = "Opus500502Opted"
  $backupName = "rrxsxyz_next_${timestamp}_${taskNumber}_${keyword}.zip"
  $sourcePath = "D:\_100W\rrxsxyz_next"
  $destFolder = "D:\_100W"
  $destPath = Join-Path $destFolder $backupName

  Write-Host "[INFO] Source: $sourcePath" -ForegroundColor Gray
  Write-Host "[INFO] Destination: $destPath" -ForegroundColor Gray
  Write-Host ""

  # 确保目标目录存在
  if (!(Test-Path $destFolder)) {
      New-Item -ItemType Directory -Path $destFolder -Force | Out-Null
      Write-Host "[INFO] Created destination folder: $destFolder" -ForegroundColor Yellow     
  }

  Write-Host "[1/2] Collecting files (excluding node_modules, .venv, dist)..." -ForegroundColor Yellow

  try {
      # 排除大目录：node_modules, .venv, dist, nul
      $items = Get-ChildItem -Path $sourcePath -Recurse |
               Where-Object {
                 $_.Name -ne 'nul' -and
                 $_.FullName -notmatch '\\node_modules\\' -and
                 $_.FullName -notmatch '\\.venv\\' -and
                 $_.FullName -notmatch '\\dist\\' -and
                 $_.Name -ne 'node_modules' -and
                 $_.Name -ne '.venv' -and
                 $_.Name -ne 'dist'
             } |
               Select-Object -ExpandProperty FullName

      if ($items.Count -gt 0) {
          Write-Host "  Found $($items.Count) files/folders" -ForegroundColor Gray

          Write-Host ""
          Write-Host "[2/2] Creating archive..." -ForegroundColor Yellow

          # 如果目标文件已存在，先删除
          if (Test-Path $destPath) {
              Remove-Item $destPath -Force
              Write-Host "  Removed existing archive" -ForegroundColor Yellow
          }

          # 创建压缩包
          Compress-Archive -Path $items -DestinationPath $destPath -CompressionLevel Optimal -Force

          # 验证文件是否生成
          if (Test-Path $destPath) {
              $backupInfo = Get-Item $destPath
              $sizeInMB = [math]::Round($backupInfo.Length / 1MB, 2)

              Write-Host ""
              Write-Host "========================================" -ForegroundColor Cyan     
              Write-Host "  Backup Complete!" -ForegroundColor Green
              Write-Host "========================================" -ForegroundColor Cyan     
              Write-Host ""
              Write-Host "Filename: $backupName" -ForegroundColor White
              Write-Host "Size: $sizeInMB MB" -ForegroundColor Cyan
              Write-Host "Full Path: $destPath" -ForegroundColor Cyan
              Write-Host ""
          } else {
              throw "Archive file was not created: $destPath"
          }
      } else {
          throw "No files found for backup"
      }
  } catch {
      Write-Host ""
      Write-Host "========================================" -ForegroundColor Red
      Write-Host "  Backup Failed!" -ForegroundColor Red
      Write-Host "========================================" -ForegroundColor Red
      Write-Host ""
      Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
      Write-Host "Location: $($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor Red       
      Write-Host ""
      exit 1
  }