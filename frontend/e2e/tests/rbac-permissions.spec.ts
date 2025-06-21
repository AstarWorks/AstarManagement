/**
 * Role-Based Access Control (RBAC) E2E Tests
 * Tests permission enforcement for different user roles
 */

import { test, expect } from '../fixtures/auth';
import { MattersPage } from '../pages/MattersPage';
import { MatterDetailPage } from '../pages/MatterDetailPage';
import { TestDataManager } from '../utils/test-data';

test.describe('Role-Based Access Control', () => {
  let testData: TestDataManager;
  let testMatter: any;

  test.beforeEach(async ({ request }) => {
    testData = new TestDataManager(request);
    testMatter = await testData.createTestMatter({
      title: 'RBAC Test Matter',
      clientName: 'Test Client'
    });
  });

  test.afterEach(async () => {
    await testData.cleanupTestData();
  });

  test.describe('Lawyer Permissions', () => {
    test('lawyer has full access to matters', async ({ page, loginAsLawyer }) => {
      await loginAsLawyer();
      
      const matterDetail = new MatterDetailPage(page, testMatter.id);
      await matterDetail.goto();
      
      // Should see all actions
      await expect(matterDetail.editButton).toBeVisible();
      await expect(matterDetail.deleteButton).toBeVisible();
      await expect(matterDetail.statusChangeButton).toBeVisible();
      await expect(matterDetail.documentsTab).toBeVisible();
      await expect(matterDetail.financialsTab).toBeVisible();
      
      // Can edit matter
      await matterDetail.clickEdit();
      await expect(page.getByRole('heading', { name: 'Edit Matter' })).toBeVisible();
    });
  });

  test.describe('Clerk Permissions', () => {
    test('clerk has limited matter access', async ({ page, loginAsClerk }) => {
      await loginAsClerk();
      
      const matterDetail = new MatterDetailPage(page, testMatter.id);
      await matterDetail.goto();
      
      // Should see view-only elements
      await expect(matterDetail.getField('title')).toBeVisible();
      await expect(matterDetail.documentsTab).toBeVisible();
      await expect(matterDetail.financialsTab).toBeVisible();
      
      // Should NOT see destructive actions
      await expect(matterDetail.editButton).not.toBeVisible();
      await expect(matterDetail.deleteButton).not.toBeVisible();
      
      // Can add financial entries
      await matterDetail.clickTab('financials');
      await expect(page.getByRole('button', { name: 'Add Entry' })).toBeVisible();
    });

    test('clerk cannot access sensitive client data', async ({ page, loginAsClerk }) => {
      await loginAsClerk();
      
      const matterDetail = new MatterDetailPage(page, testMatter.id);
      await matterDetail.goto();
      await matterDetail.clickTab('client');
      
      // Sensitive fields should be masked
      await expect(page.getByTestId('client-ssn')).toContainText('***-**-****');
      await expect(page.getByTestId('client-phone')).toContainText('***-***-****');
    });
  });

  test.describe('Client Permissions', () => {
    test('client can only see own matters', async ({ page, loginAsClient }) => {
      await loginAsClient();
      
      // Create matter for different client
      const otherMatter = await testData.createTestMatter({
        title: 'Other Client Matter',
        clientName: 'other-client-456'
      });
      
      const mattersPage = new MattersPage(page);
      await mattersPage.goto();
      
      // Should only see their matter
      await expect(mattersPage.getMatterCard(testMatter.caseNumber)).toBeVisible();
      await expect(mattersPage.getMatterCard(otherMatter.caseNumber)).not.toBeVisible();
      
      // Direct access to other matter should be denied
      await page.goto(`/matters/${otherMatter.id}`);
      await expect(page.getByText('Access Denied')).toBeVisible();
    });

    test('client has read-only access to own matter', async ({ page, loginAsClient }) => {
      await loginAsClient();
      
      const matterDetail = new MatterDetailPage(page, testMatter.id);
      await matterDetail.goto();
      
      // Can view matter details
      await expect(matterDetail.getField('title')).toBeVisible();
      await expect(matterDetail.getField('status')).toBeVisible();
      
      // Cannot see edit/delete buttons
      await expect(matterDetail.editButton).not.toBeVisible();
      await expect(matterDetail.deleteButton).not.toBeVisible();
      await expect(matterDetail.statusChangeButton).not.toBeVisible();
      
      // Cannot see financials tab
      await expect(matterDetail.financialsTab).not.toBeVisible();
      
      // Can upload documents
      await matterDetail.clickTab('documents');
      await expect(page.getByRole('button', { name: 'Upload Document' })).toBeVisible();
    });
  });

  test.describe('Permission Escalation Prevention', () => {
    test('cannot bypass permissions via API', async ({ page, loginAsClerk }) => {
      await loginAsClerk();
      
      // Try to delete matter via API
      const response = await page.request.delete(`/api/v1/matters/${testMatter.id}`);
      expect(response.status()).toBe(403);
      
      const error = await response.json();
      expect(error.message).toContain('Insufficient permissions');
    });

    test('cannot modify role via client-side manipulation', async ({ page, loginAsClient }) => {
      await loginAsClient();
      
      // Try to modify role in localStorage
      await page.evaluate(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.role = 'LAWYER';
        localStorage.setItem('user', JSON.stringify(user));
      });
      
      // Reload page
      await page.reload();
      
      // Should still have client permissions
      const mattersPage = new MattersPage(page);
      await mattersPage.goto();
      await expect(mattersPage.newMatterButton).not.toBeVisible();
    });
  });
});