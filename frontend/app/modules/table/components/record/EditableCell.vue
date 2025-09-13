<template>
  <div 
    class="group relative min-h-[32px] w-full cursor-text transition-all inherit-position"
    :class="[
      densityClass,
      isActive ? 'ring-2 ring-primary shadow-sm' : 'hover:bg-muted/30',
      validationErrors.length > 0 ? 'ring-2 ring-destructive bg-destructive/5' : '',
      record._isNewRecord ? [
        'bg-gradient-to-r from-muted/20 to-transparent',
        !value && isRequired ? 'border-l-2 border-l-primary' : '',
        !value ? 'bg-muted/10' : ''
      ] : ''
    ]"
    @click="handleCellClick"
  >
    <!-- Text types -->
    <template v-if="isTextType && !isActive">
      <div class="flex items-center px-3 py-2">
        <span v-if="hasValue" class="truncate">{{ displayValue }}</span>
        <span v-else class="text-muted-foreground text-sm flex items-center">
          <span v-if="record._isNewRecord">
            {{ isRequired ? property.displayName + ' *' : property.displayName }}
          </span>
          <span v-else>-</span>
        </span>
      </div>
    </template>

    <template v-else-if="isTextType && isActive">
      <Input
        ref="inputRef"
        v-model="safeStringValue"
        :placeholder="property.displayName"
        class="border-none shadow-none focus-visible:ring-0 px-3"
        @blur="handleBlur"
      />
    </template>

    <!-- Number types -->
    <template v-else-if="isNumberType && !isActive">
      <div class="flex items-center px-3 py-2">
        <span v-if="hasValue" class="tabular-nums">
          {{ formatNumber(safeNumberValue) }}
        </span>
        <span v-else class="text-muted-foreground text-sm flex items-center">
          <span v-if="record._isNewRecord">
            {{ isRequired ? property.displayName + ' *' : property.displayName }}
          </span>
          <span v-else>-</span>
        </span>
      </div>
    </template>

    <template v-else-if="isNumberType && isActive">
      <Input
        ref="inputRef"
        v-model="safeNumberValue"
        type="number"
        :placeholder="property.displayName"
        class="border-none shadow-none focus-visible:ring-0 px-3"
        @blur="handleBlur"
      />
    </template>

    <!-- Boolean type -->
    <template v-else-if="property.type === 'checkbox'">
      <div class="flex items-center justify-center py-2">
        <Checkbox
          :checked="Boolean(value)"
          @update:checked="handleCheckboxChange"
        />
      </div>
    </template>

    <!-- Date types -->
    <template v-else-if="isDateType && !isActive">
      <div class="flex items-center px-3 py-2">
        <span v-if="hasValue" class="text-sm">{{ formatDate(safeStringValue) }}</span>
        <span v-else class="text-muted-foreground text-sm flex items-center">
          <span v-if="record._isNewRecord">
            {{ isRequired ? property.displayName + ' *' : property.displayName }}
          </span>
          <span v-else>-</span>
        </span>
      </div>
    </template>

    <template v-else-if="isDateType && isActive">
      <DatePicker
        v-model="safeStringValue"
        :placeholder="property.displayName"
        :type="property.type?.toUpperCase() as 'DATE' | 'DATETIME'"
        class="border-none shadow-none focus-visible:ring-0"
        @blur="handleBlur"
        @focus="emit('focus')"
      />
    </template>

    <!-- Select type -->
    <template v-else-if="property.type === 'select' && !isActive">
      <div class="flex items-center px-3 py-2">
        <Badge 
          v-if="hasValue"
          :style="getSelectOptionStyle(value as string)"
          class="font-medium border"
        >
          {{ getSelectOptionLabel(value as string) }}
        </Badge>
        <span v-else class="text-muted-foreground text-sm flex items-center">
          <span v-if="record._isNewRecord">
            {{ isRequired ? property.displayName + ' *' : property.displayName }}
          </span>
          <span v-else>-</span>
        </span>
      </div>
    </template>

    <template v-else-if="property.type === 'select' && isActive">
      <Select :model-value="safeStringValue" @update:model-value="(value) => handleSelectChange(value as PropertyValue)">
        <SelectTrigger class="border-none shadow-none focus:ring-0 px-3">
          <SelectValue :placeholder="property.displayName">
            <Badge 
              v-if="localValue && getSelectOptionByValue(String(localValue))?.color"
              :style="getSelectOptionStyle(String(localValue))" 
              class="text-xs font-medium border"
            >
              {{ getSelectOptionLabel(String(localValue)) }}
            </Badge>
            <span v-else-if="localValue">{{ getSelectOptionLabel(String(localValue)) }}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in selectOptions"
            :key="option.value"
            :value="option.value"
          >
            <Badge 
              v-if="option.color"
              :style="getSelectOptionStyle(option.value)" 
              class="text-xs font-medium border"
            >
              {{ option.label }}
            </Badge>
            <span v-else>{{ option.label }}</span>
          </SelectItem>
        </SelectContent>
      </Select>
    </template>

    <!-- Multi-select type -->
    <template v-else-if="property.type === 'multi_select'">
      <div class="flex flex-wrap gap-1 p-2" @click="handleCellClick">
        <Badge
          v-for="item in arrayValue"
          :key="item"
          :style="getSelectOptionStyle(item)"
          class="text-xs border"
        >
          {{ getSelectOptionLabel(item) }}
        </Badge>
        <span v-if="arrayValue.length === 0" class="text-muted-foreground text-sm px-1 flex items-center">
          <span v-if="record._isNewRecord">
            {{ isRequired ? property.displayName + ' *' : property.displayName }}
          </span>
          <span v-else>-</span>
        </span>
      </div>
    </template>

    <!-- URL type -->
    <template v-else-if="property.type === 'url' && !isActive">
      <div class="flex items-center px-3 py-2">
        <a
          v-if="hasValue"
          :href="String(value)"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary hover:underline flex items-center"
          @click.stop
        >
          <Icon name="lucide:external-link" class="mr-1 inline h-3 w-3" />
          {{ displayValue }}
        </a>
        <span v-else class="text-muted-foreground text-sm flex items-center">
          <span v-if="record._isNewRecord">
            {{ isRequired ? property.displayName + ' *' : property.displayName }}
          </span>
          <span v-else>-</span>
        </span>
      </div>
    </template>

    <template v-else-if="property.type === 'url' && isActive">
      <Input
        ref="inputRef"
        v-model="safeStringValue"
        type="url"
        :placeholder="property.displayName"
        class="border-none shadow-none focus-visible:ring-0 px-3"
        @blur="handleBlur"
      />
    </template>

    <!-- Email type -->
    <template v-else-if="property.type === 'email' && !isActive">
      <div class="flex items-center px-3 py-2">
        <a
          v-if="hasValue"
          :href="`mailto:${value}`"
          class="text-primary hover:underline"
          @click.stop
        >
          {{ displayValue }}
        </a>
        <span v-else class="text-muted-foreground text-sm flex items-center">
          <span v-if="record._isNewRecord">
            {{ isRequired ? property.displayName + ' *' : property.displayName }}
          </span>
          <span v-else>-</span>
        </span>
      </div>
    </template>

    <template v-else-if="property.type === 'email' && isActive">
      <Input
        ref="inputRef"
        v-model="safeStringValue"
        type="email"
        :placeholder="property.displayName"
        class="border-none shadow-none focus-visible:ring-0 px-3"
        @blur="handleBlur"
      />
    </template>

    <!-- Long text type -->
    <template v-else-if="property.type === 'long_text' && !isActive">
      <div class="flex items-center px-3 py-2">
        <span v-if="hasValue" class="truncate">{{ displayValue }}</span>
        <span v-else class="text-muted-foreground text-sm flex items-center">
          <span v-if="record._isNewRecord">
            {{ isRequired ? property.displayName + ' *' : property.displayName }}
          </span>
          <span v-else>-</span>
        </span>
      </div>
    </template>

    <template v-else-if="property.type === 'long_text' && isActive">
      <Textarea
        ref="inputRef"
        v-model="safeStringValue"
        :placeholder="property.displayName"
        class="border-none shadow-none focus-visible:ring-0 px-3 min-h-[80px]"
        @blur="handleBlur"
      />
    </template>

    <!-- File type (simplified for now) -->
    <template v-else-if="property.type === 'file'">
      <div class="flex items-center px-3 py-2">
        <div v-if="arrayValue.length > 0" class="flex items-center gap-1">
          <Icon name="lucide:paperclip" class="h-4 w-4 text-muted-foreground" />
          <span class="text-sm">{{ arrayValue.length }} file(s)</span>
        </div>
        <span v-else class="text-muted-foreground text-sm flex items-center">
          <span v-if="record._isNewRecord">
            {{ isRequired ? property.displayName + ' *' : property.displayName }}
          </span>
          <span v-else>-</span>
        </span>
      </div>
    </template>

    <!-- Default fallback -->
    <template v-else>
      <div class="flex items-center px-3 py-2">
        <span v-if="hasValue" class="truncate">{{ displayValue }}</span>
        <span v-else class="text-muted-foreground text-sm flex items-center">
          <span v-if="record._isNewRecord">
            {{ isRequired ? property.displayName + ' *' : property.displayName }}
          </span>
          <span v-else>-</span>
        </span>
      </div>
    </template>

    <!-- Required field indicator -->
    <div
