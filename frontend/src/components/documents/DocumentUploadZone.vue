<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Upload } from 'lucide-vue-next'
import DocumentDropZone from './DocumentDropZone.vue'
import DocumentUploadQueue from './DocumentUploadQueue.vue'
import DocumentMetadataForm from './DocumentMetadataForm.vue'
import { useFileUpload } from '~/composables/useFileUpload'
import { useDocumentUploadStore } from '~/stores/documentUpload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { cn } from '~/lib/utils'

interface Props {
  matterId?: string
  category?: string
  showMetadataForm?: boolean
  showQueue?: boolean
  maxFiles?: number
}

const props = withDefaults(defineProps<Props>(), {
  showMetadataForm: true,
  showQueue: true,
  maxFiles: 10
})

const emit = defineEmits<{
  'upload-complete': [documentIds: string[]]
  'upload-error': [error: string]
}>()

// State
const activeTab = ref('upload')
const selectedFiles = ref<File[]>([])
const isProcessing = ref(false)

// Composables
const uploadStore = useDocumentUploadStore()
const { uploadFiles, clearCompleted } = useFileUpload({
  matterId: props.matterId,
  category: props.category,
  onSuccess: (documentIds) => {
    emit('upload-complete', documentIds)
    // Clear selected files after successful upload
    selectedFiles.value = []
    
    // Switch to queue tab if uploads are complete
    if (!uploadStore.hasActiveUploads) {
      activeTab.value = 'queue'
    }
  },
  onError: (error) => {
    emit('upload-error', error)
  }
})

// Computed
const hasQueueItems = computed(() => uploadStore.queue.length > 0)
const queueBadgeCount = computed(() => {
  const { pending, uploading } = uploadStore.stats
  return pending + uploading
})

// Handlers
const handleDrop = (files: File[]) => {
  if (props.showMetadataForm && files.length > 0) {
    // Store files for metadata form
    selectedFiles.value = files
    activeTab.value = 'metadata'
  } else {
    // Direct upload without metadata form
    handleUpload(files)
  }
}

const handleUpload = async (files: File[], metadata?: any) => {
  if (files.length === 0) return
  
  isProcessing.value = true
  
  try {
    await uploadFiles(files)
    
    // Switch to queue tab to show progress
    if (props.showQueue) {
      activeTab.value = 'queue'
    }
  } finally {
    isProcessing.value = false
  }
}

const handleMetadataSubmit = (metadata: any) => {
  if (selectedFiles.value.length > 0) {
    handleUpload(selectedFiles.value, metadata)
  }
}

const handleMetadataCancel = () => {
  selectedFiles.value = []
  activeTab.value = 'upload'
}

// Watch for queue changes to update tab badge
watch(() => uploadStore.stats, () => {
  // Auto-switch to queue tab when uploads start
  if (uploadStore.hasActiveUploads && activeTab.value === 'upload') {
    activeTab.value = 'queue'
  }
})
</script>

<template>
  <div class="document-upload-zone">
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Upload class="w-5 h-5" />
          Document Upload
        </CardTitle>
        <CardDescription>
          Upload documents to your legal case management system
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs v-model:value="activeTab" class="w-full">
          <TabsList :class="cn(
            'grid w-full',
            (!showMetadataForm || !showQueue) ? 'grid-cols-2' : 'grid-cols-3'
          )">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger 
              v-if="showMetadataForm" 
              value="metadata"
              :disabled="selectedFiles.length === 0"
            >
              Metadata
              <Badge 
                v-if="selectedFiles.length > 0" 
                variant="secondary" 
                class="ml-2"
              >
                {{ selectedFiles.length }}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              v-if="showQueue" 
              value="queue"
            >
              Queue
              <Badge 
                v-if="queueBadgeCount > 0" 
                variant="default" 
                class="ml-2"
              >
                {{ queueBadgeCount }}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          <!-- Upload Tab -->
          <TabsContent value="upload" class="mt-6">
            <DocumentDropZone
              :disabled="isProcessing"
              :max-files="maxFiles"
              @drop="handleDrop"
              @error="emit('upload-error', $event)"
            />
          </TabsContent>
          
          <!-- Metadata Tab -->
          <TabsContent v-if="showMetadataForm" value="metadata" class="mt-6">
            <DocumentMetadataForm
              v-if="selectedFiles.length > 0"
              :files="selectedFiles"
              :matter-id="matterId"
              :default-category="category"
              @submit="handleMetadataSubmit"
              @cancel="handleMetadataCancel"
            />
            <div v-else class="text-center py-12">
              <p class="text-muted-foreground">
                No files selected. Please upload files first.
              </p>
            </div>
          </TabsContent>
          
          <!-- Queue Tab -->
          <TabsContent v-if="showQueue" value="queue" class="mt-6">
            <DocumentUploadQueue />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
.document-upload-zone {
  @apply w-full;
}
</style>