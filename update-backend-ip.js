#!/usr/bin/env node

/**
 * Helper script to automatically update the backend IP address
 * Run: node update-backend-ip.js
 *
 * This script will:
 * 1. Get your current IPv4 address from ipconfig
 * 2. Update config/backend.ts with the new IP
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get current IP address from ipconfig
function getCurrentIP() {
  try {
    const output = execSync('ipconfig', { encoding: 'utf-8' });

    // Look for IPv4 Address in Wi-Fi adapter section
    const lines = output.split('\n');
    let inWiFiSection = false;

    for (const line of lines) {
      if (line.includes('Wireless LAN adapter Wi-Fi')) {
        inWiFiSection = true;
      } else if (line.includes('adapter') && inWiFiSection) {
        // Moved to next adapter
        break;
      }

      if (inWiFiSection && line.includes('IPv4 Address')) {
        const match = line.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (match) {
          return match[1];
        }
      }
    }

    throw new Error('Could not find IPv4 address for Wi-Fi adapter');
  } catch (error) {
    console.error('Error getting IP address:', error.message);
    process.exit(1);
  }
}

// Update the config file
function updateConfigFile(newIP) {
  const configPath = path.join(__dirname, 'config', 'backend.ts');

  try {
    let content = fs.readFileSync(configPath, 'utf-8');

    // Replace the HOST value
    content = content.replace(
      /HOST:\s*['"][\d.]+['"]/,
      `HOST: '${newIP}'`
    );

    fs.writeFileSync(configPath, content, 'utf-8');
    console.log(`✅ Successfully updated backend IP to: ${newIP}`);
    console.log(`📁 Updated file: ${configPath}`);
  } catch (error) {
    console.error('Error updating config file:', error.message);
    process.exit(1);
  }
}

// Main
console.log('🔍 Getting current IP address...');
const currentIP = getCurrentIP();
console.log(`📍 Current IP: ${currentIP}`);

console.log('\n📝 Updating config/backend.ts...');
updateConfigFile(currentIP);

console.log('\n✨ Done! Your backend IP has been updated.');
console.log('💡 Make sure to restart your backend server if it\'s running.');