v-if="isRequired && record._isNewRecord && !hasValue" 
         class="absolute -top-1 -right-1">
      <div class="h-2 w-2 bg-destructive rounded-full"/>
    </div>

    <!-- Validation errors -->
    <div
v-if="validationErrors.length > 0" 
         class="absolute top-full left-0 z-50 mt-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
      {{ validationErrors[0] }}
    </div>

    <!-- Saving indicator (only show when actually saving) -->
    <!-- This will be enhanced in future iterations -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useFocus, useActiveElement, useEventListener } from '@vueuse/core'
import type { EditableCellProps, EditableRecord } from '../../types/inline-editing'
import type { PropertyValue } from '~/types'
import { DatePicker } from '@foundation/components/ui/date-picker'

const props = defineProps<EditableCellProps>()
const emit = defineEmits<{
  focus: []
  blur: []
  change: [value: PropertyValue]
  navigate: [direction: 'up' | 'down' | 'left' | 'right' | 'tab' | 'shift-tab']
  cancel: [] // 新規レコード作成をキャンセル
}>()

const { locale } = useI18n()
const inputRef = ref<HTMLElement>()
const localValue = ref(props.value)

// PropertyValue型ガード関数
const isStringValue = (value: PropertyValue): value is string => 
  typeof value === 'string'
