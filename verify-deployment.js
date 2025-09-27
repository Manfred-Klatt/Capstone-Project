#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Checks that all critical files and configurations are correct for Railway deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying deployment configuration...\n');

const checks = [];

// Check 1: Dockerfile exists
const dockerfileExists = fs.existsSync('Dockerfile');
checks.push({
  name: 'Dockerfile exists',
  passed: dockerfileExists,
  message: dockerfileExists ? '✅ Dockerfile found' : '❌ Dockerfile missing'
});

// Check 2: Main entry point exists
const appJsExists = fs.existsSync('src/app.js');
checks.push({
  name: 'Main entry point (src/app.js)',
  passed: appJsExists,
  message: appJsExists ? '✅ src/app.js found' : '❌ src/app.js missing'
});

// Check 3: Package.json has correct main and start script
let packageJsonCorrect = false;
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasCorrectMain = packageJson.main === 'src/app.js';
  const hasCorrectStart = packageJson.scripts && packageJson.scripts.start === 'node src/app.js';
  packageJsonCorrect = hasCorrectMain && hasCorrectStart;
  
  checks.push({
    name: 'Package.json configuration',
    passed: packageJsonCorrect,
    message: packageJsonCorrect ? 
      '✅ Package.json has correct main and start script' : 
      '❌ Package.json main or start script incorrect'
  });
} catch (error) {
  checks.push({
    name: 'Package.json configuration',
    passed: false,
    message: '❌ Could not read package.json'
  });
}

// Check 4: Railway configuration
const railwayJsonExists = fs.existsSync('railway.json');
let railwayConfigCorrect = false;
if (railwayJsonExists) {
  try {
    const railwayConfig = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
    railwayConfigCorrect = railwayConfig.deploy && 
                          railwayConfig.deploy.startCommand === 'node src/app.js' &&
                          railwayConfig.deploy.healthcheckPath === '/api/v1/health';
  } catch (error) {
    // Invalid JSON
  }
}

checks.push({
  name: 'Railway configuration',
  passed: railwayConfigCorrect,
  message: railwayConfigCorrect ? 
    '✅ Railway.json correctly configured' : 
    '❌ Railway.json missing or incorrect'
});

// Check 5: Environment files exist
const envProductionExists = fs.existsSync('.env.production');
checks.push({
  name: 'Production environment file',
  passed: envProductionExists,
  message: envProductionExists ? '✅ .env.production found' : '❌ .env.production missing'
});

// Check 6: Critical middleware files exist
const criticalFiles = [
  'middleware/authMiddleware.js',
  'middleware/errorMiddleware.js',
  'middleware/corsMiddleware.js',
  'src/loaders/express.js',
  'src/loaders/mongodb.js'
];

let allCriticalFilesExist = true;
const missingFiles = [];

criticalFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    allCriticalFilesExist = false;
    missingFiles.push(file);
  }
});

checks.push({
  name: 'Critical middleware files',
  passed: allCriticalFilesExist,
  message: allCriticalFilesExist ? 
    '✅ All critical middleware files found' : 
    `❌ Missing files: ${missingFiles.join(', ')}`
});

// Display results
console.log('📋 Deployment Verification Results:\n');
checks.forEach(check => {
  console.log(`${check.message}`);
});

const allPassed = checks.every(check => check.passed);
console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All checks passed! Deployment should succeed.');
  console.log('\n📝 Deployment checklist:');
  console.log('   1. ✅ Dockerfile created');
  console.log('   2. ✅ Import paths corrected');
  console.log('   3. ✅ Server files clarified');
  console.log('   4. ✅ Environment standardized');
  console.log('\n🚀 Ready for Railway deployment!');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please fix the issues above before deploying.');
  process.exit(1);
}
