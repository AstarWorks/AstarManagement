<template>
  <div class="expense-additional-info-step space-y-6">
    <div class="text-center mb-6">
      <Icon name="lucide:file-plus" class="w-12 h-12 mx-auto mb-3 text-primary" />
      <h3 class="text-xl font-semibold mb-2">
        {{ t('expense.form.steps.additional') }}
      </h3>
      <p class="text-muted-foreground">
        {{ t('expense.form.steps.additionalDescription') }}
      </p>
    </div>

    <div class="space-y-6">
      <!-- Case Association Field -->
      <FormField v-slot="{ componentField }" name="caseId">
        <FormItem>
          <FormLabel for="caseId">
            {{ t('expense.form.fields.case') }}
          </FormLabel>
          <Select v-bind="componentField">
            <FormControl>
              <SelectTrigger>
                <SelectValue :placeholder="t('expense.form.placeholders.case')" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="">
                {{ t('expense.form.noCase') }}
              </SelectItem>
              <SelectItem 
                v-for="case_ in availableCases" 
                :key="case_.id"
                :value="case_.id"
              >
                <div class="flex items-center gap-2">
                  <Icon name="lucide:briefcase" class="w-4 h-4" />
                  {{ case_.name }}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <FormDescription>
            {{ t('expense.form.descriptions.case') }}
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <!-- Memo Field -->
      <FormField v-slot="{ componentField }" name="memo">
        <FormItem>
          <FormLabel for="memo">
            {{ t('expense.form.fields.memo') }}
          </FormLabel>
          <FormControl>
            <Textarea
              id="memo"
              v-bind="componentField"
              :placeholder="t('expense.form.placeholders.memo')"
              class="min-h-[120px] resize-none"
              maxlength="1000"
            />
          </FormControl>
          <div class="flex justify-between">
            <FormDescription>
              {{ t('expense.form.descriptions.memo') }}
            </FormDescription>
            <div class="text-xs text-muted-foreground">
              {{ (componentField.modelValue || '').length }}/1000
            </div>
          </div>
          <FormMessage />
        </FormItem>
      </FormField>

      <!-- Tags Field -->
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
                    v-for="tag in availableTags" 
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
      <div class="mt-4">
        <Label class="text-sm font-medium mb-3 block">
          {{ t('expense.form.quickTags') }}
        </Label>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            v-for="quickTag in quickTags"
            :key="quickTag.name"
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

      <!-- Attachment Upload Preview (Placeholder for S03_M003) -->
      <div class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
        <Icon name="lucide:upload-cloud" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p class="text-sm text-muted-foreground mb-1">
          {{ t('expense.form.attachmentPlaceholder') }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ t('expense.form.attachmentComingSoon') }}
        </p>
      </div>
    </div>

    <!-- Form Summary -->
    <div class="bg-muted/50 p-4 rounded-lg mt-6">
      <h4 class="font-medium mb-3 flex items-center gap-2">
        <Icon name="lucide:file-text" class="w-4 h-4" />
        {{ t('expense.form.summary') }}
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span class="font-medium">{{ t('expense.form.fields.case') }}:</span>
          <span class="ml-2 text-muted-foreground">
            {{ selectedCaseName || t('expense.form.noCase') }}
          </span>
        </div>
        <div>
          <span class="font-medium">{{ t('expense.form.fields.tags') }}:</span>
          <span class="ml-2 text-muted-foreground">
            {{ selectedTags.length > 0 
              ? selectedTags.map(t => t.name).join(', ') 
              : t('expense.form.noTags') 
            }}
          </span>
        </div>
        <div v-if="memoLength > 0" class="md:col-span-2">
          <span class="font-medium">{{ t('expense.form.fields.memo') }}:</span>
          <span class="ml-2 text-muted-foreground">
            {{ memoLength }} {{ t('expense.form.characters') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFieldValue, useField } from 'vee-validate'
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '~/components/ui/form'
import { Textarea } from '~/components/ui/textarea'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

// Composables
const { t } = useI18n()

// Form fields
const caseId = useFieldValue('caseId')
const memo = useFieldValue('memo')
const tagIds = useFieldValue<string[]>('tagIds')
const { setValue: setTagIds } = useField<string[]>('tagIds')

// Mock data for cases (in real implementation, these would come from API)
const availableCases = ref([
  { id: '1', name: '山田太郎 vs 株式会社ABC' },
  { id: '2', name: '債権回収案件（鈴木商店）' },
  { id: '3', name: '離婚調停（田中夫妻）' },
  { id: '4', name: '企業法務（XYZ株式会社）' }
])

// Mock data for tags (in real implementation, these would come from API)
const availableTags = ref([
  { id: 'tag1', name: '交通費' },
  { id: 'tag2', name: '東京' },
  { id: 'tag3', name: '大阪' },
  { id: 'tag4', name: '出張' },
  { id: 'tag5', name: '裁判所' },
  { id: 'tag6', name: 'クライアント面談' },
  { id: 'tag7', name: '緊急' },
  { id: 'tag8', name: '事務用品' }
])

// Quick tags for common legal practice scenarios
const quickTags = computed(() => [
  { id: 'tag1', name: '交通費', icon: 'lucide:car' },
  { id: 'tag4', name: '出張', icon: 'lucide:plane' },
  { id: 'tag5', name: '裁判所', icon: 'lucide:scale' },
  { id: 'tag6', name: 'クライアント面談', icon: 'lucide:users' }
])

// Computed properties
const selectedTagIds = computed(() => tagIds.value || [])
const selectedTags = computed(() => 
  availableTags.value.filter(tag => selectedTagIds.value.includes(tag.id))
)
const selectedCaseName = computed(() => 
  availableCases.value.find(case_ => case_.id === caseId.value)?.name
)
const memoLength = computed(() => ((memo.value as string) || '').length)

// Tag management
const addTag = (tagId: string) => {
  const currentIds = selectedTagIds.value
  if (!currentIds.includes(tagId)) {
    setTagIds([...currentIds, tagId])
  }
}

const removeTag = (tagId: string) => {
  const currentIds = selectedTagIds.value
  setTagIds(currentIds.filter(id => id !== tagId))
}
</script>