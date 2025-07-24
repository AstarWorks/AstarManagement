# 🏗️ CLAUDE.md - Claude Code Global Configuration

This file provides guidance to Claude Code (claude.ai/code) when working across all projects.

## 📋 Project Overview

**Aster Management - 法律事務所向け業務管理システム**
- 対象: 小中規模法律事務所（1-10名）のDX実現
- YOU MUST READ: @.simone/01_PROJECT_DOCS/ARCHITECTURE.md
- YOU MUST READ: @docs/developer-guide/DEVELOPMENT_ENVIRONMENT_SETUP.md

### 🎯 Project Mission
**解決する4つのコア課題**:
1. **情報の分散と重複入力** - 一元管理による効率化
2. **非効率な書類管理** - デジタル化とAI活用
3. **案件進捗の可視化不足** - カンバン形式での直感的管理  
4. **複雑な報酬・会計管理** - 自動化と見える化

### 🏗️ Architecture Principles
- **Agent-Native Design**: AI agentと人間の協調作業を前提
- **CLI/GUI Parity**: 全GUI操作にCLI版を用意（AI実行可能）
- **クリーンアーキテクチャ**: ドメイン駆動設計
- **段階的スケーリング**: MVPから本格運用まで

## 🧠 Proactive AI Assistance

### YOU MUST: Always Suggest Improvements
**Every interaction should include proactive suggestions to save engineer time**

1. **Pattern Recognition**
    - Identify repeated code patterns and suggest abstractions
    - Detect potential performance bottlenecks before they matter
    - Recognize missing error handling and suggest additions
    - Spot opportunities for parallelization or caching

2. **Code Quality Improvements**
    - Suggest more idiomatic approaches for the language
    - Recommend better library choices based on project needs
    - Propose architectural improvements when patterns emerge
    - Identify technical debt and suggest refactoring plans

3. **Time-Saving Automations**
    - Create scripts for repetitive tasks observed
    - Generate boilerplate code with full documentation
    - Set up GitHub Actions for common workflows
    - Build custom CLI tools for project-specific needs

4. **Documentation Generation**
    - Auto-generate comprehensive documentation (rustdoc, JSDoc, godoc, docstrings)
    - Create API documentation from code
    - Generate README sections automatically
    - Maintain architecture decision records (ADRs)

### Proactive Suggestion Format
```
💡 **Improvement Suggestion**: [Brief title]
**Time saved**: ~X minutes per occurrence
**Implementation**: [Quick command or code snippet]
**Benefits**: [Why this improves the codebase]
```

## 🎯 Development Philosophy

### Core Principles
- **Engineer time is precious** - Automate everything possible
- **Quality without bureaucracy** - Smart defaults over process
- **Proactive assistance** - Suggest improvements before asked
- **Self-documenting code** - Generate docs automatically
- **Continuous improvement** - Learn from patterns and optimize

### Test-Driven Development (TDD)

- Follow the principles of Test-Driven Development (TDD) as a default approach.
- Begin by writing tests based on the expected input and output.
- Do not write any implementation code at this stage—only the tests.
- Run the tests and confirm that they fail as expected.
- Once test correctness is confirmed, commit the failing tests.
- Then, begin implementing the code to make the tests pass.
- During implementation, do not modify the tests—focus solely on fixing the code.
- Repeat this process until all tests pass.

## 📚 AI Assistant Guidelines

### Efficient Professional Workflow
**Smart Explore-Plan-Code-Commit with time-saving automation**

#### 1. EXPLORE Phase (Automated)
- **Use AI to quickly scan and summarize codebase**
- **Auto-identify dependencies and impact areas**
- **Generate dependency graphs automatically**
- **Present findings concisely with actionable insights**

#### 2. PLAN Phase (AI-Assisted)
- **Generate multiple implementation approaches**
- **Auto-create test scenarios from requirements**
- **Predict potential issues using pattern analysis**
- **Provide time estimates for each approach**

#### 3. CODE Phase (Accelerated)
- **Generate boilerplate with full documentation**
- **Auto-complete repetitive patterns**
- **Real-time error detection and fixes**
- **Parallel implementation of independent components**
- **Auto-generate comprehensive comments explaining complex logic**

#### 4. COMMIT Phase (Automated)
```bash
# Aster Management specific quality checks
cd frontend
bun run typecheck    # TypeScript compilation check
bun run test         # Unit tests (Vitest)
bun run lint         # ESLint + Prettier
bun run build-storybook  # Storybook build verification

cd ../backend
./gradlew ktlintCheck    # Kotlin code style
./gradlew test          # Unit tests (JUnit 5)
./gradlew integrationTest  # Integration tests
```

### Documentation & Code Quality Requirements
- **YOU MUST: Generate comprehensive documentation for every function**
- **YOU MUST: Add clear comments explaining business logic**
- **YOU MUST: Create examples in documentation**
- **YOU MUST: Auto-fix all linting/formatting issues**
- **YOU MUST: Generate unit tests for new code**

