<template>
  <AlertDialogCancel as-child>
    <Button
      variant="outline"
      :class="cn(props.class)"
      @click="handleClick"
    >
      <slot />
    </Button>
  </AlertDialogCancel>
</template>

<script setup lang="ts">
import { AlertDialogCancel } from 'radix-vue'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface AlertDialogCancelProps {
  class?: string
  onClick?: () => void
}

const props = defineProps<AlertDialogCancelProps>()

const handleClick = () => {
  if (props.onClick) {
    props.onClick()
  }
}
</script>