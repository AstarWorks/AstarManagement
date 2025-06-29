<template>
  <CommunicationLayout>
    <template #header-actions>
      <Button @click="showCompose = true">
        <Plus class="size-4 mr-2" />
        Compose
      </Button>
    </template>
    
    <div class="emails-page">
      <!-- Email Folders Sidebar (on larger screens) -->
      <div class="emails-layout">
        <div class="email-sidebar">
          <div class="folder-list">
            <button
              v-for="folder in emailFolders"
              :key="folder.id"
              class="folder-item"
              :class="{ 'folder-item--active': selectedFolder === folder.id }"
              @click="selectFolder(folder.id)"
            >
              <component :is="folder.icon" class="folder-icon" />
              <span class="folder-label">{{ folder.label }}</span>
              <Badge v-if="folder.count > 0" class="folder-badge">
                {{ folder.count }}
              </Badge>
            </button>
          </div>
        </div>
        
        <!-- Email List -->
        <div class="email-content">
          <!-- Toolbar -->
          <div class="email-toolbar">
            <div class="toolbar-left">
              <Checkbox 
                :checked="selectedEmails.length === filteredEmails.length"
                @update:checked="toggleSelectAll"
              />
              <Button 
                variant="ghost" 
                size="sm"
                :disabled="selectedEmails.length === 0"
                @click="markAsRead"
              >
                <MailOpen class="size-4 mr-2" />
                Mark Read
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                :disabled="selectedEmails.length === 0"
                @click="archiveEmails"
              >
                <Archive class="size-4 mr-2" />
                Archive
              </Button>
            </div>
            <div class="toolbar-right">
              <div class="search-box">
                <Search class="search-icon" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search emails..."
                  class="search-input"
                />
              </div>
            </div>
          </div>
          
          <!-- Email Items -->
          <div class="email-list">
            <div 
              v-for="email in filteredEmails"
              :key="email.id"
              class="email-item"
              :class="{ 
                'email-item--unread': !email.isRead,
                'email-item--selected': selectedEmails.includes(email.id)
              }"
              @click="selectEmail(email)"
            >
              <div class="email-checkbox">
                <Checkbox 
                  :checked="selectedEmails.includes(email.id)"
                  @update:checked="(checked) => toggleEmailSelection(email.id, checked)"
                  @click.stop
                />
              </div>
              
              <div class="email-content">
                <div class="email-header">
                  <div class="email-sender">
                    <span class="sender-name">{{ email.sender }}</span>
                    <span v-if="email.isImportant" class="importance-indicator">
                      <Star class="size-3 fill-current text-amber-500" />
                    </span>
                  </div>
                  <div class="email-meta">
                    <span v-if="email.hasAttachment" class="attachment-indicator">
                      <Paperclip class="size-3" />
                    </span>
                    <span class="email-time">{{ formatTime(email.receivedAt) }}</span>
                  </div>
                </div>
                
                <div class="email-subject">
                  {{ email.subject }}
                </div>
                
                <div class="email-preview">
                  {{ email.preview }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Empty State -->
          <div v-if="filteredEmails.length === 0" class="empty-state">
            <Mail class="empty-icon" />
            <h3 class="empty-title">{{ getEmptyStateTitle() }}</h3>
            <p class="empty-description">{{ getEmptyStateDescription() }}</p>
          </div>
        </div>
      </div>
    </div>
  </CommunicationLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Plus, 
  Search, 
  Mail,
  MailOpen,
  Archive,
  Star,
  Paperclip,
  Inbox,
  Send,
  Trash2,
  FolderOpen
} from 'lucide-vue-next'
import { CommunicationLayout } from '~/components/communication'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'

// Define the page meta
definePageMeta({
  title: 'Email Communications',
  description: 'Manage email correspondence and conversations'
})

// Reactive state
const showCompose = ref(false)
const searchQuery = ref('')
const selectedFolder = ref('inbox')
const selectedEmails = ref<number[]>([])

// Email folders
const emailFolders = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, count: 23 },
  { id: 'sent', label: 'Sent', icon: Send, count: 0 },
  { id: 'archive', label: 'Archive', icon: FolderOpen, count: 0 },
  { id: 'trash', label: 'Trash', icon: Trash2, count: 0 }
]

// Mock emails data
const emails = ref([
  {
    id: 1,
    sender: 'legal@techcorp.com',
    subject: 'Contract Amendment Request - Q1 2024',
    preview: 'We would like to discuss amendments to the existing service agreement...',
    receivedAt: new Date('2024-01-15T10:30:00'),
    isRead: false,
    isImportant: true,
    hasAttachment: true,
    folder: 'inbox'
  },
  {
    id: 2,
    sender: 'contracts@manufacturing.com',
    subject: 'Settlement Agreement Review',
    preview: 'Please find attached the draft settlement agreement for your review...',
    receivedAt: new Date('2024-01-15T09:15:00'),
    isRead: false,
    isImportant: false,
    hasAttachment: true,
    folder: 'inbox'
  },
  {
    id: 3,
    sender: 'info@consultingfirm.com',
    subject: 'Legal Opinion Request - Employment Law',
    preview: 'We require a legal opinion on the recent changes to employment legislation...',
    receivedAt: new Date('2024-01-14T16:45:00'),
    isRead: true,
    isImportant: false,
    hasAttachment: false,
    folder: 'inbox'
  },
  {
    id: 4,
    sender: 'support@lawfirm.com',
    subject: 'Monthly Case Review Schedule',
    preview: 'Here is the schedule for monthly case reviews for February 2024...',
    receivedAt: new Date('2024-01-14T14:20:00'),
    isRead: true,
    isImportant: false,
    hasAttachment: false,
    folder: 'inbox'
  }
])

