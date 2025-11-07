# PowerShell脚本：批量为roles.js添加gender字段
# 用途：在每个nickname行后添加gender字段

$filePath = "D:\_100W\rrxsxyz_next\duomotai\src\config\roles.js"
$content = Get-Content -Path $filePath -Raw

# 定义替换映射（nickname → gender）
$replacements = @{
    "nickname: 'Elon \(男\)'," = "nickname: 'Elon (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化（从nickname分离）"
    "nickname: 'Jane \(女\)'," = "nickname: 'Jane (女)',`n    gender: 'female',  // ✅ [D-98] 性别参数独立化"
    "nickname: 'Donald \(男\)'," = "nickname: 'Donald (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化"
    "nickname: 'Chloe \(女\)'," = "nickname: 'Chloe (女)',`n    gender: 'female',  // ✅ [D-98] 性别参数独立化"
    "nickname: 'Zeus \(男\)'," = "nickname: 'Zeus (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化"
    "nickname: 'Clara \(女\)'," = "nickname: 'Clara (女)',`n    gender: 'female',  // ✅ [D-98] 性别参数独立化"
    "nickname: 'Mark \(男\)'," = "nickname: 'Mark (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化"
    "nickname: 'Eve \(女\)'," = "nickname: 'Eve (女)',`n    gender: 'female',  // ✅ [D-98] 性别参数独立化"
    "nickname: 'Jack \(男\)'," = "nickname: 'Jack (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化"
    "nickname: 'Mary \(女\)'," = "nickname: 'Mary (女)',`n    gender: 'female',  // ✅ [D-98] 性别参数独立化"
    "nickname: 'Rick \(男\)'," = "nickname: 'Rick (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化"
    "nickname: 'Jason \(男\)'," = "nickname: 'Jason (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化"
    "nickname: 'Joy \(女\)'," = "nickname: 'Joy (女)',`n    gender: 'female',  // ✅ [D-98] 性别参数独立化"
    "nickname: 'Liam \(男\)'," = "nickname: 'Liam (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化"
    "nickname: 'Owen \(男\)'," = "nickname: 'Owen (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化"
    "nickname: 'Victoria \(女\)'," = "nickname: 'Victoria (女)',`n    gender: 'female',  // ✅ [D-98] 性别参数独立化"
}

# 执行批量替换（注意：第一个角色Elon已经手动添加了gender字段，跳过）
$content = $content -replace "nickname: 'Jane \(女\)',", "nickname: 'Jane (女)',`n    gender: 'female',  // ✅ [D-98] 性别参数独立化"
$content = $content -replace "nickname: 'Donald \(男\)',", "nickname: 'Donald (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化"
$content = $content -replace "nickname: 'Chloe \(女\)',", "nickname: 'Chloe (女)',`n    gender: 'female',  // ✅ [D-98] 性别参数独立化"
$content = $content -replace "nickname: 'Zeus \(男\)',", "nickname: 'Zeus (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化"
$content = $content -replace "nickname: 'Clara \(女\)',", "nickname: 'Clara (女)',`n    gender: 'female',  // ✅ [D-98] 性别参数独立化"
$content = $content -replace "nickname: 'Mark \(男\)',", "nickname: 'Mark (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化"
$content = $content -replace "nickname: 'Eve \(女\)',", "nickname: 'Eve (女)',`n    gender: 'female',  // ✅ [D-98] 性别参数独立化"
$content = $content -replace "nickname: 'Jack \(男\)',", "nickname: 'Jack (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化"
$content = $content -replace "nickname: 'Mary \(女\)',", "nickname: 'Mary (女)',`n    gender: 'female',  // ✅ [D-98] 性别参数独立化"
$content = $content -replace "nickname: 'Rick \(男\)',", "nickname: 'Rick (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化"
$content = $content -replace "nickname: 'Jason \(男\)',", "nickname: 'Jason (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化"
$content = $content -replace "nickname: 'Joy \(女\)',", "nickname: 'Joy (女)',`n    gender: 'female',  // ✅ [D-98] 性别参数独立化"
$content = $content -replace "nickname: 'Liam \(男\)',", "nickname: 'Liam (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化"
$content = $content -replace "nickname: 'Owen \(男\)',", "nickname: 'Owen (男)',`n    gender: 'male',  // ✅ [D-98] 性别参数独立化"
$content = $content -replace "nickname: 'Victoria \(女\)',", "nickname: 'Victoria (女)',`n    gender: 'female',  // ✅ [D-98] 性别参数独立化"

# 写回文件
Set-Content -Path $filePath -Value $content -Encoding UTF8

Write-Host "✅ 完成！已为所有16个角色添加gender字段"
Write-Host "📝 保存位置: $filePath"
