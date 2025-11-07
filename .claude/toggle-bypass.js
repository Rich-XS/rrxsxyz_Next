#!/usr/bin/env node
/**
 * Toggle ByPass mode for Claude Code
 * Usage: node toggle-bypass.js [ON|OFF|STATUS]
 *
 * Modes:
 *  - ON:  Enable full ByPass mode (auto-approve all tools)
 *  - OFF: Disable ByPass mode (require manual approval)
 *  - STATUS: Show current ByPass status
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const statusPath = path.join(__dirname, 'bypass.status');
const configPath = path.join(os.homedir(), '.claude.json');
const projectRoot = path.resolve(path.join(__dirname, '..'));
const logPath = path.join(__dirname, 'sync-guard.log');

// Normalize Windows path for JSON - use forward slashes first, then check both formats
const projectPathNormalized = projectRoot.replace(/\\/g, '/');
const projectPathDoubleBackslash = projectRoot.replace(/\\/g, '\\\\');

function appendLog(message) {
  const ts = new Date().toISOString();
  try {
    fs.appendFileSync(logPath, `[${ts}] ${message}\n`, 'utf8');
  } catch (e) {
    console.error('Failed to write log:', e.message);
  }
}

function readClaudeConfig() {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read .claude.json:', e.message);
    console.error('Config path:', configPath);
    process.exit(2);
  }
}

function writeClaudeConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write .claude.json:', e.message);
    process.exit(2);
  }
}

function getFullByPassConfig() {
  return {
    "Read": ["**"],
    "Write": ["**"],
    "Edit": ["**"],
    "Glob": ["**"],
    "Grep": ["**"],
    "Bash": ["**"],
    "Task": ["**"],
    "WebFetch": ["**"],
    "WebSearch": ["**"],
    "NotebookEdit": ["**"],
    "TodoWrite": ["**"]
  };
}

function setByPassMode(enabled) {
  const config = readClaudeConfig();

  // Find project config - try both path formats
  if (!config.projects) {
    config.projects = {};
  }

  // Find the actual project key (could be with backslashes or forward slashes)
  let projectKey = null;
  for (const key of Object.keys(config.projects)) {
    // Normalize both keys to forward slashes for comparison
    const normalizedKey = key.replace(/\\/g, '/').toLowerCase();
    if (normalizedKey === projectPathNormalized.toLowerCase()) {
      projectKey = key;
      break;
    }
  }

  // If not found, create with double backslash format
  if (!projectKey) {
    projectKey = projectPathDoubleBackslash;
    config.projects[projectKey] = {};
    console.log('Creating new project config with key:', projectKey);
  }

  if (enabled) {
    config.projects[projectKey].allowedTools = getFullByPassConfig();
    fs.writeFileSync(statusPath, 'ON', 'utf8');
    console.log('✅ ByPass mode ENABLED');
    console.log('   All tools will be auto-approved for this project.');
    console.log('   ⚠️  Please restart Claude Code for changes to take effect.');
    appendLog('INFO: ByPass mode enabled');
  } else {
    config.projects[projectKey].allowedTools = [];
    fs.writeFileSync(statusPath, 'OFF', 'utf8');
    console.log('❌ ByPass mode DISABLED');
    console.log('   Manual approval required for all tools.');
    console.log('   ⚠️  Please restart Claude Code for changes to take effect.');
    appendLog('INFO: ByPass mode disabled');
  }

  writeClaudeConfig(config);
}

function getStatus() {
  try {
    const status = fs.readFileSync(statusPath, 'utf8').trim();
    console.log(`Current ByPass status: ${status}`);

    // Also check actual config
    const config = readClaudeConfig();

    // Find the actual project key
    let projectKey = null;
    let projectConfig = null;
    for (const key of Object.keys(config.projects || {})) {
      const normalizedKey = key.replace(/\\/g, '/').toLowerCase();
      if (normalizedKey === projectPathNormalized.toLowerCase()) {
        projectKey = key;
        projectConfig = config.projects[key];
        break;
      }
    }

    if (projectConfig && projectConfig.allowedTools) {
      const toolCount = Object.keys(projectConfig.allowedTools).length;
      console.log(`Config: ${toolCount} tools configured for key: ${projectKey}`);
      if (toolCount > 0) {
        console.log('Auto-approved tools:', Object.keys(projectConfig.allowedTools).join(', '));
      }
    } else {
      console.log('Config: No tools auto-approved');
      console.log('Project path:', projectRoot);
      console.log('Looking for keys matching:', projectPathNormalized);
    }

    return status;
  } catch (e) {
    console.log('Current ByPass status: UNKNOWN (status file not found)');
    return 'UNKNOWN';
  }
}

// Main
const mode = process.argv[2]?.toUpperCase();

switch (mode) {
  case 'ON':
    setByPassMode(true);
    break;

  case 'OFF':
    setByPassMode(false);
    break;

  case 'STATUS':
    getStatus();
    break;

  default:
    console.log('Usage: node toggle-bypass.js [ON|OFF|STATUS]');
    console.log('');
    console.log('Commands:');
    console.log('  ON      - Enable full ByPass mode (auto-approve all tools)');
    console.log('  OFF     - Disable ByPass mode (manual approval required)');
    console.log('  STATUS  - Show current ByPass mode status');
    console.log('');
    console.log('Project:', projectRoot);
    console.log('Config:', configPath);
    process.exit(1);
}
