<template>
  <AlertDialogAction as-child>
    <Button
      :class="cn(buttonVariants({ variant }), props.class)"
      :disabled="loading"
      @click="handleClick"
    >
      <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
      <slot />
    </Button>
  </AlertDialogAction>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AlertDialogAction } from 'radix-vue'
import { Button, buttonVariants } from '~/components/ui/button'
import { Loader2 } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import type { VariantProps } from 'class-variance-authority'

type ButtonVariants = VariantProps<typeof buttonVariants>

interface AlertDialogActionProps {
  class?: string
  variant?: ButtonVariants['variant']
  onClick?: () => void | Promise<void>
  disabled?: boolean
}

const props = withDefaults(defineProps<AlertDialogActionProps>(), {
  variant: 'default'
})

const loading = ref(false)

const handleClick = async () => {
  if (props.onClick && !loading.value) {
    loading.value = true
    try {
      await props.onClick()
    } finally {
      loading.value = false
    }
  }
}
</script>