# Check file sizes
$files = @(
    'progress.md',
    'ideas.md',
    'CLAUDE.md',
    'progress.archive.md',
    'duomotai\index.html',
    'duomotai\homepage.html',
    'index.html',
    '.claude\agent_config.md',
    '.claude\architecture_guide.md',
    '.claude\workflow_rules.md',
    '.claude\dev_handbook.md',
    'duomotai\duomotai_architecture_v10.md'
)

foreach ($f in $files) {
    $path = Join-Path 'D:\_100W\rrxsxyz_next' $f
    if (Test-Path $path) {
        $lines = (Get-Content $path | Measure-Object -Line).Lines
        $size = [math]::Round((Get-Item $path).Length / 1KB, 2)
        Write-Host "$f : $lines lines, $size KB"
    }
}
