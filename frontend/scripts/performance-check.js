#!/usr/bin/env node

/**
 * Performance validation script for drag-drop functionality
 * Checks browser compatibility and performance metrics
 */

const { chromium, firefox, webkit } = require('playwright');
const os = require('os');
const fs = require('fs');

const browsers = ['chromium', 'firefox', 'webkit'];
const viewports = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 }
];

async function measurePerformance(browserType, viewport) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height }
  });
  const page = await context.newPage();

  // Enable performance monitoring
  await page.evaluateOnNewDocument(() => {
    window.performanceMetrics = {
      dragStart: [],
      dragMove: [],
      dragEnd: [],
      fps: []
    };

    // FPS monitoring
    let lastTime = performance.now();
    let frameCount = 0;
    
    function measureFPS() {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        window.performanceMetrics.fps.push({
          timestamp: currentTime,
          fps: Math.round((frameCount * 1000) / (currentTime - lastTime))
        });
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    }
    
    requestAnimationFrame(measureFPS);
  });

  try {
    // Navigate to kanban board
    await page.goto('http://localhost:3000/matters', { waitUntil: 'networkidle' });
    
    // Wait for kanban board to load
    await page.waitForSelector('.kanban-board', { timeout: 30000 });
    
    // Measure drag performance
    const metrics = await page.evaluate(async () => {
      const firstCard = document.querySelector('.matter-card');
      const targetColumn = document.querySelectorAll('.kanban-column')[1];
      
      if (!firstCard || !targetColumn) {
        throw new Error('Required elements not found');
      }

      // Simulate drag operation
      const startTime = performance.now();
      
      // Create drag events
      const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
      });
      
      const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
      });
      
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
      });
      
      // Measure drag start
      const dragStartTime = performance.now();
      firstCard.dispatchEvent(dragStartEvent);
      window.performanceMetrics.dragStart.push(performance.now() - dragStartTime);
      
      // Simulate drag movement (10 points)
      for (let i = 0; i < 10; i++) {
        const dragMoveTime = performance.now();
        targetColumn.dispatchEvent(dragOverEvent);
        window.performanceMetrics.dragMove.push(performance.now() - dragMoveTime);
        await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
      }
      
      // Measure drop
      const dropTime = performance.now();
      targetColumn.dispatchEvent(dropEvent);
      window.performanceMetrics.dragEnd.push(performance.now() - dropTime);
      
      const endTime = performance.now();
      
      return {
        totalTime: endTime - startTime,
        metrics: window.performanceMetrics
      };
    });

    // Calculate average FPS during drag
    const fpsValues = metrics.metrics.fps.map(f => f.fps);
    const avgFPS = fpsValues.length > 0 
      ? Math.round(fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length)
      : 0;

    return {
      browser: browserType.name(),
      viewport: viewport.name,
      totalTime: metrics.totalTime,
      avgFPS,
      dragStartAvg: average(metrics.metrics.dragStart),
      dragMoveAvg: average(metrics.metrics.dragMove),
      dragEndAvg: average(metrics.metrics.dragEnd)
    };
  } catch (error) {
    return {
      browser: browserType.name(),
      viewport: viewport.name,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

function average(arr) {
  return arr.length > 0 
    ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 100) / 100
    : 0;
}

async function runPerformanceTests() {
  console.log('🚀 Starting drag-drop performance validation...\n');
  console.log(`Platform: ${os.platform()} ${os.arch()}`);
  console.log(`Node: ${process.version}`);
  console.log(`Date: ${new Date().toISOString()}\n`);

  const results = [];

  for (const browserName of browsers) {
    const browserType = { chromium, firefox, webkit }[browserName];
    
    for (const viewport of viewports) {
      console.log(`Testing ${browserName} on ${viewport.name}...`);
      const result = await measurePerformance(browserType, viewport);
      results.push(result);
      
      if (result.error) {
        console.log(`  ❌ Error: ${result.error}`);
      } else {
        console.log(`  ✅ Avg FPS: ${result.avgFPS}`);
        console.log(`  ⏱️  Total time: ${result.totalTime}ms`);
        console.log(`  📊 Drag start: ${result.dragStartAvg}ms`);
        console.log(`  📊 Drag move: ${result.dragMoveAvg}ms`);
        console.log(`  📊 Drag end: ${result.dragEndAvg}ms`);
      }
      console.log('');
    }
  }

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    platform: {
      os: os.platform(),
      arch: os.arch(),
      node: process.version
    },
    results,
    summary: {
      totalTests: results.length,
      passed: results.filter(r => !r.error && r.avgFPS >= 60).length,
      failed: results.filter(r => r.error || r.avgFPS < 60).length,
      avgFPSAcrossAll: Math.round(
        results
          .filter(r => !r.error && r.avgFPS)
          .reduce((sum, r) => sum + r.avgFPS, 0) / results.filter(r => !r.error).length
      )
    }
  };

  // Save report
  const reportPath = 'performance-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to ${reportPath}`);

  // Summary
  console.log('\n📊 Performance Summary:');
  console.log(`Total tests: ${report.summary.totalTests}`);
  console.log(`Passed (60+ FPS): ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Average FPS: ${report.summary.avgFPSAcrossAll}`);

  // Exit with appropriate code
  process.exit(report.summary.failed > 0 ? 1 : 0);
}

// Check if development server is running
const http = require('http');
http.get('http://localhost:3000', (res) => {
  if (res.statusCode === 200 || res.statusCode === 304) {
    runPerformanceTests().catch(console.error);
  } else {
    console.error('❌ Development server is not running on http://localhost:3000');
    console.error('Please run "bun dev" first');
    process.exit(1);
  }
}).on('error', () => {
  console.error('❌ Development server is not running on http://localhost:3000');
  console.error('Please run "bun dev" first');
  process.exit(1);
});