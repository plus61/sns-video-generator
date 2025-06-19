#!/usr/bin/env node

// Railway deployment start script
// This script ensures proper startup in Railway environment

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Railway Start Script - SNS Video Generator');
console.log('=====================================');

// Environment check
console.log('📋 Environment Check:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- PORT: ${process.env.PORT || 3000}`);
console.log(`- PWD: ${process.cwd()}`);

// File system check
const requiredFiles = [
  'server.js',
  'package.json',
  '.next/standalone'
];

console.log('\n📁 File System Check:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`- ${file}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
});

// List .next directory contents
console.log('\n📂 .next Directory Contents:');
try {
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    const contents = fs.readdirSync(nextDir);
    contents.forEach(item => {
      console.log(`- ${item}`);
    });
  } else {
    console.log('❌ .next directory not found');
  }
} catch (error) {
  console.log(`❌ Error reading .next directory: ${error.message}`);
}

// Start Next.js server
console.log('\n🚀 Starting Next.js Server...');
const serverPath = path.join(process.cwd(), 'server.js');

// Ensure PORT is available
const port = process.env.PORT || '3000';
const hostname = process.env.HOSTNAME || '0.0.0.0';

console.log(`🎯 Target: ${hostname}:${port}`);

// Try to find the correct server file
const serverOptions = [
  path.join(process.cwd(), 'server.js'),
  path.join(process.cwd(), '.next/standalone/server.js'),
  path.join(process.cwd(), '.next/server.js')
];

let serverFound = false;

for (const serverOption of serverOptions) {
  if (fs.existsSync(serverOption)) {
    console.log(`✅ Found server at: ${serverOption}`);
    serverFound = true;
    
    const child = spawn('node', [serverOption], {
      stdio: 'inherit',
      env: { 
        ...process.env, 
        PORT: port,
        HOSTNAME: hostname
      }
    });
    
    child.on('error', (error) => {
      console.error('❌ Server startup failed:', error);
      process.exit(1);
    });
    
    child.on('exit', (code) => {
      console.log(`🏁 Server exited with code ${code}`);
      process.exit(code || 0);
    });
    
    break;
  }
}

if (!serverFound) {
  console.error('❌ No server.js found! Trying npm start as fallback...');
  
  const child = spawn('npm', ['start'], {
    stdio: 'inherit',
    env: { 
      ...process.env, 
      PORT: port,
      HOSTNAME: hostname
    }
  });
  
  child.on('error', (error) => {
    console.error('❌ npm start failed:', error);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    console.log(`🏁 npm start exited with code ${code}`);
    process.exit(code || 0);
  });
}

// Health check endpoint logging
setTimeout(() => {
  console.log('\n🏥 Health Check Information:');
  console.log(`- Health endpoint: http://${hostname}:${port}/api/health`);
  console.log(`- Railway Public Domain: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'Not set'}`);
  console.log(`- Railway Static URL: ${process.env.RAILWAY_STATIC_URL || 'Not set'}`);
  console.log(`- Railway Environment: ${process.env.RAILWAY_ENVIRONMENT || 'Not set'}`);
}, 5000);