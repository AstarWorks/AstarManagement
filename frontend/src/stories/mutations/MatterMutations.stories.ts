/**
 * Storybook Stories for Enhanced Matter Mutations
 * 
 * @description Interactive examples demonstrating TanStack Query enhanced
 * mutations with validation, offline support, and error handling
 * 
 * @author Claude
 * @created 2025-06-25
 */

import type { Meta, StoryObj } from '@storybook/vue3'
import { action } from '@storybook/addon-actions'
import { within, userEvent, expect } from '@storybook/test'
import { ref, reactive } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import MatterMutationDemo from './MatterMutationDemo.vue'

// Mock the Nuxt composables for Storybook
const mockToast = {
  success: action('toast.success'),
  error: action('toast.error'),
  warning: action('toast.warning'),
  info: action('toast.info')
}

const mockFetch = async (url: string, options: any = {}) => {
  const method = options.method || 'GET'
  const body = options.body
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Mock responses based on the request
  if (method === 'POST' && url === '/api/matters') {
    if (body?.title === 'VALIDATION_ERROR') {
      throw new Error('Validation failed')
    }
    if (body?.title === 'NETWORK_ERROR') {
      throw new Error('Network error')
    }
    
    return {
      id: `matter-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
  
  if (method === 'PATCH' && url.includes('/api/matters/')) {
    const id = url.split('/').pop()
    return {
      id,
      ...body,
      updatedAt: new Date().toISOString()
    }
  }
  
  if (method === 'DELETE' && url.includes('/api/matters/')) {
    return null
  }
  
  return {}
}

// Create a decorator that provides TanStack Query
const withVueQuery = (story: any) => ({
  components: { story },
  setup() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    
    // Provide mocks through the app context
    const nuxtApp = {
      $toast: mockToast,
      $fetch: mockFetch
    }
    
    // Mock useNuxtApp globally
    ;(globalThis as any).useNuxtApp = () => nuxtApp
    
    return { queryClient }
  },
  template: '<story />'
})

const meta: Meta<typeof MatterMutationDemo> = {
  title: 'Mutations/Matter Mutations',
  component: MatterMutationDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Enhanced Matter Mutations Demo

This story demonstrates the advanced mutation patterns implemented for legal matter management:

## Features Demonstrated

### 1. **Enhanced Create Matter**
- Real-time validation with Zod schemas
- Optimistic updates with immediate UI feedback
- Error handling with toast notifications
- Offline support with mutation queueing

### 2. **Enhanced Update Matter**
- Conflict detection for concurrent modifications
- Field-level validation
- Optimistic updates with rollback on failure
- Success/error feedback

### 3. **Enhanced Delete Matter**
- Soft delete with 30-second undo window
- Confirmation dialogs
- Cascade handling for related data
- Animation feedback

### 4. **Enhanced Move Matter**
- Drag and drop status changes
- Performance tracking
- Validation of status transitions
- Real-time UI updates

### 5. **Offline Support**
- Automatic mutation queueing when offline
- Background synchronization when online
- Progress feedback and error recovery
- Retry logic with exponential backoff

## Testing Scenarios

Use the controls to test different scenarios:
- **Normal Operations**: Standard CRUD operations
- **Validation Errors**: Invalid input handling
- **Network Errors**: Connection failure simulation
- **Offline Mode**: Offline behavior testing
- **Conflict Resolution**: Concurrent update handling

## Analytics

The demo includes real-time analytics showing:
- Total mutations performed
- Success/failure rates
- Average response times
- Mutation type distribution
        `
      }
    }
  },
  decorators: [withVueQuery],
  argTypes: {
    simulateOffline: {
      control: 'boolean',
      description: 'Simulate offline mode for testing'
    },
    simulateSlowNetwork: {
      control: 'boolean', 
      description: 'Add network latency to mutations'
    },
    enableAnalytics: {
      control: 'boolean',
      description: 'Show mutation analytics panel'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    simulateOffline: false,
    simulateSlowNetwork: false,
    enableAnalytics: true
  }
}

