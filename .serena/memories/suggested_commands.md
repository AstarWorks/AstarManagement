# Suggested Development Commands

## Frontend Development Commands

### Development Server
```bash
cd frontend
bun run dev          # Start Nuxt development server
```

### Testing
```bash
cd frontend
bun run test         # Run unit tests with Vitest
bun run test:ui      # Run tests with UI interface
bun run test:coverage # Run tests with coverage report
bun run test:e2e     # Run E2E tests with Playwright
```

### Code Quality
```bash
cd frontend
bun run typecheck    # TypeScript type checking
bun run lint         # Run ESLint and auto-fix issues
bun run lint:check   # Run ESLint without auto-fix
```

### Build & Preview
```bash
cd frontend
bun run build        # Build for production
bun run preview      # Preview production build
bun run generate     # Generate static site
```

### Storybook
```bash
cd frontend
bun run storybook    # Start Storybook dev server
bun run build-storybook # Build Storybook for deployment
```

### Pre-commit Check
```bash
cd frontend
bun run precommit    # Run typecheck + test + lint
```

## Backend Development Commands

### Development Server
```bash
cd backend
./gradlew bootRun    # Start Spring Boot application
```

### Testing
```bash
cd backend
./gradlew test       # Run all tests
./gradlew test --tests "dev.ryuzu.astarmanagement.*" # Run specific tests
```

### Build
```bash
cd backend
./gradlew build      # Build the application
./gradlew clean build # Clean and build
```

### Code Quality
```bash
cd backend
./gradlew detekt     # Run Kotlin code analysis
./gradlew spotbugsMain # Run SpotBugs analysis
./gradlew dependencyCheckAnalyze # Check for vulnerable dependencies
```

## Docker Commands

### Stage 1 Development
```bash
docker-compose -f docker-compose.stage1.yml up    # Start all services
docker-compose -f docker-compose.stage1.yml down  # Stop all services
```

## Git Commands (Linux System)
```bash
git status           # Check repository status
git add .            # Stage all changes
git commit -m "message" # Commit changes
git push             # Push to remote
git pull             # Pull from remote
```

## System Utilities (Linux)
```bash
ls -la               # List files with details
cd <directory>       # Change directory
grep -r "pattern" .  # Search for pattern recursively
find . -name "*.ts"  # Find files by name pattern
```

## Important Notes
- Always run `bun run typecheck` after TypeScript changes
- Always run `bun run test` after code changes
- Create Storybook stories for new components
- Use `bun run precommit` before committing changes