### Aster Management Specific Rules

#### 🎨 Frontend Development (Nuxt.js + Vue 3)
- **Component Structure**: shadcn-vue + Radix Vue for UI components
- **State Management**: Pinia with persistence for offline capability
- **Form Validation**: VeeValidate + Zod for runtime type safety
- **Testing**: Vitest + Storybook for component development
- **Icons**: Lucide Vue Next exclusively
- **Package Manager**: Bun for faster development cycles

#### ⚙️ Backend Development (Spring Boot + Kotlin)
- **Architecture**: Clean Architecture (Domain → Application → Infrastructure → Presentation)
- **Database**: PostgreSQL 15 with Flyway migrations
- **Security**: Spring Security with JWT + 2FA mandatory
- **API Documentation**: SpringDoc OpenAPI (Swagger)
- **Testing**: JUnit 5 + Testcontainers + MockK

#### 🔐 Legal Domain Specific Requirements
- **Data Security**: 弁護士・依頼者間の秘匿特権を保護
- **Audit Trail**: 全データアクセスのログ記録必須
- **Multi-tenancy**: Row Level Security (RLS) with subdomain isolation
- **RBAC**: Discord-style permissions (Permission + Scope + Role)

## 🐚 Bash Development

### Core Rules
- **Shebang**: Always `#!/usr/bin/env bash`
- **Set Options**: Use `set -euo pipefail`
- **Quoting**: Always quote variables `"${var}"`
- **Functions**: Use local variables

### Best Practices
```bash
#!/usr/bin/env bash
set -euo pipefail

# Global variables in UPPERCASE
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"

# Function documentation
# Usage: function_name <arg1> <arg2>
# Description: What this function does
# Returns: 0 on success, 1 on error
function_name() {
    local arg1="${1:?Error: arg1 required}"
    local arg2="${2:-default}"
    
    # Implementation
}

# Error handling
trap 'echo "Error on line $LINENO"' ERR
```

## 🚫 Security and Quality Standards

### NEVER Rules (Non-negotiable)
**⚠️ Critical Security & Quality Rules**
- **NEVER: Delete production data without explicit confirmation**
- **NEVER: Hardcode API keys, passwords, or secrets**
- **NEVER: Commit code with failing tests or linting errors**
- **NEVER: Push directly to main/master branch**
- **NEVER: Skip security reviews for authentication/authorization code**
- **NEVER: Use `any` type in TypeScript production code**
- **NEVER: Manually write shadcn-vue components - always use CLI generation**
- **NEVER: Manually edit package.json dependencies - always use package manager commands**
- **NEVER: Add non-existent library versions to package.json**

**🏛️ Legal Domain Specific NEVER Rules**
- **NEVER: Allow cross-tenant data access without explicit permission**
- **NEVER: Store client data without encryption at rest**
- **NEVER: Skip audit logging for sensitive operations**
- **NEVER: Allow unauthenticated access to any case/client data**
- **NEVER: Use npm/yarn - always use Bun for frontend**
- **NEVER: Create components without Storybook stories**
- **NEVER: Implement features without corresponding API documentation**

**🧪 Testing & Quality NEVER Rules**
- **NEVER: Commit without running typecheck and tests**
- **NEVER: Merge PRs with broken Storybook builds**
- **NEVER: Skip any of the 4-stage testing process (Storybook → Mock → Local DB → Production)**
- **NEVER: Create TypeScript `any` types - always define proper interfaces**

### YOU MUST Rules (Required Standards)
**🔧 General Development Rules**
- **YOU MUST: Write tests for new features and bug fixes**
- **YOU MUST: Run CI/CD checks before marking tasks complete**
- **YOU MUST: Follow semantic versioning for releases**
- **YOU MUST: Document breaking changes**
- **YOU MUST: Use feature branches for all development**
- **YOU MUST: Add comprehensive documentation to all public APIs**

**⚖️ Aster Management Specific YOU MUST Rules**
- **YOU MUST: Follow dialogue-based design approach for all new features**
- **YOU MUST: Reference existing design documents before implementing**
- **YOU MUST: Implement tenant isolation (Row Level Security) for all data operations**
- **YOU MUST: Add audit logging for create/update/delete operations**
- **YOU MUST: Use TypeScript interfaces from existing design documents**
- **YOU MUST: Test multi-tenant scenarios in integration tests**
- **YOU MUST: Follow Clean Architecture layers strictly**
- **YOU MUST: Use Conventional Commits with legal domain scopes (case, client, document, invoice)**

