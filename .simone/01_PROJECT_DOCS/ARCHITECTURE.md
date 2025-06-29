
# Architecture Documentation - Aster Management

## Overview

Aster Management is a comprehensive legal case management system designed to digitize and streamline law firm operations. It addresses the challenges of scattered case files, paper-based workflows, and limited remote work capabilities by providing a centralized, AI-powered platform for case management, document processing, and client communication.

## Core Business Objectives

- **Centralized Data Management**: Unify cases, documents, accounting, and communication history with AI-powered search
- **Visual Case Tracking**: Provide intuitive Kanban-style progress visualization for internal and external stakeholders
- **Mobile-First Notes**: Enable lawyers to capture searchable notes on smartphones
- **Automated Document Processing**: OCR, data extraction, and template-based document generation
- **Efficient Financial Tracking**: Streamline expense and per-diem recording with automated reporting

## System Architecture

### High-Level Architecture
```

┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Nuxt.js)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Nuxt.js   │  │   Vue 3      │  │  TypeScript 5    │   │
│  │    3.17.5   │  │  Composition │  │  Tailwind CSS    │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST API / GraphQL
┌─────────────────────────────┴───────────────────────────────┐
│                    Backend (Spring Boot)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Kotlin    │  │ Spring Boot  │  │  Spring Security │   │
│  │   API Layer │  │    3.5.0     │  │   OAuth2/JWT     │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Spring Data │  │  Spring AI   │  │  Spring Batch    │   │
│  │     JPA     │  │  Vertex AI   │  │  Processing      │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                    Data & Infrastructure                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ PostgreSQL  │  │    Redis     │  │  MinIO/GCS       │   │
│  │     15      │  │  Cache/Queue │  │  Object Storage  │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```
### Technology Stack

#### Frontend
- **Framework**: Nuxt.js 3.17.5 with Vue 3 and TypeScript 5
- **UI Library**: Vue 3 with Composition API and shadcn-vue components
- **Styling**: Tailwind CSS with Radix Vue and shadcn-vue design system
- **State Management**: Pinia 2.0 with TypeScript support and persistence
- **Component Development**: Storybook for isolated component development and documentation
- **Form Validation**: Zod 3.25.67 with vee-validate for runtime type validation
- **Icons**: Lucide Vue Next for consistent icon system
- **Utils**: VueUse for Vue composition utilities
- **Internationalization**: Nuxt i18n for JP/EN support

#### Backend
- **Language**: Kotlin with Java 21 runtime
- **Framework**: Spring Boot 3.5.0 with Spring Modulith
- **Security**: Spring Security with OAuth2 Resource Server (JWT)
- **Database**: Spring Data JPA with Hibernate
- **AI Integration**: Spring AI with Google Vertex AI
- **Batch Processing**: Spring Batch for document processing
- **Caching**: Redis for sessions and cache

#### Infrastructure
- **Database**: PostgreSQL 15 with pgvector for AI search
- **Object Storage**: MinIO (on-prem) / Google Cloud Storage (cloud)
- **Container**: Docker with Kubernetes (GKE/k3s)
- **CI/CD**: GitHub Actions + ArgoCD
- **Monitoring**: Spring Actuator + Prometheus

## Core Design Principles

### 1. Agent-Native Execution Framework
**Revolutionary AI-first architecture** positioning Aster Management as a collaborative human-agent platform:

#### Full Parity Between GUI and CLI (AI-Executable Interface Design)
- Every GUI operation must have a corresponding fully documented CLI interface
- AI agents can operate the system independently and programmatically without GUI constraints
- Users can observe and audit AI agent behavior including task-solving logic and executed commands
- All functionalities, commands, and operational contexts exposed through structured documentation (YAML, Markdown)
- Self-documenting system that serves as both AI knowledge base and auto-generated user guide

#### Ticket-Based Task Delegation to Humans and AI Agents
- All case and task management modeled as discrete, atomic tickets
- Tickets assignable to both human users and AI agents with no interface distinction
- AI agents treated as first-class team members with:
  - Parallel instantiation capability (multiple agents per workspace)
  - Role-based permissions and access scopes identical to humans
  - Conversational task delegation interface for collaborative human-agent workflows

**Implementation Constraint**: These principles are non-negotiable architectural requirements that guide all future design and development decisions.

## Key Design Decisions

