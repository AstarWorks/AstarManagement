<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Progress } from '~/components/ui/progress'
import { 
  Calendar,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Timer
} from 'lucide-vue-next'
import type { Matter } from '~/types/matter'
import { 
  formatDate, 
  formatDateTime, 
  formatRelativeTime, 
  isOverdue,
  getDaysUntil,
  formatDuration
} from '~/utils/date'

interface Props {
  matter?: Matter | null
  loading?: boolean
  error?: string | null
  className?: string
  showCompact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  className: '',
  showCompact: false
})

const emit = defineEmits<{
  'set-reminder': [date: string, type: string]
  'refresh': []
}>()

// Computed properties for date information
const dueDateInfo = computed(() => {
  if (!props.matter?.dueDate) return null
  
  const daysUntil = getDaysUntil(props.matter.dueDate)
  const overdue = isOverdue(props.matter.dueDate)
  
  return {
    date: props.matter.dueDate,
    formatted: formatDate(props.matter.dueDate),
    relative: formatRelativeTime(props.matter.dueDate),
    daysUntil,
    overdue,
    urgency: getUrgencyLevel(daysUntil)
  }
})

const statusDurationInfo = computed(() => {
  if (!props.matter?.statusDuration) return null
  
  return {
    days: props.matter.statusDuration,
    formatted: formatDuration(props.matter.statusDuration),
    isLong: props.matter.statusDuration > 14
  }
})

const timelineProgress = computed(() => {
  if (!props.matter?.createdAt || !props.matter?.dueDate) return null
  
  const created = new Date(props.matter.createdAt)
  const due = new Date(props.matter.dueDate)
  const now = new Date()
  
  const totalDuration = due.getTime() - created.getTime()
  const elapsed = now.getTime() - created.getTime()
  
  const percentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
  
  return {
    percentage: Math.round(percentage),
    isOverdue: percentage > 100
  }
})

// Helper functions
const getUrgencyLevel = (days: number | null): 'overdue' | 'urgent' | 'soon' | 'normal' | null => {
  if (days === null) return null
  if (days < 0) return 'overdue'
  if (days <= 3) return 'urgent'
  if (days <= 7) return 'soon'
  return 'normal'
}

const getUrgencyColor = (urgency: string | null): string => {
  switch (urgency) {
    case 'overdue': return 'destructive'
    case 'urgent': return 'destructive'
    case 'soon': return 'warning'
    default: return 'default'
  }
}

const getUrgencyIcon = (urgency: string | null) => {
  switch (urgency) {
    case 'overdue': return AlertCircle
    case 'urgent': return AlertTriangle
    case 'soon': return Clock
    default: return Calendar
  }
}

// Handle retry on error
const handleRetry = () => {
  emit('refresh')
}

// Handle set reminder
const handleSetReminder = (date: string, type: string) => {
  emit('set-reminder', date, type)
}
</script>

