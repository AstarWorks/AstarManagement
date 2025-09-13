<template>
  <Card 
    class="hover:shadow-lg transition-all duration-200 cursor-pointer group"
    @click="$emit('click')"
  >
    <CardHeader>
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <CardTitle class="truncate">{{ table.name }}</CardTitle>
          <CardDescription v-if="table.description" class="line-clamp-2 mt-1">
            {{ table.description }}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger @click.stop>
            <Button 
              variant="ghost" 
              size="icon"
              class="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Icon name="lucide:more-vertical" class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click.stop="$emit('edit')">
              <Icon name="lucide:edit" class="mr-2 h-4 w-4" />
              {{ $t('foundation.actions.basic.edit') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click.stop="$emit('duplicate')">
              <Icon name="lucide:copy" class="mr-2 h-4 w-4" />
              {{ $t('foundation.actions.data.duplicate') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click.stop="copyTableId">
              <Icon name="lucide:clipboard" class="mr-2 h-4 w-4" />
              {{ $t('foundation.actions.data.copy') }} ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              class="text-destructive"
              @click.stop="$emit('delete')"
            >
              <Icon name="lucide:trash" class="mr-2 h-4 w-4" />
              {{ $t('foundation.actions.basic.delete') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    <CardContent>
      <div class="space-y-3">
        <!-- Property Pills -->
        <div v-if="propertyCount > 0" class="flex flex-wrap gap-1">
          <Badge 
            v-for="(prop, key) in firstProperties" 
            :key="key"
            variant="secondary"
            class="text-xs"
          >
            {{ prop.displayName || key }}
          </Badge>
          <Badge 
            v-if="remainingProperties > 0"
            variant="outline"
            class="text-xs"
          >
            +{{ remainingProperties }}
          </Badge>
        </div>
        
        <!-- Stats -->
        <div class="flex items-center gap-4 text-sm text-muted-foreground">
          <div class="flex items-center gap-1">
            <Icon name="lucide:database" class="h-3.5 w-3.5" />
            <span>{{ recordCount }} {{ $t('foundation.common.fields.count') }}</span>
          </div>
          <div class="flex items-center gap-1">
            <Icon name="lucide:columns" class="h-3.5 w-3.5" />
            <span>{{ propertyCount }} {{ $t('modules.table.fields.properties') }}</span>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="flex items-center justify-between pt-2 border-t">
          <span class="text-xs text-muted-foreground">
            {{ formatRelativeTime(table.updatedAt || table.createdAt || '') }}
          </span>
          <Button
            variant="ghost"
            size="sm"
            class="h-7 text-xs"
            @click.stop="$emit('click')"
          >
            {{ $t('foundation.actions.basic.open') }}
            <Icon name="lucide:arrow-right" class="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { toast } from 'vue-sonner'
import type { TableResponse } from '../types'

const props = defineProps<{
  table: TableResponse
}>()

defineEmits<{
  click: []
  edit: []
  duplicate: []
  delete: []
}>()

const { t, locale } = useI18n()
const { copy } = useClipboard()

// Computed
const propertyCount = computed(() => 
  Object.keys(props.table.properties || {}).length
)

const recordCount = computed(() => {
  if ('recordCount' in props.table && typeof props.table.recordCount === 'number') {
    return props.table.recordCount
  }
  return 0
})

const firstProperties = computed(() => {
  const properties = props.table.properties || {}
  const entries = Object.entries(properties)
  return Object.fromEntries(entries.slice(0, 3))
})

const remainingProperties = computed(() => 
  Math.max(0, propertyCount.value - 3)
)

// Methods
const formatRelativeTime = (date: string) => {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { 
    addSuffix: true,
    locale: locale.value === 'ja' ? ja : undefined
  })
}

const copyTableId = () => {
  if (props.table.id) {
    copy(props.table.id)
    toast.success(t('foundation.messages.success.copied'))
  }
}
</script>