<template>
  <div class="document-filters">
    <!-- Header -->
    <div class="filters-header">
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="text-sm font-semibold">Filters</h3>
        <div class="flex items-center gap-2">
          <Button
            v-if="hasActiveFilters"
            variant="ghost"
            size="sm"
            @click="clearAllFilters"
            class="text-xs"
          >
            Clear All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            @click="$emit('close')"
            class="sm:hidden"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Filter Content -->
    <div class="filters-content">
      <ScrollArea class="h-full">
        <div class="p-4 space-y-6">
          
          <!-- File Type Filter -->
          <div class="filter-section">
            <Label class="text-sm font-medium mb-3 block">File Type</Label>
            <div class="space-y-2">
              <div
                v-for="type in availableFileTypes"
                :key="type.value"
                class="flex items-center space-x-2"
              >
                <Checkbox
                  :id="`type-${type.value}`"
                  :checked="modelValue.fileTypes.includes(type.value)"
                  @update:checked="(checked: boolean) => toggleFileType(type.value, checked)"
                />
                <Label
                  :for="`type-${type.value}`"
                  class="text-sm font-normal cursor-pointer flex items-center gap-2"
                >
                  <component :is="type.icon" class="h-4 w-4" />
                  {{ type.label }}
                  <Badge variant="secondary" class="text-xs">
                    {{ getFileTypeCount(type.value) }}
                  </Badge>
                </Label>
              </div>
            </div>
          </div>

          <!-- Date Range Filter -->
          <div class="filter-section">
            <Label class="text-sm font-medium mb-3 block">Date Range</Label>
            <div class="space-y-3">
              <!-- Quick Date Ranges -->
              <div class="grid grid-cols-2 gap-2">
                <Button
                  v-for="range in quickDateRanges"
                  :key="range.label"
                  variant="outline"
                  size="sm"
                  :class="{ 'bg-accent': isDateRangeActive(range) }"
                  @click="setDateRange(range)"
                  class="text-xs"
                >
                  {{ range.label }}
                </Button>
              </div>
              
              <!-- Custom Date Range -->
              <div class="space-y-2">
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <Label for="date-from" class="text-xs text-muted-foreground">From</Label>
                    <Input
                      id="date-from"
                      type="date"
                      :value="formatDateForInput(customDateRange.start)"
                      @input="updateCustomDateStart"
                      class="text-xs"
                    />
                  </div>
                  <div>
                    <Label for="date-to" class="text-xs text-muted-foreground">To</Label>
                    <Input
                      id="date-to"
                      type="date"
                      :value="formatDateForInput(customDateRange.end)"
                      @input="updateCustomDateEnd"
                      class="text-xs"
                    />
                  </div>
                </div>
                <Button
                  v-if="customDateRange.start || customDateRange.end"
                  variant="outline"
                  size="sm"
                  @click="applyCustomDateRange"
                  class="w-full text-xs"
                >
                  Apply Custom Range
                </Button>
              </div>
            </div>
          </div>

          <!-- File Size Filter -->
          <div class="filter-section">
            <Label class="text-sm font-medium mb-3 block">File Size</Label>
            <div class="space-y-3">
              <!-- Size Range Slider -->
              <div class="px-1">
                <Slider
                  :model-value="sizeRange"
                  @update:model-value="updateSizeRange"
                  :min="0"
                  :max="sizeStats.max"
                  :step="Math.max(1, Math.floor(sizeStats.max / 100))"
                  class="w-full"
                />
                <div class="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{{ formatFileSize(sizeRange[0]) }}</span>
                  <span>{{ formatFileSize(sizeRange[1]) }}</span>
                </div>
              </div>
              
              <!-- Quick Size Ranges -->
              <div class="grid grid-cols-2 gap-2">
                <Button
                  v-for="range in quickSizeRanges"
                  :key="range.label"
                  variant="outline"
                  size="sm"
                  :class="{ 'bg-accent': isSizeRangeActive(range) }"
                  @click="setSizeRange(range)"
                  class="text-xs"
                >
                  {{ range.label }}
                </Button>
              </div>
            </div>
          </div>

          <!-- Tags Filter -->
          <div class="filter-section">
            <Label class="text-sm font-medium mb-3 block">Tags</Label>
            <div class="space-y-3">
              <!-- Available Tags -->
              <div class="space-y-2 max-h-32 overflow-y-auto">
                <div
                  v-for="tag in availableTags"
                  :key="tag.name"
                  class="flex items-center space-x-2"
                >
                  <Checkbox
                    :id="`tag-${tag.name}`"
                    :checked="modelValue.tags.includes(tag.name)"
                    @update:checked="(checked: boolean) => toggleTag(tag.name, checked)"
                  />
                  <Label
                    :for="`tag-${tag.name}`"
                    class="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    <Badge variant="outline" class="text-xs">
                      {{ tag.name }}
                    </Badge>
                    <span class="text-xs text-muted-foreground">
                      ({{ tag.count }})
                    </span>
                  </Label>
                </div>
              </div>
              
              <!-- Add Custom Tag -->
              <div class="flex gap-2">
                <Input
                  v-model="newTag"
                  placeholder="Add tag..."
                  class="text-xs"
                  @keydown.enter="addCustomTag"
                />
                <Button
                  variant="outline"
                  size="sm"
                  @click="addCustomTag"
                  :disabled="!newTag.trim()"
                >
                  <Plus class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Active Filters Summary -->
          <div v-if="hasActiveFilters" class="filter-section">
            <Label class="text-sm font-medium mb-3 block">Active Filters</Label>
            <div class="space-y-2">
              <div class="flex flex-wrap gap-2">
                <!-- File Type Chips -->
                <Badge
                  v-for="type in modelValue.fileTypes"
                  :key="type"
                  variant="secondary"
                  class="text-xs cursor-pointer"
                  @click="toggleFileType(type, false)"
                >
                  {{ getFileTypeLabel(type) }}
                  <X class="h-3 w-3 ml-1" />
                </Badge>
                
                <!-- Date Range Chip -->
                <Badge
                  v-if="modelValue.dateRange"
                  variant="secondary"
                  class="text-xs cursor-pointer"
                  @click="clearDateRange"
                >
                  {{ formatDateRange(modelValue.dateRange) }}
                  <X class="h-3 w-3 ml-1" />
                </Badge>
                
                <!-- Size Range Chip -->
                <Badge
                  v-if="modelValue.sizeRange"
                  variant="secondary"
                  class="text-xs cursor-pointer"
                  @click="clearSizeRange"
                >
                  {{ formatSizeRange(modelValue.sizeRange) }}
                  <X class="h-3 w-3 ml-1" />
                </Badge>
                
                <!-- Tag Chips -->
                <Badge
                  v-for="tag in modelValue.tags"
                  :key="tag"
                  variant="secondary"
                  class="text-xs cursor-pointer"
                  @click="toggleTag(tag, false)"
                >
                  {{ tag }}
                  <X class="h-3 w-3 ml-1" />
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  X, 
  Plus,
  FileText,
  Image,
  File,
  Video,
  Music,
  Archive,
  FileSpreadsheet,
  FileSliders
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'
import { Badge } from '~/components/ui/badge'
import { ScrollArea } from '~/components/ui/scroll-area'
// import { Slider } from '~/components/ui/slider' // Not available

