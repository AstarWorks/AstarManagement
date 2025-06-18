import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly kanbanBoard: Locator;
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly createMatterButton: Locator;
  readonly userMenu: Locator;
  readonly notificationBell: Locator;

  constructor(page: Page) {
    super(page);
    this.kanbanBoard = page.getByTestId('kanban-board');
    this.searchInput = page.getByPlaceholder('Search matters...');
    this.filterButton = page.getByRole('button', { name: 'Filter' });
    this.createMatterButton = page.getByRole('button', { name: 'Create Matter' });
    this.userMenu = page.getByTestId('user-menu');
    this.notificationBell = page.getByTestId('notification-bell');
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.waitForLoadState();
  }

  async searchMatters(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    // Wait for search results to update
    await this.page.waitForTimeout(500);
  }

  async openFilters() {
    await this.filterButton.click();
    await this.page.waitForSelector('[role="dialog"]');
  }

  async getColumnCount(): Promise<number> {
    const columns = this.page.locator('[data-testid^="kanban-column-"]');
    return await columns.count();
  }

  async getMatterCountInColumn(columnId: string): Promise<number> {
    const column = this.page.getByTestId(`kanban-column-${columnId}`);
    const matters = column.locator('[data-testid^="matter-card-"]');
    return await matters.count();
  }

  async dragMatterToColumn(matterId: string, targetColumnId: string) {
    const matter = this.page.getByTestId(`matter-card-${matterId}`);
    const targetColumn = this.page.getByTestId(`kanban-column-${targetColumnId}`);
    
    await matter.dragTo(targetColumn);
    
    // Wait for the drop animation and state update
    await this.page.waitForTimeout(500);
  }

  async openUserMenu() {
    await this.userMenu.click();
    await this.page.waitForSelector('[role="menu"]');
  }

  async logout() {
    await this.openUserMenu();
    await this.page.getByRole('menuitem', { name: 'Logout' }).click();
  }

  async expectToBeOnDashboard() {
    await this.page.waitForURL('/dashboard');
    await this.waitForElement(this.kanbanBoard);
  }
}