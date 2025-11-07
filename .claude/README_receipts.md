Receipt files location and usage

- Location: .claude/receipts/
- Each successful atomic write via `scripts/atomicWriteSafe.js` will create a JSON receipt file named like:
  2025-10-08T12-45-00-000Z__CLAUDE.md.json
- Receipt fields:
  - file: absolute path to the updated file
  - lastLine: integer (line count after write)
  - lastWriteTime: ISO timestamp (local)
  - lastWriteTimeUtc: UTC string
  - author: author passed to atomicWriteSafe
  - reason: reason passed to atomicWriteSafe
  - generatedAt: when receipt was created

To inspect the latest receipt for CLAUDE.md:

```powershell
Get-ChildItem .\.claude\receipts\*__CLAUDE.md.json | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Raw | ConvertFrom-Json
```
