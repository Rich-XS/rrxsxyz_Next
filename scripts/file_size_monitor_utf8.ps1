# file_size_monitor.ps1
# 鏂囦欢澶у皬鐩戞帶鑴氭湰 - 瀹氭湡妫€鏌ユ牳蹇冩枃浠惰鏁帮紝褰撹秴杩囬槇鍊兼椂鎻愮ず褰掓。鎴栨ā鍧楀寲
# 鍒涘缓鏃堕棿: 2025-10-12
# 瑙﹀彂鏉′欢: 鏍稿績鏂囦欢琛屾暟瓒呰繃棰勮闃堝€?
# 鍔熻兘: 鐩戞帶骞舵彁绀洪渶瑕佸綊妗ｆ垨妯″潡鍖栫殑鏂囦欢

param(
    [switch]$Report,            # 鐢熸垚鐩戞帶鎶ュ憡
    [switch]$Alert,             # 浠呮樉绀鸿秴杩囬槇鍊肩殑鏂囦欢
    [string]$TargetFile = ""    # 鎸囧畾鐩戞帶鐩爣鏂囦欢锛堢暀绌哄垯鐩戞帶鎵€鏈夋牳蹇冩枃浠讹級
)

# 閰嶇疆 - 鏍稿績鏂囦欢鍙婂叾闃堝€硷紙琛屾暟锛?
$CoreFiles = @(
    @{Path="D:\_100W\rrxsxyz_next\progress.md"; Threshold=800; Type="璁板綍鏂囦欢"; Action="褰掓。"},
    @{Path="D:\_100W\rrxsxyz_next\ideas.md"; Threshold=500; Type="闇€姹傛枃浠?; Action="褰掓。"},
    @{Path="D:\_100W\rrxsxyz_next\CLAUDE.md"; Threshold=400; Type="閰嶇疆鏂囦欢"; Action="妯″潡鍖?},
    @{Path="D:\_100W\rrxsxyz_next\duomotai\duomotai_architecture_v11.1_executable.md"; Threshold=1000; Type="鏋舵瀯鏂囨。"; Action="妯″潡鍖?},
    @{Path="D:\_100W\rrxsxyz_next\duomotai\index.html"; Threshold=2500; Type="鍓嶇浠ｇ爜"; Action="閲嶆瀯"},
    @{Path="D:\_100W\rrxsxyz_next\.claude\agents\progress-recorder.md"; Threshold=500; Type="Agent閰嶇疆"; Action="妯″潡鍖?}
)

$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$Alerts = @()

# 鍑芥暟: 璁＄畻鏂囦欢琛屾暟
function Get-FileLineCount {
    param([string]$FilePath)

    if (!(Test-Path $FilePath)) {
        return 0
    }

    $Lines = Get-Content $FilePath
    return $Lines.Count
}

# 鍑芥暟: 璁＄畻鏂囦欢澶у皬锛圞B锛?
function Get-FileSizeKB {
    param([string]$FilePath)

    if (!(Test-Path $FilePath)) {
        return 0
    }

    $Size = (Get-Item $FilePath).Length / 1KB
    return [math]::Round($Size, 2)
}

# 鍑芥暟: 鐢熸垚鐘舵€佸浘鏍?
function Get-StatusIcon {
    param(
        [int]$LineCount,
        [int]$Threshold
    )

    $Ratio = $LineCount / $Threshold

    if ($Ratio -ge 1.0) {
        return "馃毃"  # 瓒呰繃闃堝€?
    } elseif ($Ratio -ge 0.8) {
        return "鈿狅笍"  # 鎺ヨ繎闃堝€硷紙80%锛?
    } elseif ($Ratio -ge 0.6) {
        return "馃搳"  # 涓瓑姘村钩锛?0-80%锛?
    } else {
        return "鉁?  # 姝ｅ父姘村钩
    }
}

# 涓绘祦绋?
Write-Host "馃攳 鏂囦欢澶у皬鐩戞帶寮€濮?.." -ForegroundColor Cyan
Write-Host "   鏃堕棿: $Timestamp" -ForegroundColor Gray
Write-Host ""

# 琛ㄦ牸澶?
Write-Host "鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹? -ForegroundColor DarkGray
Write-Host ("{0,-8} {1,-40} {2,-10} {3,-10} {4,-12} {5,-10}" -f "鐘舵€?, "鏂囦欢璺緞", "琛屾暟", "澶у皬(KB)", "闃堝€?, "寤鸿") -ForegroundColor White
Write-Host "鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹? -ForegroundColor DarkGray

foreach ($File in $CoreFiles) {
    # 濡傛灉鎸囧畾浜?TargetFile锛屽垯浠呮鏌ヨ鏂囦欢
    if ($TargetFile -and $File.Path -notlike "*$TargetFile*") {
        continue
    }

    $LineCount = Get-FileLineCount -FilePath $File.Path
    $SizeKB = Get-FileSizeKB -FilePath $File.Path
    $Status = Get-StatusIcon -LineCount $LineCount -Threshold $File.Threshold
    $FileName = Split-Path $File.Path -Leaf

    # 璁＄畻鐧惧垎姣?
    $Percentage = [math]::Round(($LineCount / $File.Threshold) * 100, 0)

    # 鐢熸垚寤鸿
    if ($LineCount -gt $File.Threshold) {
        $Suggestion = "$($File.Action) (瓒呰繃 $Percentage%)"
        $Color = "Red"
        $Alerts += @{File=$FileName; Lines=$LineCount; Threshold=$File.Threshold; Action=$File.Action}
    } elseif ($LineCount -gt ($File.Threshold * 0.8)) {
        $Suggestion = "鎺ヨ繎闃堝€?($Percentage%)"
        $Color = "Yellow"
    } else {
        $Suggestion = "姝ｅ父 ($Percentage%)"
        $Color = "Green"
    }

    # 浠呭湪 Alert 妯″紡涓嬫樉绀鸿秴杩囬槇鍊肩殑鏂囦欢
    if ($Alert -and $LineCount -le $File.Threshold) {
        continue
    }

    # 杈撳嚭琛ㄦ牸琛?
    Write-Host ("{0,-8} {1,-40} {2,-10} {3,-10} {4,-12} {5,-10}" -f `
        $Status, $FileName, $LineCount, $SizeKB, $File.Threshold, $Suggestion) -ForegroundColor $Color
}

Write-Host "鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹? -ForegroundColor DarkGray
Write-Host ""

# 鐢熸垚鎶ュ憡
if ($Report -or $Alerts.Count -gt 0) {
    Write-Host "馃搳 鐩戞帶鎬荤粨:" -ForegroundColor Cyan
    Write-Host "   妫€鏌ユ枃浠舵暟: $($CoreFiles.Count)" -ForegroundColor White
    Write-Host "   璀﹀憡鏁伴噺: $($Alerts.Count)" -ForegroundColor Yellow

    if ($Alerts.Count -gt 0) {
        Write-Host ""
        Write-Host "鈿狅笍  闇€瑕佸鐞嗙殑鏂囦欢:" -ForegroundColor Yellow
        foreach ($Alert in $Alerts) {
            Write-Host "   - $($Alert.File): $($Alert.Lines) 琛岋紙闃堝€?$($Alert.Threshold)锛夆啋 寤鸿 $($Alert.Action)" -ForegroundColor Red
        }

        # 璁板綍鍒板璁℃棩蹇?
        $LogFile = ".claude\audit.log"
        $LogEntry = "[$Timestamp] FILE_SIZE_ALERT $($Alerts.Count) files exceed threshold"
        Add-Content -Path $LogFile -Value $LogEntry

        Write-Host ""
        Write-Host "馃摑 璀﹀憡宸茶褰曞埌 .claude\audit.log" -ForegroundColor Gray
    } else {
        Write-Host "鉁?鎵€鏈夋枃浠跺ぇ灏忔甯? -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "馃弫 鏂囦欢澶у皬鐩戞帶瀹屾垚" -ForegroundColor Cyan
Write-Host ""
Write-Host "馃挕 浣跨敤鏂规硶:" -ForegroundColor Cyan
Write-Host "   -Report       : 鐢熸垚瀹屾暣鐩戞帶鎶ュ憡" -ForegroundColor Gray
Write-Host "   -Alert        : 浠呮樉绀鸿秴杩囬槇鍊肩殑鏂囦欢" -ForegroundColor Gray
Write-Host "   -TargetFile   : 鎸囧畾鐩戞帶鐩爣鏂囦欢锛堝 'progress.md'锛? -ForegroundColor Gray
