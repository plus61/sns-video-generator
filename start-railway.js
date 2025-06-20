#!/usr/bin/env node

// Railway Deployment Start Script - Emergency Fixed Version
// This script ensures proper startup in Railway environment

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY RAILWAY START SCRIPT - FIXED VERSION');
console.log('=================================================');

// Environment check
console.log('📋 Environment Check:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- PORT: ${process.env.PORT || 3000}`);
console.log(`- HOSTNAME: ${process.env.HOSTNAME || '0.0.0.0'}`);
console.log(`- PWD: ${process.cwd()}`);
console.log(`- Railway Environment: ${process.env.RAILWAY_ENVIRONMENT || 'Not detected'}`);
console.log(`- Railway Public Domain: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'Not set'}`);

// Critical file system check
const criticalFiles = [
  'server.js',
  'package.json',
  '.next/static',
  'public'
];

console.log('\n🔍 Critical File System Check:');
criticalFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  const exists = fs.existsSync(fullPath);
  console.log(`- ${file}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
  
  if (!exists && file === 'server.js') {
    console.log('  🔍 Searching for alternative server files...');
    const alternatives = [
      '.next/standalone/server.js',
      'node_modules/next/dist/server/next-server.js'
    ];
    
    alternatives.forEach(alt => {
      const altPath = path.join(process.cwd(), alt);
      const altExists = fs.existsSync(altPath);
      console.log(`    - ${alt}: ${altExists ? '✅ FOUND' : '❌ NOT FOUND'}`);
    });
  }
});

// Comprehensive directory listing
console.log('\n📂 Current Directory Structure:');
try {
  const items = fs.readdirSync(process.cwd());
  items.forEach(item => {
    const itemPath = path.join(process.cwd(), item);
    const stats = fs.statSync(itemPath);
    const type = stats.isDirectory() ? '📁' : '📄';
    console.log(`${type} ${item}`);
    
    // Show .next subdirectories
    if (item === '.next' && stats.isDirectory()) {
      try {
        const nextItems = fs.readdirSync(itemPath);
        nextItems.forEach(nextItem => {
          console.log(`  📄 .next/${nextItem}`);
        });
      } catch (err) {
        console.log(`  ❌ Error reading .next: ${err.message}`);
      }
    }
  });
} catch (error) {
  console.log(`❌ Error reading directory: ${error.message}`);
}

// Server startup logic - Multiple fallback strategies
console.log('\n🚀 Starting Server with Emergency Protocol...');

const port = process.env.PORT || '3000';
const hostname = process.env.HOSTNAME || '0.0.0.0';

console.log(`🎯 Target: ${hostname}:${port}`);

// Server location strategies (priority order)
const serverStrategies = [
  {
    name: 'Direct server.js',
    path: path.join(process.cwd(), 'server.js'),
    command: 'node',
    args: ['server.js']
  },
  {
    name: 'Standalone server.js',
    path: path.join(process.cwd(), '.next/standalone/server.js'),
    command: 'node',
    args: ['.next/standalone/server.js']
  },
  {
    name: 'NPM start fallback',
    path: path.join(process.cwd(), 'package.json'),
    command: 'npm',
    args: ['start']
  },
  {
    name: 'Next.js direct',
    path: path.join(process.cwd(), 'package.json'),
    command: 'npx',
    args: ['next', 'start']
  }
];

let serverStarted = false;

for (const strategy of serverStrategies) {
  console.log(`\n🔄 Trying strategy: ${strategy.name}`);
  
  if (strategy.name !== 'NPM start fallback' && strategy.name !== 'Next.js direct') {
    if (!fs.existsSync(strategy.path)) {
      console.log(`❌ Required file missing: ${strategy.path}`);
      continue;
    }
  }

  console.log(`✅ Executing: ${strategy.command} ${strategy.args.join(' ')}`);
  
  const child = spawn(strategy.command, strategy.args, {
    stdio: 'inherit',
    env: { 
      ...process.env, 
      PORT: port,
      HOSTNAME: hostname,
      NODE_ENV: 'production'
    },
    cwd: process.cwd()
  });
  
  // Handle startup success/failure
  child.on('error', (error) => {
    console.error(`❌ Strategy "${strategy.name}" failed:`, error.message);
    if (strategy === serverStrategies[serverStrategies.length - 1]) {
      console.error('🚨 ALL STRATEGIES FAILED! Emergency exit.');
      process.exit(1);
    }
  });
  
  child.on('exit', (code, signal) => {
    console.log(`🏁 Strategy "${strategy.name}" exited with code ${code}, signal ${signal}`);
    if (code !== 0 && code !== null) {
      console.error(`❌ Strategy "${strategy.name}" failed with exit code ${code}`);
      if (strategy === serverStrategies[serverStrategies.length - 1]) {
        console.error('🚨 ALL STRATEGIES FAILED! Emergency exit.');
        process.exit(code || 1);
      }
    } else {
      process.exit(code || 0);
    }
  });
  
  // Give the process time to start and potentially fail quickly
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // If we get here without the process failing, assume success
  serverStarted = true;
  console.log(`✅ Strategy "${strategy.name}" started successfully!`);
  break;
}

if (!serverStarted) {
  console.error('🚨 CRITICAL: No server strategy succeeded!');
  console.error('💡 Debug info:');
  console.error('- Check if Next.js build completed successfully');
  console.error('- Verify standalone output is generated');
  console.error('- Check file permissions');
  process.exit(1);
}

// Health check and monitoring
setTimeout(() => {
  console.log('\n🏥 Railway Health Check Information:');
  console.log(`- Internal Health endpoint: http://${hostname}:${port}/api/health`);
  console.log(`- Railway Public Domain: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'Not set'}`);
  console.log(`- Railway Static URL: ${process.env.RAILWAY_STATIC_URL || 'Not set'}`);
  console.log(`- Railway Environment: ${process.env.RAILWAY_ENVIRONMENT || 'Not set'}`);
  console.log('\n🔄 Server should be running now. Check Railway logs for any issues.');
}, 5000);

// Keep the script alive
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Async wrapper for the delay
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}