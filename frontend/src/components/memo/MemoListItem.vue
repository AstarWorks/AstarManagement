<template>
  <div 
    class="memo-list-item"
    :class="{
      'memo-item--selected': selected,
      'memo-item--unread': memo.status === 'sent' && !memo.readAt,
      'memo-item--priority': memo.priority === 'high' || memo.priority === 'urgent'
    }"
    @click="handleClick"
  >
    <!-- Selection Column -->
    <div class="item-column item-selection">
      <Checkbox
        :checked="selected"
        @update:checked="handleSelect"
        @click.stop
      />
    </div>
    
    <!-- Priority Column -->
    <div class="item-column item-priority">
      <div 
        class="priority-dot"
        :class="getPriorityClass(memo.priority)"
        :title="memo.priority"
      />
    </div>
    
    <!-- Subject Column -->
    <div class="item-column item-subject">
      <div class="subject-content">
        <h3 class="subject-text" v-html="highlightText(memo.subject, searchTerms)" />
        <div class="subject-meta">
          <span class="case-number">{{ memo.caseNumber }}</span>
          <div v-if="memo.tags.length > 0" class="tags-preview">
            <Tag class="size-3" />
            <span class="tags-count">{{ memo.tags.length }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Recipient Column -->
    <div class="item-column item-recipient">
      <div class="recipient-content">
        <div class="recipient-info">
          <component :is="getRecipientIcon(memo.recipient.type)" class="recipient-icon" />
          <span class="recipient-name">{{ memo.recipient.name }}</span>
        </div>
        <Badge :variant="getRecipientBadgeVariant(memo.recipient.type)" class="recipient-type">
          {{ memo.recipient.type.replace('_', ' ') }}
        </Badge>
      </div>
    </div>
    
    <!-- Status Column -->
    <div class="item-column item-status">
      <Badge :variant="getStatusVariant(memo.status)" class="status-badge">
        <component :is="getStatusIcon(memo.status)" class="size-3 mr-1" />
        {{ memo.status }}
      </Badge>
    </div>
    
    <!-- Date Column -->
    <div class="item-column item-date">
      <div class="date-content">
        <span class="date-primary">{{ formatDate(memo.sentAt || '2024-01-01') }}</span>
        <span class="date-secondary">{{ formatDateSecondary(memo.sentAt || '2024-01-01') }}</span>
      </div>
    </div>
    
    <!-- Indicators Column -->
    <div class="item-column item-indicators">
      <div class="indicators">
        <div v-if="memo.attachments.length > 0" class="indicator" title="Has attachments">
          <Paperclip class="size-3" />
        </div>
        <div v-if="memo.status === 'sent' && !memo.readAt" class="indicator unread-indicator" title="Unread">
          <Circle class="size-2 fill-current" />
        </div>
      </div>
    </div>
    
    <!-- Actions Column -->
    <div class="item-column item-actions">
      <div class="actions">
        <Button
          variant="ghost"
          size="sm"
          @click.stop="handleView"
          class="action-button"
        >
          <Eye class="size-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" @click.stop>
              <MoreHorizontal class="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="handleView">
              <Eye class="size-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleEdit">
              <Edit class="size-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              v-if="memo.recipient.type === 'client'"
              @click="handleReply"
            >
              <Reply class="size-4 mr-2" />
              Reply
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleDuplicate">
              <Copy class="size-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              v-if="memo.status !== 'archived'"
              @click="handleArchive"
            >
              <Archive class="size-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem 
              v-else
              @click="handleUnarchive"
            >
              <ArchiveRestore class="size-4 mr-2" />
              Unarchive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="handleDelete" class="text-destructive">
              <Trash2 class="size-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Eye,
  Edit,
  Reply,
  MoreHorizontal,
  Copy,
  Archive,
  ArchiveRestore,
  Trash2,
  Paperclip,
  Tag,
  Circle,
  User,
  Building2,
  Gavel,
  Users,
  FileEdit,
  Send,
  CheckCheck,
  Archive as ArchiveIcon
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import type { Memo } from '~/types/memo'
import { format, isToday, isYesterday, isThisYear } from 'date-fns'

interface Props {
  memo: Memo
  selected?: boolean
  searchTerms?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  searchTerms: () => []
})

const emit = defineEmits<{
  click: []
  select: [selected: boolean]
  view: []
  edit: []
  reply: []
  duplicate: []
  archive: []
  unarchive: []
  delete: []
}>()

// Methods
const handleClick = () => {
  emit('click')
}

const handleSelect = (selected: boolean) => {
  emit('select', selected)
}

const handleView = () => {
  emit('view')
}

const handleEdit = () => {
  emit('edit')
}

const handleReply = () => {
  emit('reply')
}

const handleDuplicate = () => {
  emit('duplicate')
}

const handleArchive = () => {
  emit('archive')
}

const handleUnarchive = () => {
  emit('unarchive')
}

const handleDelete = () => {
  emit('delete')
}

const getRecipientIcon = (type: string) => {
  const icons = {
    client: User,
    court: Gavel,
    opposing_counsel: Users,
    internal: Building2
  }
  return icons[type as keyof typeof icons] || User
}

