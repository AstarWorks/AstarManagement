<template>
  <div class="document-generation-engine">
    <!-- Header with Controls -->
    <div class="generation-header">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold">Document Generation</h2>
          <p class="text-muted-foreground">
            Generate documents from templates with live preview and batch processing
          </p>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Mode Toggle -->
          <div class="mode-toggle">
            <Button
              :variant="mode === 'single' ? 'default' : 'outline'"
              size="sm"
              @click="mode = 'single'"
            >
              <FileText class="h-4 w-4 mr-2" />
              Single
            </Button>
            <Button
              :variant="mode === 'batch' ? 'default' : 'outline'"
              size="sm"
              @click="mode = 'batch'"
            >
              <Package class="h-4 w-4 mr-2" />
              Batch
            </Button>
          </div>
          
          <!-- Quick Actions -->
          <Button @click="showTemplateSelector = true" variant="outline">
            <Plus class="h-4 w-4 mr-2" />
            New Generation
          </Button>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="generation-content">
      <div class="grid grid-cols-12 gap-6 h-full">
        <!-- Left Panel: Configuration -->
        <div class="col-span-12 lg:col-span-4 space-y-6">
          <!-- Template Selection -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <FileTemplate class="h-5 w-5" />
                Template Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="selectedTemplate" class="selected-template">
                <div class="flex items-center gap-3 p-3 border rounded-lg">
                  <div class="template-icon">
                    <FileText class="h-8 w-8 text-blue-500" />
                  </div>
                  <div class="flex-1">
                    <div class="font-medium">{{ selectedTemplate.name }}</div>
                    <div class="text-sm text-muted-foreground">
                      {{ selectedTemplate.category }}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    @click="showTemplateSelector = true"
                  >
                    Change
                  </Button>
                </div>
              </div>
              <div v-else class="text-center py-8">
                <FileText class="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p class="text-muted-foreground mb-4">No template selected</p>
                <Button @click="showTemplateSelector = true">
                  Select Template
                </Button>
              </div>
            </CardContent>
          </Card>

          <!-- Matter Selection (Single Mode) -->
          <Card v-if="mode === 'single'">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Briefcase class="h-5 w-5" />
                Matter Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select v-model="selectedMatterId">
                <SelectTrigger>
                  <SelectValue placeholder="Select a matter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="matter in matters"
                    :key="matter.id"
                    :value="matter.id"
                  >
                    {{ matter.title }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <!-- Batch Configuration (Batch Mode) -->
          <Card v-if="mode === 'batch'">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Package class="h-5 w-5" />
                Batch Configuration
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div>
                <Label>Selected Matters</Label>
                <div class="mt-2">
                  <Button
                    variant="outline"
                    @click="showMatterSelector = true"
                    class="w-full justify-start"
                  >
                    <Plus class="h-4 w-4 mr-2" />
                    {{ selectedMatterIds.length === 0 
                      ? 'Select matters...' 
                      : `${selectedMatterIds.length} matters selected` }}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Concurrency Limit</Label>
                <Select v-model="batchConfig.concurrency">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 document at a time</SelectItem>
                    <SelectItem value="3">3 documents at a time</SelectItem>
                    <SelectItem value="5">5 documents at a time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <!-- Export Options -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Download class="h-5 w-5" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div>
                <Label>Output Format</Label>
                <Select v-model="exportConfig.format">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="docx">Word Document</SelectItem>
                    <SelectItem value="html">HTML Page</SelectItem>
                    <SelectItem value="txt">Plain Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div v-if="exportConfig.format === 'pdf'">
                <Label>Page Size</Label>
                <Select v-model="exportConfig.pageSize">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="letter">Letter</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div class="flex items-center space-x-2">
                <Checkbox
                  id="include-watermark"
                  v-model="exportConfig.includeWatermark"
                />
                <Label for="include-watermark">Include watermark</Label>
              </div>
            </CardContent>
          </Card>

          <!-- Generation Actions -->
          <Card>
            <CardContent class="pt-6">
              <div class="space-y-3">
                <Button
                  @click="generateDocuments"
                  :disabled="!canGenerate"
                  class="w-full"
                  size="lg"
                >
                  <Play class="h-4 w-4 mr-2" />
                  {{ mode === 'single' ? 'Generate Document' : 'Start Batch Generation' }}
                </Button>
                
                <Button
                  v-if="selectedTemplate && selectedMatterId"
                  @click="showPreview = true"
                  variant="outline"
                  class="w-full"
                >
                  <Eye class="h-4 w-4 mr-2" />
                  Preview Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Right Panel: Preview and Progress -->
        <div class="col-span-12 lg:col-span-8">
          <div class="h-full">
            <!-- Tab Navigation -->
            <Tabs v-model="activeTab" class="h-full flex flex-col">
              <TabsList class="grid w-full grid-cols-3">
                <TabsTrigger value="preview">
                  <Eye class="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="progress">
                  <Activity class="h-4 w-4 mr-2" />
                  Progress
                </TabsTrigger>
                <TabsTrigger value="history">
                  <Clock class="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>

              <!-- Preview Tab -->
              <TabsContent value="preview" class="flex-1">
                <DocumentPreview
                  v-if="selectedTemplate && selectedMatterId"
                  :template-id="selectedTemplate.id"
                  :matter-id="selectedMatterId"
                  :format="previewFormat"
                  @error="handlePreviewError"
                />
                <div v-else class="preview-placeholder">
                  <div class="text-center py-16">
                    <FileText class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 class="text-lg font-medium mb-2">No Preview Available</h3>
                    <p class="text-muted-foreground mb-4">
                      Select a template and matter to see the document preview
                    </p>
                  </div>
                </div>
              </TabsContent>

              <!-- Progress Tab -->
              <TabsContent value="progress" class="flex-1">
                <div class="space-y-4">
                  <!-- Active Jobs -->
                  <div v-if="activeJobs.length > 0">
                    <h3 class="text-lg font-medium mb-3">Active Generation Jobs</h3>
                    <div class="space-y-3">
                      <GenerationProgressTracker
                        v-for="job in activeJobs"
                        :key="job.id"
                        :job-id="job.id"
                        :show-details="true"
                        @completed="handleJobCompleted"
                        @error="handleJobError"
                      />
                    </div>
                  </div>

                  <!-- Batch Manager -->
                  <BatchGenerationManager
                    v-if="mode === 'batch'"
                    :operations="batchOperations"
                    @cancel="cancelBatchOperation"
                    @retry="retryBatchOperation"
                  />

                  <!-- No Active Jobs -->
                  <div v-if="activeJobs.length === 0" class="text-center py-16">
                    <Activity class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 class="text-lg font-medium mb-2">No Active Jobs</h3>
                    <p class="text-muted-foreground">
                      Generate documents to see progress tracking here
                    </p>
                  </div>
                </div>
              </TabsContent>

              <!-- History Tab -->
              <TabsContent value="history" class="flex-1">
                <GenerationHistory
                  :history="generationHistory"
                  @download="downloadDocument"
                  @regenerate="regenerateDocument"
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <TemplateSelectorModal
      v-if="showTemplateSelector"
      @select="selectTemplate"
      @close="showTemplateSelector = false"
    />
    
    <MatterSelectorModal
      v-if="showMatterSelector"
      :multiple="mode === 'batch'"
      :selected="selectedMatterIds"
      @select="selectMatter"
      @close="showMatterSelector = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  FileText, 
  Package, 
  Plus, 
  // FileTemplate, // doesn't exist in lucide-vue-next 
  Briefcase, 
  Download, 
  Play, 
  Eye, 
  Activity, 
  Clock 
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

// Child Components
import DocumentPreview from './DocumentPreview.vue'
import GenerationProgressTracker from './GenerationProgressTracker.vue'
import BatchGenerationManager from './BatchGenerationManager.vue'
import GenerationHistory from './GenerationHistory.vue'
import TemplateSelectorModal from './TemplateSelectorModal.vue'
import MatterSelectorModal from './MatterSelectorModal.vue'

// Composables
import { useDocumentGeneration } from '~/composables/document-generation/useDocumentGeneration'
import { useToast } from '~/composables/useToast'

// Props
interface Props {
  matterId?: string
  templateIds?: string[]
  batchMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  batchMode: false
})

