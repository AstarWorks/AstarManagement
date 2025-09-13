<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t('foundation.messages.confirmation.delete') }}</DialogTitle>
        <DialogDescription>
          <span>{{ $t('foundation.messages.warning.irreversible') }}</span>
          <span v-if="workspace" class="block mt-2 font-medium">
            "{{ workspace.name }}" {{ $t('foundation.messages.confirmation.deleteTarget') }}
          </span>
        </DialogDescription>
      </DialogHeader>
      
      <!-- ワークスペース情報表示 -->
      <div v-if="workspace" class="py-4 border rounded-lg bg-muted/50">
        <div class="flex items-center gap-3 px-4">
          <div
            class="h-8 w-8 rounded-md flex items-center justify-center text-lg"
            :style="iconStyle"
          >
            {{ settings.icon || '📁' }}
          </div>
          <div>
            <p class="font-medium">{{ workspace.name }}</p>
            <p v-if="workspace.description" class="text-sm text-muted-foreground">
              {{ workspace.description }}
            </p>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          {{ $t('foundation.actions.basic.cancel') }}
        </Button>
        <Button 
          variant="destructive" 
          :disabled="deleting"
          @click="handleConfirm"
        >
          <LoadingSpinner v-if="deleting" class="mr-2 h-4 w-4" />
          {{ $t('foundation.actions.basic.delete') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WorkspaceResponse } from '~/modules/workspace/types'
import LoadingSpinner from "@foundation/components/common/states/LoadingSpinner.vue";

interface Props {
  open: boolean
  workspace?: WorkspaceResponse | null
  deleting?: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'confirm', workspace: WorkspaceResponse): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  workspace: null,
  deleting: false
})

const emit = defineEmits<Emits>()

// 型安全なsettings取得
const settings = computed(() => {
  if (!props.workspace?.settings || typeof props.workspace.settings !== 'object') {
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

// Methods
const handleOpenChange = (value: boolean) => {
  emit('update:open', value)
}

const handleConfirm = () => {
  if (props.workspace) {
    emit('confirm', props.workspace)
  }
}

const handleCancel = () => {
  emit('cancel')
}
</script>