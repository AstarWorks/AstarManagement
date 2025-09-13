<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {{ isEdit ? $t('modules.table.dialog.editTitle') : $t('modules.table.dialog.createTitle') }}
        </DialogTitle>
        <DialogDescription>
          {{ $t('modules.table.dialog.description') }}
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit">
        <!-- Basic Info -->
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="name">{{ $t('modules.table.fields.name') }}</Label>
            <Input
              id="name"
              v-model="formData.name"
              :placeholder="$t('modules.table.placeholders.name')"
              :class="{ 'border-destructive': errors.name }"
            />
            <p v-if="errors.name" class="text-sm text-destructive">
              {{ errors.name }}
            </p>
          </div>
          
          <div class="space-y-2">
            <Label for="description">{{ $t('modules.table.fields.description') }}</Label>
            <Textarea
              id="description"
              v-model="formData.description"
              :placeholder="$t('modules.table.placeholders.description')"
              rows="3"
              :class="{ 'border-destructive': errors.description }"
            />
            <p v-if="errors.description" class="text-sm text-destructive">
              {{ errors.description }}
            </p>
          </div>
          
          <!-- Initial Properties -->
          <div v-if="!isEdit" class="space-y-2">
            <Label>{{ $t('modules.table.fields.initialProperties') }}</Label>
            <p class="text-sm text-muted-foreground">
              {{ $t('modules.table.dialog.propertiesHint') }}
            </p>
            
            <div class="space-y-2">
              <div 
                v-for="(prop, index) in properties"
                :key="prop.id"
                class="flex gap-2"
              >
                <Input
                  v-model="prop.key"
                  :placeholder="$t('modules.table.placeholders.propertyKey')"
                  class="flex-1"
                  @blur="validatePropertyKey(index)"
                />
                <Select v-model="prop.type">
                  <SelectTrigger class="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="long_text">Long Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="datetime">DateTime</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  v-model="prop.displayName"
                  :placeholder="$t('modules.table.placeholders.propertyName')"
                  class="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  @click="removeProperty(index)"
                >
                  <Icon name="lucide:x" class="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                type="button"
                variant="outline"
                class="w-full"
                @click="addProperty"
              >
                <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
                {{ $t('modules.table.actions.addProperty') }}
              </Button>
            </div>
            
            <p v-if="errors.properties" class="text-sm text-destructive">
              {{ errors.properties }}
            </p>
          </div>
        </div>
        
        <DialogFooter class="mt-6">
          <Button type="button" variant="outline" @click="closeDialog">
            {{ $t('foundation.actions.basic.cancel') }}
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            <LoadingSpinner v-if="isSubmitting" class="mr-2 h-4 w-4" />
            {{ isEdit ? $t('foundation.actions.basic.save') : $t('foundation.actions.basic.create') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { nanoid } from 'nanoid'
import { toast } from 'vue-sonner'
import { createTableSchema, updateTableSchema } from '../validators/table.schema'
import type { TableResponse, TableCreateRequest, TableUpdateRequest } from '../types'
import LoadingSpinner from '@foundation/components/common/states/LoadingSpinner.vue'

const props = defineProps<{
  open: boolean
  table?: TableResponse | null
  workspaceId: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'success': [table: TableResponse]
}>()

// Composables
const { t } = useI18n()
const tableComposable = useTable()

// State
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const isEdit = computed(() => Boolean(props.table))
const isSubmitting = ref(false)

// Form data
const formData = reactive({
  name: '',
  description: '',
})

// Properties for new tables
interface PropertyDraft {
  id: string
  key: string
  type: 'text' | 'long_text' | 'number' | 'checkbox' | 'date' | 'datetime' | 'select' | 'multi_select' | 'email' | 'url' | 'file'
  displayName: string
  required: boolean
}

const properties = ref<PropertyDraft[]>([])

// Validation errors
const errors = reactive({
  name: '',
  description: '',
  properties: ''
})

// Methods
const resetForm = () => {
  formData.name = ''
  formData.description = ''
  properties.value = []
  Object.keys(errors).forEach(key => {
    const errorKey = key as keyof typeof errors
    errors[errorKey] = ''
  })
}

// Watch for table prop changes
watch(() => props.table, (newTable) => {
  if (newTable) {
    formData.name = newTable.name || ''
    formData.description = newTable.description || ''
  } else {
    resetForm()
  }
}, { immediate: true })

const addProperty = () => {
  properties.value.push({
    id: nanoid(),
    key: '',
    type: 'text' as const,
    displayName: '',
    required: false
  })
}

const removeProperty = (index: number) => {
  properties.value.splice(index, 1)
}

const validatePropertyKey = (index: number) => {
  const prop = properties.value[index]
  if (prop && prop.key && !/^[a-z][a-z0-9_]*$/.test(prop.key)) {
    toast.error('プロパティキーは英小文字で始まり、英数字とアンダースコアのみ使用可能です')
    prop.key = prop.key.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  }
}

const validateForm = () => {
  // Reset errors
  Object.keys(errors).forEach(key => {
    const errorKey = key as keyof typeof errors
    errors[errorKey] = ''
  })
  
  // Validate with Zod
  try {
    if (isEdit.value) {
      updateTableSchema.parse({
        name: formData.name || undefined,
        description: formData.description || undefined
      })
    } else {
      const validProperties = properties.value
        .filter(p => p.key && p.displayName)
        .map(p => ({
          key: p.key,
          type: p.type,
          displayName: p.displayName,
          required: p.required,
          config: {}
        }))
      
      createTableSchema.parse({
        workspaceId: props.workspaceId,
        name: formData.name,
        description: formData.description || undefined,
        properties: validProperties
      })
    }
    return true
  } catch (error) {
    if (error && typeof error === 'object' && 'errors' in error) {
      const zodError = error as { errors: Array<{ path: string[]; message: string }> }
      zodError.errors.forEach((err) => {
        const path = err.path[0]
        if (path && path in errors) {
          const errorKey = path as keyof typeof errors
          errors[errorKey] = err.message
        }
      })
    }
    return false
  }
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  
  try {
    let result: TableResponse
    
    if (isEdit.value && props.table) {
      // Update existing table
      const data: TableUpdateRequest = {
        name: formData.name,
        description: formData.description || undefined
      }
      
      result = await tableComposable.updateTable(props.table.id!, data)
      toast.success(t('modules.table.messages.updated'))
    } else {
      // Create new table
      const validProperties = properties.value
        .filter(p => p.key && p.displayName)
        .map(p => ({
          key: p.key,
          type: p.type,
          displayName: p.displayName,
          required: p.required,
          config: {}
        }))
      
      const data: TableCreateRequest = {
        workspaceId: props.workspaceId,
        name: formData.name,
        description: formData.description || undefined,
        properties: validProperties,
        templateName: undefined
      }
      
      result = await tableComposable.createTable(data)
      toast.success(t('modules.table.messages.created'))
    }
    
    emit('success', result)
    closeDialog()
  } catch (error) {
    console.error('Failed to save table:', error)
    const errorMessage = error instanceof Error ? error.message : t('foundation.messages.error.default')
    toast.error(errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

const closeDialog = () => {
  isOpen.value = false
  setTimeout(resetForm, 300) // Reset after animation
}
</script>