<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-3xl max-h-[90vh]">
      <DialogHeader>
        <DialogTitle>{{ isViewMode ? $t('modules.table.record.view.title') : $t('modules.table.record.edit.title') }}</DialogTitle>
        <DialogDescription>
          {{ isViewMode ? '' : $t('modules.table.record.edit.description') }}
        </DialogDescription>
      </DialogHeader>
      
      <ScrollArea class="max-h-[60vh] px-1">
        <form class="space-y-4 py-4" @submit.prevent="onSubmit">
          <!-- Display properties in order -->
          <div v-for="key in orderedPropertyKeys" :key="key" class="space-y-2">
            <PropertyInput
              v-if="properties[key]"
              v-model="formData[key]"
              :property="properties[key]"
              :property-key="key"
              :readonly="isViewMode"
            />
            <!-- Display validation errors (only in edit mode) -->
            <p v-if="isEditMode && errors[`data.${key}`]" class="text-sm text-destructive">
              {{ errors[`data.${key}`] }}
            </p>
          </div>
          
          <!-- Empty state -->
          <div v-if="orderedPropertyKeys.length === 0" class="text-center py-8 text-muted-foreground">
            {{ $t('modules.table.record.empty.title') }}
          </div>
        </form>
      </ScrollArea>
      
      <DialogFooter class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon v-if="isEditMode && hasChanges" name="lucide:edit" class="h-4 w-4" />
          <span v-if="isEditMode && hasChanges">{{ $t('modules.table.record.unsavedChanges') }}</span>
        </div>
        <div class="flex gap-2">
          <Button v-if="isViewMode" variant="outline" @click="switchToEdit">
            {{ $t('foundation.actions.basic.edit') }}
          </Button>
          <Button variant="outline" :disabled="loading" @click="handleCancel">
            {{ isViewMode ? $t('foundation.actions.basic.close') : $t('foundation.actions.basic.cancel') }}
          </Button>
          <Button v-if="isEditMode" :disabled="loading || !isValid || !hasChanges" @click="onSubmit">
            <Icon v-if="loading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
            {{ $t('foundation.actions.basic.save') }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useVModel, useDebounceFn } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { z } from 'zod'
import { updateRecordSchema } from '../../validators/record.schema'
import PropertyInput from '../property/PropertyInput.vue'
import type { RecordResponse, PropertyDefinitionDto, RecordUpdateRequest } from '../../types'

const props = defineProps<{
  open: boolean
  record: RecordResponse | null
  properties: Record<string, PropertyDefinitionDto>
  orderedProperties?: string[]
  mode?: 'edit' | 'view'
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'success': [record: RecordResponse]
}>()

// Composables
const { t } = useI18n()
const table = useTable()

// Dialog state
const isOpen = useVModel(props, 'open', emit)
const loading = ref(false)

// Mode handling
const currentMode = computed(() => props.mode || 'edit')
const isViewMode = computed(() => currentMode.value === 'view')
const isEditMode = computed(() => currentMode.value === 'edit')

// Form data - only track the current state
const formData = ref<Record<string, unknown>>({})
const originalData = ref<Record<string, unknown>>({})

// Ordered property keys
const orderedPropertyKeys = computed(() => {
  if (props.orderedProperties?.length) {
    return props.orderedProperties.filter(key => key in props.properties)
  }
  return Object.keys(props.properties).sort()
})

// Initialize form when record changes
watch(() => props.record, (record) => {
  if (record?.data) {
    // Clone the record data
    formData.value = { ...record.data }
    originalData.value = { ...record.data }
    
    // Ensure all properties have values
    orderedPropertyKeys.value.forEach(key => {
      if (!(key in formData.value)) {
        const property = props.properties[key]
        if (!property) return // Type guard
        
        if (property.type === 'checkbox') {
          formData.value[key] = false
        } else if (property.type === 'multi_select') {
          formData.value[key] = []
        } else {
          formData.value[key] = null
        }
      }
    })
  } else {
    formData.value = {}
    originalData.value = {}
  }
}, { immediate: true })

// Track changes
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

// Get only changed fields for partial update
const getChangedFields = () => {
  const changes: Record<string, unknown> = {}
  
  Object.keys(formData.value).forEach(key => {
    if (formData.value[key] !== originalData.value[key]) {
      changes[key] = formData.value[key]
    }
  })
  
  // Check for removed fields
  Object.keys(originalData.value).forEach(key => {
    if (!(key in formData.value)) {
      changes[key] = null
    }
  })
  
  return changes
}

// Validation
const errors = ref<Record<string, string>>({})
const isValid = ref(true)

const validateForm = useDebounceFn(() => {
  errors.value = {}
  isValid.value = true
  
  try {
    const schema = updateRecordSchema(props.properties)
    schema.parse({ data: formData.value })
    return true
  } catch (error) {
    isValid.value = false
    if (error instanceof z.ZodError) {
      error.issues.forEach(issue => {
        const path = issue.path.join('.')
        errors.value[path] = issue.message
      })
    }
    return false
  }
}, 300)

// Watch form changes for validation
watch(formData, () => {
  validateForm()
}, { deep: true })

// Submit handler
const onSubmit = async () => {
  if (!hasChanges.value) {
    toast.info(t('modules.table.record.noChanges'))
    return
  }
  
  if (!validateForm()) {
    toast.error(t('foundation.messages.error.validation'))
    return
  }
  
  if (!props.record?.id) {
    toast.error(t('modules.table.record.messages.invalidRecord'))
    return
  }
  
  loading.value = true
  
  try {
    // Only send changed fields for partial update
    const changes = getChangedFields()
    const updateRequest: RecordUpdateRequest = {
      data: changes
    }
    
    const updatedRecord = await table.updateRecord(props.record.id, updateRequest)
    
    emit('success', updatedRecord)
    toast.success(t('modules.table.record.messages.updated'))
    isOpen.value = false
    
    // Update original data to reflect saved state
    originalData.value = { ...formData.value }
  } catch (error) {
    console.error('Failed to update record:', error)
    toast.error(t('modules.table.record.messages.updateError'))
  } finally {
    loading.value = false
  }
}

// Cancel handler
const handleCancel = () => {
  if (isEditMode.value && hasChanges.value) {
    // Optionally show confirmation dialog
    // For now, just revert and close
    formData.value = { ...originalData.value }
  }
  isOpen.value = false
}

// Switch from view to edit mode
const switchToEdit = () => {
  // For now, we'll just close the dialog and let the parent handle opening in edit mode
  // In the future, we could emit an event or change the mode internally
  emit('update:open', false)
  // Parent should re-open with mode='edit'
}
</script>