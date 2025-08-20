#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for remaining modules
const modulesToMigrate = [
  'matter', 'cases', 'client', 'document', 'finance', 
  'admin', 'notification', 'dashboard', 'settings', 
  'error', 'header', 'language'
];

const i18nPath = path.join(__dirname, '../i18n/locales/ja');
const modulesPath = path.join(i18nPath, 'modules');

// Migrate each module
modulesToMigrate.forEach(moduleName => {
  const sourceFile = path.join(i18nPath, `${moduleName}.json`);
  const targetDir = path.join(modulesPath, moduleName);
  const targetFile = path.join(targetDir, 'domain.json');
  
  // Check if source file exists
  if (!fs.existsSync(sourceFile)) {
    console.log(`⚠️  Source file not found: ${moduleName}.json`);
    return;
  }
  
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Read and copy content
  try {
    const content = fs.readFileSync(sourceFile, 'utf8');
    fs.writeFileSync(targetFile, content);
    console.log(`✅ Migrated: ${moduleName}.json → modules/${moduleName}/domain.json`);
    
    // Delete old file
    fs.unlinkSync(sourceFile);
    console.log(`🗑️  Deleted: ${moduleName}.json`);
  } catch (error) {
    console.error(`❌ Error migrating ${moduleName}:`, error.message);
  }
});

console.log('\n📝 Migration complete! Now update index.ts...');