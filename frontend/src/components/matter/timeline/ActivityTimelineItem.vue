<!--
  Activity Timeline Item Component
  
  Renders individual activity items in the timeline with support for:
  - Multiple view modes (compact, detailed, grouped)
  - Different activity types with appropriate icons and colors
  - User information and timestamps
  - Expandable content for detailed view
  - Action buttons for activity-specific operations
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Upload, Download, Eye, Mail, StickyNote, Phone,
  PlusCircle, Edit, GitBranch, UserPlus, CheckSquare,
  CheckCircle, Shield, Clock, ExternalLink, MoreHorizontal,
  ChevronDown, ChevronRight, Copy, Share2
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '~/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'

// Types and Composables
import type { Activity, ActivityViewMode } from '~/types/activity'
import { useActivityUtils } from '~/composables/useActivityTimeline'

interface Props {
  /** Activity data to display */
  activity: Activity
  /** View mode for rendering */
  viewMode: ActivityViewMode
  /** Matter ID for context */
  matterId: string
  /** Show timeline connector line */
  showConnector?: boolean
  /** Enable expand/collapse for detailed content */
  enableExpand?: boolean
  /** Enable action menu */
  enableActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showConnector: true,
  enableExpand: true,
  enableActions: true
})

// Composables
const { formatActivityTimestamp, getActivityDescription } = useActivityUtils()

// Local state
const isExpanded = ref(false)
const showFullContent = ref(false)

// Activity type to icon mapping
const activityIcons = {
  document_upload: Upload,
  document_view: Eye,
  document_download: Download,
  communication_email: Mail,
  communication_note: StickyNote,
  communication_call: Phone,
  matter_created: PlusCircle,
  matter_updated: Edit,
  matter_status_changed: GitBranch,
  matter_assigned: UserPlus,
  task_created: CheckSquare,
  task_completed: CheckCircle,
  audit_action: Shield
}

// Activity type to color mapping
const activityColors = {
  document_upload: 'text-blue-600 bg-blue-50',
  document_view: 'text-gray-600 bg-gray-50',
  document_download: 'text-green-600 bg-green-50',
  communication_email: 'text-purple-600 bg-purple-50',
  communication_note: 'text-yellow-600 bg-yellow-50',
  communication_call: 'text-orange-600 bg-orange-50',
  matter_created: 'text-emerald-600 bg-emerald-50',
  matter_updated: 'text-blue-600 bg-blue-50',
  matter_status_changed: 'text-indigo-600 bg-indigo-50',
  matter_assigned: 'text-cyan-600 bg-cyan-50',
  task_created: 'text-pink-600 bg-pink-50',
  task_completed: 'text-green-600 bg-green-50',
  audit_action: 'text-red-600 bg-red-50'
}

// Computed properties
const activityIcon = computed(() => activityIcons[props.activity.type] || Clock)
const activityColor = computed(() => activityColors[props.activity.type] || 'text-gray-600 bg-gray-50')

const formattedTime = computed(() => formatActivityTimestamp(props.activity.timestamp))
const activityDesc = computed(() => getActivityDescription(props.activity))

const isCompactView = computed(() => props.viewMode === 'compact')
const isDetailedView = computed(() => props.viewMode === 'detailed')

const hasExpandableContent = computed(() => {
  return !!(
    props.activity.metadata?.content ||
    props.activity.metadata?.description ||
    props.activity.oldValue ||
    props.activity.newValue ||
    (props.activity.type === 'communication_email' && props.activity.metadata?.attachmentCount) ||
    (props.activity.type === 'document_upload' && props.activity.metadata?.fileSize)
  )
})

const displayContent = computed(() => {
  const content = props.activity.metadata?.content || props.activity.description
  if (!content) return ''
  
  if (showFullContent.value || content.length <= 150) {
    return content
  }
  
  return content.substring(0, 150) + '...'
})

const canShowActions = computed(() => {
  return props.enableActions && (
    props.activity.type.startsWith('document_') ||
    props.activity.type.startsWith('communication_') ||
    props.activity.type === 'task_created'
  )
})

// Methods
const toggleExpanded = () => {
  if (hasExpandableContent.value) {
    isExpanded.value = !isExpanded.value
  }
}

const toggleFullContent = () => {
  showFullContent.value = !showFullContent.value
}

const handleActivityAction = (action: string) => {
  switch (action) {
    case 'view':
      handleViewActivity()
      break
    case 'download':
      handleDownloadDocument()
      break
    case 'reply':
      handleReplyToEmail()
      break
    case 'copy-link':
      handleCopyLink()
      break
    case 'share':
      handleShareActivity()
      break
    default:
      console.log('Unknown action:', action)
  }
}

