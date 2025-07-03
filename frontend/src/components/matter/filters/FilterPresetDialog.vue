<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Switch } from '~/components/ui/switch'
import { Badge } from '~/components/ui/badge'
import { cn } from '~/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import type { FilterPreset, FilterValue } from './FilterConfig'
import { useFilterPresets } from '~/composables/useFilterPresets'

interface Props {
  mode: 'create' | 'edit' | 'manage'
  preset?: FilterPreset
  filters?: FilterValue[]
  open?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  open: false
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'preset:created': [preset: FilterPreset]
  'preset:updated': [preset: FilterPreset]
  'preset:deleted': [presetId: string]
  'preset:applied': [preset: FilterPreset]
  'preset:edit': [preset: FilterPreset]
}>()

const {
  userPresets,
  systemPresets,
  allPresets,
  createPreset,
  updatePreset,
  deletePreset,
  applyPreset,
  exportPresets,
  importPresets,
  error: presetError,
  getPresetStats
} = useFilterPresets()

// Form state
const formData = ref({
  name: '',
  description: '',
  isPublic: false
})

const isDeleteDialogOpen = ref(false)
const presetToDelete = ref<FilterPreset | null>(null)
const isImporting = ref(false)
const importData = ref('')
const importErrors = ref<string[]>([])

// Computed
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0 && 
         formData.value.name.length <= 50 &&
         (!formData.value.description || formData.value.description.length <= 200)
})

const currentFilters = computed(() => props.filters || [])
const hasFilters = computed(() => currentFilters.value.length > 0)

const presetStats = computed(() => getPresetStats())

// Initialize form data when preset changes
watch(() => props.preset, (preset) => {
  if (preset) {
    formData.value = {
      name: preset.name,
      description: preset.description || '',
      isPublic: preset.isPublic ?? false
    }
  } else {
    formData.value = {
      name: '',
      description: '',
      isPublic: false
    }
  }
}, { immediate: true })

// Clear form when dialog closes
watch(isOpen, (open) => {
  if (!open) {
    formData.value = {
      name: '',
      description: '',
      isPublic: false
    }
    importData.value = ''
    importErrors.value = []
  }
})

const handleSave = async () => {
  if (!isFormValid.value) return

  try {
    let result: FilterPreset | null = null

    if (props.mode === 'create') {
      result = await createPreset(
        formData.value.name,
        currentFilters.value,
        {
          description: formData.value.description,
          isPublic: formData.value.isPublic
        }
      )
      if (result) {
        emit('preset:created', result)
      }
    } else if (props.mode === 'edit' && props.preset) {
      result = await updatePreset(props.preset.id, {
        name: formData.value.name,
        description: formData.value.description,
        isPublic: formData.value.isPublic
      })
      if (result) {
        emit('preset:updated', result)
      }
    }

    if (result) {
      isOpen.value = false
    }
  } catch (error) {
    console.error('Failed to save preset:', error)
  }
}

const handleDelete = async (preset: FilterPreset) => {
  presetToDelete.value = preset
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!presetToDelete.value) return

  const success = await deletePreset(presetToDelete.value.id)
  if (success) {
    emit('preset:deleted', presetToDelete.value.id)
    isDeleteDialogOpen.value = false
    presetToDelete.value = null
  }
}

const handleApply = async (preset: FilterPreset) => {
  const result = await applyPreset(preset.id)
  if (result) {
    emit('preset:applied', preset)
  }
}

