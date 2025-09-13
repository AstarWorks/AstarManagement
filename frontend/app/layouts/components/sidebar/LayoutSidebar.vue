<template>
  <aside
    ref="sidebarRef"
    class="bg-primary text-primary-foreground h-full flex flex-col transition-all duration-300 ease-in-out shadow-xl"
    :class="sidebarClasses"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <SidebarHeader 
      :collapsed="isCollapsed" 
      :is-mobile="isMobile" 
      @close="$emit('close')" 
    />
    
    <SidebarNavigation 
      :collapsed="isCollapsed" 
      :is-mobile="isMobile" 
      :user="user" 
    />
    
    <SidebarUserInfo 
      :collapsed="isCollapsed" 
      :is-mobile="isMobile" 
      :user="user" 
    />
  </aside>
</template>

<script setup lang="ts">
// import { useTimeoutFn } from '@vueuse/core' // Not used
import SidebarUserInfo from './SidebarUserInfo.vue'
import SidebarNavigation from './SidebarNavigation.vue'
import SidebarHeader from './SidebarHeader.vue'

interface Props {
  collapsed?: boolean
  isMobile?: boolean
  hoverExpand?: boolean // ホバー展開を有効にするかどうか
}

const props = withDefaults(defineProps<Props>(), {
  hoverExpand: true
})

const emit = defineEmits<{
  close: []
  'hover-change': [isHovered: boolean]
}>()

// State
const sidebarRef = ref<HTMLElement>()
const isHovering = ref(false)
const hoverTimeout = ref<ReturnType<typeof setTimeout>>()

// Computed - シンプルで明確なロジック
const isCollapsed = computed(() => {
  if (props.isMobile) return false
  if (props.hoverExpand && isHovering.value && props.collapsed) return false
  return props.collapsed
})

const sidebarClasses = computed(() => ({
  'w-64': !isCollapsed.value || props.isMobile,
  'w-16': isCollapsed.value && !props.isMobile,
  'overflow-hidden': true
}))

// Hover handling
const handleMouseEnter = () => {
  if (!props.hoverExpand || props.isMobile || !props.collapsed) return
  
  // キャンセル pending timeout
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value)
  }
  
  isHovering.value = true
  emit('hover-change', true)
}

const handleMouseLeave = () => {
  if (!props.hoverExpand || props.isMobile || !props.collapsed) return
  
  // 300ms のディレイ後に折り畳む
  hoverTimeout.value = setTimeout(() => {
    isHovering.value = false
    emit('hover-change', false)
  }, 300)
}

// Authentication - using standard useAuth composable
const { profile } = useUserProfile()
const user = computed(() => profile.value)

// Cleanup
onUnmounted(() => {
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value)
  }
})
</script>