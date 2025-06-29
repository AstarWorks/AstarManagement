<template>
  <div class="memo-filters">
    <!-- Filter Header -->
    <div class="filter-header">
      <div class="filter-title">
        <Filter class="size-4" />
        <span>Filters</span>
        <Badge v-if="activeFiltersCount > 0" variant="secondary" class="ml-2">
          {{ activeFiltersCount }}
        </Badge>
      </div>
      
      <div class="filter-actions">
        <Button
          variant="ghost"
          size="sm"
          @click="clearAllFilters"
          :disabled="activeFiltersCount === 0"
        >
          Clear All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          @click="collapsed = !collapsed"
        >
          <ChevronDown :class="['size-4', { 'rotate-180': !collapsed }]" />
        </Button>
      </div>
    </div>
    
    <!-- Filter Content -->
    <div v-if="!collapsed" class="filter-content">
      <!-- Status Filter -->
      <div class="filter-group">
        <label class="filter-label">Status</label>
        <div class="filter-options">
          <div
            v-for="status in statusOptions"
            :key="status.value"
            class="filter-option"
          >
            <Checkbox
              :id="`status-${status.value}`"
              :checked="filters.status?.includes(status.value)"
              @update:checked="(checked: boolean) => toggleStatus(status.value, checked)"
            />
            <label :for="`status-${status.value}`" class="filter-option-label">
              <component :is="status.icon" class="size-3" />
              <span>{{ status.label }}</span>
              <Badge v-if="statusCounts && typeof statusCounts === 'object' && status.value in statusCounts" variant="outline" class="ml-auto">
                {{ statusCounts[status.value as keyof typeof statusCounts] }}
              </Badge>
            </label>
          </div>
        </div>
      </div>
      
      <!-- Priority Filter -->
      <div class="filter-group">
        <label class="filter-label">Priority</label>
        <div class="filter-options">
          <div
            v-for="priority in priorityOptions"
            :key="priority.value"
            class="filter-option"
          >
            <Checkbox
              :id="`priority-${priority.value}`"
              :checked="filters.priority?.includes(priority.value)"
              @update:checked="(checked: boolean) => togglePriority(priority.value, checked)"
            />
            <label :for="`priority-${priority.value}`" class="filter-option-label">
              <div :class="['priority-dot', priority.colorClass]" />
              <span>{{ priority.label }}</span>
              <Badge v-if="priorityCounts && typeof priorityCounts === 'object' && priority.value in priorityCounts" variant="outline" class="ml-auto">
                {{ priorityCounts[priority.value as keyof typeof priorityCounts] }}
              </Badge>
            </label>
          </div>
        </div>
      </div>
      
      <!-- Recipient Type Filter -->
      <div class="filter-group">
        <label class="filter-label">Recipient Type</label>
        <div class="filter-options">
          <div
            v-for="type in recipientTypeOptions"
            :key="type.value"
            class="filter-option"
          >
            <Checkbox
              :id="`recipient-type-${type.value}`"
              :checked="filters.recipientType?.includes(type.value)"
              @update:checked="(checked: boolean) => toggleRecipientType(type.value, checked)"
            />
            <label :for="`recipient-type-${type.value}`" class="filter-option-label">
              <component :is="type.icon" class="size-3" />
              <span>{{ type.label }}</span>
            </label>
          </div>
        </div>
      </div>
      
      <!-- Date Range Filter -->
      <div class="filter-group">
        <label class="filter-label">Date Range</label>
        <div class="date-range-inputs">
          <div class="date-input-group">
            <label class="date-label">From</label>
            <input
              v-model="dateFromStr"
              type="date"
              class="date-input"
              @change="updateDateFrom"
            />
          </div>
          <div class="date-input-group">
            <label class="date-label">To</label>
            <input
              v-model="dateToStr"
              type="date"
              class="date-input"
              @change="updateDateTo"
            />
          </div>
        </div>
        
        <!-- Quick Date Presets -->
        <div class="date-presets">
          <Button
            v-for="preset in datePresets"
            :key="preset.label"
            variant="outline"
            size="sm"
            @click="applyDatePreset(preset)"
          >
            {{ preset.label }}
          </Button>
        </div>
      </div>
      
      <!-- Tags Filter -->
      <div class="filter-group">
        <label class="filter-label">Tags</label>
        <div class="tags-input">
          <div class="selected-tags">
            <Badge
              v-for="tag in filters.tags || []"
              :key="tag"
              variant="secondary"
              class="selected-tag"
            >
              {{ tag }}
              <button @click="removeTag(tag)" class="remove-tag">
                <X class="size-3" />
              </button>
            </Badge>
          </div>
          <input
            v-model="tagInput"
            type="text"
            placeholder="Add tags..."
            class="tag-input"
            @keydown.enter="addTag"
            @keydown.comma="addTag"
          />
        </div>
        
        <!-- Popular Tags -->
        <div v-if="popularTags.length > 0" class="popular-tags">
          <span class="popular-tags-label">Popular:</span>
          <Button
            v-for="tag in popularTags"
            :key="tag"
            variant="ghost"
            size="sm"
            @click="addPopularTag(tag)"
          >
            #{{ tag }}
          </Button>
        </div>
      </div>
      
      <!-- Additional Filters -->
      <div class="filter-group">
        <label class="filter-label">Additional</label>
        <div class="filter-options">
          <div class="filter-option">
            <Checkbox
              id="has-attachments"
              :checked="filters.hasAttachments === true"
              @update:checked="(checked: boolean) => toggleHasAttachments(checked)"
            />
            <label for="has-attachments" class="filter-option-label">
              <Paperclip class="size-3" />
              <span>Has Attachments</span>
            </label>
          </div>
        </div>
      </div>
      
      <!-- Saved Filter Presets -->
      <div v-if="savedPresets.length > 0" class="filter-group">
        <label class="filter-label">Saved Filters</label>
        <div class="saved-presets">
          <Button
            v-for="preset in savedPresets"
            :key="preset.id"
            variant="outline"
            size="sm"
            class="saved-preset"
            @click="applyPreset(preset)"
          >
            <BookmarkIcon class="size-3 mr-1" />
            {{ preset.name }}
          </Button>
        </div>
        
        <!-- Save Current Filter -->
        <div v-if="activeFiltersCount > 0" class="save-filter">
          <Button
            variant="ghost"
            size="sm"
            @click="showSaveDialog = true"
          >
            <Plus class="size-3 mr-1" />
            Save Current Filter
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Save Filter Dialog -->
    <Dialog v-model:open="showSaveDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Filter Preset</DialogTitle>
          <DialogDescription>
            Save your current filter settings for quick access later.
          </DialogDescription>
        </DialogHeader>
        
        <div class="save-dialog-content">
          <div class="form-group">
            <label for="preset-name" class="form-label">Filter Name</label>
            <input
              id="preset-name"
              v-model="presetName"
              type="text"
              class="form-input"
              placeholder="Enter filter name..."
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="showSaveDialog = false">
            Cancel
          </Button>
          <Button @click="saveCurrentFilter" :disabled="!presetName.trim()">
            Save Filter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Filter,
  ChevronDown,
  X,
  Plus,
  FileEdit,
  Send,
  CheckCheck,
  Archive,
  User,
  Building2,
  Gavel,
  Users,
  Paperclip,
  BookmarkIcon
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog'
import type { MemoFilters, MemoStatus, MemoPriority, RecipientType } from '~/types/memo'
import { useMemoCountsQuery } from '~/composables/useMemoQueries'