const isNumberValue = (value: PropertyValue): value is number => 
  typeof value === 'number'
const isBooleanValue = (value: PropertyValue): value is boolean => 
  typeof value === 'boolean'
const isStringArrayValue = (value: PropertyValue): value is string[] => 
  Array.isArray(value) && value.every(item => typeof item === 'string')

// UIコンポーネント用の型安全な値（読み書き可能）
const safeStringValue = computed({
  get: () => isStringValue(localValue.value) ? localValue.value : '',
  set: (value) => { localValue.value = value }
})
const safeNumberValue = computed({
  get: () => isNumberValue(localValue.value) ? localValue.value : 0,
  set: (value) => { localValue.value = value }
})
const safeBooleanValue = computed(() => 
  isBooleanValue(props.value) ? props.value : false
)
const safeStringArrayValue = computed(() => 
  isStringArrayValue(props.value) ? props.value : []
)

// VueUse でフォーカス管理
const { focused } = useFocus(inputRef, { 
  initialValue: false 
})

// 型チェック用computed
const isTextType = computed(() => 
  ['text'].includes(props.property.type)
)
const isNumberType = computed(() => 
  ['number'].includes(props.property.type)
)
const isDateType = computed(() => 
  ['date', 'datetime'].includes(props.property.type)
)

// 必須フィールドかどうか
const isRequired = computed(() => 
  props.property.required === true
)

