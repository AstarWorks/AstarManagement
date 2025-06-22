<template>
  <div class="space-y-4">
    <div v-for="(step, index) in stepConfigs" :key="step.id" class="border rounded-lg p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-medium text-foreground">
          {{ step.title || `Step ${index + 1}` }}
        </h4>
        <Button
          type="button"
          size="sm"
          variant="outline"
          @click="$emit('editStep', index)"
        >
          <Edit class="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>
      
      <div class="text-sm text-muted-foreground space-y-2">
        <template v-if="getStepData(step.id)">
          <div v-for="(value, key) in getStepData(step.id)" :key="key" class="flex justify-between">
            <span class="font-medium">{{ formatFieldName(String(key)) }}:</span>
            <span>{{ formatFieldValue(value) }}</span>
          </div>
        </template>
        <div v-else class="text-center py-2 italic">
          No data entered for this step
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Edit } from 'lucide-vue-next'
import type { StepConfig } from './MultiStepForm.vue'

interface FormSummaryProps {
  formData: Record<string, any>
  stepConfigs: StepConfig[]
}

const props = defineProps<FormSummaryProps>()

const emit = defineEmits<{
  editStep: [stepIndex: number]
}>()

const getStepData = (stepId: string) => {
  return props.formData[stepId]
}

const formatFieldName = (fieldName: string): string => {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

const formatFieldValue = (value: any): string => {
  if (value === null || value === undefined) return 'Not specified'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
</script>