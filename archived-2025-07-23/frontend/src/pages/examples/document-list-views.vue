<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">Document List Views</h1>
            <p class="text-muted-foreground">
              T07_S13 - Grid and List Views with Metadata Demo
            </p>
          </div>
          
          <div class="flex items-center gap-4">
            <!-- Demo controls -->
            <Select v-model="demoMatterId" @update:model-value="changeMatter">
              <SelectTrigger class="w-48">
                <SelectValue placeholder="Select matter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="matter1">Contract Dispute Case</SelectItem>
                <SelectItem value="matter2">Employment Law Matter</SelectItem>
                <SelectItem value="matter3">Real Estate Transaction</SelectItem>
              </SelectContent>
            </Select>
            
            <!-- Settings -->
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-64">
                <div class="px-2 py-1.5 text-sm font-semibold">Demo Settings</div>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem @click="toggleSetting('enableBulkActions')">
                  <div class="flex items-center justify-between w-full">
                    <span>Bulk Actions</span>
                    <Switch 
                      :checked="settings.enableBulkActions" 
                      @update:checked="toggleSetting('enableBulkActions')"
                    />
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem @click="toggleSetting('enableFilters')">
                  <div class="flex items-center justify-between w-full">
                    <span>Filters</span>
                    <Switch 
                      :checked="settings.enableFilters" 
                      @update:checked="toggleSetting('enableFilters')"
                    />
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem @click="simulateLoading">
                  <RefreshCw class="h-4 w-4 mr-2" />
                  Simulate Loading
                </DropdownMenuItem>
                
                <DropdownMenuItem @click="clearData">
                  <Trash2 class="h-4 w-4 mr-2" />
                  Clear Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <div class="container mx-auto p-4">
      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ documentStats.total }}</div>
            <p class="text-xs text-muted-foreground">
              {{ documentStats.totalSize }}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">File Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ documentStats.fileTypes }}</div>
            <p class="text-xs text-muted-foreground">
              PDF, Word, Excel, Images
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ documentStats.recentUploads }}</div>
            <p class="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ documentStats.storageUsed }}</div>
            <p class="text-xs text-muted-foreground">
              of {{ documentStats.storageLimit }} limit
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Feature showcase -->
      <Alert class="mb-6">
        <Info class="h-4 w-4" />
        <AlertTitle>Document List Features</AlertTitle>
        <AlertDescription>
          <div class="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>✓ Grid & List Views</div>
            <div>✓ Virtual Scrolling</div>
            <div>✓ Lazy Thumbnails</div>
            <div>✓ Advanced Filtering</div>
            <div>✓ Bulk Operations</div>
            <div>✓ Sorting Options</div>
            <div>✓ Quick Actions</div>
            <div>✓ Responsive Design</div>
          </div>
        </AlertDescription>
      </Alert>

      <!-- Document List View -->
      <Card class="min-h-[600px]">
        <CardContent class="p-0 h-full">
          <DocumentListView
            :matter-id="demoMatterId"
            :enable-bulk-actions="settings.enableBulkActions"
            :enable-filters="settings.enableFilters"
            :page-size="50"
            @document-action="handleDocumentAction"
            @upload-documents="handleUploadDocuments"
            @selection-change="handleSelectionChange"
            class="h-[600px]"
          />
        </CardContent>
      </Card>

      <!-- Action Log -->
      <Card class="mt-6">
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            Action Log
            <Button variant="outline" size="sm" @click="clearActionLog">
              Clear Log
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="max-h-32 overflow-auto space-y-1">
            <div 
              v-for="(action, index) in actionLog" 
              :key="index"
              class="text-xs font-mono p-2 bg-muted rounded"
            >
              <span class="text-muted-foreground">{{ action.timestamp }}</span>
              <span class="ml-2 font-semibold">{{ action.type }}</span>
              <span class="ml-2">{{ action.data }}</span>
            </div>
            <div v-if="actionLog.length === 0" class="text-center text-muted-foreground py-4">
              No actions logged yet. Interact with documents to see activity.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Settings, RefreshCw, Trash2, Info } from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '~/components/ui/dropdown-menu'
import { Switch } from '~/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'

// Document Components
import DocumentListView from '~/components/document/DocumentListView.vue'

// Types
import type { Document, DocumentAction } from '~/types/document'

// Demo state
const demoMatterId = ref('matter1')
const selectedDocuments = ref<Document[]>([])

// Settings
const settings = ref({
  enableBulkActions: true,
  enableFilters: true
})

// Action logging
const actionLog = ref<Array<{ timestamp: string; type: string; data: string }>>([])

// Mock statistics
const documentStats = computed(() => ({
  total: 156,
  totalSize: '2.3 GB',
  fileTypes: 8,
  recentUploads: 12,
  storageUsed: '2.3 GB',
  storageLimit: '10 GB'
}))

// Methods
const toggleSetting = (key: keyof typeof settings.value) => {
  settings.value[key] = !settings.value[key]
  logAction('setting-change', `${key}: ${settings.value[key]}`)
}

const changeMatter = (matterId: string) => {
  demoMatterId.value = matterId
  logAction('matter-change', `Switched to ${matterId}`)
}

const simulateLoading = () => {
  logAction('demo-action', 'Simulated loading state')
  // The DocumentListView will handle its own loading state
}

const clearData = () => {
  logAction('demo-action', 'Data cleared (simulated)')
}

const handleDocumentAction = (action: DocumentAction, document: Document) => {
  logAction('document-action', `${action} on ${document.fileName}`)
  
  // Simulate different actions
  switch (action) {
    case 'preview':
      logAction('document-preview', `Opened ${document.fileName}`)
      break
    case 'download':
      logAction('document-download', `Downloaded ${document.fileName}`)
      break
    case 'delete':
      if (confirm(`Are you sure you want to delete ${document.fileName}?`)) {
        logAction('document-delete', `Deleted ${document.fileName}`)
      }
      break
    case 'share':
      logAction('document-share', `Shared ${document.fileName}`)
      break
    default:
      logAction('document-action', `${action} on ${document.fileName}`)
  }
}

const handleUploadDocuments = () => {
  logAction('upload-request', 'Upload documents dialog requested')
  // In a real app, this would open the upload interface
}

const handleSelectionChange = (documents: Document[]) => {
  selectedDocuments.value = documents
  logAction('selection-change', `${documents.length} documents selected`)
}

const logAction = (type: string, data: string) => {
  const timestamp = new Date().toLocaleTimeString()
  actionLog.value.unshift({ timestamp, type, data })
  
  // Keep only last 20 actions
  if (actionLog.value.length > 20) {
    actionLog.value = actionLog.value.slice(0, 20)
  }
}

const clearActionLog = () => {
  actionLog.value = []
}

// SEO
useHead({
  title: 'Document List Views - T07_S13 Demo',
  meta: [
    {
      name: 'description',
      content: 'Document list views with grid and list layouts, filtering, sorting, and bulk actions for legal document management'
    }
  ]
})
</script>

<style scoped>
/* Custom scrollbar for action log */
.max-h-32::-webkit-scrollbar {
  width: 4px;
}

.max-h-32::-webkit-scrollbar-track {
  background: transparent;
}

.max-h-32::-webkit-scrollbar-thumb {
  background-color: hsl(var(--border));
  border-radius: 2px;
}
</style>