<template>
  <FormField v-slot="{ componentField }" name="memo">
    <FormItem>
      <FormLabel for="memo">
        {{ t('expense.form.fields.memo') }}
      </FormLabel>
      <FormControl>
        <Textarea
          id="memo"
          v-bind="componentField"
          :placeholder="t('expense.form.placeholders.memo')"
          :class="textareaClasses"
          :maxlength="maxLength"
        />
      </FormControl>
      <div class="flex justify-between">
        <FormDescription>
          {{ t('expense.form.descriptions.memo') }}
        </FormDescription>
        <div class="text-xs text-muted-foreground">
          {{ characterCount }}/{{ maxLength }}
        </div>
      </div>
      <FormMessage />
    </FormItem>
  </FormField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFieldValue } from 'vee-validate'
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '~/foundation/components/ui/form'
import { Textarea } from '~/foundation/components/ui/textarea'
import { cn } from '~/foundation/utils/cn'

// Props
interface Props {
  maxLength?: number
  rows?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxLength: 1000,
  rows: 5
})

// Composables
const { t } = useI18n()

// Form field
const memo = useFieldValue<string>('memo')

// Computed properties
const characterCount = computed(() => {
  const value = memo.value
  return typeof value === 'string' ? value.length : 0
})

const textareaClasses = computed(() => 
  cn(
    'resize-none',
    `min-h-[${props.rows * 1.5}rem]`
  )
)
</script>