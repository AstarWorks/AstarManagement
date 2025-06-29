<template>
  <CommunicationLayout>
    <template #header-actions>
      <div class="timeline-header-actions">
        <Button variant="outline" size="sm" @click="toggleView">
          <component :is="viewIcon" class="size-4 mr-2" />
          {{ viewMode === 'timeline' ? 'List View' : 'Timeline View' }}
        </Button>
        <Button @click="showCreateDialog = true">
          <Plus class="size-4 mr-2" />
          New Communication
        </Button>
      </div>
    </template>
    
    <div class="timeline-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h2 class="text-xl font-semibold text-foreground">Communication Timeline</h2>
          <p class="text-muted-foreground">
            Chronological view of all communications across your matters
          </p>
        </div>
        
        <!-- Quick Stats -->
        <div class="timeline-stats">
          <div class="stat-item">
            <div class="stat-value">{{ totalCommunications }}</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ todayCount }}</div>
            <div class="stat-label">Today</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ unreadCount }}</div>
            <div class="stat-label">Unread</div>
          </div>
        </div>
      </div>
      
      <!-- Timeline Component -->
      <div class="timeline-wrapper">
        <CommunicationTimeline
          :auto-refresh="true"
          @item-click="handleItemClick"
          @item-reply="handleItemReply"
          @item-add-note="handleItemAddNote"
        />
      </div>
    </div>
    
    <!-- Communication Detail Modal -->
    <Dialog v-model:open="showDetailModal">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ selectedCommunication?.subject }}</DialogTitle>
          <DialogDescription>
            {{ selectedCommunication?.type }} • {{ formatDate(selectedCommunication?.timestamp) }}
          </DialogDescription>
        </DialogHeader>
        
        <div v-if="selectedCommunication" class="communication-detail">
          <!-- Communication Details -->
          <div class="detail-content">
            <div class="detail-meta">
              <div class="meta-item">
                <span class="meta-label">Type:</span>
                <Badge :variant="getTypeVariant(selectedCommunication.type)">
                  {{ selectedCommunication.type }}
                </Badge>
              </div>
              
              <div class="meta-item">
                <span class="meta-label">Participants:</span>
                <div class="participants-list">
                  <span
                    v-for="participant in selectedCommunication.participants"
                    :key="participant.id"
                    class="participant"
                  >
                    {{ participant.name }} ({{ participant.role }})
                  </span>
                </div>
              </div>
              
              <div v-if="selectedCommunication.relatedMatterTitle" class="meta-item">
                <span class="meta-label">Matter:</span>
                <span class="meta-value">{{ selectedCommunication.relatedMatterTitle }}</span>
              </div>
              
              <div v-if="selectedCommunication.duration" class="meta-item">
                <span class="meta-label">Duration:</span>
                <span class="meta-value">{{ formatDuration(selectedCommunication.duration) }}</span>
              </div>
            </div>
            
            <div v-if="selectedCommunication.summary" class="detail-summary">
              <h4 class="summary-title">Summary</h4>
              <p class="summary-text">{{ selectedCommunication.summary }}</p>
            </div>
            
            <div v-if="selectedCommunication.content" class="detail-content-text">
              <h4 class="content-title">Content</h4>
              <div class="content-text" v-html="selectedCommunication.content" />
            </div>
            
            <div v-if="selectedCommunication.attachments?.length" class="detail-attachments">
              <h4 class="attachments-title">Attachments</h4>
              <div class="attachments-list">
                <div
                  v-for="attachment in selectedCommunication.attachments"
                  :key="attachment.id"
                  class="attachment-item"
                >
                  <Paperclip class="attachment-icon" />
                  <span class="attachment-name">{{ attachment.name }}</span>
                  <span class="attachment-size">{{ formatFileSize(attachment.size) }}</span>
                  <Button variant="ghost" size="sm">
                    <Download class="size-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div v-if="selectedCommunication.tags?.length" class="detail-tags">
              <h4 class="tags-title">Tags</h4>
              <div class="tags-list">
                <Badge
                  v-for="tag in selectedCommunication.tags"
                  :key="tag"
                  variant="outline"
                >
                  #{{ tag }}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="showDetailModal = false">
            Close
          </Button>
          <Button @click="replyToCommunication">
            <Reply class="size-4 mr-2" />
            Reply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <!-- Create Communication Dialog -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Communication</DialogTitle>
          <DialogDescription>
            Choose the type of communication you want to create
          </DialogDescription>
        </DialogHeader>
        
        <div class="create-options">
          <button
            v-for="option in createOptions"
            :key="option.id"
            class="create-option"
            @click="createCommunication(option.id)"
          >
            <component :is="option.icon" class="option-icon" />
            <div class="option-content">
              <span class="option-title">{{ option.title }}</span>
              <span class="option-description">{{ option.description }}</span>
            </div>
          </button>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="showCreateDialog = false">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </CommunicationLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Plus,
  List,
  Clock,
  Reply,
  Paperclip,
  Download,
  MessageSquare,
  Mail,
  Phone,
  StickyNote,
  Users,
  FileText
} from 'lucide-vue-next'
import type { Communication } from '~/types/communication'
import { CommunicationLayout } from '~/components/communication'
import CommunicationTimeline from '~/components/communication/CommunicationTimeline.vue'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '~/components/ui/dialog'

// Define the page meta
definePageMeta({
  title: 'Communication Timeline',
  description: 'Chronological view of all communications'
})

// Reactive state
const viewMode = ref<'timeline' | 'list'>('timeline')
const showDetailModal = ref(false)
const showCreateDialog = ref(false)
const selectedCommunication = ref<Communication | null>(null)

