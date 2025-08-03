# Task Completion Checklist

## When Completing a Frontend Task

1. **Code Quality Checks**
   ```bash
   cd frontend
   bun run typecheck    # Ensure no TypeScript errors
   bun run lint         # Fix linting issues
   bun run test         # Ensure all tests pass
   ```

2. **Component Development**
   - Create Storybook stories for new components
   - Add proper TypeScript types (no `any`)
   - Use i18n for all user-facing text (`$t('key')`)
   - Follow Vue 3 Composition API patterns

3. **Pre-commit Verification**
   ```bash
   cd frontend
   bun run precommit    # Runs typecheck + test + lint
   ```

## When Completing a Backend Task

1. **Code Quality Checks**
   ```bash
   cd backend
   ./gradlew test       # Run tests
   ./gradlew detekt     # Kotlin code analysis
   ./gradlew build      # Ensure build succeeds
   ```

2. **Security Considerations**
   - Implement tenant isolation for data operations
   - Add audit logging for sensitive operations
   - Never expose secrets or keys
   - Use proper error handling

## General Task Completion

1. **Documentation**
   - Update relevant documentation if needed
   - Add code comments only if explicitly requested
   - Ensure API changes are documented

2. **Testing**
   - Write/update unit tests for new functionality
   - Run integration tests if applicable
   - Verify E2E tests still pass

3. **Git Workflow**
   - Stage changes: `git add .`
   - Create meaningful commit messages
   - Follow conventional commit format
   - Only commit when explicitly asked by user

## Critical Reminders

- **NEVER use `any` type in TypeScript**
- **ALWAYS use i18n for user-facing text**
- **ALWAYS run linting and type checking**
- **NEVER commit unless explicitly requested**
- **ALWAYS verify tests pass before marking task complete**