<template>
  <NuxtLink
      :to="to"
      class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary-foreground/70 transition-all duration-300 ease-in-out hover:text-primary-foreground hover:bg-primary-foreground/10 group relative overflow-hidden"
      :class="{
      'text-primary-foreground bg-primary-foreground/20': isActive,
      'justify-center p-2': collapsed
    }"
  >
    <Icon
        v-if="icon"
        v-motion-pop-visible
        :name="icon"
        class="w-5 h-5 shrink-0"
        :class="{ 'text-primary-foreground': isActive }"
    />

    <!-- Text with v-motion animation -->
    <span
        v-show="!collapsed"
        v-motion-slide-visible-right
        class="whitespace-nowrap"
    >
      <slot />
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Props {
  to: string
  icon?: string
  collapsed?: boolean
}

const props = defineProps<Props>()

const route = useRoute()
const isActive = computed(() => route.path === props.to)
</script>
