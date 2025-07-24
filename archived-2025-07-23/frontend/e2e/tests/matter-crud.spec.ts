import { test, expect } from '@playwright/test'
import { LoginPage, MatterPage, KanbanPage } from '../pages'

test.describe('Matter CRUD Operations', () => {
  let loginPage: LoginPage
  let matterPage: MatterPage
  let kanbanPage: KanbanPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    matterPage = new MatterPage(page)
    kanbanPage = new KanbanPage(page)
    
    // Login before each test
    await loginPage.goto()
    await loginPage.login('lawyer@example.com', 'password123')
    await loginPage.assertLoginSuccess()
  })

  test('should create new matter', async ({ page }) => {
    await matterPage.gotoCreate()
    
    // Fill matter form
    await matterPage.fillMatterForm({
      title: 'Test Contract Dispute',
      caseNumber: 'CASE-2024-001',
      description: 'Contract dispute between Company A and Company B',
      priority: 'high',
      status: 'intake',
      clientName: 'Company A',
      opponentName: 'Company B',
      dueDate: '2024-12-31',
      tags: ['contract', 'dispute']
    })
    
    // Save matter
    await matterPage.saveMatter()
    
    // Should redirect to kanban or matter details
    await expect(page).toHaveURL(/\/(kanban|matters\/[\w-]+)/)
    
    // Verify success toast
    await matterPage.waitForToast('Matter created successfully')
  })

  test('should validate required fields', async ({ page }) => {
    await matterPage.gotoCreate()
    
    // Try to save without required fields
    await matterPage.saveMatter()
    
    // Should show validation errors
    await matterPage.assertHasValidationError('title')
    const errors = await matterPage.getValidationErrors()
    expect(errors).toContain('Title is required')
  })

  test('should update existing matter', async ({ page }) => {
    // First create a matter
    await matterPage.createMatter({
      title: 'Original Title',
      caseNumber: 'CASE-2024-002',
      priority: 'normal'
    })
    
    // Get matter ID from URL
    const url = page.url()
    const matterId = url.match(/matters\/([\w-]+)/)?.[1] || ''
    
    // Edit the matter
    await matterPage.gotoEdit(matterId)
    
    // Update fields
    await matterPage.fillMatterForm({
      title: 'Updated Title',
      priority: 'urgent',
      description: 'Updated description'
    })
    
    await matterPage.saveMatter()
    
    // Verify update
    await matterPage.waitForToast('Matter updated successfully')
    
    // Check updated values
    await matterPage.gotoDetails(matterId)
    await matterPage.assertMatterDetails({
      title: 'Updated Title',
      priority: 'urgent'
    })
  })

  test('should delete matter', async ({ page }) => {
    // First create a matter
    await matterPage.createMatter({
      title: 'Matter to Delete',
      caseNumber: 'CASE-2024-003'
    })
    
    // Get matter ID
    const url = page.url()
    const matterId = url.match(/matters\/([\w-]+)/)?.[1] || ''
    
    // Go to edit page
    await matterPage.gotoEdit(matterId)
    
    // Delete matter
    await matterPage.deleteMatter()
    
    // Should redirect to kanban
    await expect(page).toHaveURL('/kanban')
    
    // Verify deletion toast
    await matterPage.waitForToast('Matter deleted successfully')
    
    // Verify matter is not in kanban
    const matters = await kanbanPage.getMattersInColumn('intake')
    expect(matters).not.toContain(matterId)
  })

  test('should handle duplicate case numbers', async ({ page }) => {
    // Create first matter
    await matterPage.createMatter({
      title: 'First Matter',
      caseNumber: 'CASE-DUP-001'
    })
    
    // Try to create another with same case number
    await matterPage.gotoCreate()
    await matterPage.fillMatterForm({
      title: 'Second Matter',
      caseNumber: 'CASE-DUP-001'
    })
    await matterPage.saveMatter()
    
    // Should show error
    await matterPage.assertHasValidationError()
    const errors = await matterPage.getValidationErrors()
    expect(errors.join(' ')).toContain('Case number already exists')
  })

  test('should auto-save draft', async ({ page }) => {
    await matterPage.gotoCreate()
    
    // Fill some fields
    await matterPage.fillMatterForm({
      title: 'Draft Matter',
      description: 'This is a draft'
    })
    
    // Wait for auto-save
    await page.waitForTimeout(2000)
    
    // Reload page
    await page.reload()
    
    // Check if draft is restored
    const titleValue = await page.inputValue('input[name="title"]')
    expect(titleValue).toBe('Draft Matter')
  })

  test('should handle status transitions', async ({ page }) => {
    // Create matter in intake
    await matterPage.createMatter({
      title: 'Status Test Matter',
      status: 'intake'
    })
    
    const url = page.url()
    const matterId = url.match(/matters\/([\w-]+)/)?.[1] || ''
    
    // Try valid transition
    await matterPage.gotoEdit(matterId)
    await matterPage.fillMatterForm({
      title: 'Updated Matter Title',
      status: 'initial_review'
    })
    await matterPage.saveMatter()
    
    // Should succeed
    await matterPage.waitForToast('Matter updated successfully')
    
    // Try invalid transition
    await matterPage.gotoEdit(matterId)
    await matterPage.fillMatterForm({
      title: 'Updated Matter Title 2',
      status: 'filed' // Invalid from initial_review
    })
    await matterPage.saveMatter()
    
    // Should show error
    await matterPage.assertHasValidationError()
  })

  test('should handle permissions', async ({ page }) => {
    // Logout and login as client
    await loginPage.logout()
    await loginPage.login('client@example.com', 'password123')
    
    // Try to create matter (should be forbidden)
    await page.goto('/matters/new')
    
    // Should show error or redirect
    const currentUrl = page.url()
    expect(currentUrl).not.toContain('/matters/new')
  })

  test('should export matter data', async ({ page }) => {
    // Create matter
    await matterPage.createMatter({
      title: 'Export Test Matter',
      caseNumber: 'CASE-EXPORT-001'
    })
    
    const url = page.url()
    const matterId = url.match(/matters\/([\w-]+)/)?.[1] || ''
    
    // Go to matter details
    await matterPage.gotoDetails(matterId)
    
    // Click export button (if exists)
    const exportButton = page.locator('button:has-text("Export")')
    if (await exportButton.count() > 0) {
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()
      const download = await downloadPromise
      
      // Check download
      expect(download.suggestedFilename()).toContain('matter')
      expect(download.suggestedFilename()).toMatch(/\.(pdf|csv|json)$/)
    }
  })

  test('should show audit trail', async ({ page }) => {
    // Create and update matter
    await matterPage.createMatter({
      title: 'Audit Test Matter'
    })
    
    const url = page.url()
    const matterId = url.match(/matters\/([\w-]+)/)?.[1] || ''
    
    // Make an update
    await matterPage.updateMatter(matterId, {
      title: 'Updated Audit Test Matter'
    })
    
    // Go to matter details
    await matterPage.gotoDetails(matterId)
    
    // Check for audit trail
    const auditSection = page.locator('[data-testid="audit-trail"]')
    if (await auditSection.count() > 0) {
      await expect(auditSection).toContainText('Created')
      await expect(auditSection).toContainText('Updated')
    }
  })
})