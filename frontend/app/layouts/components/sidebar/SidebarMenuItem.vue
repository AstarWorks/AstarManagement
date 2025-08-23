<template>
  <div class="relative">
    <!-- メニュー項目 -->
    <component
        :is="item.isExternal ? 'a' : 'NuxtLink'"
        :href="item.isExternal ? item.path : undefined"
        :to="!item.isExternal ? item.path : undefined"
        :target="item.isExternal ? (item.target || '_blank') : undefined"
        class="group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        :class="[
        isActive
          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
          : 'text-gray-600',
        hasChildren && !isCollapsed ? 'cursor-pointer' : ''
      ]"
        @click="handleClick"
    >
      <!-- アイコン -->
      <Icon
          :name="item.icon"
          class="flex-shrink-0 h-5 w-5 transition-colors duration-200"
          :class="[
          isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500',
          isCollapsed ? 'mr-0' : 'mr-3'
        ]"
      />

      <!-- ラベル（展開時のみ） -->
      <div v-if="!isCollapsed" class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <span class="truncate">
            {{ item.label }}
          </span>

          <!-- バッジ -->
          <Badge
              v-if="item.badge"
              :variant="item.badge.variant"
              class="ml-2 text-xs"
          >
            {{ item.badge.text }}
          </Badge>

          <!-- 子要素がある場合の展開アイコン -->
          <Icon
              v-if="hasChildren"
              name="lucide:chevron-down"
              class="ml-2 h-4 w-4 transition-transform duration-200"
              :class="[
              isExpanded ? 'rotate-180' : 'rotate-0'
            ]"
          />
        </div>

        <!-- 説明文（あれば） -->
        <div
            v-if="item.description && showDescription"
            class="text-xs text-gray-500 mt-1 leading-tight"
        >
          {{ item.description }}
        </div>
      </div>
    </component>

    <!-- 折りたたみ時のツールチップ -->
    <Tooltip v-if="isCollapsed" :content="tooltipContent">
      <template #trigger>
        <div class="absolute inset-0 pointer-events-none"/>
      </template>
    </Tooltip>

    <!-- 子要素（展開時のみ） -->
    <Collapsible
        v-if="hasChildren && !isCollapsed"
        v-model:open="isExpanded"
    >
      <CollapsibleContent class="overflow-hidden">
        <div class="ml-8 mt-1 space-y-1 border-l border-gray-200 pl-4">
          <SidebarMenuItem
              v-for="child in visibleChildren"
              :key="child.id"
              :item="child"
              :is-collapsed="false"
              :depth="depth + 1"
              @item-click="emit('itemClick', $event)"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  </div>
</template>

<script setup lang="ts">
  import type {INavigationItem, NavigationItem} from '~/foundation/types/navigation'
  import { useUserProfile } from '~/modules/auth/composables/useUserProfile'

  // Props
  interface Props {
    item: INavigationItem
    isCollapsed?: boolean
    depth?: number
    showDescription?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    isCollapsed: false,
    depth: 0,
    showDescription: false
  })

  // Emits
  const emit = defineEmits<{
    itemClick: [item: NavigationItem]
  }>()

  // コンポーザブル - 業界標準のuseAuthを使用
  const { hasPermission, hasRole } = useUserProfile()
  const route = useRoute()
  
  // 権限チェック関数
  const hasAccess = (requiredPermissions?: string[], requiredRoles?: string[]) => {
    if (!requiredPermissions?.length && !requiredRoles?.length) return true
    if (requiredPermissions?.length && requiredPermissions.some(p => hasPermission(p))) return true
    if (requiredRoles?.length && requiredRoles.some(r => hasRole(r))) return true
    return false
  }

  // リアクティブ状態
  const isExpanded = ref(false)

  // 計算プロパティ
  const hasChildren = computed(() =>
      Boolean(props.item.children && props.item.children.length > 0)
  )

  const visibleChildren = computed(() => {
    if (!props.item.children) return []

    return props.item.children.filter(child =>
        hasAccess(child.requiredPermissions, child.requiredRoles)
    )
  })

  const isActive = computed(() => {
    const currentPath = route.path

    // 完全一致
    if (props.item.path === currentPath) return true

    // 子要素のいずれかがアクティブかチェック
    if (hasChildren.value) {
      return visibleChildren.value.some(child =>
          currentPath.startsWith(child.path) || child.path === currentPath
      )
    }

    // 部分一致（パスの開始部分が一致する場合）
    if (props.item.path !== '/' && currentPath.startsWith(props.item.path)) {
      return true
    }

    return false
  })

  const tooltipContent = computed(() => {
    let content = props.item.label
    if (props.item.description) {
      content += `\n${props.item.description}`
    }
    if (props.item.badge) {
      content += `\n${props.item.badge.text}`
    }
    return content
  })

  // メソッド
  const handleClick = (event: Event) => {
    // 子要素がある場合は展開/折りたたみ
    if (hasChildren.value && !props.isCollapsed) {
      event.preventDefault()
      isExpanded.value = !isExpanded.value
      return
    }

    // 外部リンクの場合はそのまま処理
    if (props.item.isExternal) {
      emit('itemClick', props.item)
      return
    }

    // 内部リンクの場合
    emit('itemClick', props.item)
  }

  // アクティブ項目の場合は自動的に展開
  watch(
      () => isActive.value,
      (newValue) => {
        if (newValue && hasChildren.value && !props.isCollapsed) {
          isExpanded.value = true
        }
      },
      {immediate: true}
  )

  // 現在のパスに基づいて初期展開状態を設定
  onMounted(() => {
    if (isActive.value && hasChildren.value && !props.isCollapsed) {
      isExpanded.value = true
    }
  })
</script>