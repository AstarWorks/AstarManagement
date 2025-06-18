/**
 * Matter Management CRUD Operations E2E Tests
 * Tests create, read, update, and delete operations for matters
 */

import { test, expect } from '../fixtures/auth';
import { MattersPage } from '../pages/MattersPage';
import { MatterDetailPage } from '../pages/MatterDetailPage';
import { TestDataManager } from '../utils/test-data';

test.describe('Matter Management', () => {
  let testData: TestDataManager;

  test.beforeEach(async ({ request }) => {
    testData = new TestDataManager(request);
  });

  test.afterEach(async () => {
    await testData.cleanupTestData();
  });

  test.describe('Create Matter', () => {
    test('lawyer can create new matter with all fields', async ({ authenticatedPage }) => {
      const mattersPage = new MattersPage(authenticatedPage);
      await mattersPage.goto();
      
      await mattersPage.clickNewMatter();
      
      // Fill matter form
      const matterData = {
        caseNumber: `2025-CV-${Date.now()}`,
        title: 'Contract Dispute - ABC Corp vs XYZ Ltd',
        clientName: 'ABC Corporation',
        opposingParty: 'XYZ Limited',
        courtName: 'Tokyo District Court',
        judge: 'Hon. Tanaka',
        description: 'Breach of contract claim regarding software development',
        status: 'INTAKE',
        priority: 'HIGH',
        practiceArea: 'Commercial Litigation'
      };
      
      await mattersPage.fillMatterForm(matterData);
      await mattersPage.submitMatterForm();
      
      // Verify success message
      await expect(authenticatedPage.getByText('Matter created successfully')).toBeVisible();
      
      // Verify matter appears in list
      await mattersPage.searchMatters(matterData.caseNumber);
      const matterCard = mattersPage.getMatterCard(matterData.caseNumber);
      await expect(matterCard).toBeVisible();
      await expect(matterCard).toContainText(matterData.title);
      await expect(matterCard).toContainText(matterData.clientName);
      await expect(matterCard.getByTestId('priority-badge')).toContainText('HIGH');
    });

    test('clerk cannot create matters without permission', async ({ page, loginAsClerk }) => {
      await loginAsClerk();
      const mattersPage = new MattersPage(page);
      await mattersPage.goto();
      
      // New matter button should not be visible
      await expect(mattersPage.newMatterButton).not.toBeVisible();
      
      // Direct navigation should be blocked
      await page.goto('/matters/new');
      await expect(page.getByText('You do not have permission')).toBeVisible();
    });

    test('validates required fields on matter creation', async ({ authenticatedPage }) => {
      const mattersPage = new MattersPage(authenticatedPage);
      await mattersPage.goto();
      await mattersPage.clickNewMatter();
      
      // Try to submit empty form
      await mattersPage.submitMatterForm();
      
      // Check validation messages
      await expect(authenticatedPage.getByText('Case number is required')).toBeVisible();
      await expect(authenticatedPage.getByText('Title is required')).toBeVisible();
      await expect(authenticatedPage.getByText('Client name is required')).toBeVisible();
      
      // Fill only case number
      await mattersPage.fillMatterForm({ caseNumber: '2025-TEST-001' });
      await mattersPage.submitMatterForm();
      
      // Case number error should be gone
      await expect(authenticatedPage.getByText('Case number is required')).not.toBeVisible();
      await expect(authenticatedPage.getByText('Title is required')).toBeVisible();
    });
  });

  test.describe('Update Matter', () => {
    test('lawyer can update matter details', async ({ authenticatedPage, request }) => {
      // Create test matter
      const matter = await testData.createTestMatter({
        title: 'Original Title',
        priority: 'LOW'
      });
      
      const matterDetail = new MatterDetailPage(authenticatedPage, matter.id);
      await matterDetail.goto();
      
      // Click edit button
      await matterDetail.clickEdit();
      
      // Update fields
      await matterDetail.updateField('title', 'Updated Title - Amendment Filed');
      await matterDetail.updateField('priority', 'HIGH');
      await matterDetail.updateField('description', 'Updated description with new information');
      
      await matterDetail.saveChanges();
      
      // Verify success message
      await expect(authenticatedPage.getByText('Matter updated successfully')).toBeVisible();
      
      // Verify changes persisted
      await authenticatedPage.reload();
      await expect(matterDetail.getField('title')).toContainText('Updated Title - Amendment Filed');
      await expect(matterDetail.getField('priority')).toContainText('HIGH');
      await expect(matterDetail.getField('description')).toContainText('Updated description');
    });

    test('concurrent edits show conflict warning', async ({ authenticatedPage, context }) => {
      const matter = await testData.createTestMatter();
      
      // Open matter in two tabs
      const page1 = authenticatedPage;
      const page2 = await context.newPage();
      
      const matterDetail1 = new MatterDetailPage(page1, matter.id);
      const matterDetail2 = new MatterDetailPage(page2, matter.id);
      
      await matterDetail1.goto();
      await matterDetail2.goto();
      
      // Start editing in both tabs
      await matterDetail1.clickEdit();
      await matterDetail2.clickEdit();
      
      // Save changes in first tab
      await matterDetail1.updateField('title', 'First User Update');
      await matterDetail1.saveChanges();
      
      // Try to save in second tab
      await matterDetail2.updateField('title', 'Second User Update');
      await matterDetail2.saveChanges();
      
      // Should show conflict warning
      await expect(page2.getByText('This matter has been modified')).toBeVisible();
      await expect(page2.getByRole('button', { name: 'Reload' })).toBeVisible();
    });
  });

  test.describe('Delete Matter', () => {
    test('lawyer can delete matter with confirmation', async ({ authenticatedPage }) => {
      const matter = await testData.createTestMatter({
        title: 'Matter to Delete'
      });
      
      const matterDetail = new MatterDetailPage(authenticatedPage, matter.id);
      await matterDetail.goto();
      
      // Click delete button
      await matterDetail.clickDelete();
      
      // Confirmation dialog should appear
      const dialog = authenticatedPage.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('Are you sure you want to delete this matter?');
      await expect(dialog).toContainText('This action cannot be undone');
      
      // Cancel first
      await dialog.getByRole('button', { name: 'Cancel' }).click();
      await expect(dialog).not.toBeVisible();
      
      // Delete again and confirm
      await matterDetail.clickDelete();
      await dialog.getByRole('button', { name: 'Delete' }).click();
      
      // Should redirect to matters list
      await expect(authenticatedPage).toHaveURL('/matters');
      await expect(authenticatedPage.getByText('Matter deleted successfully')).toBeVisible();
      
      // Matter should not appear in list
      const mattersPage = new MattersPage(authenticatedPage);
      await mattersPage.searchMatters(matter.caseNumber);
      await expect(mattersPage.getByText('No matters found')).toBeVisible();
    });

    test('cannot delete matter with active documents', async ({ authenticatedPage }) => {
      const matter = await testData.createTestMatter();
      
      // Add document to matter
      await testData.addDocumentToMatter(matter.id, {
        filename: 'contract.pdf',
        type: 'CONTRACT'
      });
      
      const matterDetail = new MatterDetailPage(authenticatedPage, matter.id);
      await matterDetail.goto();
      
      // Try to delete
      await matterDetail.clickDelete();
      
      // Should show error
      await expect(authenticatedPage.getByText('Cannot delete matter with active documents')).toBeVisible();
      await expect(authenticatedPage.getByText('Please archive or remove all documents first')).toBeVisible();
    });
  });
});