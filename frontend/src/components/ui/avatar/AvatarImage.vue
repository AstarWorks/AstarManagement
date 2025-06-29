<template>
  <RadixAvatarImage
    v-bind="props"
    :class="cn('aspect-square h-full w-full', props.class)"
  />
</template>

<script setup lang="ts">
import { AvatarImage as RadixAvatarImage } from 'radix-vue'
import { cn } from '~/lib/utils'

interface Props {
  src: string
  alt?: string
  class?: string
  referrerPolicy?: ReferrerPolicy
}

const props = defineProps<Props>()
</script>