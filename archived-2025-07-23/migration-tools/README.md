# React to Vue Migration Tools

Automated tooling for migrating AsterManagement frontend from React (Next.js) to Vue (Nuxt.js).

## Overview

This migration toolkit provides:
- **AST-based transformation** of React components to Vue SFCs
- **Migration progress dashboard** for tracking component status
- **Side-by-side comparison UI** for visual verification
- **Automated test generation** for migrated components
- **Code quality checks** for Vue best practices

## Installation

```bash
cd migration-tools
npm install
```

## Usage

### 1. Analyze Codebase

First, analyze your React codebase to understand migration complexity:

```bash
npm run analyze ../frontend/src
```

This will output:
- Total components and lines of code
- React hooks usage statistics
- JSX pattern analysis
- Migration complexity score

### 2. Transform Components

Transform React components to Vue:

```bash
# Single file
npm run transform ../frontend/src/components/Button.tsx -o ./output

# Multiple files with pattern
npm run transform ../frontend/src/components -p "**/*.tsx" -o ./output

# Dry run to preview changes
npm run transform ../frontend/src/components --dry-run

# Preserve directory structure
npm run transform ../frontend/src --preserve-structure -o ./vue-output
```

### 3. Migration Dashboard

Start the migration progress dashboard:

```bash
npm run dashboard
```

Access at: http://localhost:5173/migration-dashboard/

Features:
- Real-time migration progress tracking
- Component-by-component status
- Lines of code metrics
- Test coverage tracking
- Issue tracking and notes

### 4. Side-by-Side Comparison

Run both React and Vue apps, then start the comparison UI:

```bash
# Terminal 1: React app
cd ../frontend && npm run dev

# Terminal 2: Vue app  
cd ../frontend-nuxt-poc && npm run dev

# Terminal 3: Comparison UI
npm run compare
```

Access comparison UI at: http://localhost:8080/comparison

### 5. Generate Tests

Generate tests for migrated Vue components:

```bash
npm run test:generate ./output/Button.vue ./tests/Button.test.ts
```

## Transformation Rules

### React Hooks → Vue Composition API

| React | Vue |
|-------|-----|
| `useState` | `ref` (primitives) / `reactive` (objects) |
| `useEffect` | `watch` / `watchEffect` / `onMounted` |
| `useRef` | `ref` |
| `useMemo` | `computed` |
| `useCallback` | Not needed (methods are stable) |
| `useContext` | `inject` |

### JSX → Vue Template

| React JSX | Vue Template |
|-----------|--------------|
| `{condition && <Component />}` | `<Component v-if="condition" />` |
| `{items.map(item => <Item />)}` | `<Item v-for="item in items" :key="item.id" />` |
| `onClick={handler}` | `@click="handler"` |
| `className="..."` | `class="..."` |
| `style={{...}}` | `:style="{...}"` |

## Component Pattern Examples

### React Component
```tsx
import React, { useState, useEffect } from 'react';

interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, disabled }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    console.log('Button mounted');
    return () => console.log('Button unmounted');
  }, []);
  
  return (
    <button
      className={`btn ${isHovered ? 'btn-hover' : ''}`}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {label}
    </button>
  );
};
```

### Transformed Vue Component
```vue
<template>
  <button
    :class="['btn', { 'btn-hover': isHovered }]"
    @click="onClick"
    :disabled="disabled"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    {{ label }}
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Props {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

const props = defineProps<Props>();

const isHovered = ref(false);

onMounted(() => {
  console.log('Button mounted');
});

onUnmounted(() => {
  console.log('Button unmounted');
});
</script>
```

## Database Schema

The migration tracking uses PostgreSQL with the following tables:

- `migration_status` - Tracks component migration status
- `migration_metrics` - Daily migration progress metrics
- `migration_issues` - Issues encountered during migration

## Configuration

Create a `.env` file for database configuration:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aster_management
DB_USER=aster_user
DB_PASSWORD=aster_password
```

## Limitations

1. **Custom Hooks**: Complex custom React hooks may need manual conversion
2. **Higher-Order Components**: HOCs need to be manually converted to composables
3. **Render Props**: Pattern needs manual conversion to slots
4. **Class Components**: Not supported - convert to functional components first
5. **Styled Components**: CSS-in-JS needs manual extraction

## Best Practices

1. **Review Generated Code**: Always review and test transformed components
2. **Incremental Migration**: Migrate one feature/page at a time
3. **Maintain Tests**: Ensure test coverage before and after migration
4. **Visual Verification**: Use comparison UI to verify UI parity
5. **Performance Testing**: Compare performance metrics between versions

## Troubleshooting

### Common Issues

1. **Transform fails with parsing error**
   - Ensure TypeScript/JSX syntax is valid
   - Check for unsupported syntax patterns

2. **Missing imports in Vue component**
   - Review and add Vue-specific imports manually
   - Check for third-party library equivalents

3. **Event handlers not working**
   - Verify event names are correctly transformed
   - Check for differences in event objects

4. **Styling differences**
   - Review CSS module imports
   - Check for dynamic class bindings

## Contributing

1. Add new transformation rules in `src/rules/`
2. Test rules with sample components
3. Update documentation with examples
4. Submit PR with test coverage

## License

MIT