# ワークスペース管理UI

## 概要

ファイルツリー、プロジェクト切り替え、権限表示を統合したワークスペース管理インターフェース。
VSCode風のサイドバーレイアウトで直感的な操作を実現。

## レイアウト構成

```
┌─────────────────────────────────────────────┐
│  ロゴ    ワークスペース選択    ユーザーメニュー  │ ← ヘッダー
├──────┬─────────────────────────┬────────────┤
│      │                         │            │
│ File │   メインコンテンツエリア   │    AI     │
│ Tree │   （選択されたビュー）     │   Chat    │
│      │                         │            │
│      │                         │            │
└──────┴─────────────────────────┴────────────┘
  左サイドバー                      右サイドバー
```

## コンポーネント構成

### WorkspaceSelector
```vue
<template>
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" class="w-[200px] justify-between">
        <span class="truncate">{{ currentWorkspace?.name || 'ワークスペース選択' }}</span>
        <ChevronDown class="ml-2 h-4 w-4" />
      </Button>
    </PopoverTrigger>
    
    <PopoverContent class="w-[250px] p-0">
      <Command>
        <CommandInput placeholder="ワークスペースを検索..." />
        <CommandList>
          <CommandGroup>
            <CommandItem
              v-for="workspace in workspaces"
              :key="workspace.id"
              @select="selectWorkspace(workspace.id)"
            >
              <Check 
                v-if="workspace.id === currentWorkspace?.id"
                class="mr-2 h-4 w-4"
              />
              <span>{{ workspace.name }}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
const workspaceStore = useWorkspaceStore()
const { currentWorkspace, workspaces } = storeToRefs(workspaceStore)

async function selectWorkspace(id: string) {
  await workspaceStore.selectWorkspace(id)
  await navigateTo(`/workspace/${id}`)
}
</script>
```

### FileTree
```vue
<template>
  <div class="h-full overflow-auto">
    <div class="p-2">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium">エクスプローラー</span>
        <div class="flex gap-1">
          <Button size="icon" variant="ghost" @click="createFolder">
            <FolderPlus class="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" @click="createFile">
            <FilePlus class="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <TreeView
        :items="treeItems"
        @select="handleSelect"
        @context-menu="handleContextMenu"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface TreeItem {
  id: string
  name: string
  type: 'folder' | 'file'
  path: string
  children?: TreeItem[]
  permissions?: string[]
}

const { data: treeItems } = await useFetch('/api/v1/folders/tree')

function handleSelect(item: TreeItem) {
  if (item.type === 'file') {
    openDocument(item.id)
  } else {
    toggleFolder(item.id)
  }
}

function handleContextMenu(item: TreeItem, event: MouseEvent) {
  showContextMenu({
    x: event.clientX,
    y: event.clientY,
    items: [
      { label: '名前を変更', action: () => rename(item) },
      { label: '削除', action: () => deleteItem(item) },
      { label: '権限設定', action: () => showPermissions(item) }
    ]
  })
}
</script>
```

### ProjectPanel
```vue
<template>
  <div class="border-b">
    <div class="p-4">
      <h2 class="text-lg font-semibold mb-2">
        {{ currentProject?.name }}
      </h2>
      
      <div class="flex items-center gap-4 text-sm text-muted-foreground">
        <div class="flex items-center gap-1">
          <Users class="h-4 w-4" />
          <span>{{ memberCount }}名</span>
        </div>
        
        <div class="flex items-center gap-1">
          <Files class="h-4 w-4" />
          <span>{{ documentCount }}ファイル</span>
        </div>
        
        <div class="flex items-center gap-1">
          <Table class="h-4 w-4" />
          <span>{{ tableCount }}テーブル</span>
        </div>
      </div>
      
      <div class="mt-3 flex gap-2">
        <Badge 
          v-for="role in userRoles" 
          :key="role.id"
          :style="{ backgroundColor: role.color }"
        >
          {{ role.name }}
        </Badge>
      </div>
    </div>
  </div>
</template>
```

## 権限表示システム