// Types
import type { Document, DocumentFilterConfig } from '~/types/document'

interface Props {
  modelValue: DocumentFilterConfig
  documents: Document[]
}

interface Emits {
  (e: 'update:modelValue', value: DocumentFilterConfig): void
  (e: 'change', value: DocumentFilterConfig): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state
const newTag = ref('')
const customDateRange = ref({
  start: null as Date | null,
  end: null as Date | null
})
const sizeRange = ref([0, 0])

// File type options with icons
const fileTypeMap = {
  'application/pdf': { label: 'PDF', icon: FileText },
  'application/msword': { label: 'Word', icon: FileText },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { label: 'Word', icon: FileText },
  'application/vnd.ms-excel': { label: 'Excel', icon: FileSpreadsheet },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { label: 'Excel', icon: FileSpreadsheet },
  'image/jpeg': { label: 'JPEG', icon: Image },
  'image/png': { label: 'PNG', icon: Image },
  'image/gif': { label: 'GIF', icon: Image },
  'video/mp4': { label: 'Video', icon: Video },
  'audio/mpeg': { label: 'Audio', icon: Music },
  'application/zip': { label: 'Archive', icon: Archive },
  'text/plain': { label: 'Text', icon: File }
}

// Computed properties
const availableFileTypes = computed(() => {
  const types = new Set(props.documents.map(doc => doc.mimeType))
  return Array.from(types).map(type => ({
    value: type,
    label: fileTypeMap[type as keyof typeof fileTypeMap]?.label || 'Unknown',
    icon: fileTypeMap[type as keyof typeof fileTypeMap]?.icon || File
  }))
})

const availableTags = computed(() => {
  const tagCounts = new Map<string, number>()
  
  props.documents.forEach(doc => {
    doc.tags?.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })
  
  return Array.from(tagCounts.entries()).map(([name, count]) => ({
    name,
    count
  })).sort((a, b) => b.count - a.count)
})

const sizeStats = computed(() => {
  const sizes = props.documents.map(doc => doc.size)
  return {
    min: Math.min(...sizes, 0),
    max: Math.max(...sizes, 100 * 1024 * 1024), // Default 100MB max
    avg: sizes.reduce((sum, size) => sum + size, 0) / sizes.length
  }
})

const hasActiveFilters = computed(() => {
  return props.modelValue.fileTypes.length > 0 ||
         props.modelValue.dateRange !== null ||
         props.modelValue.sizeRange !== null ||
         props.modelValue.tags.length > 0
})

// Quick filter options
const quickDateRanges = [
  { label: 'Today', days: 0 },
  { label: 'Week', days: 7 },
  { label: 'Month', days: 30 },
  { label: 'Year', days: 365 }
]

const quickSizeRanges = [
  { label: '< 1MB', min: 0, max: 1024 * 1024 },
  { label: '1-10MB', min: 1024 * 1024, max: 10 * 1024 * 1024 },
  { label: '10-100MB', min: 10 * 1024 * 1024, max: 100 * 1024 * 1024 },
  { label: '> 100MB', min: 100 * 1024 * 1024, max: Infinity }
]

// Helper methods
const getFileTypeCount = (mimeType: string) => {
  return props.documents.filter(doc => doc.mimeType === mimeType).length
}

const getFileTypeLabel = (mimeType: string) => {
  return fileTypeMap[mimeType as keyof typeof fileTypeMap]?.label || 'Unknown'
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round(bytes / Math.pow(k, i) * 10) / 10} ${sizes[i]}`
}

const formatDateForInput = (date: Date | null) => {
  if (!date) return ''
  return date.toISOString().split('T')[0]
}

const formatDateRange = (range: { start: Date; end: Date }) => {
  return `${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()}`
}

const formatSizeRange = (range: { min: number; max: number }) => {
  return `${formatFileSize(range.min)} - ${formatFileSize(range.max)}`
}

// Event handlers
const toggleFileType = (mimeType: string, checked: boolean) => {
  const fileTypes = [...props.modelValue.fileTypes]
  
  if (checked && !fileTypes.includes(mimeType)) {
    fileTypes.push(mimeType)
  } else if (!checked) {
    const index = fileTypes.indexOf(mimeType)
    if (index !== -1) {
      fileTypes.splice(index, 1)
    }
  }
  
  updateFilters({ fileTypes })
}

const toggleTag = (tag: string, checked: boolean) => {
  const tags = [...props.modelValue.tags]
  
  if (checked && !tags.includes(tag)) {
    tags.push(tag)
  } else if (!checked) {
    const index = tags.indexOf(tag)
    if (index !== -1) {
      tags.splice(index, 1)
    }
  }
  
  updateFilters({ tags })
}

const setDateRange = (range: { label: string; days: number }) => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - range.days)
  
  updateFilters({
    dateRange: { start, end }
  })
}

const setSizeRange = (range: { min: number; max: number }) => {
  updateFilters({
    sizeRange: range
  })
}

const updateSizeRange = (newRange: number[]) => {
  sizeRange.value = newRange
  updateFilters({
    sizeRange: { min: newRange[0], max: newRange[1] }
  })
}

const addCustomTag = () => {
  const tag = newTag.value.trim()
  if (tag && !props.modelValue.tags.includes(tag)) {
    toggleTag(tag, true)
    newTag.value = ''
  }
}

const updateCustomDateStart = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  customDateRange.value.start = value ? new Date(value) : null
}

const updateCustomDateEnd = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  customDateRange.value.end = value ? new Date(value) : null
}

const applyCustomDateRange = () => {
  if (customDateRange.value.start && customDateRange.value.end) {
    updateFilters({
      dateRange: {
        start: customDateRange.value.start,
        end: customDateRange.value.end
      }
    })
  }
}

const isDateRangeActive = (range: { days: number }) => {
  if (!props.modelValue.dateRange) return false
  
  const { start, end } = props.modelValue.dateRange
  const now = new Date()
  const expectedStart = new Date()
  expectedStart.setDate(expectedStart.getDate() - range.days)
  
  return Math.abs(start.getTime() - expectedStart.getTime()) < 24 * 60 * 60 * 1000 &&
         Math.abs(end.getTime() - now.getTime()) < 24 * 60 * 60 * 1000
}

const isSizeRangeActive = (range: { min: number; max: number }) => {
  if (!props.modelValue.sizeRange) return false
  
  return props.modelValue.sizeRange.min === range.min &&
         props.modelValue.sizeRange.max === range.max
}

const clearDateRange = () => {
  updateFilters({ dateRange: null })
}

const clearSizeRange = () => {
  updateFilters({ sizeRange: null })
}

const clearAllFilters = () => {
  updateFilters({
    fileTypes: [],
    dateRange: null,
    sizeRange: null,
    tags: []
  })
}

const updateFilters = (updates: Partial<DocumentFilterConfig>) => {
  const newValue = { ...props.modelValue, ...updates }
  emit('update:modelValue', newValue)
  emit('change', newValue)
}

// Initialize size range
watch(() => sizeStats.value, (stats) => {
  if (sizeRange.value[1] === 0) {
    sizeRange.value = [stats.min, stats.max]
  }
}, { immediate: true })
</script>

<style scoped>
.document-filters {
  @apply flex flex-col h-full bg-background;
}

.filters-header {
  @apply flex-shrink-0;
}

.filters-content {
  @apply flex-1 overflow-hidden;
}

.filter-section {
  @apply border-b border-border last:border-b-0 pb-4 last:pb-0;
}

/* Custom checkbox and slider styling */
:deep(.checkbox) {
  @apply data-[state=checked]:bg-primary data-[state=checked]:border-primary;
}

:deep(.slider-track) {
  @apply bg-secondary;
}

:deep(.slider-range) {
  @apply bg-primary;
}

:deep(.slider-thumb) {
  @apply border-primary bg-background;
}

/* Scroll area styling */
:deep(.scroll-area-viewport) {
  @apply pb-4;
}

/* Badge hover effects */
.filter-section .cursor-pointer:hover {
  @apply opacity-75;
}

/* Focus states for accessibility */
.filter-section input:focus-visible,
.filter-section button:focus-visible {
  @apply ring-2 ring-ring ring-offset-2;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .document-filters {
    @apply w-full;
  }
  
  .filters-content {
    @apply px-2;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .filter-section {
    @apply border-b-2;
  }
}
</style>