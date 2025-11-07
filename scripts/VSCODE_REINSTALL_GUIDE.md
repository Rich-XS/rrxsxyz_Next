# VSCode and VSCodium Complete Uninstall Guide
# ============================================

## Step 1: Backup Your Settings
```powershell
# Backup extensions list
code --list-extensions > vscode_extensions.txt
codium --list-extensions > vscodium_extensions.txt

# Backup settings
Copy-Item "$env:APPDATA\Code\User\settings.json" -Destination "vscode_settings_backup.json"
Copy-Item "$env:APPDATA\VSCodium\User\settings.json" -Destination "vscodium_settings_backup.json"
```

## Step 2: Close All Instances
```powershell
# Kill all VSCode and VSCodium processes
taskkill /F /IM Code.exe
taskkill /F /IM VSCodium.exe
taskkill /F /IM node.exe
```

## Step 3: Uninstall Programs
1. Open Control Panel > Programs and Features
2. Find "Microsoft Visual Studio Code" → Uninstall
3. Find "VSCodium" → Uninstall
4. When prompted, choose "Delete user data" option

## Step 4: Delete All Remaining Files
```powershell
# VSCode directories
Remove-Item -Path "$env:USERPROFILE\.vscode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\Code" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:LOCALAPPDATA\Programs\Microsoft VS Code" -Recurse -Force -ErrorAction SilentlyContinue

# VSCodium directories
Remove-Item -Path "$env:USERPROFILE\.vscodium" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\VSCodium" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:LOCALAPPDATA\Programs\VSCodium" -Recurse -Force -ErrorAction SilentlyContinue

# Claude Code directories
Remove-Item -Path "$env:USERPROFILE\.claude" -Recurse -Force -ErrorAction SilentlyContinue
```

## Step 5: Clean Registry (Optional - Advanced Users)
```powershell
# Run regedit as Administrator
# Delete these keys if they exist:
# HKEY_CURRENT_USER\Software\Microsoft\VSCode
# HKEY_CURRENT_USER\Software\VSCodium
```

## Step 6: Fresh Installation

### VSCode:
1. Download from: https://code.visualstudio.com/
2. Install with default settings
3. DO NOT sign in with Microsoft/GitHub account yet

### VSCodium:
1. Download from: https://vscodium.com/
2. Install with default settings

### Claude Code Extension:
1. Open VSCode/VSCodium
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Claude Code"
4. Install from Anthropic
5. Restart IDE

## Step 7: Restore Settings (Optional)
```powershell
# Restore extensions
Get-Content vscode_extensions.txt | ForEach-Object { code --install-extension $_ }

# Restore settings manually (copy content to new settings.json)
```

## Step 8: Configure Claude Code
1. Open Claude Code panel
2. Sign in with your API key
3. Test with a simple command

## Important Notes:
- After reinstall, DO NOT restore old .claude folder
- Start fresh with new Claude sessions
- Keep project folders outside of OneDrive sync
- Disable Windows Search indexing for project folders