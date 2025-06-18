import { test, expect } from '../fixtures/auth';
import { MattersPage } from '../pages/MattersPage';
import { MatterDetailPage } from '../pages/MatterDetailPage';
import { TestDataManager } from '../utils/test-data';
import { LoginPage } from '../pages/LoginPage';

test.describe('MVP RBAC Permissions', () => {
  let testData: TestDataManager;
  let testMatter: any;

  test.beforeEach(async ({ request }) => {
    testData = new TestDataManager(request);
    testMatter = await testData.createTestMatter({
      title: 'RBAC Test Matter',
      clientId: 'client-123'
    });
  });

  test.afterEach(async () => {
    await testData.cleanupTestData();
  });

  test.describe('Lawyer Role - Full Access', () => {
    test('lawyer has full access to matters', async ({ page }) => {
      // Login as lawyer
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      await loginPage.login('lawyer@example.com', 'ValidPass123!', '123456');
      
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
      
      // Can view all tabs
      await matterDetail.clickTab('documents');
      await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();
      
      await matterDetail.clickTab('financials');
      await expect(page.getByRole('heading', { name: 'Financial Summary' })).toBeVisible();
    });

    test('lawyer can create new matters', async ({ page }) => {
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      await loginPage.login('lawyer@example.com', 'ValidPass123!', '123456');
      
      const mattersPage = new MattersPage(page);
      await mattersPage.goto();
      
      // Should see new matter button
      await expect(mattersPage.newMatterButton).toBeVisible();
      
      // Can access create form
      await mattersPage.clickNewMatter();
      await expect(page).toHaveURL('/matters/new');
      await expect(page.getByRole('heading', { name: 'Create New Matter' })).toBeVisible();
    });

    test('lawyer can delete matters', async ({ page }) => {
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      await loginPage.login('lawyer@example.com', 'ValidPass123!', '123456');
      
      const matterDetail = new MatterDetailPage(page, testMatter.id);
      await matterDetail.goto();
      
      // Delete button should be visible and enabled
      await expect(matterDetail.deleteButton).toBeVisible();
      await expect(matterDetail.deleteButton).toBeEnabled();
      
      // Can initiate delete
      await matterDetail.clickDelete();
      
      // Confirmation dialog should appear
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('Are you sure you want to delete this matter?');
    });
  });

  test.describe('Clerk Role - Limited Access', () => {
    test('clerk has view access but limited edit capabilities', async ({ page }) => {
      // Login as clerk
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      await loginPage.login('clerk@example.com', 'ValidPass123!', '123456');
      
      const matterDetail = new MatterDetailPage(page, testMatter.id);
      await matterDetail.goto();
      
      // Should see view-only elements
      await expect(matterDetail.getField('title')).toBeVisible();
      await expect(matterDetail.documentsTab).toBeVisible();
      await expect(matterDetail.financialsTab).toBeVisible();
      
      // Should NOT see destructive actions
      await expect(matterDetail.editButton).not.toBeVisible();
      await expect(matterDetail.deleteButton).not.toBeVisible();
      
      // Can view documents
      await matterDetail.clickTab('documents');
      await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();
      
      // Can add financial entries
      await matterDetail.clickTab('financials');
      await expect(page.getByRole('button', { name: 'Add Entry' })).toBeVisible();
    });

    test('clerk cannot create new matters', async ({ page }) => {
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      await loginPage.login('clerk@example.com', 'ValidPass123!', '123456');
      
      const mattersPage = new MattersPage(page);
      await mattersPage.goto();
      
      // New matter button should not be visible
      await expect(mattersPage.newMatterButton).not.toBeVisible();
      
      // Direct navigation should be blocked
      await page.goto('/matters/new');
      await expect(page.getByText('You do not have permission')).toBeVisible();
    });

    test('clerk can view all matters but cannot edit', async ({ page }) => {
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      await loginPage.login('clerk@example.com', 'ValidPass123!', '123456');
      
      const mattersPage = new MattersPage(page);
      await mattersPage.goto();
      
      // Should see matters list
      await expect(mattersPage.getMatterCard(testMatter.caseNumber)).toBeVisible();
      
      // But edit actions should not be available
      const matterCard = mattersPage.getMatterCard(testMatter.caseNumber);
      await matterCard.hover();
      await expect(matterCard.getByRole('button', { name: 'Edit' })).not.toBeVisible();
    });
  });

  test.describe('Client Role - Own Matter Access Only', () => {
    test('client can only see their own matters', async ({ page }) => {
      // Create matter for different client
      const otherMatter = await testData.createTestMatter({
        title: 'Other Client Matter',
        clientId: 'other-client-456'
      });
      
      // Login as client
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      await loginPage.login('client123@example.com', 'ValidPass123!', '123456');
      
      const mattersPage = new MattersPage(page);
      await mattersPage.goto();
      
      // Should only see their matter
      await expect(mattersPage.getMatterCard(testMatter.caseNumber)).toBeVisible();
      
      // Should not see other client's matter
      const otherMatterCard = page.getByTestId(`matter-card-${otherMatter.caseNumber}`);
      await expect(otherMatterCard).not.toBeVisible();
      
      // Direct access to other matter should be denied
      await page.goto(`/matters/${otherMatter.id}`);
      await expect(page.getByText('Access Denied')).toBeVisible();
      await expect(page.getByText('You do not have permission to view this matter')).toBeVisible();
    });

    test('client has read-only access to own matter', async ({ page }) => {
      // Login as client
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      await loginPage.login('client123@example.com', 'ValidPass123!', '123456');
      
      const matterDetail = new MatterDetailPage(page, testMatter.id);
      await matterDetail.goto();
      
      // Can view matter details
      await expect(matterDetail.getField('title')).toBeVisible();
      await expect(matterDetail.getField('status')).toBeVisible();
      await expect(matterDetail.getField('caseNumber')).toBeVisible();
      
      // Cannot see edit/delete buttons
      await expect(matterDetail.editButton).not.toBeVisible();
      await expect(matterDetail.deleteButton).not.toBeVisible();
      await expect(matterDetail.statusChangeButton).not.toBeVisible();
      
      // Cannot see financials tab (sensitive information)
      await expect(matterDetail.financialsTab).not.toBeVisible();
      
      // Can view documents
      await matterDetail.clickTab('documents');
      await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();
      
      // Can upload documents
      await expect(page.getByRole('button', { name: 'Upload Document' })).toBeVisible();
    });

    test('client cannot create matters or access admin features', async ({ page }) => {
      // Login as client
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      await loginPage.login('client123@example.com', 'ValidPass123!', '123456');
      
      // Should not see create matter button
      const mattersPage = new MattersPage(page);
      await mattersPage.goto();
      await expect(mattersPage.newMatterButton).not.toBeVisible();
      
      // Admin routes should be blocked
      await page.goto('/admin');
      await expect(page.getByText('Access Denied')).toBeVisible();
      
      // Settings should be limited
      await page.goto('/settings');
      await expect(page.getByText('Profile Settings')).toBeVisible();
      await expect(page.getByText('System Settings')).not.toBeVisible();
    });
  });

  test.describe('Permission Enforcement via API', () => {
    test('API enforces permissions correctly', async ({ page }) => {
      // Login as clerk
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      await loginPage.login('clerk@example.com', 'ValidPass123!', '123456');
      
      // Try to delete matter via API (should fail)
      const response = await page.request.delete(`/api/v1/matters/${testMatter.id}`);
      expect(response.status()).toBe(403);
      
      const error = await response.json();
      expect(error.message).toContain('Insufficient permissions');
      expect(error.code).toBe('FORBIDDEN');
    });

    test('client cannot access other matters via API', async ({ page }) => {
      const otherMatter = await testData.createTestMatter({
        clientId: 'other-client-456'
      });
      
      // Login as client
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      await loginPage.login('client123@example.com', 'ValidPass123!', '123456');
      
      // Try to access other client's matter via API
      const response = await page.request.get(`/api/v1/matters/${otherMatter.id}`);
      expect(response.status()).toBe(403);
      
      const error = await response.json();
      expect(error.message).toContain('Access Denied');
    });
  });

  test.describe('Audit Trail for Permission-Based Actions', () => {
    test('permission denials are logged', async ({ page }) => {
      // Login as clerk
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      await loginPage.login('clerk@example.com', 'ValidPass123!', '123456');
      
      // Attempt unauthorized action
      await page.goto(`/matters/${testMatter.id}/edit`);
      
      // Should be redirected with error
      await expect(page.getByText('You do not have permission')).toBeVisible();
      
      // Check audit log (as admin in another session)
      const auditLog = await testData.getAuditLog(testMatter.id);
      const denialEntry = auditLog.find(entry => entry.action === 'ACCESS_DENIED');
      
      expect(denialEntry).toBeDefined();
      expect(denialEntry.actor).toBe('clerk@example.com');
      expect(denialEntry.details).toContain('Attempted to edit matter without permission');
    });
  });
});