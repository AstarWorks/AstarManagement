/**
 * Global teardown for E2E tests
 * Runs once after all tests complete
 */

import { chromium, FullConfig } from '@playwright/test';
import { TestDataManager } from './test-data';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  // Create browser instance for cleanup
  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: 'playwright/.auth/lawyer.json' // Use lawyer auth for cleanup
  });
  const page = await context.newPage();
  
  try {
    // 1. Clean up global test data
    console.log('🗑️ Cleaning up test data...');
    const testData = new TestDataManager(page.request);
    
    // Get test data IDs from environment
    const testDataIds = process.env.GLOBAL_TEST_DATA 
      ? JSON.parse(process.env.GLOBAL_TEST_DATA) 
      : [];
    
    // Delete test matters
    for (const id of testDataIds) {
      try {
        await testData.deleteTestMatter(id);
      } catch (error) {
        console.warn(`Failed to delete matter ${id}:`, error);
      }
    }
    
    // 2. Clean up authentication states
    console.log('🔐 Cleaning up authentication states...');
    const fs = require('fs').promises;
    const path = require('path');
    
    const authFiles = [
      'playwright/.auth/lawyer.json',
      'playwright/.auth/clerk.json',
      'playwright/.auth/client.json'
    ];
    
    for (const file of authFiles) {
      try {
        await fs.unlink(path.resolve(file));
      } catch (error) {
        // File might not exist, ignore
      }
    }
    
    // 3. Generate test report summary
    console.log('📊 Generating test summary...');
    const endTime = new Date();
    const duration = process.env.TEST_START_TIME 
      ? endTime.getTime() - new Date(process.env.TEST_START_TIME).getTime()
      : 0;
    
    console.log(`
    ================================================
    Test Execution Summary
    ================================================
    End Time: ${endTime.toISOString()}
    Duration: ${Math.round(duration / 1000)}s
    ================================================
    `);
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw in teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
}

export default globalTeardown;