<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">{{ $t('modules.table.property.title') }}</h3>
        <p class="text-sm text-muted-foreground">
          {{ $t('modules.table.property.description') }}
        </p>
      </div>
      <Button @click="openCreateDialog">
        <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
        {{ $t('modules.table.property.actions.add') }}
      </Button>
    </div>

    <!-- Property List -->
    <div v-if="localOrderedProperties.length > 0" class="rounded-lg border max-w-5xl mx-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-12"/>
            <TableHead>{{ $t('modules.table.property.fields.key') }}</TableHead>
            <TableHead>{{ $t('modules.table.property.fields.displayName') }}</TableHead>
            <TableHead>{{ $t('foundation.common.fields.type') }}</TableHead>
            <TableHead class="text-center">{{ $t('foundation.form.fields.required') }}</TableHead>
            <TableHead class="text-right">{{ $t('foundation.common.labels.actions') }}</TableHead>
          </TableRow>
        </TableHeader>
        <draggable
          v-model="localOrderedProperties"
          item-key="key"
          handle=".drag-handle"
          animation="200"
          ghost-class="opacity-50"
          @end="handleDragEnd"
          tag="tbody"
        >
            <template #item="{ element: key }">
              <TableRow 
                :key="key"
                class="group"
              >
                <TableCell class="text-muted-foreground">
                  <Icon 
                    name="lucide:grip-vertical" 
                    class="drag-handle h-4 w-4 cursor-move opacity-50 group-hover:opacity-100"
                  />
                </TableCell>
                <TableCell class="font-mono text-sm">{{ key }}</TableCell>
                <TableCell>{{ properties[key]?.displayName || key }}</TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Icon :name="getTypeIcon(properties[key]?.type)" class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm">{{ getTypeLabel(properties[key]?.type) }}</span>
                  </div>
                </TableCell>
                <TableCell class="text-center">
                  <Badge v-if="properties[key]?.required" variant="destructive" class="text-xs">
                    {{ $t('foundation.form.fields.required') }}
                  </Badge>
                  <Badge v-else variant="secondary" class="text-xs">
                    {{ $t('foundation.form.fields.optional') }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      @click="openEditDialog(key)"
                    >
                      <Icon name="lucide:edit" class="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" 
                      size="icon"
                      class="h-8 w-8"
                      @click="duplicateProperty(key)"
                    >
                      <Icon name="lucide:copy" class="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon" 
                      class="h-8 w-8 text-destructive hover:text-destructive-foreground"
                      @click="openDeleteDialog(key)"
                    >
                      <Icon name="lucide:trash" class="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </template>
        </draggable>
      </Table>
    </div>

    <!-- Empty State -->
    <div v-else class="rounded-lg border border-dashed p-8 text-center">
      <Icon name="lucide:columns" class="mx-auto h-12 w-12 text-muted-foreground/50" />
      <h3 class="mt-4 text-lg font-semibold">{{ $t('modules.table.property.empty.title') }}</h3>
      <p class="mt-2 text-sm text-muted-foreground">
        {{ $t('modules.table.property.empty.description') }}
      </p>
      <Button class="mt-4" @click="openCreateDialog">
        <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
        {{ $t('modules.table.property.actions.addFirst') }}
      </Button>
    </div>

    <!-- Dialogs -->
    <PropertyCreateDialog
      v-model:open="createDialogOpen"
      :table-id="tableId"
      :existing-keys="Object.keys(properties)"
      @success="handleCreateSuccess"
    />

    <PropertyEditDialog
      v-model:open="editDialogOpen"
      :table-id="tableId"
      :property-key="selectedPropertyKey"
      :property="selectedProperty || null"
      @success="handleEditSuccess"
    />

    <!-- Delete Confirmation -->
    <Dialog v-model:open="deleteDialogOpen">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>{{ $t('modules.table.property.delete.title') }}</DialogTitle>
          <DialogDescription>
            {{ $t('modules.table.property.delete.description', { 
              name: selectedProperty?.displayName || selectedPropertyKey 
            }) }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="deleteDialogOpen = false">
            {{ $t('foundation.actions.basic.cancel') }}
          </Button>
          <Button
            variant="destructive"
            @click="confirmDelete"
          >
            {{ $t('foundation.actions.basic.delete') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'
import draggable from 'vuedraggable'
import type { PropertyDefinitionDto } from '../../types'
import PropertyCreateDialog from './PropertyCreateDialog.vue'
import PropertyEditDialog from './PropertyEditDialog.vue'

const props = defineProps<{
  tableId: string
  properties: Record<string, PropertyDefinitionDto>
  orderedProperties: string[]
}>()

const emit = defineEmits<{
  'refresh': [],
  'reorder': [newOrder: string[]]
}>()

// Composables
const { t } = useI18n()
const table = useTable()

// Local state for dragging
const localOrderedProperties = ref<string[]>([...props.orderedProperties])
const isDragging = ref(false)

// Watch for external changes to orderedProperties
watch(() => props.orderedProperties, (newValue) => {
  localOrderedProperties.value = [...newValue]
})

// Dialog states
const createDialogOpen = ref(false)
const editDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const selectedPropertyKey = ref<string>('')
const selectedProperty = computed(() => 
  selectedPropertyKey.value ? props.properties[selectedPropertyKey.value] : undefined
)

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

// Actions
const openCreateDialog = () => {
  createDialogOpen.value = true
}

const openEditDialog = (key: string) => {
  selectedPropertyKey.value = key
  editDialogOpen.value = true
}

const openDeleteDialog = (key: string) => {
  selectedPropertyKey.value = key
  deleteDialogOpen.value = true
}

const duplicateProperty = async (key: string) => {
  const property = props.properties[key]
  if (!property) return

  try {
    // Create a new key with suffix
    let newKey = `${key}_copy`
    let counter = 1
    while (props.properties[newKey]) {
      newKey = `${key}_copy${counter}`
      counter++
    }

    await table.addProperty(props.tableId, {
      definition: {
        key: newKey,
        type: property.type,
        displayName: `${property.displayName} (Copy)`,
        required: property.required,
        config: property.config
      }
    })

    toast.success(t('modules.table.property.messages.duplicated'))
    emit('refresh')
  } catch (error) {
    console.error('Failed to duplicate property:', error)
    toast.error(t('modules.table.property.messages.duplicateError'))
  }
}

const confirmDelete = async () => {
  if (!selectedPropertyKey.value) return

  try {
    await table.removeProperty(props.tableId, selectedPropertyKey.value)
    toast.success(t('modules.table.property.messages.removed'))
    deleteDialogOpen.value = false
    emit('refresh')
  } catch (error) {
    console.error('Failed to delete property:', error)
    toast.error(t('modules.table.property.messages.removeError'))
  }
}

const handleCreateSuccess = () => {
  createDialogOpen.value = false
  emit('refresh')
}

const handleEditSuccess = () => {
  editDialogOpen.value = false
  emit('refresh')
}

// Drag and drop handling
const handleDragEnd = async () => {
  isDragging.value = false
  
  // Only emit if the order actually changed
  const orderChanged = localOrderedProperties.value.some(
    (key, index) => props.orderedProperties[index] !== key
  )
  
  if (orderChanged) {
    try {
      // Emit the new order to parent component
      emit('reorder', localOrderedProperties.value)
    } catch (error) {
      // On error, revert to original order
      console.error('Failed to reorder properties:', error)
      localOrderedProperties.value = [...props.orderedProperties]
      toast.error(t('modules.table.property.messages.reorderError'))
    }
  }
}
</script>