### 1. Modular Monolith Architecture
Using Spring Modulith to create a modular monolith that can be easily decomposed into microservices when needed. This provides:
- Clear module boundaries
- Event-driven communication between modules
- Easy testing and deployment
- Future microservices migration path

### 2. AI-First Document Processing
Integration with Google Vertex AI for:
- OCR and document digitization
- Intelligent data extraction
- Natural language search
- Automated document generation
- Smart case insights

### 3. Discord-Style RBAC
Flexible role-based access control with:
- Three default roles: Lawyer, Clerk, Client
- Granular permissions (CRUD + export + settings)
- Customizable role definitions
- Audit trail for all permission changes

### 4. Cloud/On-Prem Parity
Designed for deployment flexibility:
- Cloud: GKE + Cloud SQL + GCS + Artifact Registry
- On-prem: k3s + PostgreSQL + MinIO + Harbor
- Infrastructure as Code with Terraform
- GitOps deployment with ArgoCD

## Core Modules

### 1. Authentication & Authorization
- JWT-based authentication with refresh tokens
- Two-factor authentication (2FA) mandatory
- Discord-style RBAC with customizable permissions
- Session management with Redis

### 2. Case Management
- CRUD operations for legal cases
- Kanban board visualization with drag-and-drop
- Status tracking with timestamps
- SLA monitoring and alerts
- Related document linking

### 3. Document Management
- PDF upload and viewing
- OCR processing with queuing
- Full-text search indexing
- Version control
- Template-based generation

### 4. Communication Hub
- Client memo system
- Internal notes
- Email/Slack/Discord integration
- Phone call logging
- Searchable communication history

### 5. Financial Management
- Expense tracking with receipt photos
- Per-diem recording
- CSV export for accounting
- Cost analysis per case
- Automated reporting

### 6. AI Services
- Natural language search across all data
- Smart document classification
- Automated data extraction
- Next-action suggestions
- Case outcome predictions

## Frontend Architecture Patterns

### State Management with Pinia
The frontend uses Pinia for predictable state management with the following store patterns:

- **UI Store**: Global UI state (theme, sidebar, modals, loading states)
- **Matter Store**: Case management data with optimistic updates for Kanban operations
- **Authentication Store**: User authentication state and permissions
- **Module-based Stores**: Separate stores for each domain module (cases, documents, communications)

### Nuxt.js Composition API Patterns
Component development follows Vue 3 Composition API patterns:

- **Composables**: Reusable business logic in `composables/` directory
- **Auto-imports**: Nuxt's auto-import system for components and composables
- **SSR/SPA Hybrid**: Server-side rendering with client-side hydration
- **File-based Routing**: Automatic route generation from pages directory

### Component Development with Storybook
Component development follows isolated patterns:

- **Story-driven Development**: Components developed in isolation with comprehensive examples
- **shadcn-vue Integration**: Pre-built components documented with usage patterns
- **Interaction Testing**: Component behavior testing within Storybook environment
- **Design System**: Visual documentation of component variants and states

### Type-Safe Forms with Zod + VeeValidate
Form handling uses runtime validation patterns:

- **Schema Definition**: Zod schemas in `schemas/` for all forms and API contracts
- **VeeValidate Integration**: Vue-native form validation with Zod schemas
- **Runtime Validation**: Client-side validation with server-side schema sharing
- **Error Handling**: Structured error messages with field-level feedback
- **Type Inference**: Automatic TypeScript types from Zod schemas

### Icon System with Lucide Vue Next
Consistent iconography throughout the application:

- **Legal Domain Icons**: Specialized icons for legal case management (Scale, FileText, etc.)
- **Size Consistency**: Standardized sizing using Tailwind CSS utilities
- **Vue Components**: Tree-shakable Vue components for optimal performance
- **Button Integration**: Seamless integration with shadcn-vue button components

### Vue 3 Single File Components (SFC) Architecture

#### SFC Structure and Best Practices
Vue 3 Single File Components provide a cohesive development experience by encapsulating template, script, and styles in a single file. The POC follows these architectural patterns:

