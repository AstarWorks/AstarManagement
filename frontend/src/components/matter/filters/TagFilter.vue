<script setup lang="ts">
import { ref, computed } from 'vue'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { cn } from '~/lib/utils'
import type { FilterConfig } from './FilterConfig'

interface Props {
  config: FilterConfig
  modelValue?: string[]
  disabled?: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  disabled: false,
  placeholder: 'Add tags...'
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  clear: []
}>()

const newTagInput = ref('')
const isPopoverOpen = ref(false)

// Common matter tags for suggestions
const commonTags = [
  'urgent', 'high-priority', 'litigation', 'contract', 'corporate',
  'family-law', 'real-estate', 'ip-law', 'criminal', 'immigration',
  'tax-law', 'employment', 'bankruptcy', 'personal-injury', 'estate'
]

const currentTags = computed(() => props.modelValue || [])

const availableTags = computed(() => {
  return commonTags.filter(tag => 
    !currentTags.value.includes(tag) &&
    tag.toLowerCase().includes(newTagInput.value.toLowerCase())
  )
})

const addTag = (tag: string) => {
  if (tag.trim() && !currentTags.value.includes(tag.trim())) {
    const newTags = [...currentTags.value, tag.trim()]
    emit('update:modelValue', newTags)
  }
  newTagInput.value = ''
  isPopoverOpen.value = false
}

const removeTag = (tagToRemove: string) => {
  const newTags = currentTags.value.filter(tag => tag !== tagToRemove)
  emit('update:modelValue', newTags)
}

const clearAllTags = () => {
  emit('clear')
  emit('update:modelValue', [])
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && newTagInput.value.trim()) {
    event.preventDefault()
    addTag(newTagInput.value.trim())
  }
}
</script>

<template>
  <div class="tag-filter space-y-2">
    <!-- Tag input popover -->
    <Popover v-model:open="isPopoverOpen">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          :class="cn(
            'w-full justify-start text-left font-normal',
            currentTags.length === 0 && 'text-muted-foreground'
          )"
          :disabled="disabled"
        >
          <Icon name="lucide:tag" class="mr-2 h-4 w-4" />
          <span v-if="currentTags.length === 0">
            {{ placeholder }}
          </span>
          <span v-else>
            {{ currentTags.length }} tag{{ currentTags.length === 1 ? '' : 's' }} selected
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-80 p-4">
        <div class="space-y-3">
          <div class="flex items-center space-x-2">
            <Input
              v-model="newTagInput"
              :placeholder="placeholder"
              class="flex-1"
              @keydown="handleKeyDown"
            />
            <Button
              size="sm"
              @click="addTag(newTagInput)"
              :disabled="!newTagInput.trim()"
            >
              Add
            </Button>
          </div>
          
          <!-- Suggested tags -->
          <div v-if="availableTags.length > 0" class="space-y-2">
            <p class="text-sm font-medium text-muted-foreground">
              Suggested tags:
            </p>
            <div class="flex flex-wrap gap-1">
              <Button
                v-for="tag in availableTags.slice(0, 10)"
                :key="tag"
                variant="outline"
                size="sm"
                class="h-6 px-2 text-xs"
                @click="addTag(tag)"
              >
                {{ tag }}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>

    <!-- Selected tags display -->
    <div v-if="currentTags.length > 0" class="flex flex-wrap gap-1">
      <Badge
        v-for="tag in currentTags"
        :key="tag"
        variant="secondary"
        class="gap-1"
      >
        <Icon name="lucide:tag" class="h-3 w-3" />
        {{ tag }}
        <Button
          variant="ghost"
          size="sm"
          class="h-auto p-0 ml-1 hover:bg-transparent"
          @click="removeTag(tag)"
          :disabled="disabled"
        >
          <Icon name="lucide:x" class="h-3 w-3" />
          <span class="sr-only">Remove {{ tag }} tag</span>
        </Button>
      </Badge>
      
      <!-- Clear all button -->
      <Button
        variant="ghost"
        size="sm"
        class="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        @click="clearAllTags"
        :disabled="disabled"
      >
        Clear all
      </Button>
    </div>
  </div>
</template>

<style scoped>
.tag-filter {
  @apply w-full;
}
</style>