interface Props {
  modelValue: MemoFilters
}

interface Emits {
  'update:modelValue': [filters: MemoFilters]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Component state
const collapsed = ref(false)
const showSaveDialog = ref(false)
const presetName = ref('')
const tagInput = ref('')
const dateFromStr = ref('')
const dateToStr = ref('')

// Get memo counts for filter badges
const { data: counts } = useMemoCountsQuery()

// Filter options
const statusOptions = [
  { value: 'draft' as MemoStatus, label: 'Draft', icon: FileEdit },
  { value: 'sent' as MemoStatus, label: 'Sent', icon: Send },
  { value: 'read' as MemoStatus, label: 'Read', icon: CheckCheck },
  { value: 'archived' as MemoStatus, label: 'Archived', icon: Archive }
]

const priorityOptions = [
  { value: 'low' as MemoPriority, label: 'Low', colorClass: 'bg-green-500' },
  { value: 'medium' as MemoPriority, label: 'Medium', colorClass: 'bg-yellow-500' },
  { value: 'high' as MemoPriority, label: 'High', colorClass: 'bg-orange-500' },
  { value: 'urgent' as MemoPriority, label: 'Urgent', colorClass: 'bg-red-500' }
]

const recipientTypeOptions = [
  { value: 'client' as RecipientType, label: 'Client', icon: User },
  { value: 'court' as RecipientType, label: 'Court', icon: Gavel },
  { value: 'opposing_counsel' as RecipientType, label: 'Opposing Counsel', icon: Users },
  { value: 'internal' as RecipientType, label: 'Internal', icon: Building2 }
]

const datePresets = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 }
]