**🎨 Component Development YOU MUST Rules**  
- **YOU MUST: Create Storybook stories BEFORE implementing components**
- **YOU MUST: Test components in 4 environments: Storybook → Mock → Local DB → Production**
- **YOU MUST: Run `bun run typecheck` after ANY TypeScript changes**
- **YOU MUST: Run `bun run test` after ANY code changes**
- **YOU MUST: Ensure Storybook builds and renders correctly before any commit**


## 🤖 AI-Powered Code Review

### Continuous Analysis
**AI should continuously analyze code and suggest improvements**

🔍 Code Analysis Results:
- Performance: Found 3 optimization opportunities
- Security: No issues detected
- Maintainability: Suggest extracting 2 methods
- Test Coverage: 85% → Suggest 3 additional test cases
- Documentation: 2 functions missing proper docs


## 🔧 Commit Standards

### Conventional Commits
```bash
# Format: <type>(<scope>): <subject>
git commit -m "feat(auth): add JWT token refresh"
git commit -m "fix(api): handle null response correctly"
git commit -m "docs(readme): update installation steps"
git commit -m "perf(db): optimize query performance"
git commit -m "refactor(core): extract validation logic"
```

### Aster Management Commit Examples
```bash
# Legal domain specific scopes
feat(case): add case status transition validation
fix(client): resolve tenant isolation in client search  
docs(invoice): update invoice template API documentation
test(auth): add 2FA integration tests
refactor(domain): extract case validation to domain service

# Component/technical scopes
feat(ui): implement case kanban board with drag-drop
fix(api): handle null values in client data serialization
perf(search): optimize Elasticsearch query for large case datasets
```

### Commit Trailers
```bash
# For user feedback incorporation
git commit --trailer "Based-on-feedback: Client meeting 2024-01-15"

# For design document references
git commit --trailer "Refs: docs/developer-guide/CASE_MANAGEMENT_SCREEN_DESIGN.md"

# For GitHub issues
git commit --trailer "Github-Issue: #123"
```

### PR Guidelines
- Focus on high-level problem and solution
- Never mention tools used (no co-authored-by)
- Reference specific design documents that guided implementation
- Include legal domain impact if relevant (data access, tenant isolation, etc.)
- Add security review notes for authentication/authorization changes

## 🏛️ Legal Domain Implementation Checklist

### Before Starting Any Feature
- [ ] Read relevant design document from `docs/developer-guide/`
- [ ] Confirm tenant isolation requirements
- [ ] Identify audit logging needs  
- [ ] Check existing TypeScript interfaces
- [ ] Plan TDD approach with domain-specific test cases

### Storybook-First Development Process
**Stage 1: Storybook Development**
- [ ] Create `.stories.ts` file with component variants
- [ ] Define mock data that represents real legal scenarios
- [ ] Test component in isolation with different props
- [ ] Verify responsive design and accessibility
- [ ] Run `bun run storybook` to ensure stories render correctly

**Stage 2: Mock Data Testing**
- [ ] Create mock API responses using realistic legal data
- [ ] Test component with MSW (Mock Service Worker)  
- [ ] Verify error states and loading states
- [ ] Run `bun run typecheck` and `bun run test`

**Stage 3: Local Database Testing**
- [ ] Test with real local PostgreSQL data
- [ ] Verify tenant isolation works correctly
- [ ] Test with large datasets (1000+ cases/clients)
- [ ] Check audit logging functions properly

**Stage 4: Production-like Testing**
- [ ] Test in staging environment with production data structure
- [ ] Verify performance meets targets (< 300ms case loading)
- [ ] Test cross-browser compatibility
- [ ] Validate with legal professionals for UX

### Before Commit (MANDATORY)
- [ ] **Run `bun run typecheck`** - TypeScript compilation must pass
- [ ] **Run `bun run test`** - All tests must pass
- [ ] **Run `bun run build-storybook`** - Storybook must build successfully
- [ ] Run full test suite including integration tests
- [ ] Verify tenant isolation works correctly
- [ ] Check audit logs are generated properly
- [ ] Ensure no hardcoded secrets or test data
- [ ] Update relevant design documents if behavior changed

## 🚀 Performance & Scalability Targets

### Response Time Goals
- **API Endpoints**: p95 < 200ms
- **PDF Processing**: < 1 second first paint  
- **Search Results**: < 500ms (Elasticsearch)
- **File Upload**: Progress feedback every 100ms

### Legal Domain Specific Performance
- **Case List Loading**: < 300ms for 1000 cases
- **Document Search**: < 200ms across 10k documents
- **Tenant Data Isolation**: No performance impact over single-tenant
- **Audit Log Writing**: Async, non-blocking

Remember: **Engineer time is gold** - Automate everything, document comprehensively, proactively suggest improvements, and maintain the legal domain's strict security and compliance requirements. Every interaction should save time while ensuring data protection and tenant isolation.

## Activity Logging

You have access to the `mcp__simone__log_activity` tool. Use it to record your activities after every activity that is relevant for the project. This helps track development progress and understand what has been done.