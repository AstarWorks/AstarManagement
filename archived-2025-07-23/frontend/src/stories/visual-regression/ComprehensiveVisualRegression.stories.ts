/**
 * Comprehensive Visual Regression Testing Stories
 * 
 * This file contains comprehensive visual regression test scenarios covering
 * all major UI components, responsive breakpoints, theme variations, and
 * component states for the Aster Management Nuxt.js POC.
 */

import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within, userEvent } from '@storybook/test'

// UI Components
import Button from '~/components/ui/button/Button.vue'
import Card from '~/components/ui/card/Card.vue'
import CardContent from '~/components/ui/card/CardContent.vue'
import CardHeader from '~/components/ui/card/CardHeader.vue'
import CardTitle from '~/components/ui/card/CardTitle.vue'
import Badge from '~/components/ui/badge/Badge.vue'
import Alert from '~/components/ui/alert/Alert.vue'
import AlertDescription from '~/components/ui/alert/AlertDescription.vue'
import Input from '~/components/ui/input/Input.vue'
import Label from '~/components/ui/label/Label.vue'
import Checkbox from '~/components/ui/checkbox/Checkbox.vue'
import Switch from '~/components/ui/switch/Switch.vue'
import Avatar from '~/components/ui/avatar/Avatar.vue'
import AvatarImage from '~/components/ui/avatar/AvatarImage.vue'
import AvatarFallback from '~/components/ui/avatar/AvatarFallback.vue'

// Kanban Components
import KanbanBoard from '~/components/kanban/KanbanBoard.vue'
import MatterCard from '~/components/kanban/MatterCard.vue'

// Mock data for consistent visual testing
const VISUAL_TEST_MATTERS = [
  {
    id: 'VISUAL-001',
    title: 'Contract Review - Visual Test',
    description: 'Sample matter for visual regression testing purposes',
    status: 'INTAKE',
    priority: 'HIGH',
    assignee: {
      id: 'user-1',
      name: 'Visual Tester',
      email: 'visual@test.com',
      avatar: '/avatars/tester.jpg'
    },
    client: {
      id: 'client-1',
      name: 'Test Client Inc.'
    },
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-16T14:30:00Z'),
    dueDate: new Date('2024-02-15T17:00:00Z'),
    tags: ['Contract', 'Corporate', 'Urgent']
  },
  {
    id: 'VISUAL-002',
    title: 'Litigation Support',
    description: 'Complex litigation matter for UI testing',
    status: 'INVESTIGATION',
    priority: 'MEDIUM',
    assignee: {
      id: 'user-2',
      name: 'Senior Lawyer',
      email: 'senior@firm.com',
      avatar: null
    },
    client: {
      id: 'client-2',
      name: 'Corporate Client LLC'
    },
    createdAt: new Date('2024-01-10T09:00:00Z'),
    updatedAt: new Date('2024-01-17T11:45:00Z'),
    dueDate: new Date('2024-03-01T17:00:00Z'),
    tags: ['Litigation', 'Discovery']
  },
  {
    id: 'VISUAL-003',
    title: 'Compliance Review',
    description: 'Routine compliance matter',
    status: 'COMPLETE',
    priority: 'LOW',
    assignee: {
      id: 'user-3',
      name: 'Junior Associate',
      email: 'junior@firm.com',
      avatar: '/avatars/junior.jpg'
    },
    client: {
      id: 'client-3',
      name: 'Small Business Co.'
    },
    createdAt: new Date('2024-01-05T08:00:00Z'),
    updatedAt: new Date('2024-01-18T16:00:00Z'),
    dueDate: new Date('2024-01-20T17:00:00Z'),
    tags: ['Compliance', 'Routine']
  }
]

const meta: Meta = {
  title: 'Visual Regression/Comprehensive',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Comprehensive visual regression testing for all UI components across themes and viewports.'
      }
    },
    screenshot: true,
    // Specific visual testing parameters
    visualRegression: {
      themes: ['light', 'dark'],
      breakpoints: ['mobile', 'tablet', 'desktop'],
      maskSelectors: [
        '[data-testid="dynamic-timestamp"]',
        '[data-testid="matter-id"]'
      ]
    }
  },
  tags: ['visual', 'regression', 'test']
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Basic UI Components Grid
 * Tests all fundamental UI components in a grid layout
 */
