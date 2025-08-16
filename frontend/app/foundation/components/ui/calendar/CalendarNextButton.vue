<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CalendarNext, type CalendarNextProps, useForwardProps } from 'reka-ui'
import { cn } from '~/foundation/utils/cn'
import { buttonVariants } from '~/foundation/components/ui/button'

const props = defineProps<CalendarNextProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <CalendarNext
    data-slot="calendar-next-button"
    :class="cn(
      buttonVariants({ variant: 'outline' }),
      'absolute right-1',
      'size-7 bg-transparent p-0 opacity-50 hover:opacity-100',
      props.class,
    )"
    v-bind="forwardedProps"
  >
    <slot>
      <Icon name="lucide:chevron-right" class="size-4"  />
    </slot>
  </CalendarNext>
</template>
