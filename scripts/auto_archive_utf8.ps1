# auto_archive.ps1
# 鑷姩褰掓。鏈哄埗 - 褰?progress.md TODO 鍖哄潡 > 200 涓换鍔℃椂锛岃嚜鍔ㄥ綊妗ｅ凡瀹屾垚浠诲姟
# 鍒涘缓鏃堕棿: 2025-10-12
# 瑙﹀彂鏉′欢: progress.md TODO 鍖哄潡浠诲姟鏁?> 200 鎴?ideas.md [x] 浜嬮」 > 100
# 鍔熻兘: 鑷姩褰掓。鍒?progress.archive.md 鍜?ideas.archive.md

param(
    [switch]$Execute,           # 瀹為檯鎵ц褰掓。鎿嶄綔锛堥粯璁や负棰勮妯″紡锛?
    [switch]$Force,             # 寮哄埗褰掓。锛堝拷鐣ラ槇鍊兼鏌ワ級
    [string]$TargetFile = "",   # 鎸囧畾褰掓。鐩爣鏂囦欢锛坧rogress.md 鎴?ideas.md锛?
    [int]$Threshold = 200       # 浠诲姟鏁伴槇鍊硷紙榛樿 200锛?
)

# 閰嶇疆
$ProgressFile = "D:\_100W\rrxsxyz_next\progress.md"
$ProgressArchive = "D:\_100W\rrxsxyz_next\progress.archive.md"
$IdeasFile = "D:\_100W\rrxsxyz_next\ideas.md"
$IdeasArchive = "D:\_100W\rrxsxyz_next\ideas.archive.md"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"

# 鍑芥暟: 璁＄畻 TODO 浠诲姟鏁?
function Count-TodoTasks {
    param([string]$FilePath)

    if (!(Test-Path $FilePath)) {
        Write-Host "閿欒: 鏂囦欢涓嶅瓨鍦?$FilePath" -ForegroundColor Red
        return 0
    }

    $Content = Get-Content $FilePath -Raw

    # 璁＄畻 progress.md 鐨?TODO 浠诲姟鏁帮紙鏍煎紡: - [ ] #ID [OPEN]锛?
    if ($FilePath -like "*progress.md") {
        $TodoMatches = [regex]::Matches($Content, '- \[ \] #\d+|\[ \] T-\d+')
        return $TodoMatches.Count
    }

    # 璁＄畻 ideas.md 鐨勫凡瀹屾垚浜嬮」鏁帮紙鏍煎紡: [x]#ID锛?
    if ($FilePath -like "*ideas.md") {
        $CompletedMatches = [regex]::Matches($Content, '\[x\]#\d+')
        return $CompletedMatches.Count
    }

    return 0
}

# 鍑芥暟: 鎵ц褰掓。鎿嶄綔
function Invoke-Archive {
    param(
        [string]$SourceFile,
        [string]$ArchiveFile
    )

    Write-Host "鈴?姝ｅ湪褰掓。 $SourceFile ..." -ForegroundColor Cyan

    # 璇诲彇婧愭枃浠跺唴瀹?
    if (!(Test-Path $SourceFile)) {
        Write-Host "閿欒: 婧愭枃浠朵笉瀛樺湪 $SourceFile" -ForegroundColor Red
        return $false
    }

    $Content = Get-Content $SourceFile -Raw

    # 璋冪敤 progress-recorder agent 鎵ц褰掓。
    # 鐢变簬 PowerShell 鏃犳硶鐩存帴璋冪敤 agent锛岃繖閲岃褰曞綊妗ｈ姹傚埌鏃ュ織
    $LogFile = ".claude\audit.log"
    $LogEntry = "[$Timestamp] AUTO_ARCHIVE_REQUEST $SourceFile -> $ArchiveFile (Threshold: $Threshold)"
    Add-Content -Path $LogFile -Value $LogEntry

    Write-Host "鉁?褰掓。璇锋眰宸茶褰曞埌 audit.log" -ForegroundColor Green
    Write-Host "馃摑 璇疯皟鐢?progress-recorder agent 鎵ц褰掓。:" -ForegroundColor Yellow
    Write-Host "   瑙﹀彂璇? >>archive" -ForegroundColor Yellow

    return $true
}

# 涓绘祦绋?
Write-Host "馃攳 鑷姩褰掓。妫€鏌ュ紑濮?.." -ForegroundColor Cyan
Write-Host "   鏃堕棿: $Timestamp" -ForegroundColor Gray
Write-Host "   闃堝€? $Threshold 涓换鍔? -ForegroundColor Gray
Write-Host ""

# 妫€鏌?progress.md
$ProgressTodoCount = Count-TodoTasks -FilePath $ProgressFile
Write-Host "馃搵 progress.md TODO 浠诲姟鏁? $ProgressTodoCount" -ForegroundColor White

if ($ProgressTodoCount -gt $Threshold -or $Force) {
    Write-Host "鈿狅笍  瓒呰繃闃堝€硷紒寤鸿褰掓。 progress.md" -ForegroundColor Yellow

    if ($Execute) {
        Invoke-Archive -SourceFile $ProgressFile -ArchiveFile $ProgressArchive
    } else {
        Write-Host "馃挕 鎻愮ず: 浣跨敤 -Execute 鍙傛暟瀹為檯鎵ц褰掓。" -ForegroundColor Cyan
    }
} else {
    Write-Host "鉁?progress.md 浠诲姟鏁版甯革紝鏃犻渶褰掓。" -ForegroundColor Green
}

Write-Host ""

# 妫€鏌?ideas.md
$IdeasCompletedCount = Count-TodoTasks -FilePath $IdeasFile
Write-Host "馃搵 ideas.md 宸插畬鎴愪簨椤规暟: $IdeasCompletedCount" -ForegroundColor White

if ($IdeasCompletedCount -gt 100 -or $Force) {
    Write-Host "鈿狅笍  瓒呰繃闃堝€硷紒寤鸿褰掓。 ideas.md" -ForegroundColor Yellow

    if ($Execute) {
        Invoke-Archive -SourceFile $IdeasFile -ArchiveFile $IdeasArchive
    } else {
        Write-Host "馃挕 鎻愮ず: 浣跨敤 -Execute 鍙傛暟瀹為檯鎵ц褰掓。" -ForegroundColor Cyan
    }
} else {
    Write-Host "鉁?ideas.md 宸插畬鎴愪簨椤规暟姝ｅ父锛屾棤闇€褰掓。" -ForegroundColor Green
}

Write-Host ""
Write-Host "馃弫 鑷姩褰掓。妫€鏌ュ畬鎴? -ForegroundColor Cyan
