<template>
  <FormField name="tagIds">
    <FormItem>
      <FormLabel for="tagIds">
        {{ t('expense.form.fields.tags') }}
      </FormLabel>
      <FormControl>
        <div class="space-y-3">
          <!-- Selected Tags Display -->
          <div v-if="selectedTags.length > 0" class="flex flex-wrap gap-2">
            <Badge
              v-for="tag in selectedTags"
              :key="tag.id"
              variant="secondary"
              class="flex items-center gap-1"
            >
              {{ tag.name }}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="h-4 w-4 p-0 ml-1"
                @click="removeTag(tag.id)"
              >
                <Icon name="lucide:x" class="h-3 w-3" />
              </Button>
            </Badge>
          </div>
          
          <!-- Tag Selection -->
          <Select @value-change="addTag">
            <SelectTrigger>
              <SelectValue :placeholder="t('expense.form.placeholders.tags')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem 
                v-for="tag in tagOptions" 
                :key="tag.id"
                :value="tag.id"
                :disabled="selectedTagIds.includes(tag.id)"
              >
                <div class="flex items-center gap-2">
                  <Icon name="lucide:tag" class="w-4 h-4" />
                  {{ tag.name }}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormControl>
      <FormDescription>
        {{ t('expense.form.descriptions.tags') }}
      </FormDescription>
      <FormMessage />
    </FormItem>
  </FormField>

  <!-- Quick Tags -->
  <div v-if="showQuickTags" class="mt-4">
    <Label class="text-sm font-medium mb-3 block">
      {{ t('expense.form.quickTags') }}
    </Label>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
      <Button
        v-for="quickTag in quickTags"
        :key="quickTag.id"
        type="button"
        variant="outline"
        size="sm"
        class="text-xs"
        :disabled="selectedTagIds.includes(quickTag.id)"
        @click="addTag(quickTag.id)"
      >
        <Icon :name="quickTag.icon" class="w-3 h-3 mr-1" />
        {{ quickTag.name }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useFieldValue, useField } from 'vee-validate'
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '~/components/ui/form'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useExpenseTags } from '~/composables/useExpenseTags'

// Props
interface Props {
  showQuickTags?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  showQuickTags: true
})

// Composables
const { t } = useI18n()
const { 
  tagOptions, 
  loadTags, 
  addTagToList, 
  removeTagFromList, 
  getTagsByIds 
} = useExpenseTags()

// Form fields
const tagIds = useFieldValue<string[]>('tagIds')
const { setValue: setTagIds } = useField<string[]>('tagIds')

// Computed properties
const selectedTagIds = computed(() => tagIds.value || [])
const selectedTags = computed(() => getTagsByIds(selectedTagIds.value))

// Quick tags for common legal practice scenarios
const quickTags = computed(() => [
  { id: 'tag1', name: t('expense.tags.transportation'), icon: 'lucide:car' },
  { id: 'tag4', name: t('expense.tags.business_trip'), icon: 'lucide:plane' },
  { id: 'tag5', name: t('expense.tags.court'), icon: 'lucide:scale' },
  { id: 'tag6', name: t('expense.tags.client_meeting'), icon: 'lucide:users' }
])

// Tag management methods
const addTag = (tagId: string) => {
  addTagToList(tagId, selectedTagIds.value, setTagIds)
}

const removeTag = (tagId: string) => {
  removeTagFromList(tagId, selectedTagIds.value, setTagIds)
}

// Load tags on mount
onMounted(async () => {
  await loadTags()
})
</script>