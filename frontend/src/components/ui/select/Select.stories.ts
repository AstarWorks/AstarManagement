import type { Meta, StoryObj } from '@storybook/vue3'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator
} from './index'
import { Label } from '../label'

const meta = {
  title: 'UI/Form/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A select component built on Radix Vue Select primitive. Provides a customizable dropdown selection interface.'
      }
    }
  }
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

// Basic select
export const Default: Story = {
  render: () => ({
    components: { Select, SelectContent, SelectItem, SelectTrigger, SelectValue },
    setup() {
      const value = ref('')
      return { value }
    },
    template: `
      <Select v-model="value">
        <SelectTrigger class="w-[280px]">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    `
  })
}

// With groups
export const WithGroups: Story = {
  render: () => ({
    components: { 
      Select, 
      SelectContent, 
      SelectItem, 
      SelectTrigger, 
      SelectValue,
      SelectGroup,
      SelectLabel,
      SelectSeparator
    },
    setup() {
      const selectedFruit = ref('')
      return { selectedFruit }
    },
    template: `
      <Select v-model="selectedFruit">
        <SelectTrigger class="w-[280px]">
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Citrus</SelectLabel>
            <SelectItem value="orange">Orange</SelectItem>
            <SelectItem value="lemon">Lemon</SelectItem>
            <SelectItem value="grapefruit">Grapefruit</SelectItem>
          </SelectGroup>
          
          <SelectSeparator />
          
          <SelectGroup>
            <SelectLabel>Berries</SelectLabel>
            <SelectItem value="strawberry">Strawberry</SelectItem>
            <SelectItem value="blueberry">Blueberry</SelectItem>
            <SelectItem value="raspberry">Raspberry</SelectItem>
          </SelectGroup>
          
          <SelectSeparator />
          
          <SelectGroup>
            <SelectLabel>Tropical</SelectLabel>
            <SelectItem value="mango">Mango</SelectItem>
            <SelectItem value="pineapple">Pineapple</SelectItem>
            <SelectItem value="papaya">Papaya</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Select with grouped options and separators for better organization.'
      }
    }
  }
}

// Legal context selects
export const LegalContextSelects: Story = {
  render: () => ({
    components: { 
      Select, 
      SelectContent, 
      SelectItem, 
      SelectTrigger, 
      SelectValue,
      Label
    },
    setup() {
      const caseType = ref('')
      const priority = ref('')
      const assignedLawyer = ref('')
      const status = ref('')
      
      return { caseType, priority, assignedLawyer, status }
    },
    template: `
      <div class="space-y-6 max-w-sm">
        <div class="space-y-2">
          <Label>Case Type</Label>
          <Select v-model="caseType">
            <SelectTrigger>
              <SelectValue placeholder="Select case type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="civil">Civil Law</SelectItem>
              <SelectItem value="criminal">Criminal Law</SelectItem>
              <SelectItem value="corporate">Corporate Law</SelectItem>
              <SelectItem value="family">Family Law</SelectItem>
              <SelectItem value="immigration">Immigration Law</SelectItem>
              <SelectItem value="ip">Intellectual Property</SelectItem>
              <SelectItem value="labor">Labor Law</SelectItem>
              <SelectItem value="real-estate">Real Estate Law</SelectItem>
              <SelectItem value="tax">Tax Law</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div class="space-y-2">
          <Label>Priority Level</Label>
          <Select v-model="priority">
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">
                <span class="flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full bg-destructive"></span>
                  Urgent
                </span>
              </SelectItem>
              <SelectItem value="high">
                <span class="flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full bg-orange-500"></span>
                  High
                </span>
              </SelectItem>
              <SelectItem value="medium">
                <span class="flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full bg-yellow-500"></span>
                  Medium
                </span>
              </SelectItem>
              <SelectItem value="low">
                <span class="flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full bg-green-500"></span>
                  Low
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div class="space-y-2">
          <Label>Assigned Lawyer</Label>
          <Select v-model="assignedLawyer">
            <SelectTrigger>
              <SelectValue placeholder="Select lawyer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tanaka">Tanaka Hiroshi</SelectItem>
              <SelectItem value="yamada">Yamada Akiko</SelectItem>
              <SelectItem value="sato">Sato Kenji</SelectItem>
              <SelectItem value="suzuki">Suzuki Yuki</SelectItem>
              <SelectItem value="takahashi">Takahashi Mai</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div class="space-y-2">
          <Label>Case Status</Label>
          <Select v-model="status">
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="pending-review">Pending Review</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div class="rounded-lg bg-muted p-4">
          <p class="text-sm font-medium mb-2">Selected Values:</p>
          <div class="text-xs space-y-1">
            <p>Case Type: {{ caseType || 'None' }}</p>
            <p>Priority: {{ priority || 'None' }}</p>
            <p>Lawyer: {{ assignedLawyer || 'None' }}</p>
            <p>Status: {{ status || 'None' }}</p>
          </div>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Select components for legal case management forms.'
      }
    }
  }
}

