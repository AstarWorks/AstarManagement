<template>
  <CommunicationLayout>
    <template #header-actions>
      <Button @click="showCreateMemo = true">
        <Plus class="size-4 mr-2" />
        New Memo
      </Button>
    </template>
    
    <div class="memos-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h2 class="text-xl font-semibold text-foreground">Client Memos</h2>
          <p class="text-muted-foreground">
            Manage communications with clients and external parties
          </p>
        </div>
      </div>
      
      <!-- Filters and Search -->
      <div class="filters-section">
        <div class="search-filters">
          <div class="search-box">
            <Search class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search memos..."
              class="search-input"
            />
          </div>
          <Select v-model="statusFilter">
            <SelectTrigger class="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <!-- Memos List -->
      <div class="memos-list">
        <div 
          v-for="memo in filteredMemos"
          :key="memo.id"
          class="memo-card"
          @click="selectMemo(memo)"
        >
          <div class="memo-header">
            <div class="memo-meta">
              <h3 class="memo-title">{{ memo.subject }}</h3>
              <p class="memo-client">{{ memo.clientName }}</p>
            </div>
            <div class="memo-status">
              <Badge :variant="getStatusVariant(memo.status)">
                {{ memo.status }}
              </Badge>
              <span class="memo-date">{{ formatDate(memo.createdAt) }}</span>
            </div>
          </div>
          <div class="memo-preview">
            <p class="memo-excerpt">{{ memo.excerpt }}</p>
          </div>
          <div class="memo-actions">
            <Button variant="ghost" size="sm">
              <MessageSquare class="size-4 mr-2" />
              Reply
            </Button>
            <Button variant="ghost" size="sm">
              <Eye class="size-4 mr-2" />
              View
            </Button>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="filteredMemos.length === 0" class="empty-state">
        <MessageSquare class="empty-icon" />
        <h3 class="empty-title">No memos found</h3>
        <p class="empty-description">
          {{ searchQuery ? 'Try adjusting your search terms' : 'Create your first client memo to get started' }}
        </p>
        <Button @click="showCreateMemo = true">
          <Plus class="size-4 mr-2" />
          Create Memo
        </Button>
      </div>
    </div>
  </CommunicationLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Eye 
} from 'lucide-vue-next'
import { CommunicationLayout } from '~/components/communication'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

// Define the page meta
definePageMeta({
  title: 'Client Memos',
  description: 'Manage client memos and external communications'
})

// Reactive state
const showCreateMemo = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')

// Mock memos data
const memos = ref([
  {
    id: 1,
    subject: 'Contract Review - Q1 2024',
    clientName: 'Acme Corporation',
    status: 'sent',
    createdAt: new Date('2024-01-15'),
    excerpt: 'Please review the attached contract terms for the Q1 2024 engagement...',
    hasAttachments: true
  },
  {
    id: 2,
    subject: 'Legal Opinion Request',
    clientName: 'Tech Startup Inc.',
    status: 'draft',
    createdAt: new Date('2024-01-14'),
    excerpt: 'Following our discussion yesterday, I am preparing a legal opinion on...',
    hasAttachments: false
  },
  {
    id: 3,
    subject: 'Settlement Proposal',
    clientName: 'Manufacturing Co.',
    status: 'replied',
    createdAt: new Date('2024-01-13'),
    excerpt: 'We have reviewed the settlement terms and have the following comments...',
    hasAttachments: true
  }
])

// Computed properties
const filteredMemos = computed(() => {
  let filtered = memos.value
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(memo => 
      memo.subject.toLowerCase().includes(query) ||
      memo.clientName.toLowerCase().includes(query) ||
      memo.excerpt.toLowerCase().includes(query)
    )
  }
  
  // Filter by status
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(memo => memo.status === statusFilter.value)
  }
  
  return filtered
})

// Methods
const selectMemo = (memo: any) => {
  console.log('Selected memo:', memo.id)
  // Navigate to memo detail page
  navigateTo(`/communications/memos/${memo.id}`)
}

const getStatusVariant = (status: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
  const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
    draft: 'secondary',
    sent: 'default',
    replied: 'secondary'
  }
  return variants[status] || 'default'
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}
</script>

<style scoped>
.memos-page {
  @apply space-y-6;
}

.page-header {
  @apply border-b border-border pb-4;
}

.header-content {
  @apply space-y-1;
}

.filters-section {
  @apply space-y-4;
}

.search-filters {
  @apply flex flex-col sm:flex-row gap-4;
}

.search-box {
  @apply relative flex-1;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground;
}

.search-input {
  @apply w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md;
  @apply bg-background text-foreground placeholder:text-muted-foreground;
  @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
}

.memos-list {
  @apply space-y-4;
}

.memo-card {
  @apply bg-card border border-border rounded-lg p-4 cursor-pointer transition-all;
  @apply hover:shadow-md hover:border-primary/50;
}

.memo-header {
  @apply flex justify-between items-start mb-3;
}

.memo-meta {
  @apply flex-1;
}

.memo-title {
  @apply font-medium text-foreground text-base;
}

.memo-client {
  @apply text-sm text-muted-foreground mt-1;
}

.memo-status {
  @apply flex flex-col items-end gap-2;
}

.memo-date {
  @apply text-xs text-muted-foreground;
}

.memo-preview {
  @apply mb-4;
}

.memo-excerpt {
  @apply text-sm text-muted-foreground line-clamp-2;
}

.memo-actions {
  @apply flex gap-2 pt-3 border-t border-border;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.empty-icon {
  @apply size-12 text-muted-foreground mb-4;
}

.empty-title {
  @apply text-lg font-medium text-foreground mb-2;
}

.empty-description {
  @apply text-muted-foreground mb-6 max-w-sm;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .memo-header {
    @apply flex-col gap-3;
  }
  
  .memo-status {
    @apply flex-row items-center self-start;
  }
  
  .memo-actions {
    @apply grid grid-cols-2 gap-2;
  }
}
</style>