### PermissionIndicator
```vue
<template>
  <div class="inline-flex items-center gap-1">
    <Lock v-if="isRestricted" class="h-3 w-3 text-yellow-500" />
    <Eye v-if="isReadOnly" class="h-3 w-3 text-blue-500" />
    <Edit v-if="canEdit" class="h-3 w-3 text-green-500" />
    <Shield v-if="isAdmin" class="h-3 w-3 text-purple-500" />
    
    <Tooltip>
      <TooltipTrigger>
        <Info class="h-3 w-3 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent>
        <div class="text-xs">
          <p v-for="perm in permissions" :key="perm">
            {{ formatPermission(perm) }}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  </div>
</template>

<script setup lang="ts">
interface Props {
  permissions: string[]
}

const props = defineProps<Props>()

const isRestricted = computed(() => 
  props.permissions.length === 0
)

const isReadOnly = computed(() => 
  props.permissions.every(p => p.includes(':read:'))
)

const canEdit = computed(() => 
  props.permissions.some(p => p.includes(':write:'))
)

const isAdmin = computed(() => 
  props.permissions.some(p => p.includes(':*:'))
)

function formatPermission(perm: string): string {
  const [resource, action, scope] = perm.split(':')
  return `${resource}の${action}権限 (${scope})`
}
</script>
```

## リアルタイムコラボレーション

### PresenceIndicator
```vue
<template>
  <div class="flex -space-x-2">
    <Avatar
      v-for="user in activeUsers"
      :key="user.id"
      class="ring-2 ring-background"
      :title="user.name"
    >
      <AvatarImage :src="user.avatar" />
      <AvatarFallback>{{ user.initials }}</AvatarFallback>
    </Avatar>
    
    <div 
      v-if="additionalCount > 0"
      class="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs"
    >
      +{{ additionalCount }}
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: presence } = await useWebSocket('/ws/presence')

const activeUsers = computed(() => 
  presence.value?.users.slice(0, 3) || []
)

const additionalCount = computed(() => 
  Math.max(0, (presence.value?.users.length || 0) - 3)
)
</script>
```

## ナビゲーション

### Breadcrumb
```vue
<template>
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/workspace">
          <Home class="h-4 w-4" />
        </BreadcrumbLink>
      </BreadcrumbItem>
      
      <template v-for="(segment, index) in pathSegments" :key="index">
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink 
            v-if="index < pathSegments.length - 1"
            :href="buildPath(index)"
          >
            {{ segment.name }}
          </BreadcrumbLink>
          <BreadcrumbPage v-else>
            {{ segment.name }}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>
```

## アクションパネル

### QuickActions
```vue
<template>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm">
        <Plus class="h-4 w-4 mr-2" />
        新規作成
      </Button>
    </DropdownMenuTrigger>
    
    <DropdownMenuContent>
      <DropdownMenuItem @click="createTable">
        <Table class="h-4 w-4 mr-2" />
        テーブル
      </DropdownMenuItem>
      
      <DropdownMenuItem @click="createDocument">
        <FileText class="h-4 w-4 mr-2" />
        ドキュメント
      </DropdownMenuItem>
      
      <DropdownMenuItem @click="createFolder">
        <Folder class="h-4 w-4 mr-2" />
        フォルダ
      </DropdownMenuItem>
      
      <DropdownMenuSeparator />
      
      <DropdownMenuItem @click="importData">
        <Upload class="h-4 w-4 mr-2" />
        インポート
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
```

## 検索インターフェース

### GlobalSearch
```vue
<template>
  <div class="relative">
    <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
    <Input
      v-model="searchQuery"
      placeholder="検索... (Cmd+K)"
      class="pl-8"
      @keydown.meta.k.prevent="focusSearch"
    />
    
    <div 
      v-if="searchResults.length > 0"
      class="absolute top-full mt-2 w-full bg-popover rounded-md shadow-lg"
    >
      <div class="p-2">
        <div 
          v-for="result in searchResults"
          :key="result.id"
          class="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
          @click="openResult(result)"
        >
          <component :is="getIcon(result.type)" class="h-4 w-4" />
          <div class="flex-1">
            <div class="text-sm font-medium">{{ result.title }}</div>
            <div class="text-xs text-muted-foreground">{{ result.path }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const searchQuery = ref('')
const searchResults = ref([])

const debouncedSearch = useDebounceFn(async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  
  const { data } = await $fetch('/api/v1/search', {
    query: { q: searchQuery.value }
  })
  
  searchResults.value = data
}, 300)

watch(searchQuery, debouncedSearch)
</script>
```

## まとめ

ワークスペース管理UIにより：
1. **直感的なファイル管理**: VSCode風の使い慣れたインターフェース
2. **権限の可視化**: 一目でアクセス権限を確認
3. **リアルタイムコラボ**: 他ユーザーの作業状況を表示
4. **高速な検索**: グローバル検索で素早くアクセス