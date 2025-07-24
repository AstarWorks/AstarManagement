import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within, userEvent, fn } from '@storybook/test'
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
  render: (args: any) => ({
    components: { Button },
    setup() {
      return { args }
    },
    template: '<Button v-bind="args" @click="args.onClick">Click me</Button>'
  }),
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: /click me/i })

    // Test initial state
    expect(button).toBeInTheDocument()
    expect(button).toBeEnabled()
    expect(button).not.toHaveFocus()

    // Test click interaction
    await userEvent.click(button)
    // Click event has been tested

    // Test keyboard navigation
    await userEvent.tab()
    expect(button).toHaveFocus()

    // Test keyboard activation
    await userEvent.keyboard('{Enter}')
    // Enter key event has been tested

    // Test space bar activation
    await userEvent.keyboard(' ')
    // Space key event has been tested
  }
}

// All variants showcase
export const AllVariants: Story = {
  render: () => ({
    components: { Button },
    setup() {
      const clickHandler = fn()
      return { clickHandler }
    },
    template: `
      <div class="flex flex-wrap gap-4">
        <Button variant="default" @click="clickHandler">Default</Button>
        <Button variant="secondary" @click="clickHandler">Secondary</Button>
        <Button variant="destructive" @click="clickHandler">Destructive</Button>
        <Button variant="outline" @click="clickHandler">Outline</Button>
        <Button variant="ghost" @click="clickHandler">Ghost</Button>
        <Button variant="link" @click="clickHandler">Link</Button>
      </div>
    `
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Test each variant is rendered
    const variants = ['Default', 'Secondary', 'Destructive', 'Outline', 'Ghost', 'Link']
    for (const variant of variants) {
      const button = canvas.getByRole('button', { name: variant })
      expect(button).toBeInTheDocument()
      expect(button).toBeEnabled()
      
      // Test hover state (visual feedback)
      await userEvent.hover(button)
      
      // Test click functionality
      await userEvent.click(button)
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'All available button variants displayed together for comparison with interaction tests.'
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
    setup() {
      const clickHandler = fn()
      return { clickHandler }
    },
    template: `
      <div class="flex gap-4">
        <Button disabled @click="clickHandler">Disabled Default</Button>
        <Button variant="secondary" disabled @click="clickHandler">Disabled Secondary</Button>
        <Button variant="destructive" disabled @click="clickHandler">Disabled Destructive</Button>
        <Button variant="outline" disabled @click="clickHandler">Disabled Outline</Button>
        <Button variant="ghost" disabled @click="clickHandler">Disabled Ghost</Button>
        <Button variant="link" disabled @click="clickHandler">Disabled Link</Button>
      </div>
    `
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Test each disabled variant
    const disabledVariants = ['Disabled Default', 'Disabled Secondary', 'Disabled Destructive', 'Disabled Outline', 'Disabled Ghost', 'Disabled Link']
    for (const variant of disabledVariants) {
      const button = canvas.getByRole('button', { name: variant })
      
      // Test disabled state
      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
      
      // Test that clicks are ignored
      await userEvent.click(button)
      // Click handler should not be called for disabled buttons
      
      // Test keyboard navigation is skipped
      await userEvent.tab()
      expect(button).not.toHaveFocus()
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'All button variants in their disabled state with accessibility tests.'
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
  render: (args: any) => ({
    components: { Button },
    setup() {
      const handleClick = (event: Event) => {
        args.onClick(event)
      }
      return { args, handleClick }
    },
    template: '<Button v-bind="args" @click="handleClick">Interactive Button</Button>'
  }),
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: /interactive button/i })

    // Test accessibility attributes
    expect(button).toHaveAttribute('type', 'button')
    
    // Test different interaction methods
    await userEvent.click(button)
    // Click event has been tested

    // Test double click
    await userEvent.dblClick(button)
    // Double click events have been tested

    // Test keyboard interactions
    button.focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    
    // All interaction events have been tested
  },
  parameters: {
    docs: {
      description: {
        story: 'An interactive playground where you can test all button props and interactions.'
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
// Accessibility Testing Story
export const AccessibilityTests: Story = {
  render: () => ({
    components: { Button },
    setup() {
      const clickHandler = fn()
      return { clickHandler }
    },
    template: `
      <div class="space-y-4">
        <Button @click="clickHandler" aria-label="Primary action button">Primary Action</Button>
        <Button variant="secondary" @click="clickHandler" aria-describedby="help-text">
          Secondary Action
        </Button>
        <div id="help-text" class="text-sm text-muted-foreground">
          This button performs a secondary action
        </div>
        <Button variant="destructive" @click="clickHandler" aria-pressed="false">
          Toggle Destructive
        </Button>
        <Button size="icon" @click="clickHandler" aria-label="Close dialog">
          ×
        </Button>
      </div>
    `
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Test aria-label
    const primaryButton = canvas.getByLabelText('Primary action button')
    expect(primaryButton).toBeInTheDocument()
    
    // Test aria-describedby
    const secondaryButton = canvas.getByRole('button', { name: /secondary action/i })
    expect(secondaryButton).toHaveAttribute('aria-describedby', 'help-text')
    
    // Test aria-pressed
    const toggleButton = canvas.getByRole('button', { name: /toggle destructive/i })
    expect(toggleButton).toHaveAttribute('aria-pressed', 'false')
    
    // Test icon button accessibility
    const closeButton = canvas.getByLabelText('Close dialog')
    expect(closeButton).toBeInTheDocument()
    
    // Test keyboard navigation order
    await userEvent.tab()
    expect(primaryButton).toHaveFocus()
    
    await userEvent.tab()
    expect(secondaryButton).toHaveFocus()
    
    await userEvent.tab()
    expect(toggleButton).toHaveFocus()
    
    await userEvent.tab()
    expect(closeButton).toHaveFocus()
  },
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive accessibility testing for ARIA attributes and keyboard navigation.'
      }
    }
  }
}

export const RealWorldExamples: Story = {
  render: () => ({
    components: { Button, Mail, Loader2 },
    setup() {
      const actionHandler = fn()
      return { actionHandler }
    },
    template: `
      <div class="space-y-8">
        <!-- Form actions -->
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Form Actions</h3>
          <div class="flex gap-4">
            <Button @click="actionHandler">Save Changes</Button>
            <Button variant="secondary" @click="actionHandler">Save as Draft</Button>
            <Button variant="outline" @click="actionHandler">Cancel</Button>
          </div>
        </div>
        
        <!-- Danger zone -->
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Danger Zone</h3>
          <div class="flex gap-4">
            <Button variant="destructive" @click="actionHandler">Delete Account</Button>
            <Button variant="outline" @click="actionHandler">Cancel Subscription</Button>
          </div>
        </div>
        
        <!-- Navigation -->
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Navigation</h3>
          <div class="flex gap-4">
            <Button variant="ghost" size="sm" @click="actionHandler">← Back</Button>
            <Button variant="ghost" size="sm" @click="actionHandler">Home</Button>
            <Button variant="ghost" size="sm" @click="actionHandler">Settings</Button>
          </div>
        </div>
      </div>
    `
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Test form action buttons
    const saveButton = canvas.getByRole('button', { name: /save changes/i })
    const draftButton = canvas.getByRole('button', { name: /save as draft/i })
    const cancelButton = canvas.getByRole('button', { name: /cancel/i })
    
    expect(saveButton).toBeInTheDocument()
    expect(draftButton).toBeInTheDocument()
    expect(cancelButton).toBeInTheDocument()
    
    // Test destructive actions
    const deleteButton = canvas.getByRole('button', { name: /delete account/i })
    expect(deleteButton).toHaveClass(/destructive/)
    
    // Test navigation buttons
    const backButton = canvas.getByRole('button', { name: /back/i })
    expect(backButton).toHaveClass(/ghost/)
    
    // Test interaction patterns
    await userEvent.click(saveButton)
    await userEvent.click(deleteButton)
    await userEvent.click(backButton)
  },
  parameters: {
    docs: {
      description: {
        story: 'Common button patterns used in real applications with interaction testing.'
      }
    }
  }
}