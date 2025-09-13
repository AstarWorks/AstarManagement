<template>
  <div
    class="group relative"
    :class="densityClass"
  >
    <!-- Text types -->
    <template v-if="isTextType">
      <span class="truncate">{{ displayValue }}</span>
    </template>

    <!-- Number types -->
    <template v-else-if="isNumberType">
      <span class="tabular-nums">{{ displayValue }}</span>
    </template>

    <!-- Boolean type -->
    <template v-else-if="property.type === 'checkbox'">
      <Checkbox
        :checked="Boolean(value)"
        disabled
      />
    </template>

    <!-- Date types -->
    <template v-else-if="isDateType">
      <span class="text-sm">{{ displayValue }}</span>
    </template>

    <!-- Select type -->
    <template v-else-if="property.type === 'select'">
      <Badge 
        :style="getSelectOptionStyle(value as string)"
        class="font-medium border"
      >
        {{ getSelectOptionLabel(value as string) }}
      </Badge>
    </template>

    <!-- Multi-select type -->
    <template v-else-if="property.type === 'multi_select'">
      <div class="flex flex-wrap gap-1">
        <Badge
          v-for="item in arrayValue"
          :key="item"
          :style="getSelectOptionStyle(item)"
          class="text-xs border"
        >
          {{ getSelectOptionLabel(item) }}
        </Badge>
      </div>
    </template>

    <!-- URL type -->
    <template v-else-if="property.type === 'url'">
      <a
        v-if="value"
        :href="String(value)"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary hover:underline"
      >
        <Icon name="lucide:external-link" class="mr-1 inline h-3 w-3" />
        {{ displayValue }}
      </a>
      <span v-else class="text-muted-foreground">-</span>
    </template>

    <!-- Email type -->
    <template v-else-if="property.type === 'email'">
      <a
        v-if="value"
        :href="`mailto:${value}`"
        class="text-primary hover:underline"
      >
        {{ displayValue }}
      </a>
      <span v-else class="text-muted-foreground">-</span>
    </template>

    <!-- Relation type -->
    <template v-else-if="property.type === 'text'">
      <Button
        v-if="value"
        variant="link"
        size="sm"
        class="h-auto p-0"
        @click="$emit('navigate', String(value))"
      >
        {{ displayValue }}
      </Button>
      <span v-else class="text-muted-foreground">-</span>
    </template>

    <!-- File type -->
    <template v-else-if="property.type === 'file'">
      <div v-if="arrayValue.length > 0" class="flex items-center gap-1">
        <Icon name="lucide:paperclip" class="h-4 w-4 text-muted-foreground" />
        <span class="text-sm">{{ arrayValue.length }} file(s)</span>
      </div>
      <span v-else class="text-muted-foreground">-</span>
    </template>

    <!-- Relation type -->
    <template v-else-if="property.type === 'relation'">
      <Tooltip>
        <TooltipTrigger as-child>
          <div v-if="relationRecord" class="flex items-center gap-1">
            <Icon name="lucide:link-2" class="h-4 w-4 text-muted-foreground" />
            <NuxtLink 
              :to="`/tables/${property.config?.targetTableId}/records/${value}`"
              class="text-sm text-primary hover:underline cursor-pointer"
            >
              {{ relationDisplayValue }}
            </NuxtLink>
          </div>
        </TooltipTrigger>
        <TooltipContent v-if="relationRecord" side="top" class="max-w-xs">
          <div class="space-y-1">
            <div class="font-medium">{{ relationDisplayValue }}</div>
            <div v-if="relationPreviewData" class="text-xs text-muted-foreground space-y-0.5">
              <div v-for="(value, key) in relationPreviewData" :key="key">
                <span class="font-medium">{{ key }}:</span> {{ value }}
              </div>
            </div>
            <div class="text-xs text-muted-foreground">
              ID: {{ relationRecord.id }}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
      <span v-if="!relationRecord && loadingRelation" class="text-muted-foreground">
        <Icon name="lucide:loader-2" class="h-4 w-4 animate-spin" />
      </span>
      <span v-else-if="!relationRecord" class="text-muted-foreground">-</span>
    </template>

    <!-- Default fallback -->
    <template v-else>
      <span>{{ displayValue }}</span>
    </template>

    <!-- Quick edit button (shown on hover) -->
    <Button
      v-if="editable && !isReadOnly"
      variant="ghost"
      size="icon"
      class="absolute -right-2 top-1/2 hidden h-6 w-6 -translate-y-1/2 group-hover:inline-flex"
      @click="$emit('edit')"
    >
      <Icon name="lucide:edit-2" class="h-3 w-3" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { PropertyDefinitionDto } from '../../types'

