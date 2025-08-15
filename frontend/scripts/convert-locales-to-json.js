#!/usr/bin/env node

/**
 * Convert TypeScript locale files to JSON format
 * Maintains the existing split structure
 */

const fs = require('fs');
const path = require('path');
// const { execSync } = require('child_process');

const LOCALE_DIR = path.join(__dirname, '../app/locales/ja');
const OUTPUT_DIR = path.join(__dirname, '../app/locales/ja');

// List of locale files to convert
const localeFiles = [
  'common',
  'auth',
  'navigation',
  'expense',
  'states',
  'matter',
  'cases',
  'client',
  'document',
  'finance',
  'admin',
  'notification',
  'dashboard',
  'settings',
  'error',
  'header',
  'language'
];

async function convertTsToJson(fileName) {
  const tsFilePath = path.join(LOCALE_DIR, `${fileName}.ts`);
  const jsonFilePath = path.join(OUTPUT_DIR, `${fileName}.json`);
  
  try {
    // Import the TypeScript module
    const moduleContent = require(tsFilePath);
    const localeData = moduleContent.default || moduleContent;
    
    // Write JSON file with proper formatting
    fs.writeFileSync(
      jsonFilePath,
      JSON.stringify(localeData, null, 2),
      'utf-8'
    );
    
    console.log(`✅ Converted: ${fileName}.ts → ${fileName}.json`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to convert ${fileName}.ts:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔄 Starting TypeScript to JSON conversion...\n');
  
  // Create backup directory
  const backupDir = path.join(__dirname, '../app/locales/ja-backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Backup existing TypeScript files
  console.log('📦 Creating backup of TypeScript files...');
  localeFiles.forEach(fileName => {
    const tsFilePath = path.join(LOCALE_DIR, `${fileName}.ts`);
    const backupPath = path.join(backupDir, `${fileName}.ts`);
    if (fs.existsSync(tsFilePath)) {
      fs.copyFileSync(tsFilePath, backupPath);
    }
  });
  console.log('✅ Backup created in app/locales/ja-backup/\n');
  
  // Convert each file
  const results = [];
  for (const fileName of localeFiles) {
    const success = await convertTsToJson(fileName);
    results.push({ fileName, success });
  }
  
  // Summary
  console.log('\n📊 Conversion Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n⚠️  Some files failed to convert. Check the errors above.');
    console.log('Your original files are backed up in app/locales/ja-backup/');
  } else {
    console.log('\n🎉 All files converted successfully!');
    console.log('\nNext steps:');
    console.log('1. Update app/locales/ja.ts to import JSON files');
    console.log('2. Update i18n.config.ts if needed');
    console.log('3. Install @intlify/eslint-plugin-vue-i18n');
    console.log('4. Run typecheck to verify everything works');
  }
}

// Run the script
main().catch(console.error);