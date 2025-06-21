# T07_S06: Storybook Development Tools Setup

## Task Metadata
- **Task ID**: T07_S06
- **Sprint**: S06
- **Complexity**: MEDIUM (8 story points)
- **Priority**: P2 - High
- **Dependencies**: T03_S06 (ShadcnVue Setup), T04_S06 (Core UI Components)
- **Estimated Duration**: 1-2 days

## Context
Set up Storybook 7+ for Vue 3 to provide a comprehensive component development environment. This includes configuration for ShadcnVue components, dark mode support, accessibility testing, and interactive documentation. The setup will accelerate component development and serve as living documentation for the design system.

## Objectives
1. Install and configure Storybook 7 for Vue 3
2. Set up Storybook with Vite builder
3. Configure dark mode and theme switching
4. Add essential addons for development
5. Create stories for core components
6. Implement automated visual testing

## Technical Specifications

### 1. Storybook Configuration
```javascript
// .storybook/main.js
export default {
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/**/*.story.@(js|jsx|ts|tsx|mdx)'
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
    'storybook-dark-mode',
    '@chromatic-com/storybook'
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {}
  },
  docs: {
    autodocs: 'tag'
  },
  core: {
    builder: '@storybook/builder-vite'
  }
}
```

### 2. Preview Configuration
```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { themes } from '@storybook/theming'

// Import global styles
import '../src/assets/css/tailwind.css'
import '../src/assets/css/global.css'

// Setup app-level providers
setup((app) => {
  app.use(createPinia())
  
  // Mock router for components that use routing
  const router = createRouter({
    history: createWebHistory(),
    routes: []
  })
  app.use(router)
})

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    },
    darkMode: {
      dark: { ...themes.dark, appBg: '#09090b' },
      light: { ...themes.normal, appBg: '#ffffff' },
      current: 'light',
      stylePreview: true,
      darkClass: 'dark',
      lightClass: 'light',
      classTarget: 'html'
    },
    docs: {
      theme: themes.dark
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' }
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' }
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1440px', height: '900px' }
        }
      }
    }
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div class="p-6"><story /></div>'
    })
  ]
}

export default preview
```

### 3. Component Story Template
```typescript
// components/ui/button/Button.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import { Button } from './index'
import { Mail, Loader2 } from 'lucide-vue-next'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style of the button'
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled'
    },
    asChild: {
      control: 'boolean',
      description: 'Whether to render as child component'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A versatile button component with multiple variants and sizes.'
      }
    }
  }
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: 'default',
    size: 'default'
  },
  render: (args) => ({
    components: { Button },
    setup() {
      return { args }
    },
    template: '<Button v-bind="args">Click me</Button>'
  })
}

export const AllVariants: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex flex-wrap gap-4">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    `
  })
}

export const WithIcon: Story = {
  render: () => ({
    components: { Button, Mail },
    template: `
      <div class="flex gap-4">
        <Button>
          <Mail class="mr-2 h-4 w-4" />
          Login with Email
        </Button>
        <Button variant="outline" size="icon">
          <Mail class="h-4 w-4" />
        </Button>
      </div>
    `
  })
}

export const Loading: Story = {
  render: () => ({
    components: { Button, Loader2 },
    template: `
      <Button disabled>
        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
        Please wait
      </Button>
    `
  })
}

export const Playground: Story = {
  args: {
    variant: 'default',
    size: 'default',
    disabled: false
  }
}
```

### 4. Form Component Stories
```typescript
// components/forms/FormInput.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import { FormInput } from './index'
import { useForm } from '@/composables/useForm'
import { z } from 'zod'

const meta = {
  title: 'Forms/FormInput',
  component: FormInput,
  tags: ['autodocs'],
  decorators: [
    () => ({
      template: `
        <div class="max-w-md">
          <story />
        </div>
      `
    })
  ]
} satisfies Meta<typeof FormInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { FormInput },
    setup() {
      const schema = z.object({
        email: z.string().email()
      })
      
      const form = useForm(schema)
      
      return { form }
    },
    template: `
      <form @submit="form.handleSubmit">
        <FormInput
          name="email"
          label="Email Address"
          type="email"
          placeholder="john@example.com"
        />
      </form>
    `
  })
}