// Computed properties
const filteredEmails = computed(() => {
  let filtered = emails.value.filter(email => email.folder === selectedFolder.value)
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(email => 
      email.sender.toLowerCase().includes(query) ||
      email.subject.toLowerCase().includes(query) ||
      email.preview.toLowerCase().includes(query)
    )
  }
  
  return filtered.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())
})

// Methods
const selectFolder = (folderId: string) => {
  selectedFolder.value = folderId
  selectedEmails.value = []
}

const selectEmail = (email: any) => {
  console.log('Selected email:', email.id)
  // Navigate to email detail view
  navigateTo(`/communications/emails/${email.id}`)
}

const toggleEmailSelection = (emailId: number, checked: boolean | string) => {
  if (checked) {
    selectedEmails.value.push(emailId)
  } else {
    selectedEmails.value = selectedEmails.value.filter(id => id !== emailId)
  }
}

const toggleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedEmails.value = filteredEmails.value.map(email => email.id)
  } else {
    selectedEmails.value = []
  }
}

const markAsRead = () => {
  selectedEmails.value.forEach(emailId => {
    const email = emails.value.find(e => e.id === emailId)
    if (email) email.isRead = true
  })
  selectedEmails.value = []
}

const archiveEmails = () => {
  selectedEmails.value.forEach(emailId => {
    const email = emails.value.find(e => e.id === emailId)
    if (email) email.folder = 'archive'
  })
  selectedEmails.value = []
}

const formatTime = (date: Date) => {
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

const getEmptyStateTitle = () => {
  if (searchQuery.value) return 'No emails found'
  
  const folderTitles = {
    inbox: 'Inbox is empty',
    sent: 'No sent emails',
    archive: 'Archive is empty',
    trash: 'Trash is empty'
  }
  
  return folderTitles[selectedFolder.value as keyof typeof folderTitles] || 'No emails'
}

const getEmptyStateDescription = () => {
  if (searchQuery.value) return 'Try adjusting your search terms'
  
  const folderDescriptions = {
    inbox: 'New emails will appear here',
    sent: 'Emails you send will appear here',
    archive: 'Archived emails will appear here',
    trash: 'Deleted emails will appear here'
  }
  
  return folderDescriptions[selectedFolder.value as keyof typeof folderDescriptions] || ''
}
</script>

<style scoped>
.emails-page {
  @apply h-full;
}

.emails-layout {
  @apply flex h-full gap-4;
}

.email-sidebar {
  @apply w-48 flex-shrink-0 hidden lg:block;
}

.folder-list {
  @apply space-y-1;
}

.folder-item {
  @apply w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors;
  @apply text-sm font-medium text-muted-foreground;
  @apply hover:bg-accent hover:text-accent-foreground;
  @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
}

.folder-item--active {
  @apply bg-primary text-primary-foreground;
}

.folder-item--active:hover {
  @apply bg-primary/90;
}

.folder-icon {
  @apply size-4 flex-shrink-0;
}

.folder-label {
  @apply flex-1;
}

.folder-badge {
  @apply text-xs;
}

.email-content {
  @apply flex-1 flex flex-col;
}

.email-toolbar {
  @apply flex justify-between items-center gap-4 p-4 border-b border-border;
}

.toolbar-left {
  @apply flex items-center gap-2;
}

.toolbar-right {
  @apply flex items-center gap-2;
}

.search-box {
  @apply relative;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground;
}

.search-input {
  @apply pl-9 pr-3 py-1.5 text-sm border border-input rounded-md;
  @apply bg-background text-foreground placeholder:text-muted-foreground;
  @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
  @apply w-48 lg:w-64;
}

.email-list {
  @apply flex-1 overflow-auto;
}

.email-item {
  @apply flex items-start gap-3 p-4 border-b border-border cursor-pointer;
  @apply hover:bg-accent/50 transition-colors;
}

.email-item--unread {
  @apply bg-accent/20;
}

.email-item--selected {
  @apply bg-primary/10;
}

.email-checkbox {
  @apply pt-1;
}

.email-content {
  @apply flex-1 min-w-0;
}

.email-header {
  @apply flex justify-between items-start mb-2;
}

.email-sender {
  @apply flex items-center gap-2;
}

.sender-name {
  @apply font-medium text-foreground text-sm;
}

.email-item--unread .sender-name {
  @apply font-semibold;
}

.importance-indicator {
  @apply flex-shrink-0;
}

.email-meta {
  @apply flex items-center gap-2 text-muted-foreground;
}

.attachment-indicator {
  @apply flex-shrink-0;
}

.email-time {
  @apply text-xs;
}

.email-subject {
  @apply text-sm text-foreground mb-1 truncate;
}

.email-item--unread .email-subject {
  @apply font-semibold;
}

.email-preview {
  @apply text-xs text-muted-foreground line-clamp-2;
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
  @apply text-muted-foreground;
}

/* Mobile responsiveness */
@media (max-width: 1024px) {
  .emails-layout {
    @apply flex-col;
  }
  
  .email-sidebar {
    @apply w-full block;
  }
  
  .folder-list {
    @apply flex gap-2 overflow-x-auto pb-2;
  }
  
  .folder-item {
    @apply flex-shrink-0 whitespace-nowrap;
  }
}

@media (max-width: 640px) {
  .email-toolbar {
    @apply flex-col gap-2 items-stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    @apply justify-between;
  }
  
  .search-input {
    @apply w-full;
  }
  
  .email-item {
    @apply p-3;
  }
  
  .email-header {
    @apply flex-col gap-1 items-start;
  }
}
</style>