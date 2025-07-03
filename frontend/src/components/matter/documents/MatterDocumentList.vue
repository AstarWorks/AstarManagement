<!--
  Matter Document List Component
  
  Displays a list of documents associated with a matter, optimized for activity timeline view.
  Shows document activities including uploads, views, and downloads.
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  FileText, 
  Upload, 
  Eye, 
  Download, 
  Filter,
  Search,
  Calendar,
  User,
  MoreHorizontal
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '~/components/ui/dropdown-menu'
import { Skeleton } from '~/components/ui/skeleton'

interface Props {
  /** Matter ID */
  matterId: string
  /** Search term from parent */
  searchTerm?: string
  /** Show filters panel */
  showFilters?: boolean
  /** Enable real-time updates */
  enableRealTime?: boolean
  /** View mode - activity or grid */
  viewMode?: 'activity' | 'grid'
}

const props = withDefaults(defineProps<Props>(), {
  searchTerm: '',
  showFilters: false,
  enableRealTime: true,
  viewMode: 'activity'
})

// Mock data - in real app, this would come from API
const documents = ref([
  {
    id: '1',
    name: 'Contract Agreement.pdf',
    type: 'pdf',
    size: 2048576,
    uploadedBy: { id: '1', name: 'John Doe', avatar: null },
    uploadedAt: new Date('2024-07-01T10:30:00'),
    lastViewed: new Date('2024-07-02T14:15:00'),
    viewCount: 5,
    downloadCount: 2,
    category: 'Contract',
    activities: [
      { type: 'upload', user: 'John Doe', timestamp: new Date('2024-07-01T10:30:00') },
      { type: 'view', user: 'Jane Smith', timestamp: new Date('2024-07-02T09:15:00') },
      { type: 'download', user: 'John Doe', timestamp: new Date('2024-07-02T14:15:00') }
    ]
  },
  {
    id: '2',
    name: 'Legal Brief - Motion to Dismiss.docx',
    type: 'docx',
    size: 1536000,
    uploadedBy: { id: '2', name: 'Jane Smith', avatar: null },
    uploadedAt: new Date('2024-06-28T16:45:00'),
    lastViewed: new Date('2024-07-01T11:30:00'),
    viewCount: 8,
    downloadCount: 3,
    category: 'Legal Brief',
    activities: [
      { type: 'upload', user: 'Jane Smith', timestamp: new Date('2024-06-28T16:45:00') },
      { type: 'view', user: 'John Doe', timestamp: new Date('2024-06-29T09:00:00') },
      { type: 'view', user: 'Bob Johnson', timestamp: new Date('2024-07-01T11:30:00') }
    ]
  }
])

const loading = ref(false)

// Computed properties
const filteredDocuments = computed(() => {
  if (!props.searchTerm) return documents.value
  
  return documents.value.filter(doc => 
    doc.name.toLowerCase().includes(props.searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(props.searchTerm.toLowerCase())
  )
})

// Methods
const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i]
}

const formatTimestamp = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return date.toLocaleDateString()
}

const getFileIcon = (type: string) => {
  return FileText // In real app, would return different icons based on file type
}

const handleDocumentAction = (action: string, documentId: string) => {
  console.log(`${action} document ${documentId}`)
  // Implement actual actions
}
</script>