// Mock data - in real app, these would come from API
const popularTags = ref(['urgent', 'review', 'contract', 'litigation'])
const savedPresets = ref<Array<{ id: string; name: string; filters: MemoFilters }>>([
  { id: '1', name: 'Urgent Drafts', filters: { status: ['draft' as MemoStatus], priority: ['urgent' as MemoPriority] } },
  { id: '2', name: 'Client Communications', filters: { recipientType: ['client' as RecipientType], status: ['sent' as MemoStatus] } }
])

// Computed properties
const filters = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.status?.length) count++
  if (filters.value.priority?.length) count++
  if (filters.value.recipientType?.length) count++
  if (filters.value.tags?.length) count++
  if (filters.value.dateFrom || filters.value.dateTo) count++
  if (filters.value.hasAttachments !== undefined) count++
  return count
})

const statusCounts = computed(() => counts.value?.status || {} as Record<string, number>)
const priorityCounts = computed(() => counts.value?.priority || {} as Record<string, number>)

// Methods
const updateFilters = (updates: Partial<MemoFilters>) => {
  filters.value = { ...filters.value, ...updates }
}

const toggleStatus = (status: MemoStatus, checked: boolean) => {
  const currentStatus = filters.value.status || []
  if (checked) {
    updateFilters({ status: [...currentStatus, status] })
  } else {
    updateFilters({ status: currentStatus.filter(s => s !== status) })
  }
}

const togglePriority = (priority: MemoPriority, checked: boolean) => {
  const currentPriority = filters.value.priority || []
  if (checked) {
    updateFilters({ priority: [...currentPriority, priority] })
  } else {
    updateFilters({ priority: currentPriority.filter(p => p !== priority) })
  }
}

const toggleRecipientType = (type: RecipientType, checked: boolean) => {
  const currentTypes = filters.value.recipientType || []
  if (checked) {
    updateFilters({ recipientType: [...currentTypes, type] })
  } else {
    updateFilters({ recipientType: currentTypes.filter(t => t !== type) })
  }
}

const toggleHasAttachments = (checked: boolean) => {
  updateFilters({ hasAttachments: checked ? true : undefined })
}

const updateDateFrom = () => {
  const date = dateFromStr.value ? new Date(dateFromStr.value) : undefined
  updateFilters({ dateFrom: date })
}

const updateDateTo = () => {
  const date = dateToStr.value ? new Date(dateToStr.value) : undefined
  updateFilters({ dateTo: date })
}

const applyDatePreset = (preset: { label: string; days: number }) => {
  const today = new Date()
  const fromDate = new Date(today)
  
  if (preset.days > 0) {
    fromDate.setDate(today.getDate() - preset.days)
  }
  
  updateFilters({
    dateFrom: fromDate,
    dateTo: today
  })
  
  // Update input values
  dateFromStr.value = fromDate.toISOString().split('T')[0]
  dateToStr.value = today.toISOString().split('T')[0]
}

