import type { Meta, StoryObj } from '@storybook/vue3'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from './index'
import { Button } from '../button'
import { Badge } from '../badge'
import { Info, Download, Edit, Trash2, Plus } from 'lucide-vue-next'

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A tooltip component built on Radix Vue Tooltip. Provides contextual information on hover or focus.'
      }
    }
  },
  decorators: [
    () => ({
      components: { TooltipProvider },
      template: '<TooltipProvider><story /></TooltipProvider>'
    })
  ]
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

// Basic tooltip
export const Default: Story = {
  render: () => ({
    components: {
      Tooltip,
      TooltipContent,
      TooltipTrigger,
      Button
    },
    template: `
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>This is a tooltip</p>
        </TooltipContent>
      </Tooltip>
    `
  })
}

// Icon buttons with tooltips
export const IconButtons: Story = {
  render: () => ({
    components: {
      Tooltip,
      TooltipContent,
      TooltipTrigger,
      Button,
      Download,
      Edit,
      Trash2,
      Plus
    },
    template: `
      <div class="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Create new item</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon">
              <Edit class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit item</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon">
              <Download class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Download file</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete item</p>
          </TooltipContent>
        </Tooltip>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Icon buttons with descriptive tooltips.'
      }
    }
  }
}

// Different positions
export const Positions: Story = {
  render: () => ({
    components: {
      Tooltip,
      TooltipContent,
      TooltipTrigger,
      Button
    },
    template: `
      <div class="grid grid-cols-3 gap-8 place-items-center min-h-[200px]">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Top</Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Tooltip on top</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Right</Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Tooltip on right</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Bottom</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Tooltip on bottom</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Left</Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Tooltip on left</p>
          </TooltipContent>
        </Tooltip>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Tooltips positioned on different sides.'
      }
    }
  }
}

// With delay
export const WithDelay: Story = {
  render: () => ({
    components: {
      Tooltip,
      TooltipContent,
      TooltipTrigger,
      Button
    },
    template: `
      <div class="flex gap-4">
        <Tooltip :delayDuration="0">
          <TooltipTrigger asChild>
            <Button variant="outline">Instant (0ms)</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Shows immediately</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip :delayDuration="300">
          <TooltipTrigger asChild>
            <Button variant="outline">Fast (300ms)</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Shows after 300ms</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip :delayDuration="700">
          <TooltipTrigger asChild>
            <Button variant="outline">Default (700ms)</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Shows after 700ms</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip :delayDuration="1000">
          <TooltipTrigger asChild>
            <Button variant="outline">Slow (1000ms)</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Shows after 1 second</p>
          </TooltipContent>
        </Tooltip>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Tooltips with different delay durations.'
      }
    }
  }
}

// Legal context tooltips
export const LegalContextTooltips: Story = {
  render: () => ({
    components: {
      Tooltip,
      TooltipContent,
      TooltipTrigger,
      Badge,
      Info
    },
    template: `
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium">Case Status:</span>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="default">Active</Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Case is currently being worked on by the legal team</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium">Priority:</span>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive">Urgent</Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Requires immediate attention - deadline within 24 hours</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium">Document Type:</span>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline">Motion</Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>A formal request to the court for a specific ruling or order</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium">Billable Hours:</span>
          <span class="text-sm">125.5</span>
          <Tooltip>
            <TooltipTrigger>
              <Info class="h-3 w-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <div class="space-y-1">
                <p class="font-medium">Breakdown:</p>
                <p class="text-xs">Research: 45h</p>
                <p class="text-xs">Drafting: 35h</p>
                <p class="text-xs">Client meetings: 20h</p>
                <p class="text-xs">Court appearances: 25.5h</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Tooltips providing context in legal case management.'
      }
    }
  }
}

// Rich content tooltips
export const RichContent: Story = {
  render: () => ({
    components: {
      Tooltip,
      TooltipContent,
      TooltipTrigger,
      Button
    },
    template: `
      <div class="flex gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">User Info</Button>
          </TooltipTrigger>
          <TooltipContent>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span class="text-xs font-medium">JD</span>
                </div>
                <div>
                  <p class="text-sm font-medium">John Doe</p>
                  <p class="text-xs text-muted-foreground">john@example.com</p>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Keyboard Shortcut</Button>
          </TooltipTrigger>
          <TooltipContent>
            <div class="flex items-center gap-2">
              <kbd class="px-2 py-1 text-xs font-semibold bg-muted rounded">⌘</kbd>
              <span class="text-xs">+</span>
              <kbd class="px-2 py-1 text-xs font-semibold bg-muted rounded">K</kbd>
            </div>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Progress</Button>
          </TooltipTrigger>
          <TooltipContent>
            <div class="space-y-2">
              <p class="text-sm font-medium">Case Progress</p>
              <div class="w-40">
                <div class="h-2 bg-muted rounded-full overflow-hidden">
                  <div class="h-full w-3/4 bg-primary rounded-full"></div>
                </div>
                <p class="text-xs text-muted-foreground mt-1">75% Complete</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Tooltips with rich HTML content.'
      }
    }
  }
}

// Disabled elements
export const DisabledElements: Story = {
  render: () => ({
    components: {
      Tooltip,
      TooltipContent,
      TooltipTrigger,
      Button
    },
    template: `
      <div class="flex gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabindex="0">
              <Button disabled>
                Disabled Button
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>This action is currently unavailable</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabindex="0">
              <Button variant="secondary" disabled>
                Locked Feature
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Premium feature - upgrade to access</p>
          </TooltipContent>
        </Tooltip>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Tooltips on disabled elements require a wrapper element.'
      }
    }
  }
}

// Interactive content
export const InteractivePlayground: Story = {
  render: () => ({
    components: {
      Tooltip,
      TooltipContent,
      TooltipTrigger,
      Button
    },
    setup() {
      const tooltipOpen = ref(false)
      const clickCount = ref(0)
      
      const handleClick = () => {
        clickCount.value++
      }
      
      return { tooltipOpen, clickCount, handleClick }
    },
    template: `
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Tooltip can be controlled programmatically
        </p>
        
        <Tooltip v-model:open="tooltipOpen">
          <TooltipTrigger asChild>
            <Button @click="handleClick">
              Click me ({{ clickCount }} clicks)
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>You've clicked {{ clickCount }} times!</p>
          </TooltipContent>
        </Tooltip>
        
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="tooltipOpen = true">
            Show Tooltip
          </Button>
          <Button variant="outline" size="sm" @click="tooltipOpen = false">
            Hide Tooltip
          </Button>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Programmatically controlled tooltip with interactive content.'
      }
    }
  }
}