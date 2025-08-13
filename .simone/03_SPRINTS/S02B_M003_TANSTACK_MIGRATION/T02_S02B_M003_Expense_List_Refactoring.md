---
task_id: T02_S02B_M003_Expense_List_Refactoring
sprint_id: S02B_M003_TANSTACK_MIGRATION
title: Expense List Refactoring
status: pending
assignee: unassigned
estimated_hours: 6
actual_hours: 0
start_date: null
end_date: null
---

# T02_S02B_M003: Expense List Refactoring

## Description
Replace the existing custom expense list table implementation with the new TanStackTable-based DataTable component, maintaining all current functionality while adding improved features.

## Acceptance Criteria
- [ ] Expense list page uses new DataTable component
- [ ] All existing columns displayed with proper formatting
- [ ] Date formatting matches current implementation
- [ ] Amount formatting with currency display
- [ ] Category badges/chips properly styled
- [ ] Status indicators working
- [ ] Row click navigation to detail view maintained
- [ ] Mobile responsive behavior preserved
- [ ] Virtual scrolling implemented for performance

## Technical Details
- Refactor `pages/expenses/index.vue`
- Define expense table columns using TanStackTable column definitions
- Implement custom cell renderers for:
  - Date columns (format: YYYY-MM-DD)
  - Amount columns (format: ¥1,234,567)
  - Category column (with color-coded badges)
  - Status column (with appropriate icons)
- Connect to existing Pinia expense store
- Maintain existing filter state management
- Implement row click handler for navigation

## Definition of Done
- [ ] Old table implementation completely removed
- [ ] All expense data displays correctly
- [ ] Formatting matches previous implementation
- [ ] Click interactions work as before
- [ ] No regression in functionality
- [ ] Performance improved for large datasets
- [ ] TypeScript types properly defined
- [ ] Component tested with mock data

## Notes
Ensure backward compatibility with existing features. The user should not notice any functional differences, only performance improvements. Pay special attention to Japanese currency formatting and date displays.