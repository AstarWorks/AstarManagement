import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { gzipSync } from 'zlib'

interface BundleMetrics {
  totalSize: number
  gzippedSize: number
  jsSize: number
  cssSize: number
  chunkCount: number
  largestChunk: {
    name: string
    size: number
  }
}

describe('Bundle Size Performance Tests', () => {
  const buildDir = '.output/public'
  let bundleMetrics: BundleMetrics

  // Performance budgets for legal case management app
  const budgets = {
    totalSize: 500 * 1024,        // 500KB total
    gzippedSize: 200 * 1024,      // 200KB gzipped
    jsSize: 300 * 1024,           // 300KB JavaScript
    cssSize: 100 * 1024,          // 100KB CSS
    largestChunk: 150 * 1024,     // 150KB largest chunk
    criticalBundle: 50 * 1024,    // 50KB for critical path
  }

  beforeAll(() => {
    // Analyze build output
    bundleMetrics = analyzeBuildOutput(buildDir)
  })

  function analyzeBuildOutput(dir: string): BundleMetrics {
    const metrics: BundleMetrics = {
      totalSize: 0,
      gzippedSize: 0,
      jsSize: 0,
      cssSize: 0,
      chunkCount: 0,
      largestChunk: { name: '', size: 0 }
    }

    try {
      analyzeDirectory(dir, metrics)
    } catch (error) {
      console.warn('Build directory not found. Run "bun run build" first.')
    }

    return metrics
  }

  function analyzeDirectory(dir: string, metrics: BundleMetrics, subdir = '') {
    try {
      const files = readdirSync(dir)
      
      files.forEach(file => {
        const fullPath = join(dir, file)
        const stat = statSync(fullPath)
        
        if (stat.isDirectory()) {
          analyzeDirectory(fullPath, metrics, join(subdir, file))
        } else if (stat.isFile()) {
          const size = stat.size
          metrics.totalSize += size
          
          // Calculate gzipped size
          const content = readFileSync(fullPath)
          const gzipped = gzipSync(content)
          metrics.gzippedSize += gzipped.length
          
          // Categorize by file type
          if (file.endsWith('.js') || file.endsWith('.mjs')) {
            metrics.jsSize += size
            metrics.chunkCount++
            
            if (size > metrics.largestChunk.size) {
              metrics.largestChunk = {
                name: join(subdir, file),
                size
              }
            }
          } else if (file.endsWith('.css')) {
            metrics.cssSize += size
          }
        }
      })
    } catch (error) {
      // Directory doesn't exist
    }
  }

  describe('Bundle Size Constraints', () => {
    it('should not exceed total size budget', () => {
      expect(bundleMetrics.totalSize).toBeLessThan(budgets.totalSize)
      console.log(`Total bundle size: ${(bundleMetrics.totalSize / 1024).toFixed(2)}KB`)
    })

    it('should not exceed gzipped size budget', () => {
      expect(bundleMetrics.gzippedSize).toBeLessThan(budgets.gzippedSize)
      console.log(`Gzipped bundle size: ${(bundleMetrics.gzippedSize / 1024).toFixed(2)}KB`)
    })

    it('should not exceed JavaScript size budget', () => {
      expect(bundleMetrics.jsSize).toBeLessThan(budgets.jsSize)
      console.log(`JavaScript size: ${(bundleMetrics.jsSize / 1024).toFixed(2)}KB`)
    })

    it('should not exceed CSS size budget', () => {
      expect(bundleMetrics.cssSize).toBeLessThan(budgets.cssSize)
      console.log(`CSS size: ${(bundleMetrics.cssSize / 1024).toFixed(2)}KB`)
    })

    it('should not have chunks larger than budget', () => {
      expect(bundleMetrics.largestChunk.size).toBeLessThan(budgets.largestChunk)
      console.log(`Largest chunk: ${bundleMetrics.largestChunk.name} (${(bundleMetrics.largestChunk.size / 1024).toFixed(2)}KB)`)
    })
  })

  describe('Code Splitting Efficiency', () => {
    it('should have appropriate number of chunks', () => {
      // Should have at least separate chunks for routes
      expect(bundleMetrics.chunkCount).toBeGreaterThan(5)
      // But not too many (over-splitting)
      expect(bundleMetrics.chunkCount).toBeLessThan(50)
      console.log(`Total chunks: ${bundleMetrics.chunkCount}`)
    })

    it('should have route-based code splitting', () => {
      const routeChunks = [
        '_nuxt/index',
        '_nuxt/kanban',
        '_nuxt/matters',
        '_nuxt/login'
      ]
      
      const buildFiles = getAllFiles(buildDir)
      
      routeChunks.forEach(chunk => {
        const hasChunk = buildFiles.some(file => file.includes(chunk))
        expect(hasChunk).toBe(true)
      })
    })
  })

  describe('Dependency Analysis', () => {
    it('should tree-shake unused exports', () => {
      // Check that large libraries are properly tree-shaken
      const buildFiles = getAllFiles(buildDir)
      const content = buildFiles
        .filter(f => f.endsWith('.js'))
        .map(f => readFileSync(f, 'utf-8'))
        .join('\n')
      
      // These should not appear in production build
      const unusedPatterns = [
        'devtools',
        'console.log',
        'debugger',
        '__TEST__',
        'mock'
      ]
      
      unusedPatterns.forEach(pattern => {
        const occurrences = (content.match(new RegExp(pattern, 'gi')) || []).length
        expect(occurrences).toBe(0)
      })
    })

    it('should optimize icon imports', () => {
      // Lucide icons should be tree-shaken
      const iconBundleSize = measureLibrarySize('lucide')
      // Should only include used icons, not entire library
      expect(iconBundleSize).toBeLessThan(50 * 1024) // 50KB max for icons
    })

    it('should optimize UI component library', () => {
      // shadcn-vue components should be optimized
      const uiLibSize = measureLibrarySize('radix-vue')
      // Only used components should be included
      expect(uiLibSize).toBeLessThan(100 * 1024) // 100KB max for UI lib
    })
  })

  describe('Critical Path Optimization', () => {
    it('should have optimized initial load', () => {
      // Check entry point size
      const entryFile = findFile(buildDir, 'entry')
      if (entryFile) {
        const entrySize = statSync(entryFile).size
        expect(entrySize).toBeLessThan(budgets.criticalBundle)
        console.log(`Entry bundle size: ${(entrySize / 1024).toFixed(2)}KB`)
      }
    })

    it('should defer non-critical resources', () => {
      // Check for async/defer attributes in HTML
      const htmlFile = findFile(buildDir, 'index.html')
      if (htmlFile) {
        const html = readFileSync(htmlFile, 'utf-8')
        
        // Non-critical scripts should be deferred
        const deferredScripts = (html.match(/script[^>]+defer/g) || []).length
        expect(deferredScripts).toBeGreaterThan(0)
        
        // CSS should be optimized
        const cssLinks = (html.match(/<link[^>]+rel="stylesheet"/g) || []).length
        expect(cssLinks).toBeLessThan(5) // Minimal CSS files
      }
    })
  })

  describe('Asset Optimization', () => {
    it('should have compressed assets', () => {
      const assets = getAllFiles(join(buildDir, '_nuxt'))
        .filter(f => f.endsWith('.js') || f.endsWith('.css'))
      
      assets.forEach(asset => {
        const original = readFileSync(asset)
        const gzipped = gzipSync(original)
        const compressionRatio = gzipped.length / original.length
        
        // Good compression ratio indicates minified code
        expect(compressionRatio).toBeLessThan(0.4) // 60% compression
      })
    })

    it('should have optimized images', () => {
      const images = getAllFiles(buildDir)
        .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
      
      images.forEach(image => {
        const size = statSync(image).size
        // Images should be reasonably sized
        expect(size).toBeLessThan(200 * 1024) // 200KB max per image
      })
    })
  })

  // Helper functions
  function getAllFiles(dir: string): string[] {
    const files: string[] = []
    
    try {
      const items = readdirSync(dir)
      items.forEach(item => {
        const fullPath = join(dir, item)
        const stat = statSync(fullPath)
        
        if (stat.isDirectory()) {
          files.push(...getAllFiles(fullPath))
        } else {
          files.push(fullPath)
        }
      })
    } catch (error) {
      // Directory doesn't exist
    }
    
    return files
  }

  function findFile(dir: string, pattern: string): string | null {
    const files = getAllFiles(dir)
    return files.find(f => f.includes(pattern)) || null
  }

  function measureLibrarySize(libName: string): number {
    const files = getAllFiles(buildDir)
      .filter(f => f.endsWith('.js'))
    
    let totalSize = 0
    files.forEach(file => {
      const content = readFileSync(file, 'utf-8')
      if (content.includes(libName)) {
        // Rough estimate of library contribution
        const matches = content.match(new RegExp(libName, 'g')) || []
        const libContribution = matches.length * 100 // Rough estimate
        totalSize += libContribution
      }
    })
    
    return totalSize
  }
})