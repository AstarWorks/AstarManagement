import type { Meta, StoryObj } from '@storybook/vue3'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import MatterCard from '../components/kanban/MatterCard.vue'
import KanbanBoard from '../components/kanban/KanbanBoard.vue'
import { DEFAULT_KANBAN_COLUMNS, DEFAULT_VIEW_PREFERENCES } from '~/constants/kanban'

const meta: Meta = {
  title: 'Visual Regression/All Components',
  parameters: {
    layout: 'padded',
    screenshot: true, // Enable screenshots for all stories in this file
    docs: {
      description: {
        component: 'Visual regression testing for all UI components. These stories capture screenshots to detect visual changes.'
      }
    }
  },
  tags: ['test']
}

export default meta
type Story = StoryObj<typeof meta>

// Sample data for components
const sampleMatter = {
  id: 'visual-test-1',
  caseNumber: '2025-VT-0001',
  title: 'Visual Regression Test Matter',
  clientName: 'Test Client Corp',
  opponentName: 'Test Opponent Inc',
  status: 'INTAKE' as const,
  priority: 'HIGH' as const,
  dueDate: '2025-07-15T10:00:00Z',
  createdAt: '2025-06-15T10:00:00Z',
  updatedAt: '2025-06-17T05:00:00Z',
  statusDuration: 2,
  assignedLawyer: {
    id: 'lawyer1',
    name: 'John Lawyer',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
  },
  assignedClerk: {
    id: 'clerk1',
    name: 'Jane Clerk',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face'
  },
  relatedDocuments: 8,
  tags: ['visual-test', 'regression']
}

// Visual regression test for basic UI components
export const BasicComponents: Story = {
  render: () => ({
    components: { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Alert, AlertDescription },
    template: `
      <div class="space-y-8 max-w-4xl">
        <!-- Buttons Section -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Buttons</h2>
          <div class="flex gap-4 flex-wrap">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div class="flex gap-4 flex-wrap">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">×</Button>
          </div>
          <div class="flex gap-4 flex-wrap">
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>Disabled Secondary</Button>
          </div>
        </div>

        <!-- Inputs Section -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Inputs</h2>
          <div class="grid grid-cols-2 gap-4 max-w-lg">
            <Input placeholder="Text input" />
            <Input type="email" placeholder="Email input" />
            <Input type="password" placeholder="Password input" />
            <Input type="number" placeholder="Number input" />
            <Input disabled placeholder="Disabled input" />
            <Input readonly value="Readonly input" />
          </div>
        </div>

        <!-- Cards Section -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Cards</h2>
          <div class="grid grid-cols-2 gap-4 max-w-lg">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description text</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Card content goes here</p>
              </CardContent>
            </Card>
            <Card class="border-dashed">
              <CardHeader>
                <CardTitle>Dashed Border</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Alternative card style</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Badges Section -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Badges</h2>
          <div class="flex gap-2 flex-wrap">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </div>

        <!-- Alerts Section -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Alerts</h2>
          <div class="space-y-2 max-w-lg">
            <Alert>
              <AlertDescription>
                This is a default alert message.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertDescription>
                This is a destructive alert message.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Visual regression test capturing all basic UI component variants and states.'
      }
    }
  }
}

// Visual regression test for kanban components
export const KanbanComponents: Story = {
  render: () => ({
    components: { MatterCard, KanbanBoard },
    setup() {
      return { 
        sampleMatter, 
        viewPreferences: DEFAULT_VIEW_PREFERENCES,
        kanbanColumns: DEFAULT_KANBAN_COLUMNS.slice(0, 3), // Only show 3 columns for visual test
        matters: [
          { ...sampleMatter, id: '1', status: 'INTAKE' },
          { ...sampleMatter, id: '2', status: 'INVESTIGATION', priority: 'MEDIUM' },
          { ...sampleMatter, id: '3', status: 'FILED', priority: 'LOW' }
        ]
      }
    },
    template: `
      <div class="space-y-8">
        <!-- Matter Cards Section -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Matter Cards</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
            <MatterCard 
              :matter="{ ...sampleMatter, priority: 'HIGH' }" 
              :viewPreferences="viewPreferences" 
            />
            <MatterCard 
              :matter="{ ...sampleMatter, priority: 'MEDIUM', id: 'visual-2' }" 
              :viewPreferences="viewPreferences" 
            />
            <MatterCard 
              :matter="{ ...sampleMatter, priority: 'LOW', id: 'visual-3' }" 
              :viewPreferences="viewPreferences" 
            />
          </div>
        </div>

        <!-- Kanban Board Section -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Kanban Board</h2>
          <div class="h-96 border rounded-lg overflow-hidden">
            <KanbanBoard 
              :columns="kanbanColumns"
              :matters="matters"
              title="Visual Test Board"
              :showJapanese="false"
            />
          </div>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Visual regression test for kanban components including matter cards and board layout.'
      }
    }
  }
}

