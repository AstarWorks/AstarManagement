/**
 * Kanban Board E2E Tests
 * Tests drag-and-drop, column features, filtering, and real-time updates
 */

import { test, expect } from '../fixtures/auth';
import { KanbanPage } from '../pages/KanbanPage';
import { LoginPage } from '../pages/LoginPage';
import { TestDataManager } from '../utils/test-data';

test.describe('Kanban Board', () => {
  let testData: TestDataManager;
  let testMatters: any[];

  test.beforeEach(async ({ request }) => {
    testData = new TestDataManager(request);
    
    // Create test matters in different statuses
    testMatters = await Promise.all([
      testData.createTestMatter({ status: 'INTAKE', title: 'New Client Inquiry' }),
      testData.createTestMatter({ status: 'INITIAL_REVIEW', title: 'Document Review' }),
      testData.createTestMatter({ status: 'IN_PROGRESS', title: 'Ongoing Litigation' }),
      testData.createTestMatter({ status: 'WAITING_CLIENT', title: 'Awaiting Signature' })
    ]);
  });

  test.afterEach(async () => {
    await testData.cleanupTestData();
  });

  test.describe('Drag and Drop', () => {
    test('can drag matter between columns', async ({ authenticatedPage }) => {
      const kanbanPage = new KanbanPage(authenticatedPage);
      await kanbanPage.goto();
      
      // Find matter in INTAKE column
      const intakeMatter = kanbanPage.getMatterInColumn('INTAKE', testMatters[0].caseNumber);
      const reviewColumn = kanbanPage.getColumn('INITIAL_REVIEW');
      
      // Verify initial state
      await expect(intakeMatter).toBeVisible();
      
      // Drag to INITIAL_REVIEW column
      await kanbanPage.dragMatterToColumn(intakeMatter, reviewColumn);
      
      // Confirmation dialog should appear
      const dialog = authenticatedPage.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('Confirm Status Change');
      await expect(dialog).toContainText('Move matter from INTAKE to INITIAL_REVIEW?');
      
      // Add transition note
      await dialog.getByLabel('Transition Note').fill('Initial documents received');
      await dialog.getByRole('button', { name: 'Confirm' }).click();
      
      // Matter should now be in INITIAL_REVIEW column
      const movedMatter = kanbanPage.getMatterInColumn('INITIAL_REVIEW', testMatters[0].caseNumber);
      await expect(movedMatter).toBeVisible();
      
      // Should not be in INTAKE anymore
      await expect(kanbanPage.getMatterInColumn('INTAKE', testMatters[0].caseNumber)).not.toBeVisible();
    });

    test('prevents invalid status transitions', async ({ authenticatedPage }) => {
      const kanbanPage = new KanbanPage(authenticatedPage);
      await kanbanPage.goto();
      
      // Try to drag from WAITING_CLIENT directly to COMPLETED
      const waitingMatter = kanbanPage.getMatterInColumn('WAITING_CLIENT', testMatters[3].caseNumber);
      const completedColumn = kanbanPage.getColumn('COMPLETED');
      
      await kanbanPage.dragMatterToColumn(waitingMatter, completedColumn);
      
      // Should show error
      await expect(authenticatedPage.getByText('Invalid status transition')).toBeVisible();
      await expect(authenticatedPage.getByText('Cannot move directly from WAITING_CLIENT to COMPLETED')).toBeVisible();
      
      // Matter should remain in original column
      await expect(waitingMatter).toBeVisible();
    });

    test('updates last modified timestamp on move', async ({ authenticatedPage }) => {
      const kanbanPage = new KanbanPage(authenticatedPage);
      await kanbanPage.goto();
      
      // Get initial timestamp
      const matter = kanbanPage.getMatterInColumn('INTAKE', testMatters[0].caseNumber);
      const initialTimestamp = await matter.getByTestId('last-modified').textContent();
      
      // Wait a moment to ensure timestamp will be different
      await authenticatedPage.waitForTimeout(1000);
      
      // Move matter
      await kanbanPage.dragMatterToColumn(matter, kanbanPage.getColumn('INITIAL_REVIEW'));
      await authenticatedPage.getByRole('button', { name: 'Confirm' }).click();
      
      // Check updated timestamp
      const movedMatter = kanbanPage.getMatterInColumn('INITIAL_REVIEW', testMatters[0].caseNumber);
      const newTimestamp = await movedMatter.getByTestId('last-modified').textContent();
      
      expect(newTimestamp).not.toBe(initialTimestamp);
    });
  });

  test.describe('Column Features', () => {
    test('shows matter count per column', async ({ authenticatedPage }) => {
      const kanbanPage = new KanbanPage(authenticatedPage);
      await kanbanPage.goto();
      
      // Check column counts
      await expect(kanbanPage.getColumnCount('INTAKE')).toContainText('1');
      await expect(kanbanPage.getColumnCount('INITIAL_REVIEW')).toContainText('1');
      await expect(kanbanPage.getColumnCount('IN_PROGRESS')).toContainText('1');
      await expect(kanbanPage.getColumnCount('WAITING_CLIENT')).toContainText('1');
    });

    test('can collapse and expand columns', async ({ authenticatedPage }) => {
      const kanbanPage = new KanbanPage(authenticatedPage);
      await kanbanPage.goto();
      
      const intakeColumn = kanbanPage.getColumn('INTAKE');
      
      // Collapse column
      await kanbanPage.toggleColumnCollapse('INTAKE');
      
      // Matters should be hidden
      await expect(kanbanPage.getMatterInColumn('INTAKE', testMatters[0].caseNumber)).not.toBeVisible();
      
      // Column should show collapsed state
      await expect(intakeColumn).toHaveAttribute('data-collapsed', 'true');
      
      // Expand again
      await kanbanPage.toggleColumnCollapse('INTAKE');
      await expect(kanbanPage.getMatterInColumn('INTAKE', testMatters[0].caseNumber)).toBeVisible();
    });

    test('filters matters within board', async ({ authenticatedPage }) => {
      const kanbanPage = new KanbanPage(authenticatedPage);
      await kanbanPage.goto();
      
      // Create high priority matter
      const highPriorityMatter = await testData.createTestMatter({
        status: 'INTAKE',
        priority: 'HIGH',
        title: 'Urgent Matter'
      });
      
      await authenticatedPage.reload();
      
      // Apply priority filter
      await kanbanPage.filterByPriority('HIGH');
      
      // Only high priority matter should be visible
      await expect(kanbanPage.getMatterInColumn('INTAKE', highPriorityMatter.caseNumber)).toBeVisible();
      await expect(kanbanPage.getMatterInColumn('INTAKE', testMatters[0].caseNumber)).not.toBeVisible();
      
      // Clear filter
      await kanbanPage.clearFilters();
      await expect(kanbanPage.getMatterInColumn('INTAKE', testMatters[0].caseNumber)).toBeVisible();
    });
  });

  test.describe('Real-time Updates', () => {
    test('shows real-time updates when matter is moved by another user', async ({ authenticatedPage, context }) => {
      const kanbanPage1 = new KanbanPage(authenticatedPage);
      await kanbanPage1.goto();
      
      // Open second browser context
      const page2 = await context.newPage();
      await page2.goto('/login');
      const loginPage = new LoginPage(page2);
      await loginPage.login('lawyer2@example.com', 'password', '123456');
      
      const kanbanPage2 = new KanbanPage(page2);
      await kanbanPage2.goto();
      
      // Move matter in second browser
      const matter = kanbanPage2.getMatterInColumn('INTAKE', testMatters[0].caseNumber);
      await kanbanPage2.dragMatterToColumn(matter, kanbanPage2.getColumn('INITIAL_REVIEW'));
      await page2.getByRole('button', { name: 'Confirm' }).click();
      
      // First browser should show update (within polling interval)
      await kanbanPage1.waitForAutoRefresh();
      
      // Matter should appear in new column in first browser
      await expect(kanbanPage1.getMatterInColumn('INITIAL_REVIEW', testMatters[0].caseNumber)).toBeVisible();
      await expect(kanbanPage1.getMatterInColumn('INTAKE', testMatters[0].caseNumber)).not.toBeVisible();
      
      // Notification should appear
      await expect(authenticatedPage.getByText('Matter status updated')).toBeVisible();
    });
  });
});