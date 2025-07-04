#!/usr/bin/env node

/**
 * Fix CSS Issues Script
 * 
 * This script fixes common CSS issues where Tailwind class names 
 * are incorrectly used as CSS properties instead of actual CSS.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Map of incorrect CSS properties to correct ones
const cssFixMap = {
  'items-center': 'align-items: center',
  'items-start': 'align-items: flex-start', 
  'items-end': 'align-items: flex-end',
  'items-stretch': 'align-items: stretch',
  'items-baseline': 'align-items: baseline',
  'justify-center': 'justify-content: center',
  'justify-start': 'justify-content: flex-start',
  'justify-end': 'justify-content: flex-end',
  'justify-between': 'justify-content: space-between',
  'justify-around': 'justify-content: space-around',
  'justify-evenly': 'justify-content: space-evenly',
  'flex-col': 'flex-direction: column',
  'flex-row': 'flex-direction: row',
  'flex-wrap': 'flex-wrap: wrap',
  'flex-nowrap': 'flex-wrap: nowrap'
}

/**
 * Find all Vue files in a directory recursively
 */
function findVueFiles(dir) {
  const files = []
  
  function walkDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walkDir(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.vue')) {
        files.push(fullPath)
      }
    }
  }
  
  walkDir(dir)
  return files
}

/**
 * Fix CSS issues in a single file
 */
function fixFileCSS(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  let modified = false
  let newContent = content
  
  // Fix CSS properties in <style> sections
  for (const [incorrect, correct] of Object.entries(cssFixMap)) {
    // Match patterns like "  items-center;" in CSS
    const cssPattern = new RegExp(`(\\s+)${incorrect.replace('-', '\\-')}(\\s*;)`, 'g')
    
    if (cssPattern.test(newContent)) {
      newContent = newContent.replace(cssPattern, `$1${correct}$2`)
      modified = true
      console.log(`Fixed "${incorrect}" -> "${correct}" in ${path.relative(process.cwd(), filePath)}`)
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8')
    return true
  }
  
  return false
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Fixing CSS issues in Vue files...\n')
  
  const srcDir = path.join(__dirname, '..', 'src')
  const vueFiles = findVueFiles(srcDir)
  
  console.log(`Found ${vueFiles.length} Vue files to check\n`)
  
  let fixedFiles = 0
  
  for (const filePath of vueFiles) {
    if (fixFileCSS(filePath)) {
      fixedFiles++
    }
  }
  
  console.log(`\n✅ Fixed CSS issues in ${fixedFiles} files`)
  
  if (fixedFiles === 0) {
    console.log('🎉 No CSS issues found!')
  } else {
    console.log('🎉 All CSS issues have been fixed!')
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}