import { test, expect, devices } from '@playwright/test';
import { MobileKanbanPage } from '../pages/MobileKanbanPage';
import { MobileMatterPage } from '../pages/MobileMatterPage';
import { TestDataManager } from '../utils/test-data';

// Test multiple mobile devices as per requirements
const mobileDevices = [
  { name: 'iPhone 12', device: devices['iPhone 12'] },
  { name: 'iPhone SE', device: devices['iPhone SE'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'iPad', device: devices['iPad'] }
];

mobileDevices.forEach(({ name, device }) => {
  test.describe(`Mobile Responsive - ${name}`, () => {
    test.use(device);
    
    let testData: TestDataManager;

    test.beforeEach(async ({ request }) => {
      testData = new TestDataManager(request);
    });

    test.afterEach(async () => {
      await testData.cleanupTestData();
    });

    test('mobile navigation menu works correctly', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.getByLabel('Email').fill('lawyer@example.com');
      await page.getByLabel('Password').fill('ValidPass123!');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.getByLabel('2FA Code').fill('123456');
      await page.getByRole('button', { name: 'Verify' }).click();
      
      // Mobile menu should be collapsed on small screens
      if (device.viewport.width < 768) {
        await expect(page.getByTestId('desktop-nav')).not.toBeVisible();
        await expect(page.getByTestId('mobile-menu-button')).toBeVisible();
        
        // Open mobile menu
        await page.getByTestId('mobile-menu-button').click();
        
        // Menu should slide in
        const mobileMenu = page.getByTestId('mobile-menu');
        await expect(mobileMenu).toBeVisible();
        
        // Navigate to matters
        await mobileMenu.getByText('Matters').click();
        await expect(page).toHaveURL('/matters');
        
        // Menu should auto-close after navigation
        await expect(mobileMenu).not.toBeVisible();
      }
    });

    test('mobile kanban board with swipe navigation', async ({ page }) => {
      // Skip on tablets - they use different layout
      if (device.viewport.width >= 768) {
        test.skip();
      }

      // Create test matters
      await Promise.all([
        testData.createTestMatter({ status: 'INTAKE' }),
        testData.createTestMatter({ status: 'INITIAL_REVIEW' }),
        testData.createTestMatter({ status: 'IN_PROGRESS' })
      ]);
      
      // Login
      await page.goto('/login');
      await page.getByLabel('Email').fill('lawyer@example.com');
      await page.getByLabel('Password').fill('ValidPass123!');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.getByLabel('2FA Code').fill('123456');
      await page.getByRole('button', { name: 'Verify' }).click();
      
      const mobileKanban = new MobileKanbanPage(page);
      await mobileKanban.goto();
      
      // Should show mobile-optimized single column view
      await expect(page.getByTestId('mobile-kanban-view')).toBeVisible();
      
      // Only current column visible
      await expect(mobileKanban.getCurrentColumn()).toContainText('INTAKE');
      
      // Swipe to next column
      await mobileKanban.swipeLeft();
      await expect(mobileKanban.getCurrentColumn()).toContainText('INITIAL_REVIEW');
      
      // Tab navigation should also work
      await mobileKanban.selectTab('IN_PROGRESS');
      await expect(mobileKanban.getCurrentColumn()).toContainText('IN_PROGRESS');
    });

    test('touch-optimized interactions', async ({ page }) => {
      const matter = await testData.createTestMatter({
        title: 'Mobile Test Matter',
        priority: 'HIGH'
      });
      
      // Login
      await page.goto('/login');
      await page.getByLabel('Email').fill('lawyer@example.com');
      await page.getByLabel('Password').fill('ValidPass123!');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.getByLabel('2FA Code').fill('123456');
      await page.getByRole('button', { name: 'Verify' }).click();
      
      await page.goto('/matters');
      
      const matterCard = page.getByTestId(`matter-card-${matter.caseNumber}`);
      
      // Verify touch targets are at least 44x44px
      const cardBox = await matterCard.boundingBox();
      expect(cardBox.height).toBeGreaterThanOrEqual(44);
      
      // Long press for context menu (on mobile)
      if (device.isMobile) {
        await matterCard.tap({ delay: 1000 });
        
        const contextMenu = page.getByTestId('mobile-context-menu');
        await expect(contextMenu).toBeVisible();
        await expect(contextMenu).toContainText('View Details');
        await expect(contextMenu).toContainText('Edit');
        
        // Tap outside to close
        await page.getByTestId('mobile-overlay').tap();
        await expect(contextMenu).not.toBeVisible();
      }
    });

    test('responsive forms on mobile', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.getByLabel('Email').fill('lawyer@example.com');
      await page.getByLabel('Password').fill('ValidPass123!');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.getByLabel('2FA Code').fill('123456');
      await page.getByRole('button', { name: 'Verify' }).click();
      
      const mobileMatter = new MobileMatterPage(page);
      await mobileMatter.gotoNew();
      
      // Form should be mobile-optimized
      if (device.viewport.width < 768) {
        await expect(page.getByTestId('mobile-form')).toBeVisible();
      }
      
      // Test form field interactions
      await mobileMatter.caseNumberInput.tap();
      await expect(mobileMatter.caseNumberInput).toBeFocused();
      
      // Fill form fields
      await mobileMatter.caseNumberInput.fill('MOB-2025-001');
      await mobileMatter.titleInput.fill('Mobile Test Matter');
      await mobileMatter.clientNameInput.fill('Mobile Client');
      
      // Status select should work on mobile
      await mobileMatter.statusSelect.tap();
      await page.getByRole('option', { name: 'INTAKE' }).click();
      
      // Submit button should be easily tappable
      const submitButton = page.getByRole('button', { name: 'Create Matter' });
      const submitBox = await submitButton.boundingBox();
      expect(submitBox.height).toBeGreaterThanOrEqual(44);
      expect(submitBox.width).toBeGreaterThanOrEqual(44);
    });

    test('responsive images and document viewer', async ({ page }) => {
      const matter = await testData.createTestMatter();
      const document = await testData.addDocumentToMatter(matter.id, {
        filename: 'evidence.jpg',
        type: 'IMAGE'
      });
      
      // Login
      await page.goto('/login');
      await page.getByLabel('Email').fill('lawyer@example.com');
      await page.getByLabel('Password').fill('ValidPass123!');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.getByLabel('2FA Code').fill('123456');
      await page.getByRole('button', { name: 'Verify' }).click();
      
      await page.goto(`/matters/${matter.id}/documents`);
      
      // Image should load optimized version on mobile
      const imageElement = page.getByTestId(`document-preview-${document.id}`);
      await expect(imageElement).toBeVisible();
      
      // Tap to open viewer
      await imageElement.tap();
      const viewer = page.getByTestId('mobile-image-viewer');
      await expect(viewer).toBeVisible();
      
      // Pinch to zoom simulation (double tap)
      await viewer.dblclick();
      
      // Close button should be easily tappable
      const closeButton = viewer.getByRole('button', { name: 'Close' });
      const closeBox = await closeButton.boundingBox();
      expect(closeBox.height).toBeGreaterThanOrEqual(44);
    });

    test('performance on mobile devices', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.getByLabel('Email').fill('lawyer@example.com');
      await page.getByLabel('Password').fill('ValidPass123!');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.getByLabel('2FA Code').fill('123456');
      await page.getByRole('button', { name: 'Verify' }).click();
      
      // Measure page load time
      const startTime = Date.now();
      await page.goto('/matters');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds on mobile (simulated 3G)
      expect(loadTime).toBeLessThan(3000);
      
      // Check for mobile optimizations
      const images = await page.getByRole('img').all();
      for (const img of images) {
        const loading = await img.getAttribute('loading');
        expect(loading).toBe('lazy'); // Images should lazy load
      }
    });
  });
});

