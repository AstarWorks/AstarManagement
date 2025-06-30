<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogDescription>
          {{ parentFolder ? `Create a new folder inside "${parentFolder.name}"` : 'Create a new root folder' }}
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Folder Name -->
        <div class="space-y-2">
          <Label for="folder-name">Folder Name</Label>
          <Input
            id="folder-name"
            v-model="formData.name"
            placeholder="Enter folder name"
            :error="errors.name"
            @update:modelValue="() => errors.name = ''"
            :autofocus="true"
          />
          <p v-if="errors.name" class="text-sm text-destructive">
            {{ errors.name }}
          </p>
        </div>
        
        <!-- Description (Optional) -->
        <div class="space-y-2">
          <Label for="folder-description">Description (Optional)</Label>
          <Textarea
            id="folder-description"
            v-model="formData.description"
            placeholder="Add a description for this folder"
            rows="3"
          />
        </div>
        
        <!-- Color and Icon -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Color Picker -->
          <div class="space-y-2">
            <Label>Folder Color</Label>
            <div class="flex gap-2">
              <button
                v-for="color in colorOptions"
                :key="color"
                type="button"
                @click="formData.color = color"
                class="color-option"
                :class="{ selected: formData.color === color }"
                :style="{ backgroundColor: color }"
                :aria-label="`Select ${color} color`"
              >
                <Check v-if="formData.color === color" class="h-3 w-3 text-white" />
              </button>
            </div>
          </div>
          
          <!-- Icon Selector -->
          <div class="space-y-2">
            <Label>Folder Icon</Label>
            <Select v-model="formData.icon">
              <SelectTrigger>
                <SelectValue placeholder="Choose icon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="icon in iconOptions"
                  :key="icon.value"
                  :value="icon.value"
                >
                  <div class="flex items-center gap-2">
                    <component :is="icon.component" class="h-4 w-4" />
                    <span>{{ icon.label }}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <!-- Permissions -->
        <div class="space-y-2">
          <Label>Permissions</Label>
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <Checkbox
                id="inherit-permissions"
                v-model:checked="formData.inheritsPermissions"
                :disabled="!parentFolder"
              />
              <Label 
                for="inherit-permissions" 
                class="text-sm font-normal cursor-pointer"
              >
                Inherit permissions from parent folder
              </Label>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="handleCancel"
            :disabled="isCreating"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="!canSubmit || isCreating"
          >
            <Loader2 v-if="isCreating" class="h-4 w-4 mr-2 animate-spin" />
            Create Folder
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Folder, 
  Archive, 
  FileText, 
  Briefcase, 
  Users,
  Star,
  Check,
  Loader2
} from 'lucide-vue-next'

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'

// Store
import { useDocumentOrganizationStore } from '~/stores/documentOrganization'

// Types
import type { FolderNode, FolderCreateInput } from '~/types/folder'

interface Props {
  open: boolean
  parentFolderId: string | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'create', folder: FolderNode): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Store
const store = useDocumentOrganizationStore()

// Local state
const isCreating = ref(false)
const formData = ref({
  name: '',
  description: '',
  color: undefined as string | undefined,
  icon: 'folder',
  inheritsPermissions: true
})

const errors = ref({
  name: ''
})

// Options
const colorOptions = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#6B7280'  // Gray
]

const iconOptions = [
  { value: 'folder', label: 'Folder', component: Folder },
  { value: 'archive', label: 'Archive', component: Archive },
  { value: 'file-text', label: 'Documents', component: FileText },
  { value: 'briefcase', label: 'Business', component: Briefcase },
  { value: 'users', label: 'Team', component: Users },
  { value: 'star', label: 'Favorites', component: Star }
]

// Computed
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const parentFolder = computed(() => 
  props.parentFolderId ? store.findFolderById(props.parentFolderId) : null
)

const canSubmit = computed(() => 
  formData.value.name.trim().length > 0 && !errors.value.name
)

// Methods
const validateName = () => {
  const name = formData.value.name.trim()
  
  if (!name) {
    errors.value.name = 'Folder name is required'
    return false
  }
  
  if (name.length > 100) {
    errors.value.name = 'Folder name must be less than 100 characters'
    return false
  }
  
  // Check for duplicate names in same parent
  const siblings = props.parentFolderId 
    ? store.getFolderChildren(props.parentFolderId)
    : store.rootFolders
  
  if (siblings.some(f => f.name.toLowerCase() === name.toLowerCase())) {
    errors.value.name = 'A folder with this name already exists'
    return false
  }
  
  errors.value.name = ''
  return true
}

const handleSubmit = async () => {
  if (!validateName() || isCreating.value) return
  
  isCreating.value = true
  
  try {
    const input: FolderCreateInput = {
      name: formData.value.name.trim(),
      parentId: props.parentFolderId,
      description: formData.value.description || undefined,
      color: formData.value.color,
      icon: formData.value.icon
    }
    
    const folder = await store.createFolder(input)
    emit('create', folder)
    isOpen.value = false
    resetForm()
  } catch (error) {
    console.error('Failed to create folder:', error)
    errors.value.name = 'Failed to create folder. Please try again.'
  } finally {
    isCreating.value = false
  }
}

const handleCancel = () => {
  isOpen.value = false
  resetForm()
}

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    color: undefined,
    icon: 'folder',
    inheritsPermissions: true
  }
  errors.value.name = ''
}

// Watch for dialog open to reset form
watch(isOpen, (open) => {
  if (open) {
    resetForm()
    // Set default to inherit permissions if has parent
    formData.value.inheritsPermissions = !!props.parentFolderId
  }
})
</script>

<style scoped>
.color-option {
  @apply w-8 h-8 rounded-md border-2 border-transparent;
  @apply hover:scale-110 transition-transform;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring;
  @apply flex items-center justify-center;
}

.color-option.selected {
  @apply border-foreground;
}
</style>