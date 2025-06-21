---
task_id: T03_S06
sprint_sequence_id: S06
status: open
complexity: Medium
last_updated: 2025-06-21T00:00:00Z
---

# Task: Shadcn-vue Setup and Core Configuration

## Description
Set up shadcn-vue in the Nuxt.js POC project, establishing the foundation for migrating UI components from the React/shadcn-ui implementation. This includes configuring the component library, setting up the necessary build tools, establishing theming infrastructure, and creating the base utilities required for all subsequent component migrations.

## Goal / Objectives
- Install and configure shadcn-vue with Nuxt 3 compatibility
- Set up the component installation CLI and directory structure
- Configure Tailwind CSS with shadcn-vue's design system
- Establish CSS variable theming for light/dark mode support
- Create utility functions and composables matching React implementation
- Ensure TypeScript support and proper type definitions

## Acceptance Criteria
- [ ] Shadcn-vue is properly installed and configured in the Nuxt POC
- [ ] Component installation CLI (`npx shadcn-vue@latest add`) works correctly
- [ ] Tailwind configuration matches the React project's design tokens
- [ ] CSS variables for theming are properly set up and working
- [ ] Dark mode toggle functionality is implemented
- [ ] Utility functions (cn, etc.) are ported and working
- [ ] Base component directory structure is established
- [ ] TypeScript types are properly configured
- [ ] Build process successfully compiles with shadcn-vue components
- [ ] Documentation for component usage patterns is created

## Subtasks
- [ ] Install shadcn-vue and dependencies
  - [ ] Add @shadcn-vue/ui package
  - [ ] Install required peer dependencies (radix-vue, etc.)
  - [ ] Configure components.json for shadcn-vue CLI
  - [ ] Set up component installation directory structure

- [ ] Configure Tailwind CSS for shadcn-vue
  - [ ] Update tailwind.config.js with shadcn-vue presets
  - [ ] Port color scheme and design tokens from React project
  - [ ] Configure CSS variable definitions
  - [ ] Set up animation utilities
  - [ ] Add required Tailwind plugins

- [ ] Set up theming infrastructure
  - [ ] Create app.css with CSS variable definitions
  - [ ] Port theme colors from React globals.css
  - [ ] Implement light/dark mode CSS classes
  - [ ] Create useTheme composable for theme management
  - [ ] Add theme persistence to localStorage

- [ ] Create utility functions and composables
  - [ ] Port cn() utility from lib/utils.ts
  - [ ] Create useIsMobile composable
  - [ ] Set up date formatting utilities
  - [ ] Add any other shared utilities from React codebase

- [ ] Configure TypeScript support
  - [ ] Set up component type definitions
  - [ ] Configure auto-imports for shadcn-vue components
  - [ ] Add proper IDE support (VS Code settings)
  - [ ] Create type utilities for component props

- [ ] Set up component structure
  - [ ] Create components/ui directory
  - [ ] Establish naming conventions (matching React structure)
  - [ ] Set up component index files
  - [ ] Configure auto-import patterns

- [ ] Create base configuration files
  - [ ] components.json for shadcn-vue CLI
  - [ ] Update nuxt.config.ts with required modules
  - [ ] Configure Vite aliases for @/ imports
  - [ ] Set up ESLint rules for Vue components

- [ ] Implement theme provider equivalent
  - [ ] Create plugins/theme.client.ts
  - [ ] Set up provide/inject for theme context
  - [ ] Add theme initialization on app mount
  - [ ] Handle SSR considerations

- [ ] Test the setup
  - [ ] Install a test component using CLI
  - [ ] Verify component renders correctly
  - [ ] Test theme switching functionality
  - [ ] Ensure TypeScript types work properly
  - [ ] Check build output and bundle size

- [ ] Create documentation
  - [ ] Document installation process
  - [ ] Create component usage guide
  - [ ] Add migration notes from shadcn-ui
  - [ ] Include troubleshooting section

## Technical Notes

### Key Differences from React Setup
1. **Component Structure**: Vue SFCs instead of TSX files
2. **State Management**: Vue refs/reactive instead of React hooks
3. **Props Definition**: Vue defineProps instead of TypeScript interfaces
4. **Event Handling**: Vue emits instead of callback props

### Configuration Files

#### components.json
```json
{
  "$schema": "https://shadcn-vue.com/schema.json",
  "style": "default",
  "typescript": true,
  "tsConfigPath": "./tsconfig.json",
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "assets/css/app.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "framework": "nuxt",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

#### Tailwind Config Updates
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... rest of color definitions
      },
      // ... animations and other extensions
    }
  }
}
```

### Utility Functions

#### cn() utility
```ts
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

#### useTheme composable
```ts
// composables/useTheme.ts
export const useTheme = () => {
  const colorMode = useColorMode()
  
  const isDark = computed(() => colorMode.value === 'dark')
  
  const toggleTheme = () => {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
  
  return {
    isDark,
    theme: colorMode.value,
    toggleTheme
  }
}
```

### Migration Considerations
- Radix Vue provides the headless components (instead of @radix-ui)
- Some Radix primitives may have different APIs in Vue
- Event handling uses Vue's emit pattern
- Slot usage differs from React's children prop
- Refs are handled differently (template refs vs React refs)

### Testing Strategy
1. Component installation via CLI
2. Basic rendering tests
3. Theme switching verification
4. TypeScript compilation checks
5. Build size analysis
6. SSR compatibility testing

## Output Log
*(This section is populated as work progresses on the task)*

[2025-06-21 00:00:00] Task created