import { test, expect } from '../fixtures/auth';
import { SearchPage } from '../pages/SearchPage';
import { TestDataManager } from '../utils/test-data';

test.describe('Advanced Search - MVP Features', () => {
  let testData: TestDataManager;
  let searchTestData: any;

  test.beforeAll(async ({ request }) => {
    testData = new TestDataManager(request);
    
    // Create diverse test data for search
    const matters = await Promise.all([
      testData.createTestMatter({
        caseNumber: '2025-CV-001',
        title: 'Contract Dispute - Software License',
        clientName: 'Tech Innovators Inc',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        tags: ['contract', 'software', 'intellectual-property']
      }),
      testData.createTestMatter({
        caseNumber: '2025-FAM-002',
        title: 'Divorce Proceedings - Asset Division',
        clientName: 'John Smith',
        status: 'WAITING_CLIENT',
        priority: 'MEDIUM',
        tags: ['family', 'divorce', 'assets']
      }),
      testData.createTestMatter({
        caseNumber: '2025-CR-003',
        title: 'Criminal Defense - White Collar',
        clientName: 'Corporate Executive',
        status: 'INITIAL_REVIEW',
        priority: 'HIGH',
        tags: ['criminal', 'white-collar', 'fraud']
      })
    ]);

    const documents = await Promise.all([
      testData.createDocument({
        matterId: matters[0].id,
        filename: 'software_license_agreement.pdf',
        content: 'This Software License Agreement governs the use of proprietary software',
        ocr: true
      }),
      testData.createDocument({
        matterId: matters[1].id,
        filename: 'prenuptial_agreement.pdf',
        content: 'Prenuptial agreement between parties regarding asset division',
        ocr: true
      })
    ]);

    searchTestData = {
      matters,
      documents
    };
  });

  test.afterAll(async () => {
    await testData.cleanupTestData();
  });

  test.describe('Multi-Criteria Search', () => {
    test('combines text search with status filter', async ({ authenticatedPage }) => {
      const searchPage = new SearchPage(authenticatedPage);
      await searchPage.goto();
      
      // Search for "contract" with IN_PROGRESS status
      await searchPage.searchWithFilters({
        query: 'contract',
        status: 'IN_PROGRESS'
      });
      
      // Should find only the software license matter
      const results = searchPage.getSearchResults();
      await expect(results).toHaveCount(1);
      await expect(results.first()).toContainText('Contract Dispute - Software License');
    });

    test('filters by multiple criteria simultaneously', async ({ authenticatedPage }) => {
      const searchPage = new SearchPage(authenticatedPage);
      await searchPage.goto();
      
      // Apply multiple filters
      await searchPage.searchWithFilters({
        priority: 'HIGH',
        status: ['IN_PROGRESS', 'INITIAL_REVIEW'],
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          end: new Date()
        }
      });
      
      // Should find high priority matters in specified statuses
      const results = searchPage.getSearchResults();
      await expect(results).toHaveCount(2);
      
      // Verify each result matches criteria
      for (const result of await results.all()) {
        await expect(result.getByTestId('priority-badge')).toContainText('HIGH');
        const status = await result.getByTestId('status-badge').textContent();
        expect(['IN_PROGRESS', 'INITIAL_REVIEW']).toContain(status);
      }
    });

    test('searches by client name with autocomplete', async ({ authenticatedPage }) => {
      const searchPage = new SearchPage(authenticatedPage);
      await searchPage.goto();
      
      // Type partial client name
      await searchPage.clientSearchInput.fill('Tech');
      
      // Autocomplete should appear
      const suggestions = searchPage.getAutocompleteSuggestions();
      await expect(suggestions).toBeVisible();
      await expect(suggestions).toContainText('Tech Innovators Inc');
      
      // Select from autocomplete
      await suggestions.getByText('Tech Innovators Inc').click();
      
      // Should filter to that client's matters
      const results = searchPage.getSearchResults();
      await expect(results).toHaveCount(1);
      await expect(results.first()).toContainText('Tech Innovators Inc');
    });

    test('applies and clears filters correctly', async ({ authenticatedPage }) => {
      const searchPage = new SearchPage(authenticatedPage);
      await searchPage.goto();
      
      // Apply filters
      await searchPage.searchWithFilters({
        query: 'contract',
        status: 'IN_PROGRESS',
        priority: 'HIGH'
      });
      
      // Verify filters applied
      await expect(searchPage.searchInput).toHaveValue('contract');
      await expect(searchPage.statusFilter).toHaveValue('IN_PROGRESS');
      await expect(searchPage.priorityFilter).toHaveValue('HIGH');
      await expect(searchPage.getSearchResults()).toHaveCount(1);
      
      // Clear all filters
      await searchPage.clearAllFilters();
      
      // Should show all matters
      await expect(searchPage.searchInput).toHaveValue('');
      await expect(searchPage.statusFilter).toHaveValue('');
      await expect(searchPage.priorityFilter).toHaveValue('');
      await expect(searchPage.getSearchResults()).toHaveCount(3);
    });
  });

  test.describe('Full-Text Search with OCR', () => {
    test('searches within OCR document content', async ({ authenticatedPage }) => {
      const searchPage = new SearchPage(authenticatedPage);
      await searchPage.goto();
      
      // Search for text within documents
      await searchPage.searchWithFilters({
        query: 'proprietary software',
        searchIn: ['documents']
      });
      
      // Should find matter with matching document
      const results = searchPage.getSearchResults();
      await expect(results).toHaveCount(1);
      await expect(results.first()).toContainText('Contract Dispute');
      
      // Should highlight matching document
      const documentMatch = results.first().getByTestId('document-match');
      await expect(documentMatch).toBeVisible();
      await expect(documentMatch).toContainText('software_license_agreement.pdf');
      await expect(documentMatch).toContainText('...proprietary software...');
    });

    test('searches across multiple content types', async ({ authenticatedPage }) => {
      const searchPage = new SearchPage(authenticatedPage);
      await searchPage.goto();
      
      // Create memo with searchable content
      await testData.createMemo({
        matterId: searchTestData.matters[0].id,
        content: 'Discussed software licensing terms with client',
        type: 'PHONE_CALL'
      });
      
      // Search across all content
      await searchPage.searchWithFilters({
        query: 'software',
        searchIn: ['matters', 'documents', 'memos']
      });
      
      // Should find matches in multiple content types
      const results = searchPage.getSearchResults();
      await expect(results).toHaveCount(await results.count());
      expect(await results.count()).toBeGreaterThan(0);
      
      // Check for different match types
      const firstResult = results.first();
      await expect(firstResult.getByTestId('match-types')).toBeVisible();
    });

    test('handles special characters and search operators', async ({ authenticatedPage }) => {
      const searchPage = new SearchPage(authenticatedPage);
      await searchPage.goto();
      
      // Test quoted search
      await searchPage.search('"Software License Agreement"');
      const exactResults = searchPage.getSearchResults();
      await expect(exactResults).toHaveCount(1);
      
      // Test case-insensitive search
      await searchPage.search('CONTRACT');
      const caseResults = searchPage.getSearchResults();
      expect(await caseResults.count()).toBeGreaterThan(0);
      
      // Test partial word search
      await searchPage.search('soft');
      const partialResults = searchPage.getSearchResults();
      expect(await partialResults.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Search Performance', () => {
    test('returns search results within 500ms', async ({ authenticatedPage }) => {
      const searchPage = new SearchPage(authenticatedPage);
      await searchPage.goto();
      
      // Measure search response time
      const startTime = Date.now();
      await searchPage.search('contract');
      await searchPage.waitForSearchResults();
      const responseTime = Date.now() - startTime;
      
      // Should respond within 500ms as per requirements
      expect(responseTime).toBeLessThan(500);
    });

    test('provides search suggestions quickly', async ({ authenticatedPage }) => {
      const searchPage = new SearchPage(authenticatedPage);
      await searchPage.goto();
      
      // Measure suggestion response time
      const startTime = Date.now();
      await searchPage.searchInput.fill('con');
      await searchPage.getAutocompleteSuggestions().waitFor({ state: 'visible' });
      const responseTime = Date.now() - startTime;
      
      // Suggestions should appear within 300ms
      expect(responseTime).toBeLessThan(300);
      
      // Should show relevant suggestions
      const suggestions = searchPage.getAutocompleteSuggestions();
      await expect(suggestions).toContainText('contract');
    });

    test('handles pagination for large result sets', async ({ authenticatedPage }) => {
      // Create many test matters
      const bulkMatters = await testData.createMultipleTestMatters(30);
      
      const searchPage = new SearchPage(authenticatedPage);
      await searchPage.goto();
      
      // Search that returns many results
      await searchPage.search('Test Matter');
      
      // Should show pagination
      await expect(searchPage.pagination).toBeVisible();
      await expect(searchPage.resultsInfo).toContainText('1-20 of');
      
      // Navigate to next page
      await searchPage.goToPage(2);
      await expect(searchPage.resultsInfo).toContainText('21-');
      
      // Results should load quickly
      const startTime = Date.now();
      await searchPage.waitForSearchResults();
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(1000);
    });
  });
});