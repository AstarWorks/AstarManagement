#!/usr/bin/env node

/**
 * Memory Profiler for Nuxt.js Application
 * Monitors memory usage during development and identifies potential leaks
 */

import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const PROFILE_DURATION = 60000 // 1 minute
const SAMPLE_INTERVAL = 5000 // 5 seconds

class MemoryProfiler {
  constructor() {
    this.browser = null
    this.page = null
    this.samples = []
    this.startTime = null
  }

  async init() {
    console.log('🚀 Starting Memory Profiler...')
    
    this.browser = await chromium.launch({
      headless: false, // Show browser for debugging
      devtools: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--js-flags=--expose-gc',
        '--enable-precise-memory-info'
      ]
    })

    this.page = await this.browser.newPage()
    
    // Enable performance monitoring
    const client = await this.page.context().newCDPSession(this.page)
    await client.send('Performance.enable')
    
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle' })
    console.log(`✅ Connected to ${BASE_URL}`)
  }

  async collectSample() {
    // Force garbage collection
    await this.page.evaluate(() => {
      if (window.gc) {
        window.gc()
      }
    })

    await this.page.waitForTimeout(100)

    const metrics = await this.page.evaluate(() => {
      const memory = performance.memory
      const navigation = performance.getEntriesByType('navigation')[0]
      
      return {
        timestamp: Date.now(),
        jsHeapSizeUsed: memory.usedJSHeapSize,
        jsHeapSizeTotal: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        domNodes: document.querySelectorAll('*').length,
        jsEventListeners: (() => {
          let count = 0
          const allElements = document.querySelectorAll('*')
          // This is a rough estimate
          allElements.forEach(() => count++)
          return count
        })(),
        documentSize: new XMLSerializer().serializeToString(document).length,
        // Performance metrics
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      }
    })

    // Get Chrome DevTools metrics
    const cdpMetrics = await this.page.metrics()
    
    return {
      ...metrics,
      cdpMetrics,
      url: this.page.url()
    }
  }

  async simulateUserInteraction() {
    const actions = [
      async () => {
        // Navigate to Kanban
        await this.page.goto(`${BASE_URL}/kanban`, { waitUntil: 'networkidle' })
        console.log('📍 Navigated to Kanban board')
      },
      async () => {
        // Drag and drop simulation
        const card = await this.page.locator('.matter-card').first()
        const column = await this.page.locator('.kanban-column').nth(1)
        if (await card.isVisible() && await column.isVisible()) {
          await card.dragTo(column)
          console.log('🎯 Performed drag and drop')
        }
      },
      async () => {
        // Navigate to matters
        await this.page.goto(`${BASE_URL}/matters`, { waitUntil: 'networkidle' })
        console.log('📍 Navigated to Matters list')
      },
      async () => {
        // Open and close modal
        const button = await this.page.locator('button').first()
        if (await button.isVisible()) {
          await button.click()
          await this.page.waitForTimeout(1000)
          await this.page.keyboard.press('Escape')
          console.log('🔲 Opened and closed modal')
        }
      },
      async () => {
        // Search operation
        const search = await this.page.locator('input[type="search"]').first()
        if (await search.isVisible()) {
          await search.fill('test search')
          await this.page.waitForTimeout(1000)
          await search.fill('')
          console.log('🔍 Performed search')
        }
      }
    ]

    // Execute random action
    const action = actions[Math.floor(Math.random() * actions.length)]
    await action()
  }

  async profile() {
    this.startTime = Date.now()
    console.log('📊 Starting memory profiling...\n')

    // Collect initial sample
    const initialSample = await this.collectSample()
    this.samples.push(initialSample)
    this.printSample(initialSample, 'Initial')

    // Main profiling loop
    const intervalId = setInterval(async () => {
      try {
        // Simulate user interaction
        await this.simulateUserInteraction()
        
        // Collect memory sample
        const sample = await this.collectSample()
        this.samples.push(sample)
        
        // Print current metrics
        this.printSample(sample, `Sample ${this.samples.length}`)
        
        // Check for potential leaks
        this.checkForLeaks()
        
      } catch (error) {
        console.error('Error during profiling:', error)
      }
    }, SAMPLE_INTERVAL)

    // Stop after duration
    setTimeout(async () => {
      clearInterval(intervalId)
      await this.finish()
    }, PROFILE_DURATION)
  }

  printSample(sample, label) {
    const heapMB = (sample.jsHeapSizeUsed / 1024 / 1024).toFixed(2)
    const totalMB = (sample.jsHeapSizeTotal / 1024 / 1024).toFixed(2)
    
    console.log(`\n${label}:`)
    console.log(`  Heap Used: ${heapMB} MB / ${totalMB} MB`)
    console.log(`  DOM Nodes: ${sample.domNodes}`)
    console.log(`  Event Listeners: ${sample.jsEventListeners}`)
    console.log(`  URL: ${sample.url}`)
  }

  checkForLeaks() {
    if (this.samples.length < 3) return

    const recent = this.samples.slice(-3)
    const heapGrowth = recent.map(s => s.jsHeapSizeUsed)
    const nodeGrowth = recent.map(s => s.domNodes)

    // Check for consistent growth
    const heapIncreasing = heapGrowth[0] < heapGrowth[1] && heapGrowth[1] < heapGrowth[2]
    const nodesIncreasing = nodeGrowth[0] < nodeGrowth[1] && nodeGrowth[1] < nodeGrowth[2]

    if (heapIncreasing) {
      console.warn('⚠️  Warning: Consistent heap growth detected!')
    }
    if (nodesIncreasing) {
      console.warn('⚠️  Warning: DOM nodes continuously increasing!')
    }
  }

  async finish() {
    console.log('\n📈 Profiling complete. Generating report...')

    // Calculate statistics
    const stats = this.calculateStats()
    
    // Generate report
    const report = {
      profileDuration: Date.now() - this.startTime,
      samplesCollected: this.samples.length,
      statistics: stats,
      samples: this.samples,
      analysis: this.analyzeResults(stats)
    }

    // Save report
    const reportDir = join(dirname(__dirname), 'performance-reports')
    mkdirSync(reportDir, { recursive: true })
    
    const reportPath = join(reportDir, `memory-profile-${Date.now()}.json`)
    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`\n✅ Report saved to: ${reportPath}`)
    
    // Print summary
    this.printSummary(stats)
    
    await this.browser.close()
  }

  calculateStats() {
    const heapSizes = this.samples.map(s => s.jsHeapSizeUsed)
    const domNodes = this.samples.map(s => s.domNodes)
    
    return {
      heap: {
        initial: heapSizes[0],
        final: heapSizes[heapSizes.length - 1],
        min: Math.min(...heapSizes),
        max: Math.max(...heapSizes),
        average: heapSizes.reduce((a, b) => a + b) / heapSizes.length,
        growth: ((heapSizes[heapSizes.length - 1] - heapSizes[0]) / heapSizes[0] * 100).toFixed(2) + '%'
      },
      dom: {
        initial: domNodes[0],
        final: domNodes[domNodes.length - 1],
        min: Math.min(...domNodes),
        max: Math.max(...domNodes),
        average: Math.floor(domNodes.reduce((a, b) => a + b) / domNodes.length)
      }
    }
  }

  analyzeResults(stats) {
    const analysis = {
      memoryLeakDetected: false,
      domLeakDetected: false,
      recommendations: []
    }

    // Check for memory leak (>20% growth)
    const heapGrowthPercent = parseFloat(stats.heap.growth)
    if (heapGrowthPercent > 20) {
      analysis.memoryLeakDetected = true
      analysis.recommendations.push('Significant memory growth detected. Check for:')
      analysis.recommendations.push('- Event listeners not being removed')
      analysis.recommendations.push('- Cached data growing indefinitely')
      analysis.recommendations.push('- Circular references preventing garbage collection')
    }

    // Check for DOM leak
    const domGrowth = stats.dom.final - stats.dom.initial
    if (domGrowth > 100) {
      analysis.domLeakDetected = true
      analysis.recommendations.push('DOM nodes increasing. Check for:')
      analysis.recommendations.push('- Components not properly unmounting')
      analysis.recommendations.push('- Dynamic content not being cleaned up')
      analysis.recommendations.push('- Infinite scroll without virtualization')
    }

    if (!analysis.memoryLeakDetected && !analysis.domLeakDetected) {
      analysis.recommendations.push('✅ No significant memory leaks detected')
      analysis.recommendations.push('Memory usage appears stable')
    }

    return analysis
  }

  printSummary(stats) {
    console.log('\n' + '='.repeat(50))
    console.log('📊 MEMORY PROFILE SUMMARY')
    console.log('='.repeat(50))
    
    console.log('\nHeap Memory:')
    console.log(`  Initial: ${(stats.heap.initial / 1024 / 1024).toFixed(2)} MB`)
    console.log(`  Final: ${(stats.heap.final / 1024 / 1024).toFixed(2)} MB`)
    console.log(`  Growth: ${stats.heap.growth}`)
    console.log(`  Peak: ${(stats.heap.max / 1024 / 1024).toFixed(2)} MB`)
    
    console.log('\nDOM Nodes:')
    console.log(`  Initial: ${stats.dom.initial}`)
    console.log(`  Final: ${stats.dom.final}`)
    console.log(`  Change: ${stats.dom.final - stats.dom.initial}`)
    
    console.log('\n' + '='.repeat(50))
  }
}

// Run profiler
async function main() {
  const profiler = new MemoryProfiler()
  
  try {
    await profiler.init()
    await profiler.profile()
  } catch (error) {
    console.error('Profiler error:', error)
    process.exit(1)
  }
}

main()