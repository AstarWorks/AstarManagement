import type { Meta, StoryObj } from '@storybook/vue3'
import { Alert, AlertDescription, AlertTitle } from './index'
import { AlertCircle, Terminal, CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-vue-next'

const meta = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
      description: 'The visual style of the alert'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'Alert component for displaying important messages with various severity levels.'
      }
    }
  }
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

// Default alert
export const Default: Story = {
  render: () => ({
    components: { Alert, AlertDescription, AlertTitle, Terminal },
    template: `
      <Alert>
        <Terminal class="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          You can add components to your app using the cli.
        </AlertDescription>
      </Alert>
    `
  })
}

// Destructive alert
export const Destructive: Story = {
  render: () => ({
    components: { Alert, AlertDescription, AlertTitle, AlertCircle },
    template: `
      <Alert variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Your session has expired. Please log in again.
        </AlertDescription>
      </Alert>
    `
  })
}

// All variants
export const AllVariants: Story = {
  render: () => ({
    components: { 
      Alert, 
      AlertDescription, 
      AlertTitle, 
      Info,
      CheckCircle2,
      AlertTriangle,
      XCircle
    },
    template: `
      <div class="space-y-4">
        <Alert>
          <Info class="h-4 w-4" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            This is an informational alert to provide context or additional details.
          </AlertDescription>
        </Alert>
        
        <Alert class="border-green-500/50 text-green-600 dark:text-green-400 [&>svg]:text-green-600 dark:[&>svg]:text-green-400">
          <CheckCircle2 class="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            Your changes have been saved successfully.
          </AlertDescription>
        </Alert>
        
        <Alert class="border-yellow-500/50 text-yellow-600 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400">
          <AlertTriangle class="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            This action may have unintended consequences. Please review before proceeding.
          </AlertDescription>
        </Alert>
        
        <Alert variant="destructive">
          <XCircle class="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to save changes. Please try again or contact support.
          </AlertDescription>
        </Alert>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Different alert variants for various message types.'
      }
    }
  }
}

// Without title
export const WithoutTitle: Story = {
  render: () => ({
    components: { Alert, AlertDescription, Info },
    template: `
      <Alert>
        <Info class="h-4 w-4" />
        <AlertDescription>
          This is a simple alert message without a title. It's useful for brief notifications.
        </AlertDescription>
      </Alert>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Alert without a title for simpler messages.'
      }
    }
  }
}

// Legal context alerts
export const LegalContextAlerts: Story = {
  render: () => ({
    components: { 
      Alert, 
      AlertDescription, 
      AlertTitle, 
      AlertCircle,
      AlertTriangle,
      CheckCircle2,
      Info
    },
    template: `
      <div class="space-y-4">
        <Alert variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>Urgent: Court Deadline</AlertTitle>
          <AlertDescription>
            Motion response due by 5:00 PM today. Failure to file may result in case dismissal.
          </AlertDescription>
        </Alert>
        
        <Alert class="border-yellow-500/50 text-yellow-600 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400">
          <AlertTriangle class="h-4 w-4" />
          <AlertTitle>Document Review Required</AlertTitle>
          <AlertDescription>
            Client has uploaded new evidence documents. Please review before the hearing on March 15th.
          </AlertDescription>
        </Alert>
        
        <Alert>
          <Info class="h-4 w-4" />
          <AlertTitle>Case Update</AlertTitle>
          <AlertDescription>
            Opposing counsel has requested a settlement conference. Meeting scheduled for next Tuesday at 2:00 PM.
          </AlertDescription>
        </Alert>
        
        <Alert class="border-green-500/50 text-green-600 dark:text-green-400 [&>svg]:text-green-600 dark:[&>svg]:text-green-400">
          <CheckCircle2 class="h-4 w-4" />
          <AlertTitle>Filing Successful</AlertTitle>
          <AlertDescription>
            Motion for Summary Judgment filed successfully. Court confirmation number: 2025-CV-0042-MSJ-001
          </AlertDescription>
        </Alert>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Alert examples for legal case management scenarios.'
      }
    }
  }
}

// With actions
export const WithActions: Story = {
  render: () => ({
    components: { Alert, AlertDescription, AlertTitle, AlertTriangle, Button: () => import('../button').then(m => m.Button) },
    template: `
      <Alert class="border-yellow-500/50 text-yellow-600 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400">
        <AlertTriangle class="h-4 w-4" />
        <AlertTitle>Action Required</AlertTitle>
        <AlertDescription class="flex items-center justify-between">
          <span>Your subscription will expire in 3 days.</span>
          <div class="flex gap-2 ml-4">
            <Button size="sm" variant="outline">Remind Later</Button>
            <Button size="sm">Renew Now</Button>
          </div>
        </AlertDescription>
      </Alert>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Alert with action buttons for user interaction.'
      }
    }
  }
}

