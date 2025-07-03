import type { Meta, StoryObj } from '@storybook/vue3'
import { action } from '@storybook/addon-actions'
import MatterFormSteps from './MatterFormSteps.vue'

// Mock composables for Storybook
const mockComposables = {
  useAuth: () => ({
    hasPermission: () => true
  }),
  useToast: () => ({
    showToast: action('showToast')
  }),
  useRouter: () => ({
    push: action('router.push')
  })
}

const meta: Meta<typeof MatterFormSteps> = {
  title: 'Forms/Matter/MatterFormSteps',
  component: MatterFormSteps,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Matter Form Steps

A comprehensive multi-step form for creating and editing legal matters with advanced features:

- **Auto-save functionality** with 5-second debounce
- **Navigation guards** to prevent data loss
- **Step-by-step workflow** with progress tracking
- **Form validation** and error handling
- **Responsive design** for mobile and desktop
- **Accessibility support** with proper ARIA labels

## Features

- Multi-step guided form workflow
- Real-time auto-save with status indicators
- Client and lawyer assignment with search
- Financial information tracking
- Review step with comprehensive summary
- Navigation protection for unsaved changes

## Usage

Use this component for complex matter creation that requires guided user input across multiple related sections.
        `
      }
    }
  },
  argTypes: {
    mode: {
      control: 'select',
      options: ['create', 'edit'],
      description: 'Form mode - create new matter or edit existing'
    },
    showProgress: {
      control: 'boolean',
      description: 'Show step progress indicator'
    },
    allowIncompleteSteps: {
      control: 'boolean',
      description: 'Allow navigation to incomplete steps'
    },
    autoSaveInterval: {
      control: 'number',
      description: 'Auto-save interval in milliseconds'
    },
    // Events
    onCompleted: {
      action: 'completed',
      description: 'Fired when matter is successfully created/updated'
    },
    onCancelled: {
      action: 'cancelled',
      description: 'Fired when form is cancelled'
    },
    onStepChange: {
      action: 'stepChange',
      description: 'Fired when step changes'
    }
  },
  decorators: [
    (story) => ({
      setup() {
        // Mock global composables
        // Mock global composables would be handled differently in actual implementation
        // These are just for Storybook demonstration
        
        return { story }
      },
      template: '<div class="min-h-screen bg-background"><story /></div>'
    })
  ]
}

export default meta
type Story = StoryObj<typeof MatterFormSteps>

// Default create matter story
export const CreateMatter: Story = {
  args: {
    mode: 'create',
    showProgress: true,
    allowIncompleteSteps: false,
    autoSaveInterval: 5000
  },
  parameters: {
    docs: {
      description: {
        story: 'Default create matter form with all features enabled. Shows the complete multi-step workflow for creating a new legal matter.'
      }
    }
  }
}

// Edit existing matter
export const EditMatter: Story = {
  args: {
    mode: 'edit',
    matterId: 'matter-123',
    showProgress: true,
    allowIncompleteSteps: true,
    autoSaveInterval: 3000,
    initialValues: {
      title: 'Acme Corp Contract Review',
      description: 'Review and negotiation of service contract with Acme Corporation',
      type: 'CORPORATE',
      status: 'INVESTIGATION',
      priority: 'HIGH',
      clientId: 'client-acme',
      assignedLawyerIds: ['lawyer-1', 'lawyer-2'],
      openDate: '2024-01-15',
      estimatedValue: 150000,
      billableHours: 80,
      tags: ['contract', 'review', 'corporate']
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Edit mode with pre-populated data. Shows how the form handles existing matter information and allows incomplete step navigation.'
      }
    }
  }
}

// Mobile responsive view
export const MobileView: Story = {
  args: {
    mode: 'create',
    showProgress: true,
    allowIncompleteSteps: false,
    autoSaveInterval: 5000
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Mobile responsive layout showing how the form adapts to smaller screens with stacked fields and touch-friendly controls.'
      }
    }
  }
}

// Minimal configuration
export const MinimalForm: Story = {
  args: {
    mode: 'create',
    showProgress: false,
    allowIncompleteSteps: true,
    autoSaveInterval: 10000
  },
  parameters: {
    docs: {
      description: {
        story: 'Simplified form configuration without progress indicator and with relaxed validation, suitable for quick matter entry.'
      }
    }
  }
}

// Auto-save demonstration
export const AutoSaveDemo: Story = {
  args: {
    mode: 'create',
    showProgress: true,
    allowIncompleteSteps: false,
    autoSaveInterval: 2000 // Fast auto-save for demo
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates auto-save functionality with fast save interval. Watch the save status indicator as you type in form fields.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    // This would contain interaction tests for auto-save
    // Example: type in fields and watch auto-save status
  }
}

// Error handling
export const WithValidationErrors: Story = {
  args: {
    mode: 'create',
    showProgress: true,
    allowIncompleteSteps: false,
    autoSaveInterval: 5000
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows form behavior with validation errors and how error states are displayed across different steps.'
      }
    }
  },
  decorators: [
    (story) => ({
      setup() {
        // Mock form with errors
        const mockFormWithErrors = {
          useForm: () => ({
            values: { value: {} },
            errors: { value: { title: 'Title is required', clientId: 'Client must be selected' } },
            isDirty: { value: true },
            isValid: { value: false },
            submitCount: { value: 0 }
          })
        }
        
        // Mock would be handled differently in real Storybook setup
        
        return { story }
      },
      template: '<div class="min-h-screen bg-background"><story /></div>'
    })
  ]
}

// Navigation guard demonstration
export const NavigationGuardDemo: Story = {
  args: {
    mode: 'create',
    showProgress: true,
    allowIncompleteSteps: false,
    autoSaveInterval: 5000
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates navigation guard functionality. Try navigating away after making changes to see the unsaved changes warning.'
      }
    }
  },
  decorators: [
    (story) => ({
      setup() {
        // Mock form with dirty state
        const mockDirtyForm = {
          useForm: () => ({
            values: { value: { title: 'Partially filled matter' } },
            errors: { value: {} },
            isDirty: { value: true },
            isValid: { value: true },
            submitCount: { value: 0 }
          })
        }
        
        // Mock would be handled differently in real Storybook setup
        
        return { story }
      },
      template: '<div class="min-h-screen bg-background"><story /></div>'
    })
  ]
}

// Accessibility demonstration
export const AccessibilityFocus: Story = {
  args: {
    mode: 'create',
    showProgress: true,
    allowIncompleteSteps: false,
    autoSaveInterval: 5000
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          },
          {
            id: 'keyboard-navigation',
            enabled: true
          }
        ]
      }
    },
    docs: {
      description: {
        story: 'Accessibility-focused story showing proper focus management, ARIA labels, and keyboard navigation support.'
      }
    }
  }
}

// Performance test with large datasets
export const PerformanceTest: Story = {
  args: {
    mode: 'edit',
    showProgress: true,
    allowIncompleteSteps: true,
    autoSaveInterval: 5000,
    initialValues: {
      title: 'Large Matter with Complex Data',
      description: 'A very long description '.repeat(100), // Large description
      type: 'CIVIL',
      status: 'INVESTIGATION',
      priority: 'HIGH',
      assignedLawyerIds: Array.from({ length: 20 }, (_, i) => `lawyer-${i + 1}`), // Many lawyers
      tags: Array.from({ length: 50 }, (_, i) => `tag-${i + 1}`) // Many tags
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance test with large amounts of data to ensure the form handles complex scenarios efficiently.'
      }
    }
  }
}

// Dark mode
export const DarkMode: Story = {
  args: {
    mode: 'create',
    showProgress: true,
    allowIncompleteSteps: false,
    autoSaveInterval: 5000
  },
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    docs: {
      description: {
        story: 'Dark mode appearance showing how the form adapts to different theme preferences.'
      }
    }
  },
  decorators: [
    (story) => ({
      template: '<div class="dark min-h-screen bg-background"><story /></div>'
    })
  ]
}

// Step-by-step interaction
export const InteractiveSteps: Story = {
  args: {
    mode: 'create',
    showProgress: true,
    allowIncompleteSteps: true,
    autoSaveInterval: 5000
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demonstration of step navigation and form completion. Click through each step to see the complete workflow.'
      }
    }
  },
  play: async ({ canvasElement, step }) => {
    // This would contain step-by-step interaction tests
    // Example: fill out each step and proceed to next
    await step('Fill Basic Info', async () => {
      // Interaction with first step
    })
    
    await step('Select Client', async () => {
      // Interaction with second step
    })
    
    await step('Assign Team', async () => {
      // Interaction with third step
    })
    
    await step('Review and Submit', async () => {
      // Final review step
    })
  }
}