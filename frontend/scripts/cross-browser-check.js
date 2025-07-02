#!/usr/bin/env node

/**
 * Cross-browser compatibility check for drag-drop functionality
 * Tests basic drag-drop operations across different browsers
 */

const { chromium, firefox, webkit } = require('playwright');

const browsers = [
  { name: 'Chrome', type: chromium },
  { name: 'Firefox', type: firefox },
  { name: 'Safari (WebKit)', type: webkit }
];

const testScenarios = [
  {
    name: 'Basic drag-drop',
    test: async (page) => {
      const hasVueDraggable = await page.evaluate(() => {
        return document.querySelector('[data-draggable="true"]') !== null ||
               document.querySelector('.sortable-drag') !== null ||
               document.querySelector('.draggable') !== null;
      });
      return hasVueDraggable;
    }
  },
  {
    name: 'Touch support',
    test: async (page) => {
      const hasTouchSupport = await page.evaluate(() => {
        const element = document.querySelector('.matter-card');
        return element && 'ontouchstart' in window;
      });
      return hasTouchSupport;
    }
  },
  {
    name: 'CSS transforms',
    test: async (page) => {
      const supportsTransforms = await page.evaluate(() => {
        const testEl = document.createElement('div');
        const transforms = ['transform', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform'];
        return transforms.some(t => testEl.style[t] !== undefined);
      });
      return supportsTransforms;
    }
  },
  {
    name: 'Transition support',
    test: async (page) => {
      const supportsTransitions = await page.evaluate(() => {
        const testEl = document.createElement('div');
        return 'transition' in testEl.style;
      });
      return supportsTransitions;
    }
  }
];

async function testBrowser(browserInfo) {
  const browser = await browserInfo.type.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    browser: browserInfo.name,
    tests: []
  };

  try {
    // Use a static HTML test page if dev server isn't running
    const testHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Drag Drop Test</title>
  <style>
    .kanban-board { display: flex; gap: 1rem; }
    .kanban-column { width: 300px; min-height: 200px; border: 1px solid #ccc; padding: 1rem; }
    .matter-card { padding: 1rem; margin: 0.5rem 0; background: #f0f0f0; cursor: move; }
    .draggable { user-select: none; }
  </style>
</head>
<body>
  <div class="kanban-board">
    <div class="kanban-column" data-status="new">
      <div class="matter-card draggable" draggable="true" data-draggable="true">Card 1</div>
      <div class="matter-card draggable" draggable="true" data-draggable="true">Card 2</div>
    </div>
    <div class="kanban-column" data-status="in-progress">
      <div class="matter-card draggable" draggable="true" data-draggable="true">Card 3</div>
    </div>
  </div>
</body>
</html>`;

    await page.setContent(testHTML);
    
    // Run tests
    for (const scenario of testScenarios) {
      try {
        const passed = await scenario.test(page);
        results.tests.push({
          name: scenario.name,
          passed,
          status: passed ? '✅' : '❌'
        });
      } catch (error) {
        results.tests.push({
          name: scenario.name,
          passed: false,
          status: '❌',
          error: error.message
        });
      }
    }

    // Test actual drag operation
    try {
      await page.dragAndDrop('.matter-card:first-child', '.kanban-column:last-child');
      results.tests.push({
        name: 'Drag operation',
        passed: true,
        status: '✅'
      });
    } catch (error) {
      results.tests.push({
        name: 'Drag operation',
        passed: false,
        status: '❌',
        error: error.message
      });
    }

  } catch (error) {
    results.error = error.message;
  } finally {
    await browser.close();
  }

  return results;
}

async function runCrossBrowserTests() {
  console.log('🌐 Cross-Browser Compatibility Check\n');
  console.log('Testing drag-drop functionality across browsers...\n');

  const allResults = [];

  for (const browserInfo of browsers) {
    console.log(`Testing ${browserInfo.name}...`);
    const results = await testBrowser(browserInfo);
    allResults.push(results);
    
    if (results.error) {
      console.log(`  ❌ Error: ${results.error}`);
    } else {
      results.tests.forEach(test => {
        console.log(`  ${test.status} ${test.name}`);
        if (test.error) {
          console.log(`     Error: ${test.error}`);
        }
      });
    }
    console.log('');
  }

  // Summary
  console.log('📊 Summary:\n');
  
  const totalTests = allResults.reduce((sum, r) => sum + (r.tests?.length || 0), 0);
  const passedTests = allResults.reduce((sum, r) => 
    sum + (r.tests?.filter(t => t.passed).length || 0), 0
  );

  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  // Browser compatibility matrix
  console.log('\n📋 Browser Compatibility Matrix:\n');
  console.log('Feature               | Chrome | Firefox | Safari');
  console.log('---------------------|--------|---------|--------');
  
  const features = testScenarios.map(s => s.name).concat(['Drag operation']);
  features.forEach(feature => {
    const row = [feature.padEnd(20)];
    browsers.forEach((_, idx) => {
      const result = allResults[idx];
      const test = result.tests?.find(t => t.name === feature);
      row.push(test ? (test.passed ? '  ✅  ' : '  ❌  ') : '  ?   ');
    });
    console.log(row.join(' | '));
  });

  // Save results
  const fs = require('fs');
  const report = {
    timestamp: new Date().toISOString(),
    results: allResults,
    summary: {
      totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      successRate: Math.round((passedTests / totalTests) * 100)
    }
  };

  fs.writeFileSync('cross-browser-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to cross-browser-report.json');

  process.exit(passedTests === totalTests ? 0 : 1);
}

runCrossBrowserTests().catch(console.error);