// Disabled state
export const DisabledState: Story = {
  render: () => ({
    components: { Select, SelectContent, SelectItem, SelectTrigger, SelectValue },
    template: `
      <div class="space-y-4">
        <Select disabled>
          <SelectTrigger class="w-[280px]">
            <SelectValue placeholder="Disabled select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
        
        <Select modelValue="option1" disabled>
          <SelectTrigger class="w-[280px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Selected Option</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Disabled select components with and without selected values.'
      }
    }
  }
}

// Long lists
export const LongList: Story = {
  render: () => ({
    components: { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label },
    setup() {
      const selectedCountry = ref('')
      const countries = [
        'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina',
        'United Kingdom', 'France', 'Germany', 'Italy', 'Spain',
        'Russia', 'China', 'Japan', 'South Korea', 'India',
        'Australia', 'New Zealand', 'South Africa', 'Egypt', 'Nigeria'
      ]
      
      return { selectedCountry, countries }
    },
    template: `
      <div class="space-y-2">
        <Label>Country</Label>
        <Select v-model="selectedCountry">
          <SelectTrigger class="w-[280px]">
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="country in countries" :key="country" :value="country.toLowerCase()">
              {{ country }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Select with a long list of options demonstrating scroll behavior.'
      }
    }
  }
}

// Custom trigger content
export const CustomTriggerContent: Story = {
  render: () => ({
    components: { Select, SelectContent, SelectItem, SelectTrigger, SelectValue },
    setup() {
      const selectedUser = ref('')
      const users = [
        { id: 'user1', name: 'John Doe', role: 'Lawyer', avatar: '👨‍💼' },
        { id: 'user2', name: 'Jane Smith', role: 'Clerk', avatar: '👩‍💼' },
        { id: 'user3', name: 'Bob Johnson', role: 'Admin', avatar: '👨‍💻' }
      ]
      
      return { selectedUser, users }
    },
    template: `
      <Select v-model="selectedUser">
        <SelectTrigger class="w-[280px]">
          <SelectValue placeholder="Select a user">
            <template v-if="selectedUser">
              <span class="flex items-center gap-2">
                <span>{{ users.find(u => u.id === selectedUser)?.avatar }}</span>
                <span>{{ users.find(u => u.id === selectedUser)?.name }}</span>
              </span>
            </template>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="user in users" :key="user.id" :value="user.id">
            <span class="flex items-center gap-3">
              <span class="text-xl">{{ user.avatar }}</span>
              <div>
                <div class="font-medium">{{ user.name }}</div>
                <div class="text-xs text-muted-foreground">{{ user.role }}</div>
              </div>
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Select with custom content in both trigger and items.'
      }
    }
  }
}

// Multiple selects in form
export const FormExample: Story = {
  render: () => ({
    components: { 
      Select, 
      SelectContent, 
      SelectItem, 
      SelectTrigger, 
      SelectValue,
      Label,
      Button: () => import('../button').then(m => m.Button)
    },
    setup() {
      const formData = ref({
        department: '',
        position: '',
        experience: '',
        availability: ''
      })
      
      const handleSubmit = () => {
        alert(JSON.stringify(formData.value, null, 2))
      }
      
      return { formData, handleSubmit }
    },
    template: `
      <div class="space-y-6 max-w-md">
        <h3 class="text-lg font-semibold">Job Application Form</h3>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <Label>Department</Label>
            <Select v-model="formData.department">
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="litigation">Litigation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div class="space-y-2">
            <Label>Position</Label>
            <Select v-model="formData.position" :disabled="!formData.department">
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="junior">Junior Associate</SelectItem>
                <SelectItem value="associate">Associate</SelectItem>
                <SelectItem value="senior">Senior Associate</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div class="space-y-2">
            <Label>Years of Experience</Label>
            <Select v-model="formData.experience">
              <SelectTrigger>
                <SelectValue placeholder="Select experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-2">0-2 years</SelectItem>
                <SelectItem value="3-5">3-5 years</SelectItem>
                <SelectItem value="6-10">6-10 years</SelectItem>
                <SelectItem value="10+">10+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div class="space-y-2">
            <Label>Availability</Label>
            <Select v-model="formData.availability">
              <SelectTrigger>
                <SelectValue placeholder="Select availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="2weeks">2 weeks</SelectItem>
                <SelectItem value="1month">1 month</SelectItem>
                <SelectItem value="negotiable">Negotiable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button @click="handleSubmit" class="w-full">Submit Application</Button>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Multiple select components working together in a form.'
      }
    }
  }
}