const handleViewActivity = () => {
  if (props.activity.type.startsWith('document_')) {
    // Navigate to document viewer
    navigateTo(`/matters/${props.matterId}/documents/${props.activity.metadata?.documentId}`)
  } else if (props.activity.type.startsWith('communication_')) {
    // Navigate to communication detail
    navigateTo(`/matters/${props.matterId}/communications/${props.activity.metadata?.communicationId}`)
  } else if (props.activity.type === 'task_created') {
    // Navigate to task detail
    navigateTo(`/matters/${props.matterId}/tasks/${props.activity.metadata?.taskId}`)
  }
}

const handleDownloadDocument = () => {
  if (props.activity.type === 'document_upload' && props.activity.metadata?.documentId) {
    window.open(`/api/documents/${props.activity.metadata.documentId}/download`, '_blank')
  }
}

const handleReplyToEmail = () => {
  if (props.activity.type === 'communication_email') {
    // Open email composer with reply context
    console.log('Open email reply for:', props.activity.id)
  }
}

const handleCopyLink = () => {
  const link = `${window.location.origin}/matters/${props.matterId}?activity=${props.activity.id}`
  navigator.clipboard.writeText(link)
  // Show toast notification
}

const handleShareActivity = () => {
  if (navigator.share) {
    navigator.share({
      title: `Activity: ${activityDesc.value}`,
      url: `${window.location.origin}/matters/${props.matterId}?activity=${props.activity.id}`
    })
  }
}

const getChangeIndicator = () => {
  if (props.activity.oldValue && props.activity.newValue) {
    return {
      from: props.activity.oldValue,
      to: props.activity.newValue,
      field: props.activity.fieldName
    }
  }
  return null
}
</script>