<template>
  <div class="matter-document-list">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold flex items-center gap-2">
        <FileText class="w-5 h-5" />
        Document Activities
      </h3>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Upload class="w-4 h-4 mr-2" />
          Upload
        </Button>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="border rounded-lg p-4">
        <div class="flex items-start gap-4">
          <Skeleton class="w-10 h-10 rounded" />
          <div class="flex-1 space-y-2">
            <Skeleton class="h-4 w-3/4" />
            <Skeleton class="h-3 w-1/2" />
            <div class="flex gap-2">
              <Skeleton class="h-6 w-16" />
              <Skeleton class="h-6 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Document List -->
    <div v-else class="space-y-4">
      <Card v-for="document in filteredDocuments" :key="document.id" class="document-card">
        <CardContent class="p-4">
          <div class="flex items-start gap-4">
            <!-- Document Icon -->
            <div class="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <component :is="getFileIcon(document.type)" class="w-5 h-5 text-primary" />
            </div>
            
            <!-- Document Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between mb-2">
                <h4 class="font-medium text-sm truncate pr-2">{{ document.name }}</h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                      <MoreHorizontal class="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="handleDocumentAction('view', document.id)">
                      <Eye class="w-4 h-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="handleDocumentAction('download', document.id)">
                      <Download class="w-4 h-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <!-- Document Metadata -->
              <div class="space-y-2">
                <div class="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{{ formatFileSize(document.size) }}</span>
                  <Badge variant="outline" class="text-xs">{{ document.category }}</Badge>
                </div>
                
                <!-- Upload Info -->
                <div class="flex items-center gap-2 text-xs">
                  <Avatar class="w-4 h-4">
                    <AvatarImage :src="document.uploadedBy.avatar ?? ''" :alt="document.uploadedBy.name || ''" />
                    <AvatarFallback class="text-xs">
                      {{ document.uploadedBy.name.split(' ').map((n: string) => n[0]).join('') }}
                    </AvatarFallback>
                  </Avatar>
                  <span class="text-muted-foreground">
                    Uploaded by {{ document.uploadedBy.name }} 
                    {{ formatTimestamp(document.uploadedAt) }}
                  </span>
                </div>
                
                <!-- Activity Stats -->
                <div class="flex items-center gap-4 text-xs text-muted-foreground">
                  <div class="flex items-center gap-1">
                    <Eye class="w-3 h-3" />
                    {{ document.viewCount }} views
                  </div>
                  <div class="flex items-center gap-1">
                    <Download class="w-3 h-3" />
                    {{ document.downloadCount }} downloads
                  </div>
                  <span>Last viewed {{ formatTimestamp(document.lastViewed) }}</span>
                </div>
              </div>
              
              <!-- Recent Activities -->
              <div v-if="viewMode === 'activity'" class="mt-3 pt-3 border-t">
                <h5 class="text-xs font-medium mb-2 text-muted-foreground">Recent Activity</h5>
                <div class="space-y-1">
                  <div 
                    v-for="(activity, index) in document.activities.slice(0, 3)" 
                    :key="index"
                    class="flex items-center gap-2 text-xs"
                  >
                    <div class="w-1 h-1 bg-muted-foreground rounded-full"></div>
                    <span class="capitalize">{{ activity.type }}</span>
                    <span class="text-muted-foreground">by {{ activity.user }}</span>
                    <span class="text-muted-foreground">{{ formatTimestamp(activity.timestamp) }}</span>
                  </div>
                  <div v-if="document.activities.length > 3" class="text-xs text-muted-foreground pl-3">
                    +{{ document.activities.length - 3 }} more activities
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    
    <!-- Empty State -->
    <div v-if="!loading && filteredDocuments.length === 0" class="text-center py-8">
      <FileText class="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h3 class="font-medium mb-2">No Documents Found</h3>
      <p class="text-sm text-muted-foreground mb-4">
        {{ props.searchTerm ? 'No documents match your search.' : 'No documents have been uploaded yet.' }}
      </p>
      <Button variant="outline">
        <Upload class="w-4 h-4 mr-2" />
        Upload First Document
      </Button>
    </div>
  </div>
</template>

<style scoped>
.matter-document-list {
  @apply w-full;
}

.document-card {
  @apply transition-colors duration-200 hover:bg-muted/30;
}

.document-card:hover {
  @apply shadow-sm;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .document-card .flex {
    @apply gap-2;
  }
  
  .document-card .w-10 {
    @apply w-8 h-8;
  }
  
  .document-card .text-xs {
    font-size: 0.75rem;
    line-height: 1rem;
  }
}

/* Focus states for accessibility */
.document-card :focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
}
</style>