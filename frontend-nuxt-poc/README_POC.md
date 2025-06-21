# Nuxt 3 Proof of Concept - AsterManagement Migration

This is a proof of concept for migrating the AsterManagement frontend from Next.js to Nuxt 3.

## Features Implemented

### 1. Core Setup
- ✅ Nuxt 3 with TypeScript
- ✅ Tailwind CSS configuration
- ✅ Pinia for state management
- ✅ Axios for API calls

### 2. UI Components (shadcn-vue style)
- ✅ Card components
- ✅ Badge component
- ✅ Button component
- ✅ Input component
- ✅ Select component

### 3. Migrated Components
- ✅ **MatterCard**: Fully functional with all features from React version
  - Priority badges with color coding
  - Due date display with overdue highlighting
  - Client/opponent information
  - Document count
  - Tags support
  - Responsive card sizes

- ✅ **FilterBar**: Search and filtering functionality
  - Debounced search input
  - Status filter dropdown
  - Priority filter dropdown
  - Clear filters button
  - Responsive layout

### 4. State Management
- ✅ **Kanban Store** (Pinia): Mirrors Zustand API
  - Matter state management
  - Filter state
  - View preferences
  - Computed getters for filtered/grouped data
  - Optimistic updates
  - Loading and error states

### 5. Project Structure
```
frontend-nuxt-poc/
├── assets/
│   └── css/
│       └── main.css          # Tailwind styles
├── components/
│   ├── kanban/
│   │   ├── MatterCard.vue    # Migrated from React
│   │   ├── FilterBar.vue     # Migrated from React
│   │   └── KanbanBoard.vue   # Basic implementation
│   └── ui/                   # shadcn-vue style components
│       ├── badge/
│       ├── button/
│       ├── card/
│       ├── input/
│       └── select/
├── composables/
│   └── useApi.ts            # API client setup
├── lib/
│   └── utils.ts             # Utility functions
├── pages/
│   └── index.vue            # Main kanban page
├── stores/
│   ├── auth.ts              # Auth store (mock)
│   └── kanban.ts            # Kanban state management
└── types/
    └── matter.ts            # TypeScript types

```

## Running the PoC

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Key Migration Patterns Demonstrated

### 1. React Hooks → Vue Composition API
- `useState` → `ref`
- `useEffect` → `watch` / `watchEffect` / `onMounted`
- `useMemo` → `computed`
- `useCallback` → Not needed (functions are stable in Vue)

### 2. Component Props
- React: `interface Props { ... }`
- Vue: `defineProps<Props>()`

### 3. Event Handling
- React: `onClick={handler}`
- Vue: `@click="handler"`

### 4. Conditional Rendering
- React: `{condition && <Component />}`
- Vue: `v-if="condition"`

### 5. List Rendering
- React: `{items.map(item => <Item key={item.id} />)}`
- Vue: `v-for="item in items" :key="item.id"`

### 6. State Management
- Zustand → Pinia with similar API surface
- Maintained selector pattern for performance
- Preserved optimistic update pattern

## Performance Considerations

1. **SSR**: Configured and working out of the box
2. **Auto-imports**: Reduces bundle size with tree-shaking
3. **Lazy Loading**: Built-in with Nuxt's code splitting
4. **TypeScript**: Full type safety maintained

## Next Steps

1. **Drag & Drop**: Implement with vue-draggable-plus
2. **Advanced Components**: Dialogs, tooltips, date pickers
3. **API Integration**: Connect to real backend
4. **Testing**: Set up Vitest for unit tests
5. **E2E Tests**: Configure Playwright
6. **CI/CD**: GitHub Actions setup

## Migration Complexity Assessment

Based on this PoC:

- **Low Complexity**: UI components, basic state management
- **Medium Complexity**: Complex components, API integration
- **High Complexity**: Drag & drop, real-time features

Overall migration effort: **Medium** - Most patterns have direct equivalents in Vue.