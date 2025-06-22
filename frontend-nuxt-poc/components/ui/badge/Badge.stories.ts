import type { Meta, StoryObj } from '@storybook/vue3'
import { Badge } from './index'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-vue-next'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: 'The visual style of the badge',
      table: {
        type: { summary: 'BadgeVariant' },
        defaultValue: { summary: 'default' }
      }
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A badge component for displaying labels, statuses, or counts. Perfect for highlighting important information.'
      }
    }
  }
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

// Default badge
export const Default: Story = {
  args: {
    variant: 'default'
  },
  render: (args) => ({
    components: { Badge },
    setup() {
      return { args }
    },
    template: '<Badge v-bind="args">Badge</Badge>'
  })
}

// All variants
export const AllVariants: Story = {
  render: () => ({
    components: { Badge },
    template: `
      <div class="flex flex-wrap gap-4">
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'All available badge variants displayed together.'
      }
    }
  }
}

// Status badges
export const StatusBadges: Story = {
  render: () => ({
    components: { Badge, CheckCircle, AlertCircle, XCircle, Info },
    template: `
      <div class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <Badge variant="default">
            <CheckCircle class="mr-1 h-3 w-3" />
            Active
          </Badge>
          <Badge variant="secondary">
            <Info class="mr-1 h-3 w-3" />
            Pending
          </Badge>
          <Badge variant="destructive">
            <XCircle class="mr-1 h-3 w-3" />
            Failed
          </Badge>
          <Badge variant="outline">
            <AlertCircle class="mr-1 h-3 w-3" />
            Warning
          </Badge>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Badges with icons to represent different statuses.'
      }
    }
  }
}

// Legal context badges
export const LegalContextBadges: Story = {
  render: () => ({
    components: { Badge },
    template: `
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-medium mb-2">Case Status</h3>
          <div class="flex flex-wrap gap-2">
            <Badge variant="default">Open</Badge>
            <Badge variant="secondary">In Review</Badge>
            <Badge variant="outline">On Hold</Badge>
            <Badge variant="destructive">Closed</Badge>
          </div>
        </div>
        
        <div>
          <h3 class="text-sm font-medium mb-2">Case Types</h3>
          <div class="flex flex-wrap gap-2">
            <Badge variant="outline">Civil Law</Badge>
            <Badge variant="outline">Criminal Law</Badge>
            <Badge variant="outline">Corporate Law</Badge>
            <Badge variant="outline">Family Law</Badge>
            <Badge variant="outline">Immigration</Badge>
          </div>
        </div>
        
        <div>
          <h3 class="text-sm font-medium mb-2">Priority Levels</h3>
          <div class="flex flex-wrap gap-2">
            <Badge variant="destructive">Urgent</Badge>
            <Badge variant="default">High</Badge>
            <Badge variant="secondary">Medium</Badge>
            <Badge variant="outline">Low</Badge>
          </div>
        </div>
        
        <div>
          <h3 class="text-sm font-medium mb-2">Document Types</h3>
          <div class="flex flex-wrap gap-2">
            <Badge variant="secondary">Contract</Badge>
            <Badge variant="secondary">Evidence</Badge>
            <Badge variant="secondary">Court Filing</Badge>
            <Badge variant="secondary">Correspondence</Badge>
          </div>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Badge examples in legal management context.'
      }
    }
  }
}

// Count badges
export const CountBadges: Story = {
  render: () => ({
    components: { Badge },
    template: `
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <span class="text-sm">Notifications</span>
          <Badge variant="default">5</Badge>
        </div>
        
        <div class="flex items-center gap-4">
          <span class="text-sm">Unread Messages</span>
          <Badge variant="destructive">99+</Badge>
        </div>
        
        <div class="flex items-center gap-4">
          <span class="text-sm">Active Cases</span>
          <Badge variant="secondary">23</Badge>
        </div>
        
        <div class="flex items-center gap-4">
          <span class="text-sm">Pending Tasks</span>
          <Badge variant="outline">12</Badge>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Badges used to display counts and numbers.'
      }
    }
  }
}

// Badge sizes using text utilities
export const CustomSizes: Story = {
  render: () => ({
    components: { Badge },
    template: `
      <div class="flex items-center gap-4">
        <Badge class="text-xs px-2 py-0.5">Extra Small</Badge>
        <Badge>Default Size</Badge>
        <Badge class="text-base px-3 py-1">Large</Badge>
        <Badge class="text-lg px-4 py-1.5">Extra Large</Badge>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Custom badge sizes using Tailwind utility classes.'
      }
    }
  }
}

// Interactive badges
export const Interactive: Story = {
  render: () => ({
    components: { Badge },
    setup() {
      const tags = ref(['Contract', 'Urgent', 'Client A', 'Review'])
      const removeTag = (index: number) => {
        tags.value.splice(index, 1)
      }
      return { tags, removeTag }
    },
    template: `
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">Click badges to remove them:</p>
        <div class="flex flex-wrap gap-2">
          <Badge 
            v-for="(tag, index) in tags" 
            :key="tag"
            variant="outline"
            class="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
            @click="removeTag(index)"
          >
            {{ tag }}
            <span class="ml-1">×</span>
          </Badge>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Interactive badges that can be clicked to remove.'
      }
    }
  }
}

// Badge combinations
export const Combinations: Story = {
  render: () => ({
    components: { Badge },
    template: `
      <div class="space-y-6">
        <div class="p-4 border rounded-lg">
          <h3 class="font-medium mb-2">Case Card Header</h3>
          <div class="flex items-center justify-between">
            <span class="text-sm">Contract Dispute - ABC Corp</span>
            <div class="flex gap-2">
              <Badge variant="default" class="text-xs">Active</Badge>
              <Badge variant="destructive" class="text-xs">Urgent</Badge>
            </div>
          </div>
        </div>
        
        <div class="p-4 border rounded-lg">
          <h3 class="font-medium mb-2">Document Tags</h3>
          <div class="flex flex-wrap gap-1">
            <Badge variant="secondary" class="text-xs">confidential</Badge>
            <Badge variant="secondary" class="text-xs">signed</Badge>
            <Badge variant="secondary" class="text-xs">v2.1</Badge>
            <Badge variant="secondary" class="text-xs">final</Badge>
          </div>
        </div>
        
        <div class="p-4 border rounded-lg">
          <h3 class="font-medium mb-2">User Roles</h3>
          <div class="flex items-center gap-2">
            <span class="text-sm">John Doe</span>
            <Badge variant="outline" class="text-xs">Lawyer</Badge>
            <Badge variant="outline" class="text-xs">Admin</Badge>
          </div>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Real-world examples of badge usage in different contexts.'
      }
    }
  }
}

// Playground
export const Playground: Story = {
  args: {
    variant: 'default'
  },
  render: (args) => ({
    components: { Badge },
    setup() {
      return { args }
    },
    template: '<Badge v-bind="args">Playground Badge</Badge>'
  }),
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground to test badge variants.'
      }
    }
  }
}