// State
const mode = ref<'single' | 'batch'>(props.batchMode ? 'batch' : 'single')
const activeTab = ref('preview')
const showTemplateSelector = ref(false)
const showMatterSelector = ref(false)
const showPreview = ref(false)

// Template Selection
const selectedTemplate = ref<Template | null>(null)
const selectedMatterId = ref<string>(props.matterId || '')
const selectedMatterIds = ref<string[]>([])

// Configuration
const batchConfig = ref({
  concurrency: '3'
})

const exportConfig = ref({
  format: 'pdf' as 'pdf' | 'docx' | 'html' | 'txt',
  pageSize: 'a4' as 'a4' | 'letter' | 'legal',
  includeWatermark: true
})

const previewFormat = ref<'html' | 'pdf' | 'structured'>('html')

// Mock Data
const matters = ref([
  { id: '1', title: 'Estate Planning - Johnson Family' },
  { id: '2', title: 'Corporate Merger - TechCorp Inc.' },
  { id: '3', title: 'Real Estate Purchase - Downtown Property' },
  { id: '4', title: 'Employment Contract - Senior Developer' },
  { id: '5', title: 'Intellectual Property - Patent Application' }
])

// Generation State
const { 
  generateDocument, 
  activeJobs, 
  batchOperations, 
  generationHistory 
} = useDocumentGeneration()

