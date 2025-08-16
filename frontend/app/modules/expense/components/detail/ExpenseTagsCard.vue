<template>
  <Card v-if="tags && tags.length > 0">
    <CardHeader>
      <CardTitle>{{ t('expense.form.fields.tags') }}</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex flex-wrap gap-2">
        <Badge 
          v-for="tag in tags" 
          :key="tag.id" 
          variant="secondary"
          :style="{ backgroundColor: tag.color + '20', borderColor: tag.color }"
        >
          <span :style="{ color: tag.color }">{{ tag.name }}</span>
        </Badge>
      </div>
      
      <!-- Tag hierarchy display if needed -->
      <div v-if="hasHierarchy" class="mt-4 text-sm text-muted-foreground">
        <p>{{ t('expense.detail.tagCount', { count: tags.length }) }}</p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { ITag } from '~/modules/expense/types'
import { Card, CardContent, CardHeader, CardTitle } from '~/foundation/components/ui/card'
import { Badge } from '~/foundation/components/ui/badge'

interface Props {
  tags: ITag[]
}

defineProps<Props>()
const { t } = useI18n()

// Check if any tag has parent/child relationships
const hasHierarchy = computed(() => {
  // TODO: Add hierarchy support when available in API
  return false
})
</script>