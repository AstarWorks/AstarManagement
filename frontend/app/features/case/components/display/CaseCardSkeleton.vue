<template>
  <Card class="shadow-sm min-h-[theme('spacing.44')] max-w-[theme('spacing.72')] w-full">
    <CardHeader class="p-4 pb-3">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <Skeleton class="h-6 w-20" />
            <Skeleton class="h-5 w-16" />
          </div>
          <Skeleton class="h-4 w-full mb-1" />
          <Skeleton class="h-4 w-3/4" />
        </div>
      </div>
    </CardHeader>

    <CardContent class="px-4 pb-3">
      <!-- Client skeleton -->
      <div class="mb-3">
        <div class="flex items-center gap-2">
          <Skeleton class="h-4 w-4 rounded-full" />
          <Skeleton class="h-4 w-32" />
          <Skeleton class="h-4 w-20" />
        </div>
      </div>

      <!-- Metadata skeleton -->
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <Skeleton class="h-4 w-4 rounded-full" />
          <Skeleton class="h-4 w-24" />
        </div>
        <div class="flex items-center gap-2">
          <Skeleton class="h-4 w-4 rounded-full" />
          <Skeleton class="h-4 w-28" />
        </div>
        <div class="flex items-center gap-1">
          <Skeleton class="h-5 w-16 rounded-full" />
          <Skeleton class="h-5 w-20 rounded-full" />
        </div>
      </div>
    </CardContent>

    <CardFooter class="px-4 py-3 border-t">
      <div class="flex items-center justify-between w-full">
        <Skeleton class="h-3 w-20" />
        <Skeleton class="h-6 w-24" />
      </div>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardHeader, CardContent, CardFooter } from '@ui/card'
import { Skeleton } from '@ui/skeleton'

interface Props {
  viewMode?: 'minimal' | 'compact' | 'detailed'
}

withDefaults(defineProps<Props>(), {
  viewMode: 'compact'
})
</script>