---
task_id: T02_S04
sprint_sequence_id: S04
status: open
complexity: Medium
last_updated: 2025-06-18T10:45:00Z
---

# Task: Critical User Flow E2E Tests

## Description
Implement comprehensive end-to-end tests for the most critical user flows in the Matter Management system. This task focuses on testing authentication, matter CRUD operations, and Kanban board interactions - the core functionality that users rely on daily.

## Goal / Objectives
- Implement robust authentication flow tests including 2FA
- Create comprehensive matter management CRUD tests
- Test Kanban board drag-and-drop functionality
- Validate permission-based access control (RBAC)
- Ensure all critical paths have both happy path and error scenario coverage

## Acceptance Criteria
- [ ] Authentication tests cover login, 2FA, logout, and session management
- [ ] Matter CRUD tests validate create, read, update, and delete operations
- [ ] Kanban board tests verify drag-and-drop and status transitions
- [ ] RBAC tests confirm proper access control for each role
- [ ] All tests pass consistently without flakiness
- [ ] Error scenarios are properly tested with appropriate assertions
- [ ] Test execution time is optimized

## Subtasks
- [ ] Implement authentication flow tests (login, 2FA, logout)
- [ ] Create matter creation and validation tests
- [ ] Build matter update and editing tests
- [ ] Implement matter deletion tests with permissions
- [ ] Create Kanban board drag-and-drop tests
- [ ] Test matter status transitions and confirmations
- [ ] Implement RBAC permission tests for all roles
- [ ] Add error scenario tests for each flow
- [ ] Optimize test performance and stability

## Technical Guidance

### Authentication Flow Tests
```typescript
// e2e/tests/auth.spec.ts
import { test, expect } from '../fixtures/auth';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Authentication Flow', () => {
  test.describe('Login', () => {
    test('successful login with valid credentials and 2FA', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      // Test form validation
      await loginPage.submit();
      await loginPage.expectError('Email is required');
      
      // Fill credentials
      await loginPage.fillCredentials('lawyer@example.com', 'ValidPass123!');
      await loginPage.submit();
      
      // Handle 2FA
      await expect(page).toHaveURL('/login/2fa');
      await loginPage.fill2FACode('123456');
      
      // Verify successful login
      await expect(page).toHaveURL('/dashboard');
      const dashboard = new DashboardPage(page);
      await expect(dashboard.welcomeMessage).toContainText('Welcome back');
    });

    test('invalid credentials show appropriate error', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.login('invalid@example.com', 'wrongpassword');
      await loginPage.expectError('Invalid email or password');
      
      // Should remain on login page
      await expect(page).toHaveURL('/login');
    });

    test('invalid 2FA code prevents login', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.fillCredentials('lawyer@example.com', 'ValidPass123!');
      await loginPage.submit();
      
      // Enter wrong 2FA code
      await loginPage.fill2FACode('000000');
      await loginPage.expectError('Invalid verification code');
      
      // Should remain on 2FA page
      await expect(page).toHaveURL('/login/2fa');
    });

    test('rate limiting after multiple failed attempts', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      // Attempt login 5 times with wrong password
      for (let i = 0; i < 5; i++) {
        await loginPage.login('lawyer@example.com', 'wrongpassword');
        await page.waitForTimeout(500); // Small delay between attempts
      }
      
      // 6th attempt should be rate limited
      await loginPage.fillCredentials('lawyer@example.com', 'wrongpassword');
      await loginPage.submit();
      await loginPage.expectError('Too many attempts. Please try again later');
    });
  });

  test.describe('Session Management', () => {
    test('logout clears session and redirects to login', async ({ authenticatedPage }) => {
      const dashboard = new DashboardPage(authenticatedPage);
      await dashboard.goto();
      
      // Logout
      await dashboard.logout();
      
      // Should redirect to login
      await expect(authenticatedPage).toHaveURL('/login');
      
      // Try to access protected route
      await authenticatedPage.goto('/dashboard');
      await expect(authenticatedPage).toHaveURL('/login?redirect=/dashboard');
    });

    test('session timeout redirects to login', async ({ authenticatedPage }) => {
      // Set session to expire immediately
      await authenticatedPage.evaluate(() => {
        localStorage.setItem('session_expires_at', new Date().toISOString());
      });
      
      // Navigate to trigger session check
      await authenticatedPage.goto('/matters');
      
      // Should redirect to login with message
      await expect(authenticatedPage).toHaveURL('/login');
      await expect(authenticatedPage.getByText('Your session has expired')).toBeVisible();
    });

    test('remember me extends session duration', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      // Check remember me
      await page.getByLabel('Remember me').check();
      await loginPage.login('lawyer@example.com', 'ValidPass123!', '123456');
      
      // Check session expiry is extended
      const sessionExpiry = await page.evaluate(() => {
        return localStorage.getItem('session_expires_at');
      });
      
      const expiryDate = new Date(sessionExpiry);
      const now = new Date();
      const daysDiff = (expiryDate - now) / (1000 * 60 * 60 * 24);
      
      expect(daysDiff).toBeGreaterThan(25); // Should be ~30 days
    });
  });
});
```

