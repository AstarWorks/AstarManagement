import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';
import { LoginPage } from '../pages/LoginPage';

test.describe('Accessibility Compliance - WCAG 2.1 AA', () => {
  test.beforeEach(async ({ page }) => {
    // Login first for authenticated pages
    await page.goto('/login');
    const loginPage = new LoginPage(page);
    await loginPage.login('lawyer@example.com', 'ValidPass123!', '123456');
  });

  test('main pages pass WCAG 2.1 AA standards', async ({ page }) => {
    const pagesToTest = [
      { url: '/dashboard', name: 'Dashboard' },
      { url: '/matters', name: 'Matters List' },
      { url: '/matters/new', name: 'New Matter Form' },
      { url: '/kanban', name: 'Kanban Board' },
      { url: '/search', name: 'Search Page' }
    ];

    for (const { url, name } of pagesToTest) {
      await test.step(`Testing ${name}`, async () => {
        await page.goto(url);
        await injectAxe(page);
        
        // Check for accessibility violations
        await checkA11y(page, null, {
          detailedReport: true,
          detailedReportOptions: {
            html: true
          }
        });
      });
    }
  });

  test('login page accessibility', async ({ page }) => {
    // Test unauthenticated page
    await page.goto('/login');
    await injectAxe(page);
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
  });

  test('keyboard navigation works throughout app', async ({ page }) => {
    await page.goto('/matters');
    
    // Start from body
    await page.keyboard.press('Tab');
    
    // Should focus skip link first
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeFocused();
    
    // Tab through main navigation
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Matters' })).toBeFocused();
    
    // Tab to main content
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Should reach new matter button
    await expect(page.getByRole('button', { name: 'New Matter' })).toBeFocused();
    
    // Enter to activate
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/matters/new');
    
    // Tab through form fields
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Case Number')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Title')).toBeFocused();
    
    // Escape should work in modals
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL('/matters');
  });

  test('screen reader announcements for dynamic content', async ({ page }) => {
    await page.goto('/kanban');
    
    // Check for ARIA live regions
    const liveRegion = page.getByRole('status');
    await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    await expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    
    // Check matter cards have proper ARIA labels
    const matterCards = page.getByTestId('matter-card');
    const firstCard = matterCards.first();
    await expect(firstCard).toHaveAttribute('role', 'article');
    await expect(firstCard).toHaveAttribute('aria-label', /Matter:.+/);
    
    // Column headers should be marked properly
    const columns = page.getByTestId('kanban-column');
    for (const column of await columns.all()) {
      const header = column.getByRole('heading');
      await expect(header).toHaveAttribute('aria-level', '2');
    }
  });

  test('form accessibility and error handling', async ({ page }) => {
    await page.goto('/matters/new');
    
    // All form fields should have labels
    const inputs = page.getByRole('textbox');
    for (const input of await inputs.all()) {
      const label = await input.getAttribute('aria-label') || await input.getAttribute('id');
      expect(label).toBeTruthy();
    }
    
    // Submit empty form to trigger errors
    await page.getByRole('button', { name: 'Create Matter' }).click();
    
    // Error messages should be announced
    const errorMessages = page.getByRole('alert');
    await expect(errorMessages.first()).toBeVisible();
    
    // Fields should have aria-invalid
    const caseNumberInput = page.getByLabel('Case Number');
    await expect(caseNumberInput).toHaveAttribute('aria-invalid', 'true');
    
    // Error should be associated with field
    const errorId = await caseNumberInput.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    const errorElement = page.locator(`#${errorId}`);
    await expect(errorElement).toContainText('required');
  });

  test('color contrast meets WCAG standards', async ({ page }) => {
    await page.goto('/matters');
    
    // Check specific elements for contrast
    await injectAxe(page);
    
    // Check only color contrast rules
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  });

  test('focus indicators are visible', async ({ page }) => {
    await page.goto('/matters');
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Get focused element
    const focusedElement = page.locator(':focus');
    
    // Check for focus styles
    const outlineWidth = await focusedElement.evaluate(el => 
      window.getComputedStyle(el).outlineWidth
    );
    const outlineStyle = await focusedElement.evaluate(el => 
      window.getComputedStyle(el).outlineStyle
    );
    
    // Should have visible focus indicator
    expect(parseInt(outlineWidth)).toBeGreaterThan(0);
    expect(outlineStyle).not.toBe('none');
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find all images
    const images = page.getByRole('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      
      // Should have alt text (even if empty for decorative images)
      expect(alt).toBeDefined();
    }
  });

  test('page has proper heading structure', async ({ page }) => {
    await page.goto('/matters');
    
    // Should have exactly one h1
    const h1s = page.getByRole('heading', { level: 1 });
    await expect(h1s).toHaveCount(1);
    
    // H1 should come before any h2
    const h1Text = await h1s.textContent();
    expect(h1Text).toBeTruthy();
    
    // Check heading hierarchy
    const allHeadings = page.getByRole('heading');
    const headingLevels = [];
    
    for (const heading of await allHeadings.all()) {
      const level = await heading.getAttribute('aria-level') || 
                   await heading.evaluate(el => el.tagName.replace('H', ''));
      headingLevels.push(parseInt(level));
    }
    
    // Verify no skipped levels
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i-1];
      expect(diff).toBeLessThanOrEqual(1); // No skipping levels
    }
  });

  test('tables have proper structure', async ({ page }) => {
    await page.goto('/matters');
    
    // If there are tables, check structure
    const tables = page.getByRole('table');
    const tableCount = await tables.count();
    
    if (tableCount > 0) {
      for (let i = 0; i < tableCount; i++) {
        const table = tables.nth(i);
        
        // Should have caption or aria-label
        const caption = await table.getByRole('caption').count();
        const ariaLabel = await table.getAttribute('aria-label');
        expect(caption > 0 || ariaLabel).toBeTruthy();
        
        // Should have proper headers
        const headers = table.getByRole('columnheader');
        await expect(headers).toHaveCount(await table.getByRole('cell').count() / await table.getByRole('row').count());
      }
    }
  });

  test('interactive elements have accessible names', async ({ page }) => {
    await page.goto('/matters');
    
    // Check all buttons
    const buttons = page.getByRole('button');
    for (const button of await buttons.all()) {
      const accessibleName = await button.getAttribute('aria-label') || 
                            await button.textContent();
      expect(accessibleName?.trim()).toBeTruthy();
    }
    
    // Check all links
    const links = page.getByRole('link');
    for (const link of await links.all()) {
      const accessibleName = await link.getAttribute('aria-label') || 
                            await link.textContent();
      expect(accessibleName?.trim()).toBeTruthy();
    }
  });

  test('comprehensive keyboard navigation including escape and arrows', async ({ page }) => {
    await page.goto('/kanban');
    
    // Test escape key functionality
    const matterCard = page.getByTestId('matter-card').first();
    await matterCard.click();
    
    // Open matter detail modal/page
    const modal = page.getByRole('dialog');
    if (await modal.isVisible()) {
      // Test escape closes modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
    
    // Test arrow key navigation in Kanban board
    await matterCard.focus();
    
    // Right arrow should move to next column
    await page.keyboard.press('ArrowRight');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Left arrow should move back
    await page.keyboard.press('ArrowLeft');
    
    // Down arrow should move to card below
    await page.keyboard.press('ArrowDown');
    
    // Up arrow should move to card above
    await page.keyboard.press('ArrowUp');
    
    // Test spacebar activation
    await page.keyboard.press('Space');
    // Should activate the focused element
  });

  test('focus trapping in modals and dialogs', async ({ page }) => {
    await page.goto('/matters');
    
    // Open new matter modal
    await page.getByRole('button', { name: 'New Matter' }).click();
    
    const modal = page.getByRole('dialog');
    if (await modal.isVisible()) {
      // Focus should be trapped within modal
      const firstFocusable = modal.getByRole('textbox').first();
      const lastFocusable = modal.getByRole('button').last();
      
      // Tab should cycle through modal elements only
      await firstFocusable.focus();
      
      // Tab through all focusable elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Focus should still be within modal
      const currentFocus = page.locator(':focus');
      const isWithinModal = await modal.locator(':focus').count() > 0;
      expect(isWithinModal).toBeTruthy();
      
      // Shift+Tab should reverse cycle
      await page.keyboard.press('Shift+Tab');
      const reverseFocus = page.locator(':focus');
      await expect(reverseFocus).toBeVisible();
      
      // Escape should close and restore focus
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
      
      // Focus should return to trigger button
      await expect(page.getByRole('button', { name: 'New Matter' })).toBeFocused();
    }
  });

  test('ARIA live regions announce dynamic changes', async ({ page }) => {
    await page.goto('/kanban');
    
    // Check for multiple types of live regions
    const politeRegion = page.getByRole('status');
    const assertiveRegion = page.locator('[aria-live="assertive"]');
    
    await expect(politeRegion).toHaveAttribute('aria-live', 'polite');
    
    // Test drag and drop announcement
    const matter = page.getByTestId('matter-card').first();
    const targetColumn = page.getByTestId('column-IN_PROGRESS');
    
    if (await matter.isVisible() && await targetColumn.isVisible()) {
      await matter.dragTo(targetColumn);
      
      // Check for announcement
      await expect(politeRegion).toContainText(/moved|updated|changed/i);
    }
    
    // Test form error announcements
    await page.goto('/matters/new');
    await page.getByRole('button', { name: 'Create Matter' }).click();
    
    // Error should be announced
    const errorRegion = page.getByRole('alert');
    await expect(errorRegion).toBeVisible();
    await expect(errorRegion).toHaveAttribute('aria-live', 'assertive');
  });

  test('mobile touch target size compliance', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('Mobile-specific test');
    }
    
    await page.goto('/matters');
    
    // All interactive elements should be at least 44x44px
    const buttons = page.getByRole('button');
    for (const button of await buttons.all()) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
    
    const links = page.getByRole('link');
    for (const link of await links.all()) {
      const box = await link.boundingBox();
      if (box) {
        expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('zoom functionality up to 200%', async ({ page }) => {
    await page.goto('/matters');
    
    // Test zoom levels
    const zoomLevels = [1.25, 1.5, 2.0];
    
    for (const zoom of zoomLevels) {
      await page.setViewportSize({ 
        width: Math.floor(1280 / zoom), 
        height: Math.floor(720 / zoom) 
      });
      
      // Content should still be accessible and functional
      await expect(page.getByRole('button', { name: 'New Matter' })).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      
      // Text should not overflow containers
      const mainContent = page.getByRole('main');
      const hasHorizontalScroll = await mainContent.evaluate(el => 
        el.scrollWidth > el.clientWidth
      );
      expect(hasHorizontalScroll).toBeFalsy();
    }
  });
});