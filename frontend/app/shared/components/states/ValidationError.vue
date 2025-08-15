<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, X } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@ui/alert'
import { Button } from '@ui/button/index'

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
  title: '入力エラー',
  dismissible: false,
  showFieldNames: true
})

const emit = defineEmits<{
  dismiss: []
}>()

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
  email: 'メールアドレス',
  password: 'パスワード',
  name: '名前',
  title: 'タイトル',
  description: '説明',
  amount: '金額',
  date: '日付',
  category: 'カテゴリ',
  memo: 'メモ',
  tags: 'タグ',
  file: 'ファイル'
}

const getFieldDisplayName = (field?: string): string => {
  if (!field) return ''
  return fieldNameMap[field] || field
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
        <AlertTitle>{{ title }}</AlertTitle>
        <Button
          v-if="dismissible"
          variant="ghost" 
          size="sm"
          class="h-auto p-1 hover:bg-destructive/20"
          @click="handleDismiss"
        >
          <X class="h-4 w-4" />
          <span class="sr-only">閉じる</span>
        </Button>
      </div>
      
      <AlertDescription class="mt-2">
        <div v-if="normalizedErrors.length === 1" class="text-sm">
          <span v-if="showFieldNames && normalizedErrors[0]?.field" class="font-medium">
            {{ getFieldDisplayName(normalizedErrors[0].field) }}:
          </span>
          {{ normalizedErrors[0]?.message }}
        </div>
        
        <ul v-else class="text-sm space-y-1">
          <li 
            v-for="(error, index) in normalizedErrors" 
            :key="index"
            class="flex items-start gap-2"
          >
            <span class="inline-block w-1 h-1 rounded-full bg-current mt-2 flex-shrink-0" />
            <span>
              <span v-if="showFieldNames && error?.field" class="font-medium">
                {{ getFieldDisplayName(error.field) }}:
              </span>
              {{ error?.message }}
            </span>
          </li>
        </ul>
      </AlertDescription>
    </div>
  </Alert>
</template>