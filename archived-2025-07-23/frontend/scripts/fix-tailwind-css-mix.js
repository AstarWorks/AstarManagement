#!/usr/bin/env node

/**
 * Fix Tailwind CSS Mix Issues
 * 
 * This script fixes issues where CSS properties are mixed with Tailwind classes in @apply directives
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Map of incorrect CSS properties to Tailwind classes
const tailwindFixMap = {
  'align-items: center': 'items-center',
  'align-items: flex-start': 'items-start', 
  'align-items: flex-end': 'items-end',
  'align-items: stretch': 'items-stretch',
  'align-items: baseline': 'items-baseline',
  'justify-content: center': 'justify-center',
  'justify-content: flex-start': 'justify-start',
  'justify-content: flex-end': 'justify-end',
  'justify-content: space-between': 'justify-between',
  'justify-content: space-around': 'justify-around',
  'justify-content: space-evenly': 'justify-evenly',
  'flex-direction: column': 'flex-col',
  'flex-direction: row': 'flex-row',
  'flex-wrap: wrap': 'flex-wrap',
  'flex-wrap: nowrap': 'flex-nowrap'
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
  
  // Fix @apply mixed CSS and Tailwind
  for (const [cssProperty, tailwindClass] of Object.entries(tailwindFixMap)) {
    // Match patterns like "@apply flex flex-direction: column;" 
    const pattern = new RegExp(`(@apply[^;]*?)\\s*${cssProperty.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^;]*?;)`, 'g')
    
    if (pattern.test(newContent)) {
      newContent = newContent.replace(pattern, (match, before, after) => {
        // Replace the CSS property with the Tailwind class
        return `${before} ${tailwindClass}${after}`
      })
      modified = true
      console.log(`Fixed "${cssProperty}" -> "${tailwindClass}" in ${path.relative(process.cwd(), filePath)}`)
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
  console.log('🔧 Fixing Tailwind CSS mixed syntax issues...\n')
  
  const srcDir = path.join(__dirname, '..', 'src')
  const vueFiles = findVueFiles(srcDir)
  
  console.log(`Found ${vueFiles.length} Vue files to check\n`)
  
  let fixedFiles = 0
  
  for (const filePath of vueFiles) {
    if (fixFileCSS(filePath)) {
      fixedFiles++
    }
  }
  
  console.log(`\n✅ Fixed mixed syntax issues in ${fixedFiles} files`)
  
  if (fixedFiles === 0) {
    console.log('🎉 No mixed syntax issues found!')
  } else {
    console.log('🎉 All mixed syntax issues have been fixed!')
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}