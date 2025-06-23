<template>
  <AvatarImage
    v-bind="$attrs"
    :class="cn('aspect-square h-full w-full', $attrs.class)"
  />
</template>

<script setup lang="ts">
import { AvatarImage } from 'radix-vue'
import { cn } from '~/lib/utils'

defineOptions({
  inheritAttrs: false
})
</script>