```vue
<!-- Standard SFC Structure for Legal Case Management -->
<script setup lang="ts">
// 1. Imports - external libraries first, then internal
import { ref, computed, onMounted } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, minLength } from '@vuelidate/validators'
import type { Matter, MatterStatus } from '~/types/matter'

// 2. Props definition with TypeScript
interface Props {
  matterId?: string
  initialStatus?: MatterStatus
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialStatus: 'draft',
  readonly: false
})

// 3. Emits definition
const emit = defineEmits<{
  save: [matter: Matter]
  cancel: []
  statusChange: [status: MatterStatus]
}>()

// 4. Reactive state
const matter = ref<Partial<Matter>>({
  title: '',
  description: '',
  status: props.initialStatus
})

// 5. Computed properties
const isValid = computed(() => 
  matter.value.title && matter.value.title.length >= 3
)

// 6. Methods
const handleSave = () => {
  if (isValid.value) {
    emit('save', matter.value as Matter)
  }
}

// 7. Lifecycle hooks
onMounted(() => {
  if (props.matterId) {
    // Load existing matter
  }
})
</script>

<template>
  <!-- Semantic HTML with accessibility -->
  <form @submit.prevent="handleSave" class="matter-form">
    <fieldset :disabled="readonly">
      <legend class="sr-only">Matter Information</legend>
      
      <div class="form-group">
        <label for="matter-title" class="form-label">
          Matter Title *
        </label>
        <input
          id="matter-title"
          v-model="matter.title"
          type="text"
          class="form-input"
          :class="{ 'error': !isValid }"
          required
          aria-describedby="title-error"
        />
        <span v-if="!isValid" id="title-error" class="error-message">
          Title must be at least 3 characters
        </span>
      </div>
      
      <div class="form-actions">
        <button 
          type="submit" 
          :disabled="!isValid"
          class="btn btn-primary"
        >
          Save Matter
        </button>
        <button 
          type="button" 
          @click="emit('cancel')"
          class="btn btn-secondary"
        >
          Cancel
        </button>
      </div>
    </fieldset>
  </form>
</template>

<style scoped>
/* Component-specific styles with CSS variables */
.matter-form {
  --form-spacing: 1rem;
  --error-color: hsl(var(--destructive));
  
  max-width: 600px;
  padding: var(--form-spacing);
  background: hsl(var(--card));
  border-radius: var(--radius);
  border: 1px solid hsl(var(--border));
}

.form-group {
  margin-bottom: var(--form-spacing);
}

.form-label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: hsl(var(--foreground));
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.form-input.error {
  border-color: var(--error-color);
}

.error-message {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--error-color);
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

/* Responsive design */
@media (max-width: 640px) {
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
```

#### SFC Design Principles

**1. Script Setup Pattern**
- Use `<script setup lang="ts">` for all components
- TypeScript-first approach with proper type definitions
- Explicit prop and emit interfaces
- Logical organization: imports → props → emits → state → computed → methods → lifecycle

**2. Template Best Practices**
- Semantic HTML with proper ARIA labels
- Accessibility-first design with screen reader support
- Conditional rendering with v-if/v-show for performance
- Event handling with proper modifiers (.prevent, .stop, etc.)

**3. Scoped Styling**
- CSS custom properties for design tokens
- Scoped styles to prevent style leakage
- Responsive design with mobile-first approach
- Integration with Tailwind CSS utility classes when needed

#### Component Composition Patterns

```vue
<!-- Complex Component with Multiple Concerns -->
<script setup lang="ts">
// Composables for business logic separation
const { matters, loading, error, fetchMatters } = useMatters()
const { user, permissions } = useAuth()
const { isMobile } = useResponsive()

// Local component state
const selectedMatter = ref<Matter | null>(null)
const showFilters = ref(!isMobile.value)

// Computed properties for UI state
const canCreateMatter = computed(() => 
  permissions.value.includes('matter:create')
)

const filteredMatters = computed(() =>
  matters.value.filter(matter => 
    user.value.role === 'client' 
      ? matter.clientId === user.value.id
      : true
  )
)
</script>

<template>
  <div class="matters-dashboard">
    <!-- Header with conditional rendering -->
    <header class="dashboard-header">
      <h1>Legal Matters</h1>
      <div v-if="canCreateMatter" class="header-actions">
        <Button @click="showCreateModal = true">
          New Matter
        </Button>
      </div>
    </header>
    
    <!-- Responsive layout -->
    <div class="dashboard-content" :class="{ 'mobile': isMobile }">
      <!-- Filters sidebar -->
      <aside v-show="showFilters" class="filters-sidebar">
        <MatterFilters @filter="applyFilters" />
      </aside>
      
      <!-- Main content area -->
      <main class="matters-grid">
        <MatterCard
          v-for="matter in filteredMatters"
          :key="matter.id"
          :matter="matter"
          @select="selectedMatter = matter"
          @update="handleMatterUpdate"
        />
      </main>
    </div>
    
    <!-- Modal for matter details -->
    <MatterDetailModal
      v-if="selectedMatter"
      :matter="selectedMatter"
      @close="selectedMatter = null"
      @update="handleMatterUpdate"
    />
  </div>
</template>
```

