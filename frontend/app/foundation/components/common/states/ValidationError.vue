<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, X } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '~/foundation/components/ui/alert'
import { Button } from '~/foundation/components/ui/button'

const { t } = useI18n()

interface ValidationError {
  field?: string
  message: string
  code?: string
}

interface ValidationErrorProps {
  errors: ValidationError[] | ValidationError | string[] | string
  title?: string
  dismissible?: boolean
  showFieldNames?: boolean
  class?: string
}

const props = withDefaults(defineProps<ValidationErrorProps>(), {
  dismissible: false,
  showFieldNames: true
})

const emit = defineEmits<{
  dismiss: []
}>()

const displayTitle = computed(() => {
  return props.title || t('foundation.messages.error.validation')
})

const normalizedErrors = computed<ValidationError[]>(() => {
  if (typeof props.errors === 'string') {
    return [{ message: props.errors }]
  }
  
  if (Array.isArray(props.errors)) {
    return props.errors.map(error => {
      if (typeof error === 'string') {
        return { message: error }
      }
      return error
    })
  }
  
  return [props.errors]
})

const fieldNameMap: Record<string, string> = {
  email: t('foundation.common.fields.email'),
  password: t('foundation.common.fields.password'),
  name: t('foundation.common.fields.name'),
  title: t('foundation.common.fields.title'),
  description: t('foundation.common.fields.description'),
  amount: t('foundation.common.fields.amount'),
  date: t('foundation.common.fields.date'),
  category: t('foundation.common.fields.category'),
  memo: t('foundation.common.fields.memo'),
  tags: t('foundation.common.fields.tags'),
  file: t('foundation.common.fields.file')
}

const getFieldDisplayName = (field?: string): string => {
  if (!field) return ''
  return fieldNameMap[field] || field
}

const formatFieldError = (field: string | undefined, message: string): string => {
  const fieldName = getFieldDisplayName(field)
  return fieldName ? `${fieldName}: ${message}` : message
}

const handleDismiss = () => {
  emit('dismiss')
}
</script>

<template>
  <Alert variant="destructive" :class="props.class">
    <AlertCircle class="h-4 w-4" />
    
    <div class="flex-1">
      <div class="flex items-center justify-between">
        <AlertTitle>{{ displayTitle }}</AlertTitle>
        <Button
          v-if="dismissible"
          variant="ghost" 
          size="sm"
          class="h-auto p-1 hover:bg-destructive/20"
          @click="handleDismiss"
        >
          <X class="h-4 w-4" />
          <span class="sr-only">{{ t('foundation.actions.basic.close') }}</span>
        </Button>
      </div>
      
      <AlertDescription class="mt-2">
        <div v-if="normalizedErrors.length === 1" class="text-sm">
          {{ formatFieldError(showFieldNames ? normalizedErrors[0]?.field : undefined, normalizedErrors[0]?.message || '') }}
        </div>
        
        <ul v-else class="text-sm space-y-1">
          <li 
            v-for="(error, index) in normalizedErrors" 
            :key="index"
            class="flex items-start gap-2"
          >
            <span class="inline-block w-1 h-1 rounded-full bg-current mt-2 flex-shrink-0" />
            <span>
              {{ formatFieldError(showFieldNames ? error?.field : undefined, error?.message || '') }}
            </span>
          </li>
        </ul>
      </AlertDescription>
    </div>
  </Alert>
</template>