const { toast } = useToast()

// Computed
const canGenerate = computed(() => {
  if (mode.value === 'single') {
    return selectedTemplate.value && selectedMatterId.value
  } else {
    return selectedTemplate.value && selectedMatterIds.value.length > 0
  }
})

// Methods
const selectTemplate = (template: Template) => {
  selectedTemplate.value = template
  showTemplateSelector.value = false
  
  toast({
    title: 'Template Selected',
    description: `Selected template: ${template.name}`
  })
}

const selectMatter = (matter: Matter) => {
  if (mode.value === 'batch') {
    // For batch mode, we would handle multiple matters differently
    selectedMatterIds.value = [matter.id]
  } else {
    selectedMatterId.value = matter.id
  }
  showMatterSelector.value = false
}

const generateDocuments = async () => {
  if (!canGenerate.value) return

  try {
    if (mode.value === 'single') {
      const job = await generateDocument({
        templateId: selectedTemplate.value.id,
        matterId: selectedMatterId.value,
        format: exportConfig.value.format,
        options: exportConfig.value
      })
      
      toast({
        title: 'Generation Started',
        description: 'Document generation has been started. Check the Progress tab for updates.'
      })
      
      activeTab.value = 'progress'
    } else {
      // Batch generation logic
      for (const matterId of selectedMatterIds.value) {
        await generateDocument({
          templateId: selectedTemplate.value.id,
          matterId,
          format: exportConfig.value.format,
          options: exportConfig.value
        })
      }
      
      toast({
        title: 'Batch Generation Started',
        description: `Started generation for ${selectedMatterIds.value.length} documents.`
      })
      
      activeTab.value = 'progress'
    }
  } catch (error) {
    toast({
      title: 'Generation Failed',
      description: (error as Error).message || 'Failed to start document generation',
      variant: 'destructive'
    })
  }
}

const handlePreviewError = (error: string) => {
  toast({
    title: 'Preview Error',
    description: error,
    variant: 'destructive'
  })
}

const handleJobCompleted = (jobId: string) => {
  toast({
    title: 'Generation Complete',
    description: 'Document has been generated successfully'
  })
}

const handleJobError = (jobId: string, error: string) => {
  toast({
    title: 'Generation Failed',
    description: error,
    variant: 'destructive'
  })
}

const cancelBatchOperation = (operationId: string) => {
  // Implementation for canceling batch operations
}

const retryBatchOperation = (operationId: string) => {
  // Implementation for retrying batch operations
}

const downloadDocument = (documentId: string) => {
  // Implementation for downloading documents
}

const regenerateDocument = (documentId: string) => {
  // Implementation for regenerating documents
}

// Initialize with props
watch(() => props.templateIds, (newIds) => {
  if (newIds && newIds.length > 0) {
    // Load template from ID
  }
}, { immediate: true })

watch(() => props.matterId, (newId) => {
  if (newId) {
    selectedMatterId.value = newId
  }
}, { immediate: true })
</script>

<style scoped>
.document-generation-engine {
  @apply h-full flex flex-col;
}

.generation-header {
  @apply border-b bg-background p-6;
}

.generation-content {
  @apply flex-1 p-6 overflow-hidden;
}

.mode-toggle {
  @apply flex rounded-lg border p-1;
}

.mode-toggle .btn {
  @apply rounded-md;
}

.selected-template {
  @apply space-y-3;
}

.template-icon {
  @apply flex-shrink-0;
}

.preview-placeholder {
  @apply h-full flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .generation-content .grid {
    @apply grid-cols-1;
  }
  
  .generation-content .col-span-4,
  .generation-content .col-span-8 {
    @apply col-span-1;
  }
}
</style>