// Props
const props = withDefaults(defineProps<{
  value: unknown
  property: PropertyDefinitionDto
  density?: 'compact' | 'normal' | 'comfortable'
  editable?: boolean
}>(), {
  density: 'normal',
  editable: true
})

// Emits - using $emit in template instead of emit variable
defineEmits<{
  edit: []
  navigate: [id: string]
}>()

// Composables
const { locale } = useI18n()
const table = useTable()

// Relation handling
const relationRecord = ref<{ id?: string; data?: Record<string, unknown> } | null>(null)
const loadingRelation = ref(false)
const relationDisplayValue = computed(() => {
  if (!relationRecord.value) return ''
  const displayField = (props.property.config?.displayField || 'name') as string
  return relationRecord.value.data?.[displayField] || relationRecord.value.id || ''
})

// Preview data for tooltip
const relationPreviewData = computed(() => {
  if (!relationRecord.value?.data) return null
  
  const data = relationRecord.value.data
  const previewFields: Record<string, unknown> = {}
  const maxFields = 3
  let count = 0
  
  // Get first few fields that are not the display field
  const displayField = (props.property.config?.displayField || 'name') as string
  for (const [key, value] of Object.entries(data)) {
    if (count >= maxFields) break
    if (key === displayField) continue
    if (value !== null && value !== undefined && value !== '') {
      // Format the value for preview
      if (typeof value === 'object') continue
      if (typeof value === 'boolean') {
        previewFields[key] = value ? '✓' : '✗'
      } else if (typeof value === 'number') {
        previewFields[key] = value.toLocaleString()
      } else {
        const strValue = String(value)
        previewFields[key] = strValue.length > 50 ? strValue.substring(0, 50) + '...' : strValue
      }
      count++
    }
  }
  
  return Object.keys(previewFields).length > 0 ? previewFields : null
})

// Load relation data when component mounts or value changes
const loadRelationData = async () => {
  if (props.property.type !== 'relation' || !props.value) return
  
  loadingRelation.value = true
  try {
    const recordId = props.value as string
    const targetTableId = props.property.config?.targetTableId
    
    if (targetTableId && recordId) {
      // Try to get from cache first
      const cacheKey = `relation_${targetTableId}_${recordId}`
      const cached = relationCache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
        relationRecord.value = cached.data as { id?: string; data?: Record<string, unknown> } | null
      } else {
        const record = await table.getRecord(recordId)
        relationRecord.value = record
        
        // Cache the result
        relationCache.set(cacheKey, {
          data: record,
          timestamp: Date.now()
        })
      }
    }
  } catch (error) {
    console.error('Failed to load relation record:', error)
    relationRecord.value = null
  } finally {
    loadingRelation.value = false
  }
}

// Simple in-memory cache for relation records
const relationCache = new Map<string, { data: unknown; timestamp: number }>()

// Watch for changes
watch(() => props.value, () => {
  if (props.property.type === 'relation') {
    loadRelationData()
  }
}, { immediate: true })