export const WithValidation: Story = {
  render: () => ({
    components: { FormInput, Button },
    setup() {
      const schema = z.object({
        username: z.string().min(3, 'Username must be at least 3 characters')
      })
      
      const form = useForm(schema)
      
      return { form }
    },
    template: `
      <form @submit="form.handleSubmit" class="space-y-4">
        <FormInput
          name="username"
          label="Username"
          placeholder="Enter username"
          required
        />
        <Button type="submit">Submit</Button>
      </form>
    `
  })
}
```

### 5. Composite Component Stories
```typescript
// components/composite/DataTable.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import DataTable from './DataTable.vue'
import { userEvent, within } from '@storybook/testing-library'
import { expect } from '@storybook/jest'

const meta = {
  title: 'Composite/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded'
  }
} satisfies Meta<typeof DataTable>

export default meta
type Story = StoryObj<typeof meta>

const mockData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' }
]

export const Default: Story = {
  args: {
    data: mockData,
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'role', label: 'Role' }
    ]
  }
}

export const WithInteractions: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Test sorting
    const nameHeader = await canvas.findByText('Name')
    await userEvent.click(nameHeader)
    
    // Test row selection
    const firstRow = await canvas.findByText('John Doe')
    await userEvent.click(firstRow)
    
    // Verify selection
    expect(firstRow.parentElement).toHaveClass('selected')
  }
}
```

### 6. Storybook Addons Configuration
```typescript
// .storybook/addons/viewport.ts
export const customViewports = {
  iPhone12: {
    name: 'iPhone 12',
    styles: {
      width: '390px',
      height: '844px'
    }
  },
  iPadPro: {
    name: 'iPad Pro',
    styles: {
      width: '1024px',
      height: '1366px'
    }
  },
  desktop4K: {
    name: '4K Desktop',
    styles: {
      width: '3840px',
      height: '2160px'
    }
  }
}

// .storybook/test-runner.ts
import { injectAxe, checkA11y } from 'axe-playwright'

export async function preRender(page) {
  await injectAxe(page)
}

export async function postRender(page) {
  await checkA11y(page, '#root', {
    detailedReport: true,
    detailedReportOptions: {
      html: true
    }
  })
}
```

### 7. Development Scripts
```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "test-storybook": "test-storybook",
    "chromatic": "chromatic --project-token=$CHROMATIC_PROJECT_TOKEN"
  }
}
```

## Implementation Steps

1. **Install Dependencies**
   ```bash
   pnpm add -D @storybook/vue3-vite @storybook/addon-essentials @storybook/addon-interactions @storybook/addon-links @storybook/addon-a11y @storybook/testing-library @storybook/jest @storybook/test-runner storybook-dark-mode
   ```

2. **Initialize Storybook**
   ```bash
   pnpm dlx storybook@latest init
   ```

3. **Configure Build Tools**
   - Set up Vite integration
   - Configure path aliases
   - Add PostCSS support

4. **Create Story Templates**
   - Button components
   - Form components
   - Layout components
   - Composite components

5. **Add Development Tools**
   - Controls addon
   - Actions addon
   - Viewport addon
   - Accessibility addon

6. **Implement Visual Testing**
   - Set up Chromatic
   - Configure visual regression tests
   - Add interaction tests

## Testing Requirements

1. **Story Coverage**
   - All UI components have stories
   - Interactive states documented
   - Edge cases covered

2. **Interaction Tests**
   - User interaction flows
   - Form validation scenarios
   - Component state changes

3. **Visual Regression**
   - Chromatic snapshots
   - Cross-browser testing
   - Responsive design verification

## Documentation Requirements

1. **Component Documentation**
   - Props documentation
   - Usage examples
   - Best practices
   - Accessibility notes

2. **Design Tokens**
   - Color palette
   - Typography scale
   - Spacing system
   - Border radius values

3. **Pattern Library**
   - Common UI patterns
   - Composite components
   - Page templates

## Performance Considerations

1. **Build Optimization**
   - Lazy load stories
   - Optimize bundle size
   - Cache static assets

2. **Development Experience**
   - Fast HMR
   - Minimal rebuild times
   - Efficient story loading

## Success Criteria

1. Storybook runs with all components
2. Dark mode toggle works correctly
3. All stories have controls
4. Accessibility tests pass
5. Visual regression tests configured
6. Documentation auto-generated
7. CI/CD integration complete

## Notes

- Use Storybook 7+ features (CSF3)
- Leverage Vue 3 composition API
- Consider MDX for complex docs
- Plan for design system scaling
- Integrate with existing CI/CD