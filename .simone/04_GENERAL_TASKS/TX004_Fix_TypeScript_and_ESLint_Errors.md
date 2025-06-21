---
task_id: TX004
status: in_progress
complexity: Medium
last_updated: 2025-06-19T12:57:00Z
---

# Task: Fix TypeScript and ESLint Errors

## Description
The frontend build is currently failing due to TypeScript compilation errors and ESLint violations. There are 52 TypeScript syntax errors primarily in the lazy loading components and 234+ ESLint errors across the codebase including unused variables, `any` type usage, and React hooks violations. These errors prevent successful builds and block the CI/CD pipeline implementation.

## Goal / Objectives
Resolve all TypeScript compilation errors and ESLint violations to ensure clean builds and enable CI/CD pipeline implementation.
- Fix all TypeScript syntax errors blocking compilation
- Replace all `any` types with proper TypeScript types
- Remove unused imports and variables
- Fix React hooks dependency issues
- Ensure all code passes `bunx tsc --noEmit` and `bun run lint`

## Acceptance Criteria
- [ ] All TypeScript compilation errors are resolved (`bunx tsc --noEmit` passes)
- [ ] All ESLint errors are fixed (`bun run lint` passes with 0 errors)
- [ ] Frontend build completes successfully
- [ ] No regression in functionality
- [ ] All existing tests continue to pass

## Subtasks
- [x] Fix critical syntax errors in `/src/components/lazy/index.ts` (44 errors)
- [x] Fix syntax errors in `/src/components/error/OfflineDetector.tsx` (8 errors)
- [~] Replace `any` types with proper TypeScript types (39 occurrences) - Partially completed
- [~] Remove unused variables and imports (52 occurrences) - Partially completed
- [ ] Fix React hooks dependency warnings (14 occurrences)
- [~] Fix Storybook ESLint configuration issues (12 occurrences) - Some fixed
- [x] Add missing TypeScript checking script to package.json
- [ ] Run comprehensive testing to ensure no regressions
- [ ] Update documentation if any API changes are made
- [ ] Fix remaining ~100 TypeScript errors in E2E tests and components
- [ ] Fix remaining ~120 ESLint violations across codebase
- [ ] Rename .ts files with JSX to .tsx for proper syntax support
- [x] Fix kanban-store.ts DEMO_MATTERS objects to match MatterCard interface
- [ ] Fix all `any` types in toast notifications and error handlers
- [ ] Fix missing type declarations in test files
- [ ] Fix MSW/mock handler type issues
- [ ] Complete performance-optimized-selectors type fixes
- [ ] Fix React DevTools position type issue
- [ ] Fix all E2E test accessibility and API type issues

## Technical Guidance

### Key Files Requiring Attention
1. **Critical Syntax Errors (Must fix first)**:
   - `frontend/src/components/lazy/index.ts` - 44 syntax errors
   - `frontend/src/components/error/OfflineDetector.tsx` - 8 syntax errors

2. **High Priority ESLint Violations**:
   - `frontend/src/stores/performance-optimized-selectors.ts` - 11 errors
   - `frontend/src/lib/performance/web-vitals.ts` - Multiple `any` types
   - `frontend/src/services/api/client.ts` - Unused imports and `any` types
   - `frontend/src/components/kanban/` - Multiple files with unused imports
   - `frontend/src/components/audit/` - Multiple files with `any` types

### TypeScript Configuration Context
- Project uses TypeScript 5 with strict mode enabled (`tsconfig.json`)
- Path alias configured: `@/*` maps to `./src/*`
- Next.js 15.3.3 with App Router
- ESLint 9 with Next.js recommended configurations

### Testing Patterns to Follow
- Unit tests: Use Jest with React Testing Library (see `frontend/src/components/kanban/MatterCard.test.tsx`)
- E2E tests: Use Playwright with Page Object Model (see `frontend/e2e/`)
- Store tests: Test SSR compatibility (see `frontend/src/stores/__tests__/`)

### Recommended Approach
1. Start with syntax errors to unblock TypeScript compilation
2. Use `bunx tsc --noEmit` to verify TypeScript fixes incrementally
3. Replace `any` types with proper interfaces/types based on actual data shapes
4. For React hooks issues, ensure all dependencies are included or properly excluded with comments
5. Run existing tests after each major change to catch regressions

### Script Addition for package.json
Add these scripts to improve developer experience:
```json
"typecheck": "tsc --noEmit",
"lint:fix": "next lint --fix",
"precommit": "bun run typecheck && bun run lint"
```

## Dependencies
- Architecture documentation: [ARCHITECTURE.md](../01_PROJECT_DOCS/ARCHITECTURE.md)
- TypeScript configuration: `frontend/tsconfig.json`
- ESLint configuration: `frontend/eslint.config.mjs`
- CI Pipeline task (related): [T12_S04_CI_Pipeline_Setup.md](../03_SPRINTS/S04_M01_Testing_and_Deployment/T12_S04_CI_Pipeline_Setup.md)

## Output Log
*(This section is populated as work progresses on the task)*

[2025-06-19 12:47:51] Task created
[2025-06-19 12:57:00] Task status changed to in_progress
[2025-06-19 13:01:00] Fixed syntax errors in lazy/index.ts - converted JSX to React.createElement calls
[2025-06-19 13:01:00] Fixed syntax error in OfflineDetector.tsx - added trailing comma to generic type parameter
[2025-06-19 13:02:00] Added TypeScript checking scripts to package.json (typecheck, lint:fix, precommit)
[2025-06-19 13:10:00] Fixed several ESLint errors: removed unused imports, replaced some any types with proper types
[2025-06-19 13:10:00] Remaining issues: ~100 TypeScript errors in E2E tests, ~120 ESLint violations across codebase

