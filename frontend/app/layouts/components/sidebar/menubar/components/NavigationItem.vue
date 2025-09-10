<template>
  <NuxtLink
      :to="to"
      class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-accent group"
      :class="{
      'text-primary bg-accent': isActive,
      'justify-center p-2': collapsed
    }"
  >
    <Icon
        v-if="icon"
        :name="icon"
        class="w-5 h-5 shrink-0"
        :class="{ 'text-primary': isActive }"
    />

    <span
        v-if="!collapsed"
        class="transition-opacity duration-200"
        :class="{ 'opacity-0': collapsed }"
    >
      <slot />
    </span>

    <!-- Tooltip for collapsed state -->
    <TooltipProvider v-if="collapsed">
      <Tooltip>
        <TooltipTrigger as-child>
          <span class="sr-only"><slot /></span>
        </TooltipTrigger>
        <TooltipContent side="right">
          <slot />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
