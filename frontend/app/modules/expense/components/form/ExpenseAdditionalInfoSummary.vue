<template>
  <div class="bg-muted/50 p-4 rounded-lg">
    <h4 class="font-medium mb-3 flex items-center gap-2">
      <Icon name="lucide:file-text" class="w-4 h-4" />
      {{ t('expense.form.summary') }}
    </h4>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <span class="font-medium">{{ t('expense.form.fields.case') }}:</span>
        <span class="ml-2 text-muted-foreground">
          {{ selectedCaseName || t('expense.form.noCase') }}
        </span>
      </div>
      <div>
        <span class="font-medium">{{ t('expense.form.fields.tags') }}:</span>
        <span class="ml-2 text-muted-foreground">
          {{ selectedTagNames || t('expense.form.noTags') }}
        </span>
      </div>
      <div v-if="memoLength > 0" class="md:col-span-2">
        <span class="font-medium">{{ t('expense.form.fields.memo') }}:</span>
        <span class="ml-2 text-muted-foreground">
          {{ memoLength }} {{ t('expense.form.characters') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFieldValue } from 'vee-validate'
import { useExpenseCases } from '~/modules/expense/composables/shared/useExpenseCases'
import { useExpenseTags } from '~/modules/expense/composables/shared/useExpenseTags'

// Composables
const { t } = useI18n()
const { getCaseDisplayName } = useExpenseCases()
const { getTagsByIds } = useExpenseTags()

// Form fields
const caseId = useFieldValue<string>('caseId')
const memo = useFieldValue<string>('memo')
const tagIds = useFieldValue<string[]>('tagIds')

// Computed properties
const selectedCaseName = computed(() => {
  const id = caseId.value
  return id ? getCaseDisplayName(id) : ''
})

const selectedTagNames = computed(() => {
  const ids = tagIds.value || []
  if (ids.length === 0) return ''
  
  const tags = getTagsByIds(ids)
  return tags.map(tag => tag.name).join(', ')
})

const memoLength = computed(() => {
  const value = memo.value
  return typeof value === 'string' ? value.length : 0
})
</script>