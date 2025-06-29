#!/usr/bin/env node

/**
 * Bundle Analysis Script for Aster Management Frontend
 * Provides detailed analysis of bundle size, dependencies, and optimization opportunities
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuration
const BUNDLE_SIZE_LIMIT = 500 * 1024 // 500KB gzipped
const CHUNK_SIZE_LIMIT = 250 * 1024 // 250KB per chunk

function runCommand(command, description) {
  console.log(`\n🔍 ${description}`)
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' })
    return output
  } catch (error) {
    console.error(`❌ Error running: ${command}`)
    console.error(error.message)
    return null
  }
}

function analyzeBundleSize() {
  console.log('📦 Building production bundle for analysis...')
  
  // Build the production bundle
  runCommand('bun run build', 'Building production bundle')
  
  // Check if .next directory exists
  const nextDir = path.join(process.cwd(), '.next')
  if (!fs.existsSync(nextDir)) {
    console.error('❌ .next directory not found. Build may have failed.')
    return
  }

  // Analyze static directory
  const staticDir = path.join(nextDir, 'static')
  if (fs.existsSync(staticDir)) {
    console.log('\n📊 Static Asset Analysis:')
    
    try {
      const chunks = fs.readdirSync(path.join(staticDir, 'chunks'), { withFileTypes: true })
        .filter(dirent => dirent.isFile() && dirent.name.endsWith('.js'))
        .map(dirent => {
          const filePath = path.join(staticDir, 'chunks', dirent.name)
          const stats = fs.statSync(filePath)
          return {
            name: dirent.name,
            size: stats.size,
            sizeKB: Math.round(stats.size / 1024)
          }
        })
        .sort((a, b) => b.size - a.size)

      console.log('Top 10 largest chunks:')
      chunks.slice(0, 10).forEach(chunk => {
        const status = chunk.size > CHUNK_SIZE_LIMIT ? '⚠️' : '✅'
        console.log(`  ${status} ${chunk.name}: ${chunk.sizeKB}KB`)
      })

      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
      const totalSizeKB = Math.round(totalSize / 1024)
      
      console.log(`\n📈 Total bundle size: ${totalSizeKB}KB`)
      if (totalSize > BUNDLE_SIZE_LIMIT) {
        console.log(`⚠️ Bundle size exceeds recommended limit of ${Math.round(BUNDLE_SIZE_LIMIT / 1024)}KB`)
      } else {
        console.log(`✅ Bundle size within recommended limit`)
      }

    } catch (error) {
      console.error('❌ Error analyzing chunks:', error.message)
    }
  }
}

function checkUnusedDependencies() {
  console.log('\n🔍 Checking for unused dependencies...')
  
  try {
    // Check if depcheck is installed
    runCommand('bunx depcheck --version', 'Checking depcheck availability')
    
    const output = runCommand('bunx depcheck --json', 'Analyzing dependencies')
    if (output) {
      const analysis = JSON.parse(output)
      
      if (analysis.dependencies.length > 0) {
        console.log('\n📦 Unused dependencies found:')
        analysis.dependencies.forEach(dep => {
          console.log(`  - ${dep}`)
        })
        console.log(`\n💡 Consider removing these ${analysis.dependencies.length} unused dependencies`)
      } else {
        console.log('✅ No unused dependencies found')
      }

      if (analysis.devDependencies.length > 0) {
        console.log('\n🛠️ Unused dev dependencies found:')
        analysis.devDependencies.forEach(dep => {
          console.log(`  - ${dep}`)
        })
      }
    }
  } catch (error) {
    console.log('ℹ️ Unable to check dependencies (depcheck not available)')
  }
}

function analyzeLighthouseMetrics() {
  console.log('\n🏠 Performance Recommendations:')
  
  console.log(`
📋 Optimization Checklist:
  
  🎯 Bundle Size Optimizations:
  - [ ] Implement route-based code splitting
  - [ ] Lazy load PDF viewer and chart components  
  - [ ] Enable tree shaking for unused exports
  - [ ] Optimize images with Next.js Image component
  - [ ] Remove development code from production builds

  ⚡ React Performance:
  - [ ] Add React.memo to expensive components
  - [ ] Implement useMemo for heavy calculations
  - [ ] Use useCallback for event handlers
  - [ ] Add virtualization for large lists
  - [ ] Optimize context provider re-renders

  🔄 Caching Strategy:
  - [ ] Enable service worker for static assets
  - [ ] Implement browser cache headers
  - [ ] Add resource hints (preload, prefetch)
  - [ ] Cache API responses appropriately

  📊 Monitoring:
  - [ ] Set up Web Vitals tracking
  - [ ] Monitor bundle size in CI/CD
  - [ ] Track performance regressions
  - [ ] Add real user monitoring (RUM)
  `)
}

function generateReport() {
  const reportPath = path.join(process.cwd(), 'performance-analysis.md')
  const timestamp = new Date().toISOString()
  
  const report = `# Bundle Performance Analysis Report

Generated: ${timestamp}

## Summary

This report analyzes the current bundle performance and provides optimization recommendations.

## Bundle Analysis

Run the following commands for detailed analysis:

\`\`\`bash
# Analyze bundle composition
ANALYZE=true bun run build

# Check for unused dependencies  
bunx depcheck

# Run Lighthouse audit
bunx lighthouse http://localhost:3000 --only-categories=performance --chrome-flags="--headless"

# Profile React components
# Open http://localhost:3000 with React DevTools Profiler
\`\`\`

## Performance Targets

- Bundle size: < 500KB gzipped
- First Contentful Paint: < 1.5s  
- Time to Interactive: < 3.5s
- Largest Contentful Paint: < 2.5s
- Lighthouse Performance Score: > 90

## Next Steps

1. Implement route-based code splitting
2. Add component lazy loading
3. Enable virtualization for matter lists
4. Optimize image loading strategy
5. Set up performance monitoring

---

Generated by Aster Management bundle analyzer
`

  fs.writeFileSync(reportPath, report)
  console.log(`\n📄 Performance report saved to: ${reportPath}`)
}

function main() {
  console.log('🚀 Aster Management Frontend Bundle Analysis')
  console.log('=' .repeat(60))
  
  analyzeBundleSize()
  checkUnusedDependencies()
  analyzeLighthouseMetrics()
  generateReport()
  
  console.log('\n✅ Bundle analysis complete!')
  console.log('\n💡 Next steps:')
  console.log('  1. Review the generated performance-analysis.md')
  console.log('  2. Run ANALYZE=true bun run build for detailed bundle visualization')
  console.log('  3. Use React DevTools Profiler to identify rendering bottlenecks')
}

if (require.main === module) {
  main()
}

module.exports = {
  analyzeBundleSize,
  checkUnusedDependencies,
  analyzeLighthouseMetrics,
  generateReport
}