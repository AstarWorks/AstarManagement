<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, FileText } from 'lucide-vue-next'
import DocumentUploadZone from '~/components/documents/DocumentUploadZone.vue'
import { Button } from '~/components/ui/button'
import { useToast } from '~/composables/useToast'

// Page meta
definePageMeta({
  title: 'Document Upload',
  requiresAuth: true
})

const router = useRouter()
const { showToast } = useToast()

// State
const matterId = ref<string>('')
const uploadedDocuments = ref<string[]>([])

// Get matter ID from route query if available
const route = useRoute()
if (route.query.matterId) {
  matterId.value = route.query.matterId as string
}

// Handlers
const handleUploadComplete = (documentIds: string[]) => {
  uploadedDocuments.value.push(...documentIds)
  showToast(
    `Successfully uploaded ${documentIds.length} document(s)`,
    'success'
  )
}

const handleUploadError = (error: string) => {
  showToast(error, 'error')
}

const navigateBack = () => {
  if (matterId.value) {
    router.push(`/matters/${matterId.value}`)
  } else {
    router.push('/documents')
  }
}
</script>

<template>
  <div class="document-upload-page">
    <!-- Page header -->
    <div class="mb-8">
      <Button
        variant="ghost"
        size="sm"
        @click="navigateBack"
        class="mb-4"
      >
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back
      </Button>
      
      <div class="flex items-center gap-4">
        <FileText class="w-8 h-8 text-primary" />
        <div>
          <h1 class="text-2xl font-bold">Document Upload</h1>
          <p class="text-muted-foreground">
            Upload documents to your legal case management system
          </p>
        </div>
      </div>
    </div>
    
    <!-- Upload interface -->
    <div class="max-w-4xl">
      <DocumentUploadZone
        :matter-id="matterId"
        :show-metadata-form="true"
        :show-queue="true"
        :max-files="20"
        @upload-complete="handleUploadComplete"
        @upload-error="handleUploadError"
      />
    </div>
    
    <!-- Success summary -->
    <div v-if="uploadedDocuments.length > 0" class="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
      <h3 class="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
        Upload Summary
      </h3>
      <p class="text-sm text-green-700 dark:text-green-300">
        Successfully uploaded {{ uploadedDocuments.length }} document(s).
      </p>
      <div class="mt-3 flex gap-2">
        <Button
          v-if="matterId"
          size="sm"
          @click="navigateBack"
        >
          View Matter
        </Button>
        <Button
          size="sm"
          variant="outline"
          @click="router.push('/documents')"
        >
          View All Documents
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.document-upload-page {
  @apply container mx-auto px-4 py-8;
}
</style>