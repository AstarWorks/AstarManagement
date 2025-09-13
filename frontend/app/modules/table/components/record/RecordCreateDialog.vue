<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-3xl max-h-[90vh]">
      <DialogHeader>
        <DialogTitle>{{ $t('modules.table.record.create.title') }}</DialogTitle>
        <DialogDescription>
          {{ $t('modules.table.record.create.description') }}
        </DialogDescription>
      </DialogHeader>
      
      <ScrollArea class="max-h-[60vh] px-1">
        <form class="space-y-4 py-4" @submit.prevent="onSubmit">
          <!-- Display properties in order -->
          <div v-for="key in orderedPropertyKeys" :key="key" class="space-y-2">
            <PropertyInput
              v-if="properties[key]"
              v-model="formData.data[key]"
              :property="properties[key]"
              :property-key="key"
            />
            <!-- Display validation errors -->
            <p v-if="errors[`data.${key}`]" class="text-sm text-destructive">
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
          <Icon v-if="hasDraft" name="lucide:save" class="h-4 w-4" />
          <span v-if="hasDraft">{{ $t('modules.table.record.draftSaved') }}</span>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" :disabled="loading" @click="handleCancel">
            {{ $t('foundation.actions.basic.cancel') }}
          </Button>
          <Button :disabled="loading || !isValid" @click="onSubmit">
            <Icon v-if="loading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
            {{ $t('foundation.actions.basic.create') }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useVModel, useLocalStorage, useDebounceFn } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { z } from 'zod'
import { createRecordSchema } from '../../validators/record.schema'
import PropertyInput from '../property/PropertyInput.vue'
import type { RecordResponse, PropertyDefinitionDto, RecordCreateRequest } from '../../types'

const props = defineProps<{
  open: boolean
  tableId: string
  properties: Record<string, PropertyDefinitionDto>
  orderedProperties?: string[]
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

// Form data with draft support
const draft = useLocalStorage<Record<string, unknown>>(
  `record-draft-${props.tableId}`,
  {}
)

// Initialize form data
const formData = ref<RecordCreateRequest>({
  tableId: props.tableId,
  data: {}
})

// Ordered property keys
const orderedPropertyKeys = computed(() => {
  if (props.orderedProperties?.length) {
    return props.orderedProperties.filter(key => key in props.properties)
  }
  return Object.keys(props.properties).sort()
})

// Initialize form with draft or defaults
onMounted(() => {
  if (Object.keys(draft.value).length > 0) {
    formData.value.data = { ...draft.value }
  } else {
    // Set default values
    orderedPropertyKeys.value.forEach(key => {
      const property = props.properties[key]
      if (!property) return // Type guard
      
      const config = property.config || {}
      if (config.defaultValue !== undefined) {
        formData.value.data[key] = config.defaultValue
      } else if (property.type === 'checkbox') {
        formData.value.data[key] = false
      } else if (property.type === 'multi_select') {
        formData.value.data[key] = []
      }
    })
  }
})

// Validation
const errors = ref<Record<string, string>>({})
const isValid = ref(true)

const validateForm = () => {
  errors.value = {}
  isValid.value = true
  
  try {
    const schema = createRecordSchema(props.properties)
    schema.parse(formData.value)
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
}

// Auto-save draft with debounce
const hasDraft = ref(false)
const saveDraft = useDebounceFn(() => {
  draft.value = formData.value.data
  hasDraft.value = true
}, 1000)

// Watch form changes
watch(() => formData.value.data, () => {
  validateForm()
  saveDraft()
}, { deep: true })

// Submit handler
const onSubmit = async () => {
  if (!validateForm()) {
    toast.error(t('foundation.messages.error.validation'))
    return
  }
  
  loading.value = true
  
  try {
    const newRecord = await table.createRecord(formData.value)
    
    // Clear draft on success
    draft.value = {}
    hasDraft.value = false
    
    emit('success', newRecord)
    toast.success(t('modules.table.record.messages.created'))
    isOpen.value = false
    
    // Reset form
    formData.value.data = {}
  } catch (error) {
    console.error('Failed to create record:', error)
    toast.error(t('modules.table.record.messages.createError'))
  } finally {
    loading.value = false
  }
}

// Cancel handler
const handleCancel = () => {
  if (hasDraft.value) {
    // Optionally show confirmation dialog
    isOpen.value = false
  } else {
    isOpen.value = false
  }
}
</script>