<template>
  <div class="activity-timeline-item" :class="{ 'compact': isCompactView }">
    <!-- Compact View -->
    <div v-if="isCompactView" class="flex items-start gap-3 py-2">
      <!-- Activity Icon -->
      <div 
        class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs"
        :class="activityColor"
      >
        <component :is="activityIcon" class="w-3 h-3" />
      </div>
      
      <!-- Activity Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 text-sm">
          <span class="font-medium">{{ activity.actor.name }}</span>
          <span class="text-muted-foreground">{{ activityDesc }}</span>
          <span class="text-xs text-muted-foreground">{{ formattedTime }}</span>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div v-if="canShowActions" class="flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" class="h-6 w-6 p-0">
              <MoreHorizontal class="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="handleActivityAction('view')">
              <ExternalLink class="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem 
              v-if="activity.type === 'document_upload'"
              @click="handleActivityAction('download')"
            >
              <Download class="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem 
              v-if="activity.type === 'communication_email'"
              @click="handleActivityAction('reply')"
            >
              <Mail class="w-4 h-4 mr-2" />
              Reply
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Detailed View -->
    <div v-else class="activity-item-detailed">
      <div class="flex gap-4">
        <!-- Timeline Connector -->
        <div v-if="showConnector" class="flex flex-col items-center">
          <!-- Activity Icon -->
          <div 
            class="w-8 h-8 rounded-full flex items-center justify-center mb-2"
            :class="activityColor"
          >
            <component :is="activityIcon" class="w-4 h-4" />
          </div>
          
          <!-- Connector Line -->
          <div class="w-px bg-border flex-1 min-h-[20px]"></div>
        </div>
        
        <!-- Activity Content -->
        <div class="flex-1 min-w-0 pb-6">
          <!-- Activity Header -->
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <!-- User Avatar -->
              <Avatar class="w-6 h-6">
                <AvatarImage :src="activity.actor.avatar" :alt="activity.actor.name" />
                <AvatarFallback class="text-xs">
                  {{ activity.actor.name.split(' ').map(n => n[0]).join('').toUpperCase() }}
                </AvatarFallback>
              </Avatar>
              
              <!-- Actor Name and Description -->
              <div class="flex flex-wrap items-center gap-1 text-sm">
                <span class="font-medium">{{ activity.actor.name }}</span>
                <span class="text-muted-foreground">{{ activityDesc }}</span>
              </div>
            </div>
            
            <!-- Timestamp and Actions -->
            <div class="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger>
                  <span class="text-xs text-muted-foreground">
                    {{ formattedTime }}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {{ new Date(activity.timestamp).toLocaleString() }}
                </TooltipContent>
              </Tooltip>
              
              <DropdownMenu v-if="canShowActions">
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" class="h-6 w-6 p-0">
                    <MoreHorizontal class="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="handleActivityAction('view')">
                    <ExternalLink class="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="handleActivityAction('copy-link')">
                    <Copy class="w-4 h-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="handleActivityAction('share')">
                    <Share2 class="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <!-- Activity Details -->
          <div class="space-y-2">
            <!-- Status Change Indicator -->
            <div 
              v-if="activity.type === 'matter_status_changed' && getChangeIndicator()" 
              class="flex items-center gap-2 text-sm"
            >
              <Badge variant="outline" class="text-xs">
                {{ getChangeIndicator()?.from }}
              </Badge>
              <span class="text-muted-foreground">→</span>
              <Badge variant="default" class="text-xs">
                {{ getChangeIndicator()?.to }}
              </Badge>
            </div>
            
            <!-- Document Information -->
            <div 
              v-if="activity.type.startsWith('document_') && activity.metadata"
              class="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <span>{{ activity.metadata.fileName }}</span>
              <span v-if="activity.metadata.fileSize" class="text-xs">
                ({{ (activity.metadata.fileSize / 1024 / 1024).toFixed(1) }} MB)
              </span>
              <Badge v-if="activity.metadata.category" variant="secondary" class="text-xs">
                {{ activity.metadata.category }}
              </Badge>
            </div>
            
            <!-- Email Information -->
            <div 
              v-if="activity.type === 'communication_email' && activity.metadata?.subject"
              class="text-sm"
            >
              <div class="font-medium">{{ activity.metadata.subject }}</div>
              <div v-if="activity.metadata.attachmentCount" class="text-xs text-muted-foreground">
                {{ activity.metadata.attachmentCount }} attachment(s)
              </div>
            </div>
            
            <!-- Call Information -->
            <div 
              v-if="activity.type === 'communication_call' && activity.metadata"
              class="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <span v-if="activity.metadata.duration">
                Duration: {{ activity.metadata.duration }} minutes
              </span>
              <span v-if="activity.metadata.phoneNumber">
                {{ activity.metadata.phoneNumber }}
              </span>
            </div>
            
            <!-- Expandable Content -->
            <div v-if="hasExpandableContent && enableExpand" class="space-y-2">
              <Button
                v-if="displayContent"
                @click="toggleExpanded"
                variant="ghost"
                size="sm"
                class="h-auto p-0 font-normal text-left justify-start"
              >
                <component 
                  :is="isExpanded ? ChevronDown : ChevronRight" 
                  class="w-4 h-4 mr-1 flex-shrink-0" 
                />
                <span class="truncate">
                  {{ isExpanded ? 'Hide details' : 'Show details' }}
                </span>
              </Button>
              
              <div v-if="isExpanded" class="space-y-2">
                <Card class="bg-muted/50">
                  <CardContent class="p-3">
                    <div class="text-sm whitespace-pre-wrap">
                      {{ displayContent }}
                    </div>
                    
                    <Button
                      v-if="!showFullContent && displayContent.length > 150"
                      @click="toggleFullContent"
                      variant="link"
                      size="sm"
                      class="h-auto p-0 mt-2"
                    >
                      Show more
                    </Button>
                  </CardContent>
                </Card>
                
                <!-- Additional Metadata -->
                <div v-if="activity.metadata" class="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div v-for="(value, key) in activity.metadata" :key="key" class="flex justify-between">
                    <span class="capitalize">{{ key.replace(/([A-Z])/g, ' $1').toLowerCase() }}:</span>
                    <span class="font-mono">{{ value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.activity-timeline-item {
  @apply transition-colors duration-200;
}

.activity-timeline-item:hover {
  @apply bg-muted/30 rounded-lg px-2 py-1;
}

.activity-timeline-item.compact {
  @apply py-1;
}

.activity-item-detailed {
  @apply relative;
}

/* Timeline connector styling */
.activity-item-detailed .w-px {
  background: linear-gradient(to bottom, 
    hsl(var(--border)) 0%, 
    hsl(var(--border)) 50%, 
    transparent 100%
  );
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .activity-timeline-item {
    @apply px-1;
  }
  
  .activity-item-detailed .flex {
    @apply gap-2;
  }
  
  .activity-item-detailed .w-8 {
    @apply w-6 h-6;
  }
  
  .activity-item-detailed .w-4 {
    @apply w-3 h-3;
  }
}

/* Focus states for accessibility */
.activity-timeline-item :focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
}

/* Animation for expand/collapse */
.activity-timeline-item .space-y-2 > div {
  @apply transition-all duration-200 ease-in-out;
}
</style>