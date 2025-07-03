<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Switch } from '~/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '~/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '~/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/ui/alert-dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Download, 
  Upload,
  Eye,
  Settings,
  ArrowUp,
  ArrowDown
} from 'lucide-vue-next'
import type { PdfTemplate } from '~/composables/usePdfExport'
import type { Matter } from '~/types/matter'

interface ExportTemplate {
  id: string
  name: string
  description: string
  format: 'csv' | 'excel' | 'pdf'
  isDefault: boolean
  isSystem: boolean // System templates cannot be deleted
  columns: Array<{
    key: keyof Matter
    label: string
    width?: number
    visible: boolean
    order: number
    formatter?: string // Name of formatter function
  }>
  settings: {
    // CSV/Excel settings
    delimiter?: string
    includeHeaders?: boolean
    encoding?: string
    
    // PDF settings
    orientation?: 'portrait' | 'landscape'
    pageSize?: 'a4' | 'letter' | 'legal'
    includeLogo?: boolean
    includeMetadata?: boolean
    headerColor?: string
    alternatingRows?: boolean
    
    // Common settings
    dateFormat?: string
    numberFormat?: string
    filterEmptyRows?: boolean
  }
  createdBy: string
  createdAt: Date
  updatedAt: Date
  usageCount: number
}

interface Props {
  isOpen?: boolean
  defaultFormat?: 'csv' | 'excel' | 'pdf'
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  defaultFormat: 'csv'
})

const emit = defineEmits<{
  'template:select': [template: ExportTemplate]
  'template:create': [template: ExportTemplate]
  'template:update': [template: ExportTemplate]
  'template:delete': [templateId: string]
  'close': []
}>()

// State
const isVisible = ref(props.isOpen)
const selectedTemplate = ref<ExportTemplate | null>(null)
const isEditing = ref(false)
const isCreating = ref(false)
const showDeleteDialog = ref(false)
const templateToDelete = ref<string | null>(null)
const searchQuery = ref('')
const selectedFormat = ref<'all' | 'csv' | 'excel' | 'pdf'>('all')
const showPreview = ref(false)

// Mock templates data (would come from API)
const templates = ref<ExportTemplate[]>([
  {
    id: 'template-1',
    name: 'Standard Matter Export',
    description: 'Basic matter information for general use',
    format: 'csv',
    isDefault: true,
    isSystem: true,
    columns: [
      { key: 'caseNumber', label: 'Matter #', visible: true, order: 1 },
      { key: 'title', label: 'Title', visible: true, order: 2 },
      { key: 'clientName', label: 'Client', visible: true, order: 3 },
      { key: 'status', label: 'Status', visible: true, order: 4 },
      { key: 'priority', label: 'Priority', visible: true, order: 5 },
      { key: 'assignedLawyer', label: 'Assignee', visible: true, order: 6 }
    ],
    settings: {
      delimiter: ',',
      includeHeaders: true,
      encoding: 'utf-8',
      dateFormat: 'MM/DD/YYYY',
      filterEmptyRows: true
    },
    createdBy: 'system',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    usageCount: 245
  },
  {
    id: 'template-2',
    name: 'Detailed PDF Report',
    description: 'Comprehensive PDF report with all matter details',
    format: 'pdf',
    isDefault: false,
    isSystem: false,
    columns: [
      { key: 'caseNumber', label: 'Case Number', visible: true, order: 1, width: 15 },
      { key: 'title', label: 'Matter Title', visible: true, order: 2, width: 25 },
      { key: 'clientName', label: 'Client Name', visible: true, order: 3, width: 20 },
      { key: 'status', label: 'Status', visible: true, order: 4, width: 15 },
      { key: 'priority', label: 'Priority', visible: true, order: 5, width: 12 },
      { key: 'assignedLawyer', label: 'Counsel', visible: true, order: 6, width: 13 }
    ],
    settings: {
      orientation: 'landscape',
      pageSize: 'a4',
      includeLogo: true,
      includeMetadata: true,
      headerColor: '#1f2937',
      alternatingRows: true,
      dateFormat: 'YYYY-MM-DD'
    },
    createdBy: 'user123',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-20'),
    usageCount: 67
  }
])

// Form state for editing
const editForm = ref<Partial<ExportTemplate>>({})

