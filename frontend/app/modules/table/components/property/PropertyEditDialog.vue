<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-4xl">
      <DialogHeader>
        <DialogTitle>{{ $t('modules.table.property.edit.title') }}</DialogTitle>
        <DialogDescription>
          {{ $t('modules.table.property.edit.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- Key Display (Read-only) -->
        <div class="space-y-2">
          <Label>
            {{ $t('modules.table.property.fields.key') }}
          </Label>
          <div class="flex items-center space-x-2">
            <code class="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
              {{ propertyKey }}
            </code>
            <Button
              variant="ghost"
              size="icon"
              @click="copyKey"
            >
              <Icon name="lucide:copy" class="h-4 w-4" />
            </Button>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ $t('modules.table.property.hints.keyImmutable') }}
          </p>
        </div>

        <!-- Display Name Input -->
        <div class="space-y-2">
          <Label for="property-display-name">
            {{ $t('modules.table.property.fields.displayName') }}
            <span class="text-destructive">*</span>
          </Label>
          <Input
            id="property-display-name"
            v-model="formData.displayName"
            placeholder="顧客名"
            :class="{ 'border-destructive': errors.displayName }"
          />
          <p v-if="errors.displayName" class="text-xs text-destructive">
            {{ errors.displayName }}
          </p>
        </div>

        <!-- Type Display (Read-only) -->
        <div class="space-y-2">
          <Label>
            {{ $t('modules.table.property.fields.type') }}
          </Label>
          <div class="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
            <Icon :name="getTypeIcon(property?.type)" class="h-4 w-4 text-muted-foreground" />
            <span class="text-sm">{{ getTypeLabel(property?.type) }}</span>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ $t('modules.table.property.hints.typeImmutable') }}
          </p>
        </div>

        <!-- Required Checkbox -->
        <div class="flex items-center space-x-2">
          <Checkbox
            id="property-required"
            v-model:checked="formData.required"
          />
          <Label for="property-required" class="font-normal">
            {{ $t('modules.table.property.fields.requiredDescription') }}
          </Label>
        </div>

        <!-- Type-specific Configuration -->
        <div v-if="showAdvancedConfig" class="space-y-4 rounded-lg border p-4">
          <h4 class="text-sm font-semibold">{{ $t('modules.table.property.config.title') }}</h4>

          <!-- Default Value -->
          <div class="space-y-2">
            <Label for="property-default">
              {{ $t('modules.table.property.config.defaultValue') }}
            </Label>
            <PropertyInput
              v-model="formData.defaultValue"
              :property="{
                key: 'default',
                type: property?.type || 'text',
                displayName: '',
                config: ['select', 'multi_select'].includes(property?.type || '') ? { options: formData.config.options } : {}
              }"
              property-key="default"
            />
          </div>
          
          <!-- Description -->
          <div class="space-y-2">
            <Label for="property-description">
              {{ $t('modules.table.property.fields.description') }}
            </Label>
            <Textarea
              id="property-description"
              v-model="formData.description"
              placeholder="このプロパティの説明..."
              rows="3"
            />
          </div>

          <!-- Number/Currency specific -->
          <template v-if="['number', 'currency', 'percent'].includes(property?.type || '')">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="property-min">
                  {{ $t('modules.table.property.config.min') }}
                </Label>
                <Input
                  id="property-min"
                  v-model.number="formData.config.min"
                  type="number"
                  placeholder="0"
                />
              </div>
              <div class="space-y-2">
                <Label for="property-max">
                  {{ $t('modules.table.property.config.max') }}
                </Label>
                <Input
                  id="property-max"
                  v-model.number="formData.config.max"
                  type="number"
                  placeholder="100"
                />
              </div>
            </div>
          </template>

          <!-- Select/Multiselect Options -->
          <template v-if="['select', 'multi_select'].includes(property?.type || '')">
            <div class="space-y-2">
              <Label>{{ $t('modules.table.property.config.options') }}</Label>
              <!-- Scrollable options container -->
              <div class="max-h-64 overflow-y-auto space-y-2 border rounded p-2">
                <div
                  v-for="(option, index) in formData.config.options"
                  :key="index"
                  class="flex gap-2"
                >
                  <Input
                    v-model="option.value"
                    placeholder="値"
                    class="font-mono flex-1"
                  />
                  <Input
                    v-model="option.label"
                    placeholder="表示名"
                    class="flex-1"
                  />
                  <Input
                    v-model="option.color"
                    type="color"
                    placeholder="#FF5733"
                    class="w-16"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="removeOption(index)"
                  >
                    <Icon name="lucide:x" class="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                @click="addOption"
              >
                <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
                {{ $t('modules.table.property.config.addOption') }}
              </Button>
            </div>
          </template>

          <!-- Placeholder -->
          <div class="space-y-2">
            <Label for="property-placeholder">
              {{ $t('modules.table.property.config.placeholder') }}
            </Label>
            <Input
              id="property-placeholder"
              v-model="formData.config.placeholder"
              placeholder="入力例を表示..."
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          {{ $t('foundation.actions.basic.cancel') }}
        </Button>
        <Button :disabled="!isValid" @click="handleSubmit">
          {{ $t('foundation.actions.basic.save') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'
import PropertyInput from './PropertyInput.vue'
import type { PropertyDefinitionDto, PropertyUpdateRequest } from '../../types'

const props = defineProps<{
  open: boolean
  tableId: string
  propertyKey: string
  property: PropertyDefinitionDto | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'success': []
}>()

// Composables
const { t } = useI18n()
const table = useTable()

// Dialog state
const isOpen = useVModel(props, 'open', emit)

// Form data
const formData = ref({
  displayName: '',
  required: false,
  defaultValue: null as unknown,  // Moved to top level
  description: '',                // Added to top level  
  config: {
    min: undefined as number | undefined,
    max: undefined as number | undefined,
    options: [] as Array<{ value: string; label: string; color?: string }>,
    placeholder: ''
  }
})

// Validation
const errors = ref<Record<string, string>>({})

const isValid = computed(() => {
  return formData.value.displayName && 
         !Object.keys(errors.value).length
})

const showAdvancedConfig = computed(() => {
  // Show config for all types except basic text
  return props.property?.type !== 'text'
})

// Property type mapping
const propertyTypes = {
  text: { icon: 'lucide:type', label: 'テキスト' },
  textarea: { icon: 'lucide:align-left', label: 'テキストエリア' },
  number: { icon: 'lucide:hash', label: '数値' },
  currency: { icon: 'lucide:dollar-sign', label: '金額' },
  percent: { icon: 'lucide:percent', label: 'パーセント' },
  date: { icon: 'lucide:calendar', label: '日付' },
  datetime: { icon: 'lucide:calendar-clock', label: '日時' },
  time: { icon: 'lucide:clock', label: '時刻' },
  checkbox: { icon: 'lucide:check-square', label: 'チェックボックス' },
  select: { icon: 'lucide:chevron-down-circle', label: '選択' },
  multiselect: { icon: 'lucide:list-checks', label: '複数選択' },
  email: { icon: 'lucide:mail', label: 'メール' },
  url: { icon: 'lucide:link', label: 'URL' },
  json: { icon: 'lucide:code', label: 'JSON' },
  relation: { icon: 'lucide:link-2', label: 'リレーション' },
  file: { icon: 'lucide:paperclip', label: 'ファイル' },
  richtext: { icon: 'lucide:file-text', label: 'リッチテキスト' }
}

const getTypeIcon = (type?: string) => {
  return propertyTypes[type as keyof typeof propertyTypes]?.icon || 'lucide:help-circle'
}

const getTypeLabel = (type?: string) => {
  return propertyTypes[type as keyof typeof propertyTypes]?.label || type || '不明'
}

// Initialize form when property changes
watch(() => props.property, (property) => {
  if (property) {
    formData.value = {
      displayName: property.displayName,
      required: property.required || false,
      defaultValue: property.defaultValue || null,  // From top level
      description: property.description || '',      // From top level
      config: {
        min: property.config?.min as number | undefined,
        max: property.config?.max as number | undefined,
        options: (property.config?.options || []) as Array<{ value: string; label: string; color?: string }>,
        placeholder: (property.config?.placeholder || '') as string
      }
    }
  }
}, { immediate: true })

// Validate display name
watch(() => formData.value.displayName, (name) => {
  if (!name) {
    errors.value.displayName = t('modules.table.property.errors.displayNameRequired')
  } else {
    delete errors.value.displayName
  }
})

// Options management for select/multiselect
const addOption = () => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4']
  const colorIndex = formData.value.config.options.length % colors.length
  formData.value.config.options.push({
    value: `option${formData.value.config.options.length + 1}`,
    label: `オプション${formData.value.config.options.length + 1}`,
    color: colors[colorIndex]
  })
}

const removeOption = (index: number) => {
  formData.value.config.options.splice(index, 1)
}

// Actions
const copyKey = async () => {
  try {
    await navigator.clipboard.writeText(props.propertyKey)
    toast.success(t('foundation.messages.success.copySuccess'))
  } catch {
    toast.error(t('foundation.messages.error.copyError'))
  }
}

const handleCancel = () => {
  isOpen.value = false
  resetForm()
}

const handleSubmit = async () => {
  if (!isValid.value || !props.property) return

  try {
    // Clean up config based on type (type-specific settings only)
    const config: Record<string, unknown> = {}
    
    if (['number', 'currency', 'percent'].includes(props.property.type)) {
      if (formData.value.config.min !== undefined) config.min = formData.value.config.min
      if (formData.value.config.max !== undefined) config.max = formData.value.config.max
    }
    
    if (['select', 'multi_select'].includes(props.property.type)) {
      config.options = formData.value.config.options.filter(o => o.value && o.label)
    }
    
    if (formData.value.config.placeholder) {
      config.placeholder = formData.value.config.placeholder
    }

    const request: PropertyUpdateRequest = {
      displayName: formData.value.displayName,
      required: formData.value.required,
      defaultValue: formData.value.defaultValue,  // Top level
      description: formData.value.description || undefined,  // Top level
      config: Object.keys(config).length > 0 ? config : undefined
    }

    await table.updateProperty(props.tableId, props.propertyKey, request)
    toast.success(t('modules.table.property.messages.updated'))
    emit('success')
    isOpen.value = false
    resetForm()
  } catch (error) {
    console.error('Failed to update property:', error)
    toast.error(t('modules.table.property.messages.updateError'))
  }
}

const resetForm = () => {
  if (props.property) {
    formData.value = {
      displayName: props.property.displayName,
      required: props.property.required || false,
      defaultValue: props.property.defaultValue || null,  // From top level
      description: props.property.description || '',      // From top level
      config: {
        min: props.property.config?.min as number | undefined,
        max: props.property.config?.max as number | undefined,
        options: (props.property.config?.options || []) as Array<{ value: string; label: string; color?: string }>,
        placeholder: (props.property.config?.placeholder || '') as string
      }
    }
  }
  errors.value = {}
}
</script>