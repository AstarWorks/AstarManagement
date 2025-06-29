/**
 * Performance optimization utilities for E2E tests
 */

import { PlaywrightTestConfig, Page, Locator, BrowserContext, Response } from '@playwright/test';
import { TestDataManager } from './test-data';

/**
 * Optimized test configuration for faster execution
 */
export const performanceConfig: Partial<PlaywrightTestConfig> = {
  // Parallel execution settings
  workers: process.env.CI ? 2 : 4,
  fullyParallel: true,
  
  // Retry settings
  retries: process.env.CI ? 2 : 0,
  
  // Test timeout optimizations
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  
  // Global setup optimizations
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
};

/**
 * Wait strategies for better test stability
 */
export const waitStrategies = {
  // Wait for network idle (no requests for 500ms)
  networkIdle: async (page: Page) => {
    await page.waitForLoadState('networkidle');
  },
  
  // Wait for specific API responses
  apiResponse: async (page: Page, endpoint: string) => {
    await page.waitForResponse(
      (response: Response) => response.url().includes(endpoint) && response.status() === 200
    );
  },
  
  // Wait for animations to complete
  animationComplete: async (page: Page) => {
    await page.evaluate(() => {
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });
    });
  },
  
  // Smart wait for element stability
  elementStable: async (locator: Locator) => {
    // Wait for element to be visible
    await locator.waitFor({ state: 'visible' });
    
    // Wait for position to stabilize
    let previousBox = await locator.boundingBox();
    let stableCount = 0;
    
    while (stableCount < 3) {
      await locator.page().waitForTimeout(100);
      const currentBox = await locator.boundingBox();
      
      if (
        previousBox &&
        currentBox &&
        previousBox.x === currentBox.x &&
        previousBox.y === currentBox.y
      ) {
        stableCount++;
      } else {
        stableCount = 0;
      }
      
      previousBox = currentBox;
    }
  },
};

/**
 * Test data caching for faster execution
 */
export class TestDataCache {
  private static cache = new Map<string, any>();
  
  static set(key: string, value: any) {
    this.cache.set(key, value);
  }
  
  static get(key: string) {
    return this.cache.get(key);
  }
  
  static clear() {
    this.cache.clear();
  }
  
  static async getOrCreate<T>(
    key: string,
    factory: () => Promise<T>
  ): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const value = await factory();
    this.cache.set(key, value);
    return value;
  }
}

/**
 * Batch API operations for better performance
 */
export class BatchOperations {
  private operations: Array<() => Promise<any>> = [];
  
  add(operation: () => Promise<any>) {
    this.operations.push(operation);
  }
  
  async executeAll() {
    const results = await Promise.all(
      this.operations.map(op => op())
    );
    this.operations = [];
    return results;
  }
}

/**
 * Performance monitoring helpers
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>();
  
  mark(name: string) {
    this.marks.set(name, Date.now());
  }
  
  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark)! : Date.now();
    
    if (start) {
      const duration = end - start;
      console.log(`Performance [${name}]: ${duration}ms`);
      return duration;
    }
    
    return 0;
  }
  
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - start;
      console.log(`Performance [${name}]: ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`Performance [${name}]: ${duration}ms (failed)`);
      throw error;
    }
  }
}

/**
 * Optimized test patterns
 */
export const optimizedPatterns = {
  // Reuse authentication state across tests
  reuseAuth: async (context: BrowserContext) => {
    return context.storageState({ path: 'auth-state.json' });
  },
  
  // Batch create test data
  batchCreateTestData: async (testData: TestDataManager, count: number) => {
    const batch = new BatchOperations();
    
    for (let i = 0; i < count; i++) {
      batch.add(() => testData.createTestMatter({
        title: `Test Matter ${i}`,
        priority: ['LOW', 'MEDIUM', 'HIGH'][i % 3]
      }));
    }
    
    return batch.executeAll();
  },
  
  // Smart wait for drag and drop
  waitForDragAndDrop: async (page: Page) => {
    await waitStrategies.animationComplete(page);
    await page.waitForTimeout(300); // Allow for DOM updates
  },
  
  // Optimized search wait
  waitForSearchResults: async (page: Page) => {
    await Promise.race([
      waitStrategies.apiResponse(page, '/api/v1/matters/search'),
      page.waitForTimeout(2000)
    ]);
  }
};

/**
 * Test stability helpers
 */
export const stabilityHelpers = {
  // Retry flaky operations
  retryOperation: async <T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  },
  
  // Wait for element with retry
  waitForElementWithRetry: async (page: Page, selector: string, options = {}) => {
    return stabilityHelpers.retryOperation(
      () => page.waitForSelector(selector, { timeout: 5000, ...options })
    );
  },
  
  // Stable click with retry
  clickWithRetry: async (locator: Locator) => {
    return stabilityHelpers.retryOperation(async () => {
      await waitStrategies.elementStable(locator);
      await locator.click();
    });
  }
};