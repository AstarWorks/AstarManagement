<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-4xl">
      <DialogHeader>
        <DialogTitle>{{ $t('modules.table.property.create.title') }}</DialogTitle>
        <DialogDescription>
          {{ $t('modules.table.property.create.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- Key Input -->
        <div class="space-y-2">
          <Label for="property-key">
            {{ $t('modules.table.property.fields.key') }}
            <span class="text-destructive">*</span>
          </Label>
          <Input
            id="property-key"
            v-model="formData.key"
            placeholder="customer_name"
            pattern="^[a-z][a-z0-9_]*$"
            class="font-mono"
            :class="{ 'border-destructive': errors.key }"
          />
          <p class="text-xs text-muted-foreground">
            {{ $t('modules.table.property.hints.key') }}
          </p>
          <p v-if="errors.key" class="text-xs text-destructive">
            {{ errors.key }}
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

        <!-- Type Selection -->
        <div class="space-y-2">
          <Label>
            {{ $t('modules.table.property.fields.type') }}
            <span class="text-destructive">*</span>
          </Label>
          <PropertyTypeSelector
            v-model="formData.type"
            @change="onTypeChange"
          />
          <p v-if="errors.type" class="text-xs text-destructive">
            {{ errors.type }}
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
                type: formData.type,
                displayName: '',
                config: ['select', 'multi_select'].includes(formData.type) ? { options: formData.config.options } : {}
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
          <template v-if="['number', 'currency', 'percent'].includes(formData.type)">
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
          <template v-if="['select', 'multi_select'].includes(formData.type)">
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

          <!-- Relation Configuration -->
          <template v-if="formData.type === 'relation'">
            <div class="space-y-4">
              <!-- Target Table Selection -->
              <div class="space-y-2">
                <Label for="property-target-table">
                  関連付けるテーブル
                </Label>
                <Select v-model="formData.config.targetTableId">
                  <SelectTrigger id="property-target-table">
                    <SelectValue placeholder="テーブルを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      v-for="targetTable in availableTables" 
                      :key="targetTable.id"
                      :value="targetTable.id!"
                    >
                      {{ targetTable.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p class="text-xs text-muted-foreground">
                  このフィールドから参照する別のテーブルを選択
                </p>
              </div>

              <!-- Display Field -->
              <div class="space-y-2">
                <Label for="property-display-field">
                  表示するフィールド名
                </Label>
                <Input
                  id="property-display-field"
                  v-model="formData.config.displayField"
                  placeholder="name"
                />
                <p class="text-xs text-muted-foreground">
                  関連レコードを表示する際に使用するフィールド（例: name, title）
                </p>
              </div>
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
          {{ $t('foundation.actions.basic.create') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'
import PropertyTypeSelector from './PropertyTypeSelector.vue'
import PropertyInput from './PropertyInput.vue'
import type { PropertyAddRequest } from '../../types'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '~/foundation/components/ui/select'

const props = defineProps<{
  open: boolean
  tableId: string
  existingKeys: string[]
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
  key: '',
  displayName: '',
  type: 'text' as 'text' | 'long_text' | 'number' | 'checkbox' | 'date' | 'datetime' | 'select' | 'multi_select' | 'email' | 'url' | 'file' | 'relation',
  required: false,
  defaultValue: null as unknown,  // Moved to top level
  description: '',                // Added to top level
  config: {
    min: undefined as number | undefined,
    max: undefined as number | undefined,
    options: [] as Array<{ value: string; label: string; color?: string }>,
    placeholder: '',
    targetTableId: undefined as string | undefined,
    relationshipType: 'one-to-many' as string,
    displayField: 'name' as string
  }
})

// Validation
const errors = ref<Record<string, string>>({})

const isValid = computed(() => {
  return formData.value.key && 
         formData.value.displayName && 
         formData.value.type &&
         !Object.keys(errors.value).length
})

const showAdvancedConfig = computed(() => {
  // Show config for all types except basic text
  return formData.value.type !== 'text'
})

// Validate key format and uniqueness
watch(() => formData.value.key, (key) => {
  if (!key) {
    errors.value.key = t('modules.table.property.errors.keyRequired')
  } else if (!/^[a-z][a-z0-9_]*$/.test(key)) {
    errors.value.key = t('modules.table.property.errors.keyInvalid')
  } else if (props.existingKeys.includes(key)) {
    errors.value.key = t('modules.table.property.errors.keyExists')
  } else {
    delete errors.value.key
  }
})

// Validate display name
watch(() => formData.value.displayName, (name) => {
  if (!name) {
    errors.value.displayName = t('modules.table.property.errors.displayNameRequired')
  } else {
    delete errors.value.displayName
  }
})

// Type change handler
const onTypeChange = (type: string) => {
  // Reset config and defaultValue when type changes
  formData.value.defaultValue = null  // Reset defaultValue at top level
  formData.value.config = {
    min: undefined,
    max: undefined,
    options: type === 'select' || type === 'multi_select' 
      ? [{ value: 'option1', label: 'オプション1', color: '#3B82F6' }] 
      : [],
    placeholder: '',
    targetTableId: undefined,
    relationshipType: 'one-to-many',
    displayField: 'name'
  }
}

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
const handleCancel = () => {
  isOpen.value = false
  resetForm()
}

const handleSubmit = async () => {
  if (!isValid.value) return

  try {
    // Clean up config based on type (type-specific settings only)
    const config: Record<string, unknown> = {}
    
    if (['number', 'currency', 'percent'].includes(formData.value.type)) {
      if (formData.value.config.min !== undefined) config.min = formData.value.config.min
      if (formData.value.config.max !== undefined) config.max = formData.value.config.max
    }
    
    if (['select', 'multi_select'].includes(formData.value.type)) {
      config.options = formData.value.config.options.filter(o => o.value && o.label)
    }
    
    if (formData.value.config.placeholder) {
      config.placeholder = formData.value.config.placeholder
    }

    const request: PropertyAddRequest = {
      definition: {
        key: formData.value.key,
        type: formData.value.type,
        displayName: formData.value.displayName,
        required: formData.value.required,
        defaultValue: formData.value.defaultValue,  // Top level
        description: formData.value.description || undefined,  // Top level
        config: Object.keys(config).length > 0 ? config : undefined
      }
    }

    await table.addProperty(props.tableId, request)
    toast.success(t('modules.table.property.messages.added'))
    emit('success')
    isOpen.value = false
    resetForm()
  } catch (error) {
    console.error('Failed to add property:', error)
    toast.error(t('modules.table.property.messages.addError'))
  }
}

const resetForm = () => {
  formData.value = {
    key: '',
    displayName: '',
    type: 'text' as 'text' | 'long_text' | 'number' | 'checkbox' | 'date' | 'datetime' | 'select' | 'multi_select' | 'email' | 'url' | 'file' | 'relation',
    required: false,
    defaultValue: null,  // Top level
    description: '',     // Top level
    config: {
      min: undefined,
      max: undefined,
      options: [],
      placeholder: '',
      targetTableId: undefined,
      relationshipType: 'one-to-many',
      displayField: 'name'
    }
  }
  errors.value = {}
}

// Available tables for relation
const availableTables = ref<Array<{ id: string; name: string }>>([])

// Load available tables
const loadAvailableTables = async () => {
  try {
    const workspace = useCurrentWorkspace()
    const workspaceId = workspace.currentWorkspace.value?.id
    if (!workspaceId) return
    
    const response = await table.listTables(workspaceId)
    if (response.tables) {
      availableTables.value = response.tables
        .filter(t => t.id !== props.tableId) // 自分自身は除外
        .map(t => ({ id: t.id || '', name: t.name || '' }))
    }
  } catch (error) {
    console.error('Failed to load tables:', error)
  }
}

// Load tables when dialog opens
watch(isOpen, (open) => {
  if (open) {
    loadAvailableTables()
  }
})
</script>