<template>
  <Card :class="className">
    <CardHeader :class="showCompact ? 'pb-3' : ''">
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <CardTitle class="text-xl font-semibold">
            Key Dates & Deadlines
          </CardTitle>
          <CardDescription v-if="!showCompact">
            Timeline and important dates
          </CardDescription>
        </div>
        <Calendar class="h-5 w-5 text-muted-foreground" />
      </div>
    </CardHeader>
    
    <CardContent :class="showCompact ? 'pt-0' : ''">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div class="space-y-2">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-20 w-full" />
        </div>
        <div class="space-y-2">
          <Skeleton class="h-4 w-32" />
          <Skeleton class="h-6 w-full" />
        </div>
      </div>
      
      <!-- Error State -->
      <Alert v-else-if="error" variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>
          <span>{{ error }}</span>
          <button 
            @click="handleRetry"
            class="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </AlertDescription>
      </Alert>
      
      <!-- Content -->
      <div v-else-if="matter" class="space-y-4">
        <!-- Due Date Alert (if urgent or overdue) -->
        <Alert 
          v-if="dueDateInfo && (dueDateInfo.urgency === 'overdue' || dueDateInfo.urgency === 'urgent')"
          variant="destructive"
        >
          <component :is="getUrgencyIcon(dueDateInfo.urgency)" class="h-4 w-4" />
          <AlertTitle>
            {{ dueDateInfo.urgency === 'overdue' ? 'Overdue' : 'Urgent Deadline' }}
          </AlertTitle>
          <AlertDescription>
            <span v-if="dueDateInfo.urgency === 'overdue'">
              This matter was due {{ dueDateInfo.relative }}
            </span>
            <span v-else>
              Due {{ dueDateInfo.relative }} ({{ formatDuration(dueDateInfo.daysUntil!) }})
            </span>
          </AlertDescription>
        </Alert>
        
        <!-- Timeline Progress -->
        <div v-if="timelineProgress" class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Timeline Progress</span>
            <span class="font-medium">{{ timelineProgress.percentage }}%</span>
          </div>
          <Progress 
            :value="timelineProgress.percentage" 
            :class="timelineProgress.isOverdue ? 'bg-destructive/20' : ''"
          />
        </div>
        
        <!-- Key Dates Grid -->
        <div class="space-y-4">
          <!-- Created Date -->
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle class="h-4 w-4" />
              Created
            </div>
            <div class="text-right">
              <p class="text-sm font-medium">{{ formatDate(matter.createdAt) }}</p>
              <p class="text-xs text-muted-foreground">{{ formatRelativeTime(matter.createdAt) }}</p>
            </div>
          </div>
          
          <!-- Due Date -->
          <div v-if="dueDateInfo" class="flex items-start justify-between">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <component :is="getUrgencyIcon(dueDateInfo.urgency)" class="h-4 w-4" />
              Due Date
            </div>
            <div class="text-right">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium">{{ dueDateInfo.formatted }}</p>
                <Badge 
                  v-if="dueDateInfo.urgency !== 'normal'"
                  :variant="getUrgencyColor(dueDateInfo.urgency) as any"
                  class="text-xs"
                >
                  {{ dueDateInfo.urgency === 'overdue' ? 'Overdue' : formatDuration(dueDateInfo.daysUntil!) }}
                </Badge>
              </div>
              <button
                @click="handleSetReminder(dueDateInfo.date, 'due_date')"
                class="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Set reminder
              </button>
            </div>
          </div>
          
          <!-- Status Duration -->
          <div v-if="statusDurationInfo" class="flex items-start justify-between">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer class="h-4 w-4" />
              In Current Status
            </div>
            <div class="text-right">
              <p class="text-sm font-medium">{{ statusDurationInfo.formatted }}</p>
              <Badge 
                v-if="statusDurationInfo.isLong"
                variant="outline"
                class="text-xs mt-1"
              >
                Review needed
              </Badge>
            </div>
          </div>
          
          <!-- Last Activity -->
          <div v-if="matter.lastActivity" class="flex items-start justify-between">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock class="h-4 w-4" />
              Last Activity
            </div>
            <div class="text-right">
              <p class="text-sm font-medium">{{ formatDate(matter.lastActivity) }}</p>
              <p class="text-xs text-muted-foreground">{{ formatRelativeTime(matter.lastActivity) }}</p>
            </div>
          </div>
        </div>
        
        <!-- No Due Date Message -->
        <div v-if="!dueDateInfo && !showCompact" class="text-center py-4 border-t">
          <p class="text-sm text-muted-foreground">No due date set for this matter</p>
          <button 
            class="text-sm text-primary hover:underline mt-1"
            @click="handleSetReminder('', 'add_due_date')"
          >
            Add due date
          </button>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else class="text-center py-4">
        <p class="text-muted-foreground">No date information available</p>
      </div>
    </CardContent>
  </Card>
</template>