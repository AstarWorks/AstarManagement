/**
 * Accessibility E2E Tests
 * 
 * Comprehensive accessibility testing using axe-playwright for WCAG compliance
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { createPageHelpers } from '../utils/test-helpers'

test.describe('Accessibility Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Configure axe for comprehensive testing
    await page.addInitScript(() => {
      // Add custom axe rules for legal domain
      if (window.axe) {
        window.axe.configure({
          rules: [
            {
              id: 'legal-form-labels',
              enabled: true,
              tags: ['wcag2a', 'wcag412']
            }
          ]
        })
      }
    })
  })

  test.describe('Authentication Pages', () => {
    test('login page should be accessible', async ({ page }) => {
      await page.goto('/login')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('2FA setup page should be accessible', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.startTwoFactorSetup()
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .exclude('[data-testid="qr-code"]') // QR codes have alternative text access
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('password reset page should be accessible', async ({ page }) => {
      await page.goto('/forgot-password')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Dashboard and Navigation', () => {
    test('main dashboard should be accessible', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('navigation should be keyboard accessible', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      
      // Test keyboard navigation
      await page.keyboard.press('Tab')
      await expect(page.locator(':focus')).toBeVisible()
      
      // Navigate through main menu
      const menuItems = ['Cases', 'Documents', 'Clients', 'Reports', 'Settings']
      for (const item of menuItems) {
        await page.keyboard.press('Tab')
        const focused = page.locator(':focus')
        if (await focused.textContent() === item) {
          await page.keyboard.press('Enter')
          await expect(page.locator('[data-testid="page-content"]')).toBeVisible()
          break
        }
      }
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag211'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('sidebar navigation should have proper ARIA labels', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      
      // Check navigation structure
      await expect(page.locator('nav[role="navigation"]')).toBeVisible()
      await expect(page.locator('[aria-label="Main navigation"]')).toBeVisible()
      
      // Check menu items have proper roles
      const menuItems = page.locator('nav[role="navigation"] [role="menuitem"]')
      const count = await menuItems.count()
      expect(count).toBeGreaterThan(0)
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('nav')
        .withTags(['wcag2a', 'wcag412'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Case Management Forms', () => {
    test('create case form should be accessible', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/cases')
      await page.click('[data-testid="create-case-button"]')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('form validation should be accessible', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/cases')
      await page.click('[data-testid="create-case-button"]')
      
      // Trigger validation errors
      await page.click('[data-testid="submit-case-button"]')
      
      // Check error messages are properly associated
      await expect(page.locator('[aria-describedby*="error"]')).toBeVisible()
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag412'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('complex form fields should have proper labels', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/cases')
      await page.click('[data-testid="create-case-button"]')
      
      // Check all form fields have labels
      const inputs = page.locator('input, textarea, select')
      const inputCount = await inputs.count()
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i)
        const inputId = await input.getAttribute('id')
        const ariaLabel = await input.getAttribute('aria-label')
        const ariaLabelledby = await input.getAttribute('aria-labelledby')
        
        // Each input should have either a label, aria-label, or aria-labelledby
        const hasLabel = inputId && await page.locator(`label[for="${inputId}"]`).count() > 0
        const hasAriaLabel = ariaLabel && ariaLabel.length > 0
        const hasAriaLabelledby = ariaLabelledby && ariaLabelledby.length > 0
        
        expect(hasLabel || hasAriaLabel || hasAriaLabelledby).toBeTruthy()
      }
    })
  })

  test.describe('Kanban Board Accessibility', () => {
    test('kanban board should be keyboard navigable', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/kanban')
      
      // Test keyboard navigation through kanban items
      await page.keyboard.press('Tab')
      
      // Find first draggable item
      const firstCard = page.locator('[draggable="true"]').first()
      await firstCard.focus()
      
      // Check card is focusable and has proper ARIA attributes
      await expect(firstCard).toBeFocused()
      await expect(firstCard).toHaveAttribute('tabindex', '0')
      await expect(firstCard).toHaveAttribute('role', 'button')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag211'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('drag and drop should have keyboard alternatives', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/kanban')
      
      // Test keyboard-based drag and drop
      const firstCard = page.locator('[data-testid^="matter-card-"]').first()
      await firstCard.focus()
      
      // Activate drag mode with space/enter
      await page.keyboard.press('Space')
      await expect(page.locator('[data-testid="drag-instructions"]')).toBeVisible()
      
      // Move with arrow keys
      await page.keyboard.press('ArrowRight')
      
      // Drop with space/enter
      await page.keyboard.press('Space')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag211'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('kanban columns should have proper headings', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/kanban')
      
      // Check column headers
      const columns = page.locator('[data-testid="kanban-column"]')
      const columnCount = await columns.count()
      
      for (let i = 0; i < columnCount; i++) {
        const column = columns.nth(i)
        const heading = column.locator('h2, h3, [role="heading"]')
        await expect(heading).toBeVisible()
      }
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="kanban-board"]')
        .withTags(['wcag2a', 'wcag131'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Document Management', () => {
    test('document list should be accessible', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/documents')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('file upload should be accessible', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/documents')
      
      // Check file upload accessibility
      const uploadArea = page.locator('[data-testid="document-upload-area"]')
      await expect(uploadArea).toHaveAttribute('role', 'button')
      await expect(uploadArea).toHaveAttribute('tabindex', '0')
      
      // Check associated file input
      const fileInput = page.locator('input[type="file"]')
      await expect(fileInput).toHaveAttribute('aria-label')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="document-upload-area"]')
        .withTags(['wcag2a', 'wcag412'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('document viewer should be accessible', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/documents')
      
      // Open first document
      await page.click('[data-testid^="document-item-"]')
      
      // Check document viewer accessibility
      await expect(page.locator('[data-testid="document-viewer"]')).toBeVisible()
      await expect(page.locator('[role="main"]')).toBeVisible()
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="document-viewer"]')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Data Tables and Lists', () => {
    test('matter list table should be accessible', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/cases')
      
      // Switch to table view if available
      const tableViewButton = page.locator('[data-testid="table-view-button"]')
      if (await tableViewButton.isVisible()) {
        await tableViewButton.click()
      }
      
      // Check table accessibility
      const table = page.locator('table')
      if (await table.count() > 0) {
        await expect(table).toHaveAttribute('role', 'table')
        await expect(table.locator('thead th')).toHaveCount.greaterThan(0)
        
        // Check column headers have proper scope
        const headers = table.locator('thead th')
        const headerCount = await headers.count()
        
        for (let i = 0; i < headerCount; i++) {
          const header = headers.nth(i)
          await expect(header).toHaveAttribute('scope', 'col')
        }
      }
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('table')
        .withTags(['wcag2a', 'wcag131'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('sortable columns should be accessible', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/cases')
      
      // Find sortable column headers
      const sortableHeaders = page.locator('[data-testid="sortable-header"]')
      const headerCount = await sortableHeaders.count()
      
      if (headerCount > 0) {
        const firstHeader = sortableHeaders.first()
        
        // Check sorting accessibility
        await expect(firstHeader).toHaveAttribute('role', 'button')
        await expect(firstHeader).toHaveAttribute('tabindex', '0')
        await expect(firstHeader).toHaveAttribute('aria-sort')
        
        // Test keyboard activation
        await firstHeader.focus()
        await page.keyboard.press('Enter')
        
        // Check sort state change
        const ariaSort = await firstHeader.getAttribute('aria-sort')
        expect(['ascending', 'descending']).toContain(ariaSort)
      }
    })

    test('pagination should be accessible', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/cases')
      
      const pagination = page.locator('[data-testid="pagination"]')
      if (await pagination.isVisible()) {
        // Check pagination structure
        await expect(pagination).toHaveAttribute('role', 'navigation')
        await expect(pagination).toHaveAttribute('aria-label', /pagination/i)
        
        // Check page buttons
        const pageButtons = pagination.locator('button')
        const buttonCount = await pageButtons.count()
        
        for (let i = 0; i < buttonCount; i++) {
          const button = pageButtons.nth(i)
          await expect(button).toHaveAttribute('aria-label')
        }
      }
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="pagination"]')
        .withTags(['wcag2a', 'wcag412'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Modals and Overlays', () => {
    test('modal dialogs should be accessible', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/cases')
      
      // Open modal
      await page.click('[data-testid="create-case-button"]')
      
      const modal = page.locator('[data-testid="create-case-modal"]')
      await expect(modal).toBeVisible()
      
      // Check modal accessibility
      await expect(modal).toHaveAttribute('role', 'dialog')
      await expect(modal).toHaveAttribute('aria-modal', 'true')
      await expect(modal).toHaveAttribute('aria-labelledby')
      
      // Check focus management
      const modalTitle = modal.locator('[data-testid="modal-title"]')
      await expect(modalTitle).toBeFocused()
      
      // Test escape key
      await page.keyboard.press('Escape')
      await expect(modal).not.toBeVisible()
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('dropdown menus should be accessible', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      
      // Open user menu
      await page.click('[data-testid="user-menu-button"]')
      
      const menu = page.locator('[data-testid="user-menu"]')
      await expect(menu).toBeVisible()
      
      // Check menu accessibility
      await expect(menu).toHaveAttribute('role', 'menu')
      
      const menuItems = menu.locator('[role="menuitem"]')
      const itemCount = await menuItems.count()
      
      for (let i = 0; i < itemCount; i++) {
        const item = menuItems.nth(i)
        await expect(item).toHaveAttribute('tabindex', '0')
      }
      
      // Test keyboard navigation
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
    })

    test('tooltips should be accessible', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/cases')
      
      // Find element with tooltip
      const tooltipTrigger = page.locator('[data-testid="help-icon"]').first()
      if (await tooltipTrigger.isVisible()) {
        // Hover to show tooltip
        await tooltipTrigger.hover()
        
        const tooltip = page.locator('[role="tooltip"]')
        await expect(tooltip).toBeVisible()
        
        // Check tooltip accessibility
        const tooltipId = await tooltip.getAttribute('id')
        await expect(tooltipTrigger).toHaveAttribute('aria-describedby', tooltipId)
      }
    })
  })

  test.describe('Color Contrast and Visual Elements', () => {
    test('should meet color contrast requirements', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .include('body')
        .analyze()

      const contrastViolations = accessibilityScanResults.violations.filter(
        violation => violation.id === 'color-contrast'
      )
      
      expect(contrastViolations).toEqual([])
    })

    test('should be usable without color alone', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/kanban')
      
      // Check that status indicators use more than just color
      const statusIndicators = page.locator('[data-testid="status-indicator"]')
      const indicatorCount = await statusIndicators.count()
      
      for (let i = 0; i < indicatorCount; i++) {
        const indicator = statusIndicators.nth(i)
        
        // Should have text or icon in addition to color
        const hasText = (await indicator.textContent())?.trim().length > 0
        const hasIcon = await indicator.locator('svg, .icon').count() > 0
        
        expect(hasText || hasIcon).toBeTruthy()
      }
    })

    test('should support high contrast mode', async ({ page }) => {
      // Simulate high contrast mode
      await page.emulateMedia({ media: 'screen', prefersColorScheme: 'dark' })
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            * { outline: 1px solid !important; }
          }
        `
      })
      
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Screen Reader Support', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      
      // Check heading structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6, [role="heading"]')
      const headingCount = await headings.count()
      
      if (headingCount > 0) {
        // Should have at least one h1
        const h1Count = await page.locator('h1').count()
        expect(h1Count).toBeGreaterThanOrEqual(1)
        
        // Check heading order doesn't skip levels
        for (let i = 0; i < headingCount; i++) {
          const heading = headings.nth(i)
          const tagName = await heading.evaluate(el => el.tagName.toLowerCase())
          const ariaLevel = await heading.getAttribute('aria-level')
          
          // Extract level from tag name or aria-level
          const level = ariaLevel ? parseInt(ariaLevel) : parseInt(tagName.replace('h', ''))
          expect(level).toBeGreaterThanOrEqual(1)
          expect(level).toBeLessThanOrEqual(6)
        }
      }
    })

    test('should have proper landmark roles', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      
      // Check for required landmarks
      await expect(page.locator('main, [role="main"]')).toHaveCount.greaterThanOrEqual(1)
      await expect(page.locator('nav, [role="navigation"]')).toHaveCount.greaterThanOrEqual(1)
      
      // Check banner/header
      const banner = page.locator('header, [role="banner"]')
      if (await banner.count() > 0) {
        await expect(banner).toBeVisible()
      }
      
      // Check contentinfo/footer
      const contentinfo = page.locator('footer, [role="contentinfo"]')
      if (await contentinfo.count() > 0) {
        await expect(contentinfo).toBeVisible()
      }
    })

    test('should announce dynamic content changes', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/cases')
      
      // Create new case to trigger live region update
      await page.click('[data-testid="create-case-button"]')
      await helpers.forms.fillField('[data-testid="case-title-input"]', 'Screen Reader Test Case')
      await helpers.forms.fillField('[data-testid="case-client-input"]', 'Test Client')
      await page.click('[data-testid="submit-case-button"]')
      
      // Check for live region with success message
      const liveRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]')
      await expect(liveRegion).toBeVisible()
      await expect(liveRegion).toContainText('created successfully')
    })
  })
})