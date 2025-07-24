# ADR-006: TypeScript Configuration Strategy for Vue 3/Nuxt 3

## Status
Accepted

## Context
TypeScript is a critical part of the Aster Management frontend, providing type safety and better developer experience. With the migration to Vue 3/Nuxt 3, we need to establish a TypeScript configuration that:
- Provides maximum type safety without hindering development speed
- Works seamlessly with Vue 3's Composition API
- Integrates with Nuxt 3's auto-imports and modules
- Supports proper type checking for templates
- Maintains compatibility with our toolchain (Vitest, Bun, etc.)
- Enables strict type checking for critical business logic

## Decision
We will use a strict TypeScript configuration with Vue 3/Nuxt 3 specific optimizations:
- TypeScript 5.x with strict mode enabled
- Vue TSC for template type checking
- Volar/Vue Language Tools for IDE support
- Type-safe Nuxt modules and auto-imports
- Zod for runtime validation with TypeScript inference

Configuration approach:
- Strict mode for business logic
- Pragmatic relaxations for rapid prototyping
- Generated types for API contracts
- Type-safe component props and emits

## Consequences

### Positive
- Catch errors at compile time
- Excellent IDE support with auto-completion
- Self-documenting code through types
- Easier refactoring with confidence
- Type inference from Zod schemas
- Better team collaboration through explicit contracts
- Nuxt 3's TypeScript support is first-class

### Negative
- Initial setup complexity
- Learning curve for Vue-specific TypeScript patterns
- Stricter types may slow initial development
- Some third-party libraries may lack proper types
- Template type checking can be slower

### Neutral
- Build times slightly increased with type checking
- Need to maintain type definitions
- Balance between type safety and development speed

## Alternatives Considered

### Alternative 1: Loose TypeScript Configuration
- **Pros**: Faster initial development, fewer type errors
- **Cons**: Misses many potential bugs, poor IDE support
- **Reason for rejection**: Defeats the purpose of using TypeScript

### Alternative 2: JavaScript with JSDoc
- **Pros**: No compilation step, optional typing
- **Cons**: Weaker type checking, poor IDE support, more verbose
- **Reason for rejection**: TypeScript provides superior DX

### Alternative 3: TypeScript with Any/Unknown Liberally
- **Pros**: Easier migration, fewer immediate errors
- **Cons**: Type safety compromised, technical debt
- **Reason for rejection**: Want to maintain high code quality

## Implementation Notes

### Base TypeScript Configuration
```json
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "jsx": "preserve",
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "types": [
      "@nuxt/types",
      "@types/node"
    ]
  }
}
```

### Vue Component Types
```typescript
// Properly typed component with props
interface Props {
  matterId: string
  status?: MatterStatus
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  status: 'draft',
  readonly: false
})

// Type-safe emits
const emit = defineEmits<{
  update: [matter: Matter]
  delete: [id: string]
  statusChange: [status: MatterStatus]
}>()
```

### Nuxt-Specific Types
```typescript
// Auto-imported composables with types
const { $api } = useNuxtApp()
const { data, error } = await useAsyncData('matters', 
  () => $api.matters.list()
)

// Type-safe route params
const route = useRoute('matters-id')
const matterId = route.params.id // typed as string
```

### API Type Generation
```typescript
// Generate types from OpenAPI spec
// types/api/generated.ts
export interface MatterDTO {
  id: string
  title: string
  status: MatterStatus
  // ... generated from backend OpenAPI
}

// Runtime validation with Zod
const MatterSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  status: z.enum(['draft', 'active', 'closed'])
})

type Matter = z.infer<typeof MatterSchema>
```

### Gradual Migration Strategy
1. Enable basic TypeScript support
2. Type component props and emits
3. Add types to stores and composables
4. Type API responses and requests
5. Enable stricter compiler options gradually
6. Add runtime validation with Zod

## References
- [TypeScript Vue Documentation](https://vuejs.org/guide/typescript/overview.html)
- [Nuxt 3 TypeScript Documentation](https://nuxt.com/docs/guide/concepts/typescript)
- [Volar - Vue Language Tools](https://github.com/vuejs/language-tools)
- [Zod TypeScript-first validation](https://zod.dev/)
- ADR-001: Frontend Framework Migration

## History
- **2025-01-02**: Initial draft created
- **2025-01-02**: Decision accepted for strict TypeScript usage