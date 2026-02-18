#!/usr/bin/env node
/**
 * ChartWise Desktop Build Script
 * Builds .exe for Windows and .dmg for macOS
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 ChartWise Desktop Build Script');
console.log('=================================\n');

// Check if node_modules exists
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Dependencies installed\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const buildWin = args.includes('--win') || args.includes('--all') || args.length === 0;
const buildMac = args.includes('--mac') || args.includes('--all') || args.length === 0;

// Build for Windows
if (buildWin) {
  console.log('🔨 Building for Windows (.exe)...');
  console.log('-----------------------------------');
  try {
    execSync('npm run build:win', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Windows build completed!\n');
    
    // List output files
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath);
      const exeFiles = files.filter(f => f.endsWith('.exe'));
      if (exeFiles.length > 0) {
        console.log('📁 Windows Installer:');
        exeFiles.forEach(f => console.log(`   - dist/${f}`));
        console.log('');
      }
    }
  } catch (error) {
    console.error('❌ Windows build failed:', error.message);
    process.exit(1);
  }
}

// Build for macOS
if (buildMac) {
  console.log('🔨 Building for macOS (.dmg)...');
  console.log('-----------------------------------');
  try {
    execSync('npm run build:mac', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ macOS build completed!\n');
    
    // List output files
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath);
      const dmgFiles = files.filter(f => f.endsWith('.dmg'));
      if (dmgFiles.length > 0) {
        console.log('📁 macOS Installer:');
        dmgFiles.forEach(f => console.log(`   - dist/${f}`));
        console.log('');
      }
    }
  } catch (error) {
    console.error('❌ macOS build failed:', error.message);
    // Don't exit on macOS build failure (might be on Windows/Linux)
    console.log('⚠️  Note: macOS builds can only be created on macOS\n');
  }
}

console.log('✨ Build process completed!');
console.log('\n📂 Output directory: ./dist/');
console.log('\nTo install:');
console.log('  Windows: Run the .exe installer');
console.log('  macOS: Open the .dmg and drag to Applications');
