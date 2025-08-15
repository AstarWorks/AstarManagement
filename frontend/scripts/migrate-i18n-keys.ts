#!/usr/bin/env bun

/**
 * Migration script to update i18n keys from business.* to new domain-specific keys
 * This script will update all $t() calls in Vue files
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs'
import { join, extname } from 'path'

// Define key mappings from old to new
const KEY_MAPPINGS: Record<string, string> = {
    // Dashboard mappings
    'business.dashboard.': 'dashboard.',
    
    // Matter/Cases mappings
    'business.cases.': 'matter.cases.',
    'business.matter.': 'matter.',
    
    // Client mappings
    'business.client.': 'client.',
    
    // Document mappings
    'business.document.': 'document.',
    
    // Finance mappings
    'business.finance.': 'finance.',
    
    // Admin mappings
    'business.admin.': 'admin.',
    
    // Settings mappings
    'business.settings.': 'settings.',
    
    // Notification mappings
    'business.notification.': 'notification.',
}

// Function to recursively find all Vue files
function findVueFiles(dir: string): string[] {
    const files: string[] = []
    
    function walkDir(currentPath: string) {
        const entries = readdirSync(currentPath)
        
        for (const entry of entries) {
            const fullPath = join(currentPath, entry)
            const stat = statSync(fullPath)
            
            if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
                walkDir(fullPath)
            } else if (stat.isFile() && extname(entry) === '.vue') {
                files.push(fullPath)
            }
        }
    }
    
    walkDir(dir)
    return files
}

// Function to migrate keys in a single file
function migrateFile(filePath: string): boolean {
    let content = readFileSync(filePath, 'utf-8')
    let modified = false
    
    // Pattern to match $t() calls
    const patterns = [
        /\$t\(['"]([^'"]+)['"]/g,
        /\$t\(`([^`]+)`/g,
    ]
    
    for (const pattern of patterns) {
        content = content.replace(pattern, (match, key) => {
            // Check if the key needs migration
            for (const [oldPrefix, newPrefix] of Object.entries(KEY_MAPPINGS)) {
                if (key.startsWith(oldPrefix)) {
                    const newKey = key.replace(oldPrefix, newPrefix)
                    modified = true
                    console.log(`  ${filePath}: ${key} → ${newKey}`)
                    
                    // Reconstruct the match with the new key
                    const quote = match.includes("'") ? "'" : match.includes('"') ? '"' : '`'
                    return `$t(${quote}${newKey}${quote}`
                }
            }
            return match
        })
    }
    
    if (modified) {
        writeFileSync(filePath, content, 'utf-8')
    }
    
    return modified
}

// Main function
function main() {
    console.log('🔄 Starting i18n key migration...\n')
    
    const frontendPath = join(process.cwd(), 'frontend', 'app')
    const vueFiles = findVueFiles(frontendPath)
    
    console.log(`Found ${vueFiles.length} Vue files to process\n`)
    
    let modifiedCount = 0
    
    for (const file of vueFiles) {
        if (migrateFile(file)) {
            modifiedCount++
        }
    }
    
    console.log(`\n✅ Migration complete!`)
    console.log(`   Modified ${modifiedCount} files`)
    console.log(`   Total files scanned: ${vueFiles.length}`)
    
    if (modifiedCount > 0) {
        console.log('\n⚠️  Please run the following commands to verify the changes:')
        console.log('   bun run typecheck')
        console.log('   bun run test')
    }
}

// Run the migration
main()