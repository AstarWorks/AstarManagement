import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SearchPage extends BasePage {
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly priorityFilter: Locator;
  readonly clientSearchInput: Locator;
  readonly searchButton: Locator;
  readonly clearFiltersButton: Locator;
  readonly pagination: Locator;
  readonly resultsInfo: Locator;
  readonly searchInDocuments: Locator;
  readonly searchInMemos: Locator;
  readonly searchInMatters: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder('Search matters...');
    this.statusFilter = page.getByTestId('status-filter');
    this.priorityFilter = page.getByTestId('priority-filter');
    this.clientSearchInput = page.getByTestId('client-search');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.clearFiltersButton = page.getByRole('button', { name: 'Clear filters' });
    this.pagination = page.getByTestId('pagination');
    this.resultsInfo = page.getByTestId('results-info');
    this.searchInDocuments = page.getByLabel('Search in documents');
    this.searchInMemos = page.getByLabel('Search in memos');
    this.searchInMatters = page.getByLabel('Search in matters');
  }

  async goto() {
    await this.page.goto('/search');
    await this.waitForPageLoad();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  async searchWithFilters(filters: {
    query?: string;
    status?: string | string[];
    priority?: string;
    dateRange?: { start: Date; end: Date };
    searchIn?: ('matters' | 'documents' | 'memos')[];
  }) {
    if (filters.query) {
      await this.searchInput.fill(filters.query);
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      for (const status of statuses) {
        await this.statusFilter.selectOption(status);
      }
    }

    if (filters.priority) {
      await this.priorityFilter.selectOption(filters.priority);
    }

    if (filters.dateRange) {
      await this.page.getByLabel('Start date').fill(filters.dateRange.start.toISOString().split('T')[0]);
      await this.page.getByLabel('End date').fill(filters.dateRange.end.toISOString().split('T')[0]);
    }

    if (filters.searchIn) {
      // Clear all first
      await this.searchInMatters.uncheck();
      await this.searchInDocuments.uncheck();
      await this.searchInMemos.uncheck();
      
      // Check selected
      for (const type of filters.searchIn) {
        switch (type) {
          case 'matters':
            await this.searchInMatters.check();
            break;
          case 'documents':
            await this.searchInDocuments.check();
            break;
          case 'memos':
            await this.searchInMemos.check();
            break;
        }
      }
    }

    await this.searchButton.click();
  }

  async clearAllFilters() {
    await this.clearFiltersButton.click();
  }

  getSearchResults() {
    return this.page.getByTestId('search-result');
  }

  getAutocompleteSuggestions() {
    return this.page.getByTestId('autocomplete-suggestions');
  }

  async waitForSearchResults() {
    await this.page.waitForSelector('[data-testid="search-results"]');
  }

  async goToPage(pageNumber: number) {
    await this.pagination.getByRole('button', { name: pageNumber.toString() }).click();
    await this.waitForSearchResults();
  }
}