// Mock statistics
const totalCommunications = ref(147)
const todayCount = ref(8)
const unreadCount = ref(23)

// Create options
const createOptions = [
  {
    id: 'memo',
    title: 'Client Memo',
    description: 'Send a memo to a client or external party',
    icon: MessageSquare
  },
  {
    id: 'email',
    title: 'Email',
    description: 'Compose and send an email',
    icon: Mail
  },
  {
    id: 'call',
    title: 'Phone Call',
    description: 'Log a phone call or schedule one',
    icon: Phone
  },
  {
    id: 'note',
    title: 'Internal Note',
    description: 'Add an internal team note',
    icon: StickyNote
  },
  {
    id: 'meeting',
    title: 'Meeting',
    description: 'Schedule or log a meeting',
    icon: Users
  }
]

// Computed
const viewIcon = computed(() => viewMode.value === 'timeline' ? List : Clock)

// Methods
const toggleView = () => {
  viewMode.value = viewMode.value === 'timeline' ? 'list' : 'timeline'
}

const handleItemClick = (communication: Communication) => {
  selectedCommunication.value = communication
  showDetailModal.value = true
}

const handleItemReply = (communication: Communication) => {
  console.log('Reply to:', communication.id)
  // Navigate to appropriate reply interface
  const replyRoutes = {
    memo: '/communications/memos?reply=',
    email: '/communications/emails?reply=',
    phone: '/communications/calls?callback=',
    note: '/communications/notes?reply=',
    meeting: '/communications?schedule-meeting=',
    document: '/communications?create-response='
  }
  
  const route = replyRoutes[communication.type as keyof typeof replyRoutes]
  if (route) {
    navigateTo(route + communication.id)
  }
}

const handleItemAddNote = (communication: Communication) => {
  console.log('Add note to:', communication.id)
  navigateTo(`/communications/notes?create=true&related=${communication.id}`)
}

const replyToCommunication = () => {
  if (selectedCommunication.value) {
    handleItemReply(selectedCommunication.value)
    showDetailModal.value = false
  }
}

const createCommunication = (type: string) => {
  const routes = {
    memo: '/communications/memos?create=true',
    email: '/communications/emails?compose=true',
    call: '/communications/calls?create=true',
    note: '/communications/notes?create=true',
    meeting: '/communications?create-meeting=true'
  }
  
  const route = routes[type as keyof typeof routes]
  if (route) {
    navigateTo(route)
  }
  
  showCreateDialog.value = false
}

const getTypeVariant = (type: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
  const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
    memo: 'default',
    email: 'secondary',
    phone: 'outline',
    note: 'secondary',
    meeting: 'default',
    document: 'outline'
  }
  return variants[type] || 'default'
}

const formatDate = (date?: Date) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const formatFileSize = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}
</script>

<style scoped>
.timeline-page {
  @apply space-y-6;
}

.timeline-header-actions {
  @apply flex items-center gap-2;
}

.page-header {
  @apply flex justify-between items-start gap-6;
}

.header-content {
  @apply space-y-1;
}

.timeline-stats {
  @apply flex gap-6;
}

.stat-item {
  @apply text-center;
}

.stat-value {
  @apply text-2xl font-bold text-foreground;
}

.stat-label {
  @apply text-sm text-muted-foreground;
}

.timeline-wrapper {
  @apply flex-1 min-h-0;
}

.communication-detail {
  @apply space-y-6;
}

.detail-meta {
  @apply space-y-3;
}

.meta-item {
  @apply flex items-start gap-3;
}

.meta-label {
  @apply text-sm font-medium text-muted-foreground min-w-[80px];
}

.meta-value {
  @apply text-sm text-foreground;
}

.participants-list {
  @apply flex flex-wrap gap-2;
}

.participant {
  @apply text-sm bg-muted rounded px-2 py-1;
}

.detail-summary,
.detail-content-text {
  @apply space-y-2;
}

.summary-title,
.content-title,
.attachments-title,
.tags-title {
  @apply text-sm font-medium text-foreground;
}

.summary-text {
  @apply text-sm text-muted-foreground leading-relaxed;
}

.content-text {
  @apply text-sm text-foreground leading-relaxed prose prose-sm max-w-none;
}

.detail-attachments {
  @apply space-y-3;
}

.attachments-list {
  @apply space-y-2;
}

.attachment-item {
  @apply flex items-center gap-3 p-2 bg-muted rounded;
}

.attachment-icon {
  @apply size-4 text-muted-foreground;
}

.attachment-name {
  @apply flex-1 text-sm font-medium;
}

.attachment-size {
  @apply text-xs text-muted-foreground;
}

.detail-tags {
  @apply space-y-2;
}

.tags-list {
  @apply flex flex-wrap gap-2;
}

.create-options {
  @apply space-y-2;
}

.create-option {
  @apply w-full flex items-center gap-3 p-3 rounded-lg border border-border;
  @apply hover:bg-accent hover:border-accent-foreground/20 transition-colors;
  @apply text-left;
}

.option-icon {
  @apply size-8 text-primary flex-shrink-0;
}

.option-content {
  @apply flex flex-col;
}

.option-title {
  @apply font-medium text-foreground;
}

.option-description {
  @apply text-sm text-muted-foreground;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .page-header {
    @apply flex-col gap-4;
  }
  
  .timeline-stats {
    @apply grid grid-cols-3 gap-4 w-full;
  }
  
  .timeline-header-actions {
    @apply flex-col w-full;
  }
  
  .meta-item {
    @apply flex-col gap-1;
  }
  
  .meta-label {
    @apply min-w-0;
  }
}
</style>