// Helper functions
const getStatusVariant = (value: string) => {
  const lowerValue = value?.toLowerCase() || ''
  
  // Success variants (green)
  if (lowerValue.includes('支払済') || lowerValue.includes('完了') || lowerValue.includes('成功') || 
      lowerValue.includes('paid') || lowerValue.includes('complete') || lowerValue.includes('success')) {
    return 'success'
  }
  
  // Warning variants (yellow)
  if (lowerValue.includes('処理中') || lowerValue.includes('確認中') || lowerValue.includes('pending') || 
      lowerValue.includes('processing') || lowerValue.includes('review')) {
    return 'warning'
  }
  
  // Error variants (red)
  if (lowerValue.includes('未払') || lowerValue.includes('エラー') || lowerValue.includes('失敗') || 
      lowerValue.includes('unpaid') || lowerValue.includes('error') || lowerValue.includes('failed')) {
    return 'destructive'
  }
  
  // Default
  return 'secondary'
}

// Computed
const isTextType = computed(() => {
  return ['text', 'long_text'].includes(props.property.type)
})

const isNumberType = computed(() => {
  return props.property.type === 'number'
})

const isDateType = computed(() => {
  return ['date', 'datetime'].includes(props.property.type)
})

const isReadOnly = computed(() => {
  return props.property.config?.readOnly === true
})

const arrayValue = computed(() => {
  if (Array.isArray(props.value)) {
    return props.value
  }
  if (props.value && props.property.type === 'multi_select') {
    return String(props.value).split(',').map(v => v.trim())
  }
  return []
})

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') {
    return '-'
  }

  // Format based on type
  switch (props.property.type) {
    case 'long_text': {
      // Truncate long text
      const text = String(props.value)
      return text.length > 100 ? text.substring(0, 100) + '...' : text
    }

    case 'number': {
      // Check if it's currency, percent or plain number based on property key or config
      const config = props.property.config as { currency?: string; format?: string } | undefined
      if (config?.currency || props.property.key?.includes('price') || props.property.key?.includes('amount') || props.property.key?.includes('金額')) {
        // Use ¥ symbol with comma separator format
        const value = Number(props.value) || 0
        return `¥${value.toLocaleString('ja-JP')}`
      } else if (props.property.key?.includes('percent') || props.property.key?.includes('progress')) {
        return `${Number(props.value)}%`
      } else {
        return Number(props.value).toLocaleString('ja-JP')
      }
    }

    case 'date': {
      try {
        const date = typeof props.value === 'string' ? parseISO(props.value) : new Date(props.value as string | number | Date)
        // Use YYYY-MM-DD format as shown in the design
        return format(date, 'yyyy-MM-dd')
      } catch {
        return String(props.value)
      }
    }

    case 'datetime': {
      try {
        const date = typeof props.value === 'string' ? parseISO(props.value) : new Date(props.value as string | number | Date)
        // Check if it's time-only based on property key
        if (props.property.key?.includes('time') && !props.property.key?.includes('datetime')) {
          return format(date, 'p', {
            locale: locale.value === 'ja' ? ja : undefined
          })
        } else {
          return format(date, 'PPpp', {
            locale: locale.value === 'ja' ? ja : undefined
          })
        }
      } catch {
        return String(props.value)
      }
    }

    case 'select': {
      const selectConfig = props.property.config as { options?: Array<{ value: string; label: string }> }
      const option = selectConfig?.options?.find(opt => opt.value === props.value)
      return option?.label || String(props.value)
    }

    case 'url': {
      try {
        const url = new URL(String(props.value))
        return url.hostname
      } catch {
        return String(props.value)
      }
    }

    case 'text':
      try {
        return JSON.stringify(props.value, null, 2)
      } catch {
        return String(props.value)
      }

    default:
      return String(props.value)
  }
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

const densityClass = computed(() => {
  switch (props.density) {
    case 'compact':
      return 'py-0.5'
    case 'comfortable':
      return 'py-2'
    default:
      return 'py-1'
  }
})
</script>