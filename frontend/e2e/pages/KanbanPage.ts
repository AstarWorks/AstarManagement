/**
 * Page Object for Kanban Board
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class KanbanPage extends BasePage {
  readonly board: Locator;
  readonly filterBar: Locator;
  readonly searchBar: Locator;
  
  constructor(page: Page) {
    super(page);
    this.board = page.getByTestId('kanban-board');
    this.filterBar = page.getByTestId('filter-bar');
    this.searchBar = page.getByTestId('search-bar');
  }

  async goto() {
    await this.page.goto('/kanban');
    await this.waitForPageLoad();
  }

  getColumn(status: string): Locator {
    return this.page.getByTestId(`column-${status}`);
  }

  getMatterInColumn(status: string, caseNumber: string): Locator {
    return this.getColumn(status).getByTestId(`matter-card-${caseNumber}`);
  }

  getColumnCount(status: string): Locator {
    return this.getColumn(status).getByTestId('column-count');
  }

  async filterByPriority(priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') {
    await this.filterBar.getByRole('button', { name: 'Priority' }).click();
    await this.page.getByRole('checkbox', { name: priority }).check();
    await this.page.keyboard.press('Escape'); // Close dropdown
  }

  async filterByAssignee(assigneeName: string) {
    await this.filterBar.getByRole('button', { name: 'Assignee' }).click();
    await this.page.getByRole('checkbox', { name: assigneeName }).check();
    await this.page.keyboard.press('Escape');
  }

  async clearFilters() {
    await this.filterBar.getByRole('button', { name: 'Clear Filters' }).click();
  }

  async searchMatters(query: string) {
    await this.searchBar.fill(query);
    await this.searchBar.press('Enter');
  }

  async dragMatterToColumn(matterCard: Locator, targetColumn: Locator) {
    // Get bounding boxes
    const matterBox = await matterCard.boundingBox();
    const columnBox = await targetColumn.boundingBox();
    
    if (!matterBox || !columnBox) {
      throw new Error('Could not get element positions');
    }

    // Drag from center of matter card to center of target column
    await this.page.mouse.move(
      matterBox.x + matterBox.width / 2,
      matterBox.y + matterBox.height / 2
    );
    await this.page.mouse.down();
    
    // Move to target column
    await this.page.mouse.move(
      columnBox.x + columnBox.width / 2,
      columnBox.y + columnBox.height / 2,
      { steps: 10 }
    );
    await this.page.mouse.up();
  }

  async toggleColumnCollapse(status: string) {
    const column = this.getColumn(status);
    const toggleButton = column.getByTestId('column-toggle');
    await toggleButton.click();
  }

  async waitForAutoRefresh() {
    // Wait for the polling interval (typically 3 seconds)
    await this.page.waitForTimeout(3500);
  }

  async enableAutoRefresh() {
    await this.page.getByRole('button', { name: 'Auto Refresh' }).click();
    await this.page.getByRole('switch', { name: 'Enable Auto Refresh' }).check();
  }

  async disableAutoRefresh() {
    await this.page.getByRole('button', { name: 'Auto Refresh' }).click();
    await this.page.getByRole('switch', { name: 'Enable Auto Refresh' }).uncheck();
  }
}