### Matter CRUD Operations Tests
```typescript
// e2e/tests/matters-crud.spec.ts
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
```

### Kanban Board Tests
```typescript
// e2e/tests/kanban-board.spec.ts
import { test, expect } from '../fixtures/auth';
import { KanbanPage } from '../pages/KanbanPage';
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
      await intakeMatter.dragTo(reviewColumn);
      
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
      
      await waitingMatter.dragTo(completedColumn);
      
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
      await matter.dragTo(kanbanPage.getColumn('INITIAL_REVIEW'));
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
      const collapseButton = intakeColumn.getByRole('button', { name: 'Collapse' });
      
      // Collapse column
      await collapseButton.click();
      
      // Matters should be hidden
      await expect(kanbanPage.getMatterInColumn('INTAKE', testMatters[0].caseNumber)).not.toBeVisible();
      
      // Column should show collapsed state
      await expect(intakeColumn).toHaveAttribute('data-collapsed', 'true');
      
      // Expand again
      await intakeColumn.getByRole('button', { name: 'Expand' }).click();
      await expect(kanbanPage.getMatterInColumn('INTAKE', testMatters[0].caseNumber)).toBeVisible();
    });

    test('filters matters within board', async ({ authenticatedPage }) => {
      const kanbanPage = new KanbanPage(authenticatedPage);
      await kanbanPage.goto();
      
      // Apply priority filter
      await kanbanPage.filterByPriority('HIGH');
      
      // Create high priority matter
      const highPriorityMatter = await testData.createTestMatter({
        status: 'INTAKE',
        priority: 'HIGH',
        title: 'Urgent Matter'
      });
      
      await authenticatedPage.reload();
      
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
      await matter.dragTo(kanbanPage2.getColumn('INITIAL_REVIEW'));
      await page2.getByRole('button', { name: 'Confirm' }).click();
      
      // First browser should show update (within polling interval)
      await authenticatedPage.waitForTimeout(3000); // Wait for polling update
      
      // Matter should appear in new column in first browser
      await expect(kanbanPage1.getMatterInColumn('INITIAL_REVIEW', testMatters[0].caseNumber)).toBeVisible();
      await expect(kanbanPage1.getMatterInColumn('INTAKE', testMatters[0].caseNumber)).not.toBeVisible();
      
      // Notification should appear
      await expect(authenticatedPage.getByText('Matter status updated')).toBeVisible();
    });
  });
});
```

### RBAC Permission Tests
```typescript
// e2e/tests/rbac-permissions.spec.ts
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
      clientId: 'client-123'
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
        clientId: 'other-client-456'
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
```

## Implementation Notes

### Dependencies
- Requires T01_S04 infrastructure to be completed first
- Uses page objects and fixtures from infrastructure task
- Relies on test data management utilities

### Testing Strategy
1. **Happy Path First**: Implement successful scenarios before edge cases
2. **Error Scenarios**: Test validation, permissions, and error handling
3. **Real-world Flows**: Test complete user journeys, not isolated features
4. **Data Independence**: Each test should create and clean up its own data

### Best Practices
- Use descriptive test names that explain the scenario
- Group related tests using describe blocks
- Always clean up test data to prevent interference
- Use proper waits instead of arbitrary delays
- Test both UI feedback and data persistence

### Common Issues to Address
- Flaky drag-and-drop tests: Use proper wait conditions
- Race conditions: Test concurrent operations
- Permission edge cases: Test boundary conditions
- Mobile gestures: Ensure touch events work correctly

## References
- Original comprehensive E2E testing scope from T01_S04
- Authentication flow requirements from project documentation
- RBAC permission model from Sprint 1 implementation

## Output Log
*(This section is populated as work progresses on the task)*

[2025-06-18 10:45:00] Task created: Critical User Flow E2E Tests