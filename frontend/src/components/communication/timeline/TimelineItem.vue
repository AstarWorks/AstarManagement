<template>
  <div class="timeline-item" :class="{ 'timeline-item--unread': !communication.isRead }">
    <div class="timeline-line" />
    
    <div class="timeline-content">
      <!-- Timeline Icon -->
      <div class="timeline-icon" :class="`timeline-icon--${communication.type}`">
        <component :is="getTypeIcon(communication.type)" class="size-4" />
      </div>
      
      <!-- Main Content -->
      <div class="timeline-main">
        <div class="timeline-header">
          <div class="timeline-meta">
            <Badge :variant="getTypeVariant(communication.type)" class="type-badge">
              {{ communication.type }}
            </Badge>
            <span v-if="communication.isImportant" class="importance-indicator">
              <Star class="size-3 fill-current text-amber-500" />
            </span>
            <span class="timeline-time">{{ formatTime(communication.timestamp) }}</span>
          </div>
          
          <div class="timeline-actions">
            <Button variant="ghost" size="sm" @click.stop="toggleRead">
              <component :is="communication.isRead ? MailOpen : Mail" class="size-4" />
            </Button>
            <Button variant="ghost" size="sm" @click.stop="showDetails">
              <Eye class="size-4" />
            </Button>
          </div>
        </div>
        
        <div class="timeline-body">
          <h3 class="timeline-subject">{{ communication.subject }}</h3>
          
          <!-- Participants -->
          <div class="timeline-participants">
            <div class="participants-list">
              <span
                v-for="participant in communication.participants.slice(0, 3)"
                :key="participant.id"
                class="participant"
              >
                {{ participant.name }}
              </span>
              <span 
                v-if="communication.participants.length > 3"
                class="participant-more"
              >
                +{{ communication.participants.length - 3 }} more
              </span>
            </div>
          </div>
          
          <!-- Summary -->
          <div v-if="communication.summary" class="timeline-summary">
            <p class="summary-text">{{ communication.summary }}</p>
          </div>
          
          <!-- Related Matter -->
          <div v-if="communication.relatedMatterTitle" class="timeline-matter">
            <Briefcase class="matter-icon" />
            <span class="matter-title">{{ communication.relatedMatterTitle }}</span>
          </div>
          
          <!-- Attachments -->
          <div v-if="communication.attachments?.length" class="timeline-attachments">
            <div
              v-for="attachment in communication.attachments"
              :key="attachment.id"
              class="attachment-item"
            >
              <Paperclip class="attachment-icon" />
              <span class="attachment-name">{{ attachment.name }}</span>
              <span class="attachment-size">{{ formatFileSize(attachment.size) }}</span>
            </div>
          </div>
          
          <!-- Duration (for calls/meetings) -->
          <div v-if="communication.duration" class="timeline-duration">
            <Clock class="duration-icon" />
            <span class="duration-text">{{ formatDuration(communication.duration) }}</span>
          </div>
          
          <!-- Tags -->
          <div v-if="communication.tags?.length" class="timeline-tags">
            <Badge
              v-for="tag in communication.tags"
              :key="tag"
              variant="outline"
              class="tag-badge"
            >
              #{{ tag }}
            </Badge>
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="timeline-footer">
          <Button variant="ghost" size="sm" @click.stop="reply">
            <Reply class="size-4 mr-2" />
            Reply
          </Button>
          <Button v-if="communication.type === 'phone'" variant="ghost" size="sm" @click.stop="callback">
            <Phone class="size-4 mr-2" />
            Call Back
          </Button>
          <Button variant="ghost" size="sm" @click.stop="addNote">
            <Plus class="size-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  Star,
  Mail,
  MailOpen,
  Eye,
  Briefcase,
  Paperclip,
  Clock,
  Reply,
  Phone,
  Plus,
  MessageSquare,
  StickyNote,
  Users,
  FileText
} from 'lucide-vue-next'
import type { Communication } from '~/types/communication'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