export const BasicUIComponents: Story = {
  render: () => ({
    components: {
      Button,
      Card,
      CardContent,
      CardHeader,
      CardTitle,
      Badge,
      Alert,
      AlertDescription,
      Input,
      Label,
      Checkbox,
      Switch,
      Avatar,
      AvatarImage,
      AvatarFallback
    },
    template: `
      <div class="p-8 space-y-8 bg-background min-h-screen">
        <!-- Header -->
        <div class="text-center space-y-2">
          <h1 class="text-3xl font-bold">UI Components Visual Test</h1>
          <p class="text-muted-foreground">Comprehensive component showcase for visual regression testing</p>
        </div>
        
        <!-- Buttons Section -->
        <Card>
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
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
              <Button size="icon">🔍</Button>
            </div>
            <div class="flex gap-4 flex-wrap">
              <Button disabled>Disabled</Button>
              <Button loading>Loading</Button>
            </div>
          </CardContent>
        </Card>
        
        <!-- Form Elements Section -->
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
              <div class="space-y-2">
                <Label for="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter password" />
              </div>
            </div>
            <div class="flex gap-4 items-center">
              <div class="flex items-center space-x-2">
                <Checkbox id="terms" />
                <Label for="terms">Accept terms and conditions</Label>
              </div>
              <div class="flex items-center space-x-2">
                <Switch id="notifications" />
                <Label for="notifications">Enable notifications</Label>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Badges and Alerts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Badge Variants</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="flex gap-2 flex-wrap">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
              <div class="flex gap-2 flex-wrap">
                <Badge variant="default">HIGH</Badge>
                <Badge variant="secondary">MEDIUM</Badge>
                <Badge variant="outline">LOW</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>User Avatars</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="flex gap-4 items-center">
                <Avatar>
                  <AvatarImage src="/avatars/01.png" alt="User 1" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarImage src="/avatars/02.png" alt="User 2" />
                  <AvatarFallback>AB</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>CD</AvatarFallback>
                </Avatar>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <!-- Alerts Section -->
        <div class="space-y-4">
          <Alert>
            <AlertDescription>
              This is a default alert message for visual testing.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertDescription>
              This is a destructive alert message showing an error state.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    `
  }),
  parameters: {
    viewport: { defaultViewport: 'desktop' }
  }
}

/**
 * Kanban Board Layout
 * Tests the complete Kanban board with matter cards
 */
export const KanbanBoardLayout: Story = {
  render: () => ({
    components: { KanbanBoard },
    setup() {
      const columns = [
        { id: 'INTAKE', title: 'Intake', matters: [VISUAL_TEST_MATTERS[0]] },
        { id: 'INVESTIGATION', title: 'Investigation', matters: [VISUAL_TEST_MATTERS[1]] },
        { id: 'COMPLETE', title: 'Complete', matters: [VISUAL_TEST_MATTERS[2]] }
      ]
      
      return { columns, matters: VISUAL_TEST_MATTERS }
    },
    template: `
      <div class="h-screen bg-background">
        <KanbanBoard 
          :columns="columns"
          :matters="matters"
          @matter-move="() => {}"
          @matter-select="() => {}"
        />
      </div>
    `
  }),
  parameters: {
    viewport: { defaultViewport: 'desktop' }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Verify kanban board is rendered
    const kanbanBoard = canvas.getByRole('main')
    expect(kanbanBoard).toBeInTheDocument()
    
    // Verify all columns are present
    const intakeColumn = canvas.getByText('Intake')
    const investigationColumn = canvas.getByText('Investigation')
    const completeColumn = canvas.getByText('Complete')
    
    expect(intakeColumn).toBeInTheDocument()
    expect(investigationColumn).toBeInTheDocument()
    expect(completeColumn).toBeInTheDocument()
    
    // Verify matter cards are present
    const contractReview = canvas.getByText('Contract Review - Visual Test')
    const litigationSupport = canvas.getByText('Litigation Support')
    const complianceReview = canvas.getByText('Compliance Review')
    
    expect(contractReview).toBeInTheDocument()
    expect(litigationSupport).toBeInTheDocument()
    expect(complianceReview).toBeInTheDocument()
  }
}

/**
 * Mobile Responsive Layout
 * Tests how components adapt to mobile viewport
 */
