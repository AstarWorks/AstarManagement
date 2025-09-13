<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div class="space-y-2">
      <Label for="name">{{ $t('foundation.common.fields.name') }}</Label>
      <Input
        id="name"
        v-model="formData.name"
        :placeholder="$t('foundation.common.fields.name')"
        :class="{ 'border-destructive': hasFieldError('name') }"
        required
      />
      <p v-if="getFieldError('name')" class="text-sm text-destructive">
        {{ getFieldError('name') }}
      </p>
    </div>
    
    <div class="space-y-2">
      <Label for="description">{{ $t('foundation.common.fields.description') }}</Label>
      <Textarea
        id="description"
        v-model="formData.description"
        :placeholder="$t('foundation.common.fields.description')"
        :class="{ 'border-destructive': hasFieldError('description') }"
        rows="3"
      />
      <p v-if="getFieldError('description')" class="text-sm text-destructive">
        {{ getFieldError('description') }}
      </p>
    </div>
    
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label for="icon">{{ $t('foundation.common.fields.icon') }}</Label>
        <Input
          id="icon"
          v-model="formData.icon"
          placeholder="📁"
          :class="{ 'border-destructive': hasFieldError('icon') }"
          maxlength="2"
        />
        <p v-if="getFieldError('icon')" class="text-sm text-destructive">
          {{ getFieldError('icon') }}
        </p>
      </div>
      
      <div class="space-y-2">
        <Label for="color">{{ $t('foundation.common.fields.color') }}</Label>
        <Input
          id="color"
          v-model="formData.color"
          type="color"
          :class="{ 'border-destructive': hasFieldError('color') }"
        />
        <p v-if="getFieldError('color')" class="text-sm text-destructive">
          {{ getFieldError('color') }}
        </p>
      </div>
    </div>
    
    <div class="flex justify-end gap-3 pt-4">
      <Button type="button" variant="outline" @click="handleCancel">
        {{ $t('foundation.actions.basic.cancel') }}
      </Button>
      <Button type="submit" :disabled="submitting || !isValid">
        <LoadingSpinner v-if="submitting" class="mr-2 h-4 w-4" />
        {{ isEditMode ? $t('foundation.actions.basic.save') : $t('foundation.actions.basic.create') }}
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WorkspaceResponse } from '~/modules/workspace/types'
import { useWorkspaceForm } from '~/modules/workspace/composables/useWorkspaceForm'
import LoadingSpinner from "@foundation/components/common/states/LoadingSpinner.vue";

interface Props {
  editingWorkspace?: WorkspaceResponse | null
  submitting?: boolean
}

interface Emits {
  (e: 'submit'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  editingWorkspace: null,
  submitting: false
})

const emit = defineEmits<Emits>()

// フォーム管理
const {
  formData,
  errors,
  isValid,
  resetForm,
  initializeForm,
  validateForm,
  getFieldError,
  hasFieldError,
  toCreateRequest,
  toUpdateRequest
} = useWorkspaceForm()

// 編集モードの判定
const isEditMode = computed(() => Boolean(props.editingWorkspace))

// プロパティが変更された時にフォームを初期化
watch(() => props.editingWorkspace, (workspace) => {
  if (workspace) {
    initializeForm(workspace)
  } else {
    resetForm()
  }
}, { immediate: true })

// Methods
const handleSubmit = () => {
  if (!validateForm()) {
    return
  }
  
  emit('submit')
}

const handleCancel = () => {
  resetForm()
  emit('cancel')
}

// フォームデータをエクスポート
const getFormData = () => {
  return {
    isEditMode: isEditMode.value,
    createRequest: toCreateRequest(),
    updateRequest: toUpdateRequest(),
    isValid: isValid.value
  }
}

// 親コンポーネントがフォームデータにアクセスできるようにする
defineExpose({
  getFormData,
  resetForm,
  validateForm,
  formData,
  isValid
})
</script>