### Vue 3 Specific Patterns

#### Composition API Structure
```typescript
// composables/useCase.ts
export function useCase(caseId: string) {
  const case = ref<Case | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const fetchCase = async () => {
    loading.value = true
    try {
      case.value = await $fetch(`/api/cases/${caseId}`)
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }
  
  return {
    case: readonly(case),
    loading: readonly(loading),
    error: readonly(error),
    fetchCase
  }
}
```
#### Provide/Inject for Context
```
typescript
// Context providers for form fields, themes, etc.
export const FormContextKey = Symbol('form-context')

export function provideFormContext(context: FormContext) {
  provide(FormContextKey, context)
}

export function useFormContext() {
  const context = inject(FormContextKey)
  if (!context) {
    throw new Error('useFormContext must be used within a form provider')
  }
  return context
}
```
#### Reactive Data Patterns
```typescript
// stores/cases.ts
export const useCaseStore = defineStore('cases', () => {
  const cases = ref<Case[]>([])
  const selectedCase = ref<Case | null>(null)
  
  const filteredCases = computed(() => 
    cases.value.filter(c => c.status === 'active')
  )
  
  const updateCase = (caseId: string, updates: Partial<Case>) => {
    const index = cases.value.findIndex(c => c.id === caseId)
    if (index !== -1) {
      cases.value[index] = { ...cases.value[index], ...updates }
    }
  }
  
  return {
    cases: readonly(cases),
    selectedCase: readonly(selectedCase),
    filteredCases,
    updateCase
  }
})
```
```


## Security Architecture

### Authentication Flow
```
User → Frontend → Spring Security → JWT Validation → Resource Access
↓
2FA Challenge (if required)
```


### Data Protection
- Encryption at rest (database)
- Encryption in transit (TLS)
- Field-level encryption for sensitive data
- Audit logging for all data access
- GDPR compliance features

## Integration Points

### External Systems
- **Courts**: Document submission APIs
- **Banks**: Form generation and submission
- **Email**: SMTP/IMAP integration
- **Messaging**: Slack/Discord webhooks
- **OCR**: Google Document AI
- **AI**: Google Vertex AI

### Internal APIs
- RESTful API with OpenAPI 3.0 specification
- GraphQL endpoint for complex queries
- WebSocket for real-time updates
- Event streaming for module communication

## Performance Targets

- **API Response**: p95 < 200ms
- **PDF First Paint**: < 1 second
- **Search Results**: < 500ms
- **OCR Processing**: < 30 seconds per page
- **System Availability**: 99.9% (cloud), best-effort (on-prem)

## Development Workflow

### Bun Package Manager Integration

#### Why Bun for Frontend Development
The Nuxt.js POC leverages Bun 1.2.16 as the primary package manager to enhance development velocity and build performance:

- **Performance**: 30x faster package installations compared to npm/yarn
- **Native Nuxt Support**: First-class support for Nuxt 3 ecosystem
- **Development Speed**: Faster development server startup and hot reloading
- **Modern Toolchain**: All-in-one toolkit with package manager, test runner, and bundler
- **Node.js Compatibility**: 100% compatible with existing Node.js dependencies

#### Bun Integration Architecture
```bash
# Project structure with Bun
frontend/
├── bun.lock                    # Bun lockfile (replaces package-lock.json)
├── package.json               # Standard package.json with Bun-optimized scripts
├── nuxt.config.ts            # Nuxt configuration with Bun considerations
└── src/
    ├── components/           # Vue SFC components
    ├── composables/         # Vue 3 composition functions
    └── pages/              # Nuxt file-based routing
```

#### Development Workflow with Bun
```bash
# Initial setup
bun install                    # Install dependencies (30x faster than npm)

# Development commands
bun dev                       # Start Nuxt development server
bun build                     # Production build
bun preview                   # Preview production build
bun test                      # Run test suite with Bun's built-in runner

