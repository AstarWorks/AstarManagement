/**
 * Page Object for Matter detail page
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MatterDetailPage extends BasePage {
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly statusChangeButton: Locator;
  readonly documentsTab: Locator;
  readonly financialsTab: Locator;
  readonly clientTab: Locator;
  readonly historyTab: Locator;
  private matterId: string;

  constructor(page: Page, matterId: string) {
    super(page);
    this.matterId = matterId;
    this.editButton = page.getByRole('button', { name: 'Edit Matter' });
    this.deleteButton = page.getByRole('button', { name: 'Delete Matter' });
    this.statusChangeButton = page.getByRole('button', { name: 'Change Status' });
    this.documentsTab = page.getByRole('tab', { name: 'Documents' });
    this.financialsTab = page.getByRole('tab', { name: 'Financials' });
    this.clientTab = page.getByRole('tab', { name: 'Client' });
    this.historyTab = page.getByRole('tab', { name: 'History' });
  }

  async goto() {
    await this.page.goto(`/matters/${this.matterId}`);
    await this.waitForPageLoad();
  }

  async clickEdit() {
    await this.editButton.click();
    await this.page.waitForURL(`/matters/${this.matterId}/edit`);
  }

  async clickDelete() {
    await this.deleteButton.click();
    // Wait for confirmation dialog
    await this.page.waitForSelector('[role="dialog"]');
  }

  async clickTab(tabName: 'documents' | 'financials' | 'client' | 'history') {
    const tabs = {
      documents: this.documentsTab,
      financials: this.financialsTab,
      client: this.clientTab,
      history: this.historyTab
    };
    await tabs[tabName].click();
    await this.page.waitForTimeout(300); // Wait for tab content to load
  }

  async updateField(fieldName: string, value: string) {
    const field = this.page.getByLabel(fieldName, { exact: true });
    await field.clear();
    await field.fill(value);
  }

  async saveChanges() {
    await this.page.getByRole('button', { name: 'Save Changes' }).click();
  }

  getField(fieldName: string): Locator {
    return this.page.getByTestId(`field-${fieldName.toLowerCase()}`);
  }

  async changeStatus(newStatus: string, note?: string) {
    await this.statusChangeButton.click();
    await this.page.getByLabel('New Status').selectOption(newStatus);
    if (note) {
      await this.page.getByLabel('Transition Note').fill(note);
    }
    await this.page.getByRole('button', { name: 'Confirm Change' }).click();
  }

  async addDocument(filename: string, filePath: string) {
    await this.clickTab('documents');
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await this.page.getByRole('button', { name: 'Upload' }).click();
  }

  async addFinancialEntry(data: {
    type: 'income' | 'expense';
    amount: number;
    description: string;
    date?: string;
  }) {
    await this.clickTab('financials');
    await this.page.getByRole('button', { name: 'Add Entry' }).click();
    
    await this.page.getByLabel('Type').selectOption(data.type);
    await this.page.getByLabel('Amount').fill(data.amount.toString());
    await this.page.getByLabel('Description').fill(data.description);
    if (data.date) {
      await this.page.getByLabel('Date').fill(data.date);
    }
    
    await this.page.getByRole('button', { name: 'Save Entry' }).click();
  }
}