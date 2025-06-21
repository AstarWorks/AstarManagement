---
task_id: T03_S06
sprint_sequence_id: S06
status: completed
complexity: Medium
last_updated: 2025-06-21T22:43:00Z
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
- [x] Shadcn-vue is properly installed and configured in the Nuxt POC
- [x] Component integration works via shadcn-nuxt module
- [x] Tailwind configuration uses zinc theme with new-york style
- [x] CSS variables for theming are properly set up and working
- [x] Dark mode toggle functionality is implemented via useTheme composable
- [x] Utility functions (cn, useIsMobile, date utilities) are available
- [x] Base component directory structure is established (/components/ui/)
- [x] TypeScript types are properly configured with auto-imports
- [x] Dev server runs successfully with shadcn-vue components
- [x] Comprehensive documentation and test page created

## Subtasks
- [x] Install shadcn-vue and dependencies
  - [x] Add shadcn-nuxt module for Nuxt 3 integration
  - [x] Install required peer dependencies (radix-vue, etc.)
  - [x] Configure nuxt.config.ts for shadcn-nuxt module
  - [x] Set up component installation directory structure

- [x] Configure Tailwind CSS for shadcn-vue
  - [x] Update tailwind.config.js with shadcn-vue presets
  - [x] Port zinc color scheme and design tokens to match new-york style
  - [x] Configure CSS variable definitions
  - [x] Set up animation utilities (accordion animations)
  - [x] Add required Tailwind plugins (tailwindcss-animate)

- [x] Set up theming infrastructure
  - [x] Create app.css with CSS variable definitions (zinc theme)
  - [x] Port theme colors to match shadcn-vue new-york style
  - [x] Implement light/dark mode CSS classes
  - [x] Create useTheme composable for theme management
  - [x] Add theme persistence via @nuxtjs/color-mode module

- [x] Create utility functions and composables
  - [x] Port cn() utility from lib/utils.ts (already available)
  - [x] Create useIsMobile composable with VueUse alternative
  - [x] Set up date formatting utilities using date-fns
  - [x] Add shared utilities for date validation and formatting

- [x] Configure TypeScript support
  - [x] Set up component type definitions for shadcn-vue
  - [x] Configure auto-imports via shadcn-nuxt module
  - [x] Add TypeScript paths and aliases configuration
  - [x] Create type utilities for component props and themes

- [x] Set up component structure
  - [x] Create components/ui directory
  - [x] Establish naming conventions (matching React structure)
  - [x] Set up component index files for proper exports
  - [x] Configure auto-import patterns via Nuxt component auto-discovery

- [x] Create base configuration files
  - [x] components.json for shadcn-vue CLI (new-york style)
  - [x] Update nuxt.config.ts with shadcn-nuxt module
  - [x] Configure Vite aliases for @/ imports (via Nuxt)
  - [x] TypeScript configuration handles Vue components properly

- [x] Implement theme provider equivalent
  - [x] Theme management via @nuxtjs/color-mode module
  - [x] useTheme composable provides reactive theme context
  - [x] Automatic theme initialization and persistence
  - [x] Full SSR support with hydration safety

- [x] Test the setup
  - [x] Created comprehensive test page with all components
  - [x] Verify component renders correctly (Button, Badge, Card, Input)
  - [x] Test theme switching functionality works
  - [x] Ensure TypeScript types work properly
  - [x] Verify dev server runs without errors

- [x] Create documentation
  - [x] Document installation process with step-by-step setup
  - [x] Create comprehensive component usage guide
  - [x] Add migration notes from React shadcn-ui to Vue
  - [x] Include troubleshooting section and best practices

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
[2025-06-21 22:43] Task started - Set status to in_progress
[2025-06-21 22:50] Installed shadcn-nuxt module and configured Nuxt integration
[2025-06-21 23:05] Completed shadcn-vue setup with zinc theme, utilities, and documentation
[2025-06-21 23:25] Code review completed - Fixed all hardcoded colors to use CSS variables
[2025-06-21 23:26] Task completed successfully - All acceptance criteria met