// Dismissible alerts
export const Dismissible: Story = {
  render: () => ({
    components: { Alert, AlertDescription, AlertTitle, Info, XCircle },
    setup() {
      const alerts = ref([
        { id: 1, title: 'New Feature', message: 'Check out our new document automation features!' },
        { id: 2, title: 'Maintenance', message: 'System maintenance scheduled for Sunday 2:00 AM.' },
        { id: 3, title: 'Update Available', message: 'A new version is available with bug fixes.' }
      ])
      
      const dismissAlert = (id: number) => {
        alerts.value = alerts.value.filter(alert => alert.id !== id)
      }
      
      return { alerts, dismissAlert }
    },
    template: `
      <div class="space-y-4">
        <TransitionGroup name="list" tag="div" class="space-y-4">
          <Alert v-for="alert in alerts" :key="alert.id" class="relative">
            <Info class="h-4 w-4" />
            <AlertTitle>{{ alert.title }}</AlertTitle>
            <AlertDescription>
              {{ alert.message }}
            </AlertDescription>
            <button
              @click="dismissAlert(alert.id)"
              class="absolute top-2 right-2 p-1 rounded-md hover:bg-muted"
            >
              <XCircle class="h-4 w-4" />
            </button>
          </Alert>
        </TransitionGroup>
        
        <p v-if="alerts.length === 0" class="text-sm text-muted-foreground text-center py-8">
          All alerts dismissed
        </p>
      </div>
      
      <style scoped>
      .list-enter-active,
      .list-leave-active {
        transition: all 0.3s ease;
      }
      .list-enter-from {
        opacity: 0;
        transform: translateX(-30px);
      }
      .list-leave-to {
        opacity: 0;
        transform: translateX(30px);
      }
      </style>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Dismissible alerts with smooth transitions.'
      }
    }
  }
}

// Complex content
export const ComplexContent: Story = {
  render: () => ({
    components: { Alert, AlertDescription, AlertTitle, AlertCircle },
    template: `
      <Alert variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Multiple Validation Errors</AlertTitle>
        <AlertDescription>
          <p class="mb-2">Please fix the following errors before submitting:</p>
          <ul class="list-disc list-inside space-y-1 text-sm">
            <li>Case number format is invalid (expected: YYYY-TT-NNNN)</li>
            <li>Client name is required</li>
            <li>At least one document must be attached</li>
            <li>Filing date cannot be in the future</li>
          </ul>
          <div class="mt-3 flex gap-2">
            <a href="#" class="text-sm underline hover:no-underline">
              View documentation
            </a>
            <span class="text-sm">•</span>
            <a href="#" class="text-sm underline hover:no-underline">
              Get help
            </a>
          </div>
        </AlertDescription>
      </Alert>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Alert with complex content including lists and links.'
      }
    }
  }
}

// Compact alerts
export const CompactAlerts: Story = {
  render: () => ({
    components: { Alert, AlertDescription, Info, CheckCircle2, AlertTriangle },
    template: `
      <div class="space-y-2">
        <Alert class="py-2">
          <Info class="h-3 w-3" />
          <AlertDescription class="text-xs">
            Quick tip: Use keyboard shortcuts to navigate faster
          </AlertDescription>
        </Alert>
        
        <Alert class="py-2 border-green-500/50 text-green-600 dark:text-green-400 [&>svg]:text-green-600 dark:[&>svg]:text-green-400">
          <CheckCircle2 class="h-3 w-3" />
          <AlertDescription class="text-xs">
            Auto-save enabled
          </AlertDescription>
        </Alert>
        
        <Alert class="py-2 border-yellow-500/50 text-yellow-600 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400">
          <AlertTriangle class="h-3 w-3" />
          <AlertDescription class="text-xs">
            Limited connectivity - some features may be unavailable
          </AlertDescription>
        </Alert>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Compact alerts for less intrusive notifications.'
      }
    }
  }
}