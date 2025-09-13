<template>
  <Card
    class="hover:shadow-lg transition-shadow cursor-pointer"
    @click="navigateToWorkspace"
  >
    <CardHeader>
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div
            class="h-12 w-12 rounded-lg flex items-center justify-center text-2xl"
            :style="iconStyle"
          >
            {{ settings.icon || '📁' }}
          </div>
          <div>
            <CardTitle>{{ workspace.name }}</CardTitle>
            <CardDescription v-if="workspace.description" class="mt-1">
              {{ workspace.description }}
            </CardDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" @click.stop>
              <Icon name="lucide:more-vertical" class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="editWorkspace">
              <Icon name="lucide:edit" class="mr-2 h-4 w-4" />
              {{ $t('foundation.actions.basic.edit') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="duplicateWorkspace">
              <Icon name="lucide:copy" class="mr-2 h-4 w-4" />
              {{ $t('foundation.actions.data.duplicate') }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              class="text-destructive"
              @click="deleteWorkspace"
            >
              <Icon name="lucide:trash" class="mr-2 h-4 w-4" />
              {{ $t('foundation.actions.basic.delete') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    <CardContent>
      <div class="flex items-center gap-4 text-sm text-muted-foreground">
        <div class="flex items-center gap-1">
          <Icon name="lucide:users" class="h-4 w-4" />
          <span>{{ memberCount }} {{ $t('foundation.common.general.users') }}</span>
        </div>
        <div class="flex items-center gap-1">
          <Icon name="lucide:calendar" class="h-4 w-4" />
          <ClientOnly>
            <span>{{ formattedDate }}</span>
            <template #fallback>
              <span>-</span>
            </template>
          </ClientOnly>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import type { WorkspaceResponse } from '~/modules/workspace/types'

interface Props {
  workspace: WorkspaceResponse
  memberCount?: number
}

interface Emits {
  (e: 'edit' | 'duplicate' | 'delete', workspace: WorkspaceResponse): void
}

const props = withDefaults(defineProps<Props>(), {
  memberCount: 1
})

const emit = defineEmits<Emits>()

const router = useRouter()

// 型安全なsettings取得
const settings = computed(() => {
  if (!props.workspace.settings || typeof props.workspace.settings !== 'object') {
    return { icon: undefined, color: undefined }
  }
  
  const settings = props.workspace.settings as Record<string, unknown>
  return {
    icon: typeof settings.icon === 'string' ? settings.icon : undefined,
    color: typeof settings.color === 'string' ? settings.color : undefined
  }
})

// アイコンスタイル
const iconStyle = computed(() => {
  const color = settings.value.color || '#3B82F6'
  return {
    backgroundColor: color + '20',
    color
  }
})

// フォーマット済み日付
const formattedDate = computed(() => {
  if (!props.workspace.createdAt) return '-'
  return format(new Date(props.workspace.createdAt), 'yyyy/MM/dd')
})

// Methods
const navigateToWorkspace = () => {
  if (props.workspace.id) {
    router.push(`/workspaces/${props.workspace.id}`)
  }
}

const editWorkspace = () => {
  emit('edit', props.workspace)
}

const duplicateWorkspace = () => {
  emit('duplicate', props.workspace)
}

const deleteWorkspace = () => {
  emit('delete', props.workspace)
}
</script>