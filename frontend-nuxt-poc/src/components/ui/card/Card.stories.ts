import type { Meta, StoryObj } from '@storybook/vue3'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './index'
import { Button } from '../button'
import { Badge } from '../badge'
import { Separator } from '../separator'
import { Calendar, Clock, User, FileText } from 'lucide-vue-next'

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A versatile card component for displaying content in a contained format. Includes sub-components for structured layouts.'
      }
    }
  }
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

// Basic card
export const Default: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent },
    template: `
      <Card class="w-[350px]">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description goes here</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main content area of the card. You can put any content here.</p>
        </CardContent>
      </Card>
    `
  })
}

// Card with footer
export const WithFooter: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button },
    template: `
      <Card class="w-[350px]">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Update your account settings. Set your preferred language and timezone.
          </p>
        </CardContent>
        <CardFooter class="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </CardFooter>
      </Card>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Card with footer containing action buttons.'
      }
    }
  }
}

// Legal matter card example
export const LegalMatterCard: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Badge, Calendar, Clock },
    template: `
      <Card class="w-[400px]">
        <CardHeader>
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <CardTitle>Contract Dispute - ABC Corp</CardTitle>
              <CardDescription>Case #2025-CV-0001</CardDescription>
            </div>
            <Badge variant="default">Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="flex items-center gap-2 text-muted-foreground">
                <Calendar class="h-4 w-4" />
                <span>Filed: Jan 15, 2025</span>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <Clock class="h-4 w-4" />
                <span>Due: Feb 28, 2025</span>
              </div>
            </div>
            <p class="text-sm">
              Commercial contract dispute involving breach of software licensing agreement. 
              Client seeks damages for unauthorized distribution.
            </p>
            <div class="flex gap-2">
              <Badge variant="outline">Civil Law</Badge>
              <Badge variant="outline">High Priority</Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button class="w-full">View Details</Button>
        </CardFooter>
      </Card>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Example of a card used for displaying legal matter information.'
      }
    }
  }
}

// Multiple cards layout
export const CardGrid: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, User, FileText },
    template: `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
        <Card>
          <CardHeader>
            <div class="flex items-center gap-2">
              <User class="h-5 w-5 text-muted-foreground" />
              <CardTitle class="text-lg">Total Clients</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <p class="text-3xl font-bold">156</p>
              <p class="text-sm text-muted-foreground">+12 this month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div class="flex items-center gap-2">
              <FileText class="h-5 w-5 text-muted-foreground" />
              <CardTitle class="text-lg">Active Cases</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <p class="text-3xl font-bold">48</p>
              <p class="text-sm text-muted-foreground">23 in progress</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div class="flex items-center gap-2">
              <Calendar class="h-5 w-5 text-muted-foreground" />
              <CardTitle class="text-lg">Upcoming Hearings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <p class="text-3xl font-bold">7</p>
              <p class="text-sm text-muted-foreground">Next in 3 days</p>
            </div>
          </CardContent>
        </Card>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Grid layout with multiple cards showing dashboard metrics.'
      }
    }
  }
}

// Complex card with sections
export const ComplexCard: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Badge, Separator },
    template: `
      <Card class="w-[450px]">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Yamada Corporation - ID: CL-2025-042</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <h4 class="font-medium text-sm mb-2">Contact Details</h4>
            <div class="space-y-1 text-sm text-muted-foreground">
              <p>Email: legal@yamada-corp.jp</p>
              <p>Phone: +81 3-1234-5678</p>
              <p>Address: Tokyo, Minato-ku, 1-2-3</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 class="font-medium text-sm mb-2">Recent Activity</h4>
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span>Contract Review</span>
                <Badge variant="secondary">Completed</Badge>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span>Patent Filing</span>
                <Badge variant="default">In Progress</Badge>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span>Consultation</span>
                <Badge variant="outline">Scheduled</Badge>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 class="font-medium text-sm mb-2">Account Status</h4>
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Total Outstanding</span>
              <span class="font-medium">¥2,450,000</span>
            </div>
          </div>
        </CardContent>
        <CardFooter class="flex gap-2">
          <Button variant="outline" class="flex-1">View Profile</Button>
          <Button class="flex-1">Contact Client</Button>
        </CardFooter>
      </Card>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Complex card with multiple sections separated by dividers.'
      }
    }
  }
}

// Interactive card
export const Interactive: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent },
    setup() {
      const isHovered = ref(false)
      return { isHovered }
    },
    template: `
      <Card 
        class="w-[350px] cursor-pointer transition-all"
        :class="{ 'shadow-lg scale-105': isHovered }"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
      >
        <CardHeader>
          <CardTitle>Interactive Card</CardTitle>
          <CardDescription>Hover over me!</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm">
            This card responds to hover interactions with smooth transitions.
          </p>
        </CardContent>
      </Card>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Card with hover interactions and transitions.'
      }
    }
  }
}

// Card variants
export const Variants: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardContent },
    template: `
      <div class="space-y-4">
        <Card class="w-[350px]">
          <CardHeader>
            <CardTitle>Default Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Standard card with default styling</p>
          </CardContent>
        </Card>

        <Card class="w-[350px] border-primary">
          <CardHeader>
            <CardTitle>Primary Border</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card with primary color border</p>
          </CardContent>
        </Card>

        <Card class="w-[350px] border-destructive">
          <CardHeader>
            <CardTitle>Destructive Border</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card with destructive color border</p>
          </CardContent>
        </Card>

        <Card class="w-[350px] bg-secondary">
          <CardHeader>
            <CardTitle>Secondary Background</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card with secondary background color</p>
          </CardContent>
        </Card>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Different card styling variants using utility classes.'
      }
    }
  }
}