export const CreateMatter: Story = {
  args: {
    simulateOffline: false,
    simulateSlowNetwork: false,
    enableAnalytics: true
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Find the create form
    const titleInput = canvas.getByLabelText(/matter title/i)
    const prioritySelect = canvas.getByLabelText(/priority/i)
    const createButton = canvas.getByRole('button', { name: /create matter/i })
    
    // Fill out the form
    await userEvent.type(titleInput, 'Test Legal Matter')
    await userEvent.selectOptions(prioritySelect, 'HIGH')
    
    // Submit the form
    await userEvent.click(createButton)
    
    // Verify the loading state
    expect(createButton).toBeDisabled()
  }
}

export const ValidationErrors: Story = {
  args: {
    simulateOffline: false,
    simulateSlowNetwork: false,
    enableAnalytics: true
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const titleInput = canvas.getByLabelText(/matter title/i)
    const createButton = canvas.getByRole('button', { name: /create matter/i })
    
    // Enter invalid data
    await userEvent.type(titleInput, 'AB') // Too short
    await userEvent.click(createButton)
    
    // Should show validation error
    expect(canvas.getByText(/must be at least 3 characters/i)).toBeInTheDocument()
  }
}

export const NetworkError: Story = {
  args: {
    simulateOffline: false,
    simulateSlowNetwork: true,
    enableAnalytics: true
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const titleInput = canvas.getByLabelText(/matter title/i)
    const prioritySelect = canvas.getByLabelText(/priority/i)
    const createButton = canvas.getByRole('button', { name: /create matter/i })
    
    // Trigger network error
    await userEvent.type(titleInput, 'NETWORK_ERROR')
    await userEvent.selectOptions(prioritySelect, 'HIGH')
    await userEvent.click(createButton)
    
    // Should handle error gracefully
    await expect(canvas.findByText(/connection issue/i)).resolves.toBeInTheDocument()
  }
}

export const OfflineMode: Story = {
  args: {
    simulateOffline: true,
    simulateSlowNetwork: false,
    enableAnalytics: true
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should show offline indicator
    expect(canvas.getByText(/offline/i)).toBeInTheDocument()
    
    const titleInput = canvas.getByLabelText(/matter title/i)
    const prioritySelect = canvas.getByLabelText(/priority/i)
    const createButton = canvas.getByRole('button', { name: /create matter/i })
    
    // Create matter while offline
    await userEvent.type(titleInput, 'Offline Matter')
    await userEvent.selectOptions(prioritySelect, 'MEDIUM')
    await userEvent.click(createButton)
    
    // Should queue for later sync
    await expect(canvas.findByText(/will sync when connection is restored/i)).resolves.toBeInTheDocument()
  }
}

export const UpdateMatter: Story = {
  args: {
    simulateOffline: false,
    simulateSlowNetwork: false,
    enableAnalytics: true
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // First create a matter
    const titleInput = canvas.getByLabelText(/matter title/i)
    const prioritySelect = canvas.getByLabelText(/priority/i)
    const createButton = canvas.getByRole('button', { name: /create matter/i })
    
    await userEvent.type(titleInput, 'Matter to Update')
    await userEvent.selectOptions(prioritySelect, 'LOW')
    await userEvent.click(createButton)
    
    // Wait for creation to complete
    await canvas.findByText(/matter created/i)
    
    // Find the matter in the list and update it
    const updateButton = canvas.getByRole('button', { name: /edit/i })
    await userEvent.click(updateButton)
    
    // Update the priority
    const editPrioritySelect = canvas.getByDisplayValue(/low/i)
    await userEvent.selectOptions(editPrioritySelect, 'HIGH')
    
    const saveButton = canvas.getByRole('button', { name: /save/i })
    await userEvent.click(saveButton)
    
    // Should show success message
    await expect(canvas.findByText(/matter updated/i)).resolves.toBeInTheDocument()
  }
}

