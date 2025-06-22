import type { Meta, StoryObj } from '@storybook/vue3'
import { Button } from './index'
import { Mail, Loader2, ChevronRight, Check } from 'lucide-vue-next'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style of the button',
      table: {
        type: { summary: 'ButtonVariant' },
        defaultValue: { summary: 'default' }
      }
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button',
      table: {
        type: { summary: 'ButtonSize' },
        defaultValue: { summary: 'default' }
      }
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' }
      }
    },
    asChild: {
      control: 'boolean',
      description: 'Whether to render as child component',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' }
      }
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A versatile button component with multiple variants and sizes. Built on top of Radix Vue primitives with Tailwind CSS styling.'
      }
    }
  }
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Default button story
export const Default: Story = {
  args: {
    variant: 'default',
    size: 'default',
    disabled: false
  },
  render: (args) => ({
    components: { Button },
    setup() {
      return { args }
    },
    template: '<Button v-bind="args">Click me</Button>'
  })
}

// All variants showcase
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
  }),
  parameters: {
    docs: {
      description: {
        story: 'All available button variants displayed together for comparison.'
      }
    }
  }
}

// All sizes showcase
export const AllSizes: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex items-center gap-4">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Icon button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14m7-7H5"/>
          </svg>
        </Button>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Different button sizes including the icon-only variant.'
      }
    }
  }
}

// With icons
export const WithIcons: Story = {
  render: () => ({
    components: { Button, Mail, ChevronRight, Check },
    template: `
      <div class="space-y-4">
        <div class="flex gap-4">
          <Button>
            <Mail class="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button variant="secondary">
            Continue
            <ChevronRight class="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Check class="mr-2 h-4 w-4" />
            Confirm
          </Button>
        </div>
        <div class="flex gap-4">
          <Button size="sm" variant="ghost">
            <Mail class="mr-2 h-3 w-3" />
            Small with icon
          </Button>
          <Button size="lg" variant="secondary">
            <Mail class="mr-2 h-5 w-5" />
            Large with icon
          </Button>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with leading and trailing icons in various sizes.'
      }
    }
  }
}

// Loading state
export const Loading: Story = {
  render: () => ({
    components: { Button, Loader2 },
    template: `
      <div class="flex gap-4">
        <Button disabled>
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </Button>
        <Button variant="outline" disabled>
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          Processing
        </Button>
        <Button variant="secondary" size="sm" disabled>
          <Loader2 class="mr-2 h-3 w-3 animate-spin" />
          Please wait
        </Button>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Loading states with animated spinner icons.'
      }
    }
  }
}

// Disabled states
export const DisabledStates: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex gap-4">
        <Button disabled>Disabled Default</Button>
        <Button variant="secondary" disabled>Disabled Secondary</Button>
        <Button variant="destructive" disabled>Disabled Destructive</Button>
        <Button variant="outline" disabled>Disabled Outline</Button>
        <Button variant="ghost" disabled>Disabled Ghost</Button>
        <Button variant="link" disabled>Disabled Link</Button>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'All button variants in their disabled state.'
      }
    }
  }
}

// Playground for interactive testing
export const Playground: Story = {
  args: {
    variant: 'default',
    size: 'default',
    disabled: false
  },
  render: (args) => ({
    components: { Button },
    setup() {
      const handleClick = () => {
        alert('Button clicked!')
      }
      return { args, handleClick }
    },
    template: '<Button v-bind="args" @click="handleClick">Interactive Button</Button>'
  }),
  parameters: {
    docs: {
      description: {
        story: 'An interactive playground where you can test all button props.'
      }
    }
  }
}

// Button group example
export const ButtonGroup: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="inline-flex rounded-md shadow-sm" role="group">
        <Button variant="outline" class="rounded-r-none">Previous</Button>
        <Button variant="outline" class="rounded-none border-x-0">Current</Button>
        <Button variant="outline" class="rounded-l-none">Next</Button>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Example of buttons grouped together with adjusted border radius.'
      }
    }
  }
}

// Real-world examples
export const RealWorldExamples: Story = {
  render: () => ({
    components: { Button, Mail, Loader2 },
    template: `
      <div class="space-y-8">
        <!-- Form actions -->
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Form Actions</h3>
          <div class="flex gap-4">
            <Button>Save Changes</Button>
            <Button variant="secondary">Save as Draft</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </div>
        
        <!-- Danger zone -->
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Danger Zone</h3>
          <div class="flex gap-4">
            <Button variant="destructive">Delete Account</Button>
            <Button variant="outline">Cancel Subscription</Button>
          </div>
        </div>
        
        <!-- Navigation -->
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Navigation</h3>
          <div class="flex gap-4">
            <Button variant="ghost" size="sm">← Back</Button>
            <Button variant="ghost" size="sm">Home</Button>
            <Button variant="ghost" size="sm">Settings</Button>
          </div>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Common button patterns used in real applications.'
      }
    }
  }
}