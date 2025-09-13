# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: Kotlin 21 + Spring Boot monolith (Spring Modulith). Source in `src/main/kotlin`, tests in `src/test/kotlin`. Profiles and resources in `src/main/resources`.
- `frontend/`: Nuxt 4 + Vue 3 + TypeScript. App code in `app/`, tests in `test/`, public assets in `public/`.
- `docs/`: Architecture and developer docs. `infrastructure/`, `config/`, `scripts/` hold infra and helper files.

## Build, Test, and Development Commands
- Backend
  - `cd backend && ./gradlew bootRun`: Run API locally (http://localhost:8080).
  - `./gradlew build`: Build JAR and run checks.
  - `./gradlew test | unitTest | integrationTest | e2eTest`: Run JUnit5/Kotest tests by tag.
  - `./gradlew jacocoTestReport`: Generate coverage report.
- Frontend
  - `cd frontend && bun install && bun run dev`: Start Nuxt dev server (http://localhost:3000). Use `npm run …` if preferred.
  - `bun run build` and `bun run preview`: Production build and local preview.
  - `bun run test` / `bun run test:coverage`: Unit tests (Vitest).
  - `bun run lint` / `bun run typecheck`: Linting and TS type checks.
  - API types: `bun run openapi:all` (ensure backend is running; generates `app/types/api.d.ts`).

## Coding Style & Naming Conventions
- Frontend: ESLint + Prettier enforced. 2‑space indent, TypeScript. Components `PascalCase.vue`, composables `useX.ts`, stores follow Pinia conventions. Keep files co-located with features in `app/`.
- Backend: Kotlin style (4‑space indent). Package root `com.astarworks.astarmanagement`. Tests named `*Test.kt`. Prefer constructor injection and data classes.

## Testing Guidelines
- Backend: JUnit5 + Kotest. Tag tests with `@Tag("unit"|"integration"|"e2e")` to use Gradle tasks above. Integration tests use Testcontainers PostgreSQL; avoid external dependencies.
- Frontend: Vitest with `happy-dom`; setup in `frontend/test/setup.ts`. Place specs as `*.spec.ts`/`*.test.ts`. Add Storybook stories for UI where helpful.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (e.g., `feat(auth): add JWT guard`, `refactor: simplify table module`). Keep scope small and messages imperative.
- PRs: Clear description, linked issues, screenshots/GIFs for UI, tests added/updated, docs updated (`docs/` or `README.md`) when APIs change. Ensure CI is green and no secrets are committed; use `.env.example`.

## Security & Configuration Tips
- Do not commit `.env.*` or secrets. Use `.env.example` and Spring profiles (`-Dspring.profiles.active=dev`).
- Regenerate OpenAPI after backend changes (`openapi:all`) to keep the frontend client in sync.
