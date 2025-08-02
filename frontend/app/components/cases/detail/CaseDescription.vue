<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">
        {{ $t('cases.detail.description.title') }}
      </CardTitle>
      <CardDescription>
        {{ $t('cases.detail.description.subtitle') }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="prose prose-sm max-w-none">
        <p class="text-sm text-muted-foreground">
          {{ caseData.description || $t('cases.detail.description.noDescription') }}
        </p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { Case } from '~/types/case'

interface Props {
  caseData: Case
}

defineProps<Props>()
</script>

<style scoped>
.prose p {
  margin-bottom: 1rem;
  line-height: 1.6;
}
</style>