interface Props {
  communication: Communication
  isLast?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [communication: Communication]
  toggleRead: [communication: Communication]
  reply: [communication: Communication]
  addNote: [communication: Communication]
}>()

// Methods
const getTypeIcon = (type: string) => {
  const icons = {
    memo: MessageSquare,
    email: Mail,
    phone: Phone,
    note: StickyNote,
    meeting: Users,
    document: FileText
  }
  return icons[type as keyof typeof icons] || MessageSquare
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

const formatTime = (date: Date) => {
  const now = new Date()
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffHours < 48) return 'Yesterday'
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
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

const toggleRead = () => {
  emit('toggleRead', props.communication)
}

const showDetails = () => {
  emit('click', props.communication)
}

const reply = () => {
  emit('reply', props.communication)
}

const callback = () => {
  console.log('Calling back:', props.communication.participants[0]?.phone)
}

const addNote = () => {
  emit('addNote', props.communication)
}
</script>

<style scoped>
.timeline-item {
  @apply relative;
}

.timeline-item:not(:last-child) .timeline-line {
  @apply absolute left-6 top-12 bottom-0 w-px bg-border;
}

.timeline-item--unread {
  @apply bg-accent/20 rounded-lg;
}

.timeline-content {
  @apply flex gap-4 p-4;
}

.timeline-icon {
  @apply size-12 rounded-full flex items-center justify-center flex-shrink-0 relative z-10;
}

.timeline-icon--memo {
  @apply bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400;
}

.timeline-icon--email {
  @apply bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400;
}

.timeline-icon--phone {
  @apply bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400;
}

.timeline-icon--note {
  @apply bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400;
}

.timeline-icon--meeting {
  @apply bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400;
}

.timeline-icon--document {
  @apply bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400;
}

.timeline-main {
  @apply flex-1 space-y-3;
}

.timeline-header {
  @apply flex justify-between items-start;
}

.timeline-meta {
  @apply flex items-center gap-2;
}

.type-badge {
  @apply text-xs;
}

.importance-indicator {
  @apply flex items-center;
}

.timeline-time {
  @apply text-xs text-muted-foreground;
}

.timeline-actions {
  @apply flex gap-1;
}

.timeline-body {
  @apply space-y-3;
}

.timeline-subject {
  @apply font-medium text-foreground text-base;
}

.timeline-item--unread .timeline-subject {
  @apply font-semibold;
}

.timeline-participants {
  @apply text-sm text-muted-foreground;
}

.participants-list {
  @apply flex items-center gap-1;
}

.participant {
  @apply after:content-[','] after:mr-1 last:after:content-[''];
}

.participant-more {
  @apply font-medium;
}

.timeline-summary {
  @apply bg-muted/50 rounded-md p-3;
}

.summary-text {
  @apply text-sm text-foreground line-clamp-3;
}

.timeline-matter {
  @apply flex items-center gap-2 text-sm text-muted-foreground;
}

.matter-icon {
  @apply size-4;
}

.matter-title {
  @apply font-medium;
}

.timeline-attachments {
  @apply space-y-1;
}

.attachment-item {
  @apply flex items-center gap-2 text-sm text-muted-foreground;
  @apply bg-muted rounded px-2 py-1 inline-flex;
}

.attachment-icon {
  @apply size-3;
}

.attachment-size {
  @apply ml-auto text-xs;
}

.timeline-duration {
  @apply flex items-center gap-2 text-sm text-muted-foreground;
}

.duration-icon {
  @apply size-4;
}

.timeline-tags {
  @apply flex flex-wrap gap-1;
}

.tag-badge {
  @apply text-xs;
}

.timeline-footer {
  @apply flex gap-2 pt-3 border-t border-border;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .timeline-content {
    @apply p-3 gap-3;
  }
  
  .timeline-icon {
    @apply size-10;
  }
  
  .timeline-header {
    @apply flex-col gap-2 items-start;
  }
  
  .timeline-actions {
    @apply self-end;
  }
  
  .timeline-footer {
    @apply grid grid-cols-2 gap-2;
  }
}
</style>