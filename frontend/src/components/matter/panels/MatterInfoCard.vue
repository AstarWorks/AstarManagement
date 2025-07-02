<script setup lang="ts">
import { computed, ref } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Calendar, FileText, AlertCircle, Hash } from 'lucide-vue-next'
import type { Matter } from '~/types/matter'
import { formatDate, formatRelativeTime } from '~/utils/date'
import { getMatterTypeDisplay, getMatterStatusColor } from '~/utils/matter'

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
  'edit': []
  'refresh': []
}>()

// Computed properties
const formattedDates = computed(() => {
  if (!props.matter) return null
  
  return {
    created: {
      full: formatDate(props.matter.createdAt),
      relative: formatRelativeTime(props.matter.createdAt)
    },
    updated: {
      full: formatDate(props.matter.updatedAt),
      relative: formatRelativeTime(props.matter.updatedAt)
    },
    lastActivity: props.matter.lastActivity ? {
      full: formatDate(props.matter.lastActivity),
      relative: formatRelativeTime(props.matter.lastActivity)
    } : null
  }
})

const matterTypeInfo = computed(() => {
  if (!props.matter?.matterType) return null
  return getMatterTypeDisplay(props.matter.matterType)
})

const statusColor = computed(() => {
  if (!props.matter) return 'default'
  return getMatterStatusColor(props.matter.status)
})

// Handle retry on error
const handleRetry = () => {
  emit('refresh')
}
</script>

<template>
  <Card :class="className">
    <CardHeader :class="[showCompact ? 'pb-3' : '']">
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <CardTitle class="text-xl font-semibold">
            Matter Information
          </CardTitle>
          <CardDescription v-if="!showCompact">
            Core details and metadata
          </CardDescription>
        </div>
        <Badge 
          v-if="matter && !loading"
          :variant="statusColor as any"
          class="ml-2"
        >
          {{ matter.status.replace(/_/g, ' ') }}
        </Badge>
      </div>
    </CardHeader>
    
    <CardContent :class="[showCompact ? 'pt-0' : '']">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-3">
        <div class="space-y-2">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-5 w-48" />
        </div>
        <div class="space-y-2">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-5 w-36" />
        </div>
        <div class="space-y-2">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-5 w-40" />
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
        <!-- Case Number and Type -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1">
            <div class="flex items-center text-sm text-muted-foreground">
              <Hash class="w-3 h-3 mr-1" />
              Case Number
            </div>
            <p class="font-medium">{{ matter.caseNumber }}</p>
          </div>
          
          <div v-if="matterTypeInfo" class="space-y-1">
            <div class="flex items-center text-sm text-muted-foreground">
              <FileText class="w-3 h-3 mr-1" />
              Matter Type
            </div>
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ matterTypeInfo.label }}</span>
              <Badge 
                v-if="matterTypeInfo.badge"
                variant="outline" 
                class="text-xs"
              >
                {{ matterTypeInfo.badge }}
              </Badge>
            </div>
          </div>
        </div>
        
        <!-- Title -->
        <div class="space-y-1">
          <p class="text-sm text-muted-foreground">Title</p>
          <p class="font-medium">{{ matter.title }}</p>
        </div>
        
        <!-- Description (if not compact) -->
        <div v-if="!showCompact && matter.description" class="space-y-1">
          <p class="text-sm text-muted-foreground">Description</p>
          <p class="text-sm">{{ matter.description }}</p>
        </div>
        
        <!-- Dates Section -->
        <div class="space-y-3 pt-2">
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Created</span>
              <div class="text-right">
                <p class="font-medium">{{ formattedDates?.created.relative }}</p>
                <p class="text-xs text-muted-foreground">{{ formattedDates?.created.full }}</p>
              </div>
            </div>
            
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Last Updated</span>
              <div class="text-right">
                <p class="font-medium">{{ formattedDates?.updated.relative }}</p>
                <p class="text-xs text-muted-foreground">{{ formattedDates?.updated.full }}</p>
              </div>
            </div>
            
            <div 
              v-if="formattedDates?.lastActivity"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-muted-foreground">Last Activity</span>
              <div class="text-right">
                <p class="font-medium">{{ formattedDates.lastActivity.relative }}</p>
                <p class="text-xs text-muted-foreground">{{ formattedDates.lastActivity.full }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Tags (if present and not compact) -->
        <div v-if="!showCompact && matter.tags && matter.tags.length > 0" class="pt-2">
          <p class="text-sm text-muted-foreground mb-2">Tags</p>
          <div class="flex flex-wrap gap-1">
            <Badge 
              v-for="tag in matter.tags" 
              :key="tag"
              variant="secondary"
              class="text-xs"
            >
              {{ tag }}
            </Badge>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else class="text-center py-4">
        <p class="text-muted-foreground">No matter data available</p>
      </div>
    </CardContent>
  </Card>
</template>