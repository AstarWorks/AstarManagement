<template>
  <div 
    class="memo-card"
    :class="{
      'memo-card--selected': selected,
      'memo-card--unread': memo.status === 'sent' && !memo.readAt,
      'memo-card--priority': memo.priority === 'high' || memo.priority === 'urgent'
    }"
    @click="handleClick"
  >
    <!-- Selection Checkbox -->
    <div v-if="showSelection" class="memo-selection">
      <Checkbox
        :checked="selected"
        @update:checked="handleSelect"
        @click.stop
      />
    </div>
    
    <!-- Priority Indicator -->
    <div 
      v-if="memo.priority !== 'low'"
      class="priority-indicator"
      :class="getPriorityClass(memo.priority)"
    />
    
    <!-- Card Header -->
    <div class="card-header">
      <div class="header-top">
        <div class="memo-meta">
          <h3 class="memo-subject" v-html="highlightText(memo.subject, searchTerms)" />
          <div class="memo-recipient">
            <component :is="getRecipientIcon(memo.recipient.type)" class="recipient-icon" />
            <span class="recipient-name">{{ memo.recipient.name }}</span>
            <Badge :variant="getRecipientBadgeVariant(memo.recipient.type)" class="recipient-type">
              {{ memo.recipient.type.replace('_', ' ') }}
            </Badge>
          </div>
        </div>
        
        <div class="memo-status">
          <Badge :variant="getStatusVariant(memo.status)" class="status-badge">
            <component :is="getStatusIcon(memo.status)" class="size-3 mr-1" />
            {{ memo.status }}
          </Badge>
        </div>
      </div>
      
      <div class="header-bottom">
        <div class="memo-info">
          <span class="case-number">{{ memo.caseNumber }}</span>
          <span class="memo-date">{{ formatDate(memo.sentAt || '2024-01-01') }}</span>
        </div>
        
        <div class="memo-indicators">
          <div v-if="memo.attachments.length > 0" class="indicator" title="Has attachments">
            <Paperclip class="size-3" />
          </div>
          <div v-if="memo.tags.length > 0" class="indicator" title="Tagged">
            <Tag class="size-3" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Card Content -->
    <div class="card-content">
      <p class="memo-excerpt" v-html="highlightText(memo.content.substring(0, 150) + '...', searchTerms)" />
      
      <!-- Tags -->
      <div v-if="memo.tags.length > 0" class="memo-tags">
        <Badge
          v-for="tag in memo.tags.slice(0, 3)"
          :key="tag"
          variant="outline"
          class="tag-badge"
        >
          {{ tag }}
        </Badge>
        <Badge
          v-if="memo.tags.length > 3"
          variant="outline"
          class="tag-badge more-tags"
        >
          +{{ memo.tags.length - 3 }}
        </Badge>
      </div>
    </div>
    
    <!-- Card Actions -->
    <div class="card-actions">
      <Button
        variant="ghost"
        size="sm"
        @click.stop="handleView"
        class="action-button"
      >
        <Eye class="size-4 mr-2" />
        View
      </Button>
      
      <Button
        v-if="memo.status === 'draft'"
        variant="ghost"
        size="sm"
        @click.stop="handleEdit"
        class="action-button"
      >
        <Edit class="size-4 mr-2" />
        Edit
      </Button>
      
      <Button
        v-else-if="memo.recipient.type === 'client'"
        variant="ghost"
        size="sm"
        @click.stop="handleReply"
        class="action-button"
      >
        <Reply class="size-4 mr-2" />
        Reply
      </Button>
      
      <!-- More Actions Menu -->
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" @click.stop>
            <MoreHorizontal class="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="handleEdit">
            <Edit class="size-4 mr-2" />
            Edit
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
import { format } from 'date-fns'

interface Props {
  memo: Memo
  selected?: boolean
  searchTerms?: string[]
  showSelection?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  searchTerms: () => [],
  showSelection: false
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
    medium: 'priority-medium',
    high: 'priority-high',
    urgent: 'priority-urgent'
  }
  return classes[priority as keyof typeof classes] || ''
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    return format(date, 'HH:mm')
  } else if (diffInDays < 7) {
    return format(date, 'EEE')
  } else {
    return format(date, 'MMM d')
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
.memo-card {
  @apply relative bg-card border border-border rounded-lg p-4 cursor-pointer transition-all;
  @apply hover:shadow-md hover:border-primary/50;
}

.memo-card--selected {
  @apply border-primary bg-primary/5;
}

.memo-card--unread {
  @apply border-l-4 border-l-blue-500;
}

.memo-card--priority {
  @apply shadow-sm;
}

.memo-selection {
  @apply absolute top-2 left-2 z-10;
}

.priority-indicator {
  @apply absolute top-0 right-0 w-0 h-0 border-solid border-transparent;
  @apply border-t-8 border-r-8;
}

.priority-indicator.priority-medium {
  @apply border-t-yellow-500 border-r-yellow-500;
}

.priority-indicator.priority-high {
  @apply border-t-orange-500 border-r-orange-500;
}

.priority-indicator.priority-urgent {
  @apply border-t-red-500 border-r-red-500;
}

.card-header {
  @apply space-y-3 mb-4;
}

.header-top {
  @apply flex justify-between items-start gap-3;
}

.memo-meta {
  @apply flex-1 min-w-0;
}

.memo-subject {
  @apply font-medium text-foreground text-base line-clamp-2 mb-2;
}

.memo-subject :deep(mark) {
  @apply bg-yellow-200 text-yellow-900 px-0 py-0 rounded-none;
}

.memo-recipient {
  @apply flex items-center gap-2;
}

.recipient-icon {
  @apply size-3 text-muted-foreground;
}

.recipient-name {
  @apply text-sm text-muted-foreground truncate;
}

.recipient-type {
  @apply text-xs capitalize;
}

.memo-status {
  @apply flex-shrink-0;
}

.status-badge {
  @apply text-xs;
}

.header-bottom {
  @apply flex justify-between items-center;
}

.memo-info {
  @apply flex items-center gap-3 text-xs text-muted-foreground;
}

.case-number {
  @apply font-mono;
}

.memo-indicators {
  @apply flex items-center gap-2;
}

.indicator {
  @apply text-muted-foreground;
}

.card-content {
  @apply space-y-3 mb-4;
}

.memo-excerpt {
  @apply text-sm text-muted-foreground line-clamp-3;
}

.memo-excerpt :deep(mark) {
  @apply bg-yellow-200 text-yellow-900 px-0 py-0 rounded-none;
}

.memo-tags {
  @apply flex flex-wrap gap-2;
}

.tag-badge {
  @apply text-xs;
}

.more-tags {
  @apply text-muted-foreground;
}

.card-actions {
  @apply flex items-center gap-1 pt-3 border-t border-border;
}

.action-button {
  @apply text-xs;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .memo-card {
    @apply p-3;
  }
  
  .header-top {
    @apply flex-col gap-2 items-start;
  }
  
  .memo-recipient {
    @apply flex-wrap;
  }
  
  .card-actions {
    @apply flex-wrap gap-2;
  }
}
</style>