// バリデーションエラーの取得
const validationErrors = computed(() => {
  if (props.record._isNewRecord) {
    const editableRecord = props.record as EditableRecord
    return editableRecord._validationErrors?.[props.property.key] || []
  }
  return []
})

// 値が存在するかを正確にチェック
const hasValue = computed(() => {
  // アクティブ状態では localValue も考慮
  const valueToCheck = props.isActive ? localValue.value : props.value
  
  // CHECKBOX type: false も有効な値として扱う
  if (props.property.type === 'checkbox') {
    return valueToCheck !== null && valueToCheck !== undefined
  }
  
  // NUMBER type: 0 も有効な値として扱う
  if (props.property.type === 'number') {
    return valueToCheck !== null && valueToCheck !== undefined && valueToCheck !== ''
  }
  
  // 配列の場合は長さをチェック
  if (Array.isArray(valueToCheck)) {
    return valueToCheck.length > 0
  }
  
  // オブジェクトの場合は空オブジェクトをチェック
  if (valueToCheck && typeof valueToCheck === 'object') {
    return Object.keys(valueToCheck).length > 0
  }
  
  // その他の型: null, undefined, 空文字は false
  return valueToCheck !== null && valueToCheck !== undefined && valueToCheck !== ''
})

// 表示値の計算
const displayValue = computed(() => {
  // 値が存在しない場合
  if (!hasValue.value) {
    return ''
  }
  
  // アクティブ状態では localValue を、そうでなければ props.value を使用
  const valueToFormat = props.isActive ? localValue.value : props.value
  
  // プロパティタイプに応じてフォーマット
  switch (props.property.type) {
    case 'text':
    case 'long_text':
      return String(valueToFormat)
    
    case 'number':
      return formatNumber(Number(valueToFormat))
    
    case 'date':
    case 'datetime':
      return formatDate(String(valueToFormat))
    
    case 'checkbox':
      return valueToFormat ? 'Yes' : 'No'
    
    case 'select':
      return getSelectOptionLabel(String(valueToFormat))
    
    case 'url':
      try {
        const url = new URL(String(valueToFormat))
        return url.hostname
      } catch {
        return String(valueToFormat)
      }
    
    case 'email':
      return String(valueToFormat)
    
    default:
      return String(valueToFormat)
  }
})

// 配列値（MULTI_SELECT, FILE用）
const arrayValue = computed(() => {
  if (Array.isArray(props.value)) return props.value
  if (typeof props.value === 'string' && props.value.includes(',')) {
    return props.value.split(',').map(v => v.trim()).filter(Boolean)
  }
  return []
})

// Select用のオプション
const selectOptions = computed(() => {
  const config = props.property.config as { options?: Array<{ value: string; label?: string; color?: string } | string> }
  if (config?.options && Array.isArray(config.options)) {
    return config.options.map((opt) => {
      if (typeof opt === 'string') {
        return {
          value: opt,
          label: opt,
          color: undefined
        }
      }
      return {
        value: opt.value,
        label: opt.label || opt.value,
        color: opt.color // 色情報も含める
      }
    })
  }
  return []
})

// Select option helpers for colored badges
const getSelectOptions = () => {
  const config = props.property.config as { options?: Array<{ value: string; label: string; color?: string }> }
  return config?.options || []
}

const getSelectOptionByValue = (value: string) => {
  return getSelectOptions().find(opt => opt.value === value)
}

const getSelectOptionLabel = (value: string) => {
  const option = getSelectOptionByValue(value)
  return option?.label || value
}

