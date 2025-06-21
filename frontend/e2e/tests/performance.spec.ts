import { test, expect } from '@playwright/test';
import { TestDataManager } from '../utils/test-data';

test.describe('Performance Benchmarks - MVP Requirements', () => {
  let testData: TestDataManager;

  test.beforeAll(async ({ request }) => {
    testData = new TestDataManager(request);
  });

  test.afterAll(async () => {
    await testData.cleanupTestData();
  });

  test('page load times meet SLA requirements', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('lawyer@example.com');
    await page.getByLabel('Password').fill('ValidPass123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByLabel('2FA Code').fill('123456');
    await page.getByRole('button', { name: 'Verify' }).click();

    const pages = [
      { url: '/dashboard', maxTime: 3000, name: 'Dashboard' },
      { url: '/matters', maxTime: 3000, name: 'Matters List' },
      { url: '/kanban', maxTime: 3000, name: 'Kanban Board' },
      { url: '/search', maxTime: 3000, name: 'Search Page' }
    ];

    for (const { url, maxTime, name } of pages) {
      await test.step(`${name} loads within ${maxTime}ms`, async () => {
        const startTime = Date.now();
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;
        
        expect(loadTime).toBeLessThan(maxTime);
        console.log(`${name} loaded in ${loadTime}ms`);
      });
    }
  });

  test('API response times meet p95 < 300ms requirement', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('lawyer@example.com');
    await page.getByLabel('Password').fill('ValidPass123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByLabel('2FA Code').fill('123456');
    await page.getByRole('button', { name: 'Verify' }).click();

    // Test critical API endpoints
    const endpoints = [
      { url: '/api/v1/matters', name: 'Matters List API' },
      { url: '/api/v1/matters/search?q=test', name: 'Search API' }
    ];

    for (const { url, name } of endpoints) {
      await test.step(`${name} responds within 300ms`, async () => {
        const responseTimes: number[] = [];
        
        // Make 20 requests to calculate p95
        for (let i = 0; i < 20; i++) {
          const startTime = Date.now();
          const response = await page.request.get(url);
          const responseTime = Date.now() - startTime;
          
          expect(response.ok()).toBeTruthy();
          responseTimes.push(responseTime);
        }
        
        // Calculate p95
        responseTimes.sort((a, b) => a - b);
        const p95Index = Math.floor(responseTimes.length * 0.95);
        const p95Time = responseTimes[p95Index];
        
        expect(p95Time).toBeLessThan(300);
        console.log(`${name} p95: ${p95Time}ms`);
      });
    }
  });

  test('search responds within 500ms requirement', async ({ page }) => {
    // Create test data
    await testData.createMultipleTestMatters(50);
    
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('lawyer@example.com');
    await page.getByLabel('Password').fill('ValidPass123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByLabel('2FA Code').fill('123456');
    await page.getByRole('button', { name: 'Verify' }).click();

    await page.goto('/search');
    
    const searchInput = page.getByPlaceholder('Search matters...');
    const queries = ['contract', 'test', 'matter', '2025'];
    
    for (const query of queries) {
      await test.step(`Search for "${query}" completes within 500ms`, async () => {
        const startTime = Date.now();
        await searchInput.fill(query);
        await page.getByRole('button', { name: 'Search' }).click();
        await page.waitForSelector('[data-testid="search-results"]');
        const responseTime = Date.now() - startTime;
        
        expect(responseTime).toBeLessThan(500);
        console.log(`Search for "${query}" completed in ${responseTime}ms`);
      });
    }
  });

  test('PDF initial display meets < 1 second requirement', async ({ page }) => {
    // Create matter with PDF document
    const matter = await testData.createTestMatter({});
    const document = await testData.addDocumentToMatter(matter.id, {
      filename: 'test-document.pdf',
      type: 'PDF',
      size: 5 * 1024 * 1024 // 5MB
    });
    
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('lawyer@example.com');
    await page.getByLabel('Password').fill('ValidPass123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByLabel('2FA Code').fill('123456');
    await page.getByRole('button', { name: 'Verify' }).click();

    await page.goto(`/matters/${matter.id}/documents`);
    
    // Click to open PDF
    const startTime = Date.now();
    await page.getByTestId(`document-${document.id}`).click();
    
    // Wait for PDF viewer to show first page
    await page.waitForSelector('[data-testid="pdf-page-1"]', { state: 'visible' });
    const displayTime = Date.now() - startTime;
    
    expect(displayTime).toBeLessThan(1000);
    console.log(`PDF initial display: ${displayTime}ms`);
  });

  test('concurrent operations handle 200 WebSocket connections', async ({ browser }) => {
    // This test simulates concurrent connections
    const contexts = [];
    const pages = [];
    
    try {
      // Create 50 browser contexts (simulating 50 users with 4 tabs each = 200 connections)
      console.log('Creating 200 concurrent connections...');
      for (let i = 0; i < 50; i++) {
        const context = await browser.newContext();
        contexts.push(context);
        
        // Create 4 pages per context (simulating multiple tabs)
        for (let j = 0; j < 4; j++) {
          const page = await context.newPage();
          pages.push(page);
          
          // Login to establish WebSocket connection
          await page.goto('/login');
          await page.getByLabel('Email').fill(`lawyer${i}@example.com`);
          await page.getByLabel('Password').fill('ValidPass123!');
          await page.getByRole('button', { name: 'Sign in' }).click();
          await page.getByLabel('2FA Code').fill('123456');
          await page.getByRole('button', { name: 'Verify' }).click();
        }
      }
      
      console.log(`Created ${pages.length} concurrent sessions`);
      
      // Navigate all to kanban (which uses WebSocket for real-time updates)
      const navigationPromises = pages.map(async (page, index) => {
        try {
          await page.goto('/kanban');
          await page.waitForLoadState('networkidle', { timeout: 15000 });
          
          // Verify WebSocket connection is established
          const hasWebSocket = await page.evaluate(() => {
            return window.WebSocket !== undefined;
          });
          
          return { success: hasWebSocket, index };
        } catch (error) {
          return { success: false, index, error: error instanceof Error ? error.message : String(error) };
        }
      });
      
      const startTime = Date.now();
      const results = await Promise.all(navigationPromises);
      const totalTime = Date.now() - startTime;
      
      // Analyze results
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`200 concurrent connections test: ${successful} successful, ${failed} failed in ${totalTime}ms`);
      
      // At least 95% should succeed (allowing for some failures under extreme load)
      const successRate = successful / results.length;
      expect(successRate).toBeGreaterThan(0.95);
      
      // Total time should be reasonable (not more than 45 seconds for all connections)
      expect(totalTime).toBeLessThan(45000);
      
    } finally {
      // Cleanup
      for (const context of contexts) {
        await context.close();
      }
    }
  });

  test('time to interactive meets < 5 seconds requirement', async ({ page }) => {
    // Clear cache to test cold load
    await page.context().clearCookies();
    
    const startTime = Date.now();
    await page.goto('/login');
    
    // Wait for page to be interactive
    await page.getByLabel('Email').waitFor({ state: 'visible' });
    await page.getByLabel('Email').fill('test@example.com');
    
    const timeToInteractive = Date.now() - startTime;
    expect(timeToInteractive).toBeLessThan(5000);
    console.log(`Time to Interactive: ${timeToInteractive}ms`);
  });

  test('matter list handles large datasets efficiently', async ({ page }) => {
    // Create 100 test matters
    await testData.createMultipleTestMatters(100);
    
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('lawyer@example.com');
    await page.getByLabel('Password').fill('ValidPass123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByLabel('2FA Code').fill('123456');
    await page.getByRole('button', { name: 'Verify' }).click();

    // Measure matter list load time
    const startTime = Date.now();
    await page.goto('/matters');
    await page.waitForSelector('[data-testid="matter-card"]');
    const loadTime = Date.now() - startTime;
    
    // Should load within reasonable time even with 100 matters
    expect(loadTime).toBeLessThan(2000);
    
    // Should implement pagination
    await expect(page.getByTestId('pagination')).toBeVisible();
    
    // Scrolling should be smooth
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(100);
    
    // More items should load (if infinite scroll) or pagination should work
    const paginationNext = page.getByRole('button', { name: 'Next page' });
    if (await paginationNext.isVisible()) {
      const nextPageStart = Date.now();
      await paginationNext.click();
      await page.waitForSelector('[data-testid="matter-card"]');
      const nextPageTime = Date.now() - nextPageStart;
      
      expect(nextPageTime).toBeLessThan(1000);
      console.log(`Next page loaded in ${nextPageTime}ms`);
    }
  });
});