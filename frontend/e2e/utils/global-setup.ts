/**
 * Global setup for E2E tests
 * Runs once before all tests
 */

import { chromium, FullConfig } from '@playwright/test';
import { TestDataManager } from './test-data';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  // Create browser instance for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Wait for application to be ready
    console.log('⏳ Waiting for application...');
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 2. Create authenticated states for different roles
    console.log('🔐 Creating authentication states...');
    
    // Lawyer authentication
    await page.goto('/login');
    await page.getByLabel('Email').fill('lawyer@example.com');
    await page.getByLabel('Password').fill('ValidPass123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/login/2fa');
    await page.getByLabel('2FA Code').fill('123456');
    await page.getByRole('button', { name: 'Verify' }).click();
    await page.waitForURL('/dashboard');
    await context.storageState({ path: 'playwright/.auth/lawyer.json' });
    
    // Clerk authentication
    await page.goto('/login');
    await page.getByLabel('Email').fill('clerk@example.com');
    await page.getByLabel('Password').fill('ValidPass123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/login/2fa');
    await page.getByLabel('2FA Code').fill('123456');
    await page.getByRole('button', { name: 'Verify' }).click();
    await page.waitForURL('/dashboard');
    await context.storageState({ path: 'playwright/.auth/clerk.json' });
    
    // Client authentication
    await page.goto('/login');
    await page.getByLabel('Email').fill('client@example.com');
    await page.getByLabel('Password').fill('ValidPass123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/login/2fa');
    await page.getByLabel('2FA Code').fill('123456');
    await page.getByRole('button', { name: 'Verify' }).click();
    await page.waitForURL('/dashboard');
    await context.storageState({ path: 'playwright/.auth/client.json' });
    
    // 3. Create base test data
    console.log('📊 Creating base test data...');
    const testData = new TestDataManager(page.request);
    
    // Create sample matters for testing
    const baseMatters = await Promise.all([
      testData.createTestMatter({
        title: 'Global Test Matter 1',
        status: 'INTAKE',
        priority: 'HIGH'
      }),
      testData.createTestMatter({
        title: 'Global Test Matter 2',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM'
      })
    ]);
    
    // Store test data IDs for cleanup
    process.env.GLOBAL_TEST_DATA = JSON.stringify(baseMatters.map(m => m.id));
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;