# Package management
bun add @tanstack/vue-query   # Add dependencies instantly
bun remove package-name       # Remove dependencies
bun update                    # Update all packages
```

#### Performance Benefits
- **Cold start**: Nuxt dev server starts 2-3x faster with Bun
- **Hot reload**: Faster component updates during development
- **Build times**: Reduced bundle creation time for production builds
- **CI/CD**: Faster dependency installation in deployment pipelines

### Local Development
```bash
# Backend
cd backend
./gradlew bootRun

# Frontend with Bun
cd frontend
bun install    # 30x faster dependency installation
bun dev        # Start development server with enhanced performance
```


### Testing Strategy
- Unit tests with JUnit 5 and Vitest
- Integration tests with Testcontainers
- E2E tests with Playwright
- Performance tests with k6
- Security scanning with OWASP tools

### Test-Driven Development (TDD)

- Follow the principles of Test-Driven Development (TDD) as a default approach.
- Begin by writing tests based on the expected input and output.
- Do not write any implementation code at this stage—only the tests.
- Run the tests and confirm that they fail as expected.
- Once test correctness is confirmed, commit the failing tests.
- Then, begin implementing the code to make the tests pass.
- During implementation, do not modify the tests—focus solely on fixing the code.
- Repeat this process until all tests pass.

### Nuxt.js Specific Development Patterns

#### Auto-imports and Module Structure
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt'
  ],
  css: ['~/assets/css/app.css'],
  imports: {
    dirs: ['composables/**', 'utils/**']
  }
})
```


#### Server-Side API Routes
```typescript
// server/api/cases/[id].get.ts
export default defineEventHandler(async (event) => {
  const caseId = getRouterParam(event, 'id')
  const case = await getCaseById(caseId)
  return case
})
```


#### Middleware for Authentication
```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated && to.path !== '/login') {
    return navigateTo('/login')
  }
})
```


## Future Enhancements

### Phase 2 Features
- Vector search with pgvector for semantic search
- Advanced RAG-based AI chat interface
- Real-time collaboration features
- Mobile PWA with offline capabilities
- Blockchain integration for document verification

### Technical Improvements
- Event sourcing for audit trail
- CQRS for read/write separation
- GraphQL federation
- Service mesh (Istio)
- Multi-region deployment

## Constraints & Considerations

- Must support both Japanese and English
- Paper documents remain part of workflow
- Compliance with Japanese legal requirements
- Integration with legacy systems (NAS, FAX)
- Offline capability for court visits

## Key Success Metrics

- **User Adoption**: 80% daily active users
- **Process Efficiency**: 50% reduction in document processing time
- **Search Accuracy**: 95% relevant results
- **System Reliability**: < 5 minutes downtime per month
- **Cost Reduction**: 30% reduction in operational costs

## Nuxt.js Specific Considerations

### SSR/SPA Hybrid Approach
- Critical pages (login, case list) use SSR for performance
- Interactive features (Kanban, document viewer) use client-side rendering
- Proper hydration strategies to avoid layout shifts

### Performance Optimization
- Lazy loading for large components
- Image optimization with Nuxt Image
- Bundle splitting and code splitting
- Preloading critical resources

### SEO and Accessibility
- Server-side rendering for better SEO
- Proper meta tags and structured data
- ARIA labels and keyboard navigation
- Color contrast and screen reader support
```
## 💡 **Improvement Suggestions for Vue 3/Nuxt.js Migration**

**Time saved**: ~2-3 hours of research and setup
**Implementation**: 
1. Add Vue 3 specific linting rules
2. Set up Nuxt auto-imports configuration
3. Create composition API patterns documentation
4. Add Vue DevTools integration

**Benefits**: 
- Leverages Vue 3's improved performance and TypeScript support
- Utilizes Nuxt's auto-import system for better DX
- Provides clear patterns for team development
- Maintains compatibility with existing Spring Boot backend

The architecture has been fully adapted for Vue 3 and Nuxt.js while maintaining the core design principles and backend architecture. Key changes include:

- **Frontend Framework**: Migrated from Next.js/React to Nuxt.js/Vue 3
- **State Management**: Changed from Zustand to Pinia
- **Component Library**: Switched from shadcn/ui to shadcn-vue
- **Form Handling**: Updated to use VeeValidate with Zod
- **Vue-specific Patterns**: Added Composition API, provide/inject, and reactivity patterns
- **Nuxt-specific Features**: Integrated SSR, auto-imports, and file-based routing
```