const getSelectOptionStyle = (value: string) => {
  const option = getSelectOptionByValue(value)
  if (!option?.color) {
    return { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1', color: '#475569' }
  }
  
  return {
    backgroundColor: option.color + '20',
    borderColor: option.color,
    color: option.color
  }
}

// 密度に応じたクラス
const densityClass = computed(() => {
  switch (props.density) {
    case 'compact': return 'text-sm'
    case 'comfortable': return 'text-base py-1'
    default: return 'text-sm'
  }
})

// ローカル値とプロパティ値の同期
watch(() => props.value, (newValue) => {
  localValue.value = newValue
}, { immediate: true })

// セルクリック時の処理
const handleCellClick = () => {
  if (!props.isActive) {
    emit('focus')
  }
}

// VueUse でフォーカス状態の同期
watch(() => props.isActive, (isActive) => {
  focused.value = isActive
}, { immediate: true })

// フォーカス状態の変更を監視してイベント発火
watch(focused, (isFocused) => {
  if (isFocused && !props.isActive) {
    // フォーカスされた時にアクティブでない場合、フォーカスイベントを発火
    emit('focus')
  }
})

// VueUse でキーボードイベント処理
useEventListener(inputRef, 'keydown', (event: KeyboardEvent) => {
  // アクティブ状態の時のみキーボード処理を実行
  if (props.isActive) {
    handleKeydown(event)
  }
})

// ブラー時の処理
const handleBlur = () => {
  if (localValue.value !== props.value) {
    emit('change', localValue.value)
  }
  emit('blur')
}

// チェックボックス変更時の処理
const handleCheckboxChange = (checked: boolean) => {
  emit('change', checked)
}

// セレクト変更時の処理
const handleSelectChange = (value: PropertyValue) => {
  emit('change', value)
  emit('blur')
}

// キーボード操作の処理
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
      event.preventDefault()
      if (localValue.value !== props.value) {
        emit('change', localValue.value)
      }
      emit('navigate', 'down')
      break
    case 'Tab':
      event.preventDefault()
      if (localValue.value !== props.value) {
        emit('change', localValue.value)
      }
      emit('navigate', event.shiftKey ? 'shift-tab' : 'tab')
      break
    case 'Escape':
      event.preventDefault()
      localValue.value = props.value // リセット
      
      // 新規レコード作成中の場合はキャンセル
      if (props.record._isNewRecord && !hasAnyValue()) {
        emit('cancel')
      } else {
        emit('blur')
      }
      break
    case 'ArrowUp':
      if (!['long_text'].includes(props.property.type)) {
        event.preventDefault()
        emit('navigate', 'up')
      }
      break
    case 'ArrowDown':
      if (!['long_text'].includes(props.property.type)) {
        event.preventDefault()
        emit('navigate', 'down')
      }
      break
    default:
      // Other keys - no action needed
      break
  }
}

// 新規レコードに何か値があるかをチェック
const hasAnyValue = () => {
  if (!props.record._isNewRecord) return false
  
  const editableRecord = props.record as EditableRecord
  const data = editableRecord.data || {}
  return Object.values(data).some(value => 
    value !== null && value !== undefined && value !== '' && 
    !(Array.isArray(value) && value.length === 0)
  )
}

// フォーマッター関数
const formatNumber = (value: number) => {
  return new Intl.NumberFormat(locale.value).format(value)
}

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return format(date, 'PP', { locale: locale.value === 'ja' ? ja : undefined })
  } catch {
    return dateStr
  }
}

</script>

<style scoped>
/* Ensure EditableCell inherits sticky positioning from parent table cells */
.inherit-position {
  position: inherit !important;
  z-index: inherit !important;
  left: inherit !important;
  right: inherit !important;
  top: inherit !important;
  bottom: inherit !important;
}

/* Ensure proper background inheritance for pinned cells */
.inherit-position[style*="position: sticky"] {
  background: inherit !important;
  backdrop-filter: inherit !important;
}

/* Force background for pinned columns */
:deep(.pinned-column) .inherit-position {
  background: var(--background) !important;
}

/* Specific background inheritance for left/right pinned columns */
:deep(.pinned-left) .inherit-position,
:deep(.pinned-right) .inherit-position {
  background: var(--background) !important;
  border-right: 1px solid var(--border);
}

/* Header-specific background for pinned cells */
:deep(.bg-gray-100) .inherit-position {
  background: rgb(243 244 246) !important;
}

/* Fix layering issues with focus rings on pinned cells */
.inherit-position.ring-2 {
  z-index: calc(var(--z-index, 10) + 1) !important;
}
</style>