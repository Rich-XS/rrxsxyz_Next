#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
精简 index.html - 移除注释、console.log、多余空行
目标: 2076行 → 1500行以内
"""

import re
from pathlib import Path

# 文件路径
index_file = Path(__file__).parent / 'index.html'
backup_file = Path(__file__).parent / f'index.html.backup_{int(__import__("time").time())}'

print(f"读取文件: {index_file}")
content = index_file.read_text(encoding='utf-8')
original_lines = len(content.splitlines())
print(f"原始行数: {original_lines}")

# 1. 移除HTML注释（保留包含 FIX/BUG/Task/✅ 的关键注释）
def should_keep_comment(match):
    comment = match.group(0)
    keywords = ['FIX', 'BUG', 'Task', '✅', 'TODO', 'IMPORTANT']
    return any(kw in comment for kw in keywords)

# 先提取所有注释
comments = list(re.finditer(r'<!--[\s\S]*?-->', content))
kept_comments = {}
removed_count = 0

for match in comments:
    if should_keep_comment(match):
        # 保留这个注释，用占位符标记
        placeholder = f'___COMMENT_PLACEHOLDER_{len(kept_comments)}___'
        kept_comments[placeholder] = match.group(0)
        content = content[:match.start()] + placeholder + content[match.end():]
    else:
        removed_count += 1

# 移除所有剩余的HTML注释
content = re.sub(r'<!--[\s\S]*?-->', '', content)

# 恢复保留的注释
for placeholder, comment in kept_comments.items():
    content = content.replace(placeholder, comment)

print(f"移除HTML注释: {removed_count}个")

# 2. 移除所有console.log/warn/error（包括多行）
console_pattern = r'console\.(log|warn|error|info|debug)\([^)]*\);?'
console_matches = len(re.findall(console_pattern, content))
content = re.sub(console_pattern, '', content)
print(f"移除console语句: {console_matches}个")

# 3. 移除多余空行（最多保留1个连续空行）
content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)

# 4. 移除行尾空格
lines = content.splitlines()
lines = [line.rstrip() for line in lines]
content = '\n'.join(lines)

# 5. 统计精简结果
new_lines = len(content.splitlines())
removed_lines = original_lines - new_lines
percentage = (removed_lines / original_lines * 100) if original_lines > 0 else 0

print(f"精简后行数: {new_lines}")
print(f"减少行数: {removed_lines}")
print(f"减少比例: {percentage:.1f}%")

# 6. 备份原文件
print(f"备份原文件: {backup_file}")
backup_file.write_text(index_file.read_text(encoding='utf-8'), encoding='utf-8')

# 7. 写入精简后的文件
print(f"写入精简文件: {index_file}")
index_file.write_text(content, encoding='utf-8')

# 8. 验证结果
final_lines = len(index_file.read_text(encoding='utf-8').splitlines())
print(f"\n✅ 精简完成！")
print(f"   原始: {original_lines} 行")
print(f"   现在: {final_lines} 行")
print(f"   目标: ≤1500 行")
print(f"   状态: {'✅ 达标' if final_lines <= 1500 else '❌ 未达标，需进一步精简'}")
