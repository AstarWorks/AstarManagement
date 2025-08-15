<!--
  Error Boundary Wrapper Component
  Displays error messages when an error occurs, otherwise renders default slot
-->
<template>
  <div class="relative">
    <!-- Error state -->
    <Alert v-if="error" class="border-destructive bg-destructive/5">
      <Icon name="lucide:alert-circle" class="h-4 w-4"  />
      <AlertTitle>{{ $t('common.error.title') }}</AlertTitle>
      <AlertDescription>
        {{ error || $t('common.error.generic') }}
      </AlertDescription>
    </Alert>

    <!-- Normal content when no error -->
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { Alert, AlertTitle, AlertDescription } from '@ui/alert'

interface Props {
  error?: string | null
  class?: string
}

withDefaults(defineProps<Props>(), {
  error: null,
  class: ''
})
</script>