export const MobileResponsiveLayout: Story = {
  render: () => ({
    components: {
      Button,
      Card,
      CardContent,
      CardHeader,
      CardTitle,
      Badge,
      Input,
      Label,
      MatterCard
    },
    setup() {
      return { matter: VISUAL_TEST_MATTERS[0] }
    },
    template: `
      <div class="p-4 space-y-4 bg-background min-h-screen">
        <!-- Mobile Header -->
        <div class="text-center space-y-2">
          <h1 class="text-xl font-bold">Mobile Layout Test</h1>
          <p class="text-sm text-muted-foreground">Components adapted for mobile viewing</p>
        </div>
        
        <!-- Mobile Button Layout -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <Button class="w-full">Create New Matter</Button>
            <div class="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm">Edit</Button>
              <Button variant="secondary" size="sm">Share</Button>
            </div>
          </CardContent>
        </Card>
        
        <!-- Mobile Form -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Quick Form</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="space-y-2">
              <Label for="mobile-title">Matter Title</Label>
              <Input id="mobile-title" placeholder="Enter title" />
            </div>
            <div class="space-y-2">
              <Label for="mobile-desc">Description</Label>
              <Input id="mobile-desc" placeholder="Brief description" />
            </div>
            <Button class="w-full">Save Matter</Button>
          </CardContent>
        </Card>
        
        <!-- Mobile Matter Card -->
        <MatterCard 
          :matter="matter"
          :is-dragging="false"
          @select="() => {}"
        />
        
        <!-- Mobile Badge Layout -->
        <Card>
          <CardContent class="pt-6">
            <div class="flex flex-wrap gap-2">
              <Badge variant="default">Priority</Badge>
              <Badge variant="secondary">Status</Badge>
              <Badge variant="outline">Type</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    `
  }),
  parameters: {
    viewport: { defaultViewport: 'mobile1' }
  }
}

/**
 * Dark Theme Showcase
 * Tests all components in dark mode
 */
export const DarkThemeShowcase: Story = {
  render: () => ({
    components: {
      Button,
      Card,
      CardContent,
      CardHeader,
      CardTitle,
      Badge,
      Alert,
      AlertDescription,
      Input,
      Label
    },
    template: `
      <div class="dark">
        <div class="p-8 space-y-8 bg-background min-h-screen text-foreground">
          <!-- Dark Mode Header -->
          <div class="text-center space-y-2">
            <h1 class="text-3xl font-bold">Dark Theme Visual Test</h1>
            <p class="text-muted-foreground">All components in dark mode configuration</p>
          </div>
          
          <!-- Dark Mode Components -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Dark Mode Buttons</CardTitle>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="flex gap-4 flex-wrap">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Dark Mode Form</CardTitle>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="space-y-2">
                  <Label for="dark-email">Email</Label>
                  <Input id="dark-email" type="email" placeholder="user@example.com" />
                </div>
                <div class="space-y-2">
                  <Label for="dark-message">Message</Label>
                  <Input id="dark-message" placeholder="Your message" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <!-- Dark Mode Badges -->
          <Card>
            <CardHeader>
              <CardTitle>Status Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="flex gap-2 flex-wrap">
                <Badge variant="default">Active</Badge>
                <Badge variant="secondary">Pending</Badge>
                <Badge variant="destructive">Error</Badge>
                <Badge variant="outline">Inactive</Badge>
              </div>
            </CardContent>
          </Card>
          
          <!-- Dark Mode Alerts -->
          <div class="space-y-4">
            <Alert>
              <AlertDescription>
                This is how alerts appear in dark mode.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertDescription>
                Error alerts in dark theme maintain proper contrast.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    `
  }),
  parameters: {
    backgrounds: { default: 'dark' },
    theme: 'dark'
  }
}

/**
 * Error and Loading States
 * Tests various component states for visual consistency
 */
export const ErrorAndLoadingStates: Story = {
  render: () => ({
    components: {
      Button,
      Card,
      CardContent,
      CardHeader,
      CardTitle,
      Alert,
      AlertDescription,
      Input,
      Label
    },
    setup() {
      return {
        isLoading: true,
        hasError: true,
        isEmpty: true
      }
    },
    template: `
      <div class="p-8 space-y-8 bg-background min-h-screen">
        <!-- State Testing Header -->
        <div class="text-center space-y-2">
          <h1 class="text-3xl font-bold">Component States Test</h1>
          <p class="text-muted-foreground">Loading, error, and empty states for visual consistency</p>
        </div>
        
        <!-- Loading States -->
        <Card>
          <CardHeader>
            <CardTitle>Loading States</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex gap-4 flex-wrap">
              <Button :loading="isLoading">Loading Button</Button>
              <Button disabled>Disabled Button</Button>
              <Button variant="outline" :loading="isLoading">Outline Loading</Button>
            </div>
            
            <!-- Skeleton Loading -->
            <div class="space-y-3">
              <div class="h-4 bg-muted animate-pulse rounded"></div>
              <div class="h-4 bg-muted animate-pulse rounded w-3/4"></div>
              <div class="h-4 bg-muted animate-pulse rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Error States -->
        <Card>
          <CardHeader>
            <CardTitle>Error States</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load matter data. Please try again.
              </AlertDescription>
            </Alert>
            
            <div class="space-y-2">
              <Label for="error-input">Input with Error</Label>
              <Input 
                id="error-input" 
                placeholder="Invalid input" 
                class="border-destructive focus:border-destructive"
              />
              <p class="text-sm text-destructive">This field is required</p>
            </div>
          </CardContent>
        </Card>
        
        <!-- Empty States -->
        <Card>
          <CardHeader>
            <CardTitle>Empty States</CardTitle>
          </CardHeader>
          <CardContent class="py-12">
            <div class="text-center space-y-4">
              <div class="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <span class="text-2xl text-muted-foreground">📋</span>
              </div>
              <div class="space-y-2">
                <h3 class="text-lg font-medium">No matters found</h3>
                <p class="text-muted-foreground">Create your first matter to get started</p>
              </div>
              <Button>Create Matter</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    `
  })
}

