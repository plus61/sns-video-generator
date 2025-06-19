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

if (!fs.existsSync(serverPath)) {
  console.error('❌ server.js not found! Using alternative startup...');
  
  // Try alternative startup methods
  const alternatives = [
    'npm start',
    'node .next/standalone/server.js',
    'npx next start'
  ];
  
  for (const alt of alternatives) {
    console.log(`🔄 Trying: ${alt}`);
    try {
      const [cmd, ...args] = alt.split(' ');
      const child = spawn(cmd, args, {
        stdio: 'inherit',
        env: { ...process.env, PORT: process.env.PORT || '3000' }
      });
      
      child.on('error', (error) => {
        console.error(`❌ ${alt} failed:`, error.message);
      });
      
      child.on('exit', (code) => {
        if (code === 0) {
          console.log(`✅ ${alt} started successfully`);
        } else {
          console.error(`❌ ${alt} exited with code ${code}`);
        }
      });
      
      // If process doesn't exit immediately, assume it's running
      setTimeout(() => {
        console.log(`🎯 ${alt} appears to be running`);
        return;
      }, 3000);
      
      break;
    } catch (error) {
      console.error(`❌ Failed to start with ${alt}:`, error.message);
    }
  }
} else {
  // Standard server.js startup
  console.log('✅ server.js found, starting...');
  const child = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: process.env.PORT || '3000' }
  });
  
  child.on('error', (error) => {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    console.log(`🏁 Server exited with code ${code}`);
    process.exit(code);
  });
}

// Health check endpoint logging
setTimeout(() => {
  console.log('\n🏥 Health Check Information:');
  console.log(`- Health endpoint: http://localhost:${process.env.PORT || 3000}/api/health`);
  console.log(`- External URL: ${process.env.RAILWAY_PUBLIC_URL || 'Not set'}`);
}, 5000);