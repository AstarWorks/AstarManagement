# Shadcn-vue Setup Guide

This document outlines the shadcn-vue setup and configuration for the Aster Management Nuxt.js application.

## Overview

We use shadcn-vue as our primary UI component library, providing a comprehensive set of accessible, customizable components built on top of Radix Vue primitives.

## Installation

The following packages are installed and configured:

```bash
# Core dependencies
bun add shadcn-nuxt
bun add radix-vue
bun add class-variance-authority
bun add clsx
bun add tailwind-merge
bun add tailwindcss-animate
```

## Configuration

### Nuxt Configuration

In `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/google-fonts',
    '@nuxtjs/color-mode',
    'shadcn-nuxt'
  ],

  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
    storageKey: 'aster-color-mode'
  }
})
```

### Components Configuration

The `components.json` file configures the shadcn-vue CLI:

```json
{
  "$schema": "https://shadcn-vue.com/schema.json",
  "style": "new-york",
  "typescript": true,
  "tsConfigPath": "./tsconfig.json",
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "assets/css/main.css",
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

### Tailwind CSS Configuration

The `tailwind.config.js` includes shadcn-vue presets:

```javascript
module.exports = {
  darkMode: ['class'],
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './composables/**/*.{js,ts}',
    './utils/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        // ... rest of color definitions
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}
```

## Available Components

### Basic Components

- **Button**: `<Button variant="default|secondary|destructive|outline|ghost|link" size="default|sm|lg|icon">`
- **Badge**: `<Badge variant="default|secondary|destructive|outline">`
- **Card**: `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardFooter>`
- **Input**: `<Input type="text" placeholder="..." v-model="value">`
- **Select**: `<Select>` with options support

### Component Structure

Components are organized in the `/components/ui/` directory:

```
components/ui/
├── badge/
│   ├── Badge.vue
│   └── index.ts
├── button/
│   ├── Button.vue
│   └── index.ts
├── card/
│   ├── Card.vue
│   ├── CardContent.vue
│   ├── CardHeader.vue
│   └── index.ts
├── input/
│   ├── Input.vue
│   └── index.ts
└── select/
    ├── Select.vue
    └── index.ts
```

## Theme Management

### Using the Theme Composable

```vue
<script setup>
const { isDark, resolvedTheme, toggleTheme } = useTheme()
</script>

<template>
  <Button @click="toggleTheme">
    {{ isDark ? 'Switch to Light' : 'Switch to Dark' }}
  </Button>
</template>
```

### CSS Variables

Theme colors are defined using CSS variables in `assets/css/main.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  /* ... */
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  /* ... */
}
```

## Utilities

### Class Name Utility

```typescript
import { cn } from '@/lib/utils'

// Merge Tailwind classes with conflict resolution
const className = cn('px-4 py-2', 'bg-primary', conditionalClass)
```

### Mobile Detection

```typescript
const { isMobile } = useIsMobileVueUse()
```

### Date Formatting

```typescript
import { formatDate, formatRelativeDate, isDueSoon } from '@/lib/date'

const formattedDate = formatDate(new Date())
const relativeDate = formatRelativeDate(new Date())
const dueSoon = isDueSoon(someDate)
```

## TypeScript Support

Type definitions are available for all components:

```typescript
import type { ButtonProps, BadgeProps, CardProps } from '@/types/components'
```

## Testing

A comprehensive test page is available at `/test-shadcn` to verify:

- Component rendering
- Theme switching
- Mobile detection
- TypeScript types
- Utility functions

## Migration Notes

### From React shadcn/ui

Key differences when migrating from React:

1. **Component Structure**: Vue SFCs instead of TSX files
2. **Props**: Use `defineProps()` instead of TypeScript interfaces
3. **Events**: Use `defineEmits()` instead of callback props
4. **State**: Use Vue refs/reactive instead of React hooks
5. **Slots**: Use Vue slots instead of React children

### Example Migration

React:
```tsx
<Button variant="default" onClick={handleClick}>
  Click me
</Button>
```

Vue:
```vue
<Button variant="default" @click="handleClick">
  Click me
</Button>
```

## Best Practices

1. **Import Components**: Use auto-imports provided by Nuxt
2. **Theme Consistency**: Always use CSS variables for colors
3. **TypeScript**: Leverage type definitions for better DX
4. **Accessibility**: Components include ARIA attributes by default
5. **Performance**: Components are tree-shakeable and optimized

## Troubleshooting

### Common Issues

1. **Component not found**: Ensure the component is properly exported in its index.ts file
2. **Theme not working**: Check that @nuxtjs/color-mode is properly configured
3. **TypeScript errors**: Verify that shadcn-nuxt types are included in tsconfig.json

### Development Tools

- Use the test page at `/test-shadcn` for development
- Nuxt DevTools provides component inspection
- Tailwind CSS IntelliSense for class completion