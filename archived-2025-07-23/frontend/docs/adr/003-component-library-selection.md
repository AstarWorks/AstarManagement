# ADR-003: Component Library Selection - shadcn-vue

## Status
Accepted

## Context
The Aster Management frontend requires a comprehensive UI component library that provides:
- Professional, accessible components suitable for a legal case management system
- Full TypeScript support
- Customization capabilities to match brand requirements
- Form components with validation support
- Data table components for case listings
- Modal/dialog systems for workflows
- Excellent accessibility (a11y) standards
- Good documentation and community support

Available options in the Vue ecosystem include Vuetify, Quasar, PrimeVue, Naive UI, Ant Design Vue, and shadcn-vue.

## Decision
We will use shadcn-vue as the primary component library, following the same philosophy as the React version (shadcn/ui).

Key aspects:
- Copy-paste component architecture (components are part of our codebase)
- Built on Radix Vue for accessible primitives
- Tailwind CSS for styling
- Full TypeScript support
- Customizable at the source level

## Consequences

### Positive
- Complete control over components (no black box)
- No external dependency for UI updates
- Consistent with modern component architecture trends
- Excellent TypeScript support
- Smaller bundle size (only include what we use)
- Easy to customize for specific legal industry needs
- Built on proven accessible primitives (Radix)
- Growing community and ecosystem
- Matches the React/Next.js architecture if comparing implementations

### Negative
- Need to maintain component code ourselves
- Less out-of-the-box compared to full frameworks
- Requires Tailwind CSS knowledge
- May need to build some specialized components
- Documentation is less comprehensive than mature frameworks

### Neutral
- Component updates require manual integration
- Styling through Tailwind utilities
- Need to set up component development workflow

## Alternatives Considered

### Alternative 1: Vuetify 3
- **Pros**: Mature, comprehensive, Material Design, large community
- **Cons**: Opinionated styling, harder to customize, larger bundle size
- **Reason for rejection**: Too opinionated for our custom legal UI needs

### Alternative 2: Quasar
- **Pros**: Full framework, cross-platform support, comprehensive components
- **Cons**: Heavy framework, steep learning curve, overkill for our needs
- **Reason for rejection**: We only need web, not mobile/electron

### Alternative 3: PrimeVue
- **Pros**: Enterprise-focused, good data components, theme designer
- **Cons**: Paid themes for best experience, less modern architecture
- **Reason for rejection**: Prefer open-source, modern approach

### Alternative 4: Naive UI
- **Pros**: Modern, TypeScript-first, good performance
- **Cons**: Smaller community, less proven in production
- **Reason for rejection**: shadcn-vue offers better architecture

### Alternative 5: Ant Design Vue
- **Pros**: Comprehensive, enterprise-proven, good documentation
- **Cons**: Chinese-focused community, specific design language
- **Reason for rejection**: shadcn-vue's flexibility better suits our needs

## Implementation Notes

### Component Structure
```
frontend/
├── components/
│   ├── ui/               # shadcn-vue components
│   │   ├── button/
│   │   ├── card/
│   │   ├── dialog/
│   │   ├── form/
│   │   └── ...
│   └── matters/          # Domain-specific components
│       ├── MatterCard.vue
│       ├── MatterForm.vue
│       └── ...
```

### Key Components Needed
1. **Form Components**: Input, Select, Checkbox, Radio, DatePicker
2. **Data Display**: Table, Card, Badge, Avatar
3. **Feedback**: Alert, Toast, Dialog, Popover
4. **Navigation**: Tabs, Breadcrumb, Pagination
5. **Layout**: Container, Grid, Separator

### Customization Strategy
- Use CSS variables for theming
- Extend base components for legal-specific needs
- Create compound components for complex workflows
- Maintain accessibility standards throughout

## References
- [shadcn-vue Documentation](https://www.shadcn-vue.com/)
- [Radix Vue Documentation](https://www.radix-vue.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- Component library comparison (internal evaluation)
- ADR-001: Frontend Framework Migration

## History
- **2025-01-02**: Initial draft created
- **2025-01-02**: Decision accepted after component evaluation