export const DeleteMatter: Story = {
  args: {
    simulateOffline: false,
    simulateSlowNetwork: false,
    enableAnalytics: true
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Create a matter first
    const titleInput = canvas.getByLabelText(/matter title/i)
    const prioritySelect = canvas.getByLabelText(/priority/i)
    const createButton = canvas.getByRole('button', { name: /create matter/i })
    
    await userEvent.type(titleInput, 'Matter to Delete')
    await userEvent.selectOptions(prioritySelect, 'LOW')
    await userEvent.click(createButton)
    
    // Wait for creation
    await canvas.findByText(/matter created/i)
    
    // Delete the matter
    const deleteButton = canvas.getByRole('button', { name: /delete/i })
    await userEvent.click(deleteButton)
    
    // Should show confirmation and undo option
    await expect(canvas.findByText(/matter deleted/i)).resolves.toBeInTheDocument()
    await expect(canvas.findByText(/undo/i)).resolves.toBeInTheDocument()
  }
}

export const DragAndDrop: Story = {
  args: {
    simulateOffline: false,
    simulateSlowNetwork: false,
    enableAnalytics: true
  },
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates the drag and drop functionality for moving matters between different status columns.

**Features:**
- Smooth drag and drop interactions
- Optimistic updates during drag
- Automatic rollback on failure
- Performance tracking
- Status change notifications

**Usage:**
1. Create a few matters with different priorities
2. Drag matters between status columns (Draft → Active → Review → Completed)
3. Observe the optimistic updates and success notifications
4. Check the analytics panel for performance metrics
        `
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Create multiple matters for drag testing
    const titleInput = canvas.getByLabelText(/matter title/i)
    const prioritySelect = canvas.getByLabelText(/priority/i)
    const createButton = canvas.getByRole('button', { name: /create matter/i })
    
    // Create first matter
    await userEvent.type(titleInput, 'Draggable Matter 1')
    await userEvent.selectOptions(prioritySelect, 'HIGH')
    await userEvent.click(createButton)
    
    await canvas.findByText(/matter created/i)
    
    // Clear and create second matter
    await userEvent.clear(titleInput)
    await userEvent.type(titleInput, 'Draggable Matter 2')
    await userEvent.selectOptions(prioritySelect, 'MEDIUM')
    await userEvent.click(createButton)
    
    await canvas.findByText(/matter created/i)
    
    // The actual drag and drop would be tested in e2e tests
    // Here we simulate the status change
    const statusButtons = canvas.getAllByRole('button', { name: /move to/i })
    if (statusButtons.length > 0) {
      await userEvent.click(statusButtons[0])
      await expect(canvas.findByText(/status updated/i)).resolves.toBeInTheDocument()
    }
  }
}

export const Analytics: Story = {
  args: {
    simulateOffline: false,
    simulateSlowNetwork: true,
    enableAnalytics: true
  },
  parameters: {
    docs: {
      description: {
        story: `
This story focuses on the mutation analytics functionality, showing real-time metrics about mutation performance and success rates.

**Metrics Tracked:**
- Total mutations performed
- Success vs. failure rates
- Average response times
- Mutation type distribution (create, update, delete, move)
- Network condition impact

**Usage:**
1. Perform various mutations (create, update, delete)
2. Observe the analytics panel updating in real-time
3. Test with slow network to see latency impact
4. View success rates and performance trends
        `
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Perform multiple operations to generate analytics
    const titleInput = canvas.getByLabelText(/matter title/i)
    const prioritySelect = canvas.getByLabelText(/priority/i)
    const createButton = canvas.getByRole('button', { name: /create matter/i })
    
    // Create several matters to generate analytics data
    for (let i = 1; i <= 3; i++) {
      await userEvent.clear(titleInput)
      await userEvent.type(titleInput, `Analytics Test Matter ${i}`)
      await userEvent.selectOptions(prioritySelect, i % 2 === 0 ? 'HIGH' : 'LOW')
      await userEvent.click(createButton)
      
      // Wait for completion
      await canvas.findByText(/matter created/i)
    }
    
    // Check analytics panel
    const analyticsPanel = canvas.getByTestId('analytics-panel')
    expect(analyticsPanel).toBeInTheDocument()
    
    // Should show mutation counts
    expect(canvas.getByText(/total mutations: 3/i)).toBeInTheDocument()
  }
}