const handleExport = () => {
  const data = exportPresets(false) // User presets only
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `filter-presets-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const handleImport = async () => {
  if (!importData.value.trim()) return

  isImporting.value = true
  try {
    const result = await importPresets(importData.value, {
      overwrite: false,
      makePublic: false
    })
    
    importErrors.value = result.errors
    
    if (result.imported > 0) {
      importData.value = ''
      // Success feedback could be added here
    }
  } catch (error) {
    importErrors.value = ['Failed to import presets']
  } finally {
    isImporting.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle>
          <span v-if="mode === 'create'">Save Filter Preset</span>
          <span v-else-if="mode === 'edit'">Edit Preset</span>
          <span v-else>Manage Filter Presets</span>
        </DialogTitle>
        <DialogDescription v-if="mode === 'create'">
          Save your current filters as a preset to quickly apply them later.
        </DialogDescription>
        <DialogDescription v-else-if="mode === 'edit'">
          Update the preset details and settings.
        </DialogDescription>
        <DialogDescription v-else>
          Manage your filter presets, import/export configurations, and view usage statistics.
        </DialogDescription>
      </DialogHeader>

      <!-- Create/Edit Form -->
      <div v-if="mode === 'create' || mode === 'edit'" class="space-y-4 py-4">
        <!-- Current filters preview -->
        <div v-if="mode === 'create'" class="space-y-2">
          <Label>Current Filters ({{ currentFilters.length }})</Label>
          <div class="border rounded-lg p-3 bg-muted/50 max-h-32 overflow-y-auto">
            <div v-if="hasFilters" class="flex flex-wrap gap-1">
              <Badge
                v-for="filter in currentFilters"
                :key="`${filter.field}-${filter.operator}`"
                variant="secondary"
                class="text-xs"
              >
                {{ filter.field }}: {{ 
                  Array.isArray(filter.value) ? filter.value.join(', ') : String(filter.value) 
                }}
              </Badge>
            </div>
            <p v-else class="text-sm text-muted-foreground">No filters selected</p>
          </div>
        </div>

        <!-- Form fields -->
        <div class="space-y-2">
          <Label for="preset-name">Preset Name *</Label>
          <Input
            id="preset-name"
            v-model="formData.name"
            placeholder="Enter preset name..."
            :maxlength="50"
            :class="formData.name.length > 50 ? 'border-destructive' : ''"
          />
          <p class="text-xs text-muted-foreground">{{ formData.name.length }}/50 characters</p>
        </div>

        <div class="space-y-2">
          <Label for="preset-description">Description</Label>
          <Textarea
            id="preset-description"
            v-model="formData.description"
            placeholder="Optional description..."
            :maxlength="200"
            :rows="3"
            :class="cn(formData.description.length > 200 && 'border-destructive')"
          />
          <p class="text-xs text-muted-foreground">{{ formData.description.length }}/200 characters</p>
        </div>

        <div class="flex items-center space-x-2">
          <Switch
            id="preset-public"
            v-model:checked="formData.isPublic"
          />
          <Label for="preset-public">Make this preset public</Label>
        </div>

        <!-- Error display -->
        <div v-if="presetError" class="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {{ presetError }}
        </div>
      </div>

      <!-- Management Interface -->
      <div v-else class="flex-1 overflow-hidden flex flex-col space-y-4 py-4">
        <!-- Stats and Actions -->
        <div class="flex items-center justify-between">
          <div class="flex space-x-4 text-sm text-muted-foreground">
            <span>{{ presetStats.total }} total</span>
            <span>{{ presetStats.user }} user</span>
            <span>{{ presetStats.system }} system</span>
          </div>
          
          <div class="flex space-x-2">
            <Button variant="outline" size="sm" @click="handleExport">
              <Icon name="lucide:download" class="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <!-- Import Section -->
        <div class="space-y-2">
          <Label>Import Presets</Label>
          <div class="flex space-x-2">
            <Textarea
              v-model="importData"
              placeholder="Paste JSON preset data here..."
              rows="3"
              class="flex-1"
            />
            <Button 
              @click="handleImport" 
              :disabled="!importData.trim() || isImporting"
              size="sm"
            >
              <Icon name="lucide:upload" class="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>
          <div v-if="importErrors.length > 0" class="space-y-1">
            <p
              v-for="error in importErrors"
              :key="error"
              class="text-xs text-destructive"
            >
              {{ error }}
            </p>
          </div>
        </div>

        <!-- Presets List -->
        <div class="flex-1 overflow-y-auto space-y-4">
          <!-- System Presets -->
          <div>
            <h4 class="font-medium mb-2">System Presets</h4>
            <div class="space-y-2">
              <div
                v-for="preset in systemPresets"
                :key="preset.id"
                class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div class="flex-1">
                  <div class="flex items-center space-x-2">
                    <h5 class="font-medium">{{ preset.name }}</h5>
                    <Badge variant="outline" class="text-xs">System</Badge>
                    <Badge v-if="preset.isDefault" variant="secondary" class="text-xs">Default</Badge>
                  </div>
                  <p v-if="preset.description" class="text-sm text-muted-foreground mt-1">
                    {{ preset.description }}
                  </p>
                  <p class="text-xs text-muted-foreground mt-1">
                    {{ preset.filters.length }} filter{{ preset.filters.length === 1 ? '' : 's' }}
                  </p>
                </div>
                <Button variant="outline" size="sm" @click="handleApply(preset)">
                  Apply
                </Button>
              </div>
            </div>
          </div>

          <!-- User Presets -->
          <div v-if="userPresets.length > 0">
            <h4 class="font-medium mb-2">Your Presets</h4>
            <div class="space-y-2">
              <div
                v-for="preset in userPresets"
                :key="preset.id"
                class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div class="flex-1">
                  <div class="flex items-center space-x-2">
                    <h5 class="font-medium">{{ preset.name }}</h5>
                    <Badge v-if="preset.isPublic" variant="outline" class="text-xs">Public</Badge>
                  </div>
                  <p v-if="preset.description" class="text-sm text-muted-foreground mt-1">
                    {{ preset.description }}
                  </p>
                  <div class="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                    <span>{{ preset.filters.length }} filter{{ preset.filters.length === 1 ? '' : 's' }}</span>
                    <span v-if="preset.createdAt">Created {{ formatDate(preset.createdAt) }}</span>
                    <span v-if="preset.lastUsed">Last used {{ formatDate(preset.lastUsed) }}</span>
                  </div>
                </div>
                <div class="flex space-x-2">
                  <Button variant="outline" size="sm" @click="handleApply(preset)">
                    Apply
                  </Button>
                  <Button variant="outline" size="sm" @click="$emit('preset:edit', preset)">
                    <Icon name="lucide:edit" class="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" @click="handleDelete(preset)">
                    <Icon name="lucide:trash" class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isOpen = false">
          {{ mode === 'manage' ? 'Close' : 'Cancel' }}
        </Button>
        <Button 
          v-if="mode === 'create' || mode === 'edit'"
          @click="handleSave"
          :disabled="!isFormValid || (mode === 'create' && !hasFilters)"
        >
          {{ mode === 'create' ? 'Save Preset' : 'Update Preset' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Delete Confirmation Dialog -->
  <AlertDialog v-model:open="isDeleteDialogOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Preset</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete "{{ presetToDelete?.name }}"? This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction @click="confirmDelete" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style scoped>
/* Custom scrollbar for preset list */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground));
}
</style>