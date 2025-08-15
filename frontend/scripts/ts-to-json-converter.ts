#!/usr/bin/env bun

/**
 * TypeScript to JSON converter for locale files
 * Uses Bun's native TypeScript support
 */

import fs from 'fs';
import path from 'path';

const LOCALE_DIR = path.join(import.meta.dir, '../app/locales/ja');

// List of locale files to convert
const localeFiles = [
  'auth',
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

async function convertTsToJson(fileName: string): Promise<boolean> {
  const tsFilePath = path.join(LOCALE_DIR, `${fileName}.ts`);
  const jsonFilePath = path.join(LOCALE_DIR, `${fileName}.json`);
  
  // Skip if JSON already exists
  if (fs.existsSync(jsonFilePath)) {
    console.log(`⏭️  Skipping ${fileName}.json (already exists)`);
    return true;
  }
  
  try {
    // Import the TypeScript module
    const module = await import(tsFilePath);
    const localeData = module.default;
    
    // Write JSON file with proper formatting
    fs.writeFileSync(
      jsonFilePath,
      JSON.stringify(localeData, null, 2),
      'utf-8'
    );
    
    console.log(`✅ Converted: ${fileName}.ts → ${fileName}.json`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to convert ${fileName}.ts:`, error);
    return false;
  }
}

async function main() {
  console.log('🔄 Starting TypeScript to JSON conversion...\n');
  
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
  
  if (successful > 0) {
    console.log('\n🎉 Conversion completed!');
    console.log('\nNext steps:');
    console.log('1. Update app/locales/ja.ts to import JSON files');
    console.log('2. Install @intlify/eslint-plugin-vue-i18n');
    console.log('3. Configure ESLint for i18n validation');
  }
}

// Run the script
main().catch(console.error);