// Available columns for matters
const availableColumns = [
  { key: 'caseNumber', label: 'Matter #', type: 'string' },
  { key: 'title', label: 'Title', type: 'string' },
  { key: 'clientName', label: 'Client Name', type: 'string' },
  { key: 'clientEmail', label: 'Client Email', type: 'string' },
  { key: 'status', label: 'Status', type: 'enum' },
  { key: 'priority', label: 'Priority', type: 'enum' },
  { key: 'assignedLawyer', label: 'Assigned Lawyer', type: 'string' },
  { key: 'retentionDate', label: 'Retention Date', type: 'date' },
  { key: 'dueDate', label: 'Due Date', type: 'date' },
  { key: 'createdAt', label: 'Created', type: 'date' },
  { key: 'updatedAt', label: 'Updated', type: 'date' },
  { key: 'description', label: 'Description', type: 'text' },
  { key: 'estimatedValue', label: 'Estimated Value', type: 'number' },
  { key: 'actualValue', label: 'Actual Value', type: 'number' },
  { key: 'amountSpent', label: 'Amount Spent', type: 'number' }
]

// Computed properties
const filteredTemplates = computed(() => {
  let filtered = templates.value

  // Filter by format
  if (selectedFormat.value !== 'all') {
    filtered = filtered.filter(t => t.format === selectedFormat.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    )
  }

  return filtered.sort((a, b) => {
    // System templates first, then by usage count
    if (a.isSystem && !b.isSystem) return -1
    if (!a.isSystem && b.isSystem) return 1
    return b.usageCount - a.usageCount
  })
})

const editFormColumns = computed(() => {
  if (!editForm.value.columns) return []
  return [...editForm.value.columns].sort((a, b) => a.order - b.order)
})

// Methods
const openTemplateDialog = (template?: ExportTemplate) => {
  if (template) {
    selectedTemplate.value = template
    editForm.value = JSON.parse(JSON.stringify(template))
    isEditing.value = true
  } else {
    selectedTemplate.value = null
    editForm.value = {
      name: '',
      description: '',
      format: props.defaultFormat,
      isDefault: false,
      isSystem: false,
      columns: availableColumns.slice(0, 6).map((col, index) => ({
        key: col.key as keyof Matter,
        label: col.label,
        visible: true,
        order: index + 1,
        width: col.type === 'string' ? 20 : 15
      })),
      settings: {
        delimiter: ',',
        includeHeaders: true,
        encoding: 'utf-8',
        dateFormat: 'MM/DD/YYYY'
      },
      createdBy: 'current-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    }
    isCreating.value = true
  }
}

const closeTemplateDialog = () => {
  isEditing.value = false
  isCreating.value = false
  editForm.value = {}
  selectedTemplate.value = null
}

const saveTemplate = () => {
  if (!editForm.value.name || !editForm.value.format) return

  const template = {
    ...editForm.value,
    id: selectedTemplate.value?.id || `template-${Date.now()}`,
    updatedAt: new Date()
  } as ExportTemplate

  if (isCreating.value) {
    templates.value.push(template)
    emit('template:create', template)
  } else {
    const index = templates.value.findIndex(t => t.id === template.id)
    if (index >= 0) {
      templates.value[index] = template
      emit('template:update', template)
    }
  }

  closeTemplateDialog()
}

const confirmDelete = (templateId: string) => {
  templateToDelete.value = templateId
  showDeleteDialog.value = true
}

const deleteTemplate = () => {
  if (templateToDelete.value) {
    const index = templates.value.findIndex(t => t.id === templateToDelete.value)
    if (index >= 0) {
      templates.value.splice(index, 1)
      emit('template:delete', templateToDelete.value)
    }
  }
  showDeleteDialog.value = false
  templateToDelete.value = null
}

const duplicateTemplate = (template: ExportTemplate) => {
  const duplicated = {
    ...JSON.parse(JSON.stringify(template)),
    id: `template-${Date.now()}`,
    name: `${template.name} (Copy)`,
    isDefault: false,
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 0
  }
  templates.value.push(duplicated)
  emit('template:create', duplicated)
}

const selectTemplate = (template: ExportTemplate) => {
  emit('template:select', template)
  isVisible.value = false
}

const addColumn = () => {
  if (!editForm.value.columns) editForm.value.columns = []
  
  const nextOrder = Math.max(...editForm.value.columns.map(c => c.order), 0) + 1
  const availableColumn = availableColumns.find(col => 
    !editForm.value.columns!.some(ec => ec.key === col.key)
  )
  
  if (availableColumn) {
    editForm.value.columns.push({
      key: availableColumn.key as keyof Matter,
      label: availableColumn.label,
      visible: true,
      order: nextOrder,
      width: 20
    })
  }
}

const removeColumn = (index: number) => {
  if (editForm.value.columns) {
    editForm.value.columns.splice(index, 1)
    // Reorder remaining columns
    editForm.value.columns.forEach((col, i) => {
      col.order = i + 1
    })
  }
}

const moveColumn = (index: number, direction: 'up' | 'down') => {
  if (!editForm.value.columns) return
  
  const columns = editFormColumns.value
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  
  if (targetIndex >= 0 && targetIndex < columns.length) {
    // Swap orders
    const temp = columns[index].order
    columns[index].order = columns[targetIndex].order
    columns[targetIndex].order = temp
  }
}

const previewTemplate = (template: ExportTemplate) => {
  selectedTemplate.value = template
  showPreview.value = true
}

const exportTemplate = (template: ExportTemplate) => {
  const dataStr = JSON.stringify(template, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `${template.name.replace(/\s+/g, '_')}.json`
  link.click()
  
  URL.revokeObjectURL(url)
}

const importTemplate = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const template = JSON.parse(e.target?.result as string) as ExportTemplate
      template.id = `template-${Date.now()}`
      template.isSystem = false
      template.createdAt = new Date()
      template.updatedAt = new Date()
      template.usageCount = 0
      
      templates.value.push(template)
      emit('template:create', template)
    } catch (error) {
      console.error('Failed to import template:', error)
    }
  }
  reader.readAsText(file)
  
  // Reset input
  ;(event.target as HTMLInputElement).value = ''
}