// Dark mode visual regression test
export const DarkMode: Story = {
  render: () => ({
    components: { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge },
    template: `
      <div class="dark bg-gray-900 p-8 min-h-screen">
        <div class="space-y-8 max-w-4xl text-white">
          <h1 class="text-3xl font-bold">Dark Mode Components</h1>
          
          <!-- Buttons in Dark Mode -->
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Buttons</h2>
            <div class="flex gap-4 flex-wrap">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>

          <!-- Inputs in Dark Mode -->
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Inputs</h2>
            <div class="grid grid-cols-2 gap-4 max-w-lg">
              <Input placeholder="Dark mode input" />
              <Input type="email" placeholder="Email in dark" />
            </div>
          </div>

          <!-- Cards in Dark Mode -->
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Cards</h2>
            <Card class="max-w-sm">
              <CardHeader>
                <CardTitle>Dark Mode Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Card content in dark theme</p>
              </CardContent>
            </Card>
          </div>

          <!-- Badges in Dark Mode -->
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Badges</h2>
            <div class="flex gap-2 flex-wrap">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>
        </div>
      </div>
    `
  }),
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    docs: {
      description: {
        story: 'Visual regression test for dark mode theme across all components.'
      }
    }
  }
}

// Mobile responsive visual regression test
export const MobileResponsive: Story = {
  render: () => ({
    components: { Button, Input, Card, CardContent, CardHeader, CardTitle, MatterCard },
    setup() {
      return { sampleMatter, viewPreferences: DEFAULT_VIEW_PREFERENCES }
    },
    template: `
      <div class="space-y-6 px-4">
        <h1 class="text-2xl font-bold text-center">Mobile Layout</h1>
        
        <!-- Mobile Button Layout -->
        <div class="space-y-3">
          <h2 class="text-lg font-semibold">Buttons</h2>
          <div class="flex flex-col gap-2">
            <Button class="w-full">Full Width Button</Button>
            <Button variant="outline" class="w-full">Outline Button</Button>
          </div>
          <div class="flex gap-2">
            <Button size="sm" class="flex-1">Small</Button>
            <Button size="sm" variant="secondary" class="flex-1">Secondary</Button>
          </div>
        </div>

        <!-- Mobile Input Layout -->
        <div class="space-y-3">
          <h2 class="text-lg font-semibold">Form Inputs</h2>
          <div class="space-y-2">
            <Input placeholder="Mobile text input" />
            <Input type="email" placeholder="Email input" />
            <Input type="tel" placeholder="Phone number" />
          </div>
        </div>

        <!-- Mobile Card Layout -->
        <div class="space-y-3">
          <h2 class="text-lg font-semibold">Cards</h2>
          <Card>
            <CardHeader>
              <CardTitle>Mobile Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Card optimized for mobile viewing</p>
            </CardContent>
          </Card>
        </div>

        <!-- Mobile Matter Card -->
        <div class="space-y-3">
          <h2 class="text-lg font-semibold">Matter Card</h2>
          <MatterCard 
            :matter="sampleMatter" 
            :viewPreferences="{ ...viewPreferences, cardSize: 'compact' }" 
          />
        </div>
      </div>
    `
  }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Visual regression test for mobile responsive layouts and components.'
      }
    }
  }
}

// Error states visual regression test
export const ErrorStates: Story = {
  render: () => ({
    components: { Button, Input, Card, CardContent, CardHeader, CardTitle, Alert, AlertDescription },
    template: `
      <div class="space-y-8 max-w-2xl">
        <h1 class="text-3xl font-bold text-red-600">Error States</h1>
        
        <!-- Input Error States -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Input Errors</h2>
          <div class="space-y-3">
            <div>
              <Input 
                placeholder="Invalid email" 
                class="border-red-500 focus:ring-red-500" 
                value="invalid-email" 
              />
              <p class="text-sm text-red-600 mt-1">Please enter a valid email address</p>
            </div>
            <div>
              <Input 
                placeholder="Required field" 
                class="border-red-500 focus:ring-red-500" 
              />
              <p class="text-sm text-red-600 mt-1">This field is required</p>
            </div>
          </div>
        </div>

        <!-- Button Error States -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Button States</h2>
          <div class="flex gap-4 flex-wrap">
            <Button variant="destructive">Delete Account</Button>
            <Button variant="destructive" disabled>Processing...</Button>
            <Button variant="outline" class="border-red-500 text-red-600">Cancel Operation</Button>
          </div>
        </div>

        <!-- Error Cards -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Error Cards</h2>
          <Card class="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle class="text-red-800">Error Occurred</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-red-700">Something went wrong while processing your request.</p>
            </CardContent>
          </Card>
        </div>

        <!-- Error Alerts -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Error Alerts</h2>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to save changes. Please try again.
            </AlertDescription>
          </Alert>
          <Alert>
            <AlertDescription>
              Warning: This action cannot be undone.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Visual regression test for error states and validation messages across components.'
      }
    }
  }
}