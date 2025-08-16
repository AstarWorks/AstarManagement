<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Icon name="lucide:alert-triangle" class="w-5 h-5 text-warning" />
          {{ t('expense.conflicts.title') }}
        </DialogTitle>
        <DialogDescription>
          {{ t('expense.conflicts.description') }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="conflict" class="space-y-6">
        <!-- Conflict Information -->
        <Alert>
          <Icon name="lucide:info" class="h-4 w-4" />
          <AlertDescription>
            {{ t('expense.conflicts.detectedMessage', {
              type: conflict.type === 'version_mismatch' 
                ? t('expense.conflicts.types.versionMismatch') 
                : t('expense.conflicts.types.concurrentEdit'),
              localVersion: conflict.localVersion,
              serverVersion: conflict.serverVersion
            }) }}
          </AlertDescription>
        </Alert>

        <!-- Resolution Options -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">{{ t('expense.conflicts.resolutionOptions') }}</h3>
          
          <div class="grid gap-4">
            <!-- Keep Local Changes -->
            <Card 
              class="cursor-pointer transition-colors hover:bg-accent/50"
              :class="{ 'ring-2 ring-primary': selectedResolution === 'keep_local' }"
              @click="selectedResolution = 'keep_local'"
            >
              <CardContent class="p-4">
                <div class="flex items-start gap-3">
                  <div class="flex items-center gap-2 flex-1">
                    <Input 
                      type="radio" 
                      :checked="selectedResolution === 'keep_local'"
                      class="w-4 h-4"
                      @change="selectedResolution = 'keep_local'"
                    />
                    <div>
                      <h4 class="font-medium">{{ t('expense.conflicts.keepLocal.title') }}</h4>
                      <p class="text-sm text-muted-foreground">
                        {{ t('expense.conflicts.keepLocal.description') }}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{{ t('expense.conflicts.recommended') }}</Badge>
                </div>
              </CardContent>
            </Card>

            <!-- Use Server Version -->
            <Card 
              class="cursor-pointer transition-colors hover:bg-accent/50"
              :class="{ 'ring-2 ring-primary': selectedResolution === 'use_server' }"
              @click="selectedResolution = 'use_server'"
            >
              <CardContent class="p-4">
                <div class="flex items-start gap-3">
                  <Input 
                    type="radio" 
                    :checked="selectedResolution === 'use_server'"
                    class="w-4 h-4"
                    @change="selectedResolution = 'use_server'"
                  />
                  <div>
                    <h4 class="font-medium">{{ t('expense.conflicts.useServer.title') }}</h4>
                    <p class="text-sm text-muted-foreground">
                      {{ t('expense.conflicts.useServer.description') }}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Manual Merge -->
            <Card 
              class="cursor-pointer transition-colors hover:bg-accent/50"
              :class="{ 'ring-2 ring-primary': selectedResolution === 'merge' }"
              @click="selectedResolution = 'merge'"
            >
              <CardContent class="p-4">
                <div class="flex items-start gap-3">
                  <Input 
                    type="radio" 
                    :checked="selectedResolution === 'merge'"
                    class="w-4 h-4"
                    @change="selectedResolution = 'merge'"
                  />
                  <div>
                    <h4 class="font-medium">{{ t('expense.conflicts.merge.title') }}</h4>
                    <p class="text-sm text-muted-foreground">
                      {{ t('expense.conflicts.merge.description') }}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Field Comparison (for merge option) -->
        <div v-if="selectedResolution === 'merge' && conflict.conflictingFields.length > 0" class="space-y-4">
          <h3 class="text-lg font-semibold">{{ t('expense.conflicts.fieldComparison') }}</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle class="text-sm">{{ t('expense.conflicts.yourVersion') }}</CardTitle>
              </CardHeader>
              <CardContent class="space-y-3">
                <div 
                  v-for="field in conflict.conflictingFields" 
                  :key="`local-${field}`"
                  class="space-y-1"
                >
                  <Label class="text-xs font-medium">{{ getFieldLabel(field) }}</Label>
                  <div class="p-2 bg-muted rounded text-sm">
                    {{ formatFieldValue(field, conflict.localData[field]) }}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle class="text-sm">{{ t('expense.conflicts.serverVersion') }}</CardTitle>
              </CardHeader>
              <CardContent class="space-y-3">
                <div 
                  v-for="field in conflict.conflictingFields" 
                  :key="`server-${field}`"
                  class="space-y-1"
                >
                  <Label class="text-xs font-medium">{{ getFieldLabel(field) }}</Label>
                  <div class="p-2 bg-muted rounded text-sm">
                    {{ formatFieldValue(field, conflict.serverData[field]) }}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Merge Selection if merge option is selected -->
          <div v-if="selectedResolution === 'merge'" class="space-y-3">
            <h4 class="font-medium">{{ t('expense.conflicts.selectValues') }}</h4>
            <div class="space-y-2">
              <div 
                v-for="field in conflict.conflictingFields" 
                :key="`merge-${field}`"
                class="flex items-center justify-between p-3 border rounded"
              >
                <Label class="font-medium">{{ getFieldLabel(field) }}</Label>
                <div class="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    :class="{ 'bg-primary text-primary-foreground': mergeChoices[field] === 'local' }"
                    @click="mergeChoices[field] = 'local'"
                  >
                    {{ t('expense.conflicts.useYours') }}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    :class="{ 'bg-primary text-primary-foreground': mergeChoices[field] === 'server' }"
                    @click="mergeChoices[field] = 'server'"
                  >
                    {{ t('expense.conflicts.useTheirs') }}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="flex flex-col sm:flex-row gap-2 sm:gap-0">
        <Button 
          type="button" 
          variant="outline" 
          :disabled="isResolving"
          @click="handleCancel"
        >
          {{ t('common.cancel') }}
        </Button>
        <Button 
          type="button" 
          :disabled="!selectedResolution || isResolving"
          @click="handleResolve"
        >
          <Icon v-if="isResolving" name="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
          {{ t('expense.conflicts.resolve') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { IConflictResolution } from '~/foundation/composables/form/useFormSubmissionOptimistic'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/foundation/components/ui/dialog/index'
import { Alert, AlertDescription } from '~/foundation/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '~/foundation/components/ui/card'
import { Button } from '~/foundation/components/ui/button/index'
import { Input } from '~/foundation/components/ui/input/index'
import { Label } from '~/foundation/components/ui/label'
import { Badge } from '~/foundation/components/ui/badge'
import { Icon } from '#components'

export interface IConflictResolutionDialogProps {
  open: boolean
  conflict: IConflictResolution<Record<string, unknown>> | null
}

export interface IConflictResolutionDialogEmits {
  (e: 'update:open', open: boolean): void
  (e: 'resolve', resolution: string, mergedData?: unknown): void
  (e: 'cancel'): void
}

defineOptions({
  name: 'ConflictResolutionDialog'
})

const props = defineProps<IConflictResolutionDialogProps>()
const emit = defineEmits<IConflictResolutionDialogEmits>()

// Composables
const { t } = useI18n()

// State
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const selectedResolution = ref<'keep_local' | 'use_server' | 'merge'>('keep_local')
const mergeChoices = ref<Record<string, 'local' | 'server'>>({})
const isResolving = ref(false)

// Initialize merge choices when conflict changes
watch(() => props.conflict, (newConflict) => {
  if (newConflict?.conflictingFields) {
    const choices: Record<string, 'local' | 'server'> = {}
    newConflict.conflictingFields.forEach(field => {
      choices[field] = 'local' // Default to local version
    })
    mergeChoices.value = choices
  }
  selectedResolution.value = 'keep_local' // Reset selection
}, { immediate: true })

// Field helpers
const getFieldLabel = (fieldName: string): string => {
  const labelMap: Record<string, string> = {
    date: t('expense.form.fields.date'),
    category: t('expense.form.fields.category'),
    description: t('expense.form.fields.description'),
    incomeAmount: t('expense.form.fields.incomeAmount'),
    expenseAmount: t('expense.form.fields.expenseAmount'),
    caseId: t('expense.form.fields.case'),
    memo: t('expense.form.fields.memo'),
    tagIds: t('expense.form.fields.tags')
  }
  return labelMap[fieldName] || fieldName
}

const formatFieldValue = (fieldName: string, value: unknown): string => {
  if (value === null || value === undefined) return t('common.none')
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}

// Event handlers
const handleResolve = async () => {
  if (!props.conflict || !selectedResolution.value) return

  isResolving.value = true

  try {
    let resolvedData: Record<string, unknown>

    switch (selectedResolution.value) {
      case 'keep_local':
        resolvedData = props.conflict.localData
        break
      case 'use_server':
        resolvedData = props.conflict.serverData
        break
      case 'merge':
        // Create merged data based on user choices
        resolvedData = { ...props.conflict.serverData }
        Object.entries(mergeChoices.value).forEach(([field, choice]) => {
          if (choice === 'local') {
            resolvedData[field] = (props.conflict!.localData as Record<string, unknown>)[field]
          }
          // Server values are already in resolvedData
        })
        break
      default:
        resolvedData = props.conflict.localData
        break
    }

    emit('resolve', selectedResolution.value, resolvedData)
  } finally {
    isResolving.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
  isOpen.value = false
}
</script>

<style scoped>
/* Custom styles for conflict resolution */
.conflict-field-comparison {
  @apply grid grid-cols-2 gap-4 p-4 border rounded-lg;
}

.field-value-display {
  @apply p-2 bg-muted rounded text-sm font-mono;
}
</style>