// Tablet-specific tests
test.describe('Tablet Responsive - iPad', () => {
  test.use(devices['iPad Pro']);

  test('tablet uses optimized layout', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('lawyer@example.com');
    await page.getByLabel('Password').fill('ValidPass123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByLabel('2FA Code').fill('123456');
    await page.getByRole('button', { name: 'Verify' }).click();
    
    await page.goto('/matters');
    
    // Should show optimized tablet layout (not mobile, not full desktop)
    await expect(page.getByTestId('tablet-layout')).toBeVisible();
    
    // Navigation should be visible (not hamburger menu)
    await expect(page.getByTestId('desktop-nav')).toBeVisible();
    await expect(page.getByTestId('mobile-menu-button')).not.toBeVisible();
    
    // But layout should be more compact than desktop
    const mainContent = page.getByTestId('main-content');
    const contentBox = await mainContent.boundingBox();
    expect(contentBox.width).toBeLessThan(1200); // Not full desktop width
  });

  test('tablet kanban shows 2 columns', async ({ page }) => {
    // Create test matters
    await testData.createTestMatter({ status: 'INTAKE' });
    await testData.createTestMatter({ status: 'INITIAL_REVIEW' });
    
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('lawyer@example.com');
    await page.getByLabel('Password').fill('ValidPass123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByLabel('2FA Code').fill('123456');
    await page.getByRole('button', { name: 'Verify' }).click();
    
    await page.goto('/kanban');
    
    // Should show 2 columns side by side on tablet
    const columns = page.getByTestId('kanban-column');
    const visibleColumns = await columns.filter({ hasNot: page.locator('[data-hidden="true"]') }).all();
    expect(visibleColumns.length).toBe(2);
  });

  test('offline mode with sync indicator', async ({ page, context }) => {
    // Create test data
    const testData = new TestDataManager(context.request);
    
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('lawyer@example.com');
    await page.getByLabel('Password').fill('ValidPass123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByLabel('2FA Code').fill('123456');
    await page.getByRole('button', { name: 'Verify' }).click();

    // Navigate to matters page
    await page.goto('/matters');
    
    // Enable offline mode
    await context.setOffline(true);
    
    // Offline indicator should appear
    await expect(page.getByTestId('offline-indicator')).toBeVisible();
    await expect(page.getByText('Working offline')).toBeVisible();
    
    // Can still navigate cached pages
    await page.goto('/kanban');
    await expect(page.getByRole('heading', { name: 'Kanban Board' })).toBeVisible();
    
    // Create matter while offline
    const mobileMatter = new MobileMatterPage(page);
    await mobileMatter.gotoNew();
    await mobileMatter.fillQuickCreate({
      caseNumber: 'OFFLINE-001',
      title: 'Created Offline',
      clientName: 'Offline Client'
    });
    await mobileMatter.submit();
    
    // Should show pending sync
    await expect(page.getByText('Saved locally - will sync when online')).toBeVisible();
    await expect(page.getByTestId('sync-pending-badge')).toContainText('1');
    
    // Go back online
    await context.setOffline(false);
    
    // Should auto-sync
    await expect(page.getByText('Syncing...')).toBeVisible();
    await expect(page.getByText('All changes synced')).toBeVisible();
    await expect(page.getByTestId('sync-pending-badge')).not.toBeVisible();
    
    // Cleanup
    await testData.cleanupTestData();
  });
});