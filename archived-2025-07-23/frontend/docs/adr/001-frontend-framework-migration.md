# ADR-001: Frontend Framework Migration from React/Next.js to Vue/Nuxt.js

## Status
Accepted

## Context
The Aster Management project was initially conceived with a React/Next.js frontend. However, after evaluating team expertise, project requirements, and the Japanese market context, we need to decide on the most appropriate frontend framework for long-term success.

Key considerations:
- Team has stronger Vue.js expertise than React
- Japanese development community has significant Vue.js adoption
- Project requires SSR capabilities for SEO and performance
- Need for rapid development with minimal learning curve
- Integration with existing Spring Boot backend must be maintained
- Client-side interactivity requirements for Kanban boards and real-time updates

## Decision
We will migrate the frontend from React/Next.js to Vue 3/Nuxt.js 3. This migration will be conducted in phases to minimize disruption and ensure all functionality is properly ported.

The migration will use:
- Vue 3 with Composition API for component development
- Nuxt.js 3 for SSR/SSG capabilities and developer experience
- TypeScript for type safety (continuing from React implementation)
- Pinia for state management (replacing Redux/Zustand)
- shadcn-vue for UI components (replacing shadcn/ui)

## Consequences

### Positive
- Leverages existing team expertise in Vue.js ecosystem
- Faster development velocity due to team familiarity
- Better alignment with Japanese developer community preferences
- Nuxt 3 provides excellent DX with auto-imports and file-based routing
- Vue 3's Composition API offers similar benefits to React Hooks
- Smaller bundle sizes compared to React
- Better TypeScript support in Vue 3 compared to Vue 2

### Negative
- Initial migration effort required (estimated 2-3 sprints)
- Some React-specific patterns need to be redesigned for Vue
- Potential for bugs during migration phase
- Need to retrain any React-specific tooling or CI/CD pipelines
- Smaller ecosystem compared to React (though still substantial)

### Neutral
- Both frameworks support SSR/SSG through their meta-frameworks
- TypeScript support is strong in both ecosystems
- Component-based architecture remains the same
- State management concepts transfer well between Redux/Pinia

## Alternatives Considered

### Alternative 1: Continue with React/Next.js
- **Pros**: No migration needed, larger ecosystem, more third-party components
- **Cons**: Team lacks React expertise, slower development, higher training costs
- **Reason for rejection**: Team productivity and expertise are critical for project success

### Alternative 2: Angular
- **Pros**: Enterprise-grade framework, strong TypeScript support, comprehensive tooling
- **Cons**: Steep learning curve, verbose syntax, overkill for this project
- **Reason for rejection**: Complexity outweighs benefits for our use case

### Alternative 3: Svelte/SvelteKit
- **Pros**: Excellent performance, simple syntax, growing popularity
- **Cons**: Smaller ecosystem, limited team knowledge, fewer Japanese resources
- **Reason for rejection**: Too risky given team experience and market adoption

## Implementation Notes
1. Create parallel Nuxt.js project structure
2. Port shared utilities and types first
3. Migrate components incrementally, starting with atomic components
4. Implement state management with Pinia alongside component migration
5. Port pages and routes after components are stable
6. Maintain feature parity throughout migration
7. Run both versions in parallel during transition period

## References
- [Vue 3 Documentation](https://vuejs.org/)
- [Nuxt 3 Documentation](https://nuxt.com/)
- [Vue.js adoption in Japan](https://vuejs.org/about/faq#is-vue-popular-in-japan)
- ARCHITECTURE.md - Project requirements and constraints
- Team skill assessment (internal document)

## History
- **2025-01-02**: Initial draft created based on team evaluation
- **2025-01-02**: Decision accepted after stakeholder review