// Watch for prop changes
watch(() => props.isOpen, (newValue) => {
  isVisible.value = newValue
})

watch(isVisible, (newValue) => {
  if (!newValue) {
    emit('close')
  }
})
</script>

<template>
  <Dialog v-model:open="isVisible">
    <DialogContent class="max-w-6xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Export Template Manager</DialogTitle>
        <DialogDescription>
          Create, edit, and manage export templates for different report formats
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <!-- Search and filters -->
        <div class="flex gap-4">
          <div class="flex-1">
            <Input
              v-model="searchQuery"
              placeholder="Search templates..."
              class="w-full"
            />
          </div>
          <Select v-model="selectedFormat">
            <SelectTrigger class="w-40">
              <SelectValue placeholder="All Formats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
          <Button @click="openTemplateDialog()">
            <Plus class="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        <!-- Import/Export controls -->
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="() => { const fileInput = $refs.fileInput as HTMLInputElement; fileInput?.click(); }">
            <Upload class="h-4 w-4 mr-2" />
            Import Template
          </Button>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            class="hidden"
            @change="importTemplate"
          />
        </div>

        <!-- Templates grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            v-for="template in filteredTemplates"
            :key="template.id"
            class="cursor-pointer hover:shadow-md transition-shadow"
            @click="selectTemplate(template)"
          >
            <CardHeader class="pb-3">
              <div class="flex items-start justify-between">
                <div>
                  <CardTitle class="text-base flex items-center gap-2">
                    {{ template.name }}
                    <Badge
                      :variant="template.format === 'pdf' ? 'destructive' : 
                              template.format === 'excel' ? 'default' : 'secondary'"
                      class="text-xs"
                    >
                      {{ template.format.toUpperCase() }}
                    </Badge>
                    <Badge v-if="template.isDefault" variant="outline" class="text-xs">
                      Default
                    </Badge>
                  </CardTitle>
                  <p class="text-sm text-muted-foreground mt-1">
                    {{ template.description }}
                  </p>
                </div>
                <div class="flex gap-1" @click.stop>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="previewTemplate(template)"
                  >
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="openTemplateDialog(template)"
                  >
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="duplicateTemplate(template)"
                  >
                    <Copy class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="exportTemplate(template)"
                  >
                    <Download class="h-4 w-4" />
                  </Button>
                  <Button
                    v-if="!template.isSystem"
                    variant="ghost"
                    size="sm"
                    @click="confirmDelete(template.id)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent class="pt-0">
              <div class="flex justify-between text-sm text-muted-foreground">
                <span>{{ template.columns.filter(c => c.visible).length }} columns</span>
                <span>Used {{ template.usageCount }} times</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isVisible = false">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Template Editor Dialog -->
  <Dialog v-model:open="isEditing || isCreating">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {{ isCreating ? 'Create' : 'Edit' }} Export Template
        </DialogTitle>
      </DialogHeader>

      <div class="space-y-6">
        <!-- Basic info -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label for="template-name">Template Name</Label>
            <Input
              id="template-name"
              v-model="editForm.name"
              placeholder="Enter template name"
            />
          </div>
          <div>
            <Label for="template-format">Format</Label>
            <Select v-model="editForm.format">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label for="template-description">Description</Label>
          <Textarea
            id="template-description"
            v-model="editForm.description"
            placeholder="Enter template description"
            rows="2"
          />
        </div>

        <!-- Column configuration -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <Label class="text-base font-semibold">Columns</Label>
            <Button size="sm" @click="addColumn">
              <Plus class="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>

          <div class="space-y-2">
            <div
              v-for="(column, index) in editFormColumns"
              :key="column.key"
              class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <div class="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  :disabled="index === 0"
                  @click="moveColumn(index, 'up')"
                >
                  <ArrowUp class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  :disabled="index === editFormColumns.length - 1"
                  @click="moveColumn(index, 'down')"
                >
                  <ArrowDown class="h-4 w-4" />
                </Button>
              </div>

              <Switch v-model="column.visible" />

              <div class="flex-1">
                <Input v-model="column.label" class="text-sm" />
              </div>

              <div v-if="editForm.format === 'pdf'" class="w-20">
                <Input
                  v-model.number="column.width"
                  type="number"
                  class="text-sm"
                  placeholder="Width"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                @click="removeColumn(index)"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Format-specific settings -->
        <div v-if="editForm.format === 'csv' || editForm.format === 'excel'">
          <Label class="text-base font-semibold">CSV/Excel Settings</Label>
          <div class="grid grid-cols-2 gap-4 mt-3">
            <div>
              <Label>Delimiter</Label>
              <Select v-model="editForm.settings!.delimiter">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Comma (,)</SelectItem>
                  <SelectItem value=";">Semicolon (;)</SelectItem>
                  <SelectItem value="\t">Tab</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Encoding</Label>
              <Select v-model="editForm.settings!.encoding">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utf-8">UTF-8</SelectItem>
                  <SelectItem value="utf-16">UTF-16</SelectItem>
                  <SelectItem value="iso-8859-1">ISO-8859-1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="mt-3 space-y-3">
            <div class="flex items-center space-x-2">
              <Switch v-model="editForm.settings!.includeHeaders" />
              <Label>Include column headers</Label>
            </div>
            <div class="flex items-center space-x-2">
              <Switch v-model="editForm.settings!.filterEmptyRows" />
              <Label>Filter empty rows</Label>
            </div>
          </div>
        </div>

        <div v-if="editForm.format === 'pdf'">
          <Label class="text-base font-semibold">PDF Settings</Label>
          <div class="grid grid-cols-2 gap-4 mt-3">
            <div>
              <Label>Orientation</Label>
              <Select v-model="editForm.settings!.orientation">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Page Size</Label>
              <Select v-model="editForm.settings!.pageSize">
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
          </div>
          <div class="mt-3 space-y-3">
            <div class="flex items-center space-x-2">
              <Switch v-model="editForm.settings!.includeLogo" />
              <Label>Include logo</Label>
            </div>
            <div class="flex items-center space-x-2">
              <Switch v-model="editForm.settings!.includeMetadata" />
              <Label>Include metadata</Label>
            </div>
            <div class="flex items-center space-x-2">
              <Switch v-model="editForm.settings!.alternatingRows" />
              <Label>Alternating row colors</Label>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeTemplateDialog">
          Cancel
        </Button>
        <Button @click="saveTemplate">
          {{ isCreating ? 'Create' : 'Save' }} Template
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Delete confirmation -->
  <AlertDialog v-model:open="showDeleteDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Template</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete this template? This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction @click="deleteTemplate">
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- Template preview -->
  <Dialog v-model:open="showPreview">
    <DialogContent class="max-w-4xl">
      <DialogHeader>
        <DialogTitle>Template Preview</DialogTitle>
      </DialogHeader>
      
      <div v-if="selectedTemplate" class="space-y-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Name:</strong> {{ selectedTemplate.name }}</div>
          <div><strong>Format:</strong> {{ selectedTemplate.format.toUpperCase() }}</div>
          <div><strong>Created:</strong> {{ selectedTemplate.createdAt.toLocaleDateString() }}</div>
          <div><strong>Usage Count:</strong> {{ selectedTemplate.usageCount }}</div>
        </div>
        
        <div>
          <strong>Description:</strong>
          <p class="text-muted-foreground">{{ selectedTemplate.description }}</p>
        </div>

        <div>
          <strong>Columns ({{ selectedTemplate.columns.filter(c => c.visible).length }} visible):</strong>
          <div class="mt-2 space-y-1">
            <div
              v-for="column in selectedTemplate.columns.filter(c => c.visible)"
              :key="column.key"
              class="flex justify-between items-center p-2 bg-muted/50 rounded"
            >
              <span>{{ column.label }}</span>
              <Badge variant="outline" class="text-xs">
                {{ column.key }}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="showPreview = false">
          Close
        </Button>
        <Button @click="selectTemplate(selectedTemplate!)">
          Use Template
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>