<template>
  <CommunicationLayout>
    <template #header-actions>
      <Button @click="showCreateNote = true">
        <Plus class="size-4 mr-2" />
        New Note
      </Button>
    </template>
    
    <div class="notes-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h2 class="text-xl font-semibold text-foreground">Internal Notes</h2>
          <p class="text-muted-foreground">
            Team communications and internal documentation
          </p>
        </div>
      </div>
      
      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-item">
          <StickyNote class="stat-icon" />
          <div class="stat-content">
            <span class="stat-number">{{ notes.length }}</span>
            <span class="stat-label">Total Notes</span>
          </div>
        </div>
        <div class="stat-item">
          <Users class="stat-icon" />
          <div class="stat-content">
            <span class="stat-number">{{ uniqueAuthors.length }}</span>
            <span class="stat-label">Contributors</span>
          </div>
        </div>
        <div class="stat-item">
          <Calendar class="stat-icon" />
          <div class="stat-content">
            <span class="stat-number">{{ todaysNotes }}</span>
            <span class="stat-label">Today</span>
          </div>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="filters-section">
        <div class="search-filters">
          <div class="search-box">
            <Search class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search notes..."
              class="search-input"
            />
          </div>
          <Select v-model="categoryFilter">
            <SelectTrigger class="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="case-notes">Case Notes</SelectItem>
              <SelectItem value="meeting">Meeting Notes</SelectItem>
              <SelectItem value="research">Research</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <!-- Notes Grid -->
      <div class="notes-grid">
        <div 
          v-for="note in filteredNotes"
          :key="note.id"
          class="note-card"
          @click="selectNote(note)"
        >
          <div class="note-header">
            <div class="note-category">
              <Badge :variant="getCategoryVariant(note.category)">
                {{ note.category }}
              </Badge>
            </div>
            <div class="note-date">
              {{ formatDate(note.createdAt) }}
            </div>
          </div>
          
          <div class="note-content">
            <h3 class="note-title">{{ note.title }}</h3>
            <p class="note-preview">{{ note.preview }}</p>
          </div>
          
          <div class="note-footer">
            <div class="note-author">
              <Avatar class="author-avatar">
                <AvatarFallback>{{ getInitials(note.author) }}</AvatarFallback>
              </Avatar>
              <span class="author-name">{{ note.author }}</span>
            </div>
            <div class="note-actions">
              <Button variant="ghost" size="sm">
                <Edit class="size-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share class="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="filteredNotes.length === 0" class="empty-state">
        <StickyNote class="empty-icon" />
        <h3 class="empty-title">No notes found</h3>
        <p class="empty-description">
          {{ searchQuery ? 'Try adjusting your search terms' : 'Create your first internal note to get started' }}
        </p>
        <Button @click="showCreateNote = true">
          <Plus class="size-4 mr-2" />
          Create Note
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
  StickyNote,
  Users,
  Calendar,
  Edit,
  Share
} from 'lucide-vue-next'
import { CommunicationLayout } from '~/components/communication'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

// Define the page meta
definePageMeta({
  title: 'Internal Notes',
  description: 'Team communications and internal documentation'
})

// Reactive state
const showCreateNote = ref(false)
const searchQuery = ref('')
const categoryFilter = ref('all')

// Mock notes data
const notes = ref([
  {
    id: 1,
    title: 'Case Strategy Meeting - Smith vs. Jones',
    category: 'case-notes',
    author: 'Alice Johnson',
    createdAt: new Date('2024-01-15'),
    preview: 'Discussed the discovery phase timeline and witness preparation strategy...',
    tags: ['case-strategy', 'litigation']
  },
  {
    id: 2,
    title: 'Research: Employment Law Updates',
    category: 'research',
    author: 'Bob Chen',
    createdAt: new Date('2024-01-14'),
    preview: 'New legislation affecting employment contracts in California...',
    tags: ['employment-law', 'research']
  },
  {
    id: 3,
    title: 'Client Onboarding Process Review',
    category: 'meeting',
    author: 'Carol Davis',
    createdAt: new Date('2024-01-13'),
    preview: 'Team meeting to optimize our client onboarding workflow...',
    tags: ['process', 'onboarding']
  },
  {
    id: 4,
    title: 'Personal Reminder: Bar Exam Prep',
    category: 'personal',
    author: 'Alice Johnson',
    createdAt: new Date('2024-01-12'),
    preview: 'Study schedule for constitutional law section...',
    tags: ['personal', 'bar-exam']
  }
])

// Computed properties
const filteredNotes = computed(() => {
  let filtered = notes.value
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(note => 
      note.title.toLowerCase().includes(query) ||
      note.preview.toLowerCase().includes(query) ||
      note.author.toLowerCase().includes(query)
    )
  }
  
  // Filter by category
  if (categoryFilter.value !== 'all') {
    filtered = filtered.filter(note => note.category === categoryFilter.value)
  }
  
  return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
})

const uniqueAuthors = computed(() => {
  return [...new Set(notes.value.map(note => note.author))]
})

const todaysNotes = computed(() => {
  const today = new Date()
  return notes.value.filter(note => 
    note.createdAt.toDateString() === today.toDateString()
  ).length
})

// Methods
const selectNote = (note: any) => {
  console.log('Selected note:', note.id)
  // Navigate to note detail page
  navigateTo(`/communications/notes/${note.id}`)
}

const getCategoryVariant = (category: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
  const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
    'case-notes': 'default',
    'meeting': 'secondary',
    'research': 'outline',
    'personal': 'destructive'
  }
  return variants[category] || 'default'
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const formatDate = (date: Date) => {
  const now = new Date()
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffHours < 48) return 'Yesterday'
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date)
}
</script>

<style scoped>
.notes-page {
  @apply space-y-6;
}

.page-header {
  @apply border-b border-border pb-4;
}

.header-content {
  @apply space-y-1;
}

.stats-grid {
  @apply grid grid-cols-1 sm:grid-cols-3 gap-4;
}

.stat-item {
  @apply bg-card border border-border rounded-lg p-4 flex items-center gap-3;
}

.stat-icon {
  @apply size-8 text-primary flex-shrink-0;
}

.stat-content {
  @apply flex flex-col;
}

.stat-number {
  @apply text-2xl font-bold text-foreground;
}

.stat-label {
  @apply text-sm text-muted-foreground;
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

.notes-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.note-card {
  @apply bg-card border border-border rounded-lg p-4 cursor-pointer transition-all;
  @apply hover:shadow-md hover:border-primary/50;
}

.note-header {
  @apply flex justify-between items-start mb-3;
}

.note-category .badge {
  @apply text-xs;
}

.note-date {
  @apply text-xs text-muted-foreground;
}

.note-content {
  @apply mb-4;
}

.note-title {
  @apply font-medium text-foreground text-sm mb-2 line-clamp-2;
}

.note-preview {
  @apply text-xs text-muted-foreground line-clamp-3;
}

.note-footer {
  @apply flex justify-between items-center pt-3 border-t border-border;
}

.note-author {
  @apply flex items-center gap-2;
}

.author-avatar {
  @apply size-6;
}

.author-name {
  @apply text-xs text-muted-foreground;
}

.note-actions {
  @apply flex gap-1;
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
@media (max-width: 768px) {
  .notes-grid {
    @apply grid-cols-1;
  }
  
  .note-footer {
    @apply flex-col gap-2 items-start;
  }
}
</style>