const getRecipientBadgeVariant = (type: string): 'default' | 'secondary' | 'outline' => {
  const variants = {
    client: 'default' as const,
    court: 'secondary' as const,
    opposing_counsel: 'outline' as const,
    internal: 'secondary' as const
  }
  return variants[type as keyof typeof variants] || 'default'
}

const getStatusIcon = (status: string) => {
  const icons = {
    draft: FileEdit,
    sent: Send,
    read: CheckCheck,
    archived: ArchiveIcon
  }
  return icons[status as keyof typeof icons] || FileEdit
}

const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
  const variants = {
    draft: 'outline' as const,
    sent: 'default' as const,
    read: 'secondary' as const,
    archived: 'outline' as const
  }
  return variants[status as keyof typeof variants] || 'default'
}

const getPriorityClass = (priority: string) => {
  const classes = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
    urgent: 'priority-urgent'
  }
  return classes[priority as keyof typeof classes] || 'priority-low'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  
  if (isToday(date)) {
    return format(date, 'HH:mm')
  } else if (isYesterday(date)) {
    return 'Yesterday'
  } else if (isThisYear(date)) {
    return format(date, 'MMM d')
  } else {
    return format(date, 'MMM d, yyyy')
  }
}

const formatDateSecondary = (dateString: string) => {
  const date = new Date(dateString)
  
  if (isToday(date)) {
    return 'Today'
  } else if (isYesterday(date)) {
    return format(date, 'HH:mm')
  } else {
    return format(date, 'EEE')
  }
}

const highlightText = (text: string, searchTerms: string[] = []) => {
  if (!searchTerms.length || !text) return text
  
  let highlighted = text
  searchTerms.forEach(term => {
    if (term.length > 2) {
      const regex = new RegExp(`(${term})`, 'gi')
      highlighted = highlighted.replace(regex, '<mark>$1</mark>')
    }
  })
  
  return highlighted
}
</script>

<style scoped>
.memo-list-item {
  @apply grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto_auto] gap-4 items-center;
  @apply p-4 bg-card border border-border rounded-lg cursor-pointer transition-all;
  @apply hover:shadow-sm hover:border-primary/50;
}

.memo-item--selected {
  @apply border-primary bg-primary/5;
}

.memo-item--unread {
  @apply border-l-4 border-l-blue-500;
}

.memo-item--priority.memo-item--unread {
  @apply border-l-orange-500;
}

.item-column {
  @apply flex items-center;
}

.item-selection {
  @apply w-8;
}

.item-priority {
  @apply w-6;
}

.priority-dot {
  @apply size-3 rounded-full;
}

.priority-dot.priority-low {
  @apply bg-green-500;
}

.priority-dot.priority-medium {
  @apply bg-yellow-500;
}

.priority-dot.priority-high {
  @apply bg-orange-500;
}

.priority-dot.priority-urgent {
  @apply bg-red-500;
}

.item-subject {
  @apply min-w-0;
}

.subject-content {
  @apply space-y-1;
}

.subject-text {
  @apply font-medium text-foreground text-sm line-clamp-1;
}

.subject-text :deep(mark) {
  @apply bg-yellow-200 text-yellow-900 px-0 py-0 rounded-none;
}

.subject-meta {
  @apply flex items-center gap-3 text-xs text-muted-foreground;
}

.case-number {
  @apply font-mono;
}

.tags-preview {
  @apply flex items-center gap-1;
}

.tags-count {
  @apply text-xs;
}

.item-recipient {
  @apply min-w-0;
}

.recipient-content {
  @apply space-y-1;
}

.recipient-info {
  @apply flex items-center gap-2;
}

.recipient-icon {
  @apply size-3 text-muted-foreground flex-shrink-0;
}

.recipient-name {
  @apply text-sm text-foreground truncate;
}

.recipient-type {
  @apply text-xs capitalize;
}

.item-status {
  @apply w-20;
}

.status-badge {
  @apply text-xs;
}

.item-date {
  @apply w-20 text-right;
}

.date-content {
  @apply space-y-0.5;
}

.date-primary {
  @apply block text-sm font-medium text-foreground;
}

.date-secondary {
  @apply block text-xs text-muted-foreground;
}

.item-indicators {
  @apply w-8;
}

.indicators {
  @apply flex items-center gap-1;
}

.indicator {
  @apply text-muted-foreground;
}

.unread-indicator {
  @apply text-blue-500;
}

.item-actions {
  @apply w-16;
}

.actions {
  @apply flex items-center gap-1;
}

.action-button {
  @apply p-2;
}

/* Mobile responsiveness */
@media (max-width: 1024px) {
  .memo-list-item {
    @apply grid-cols-[auto_1fr_auto_auto] gap-3;
  }
  
  .item-priority,
  .item-recipient,
  .item-indicators {
    @apply hidden;
  }
  
  .item-subject {
    @apply min-w-0;
  }
  
  .subject-content {
    @apply space-y-2;
  }
  
  .subject-meta {
    @apply flex-wrap gap-2;
  }
}

@media (max-width: 640px) {
  .memo-list-item {
    @apply grid-cols-[auto_1fr_auto] gap-2 p-3;
  }
  
  .item-date {
    @apply hidden;
  }
  
  .date-primary {
    @apply text-xs;
  }
}
</style>