<template>
  <div class="matter-sidebar">
    <!-- Sidebar Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold">Matter Info</h2>
      <Button 
        variant="ghost" 
        size="sm" 
        @click="$emit('collapse')"
        class="lg:hidden"
      >
        <X class="w-4 h-4" />
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-20 w-full" />
      <Skeleton class="h-16 w-full" />
      <div class="space-y-2">
        <Skeleton v-for="i in 4" :key="i" class="h-4 w-full" />
      </div>
    </div>

    <!-- Matter Information -->
    <div v-else-if="matter" class="space-y-6">
      <!-- Status Badge and Priority -->
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <Badge :variant="getStatusVariant(matter.status) as any" class="text-xs">
            {{ formatStatus(matter.status) }}
          </Badge>
          <Badge 
            v-if="matter.priority" 
            :variant="getPriorityVariant(matter.priority) as any"
            class="text-xs"
          >
            {{ formatPriority(matter.priority) }}
          </Badge>
        </div>
        
        <!-- Quick Actions -->
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="$emit('edit')" class="flex-1">
            <Edit class="w-3 h-3 mr-1" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm">
                <MoreVertical class="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="handleDuplicate">
                <Copy class="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleArchive">
                <Archive class="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="$emit('delete')" class="text-destructive">
                <Trash2 class="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <!-- Matter Details -->
      <div class="space-y-4">
        <!-- Client Information -->
        <div class="p-3 rounded-lg border bg-card">
          <h3 class="text-sm font-medium mb-2 flex items-center">
            <User class="w-4 h-4 mr-2" />
            Client
          </h3>
          <div class="text-sm text-muted-foreground">
            <p class="font-medium text-foreground">{{ matter.clientName }}</p>
            <p v-if="matter.clientEmail" class="flex items-center mt-1">
              <Mail class="w-3 h-3 mr-1" />
              {{ matter.clientEmail }}
            </p>
            <p v-if="matter.clientPhone" class="flex items-center mt-1">
              <Phone class="w-3 h-3 mr-1" />
              {{ matter.clientPhone }}
            </p>
          </div>
        </div>

        <!-- Assigned Team -->
        <div class="p-3 rounded-lg border bg-card">
          <h3 class="text-sm font-medium mb-2 flex items-center">
            <Users class="w-4 h-4 mr-2" />
            Assigned Team
          </h3>
          <div class="space-y-2 text-sm">
            <div v-if="matter.assignedLawyer" class="flex items-center">
              <Badge variant="secondary" class="text-xs mr-2">Lawyer</Badge>
              <span>{{ matter.assignedLawyer }}</span>
            </div>
            <div v-if="matter.assignedClerk" class="flex items-center">
              <Badge variant="secondary" class="text-xs mr-2">Clerk</Badge>
              <span>{{ matter.assignedClerk }}</span>
            </div>
          </div>
        </div>

        <!-- Key Dates -->
        <div class="p-3 rounded-lg border bg-card">
          <h3 class="text-sm font-medium mb-2 flex items-center">
            <Calendar class="w-4 h-4 mr-2" />
            Key Dates
          </h3>
          <div class="space-y-2 text-sm text-muted-foreground">
            <div class="flex justify-between">
              <span>Created:</span>
              <span>{{ formatDate(matter.createdAt) }}</span>
            </div>
            <div v-if="matter.dueDate" class="flex justify-between">
              <span>Due Date:</span>
              <span :class="isDueSoon(matter.dueDate) ? 'text-destructive font-medium' : ''">
                {{ formatDate(matter.dueDate) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Updated:</span>
              <span>{{ formatDate(matter.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Financial Summary -->
        <div class="p-3 rounded-lg border bg-card">
          <h3 class="text-sm font-medium mb-2 flex items-center">
            <DollarSign class="w-4 h-4 mr-2" />
            Financial
          </h3>
          <div class="space-y-2 text-sm text-muted-foreground">
            <div class="flex justify-between">
              <span>Budget:</span>
              <span class="font-medium text-foreground">
                {{ formatCurrency(matter.budget || 0) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Spent:</span>
              <span class="font-medium text-foreground">
                {{ formatCurrency(matter.amountSpent || 0) }}
              </span>
            </div>
            <div class="flex justify-between border-t pt-2">
              <span>Remaining:</span>
              <span 
                class="font-medium"
                :class="getRemainingBudgetColor(matter.budget || 0, matter.amountSpent || 0)"
              >
                {{ formatCurrency((matter.budget || 0) - (matter.amountSpent || 0)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Progress Overview -->
        <div class="p-3 rounded-lg border bg-card">
          <h3 class="text-sm font-medium mb-2 flex items-center">
            <BarChart3 class="w-4 h-4 mr-2" />
            Progress
          </h3>
          <div class="space-y-3">
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-muted-foreground">Completion</span>
                <span class="font-medium">{{ matter.progressPercentage || 0 }}%</span>
              </div>
              <Progress :value="matter.progressPercentage || 0" class="h-2" />
            </div>
            
            <div class="grid grid-cols-2 gap-3 text-xs text-center">
              <div class="p-2 rounded bg-muted/50">
                <div class="font-medium">{{ matter.taskCount || 0 }}</div>
                <div class="text-muted-foreground">Tasks</div>
              </div>
              <div class="p-2 rounded bg-muted/50">
                <div class="font-medium">{{ matter.documentCount || 0 }}</div>
                <div class="text-muted-foreground">Documents</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="matter.tags?.length" class="p-3 rounded-lg border bg-card">
          <h3 class="text-sm font-medium mb-2 flex items-center">
            <Tag class="w-4 h-4 mr-2" />
            Tags
          </h3>
          <div class="flex flex-wrap gap-1">
            <Badge 
              v-for="tag in matter.tags" 
              :key="tag"
              variant="outline" 
              class="text-xs"
            >
              {{ tag }}
            </Badge>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="p-3 rounded-lg border bg-card">
          <h3 class="text-sm font-medium mb-2 flex items-center">
            <Clock class="w-4 h-4 mr-2" />
            Recent Activity
          </h3>
          <div class="space-y-2 text-xs text-muted-foreground">
            <div class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
              <div>
                <p>Status updated to {{ formatStatus(matter.status) }}</p>
                <p class="text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
              <div>
                <p>Document uploaded</p>
                <p class="text-muted-foreground">1 day ago</p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
              <div>
                <p>Note added by {{ matter.assignedLawyer }}</p>
                <p class="text-muted-foreground">3 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="flex flex-col items-center justify-center py-8">
      <AlertCircle class="w-8 h-8 text-muted-foreground mb-2" />
      <p class="text-sm text-muted-foreground text-center">
        Unable to load matter information
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  X, 
  Edit, 
  MoreVertical, 
  Copy, 
  Archive, 
  Trash2,
  User, 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign,
  BarChart3,
  Tag,
  Clock,
  AlertCircle
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { Progress } from '~/components/ui/progress'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'

// Types
import type { Matter } from '~/types/matter'

interface Props {
  matter?: Matter | null
  loading?: boolean
}

interface Emits {
  collapse: []
  edit: []
  delete: []
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

defineEmits<Emits>()

// Utility functions
const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatPriority = (priority: string) => {
  return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount)
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, string> = {
    'INTAKE': 'secondary',
    'INITIAL_REVIEW': 'secondary',
    'IN_PROGRESS': 'default',
    'REVIEW': 'outline',
    'WAITING_CLIENT': 'outline',
    'READY_FILING': 'default',
    'CLOSED': 'secondary'
  }
  return variants[status] || 'secondary'
}

const getPriorityVariant = (priority: string) => {
  const variants: Record<string, string> = {
    'LOW': 'secondary',
    'MEDIUM': 'outline',
    'HIGH': 'destructive',
    'URGENT': 'destructive'
  }
  return variants[priority] || 'secondary'
}

const isDueSoon = (dueDate: string | Date) => {
  const due = new Date(dueDate)
  const now = new Date()
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 7 && diffDays >= 0
}

const getRemainingBudgetColor = (budget: number, spent: number) => {
  const remaining = budget - spent
  const percentage = (remaining / budget) * 100
  
  if (percentage < 10) return 'text-destructive'
  if (percentage < 25) return 'text-orange-500'
  return 'text-green-600'
}

// Event handlers
const handleDuplicate = () => {
  console.log('Duplicate matter')
}

const handleArchive = () => {
  console.log('Archive matter')
}
</script>

<style scoped>
.matter-sidebar {
  @apply bg-card border border-border rounded-lg p-4 h-fit sticky top-24;
}

@media (max-width: 1023px) {
  .matter-sidebar {
    @apply fixed inset-0 z-50 bg-background p-6 overflow-y-auto;
  }
}

/* Smooth transitions */
.matter-sidebar * {
  @apply transition-colors;
}

/* Custom scrollbar for webkit browsers */
.matter-sidebar::-webkit-scrollbar {
  width: 6px;
}

.matter-sidebar::-webkit-scrollbar-track {
  @apply bg-muted/30;
}

.matter-sidebar::-webkit-scrollbar-thumb {
  @apply bg-muted-foreground/30 rounded-full;
}

.matter-sidebar::-webkit-scrollbar-thumb:hover {
  @apply bg-muted-foreground/50;
}
</style>