const addTag = (event: KeyboardEvent) => {
  event.preventDefault()
  const tag = tagInput.value.trim().replace(',', '')
  if (tag && !(filters.value.tags || []).includes(tag)) {
    const currentTags = filters.value.tags || []
    updateFilters({ tags: [...currentTags, tag] })
    tagInput.value = ''
  }
}

const removeTag = (tag: string) => {
  const currentTags = filters.value.tags || []
  updateFilters({ tags: currentTags.filter(t => t !== tag) })
}

const addPopularTag = (tag: string) => {
  const currentTags = filters.value.tags || []
  if (!currentTags.includes(tag)) {
    updateFilters({ tags: [...currentTags, tag] })
  }
}

const clearAllFilters = () => {
  filters.value = {}
  dateFromStr.value = ''
  dateToStr.value = ''
}

const applyPreset = (preset: any) => {
  updateFilters(preset.filters)
}

const saveCurrentFilter = () => {
  if (!presetName.value.trim()) return
  
  const newPreset = {
    id: Date.now().toString(),
    name: presetName.value.trim(),
    filters: { ...filters.value }
  }
  
  savedPresets.value.push(newPreset)
  presetName.value = ''
  showSaveDialog.value = false
}

// Initialize date strings
watch(() => filters.value.dateFrom, (newDate) => {
  dateFromStr.value = newDate ? newDate.toISOString().split('T')[0] : ''
}, { immediate: true })

watch(() => filters.value.dateTo, (newDate) => {
  dateToStr.value = newDate ? newDate.toISOString().split('T')[0] : ''
}, { immediate: true })
</script>

<style scoped>
.memo-filters {
  @apply bg-card border border-border rounded-lg overflow-hidden;
}

.filter-header {
  @apply flex items-center justify-between p-4 border-b border-border bg-muted/50;
}

.filter-title {
  @apply flex items-center gap-2 font-medium text-foreground;
}

.filter-actions {
  @apply flex items-center gap-2;
}

.filter-content {
  @apply p-4 space-y-6;
}

.filter-group {
  @apply space-y-3;
}

.filter-label {
  @apply block text-sm font-medium text-foreground;
}

.filter-options {
  @apply space-y-2;
}

.filter-option {
  @apply flex items-center gap-3;
}

.filter-option-label {
  @apply flex items-center gap-2 text-sm text-foreground cursor-pointer flex-1;
}

.priority-dot {
  @apply size-2 rounded-full;
}

.date-range-inputs {
  @apply grid grid-cols-2 gap-3;
}

.date-input-group {
  @apply space-y-1;
}

.date-label {
  @apply block text-xs text-muted-foreground;
}

.date-input {
  @apply w-full px-3 py-2 text-sm border border-input rounded-md;
  @apply bg-background text-foreground;
  @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
}

.date-presets {
  @apply flex flex-wrap gap-2 mt-3;
}

.tags-input {
  @apply space-y-2;
}

.selected-tags {
  @apply flex flex-wrap gap-2;
}

.selected-tag {
  @apply flex items-center gap-1;
}

.remove-tag {
  @apply ml-1 hover:bg-destructive/20 rounded-sm p-0.5;
}

.tag-input {
  @apply w-full px-3 py-2 text-sm border border-input rounded-md;
  @apply bg-background text-foreground placeholder:text-muted-foreground;
  @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
}

.popular-tags {
  @apply flex flex-wrap items-center gap-2 mt-2;
}

.popular-tags-label {
  @apply text-xs text-muted-foreground;
}

.saved-presets {
  @apply flex flex-wrap gap-2;
}

.saved-preset {
  @apply text-xs;
}

.save-filter {
  @apply mt-3 pt-3 border-t border-border;
}

.save-dialog-content {
  @apply space-y-4;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-foreground;
}

.form-input {
  @apply w-full px-3 py-2 text-sm border border-input rounded-md;
  @apply bg-background text-foreground placeholder:text-muted-foreground;
  @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
}

/* Animation for chevron rotation */
.rotate-180 {
  @apply transform rotate-180 transition-transform duration-200;
}
</style>