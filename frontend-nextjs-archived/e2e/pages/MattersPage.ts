/**
 * Page Object for Matters list page
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MattersPage extends BasePage {
  readonly newMatterButton: Locator;
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly mattersList: Locator;

  constructor(page: Page) {
    super(page);
    this.newMatterButton = page.getByRole('button', { name: 'New Matter' });
    this.searchInput = page.getByPlaceholder('Search matters...');
    this.filterButton = page.getByRole('button', { name: 'Filter' });
    this.mattersList = page.getByTestId('matters-list');
  }

  async goto() {
    await this.page.goto('/matters');
    await this.waitForPageLoad();
  }

  async clickNewMatter() {
    await this.newMatterButton.click();
    await this.page.waitForURL('/matters/new');
  }

  async searchMatters(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.page.waitForTimeout(500); // Wait for search results
  }

  async fillMatterForm(data: Partial<{
    caseNumber: string;
    title: string;
    clientName: string;
    opposingParty: string;
    courtName: string;
    judge: string;
    description: string;
    status: string;
    priority: string;
    practiceArea: string;
  }>) {
    if (data.caseNumber) {
      await this.page.getByLabel('Case Number').fill(data.caseNumber);
    }
    if (data.title) {
      await this.page.getByLabel('Title').fill(data.title);
    }
    if (data.clientName) {
      await this.page.getByLabel('Client Name').fill(data.clientName);
    }
    if (data.opposingParty) {
      await this.page.getByLabel('Opposing Party').fill(data.opposingParty);
    }
    if (data.courtName) {
      await this.page.getByLabel('Court Name').fill(data.courtName);
    }
    if (data.judge) {
      await this.page.getByLabel('Judge').fill(data.judge);
    }
    if (data.description) {
      await this.page.getByLabel('Description').fill(data.description);
    }
    if (data.status) {
      await this.page.getByLabel('Status').selectOption(data.status);
    }
    if (data.priority) {
      await this.page.getByLabel('Priority').selectOption(data.priority);
    }
    if (data.practiceArea) {
      await this.page.getByLabel('Practice Area').selectOption(data.practiceArea);
    }
  }

  async submitMatterForm() {
    await this.page.getByRole('button', { name: 'Save Matter' }).click();
  }

  getMatterCard(caseNumber: string): Locator {
    return this.page.getByTestId(`matter-card-${caseNumber}`);
  }

  async applyFilter(filterType: string, value: string) {
    await this.filterButton.click();
    await this.page.getByTestId(`filter-${filterType}`).selectOption(value);
    await this.page.getByRole('button', { name: 'Apply Filters' }).click();
  }

  async clearFilters() {
    await this.filterButton.click();
    await this.page.getByRole('button', { name: 'Clear All' }).click();
  }
}