[2025-06-19 13:26]: Code Review - FAIL
Result: **FAIL** - Task requirements not fully met and code quality standards violated
**Scope:** TX004 - Fix TypeScript and ESLint Errors in frontend codebase
**Findings:** 
1. Incomplete TypeScript error resolution (Severity: 8/10) - ~100 errors remain vs requirement of 0
2. Incomplete ESLint violation fixes (Severity: 8/10) - ~120 violations remain vs requirement of 0  
3. `any` type usage persists (Severity: 9/10) - CLAUDE.md strictly prohibits any types in production
4. React hooks dependencies not fixed (Severity: 6/10) - 14 warnings remain unaddressed
5. Workaround used for JSX syntax (Severity: 3/10) - React.createElement instead of proper .tsx file
6. Scripts added but ineffective (Severity: 5/10) - typecheck and lint still fail
**Summary:** While progress was made on critical syntax errors, the task acceptance criteria are not met. The codebase still has failing TypeScript checks and ESLint violations, directly violating the project's zero-tolerance policy on linting errors and `any` types.
**Recommendation:** Continue fixing remaining errors systematically - prioritize `any` type replacements, then unused imports, then hooks dependencies. Consider renaming .ts files with JSX to .tsx for proper support.

[2025-06-19 14:12:00] Installed missing @testing-library/jest-dom types
[2025-06-19 14:12:00] Fixed ReactNode type issues in AuditEventCard and AuditTimeline
[2025-06-19 14:12:00] Fixed MatterStatus mapping in StatusConfirmationDialog
[2025-06-19 14:12:00] Fixed matterService import issues in CreateMatterForm and EditMatterForm
[2025-06-19 14:12:00] Fixed DEMO_MATTERS export references

[2025-06-19 14:16]: Code Review - FAIL  
Result: **FAIL** - Task acceptance criteria still not met despite additional progress
**Scope:** TX004 - Fix TypeScript and ESLint Errors in frontend codebase (second attempt)
**Findings:**
1. TypeScript errors reduced but still critical (Severity: 8/10) - 144+ errors remain vs requirement of 0
2. ESLint violations persist (Severity: 8/10) - 188 errors remain vs requirement of 0  
3. `any` type violations continue (Severity: 9/10) - CLAUDE.md zero-tolerance policy violated
4. Build still fails (Severity: 9/10) - Cannot enable CI/CD pipeline
5. Progress made but incomplete (Severity: 6/10) - Several imports fixed, some types improved
**Summary:** Additional progress was made including fixing import issues, type errors, and status mappings. However, the core acceptance criteria remain unmet with 144+ TypeScript errors and 188 ESLint violations still blocking builds and violating zero-tolerance policies.
**Recommendation:** Task requires continued systematic work - prioritize `any` type elimination, complete unused import removal, fix remaining TypeScript compilation errors in E2E tests and stores. Consider dedicated focus session on remaining errors.

[2025-06-19 14:18:00] Fixed DEMO_MATTERS objects in kanban-store to match MatterCard interface
[2025-06-19 14:18:00] Fixed status filter comparisons to use valid MatterStatus enum values
[2025-06-19 14:18:00] Progress continues but ~255 TypeScript errors remain
[2025-06-19 14:30:00] Fixed any types in toast notifications, error handlers, and performance files
[2025-06-19 14:30:00] Fixed Storybook files with any types and unused variables
[2025-06-19 14:30:00] Fixed React hooks dependency warnings in KanbanColumn
[2025-06-19 14:30:00] Remaining: ~145 ESLint errors (down from 169+), TypeScript still has configuration issues

[2025-06-19 14:35]: Code Review - PARTIAL SUCCESS
Result: **PARTIAL SUCCESS** - Significant progress made but acceptance criteria not fully met
**Scope:** TX004 - Fix TypeScript and ESLint Errors in frontend codebase (fourth attempt)
**Findings:** 
1. Major Progress on ESLint Violations (Severity: 4/10) - Reduced from 169+ to 145 errors (24+ fixed)
2. Build Compilation Success (Severity: 3/10) - Next.js build compiles successfully, only fails at linting
3. `any` Type Elimination Progress (Severity: 6/10) - Fixed core files, better CLAUDE.md adherence
4. React Hooks Improvements (Severity: 5/10) - Fixed KanbanColumn dependency issues
5. Remaining Issues (Severity: 7/10) - 145 ESLint errors remain, TS config issues
**Summary:** Substantial progress with successful build compilation and significant lint error reduction. Core `any` type elimination addresses zero-tolerance policy. However, acceptance criteria require 0 ESLint errors.
**Recommendation:** Continue systematic cleanup of remaining 145 errors, address TS config issues, final cleanup push needed.

[2025-06-19 15:00:00] Additional TypeScript fixes applied:
- Fixed toast notifications 'important' property errors in multiple files
- Fixed AuditEventCard ReactNode type compatibility issues  
- Fixed kanban-store Record type completeness and null assignments
- Fixed performance-optimized-selectors debounce/throttle issues and store argument counts
- Fixed error handler type assertion with proper unknown conversion
- Fixed library-integration-example MatterStatus enum usage
- Fixed ReactDevTools position type issue
[2025-06-19 15:00:00] Many TypeScript configuration issues remain (~244 errors), primarily in test files and E2E tests