/**
 * Print Layout
 * Tests how components appear when printed or in print preview
 */
export const PrintLayout: Story = {
  render: () => ({
    components: {
      Card,
      CardContent,
      CardHeader,
      CardTitle,
      Badge
    },
    setup() {
      return { matter: VISUAL_TEST_MATTERS[0] }
    },
    template: `
      <div class="print:p-0 p-8 space-y-6 bg-white text-black">
        <!-- Print Header -->
        <div class="border-b pb-4">
          <h1 class="text-2xl font-bold">Aster Management - Matter Report</h1>
          <p class="text-gray-600">Generated for visual testing purposes</p>
          <p class="text-sm text-gray-500">Print Date: January 18, 2024</p>
        </div>
        
        <!-- Matter Summary -->
        <Card class="print:shadow-none print:border-2">
          <CardHeader>
            <CardTitle class="flex items-center justify-between">
              <span>{{ matter.title }}</span>
              <Badge :variant="matter.priority === 'HIGH' ? 'destructive' : 'default'">
                {{ matter.priority }}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Matter ID:</strong> {{ matter.id }}
              </div>
              <div>
                <strong>Status:</strong> {{ matter.status }}
              </div>
              <div>
                <strong>Client:</strong> {{ matter.client.name }}
              </div>
              <div>
                <strong>Assignee:</strong> {{ matter.assignee.name }}
              </div>
            </div>
            
            <div>
              <strong>Description:</strong>
              <p class="mt-1 text-gray-700">{{ matter.description }}</p>
            </div>
            
            <div>
              <strong>Tags:</strong>
              <div class="flex gap-2 mt-1">
                <Badge v-for="tag in matter.tags" :key="tag" variant="outline">
                  {{ tag }}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Print Footer -->
        <div class="border-t pt-4 text-center text-sm text-gray-500">
          <p>This document was generated by Aster Management System</p>
          <p>For internal use only - Confidential and Privileged</p>
        </div>
      </div>
    `
  }),
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    // Simulate print media
    backgrounds: { default: 'light' }
  }
}

/**
 * High Contrast Mode
 * Tests accessibility with high contrast colors
 */
export const HighContrastMode: Story = {
  render: () => ({
    components: {
      Button,
      Card,
      CardContent,
      CardHeader,
      CardTitle,
      Badge,
      Input,
      Label
    },
    template: `
      <div class="high-contrast p-8 space-y-8 bg-white text-black min-h-screen">
        <style>
          .high-contrast * {
            --background: 255 255 255;
            --foreground: 0 0 0;
            --muted: 245 245 245;
            --muted-foreground: 100 100 100;
            --border: 0 0 0;
            --input: 255 255 255;
            --primary: 0 0 0;
            --primary-foreground: 255 255 255;
            --secondary: 240 240 240;
            --secondary-foreground: 0 0 0;
            --destructive: 255 0 0;
            --destructive-foreground: 255 255 255;
          }
          
          .high-contrast button {
            border-width: 2px !important;
          }
          
          .high-contrast input {
            border-width: 2px !important;
            border-color: black !important;
          }
        </style>
        
        <!-- High Contrast Header -->
        <div class="text-center space-y-2">
          <h1 class="text-3xl font-bold">High Contrast Mode Test</h1>
          <p class="text-gray-700">Accessibility testing with enhanced contrast</p>
        </div>
        
        <!-- High Contrast Components -->
        <Card class="border-2 border-black">
          <CardHeader>
            <CardTitle>High Contrast UI Elements</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex gap-4 flex-wrap">
              <Button variant="default">Primary Action</Button>
              <Button variant="outline">Secondary Action</Button>
              <Button variant="destructive">Delete Action</Button>
            </div>
            
            <div class="space-y-2">
              <Label for="hc-input">High Contrast Input</Label>
              <Input id="hc-input" placeholder="Enter text here" />
            </div>
            
            <div class="flex gap-2">
              <Badge variant="default">Status</Badge>
              <Badge variant="outline">Priority</Badge>
              <Badge variant="destructive">Alert</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    `
  }),
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            options: { level: 'AAA' }
          }
        ]
      }
    }
  }
}