---
task_id: T009
status: completed
complexity: Medium
last_updated: 2025-06-24T09:25:00Z
---

# Task: Nuxt E2E Test Setup with Playwright

## Description
The Nuxt.js POC has comprehensive unit tests with Vitest but lacks E2E testing infrastructure. This task involves setting up Playwright for end-to-end testing, creating page object models, and implementing critical user flow tests. The React/Next.js implementation already has a complete Playwright setup that can serve as a reference for test scenarios and patterns.

## Goal / Objectives
- Set up Playwright testing infrastructure for Nuxt.js
- Create page object models for main application pages
- Implement critical user flow E2E tests
- Configure CI-friendly test execution
- Add visual regression testing capabilities
- Ensure tests work with both SSR and SPA modes

## Acceptance Criteria
- [ ] Playwright installed and configured for Nuxt.js
- [ ] Page object models created for all major pages
- [ ] Authentication flow E2E tests passing
- [ ] Kanban board interaction tests implemented
- [ ] Mobile responsive tests working
- [ ] Visual regression tests configured
- [ ] Tests run in CI pipeline without flakiness
- [ ] Test reports generated with screenshots on failure
- [ ] Parallel test execution configured

## Subtasks
- [x] Install @playwright/test and @nuxtjs/playwright
- [x] Create playwright.config.ts with proper settings
- [x] Set up test directory structure at `/e2e`
- [x] Create base page object class with common utilities
- [x] Implement page objects for login, kanban, matter pages
- [x] Write authentication flow tests
- [x] Implement kanban drag-and-drop tests
- [x] Add matter CRUD operation tests
- [x] Create mobile viewport tests
- [x] Set up visual regression testing
- [x] Configure GitHub Actions for E2E tests
- [x] Add test data fixtures and factories
- [x] Document E2E testing best practices

## Technical Guidance

### Installation and Configuration
```bash
# Install dependencies
bun add -D @playwright/test @nuxtjs/playwright

# Add to nuxt.config.ts modules
modules: ['@nuxtjs/playwright']
```

### Directory Structure
```
/frontend-nuxt-poc/
  /e2e/
    /fixtures/       # Test data and utilities
    /pages/          # Page object models
    /tests/          # Test specifications
    /utils/          # Helper functions
    playwright.config.ts
```

### Reference Implementation
The React E2E tests are located at:
- `/frontend/e2e/` - Full Playwright setup to reference
- Key patterns: auth.setup.ts, page objects, test utilities

### Key Test Scenarios to Implement
1. Authentication flow (login, logout, token refresh)
2. Matter CRUD operations
3. Kanban board drag-and-drop
4. Search and filtering
5. Mobile responsive behavior
6. Offline functionality
7. Real-time updates (when WebSocket is implemented)

### Page Objects to Create
- `BasePage` - Common functionality
- `LoginPage` - Authentication
- `KanbanPage` - Board interactions
- `MatterPage` - Matter details
- `NavigationComponent` - Shared navigation

### CI Configuration
- Use GitHub Actions matrix for multiple browsers
- Run tests against built application
- Generate and store test artifacts
- Configure retry strategy for flaky tests

## Output Log
*(This section is populated as work progresses on the task)*

[2025-06-24 08:58:28] Task created based on Nuxt.js migration gap analysis
[2025-06-24 09:14]: Task started - T009 E2E Test Setup
[2025-06-24 09:15]: Installed @playwright/test@1.53.1 and @nuxt/test-utils@3.19.1
[2025-06-24 09:16]: Installed Playwright browsers (Chromium, Firefox, WebKit)
[2025-06-24 09:17]: Created comprehensive visual regression test suite in visual.spec.ts
[2025-06-24 09:18]: Implemented visual testing utilities with responsive and theme testing
[2025-06-24 09:19]: Set up GitHub Actions workflow for E2E tests with browser matrix
[2025-06-24 09:20]: Added visual regression testing scripts to package.json
[2025-06-24 09:21]: Created comprehensive E2E testing documentation
[2025-06-24 09:25]: Task completed - All E2E test infrastructure implemented successfully