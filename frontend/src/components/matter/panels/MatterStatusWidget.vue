<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Progress } from '~/components/ui/progress'
import { 
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  Target,
  Gauge,
  FileText
} from 'lucide-vue-next'
import type { Matter } from '~/types/matter'
import { 
  getMatterStatusLabel, 
  getMatterStatusColor,
  getMatterPriorityLabel,
  getMatterPriorityColor,
  calculateMatterProgress,
  isMatterActive
} from '~/utils/matter'
import { formatDuration } from '~/utils/date'

interface Props {
  matter?: Matter | null
  loading?: boolean
  error?: string | null
  className?: string
  showCompact?: boolean
  showSla?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  className: '',
  showCompact: false,
  showSla: true
})

const emit = defineEmits<{
  'status-change': [newStatus: string]
  'refresh': []
}>()

// Progress calculation
const progressInfo = computed(() => {
  if (!props.matter) return null
  
  const progress = props.matter.progressPercentage || calculateMatterProgress(props.matter.status)
  const isActive = isMatterActive(props.matter.status)
  
  return {
    percentage: progress,
    isActive,
    isComplete: progress === 100,
    statusLabel: getMatterStatusLabel(props.matter.status),
    statusColor: getMatterStatusColor(props.matter.status)
  }
})

// Priority information
const priorityInfo = computed(() => {
  if (!props.matter) return null
  
  return {
    label: getMatterPriorityLabel(props.matter.priority),
    color: getMatterPriorityColor(props.matter.priority),
    isHigh: props.matter.priority === 'HIGH' || props.matter.priority === 'URGENT'
  }
})

// SLA calculation (mock data for now)
const slaInfo = computed(() => {
  if (!props.matter || !props.showSla) return null
  
  // This would come from actual SLA data
  const mockSla = {
    targetDays: 30,
    elapsedDays: props.matter.statusDuration || 0,
    remainingDays: 30 - (props.matter.statusDuration || 0)
  }
  
  const percentage = (mockSla.elapsedDays / mockSla.targetDays) * 100
  
  return {
    ...mockSla,
    percentage: Math.min(100, percentage),
    isAtRisk: percentage > 80,
    isOverdue: percentage > 100,
    status: percentage > 100 ? 'overdue' : percentage > 80 ? 'at-risk' : 'on-track'
  }
})

// Activity metrics
const activityMetrics = computed(() => {
  if (!props.matter) return null
  
  return {
    documents: props.matter.documentCount || props.matter.relatedDocuments || 0,
    tasks: props.matter.taskCount || 0,
    daysInStatus: props.matter.statusDuration || 0
  }
})

// Handle retry on error
const handleRetry = () => {
  emit('refresh')
}

// Handle status change request
const handleStatusChange = () => {
  if (props.matter) {
    emit('status-change', props.matter.status)
  }
}
</script>

<template>
  <Card :class="className">
    <CardHeader :class="[showCompact ? 'pb-3' : '']">
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <CardTitle class="text-xl font-semibold">
            Status & Progress
          </CardTitle>
          <CardDescription v-if="!showCompact">
            Current status and SLA tracking
          </CardDescription>
        </div>
        <Activity class="h-5 w-5 text-muted-foreground" />
      </div>
    </CardHeader>
    
    <CardContent :class="[showCompact ? 'pt-0' : '']">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div class="space-y-2">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-8 w-full" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <Skeleton class="h-16" />
          <Skeleton class="h-16" />
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
      <div v-else-if="matter && progressInfo" class="space-y-4">
        <!-- Current Status -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-muted-foreground">Current Status</p>
            <button
              @click="handleStatusChange"
              class="text-xs text-primary hover:underline"
            >
              Change
            </button>
          </div>
          
          <div class="flex items-center gap-3">
            <Badge 
              :variant="progressInfo.statusColor as any"
              class="text-sm py-1 px-3"
            >
              {{ progressInfo.statusLabel }}
            </Badge>
            
            <div class="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock class="h-3 w-3" />
              {{ formatDuration(matter.statusDuration || 0) }}
            </div>
          </div>
        </div>
        
        <!-- Overall Progress -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Overall Progress</span>
            <span class="font-medium">{{ progressInfo.percentage }}%</span>
          </div>
          <Progress :value="progressInfo.percentage" class="h-2" />
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>Intake</span>
            <span v-if="progressInfo.isComplete" class="text-green-600 flex items-center gap-1">
              <CheckCircle2 class="h-3 w-3" />
              Complete
            </span>
            <span v-else>{{ progressInfo.isActive ? 'In Progress' : 'On Hold' }}</span>
          </div>
        </div>
        
        <!-- Priority Badge -->
        <div v-if="priorityInfo" class="flex items-center justify-between">
          <p class="text-sm font-medium text-muted-foreground">Priority Level</p>
          <div class="flex items-center gap-2">
            <div 
              class="w-2 h-2 rounded-full"
              :class="priorityInfo.color"
            />
            <span class="text-sm font-medium">{{ priorityInfo.label }}</span>
            <Zap v-if="priorityInfo.isHigh" class="h-3 w-3 text-orange-500" />
          </div>
        </div>
        
        <!-- SLA Tracking (if enabled) -->
        <div v-if="slaInfo && showSla && !showCompact" class="space-y-3 pt-2 border-t">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-muted-foreground">SLA Status</p>
            <Badge 
              :variant="slaInfo.status === 'overdue' ? 'destructive' : 'secondary'"
              class="text-xs"
            >
              {{ slaInfo.status.replace('-', ' ').toUpperCase() }}
            </Badge>
          </div>
          
          <div class="space-y-2">
            <Progress 
              :value="slaInfo.percentage" 
              :class="[
                slaInfo.status === 'on-track' ? 'bg-green-100' : '',
                slaInfo.status === 'at-risk' ? 'bg-yellow-100' : '',
                slaInfo.status === 'overdue' ? 'bg-red-100' : ''
              ]"
            />
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>{{ slaInfo.elapsedDays }} days used</span>
              <span>{{ slaInfo.targetDays }} days target</span>
            </div>
          </div>
        </div>
        
        <!-- Activity Metrics -->
        <div v-if="activityMetrics && !showCompact" class="grid grid-cols-3 gap-3 pt-3 border-t">
          <div class="text-center">
            <div class="flex items-center justify-center mb-1">
              <Target class="h-4 w-4 text-muted-foreground" />
            </div>
            <p class="text-lg font-semibold">{{ activityMetrics.tasks }}</p>
            <p class="text-xs text-muted-foreground">Tasks</p>
          </div>
          
          <div class="text-center">
            <div class="flex items-center justify-center mb-1">
              <FileText class="h-4 w-4 text-muted-foreground" />
            </div>
            <p class="text-lg font-semibold">{{ activityMetrics.documents }}</p>
            <p class="text-xs text-muted-foreground">Documents</p>
          </div>
          
          <div class="text-center">
            <div class="flex items-center justify-center mb-1">
              <Gauge class="h-4 w-4 text-muted-foreground" />
            </div>
            <p class="text-lg font-semibold">{{ progressInfo.percentage }}%</p>
            <p class="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else class="text-center py-4">
        <p class="text-muted-foreground">No status information available</p>
      </div>
    </CardContent>
  </Card>
</template>