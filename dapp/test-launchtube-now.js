#!/usr/bin/env node

/**
 * Quick Launchtube Test Script
 * Run this to test your Launchtube configuration
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
config();

const LAUNCHTUBE_BASE_URL = 'https://testnet.launchtube.xyz';
const token = process.env.PUBLIC_LAUNCHTUBE_TOKEN;
const enabled = process.env.PUBLIC_USE_LAUNCHTUBE;

console.log('🚀 Testing Launchtube Configuration...\n');

// Test 1: Configuration
console.log('📋 Configuration Check:');
console.log(`  Enabled: ${enabled}`);
console.log(`  Token: ${token ? `${token.substring(0, 20)}...` : 'NOT SET'}`);
console.log(`  Base URL: ${LAUNCHTUBE_BASE_URL}`);

if (enabled !== 'true') {
  console.log('❌ Launchtube is not enabled. Set PUBLIC_USE_LAUNCHTUBE="true"');
  process.exit(1);
}

if (!token) {
  console.log('❌ No token configured. Set PUBLIC_LAUNCHTUBE_TOKEN in your .env file');
  process.exit(1);
}

// Test 2: Token format
console.log('\n🔍 Token Validation:');
const tokenParts = token.split('.');
if (tokenParts.length === 3) {
  console.log('✅ Token format is valid (JWT with 3 parts)');
  
  try {
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log(`  Subject: ${payload.sub?.substring(0, 20)}...`);
    console.log(`  Credits: ${payload.credits?.toLocaleString()}`);
    console.log(`  Expires: ${new Date(payload.exp * 1000).toISOString()}`);
  } catch (e) {
    console.log('⚠️  Could not decode token payload');
  }
} else {
  console.log('❌ Invalid token format. Should be a JWT with 3 parts separated by dots');
  process.exit(1);
}

// Test 3: API connectivity
console.log('\n🌐 Testing API Connectivity...');

try {
  const response = await fetch(`${LAUNCHTUBE_BASE_URL}/info`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.ok) {
    const credits = await response.text();
    console.log(`✅ API connection successful`);
    console.log(`  Available credits: ${parseInt(credits).toLocaleString()} stroops`);
    
    if (parseInt(credits) < 1000) {
      console.log('⚠️  Low credits warning');
    }
  } else {
    console.log(`❌ API request failed: ${response.status} ${response.statusText}`);
    const errorText = await response.text();
    console.log(`  Error: ${errorText}`);
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Network error: ${error.message}`);
  process.exit(1);
}

// Test 4: Environment file check
console.log('\n📁 Environment File Check:');
try {
  const envContent = readFileSync('.env', 'utf8');
  const hasLaunchtube = envContent.includes('PUBLIC_USE_LAUNCHTUBE="true"');
  const hasToken = envContent.includes('PUBLIC_LAUNCHTUBE_TOKEN=') && !envContent.includes('PUBLIC_LAUNCHTUBE_TOKEN=""');
  
  if (hasLaunchtube && hasToken) {
    console.log('✅ .env file is properly configured');
  } else {
    console.log('⚠️  .env file may need updates');
    if (!hasLaunchtube) console.log('  - Set PUBLIC_USE_LAUNCHTUBE="true"');
    if (!hasToken) console.log('  - Set PUBLIC_LAUNCHTUBE_TOKEN with your JWT');
  }
} catch (e) {
  console.log('⚠️  Could not read .env file');
}

console.log('\n🎉 All tests passed! Launchtube is ready to use.');
console.log('\nNext steps:');
console.log('1. Start your dev server: npm run dev');
console.log('2. Open browser console and run: testLaunchtube()');
console.log('3. Try a transaction (vote, commit, etc.) - it should use Launchtube');
console.log('4. Check console for "Submitting transaction via Launchtube..." message');