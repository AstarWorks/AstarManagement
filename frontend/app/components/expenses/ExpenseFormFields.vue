<template>
  <div class="expense-form-fields space-y-4">
    <!-- Date Field -->
    <FormField v-slot="{ componentField }" name="date">
      <FormItem>
        <FormLabel>{{ t('expense.form.fields.date') }}</FormLabel>
        <FormControl>
          <Input 
            type="date" 
            v-bind="componentField" 
            :disabled="disabled"
            @blur="handleFieldBlur('date', componentField.modelValue)"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Category Field -->
    <FormField v-slot="{ componentField }" name="category">
      <FormItem>
        <FormLabel>{{ t('expense.form.fields.category') }}</FormLabel>
        <Select v-bind="componentField" :disabled="disabled || categoriesLoading">
          <FormControl>
            <SelectTrigger>
              <SelectValue :placeholder="t('expense.form.placeholders.category')" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem 
              v-for="category in categoryOptions" 
              :key="category.value"
              :value="category.value"
            >
              {{ category.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
        <!-- Loading state for categories -->
        <div v-if="categoriesLoading" class="text-xs text-muted-foreground mt-1">
          {{ t('common.loading') }}...
        </div>
      </FormItem>
    </FormField>

    <!-- Description Field -->
    <FormField v-slot="{ componentField }" name="description">
      <FormItem>
        <FormLabel>{{ t('expense.form.fields.description') }}</FormLabel>
        <FormControl>
          <Input 
            type="text"
            :placeholder="t('expense.form.placeholders.description')"
            v-bind="componentField"
            :disabled="disabled"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Income Amount Field -->
    <FormField v-slot="{ componentField }" name="incomeAmount">
      <FormItem>
        <FormLabel>{{ t('expense.form.fields.incomeAmount') }}</FormLabel>
        <FormControl>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
            <Input 
              type="number"
              min="0"
              class="pl-8"
              :placeholder="t('expense.form.placeholders.amount')"
              v-bind="componentField"
              :disabled="disabled"
              @input="formHelpers.handleAmountInput($event, 'incomeAmount', handleAmountFieldChange)"
              @blur="handleFieldBlur('incomeAmount', componentField.modelValue)"
            />
            <!-- Amount display helper -->
            <div
v-if="componentField.modelValue && componentField.modelValue > 0" 
                 class="text-xs text-muted-foreground mt-1">
              {{ formHelpers.formatAmountDisplay(componentField.modelValue) }}
            </div>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Expense Amount Field -->
    <FormField v-slot="{ componentField }" name="expenseAmount">
      <FormItem>
        <FormLabel>{{ t('expense.form.fields.expenseAmount') }}</FormLabel>
        <FormControl>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
            <Input 
              type="number"
              min="0"
              class="pl-8"
              :placeholder="t('expense.form.placeholders.amount')"
              v-bind="componentField"
              :disabled="disabled"
              @input="formHelpers.handleAmountInput($event, 'expenseAmount', handleAmountFieldChange)"
              @blur="handleFieldBlur('expenseAmount', componentField.modelValue)"
            />
            <!-- Amount display helper -->
            <div
v-if="componentField.modelValue && componentField.modelValue > 0" 
                 class="text-xs text-muted-foreground mt-1">
              {{ formHelpers.formatAmountDisplay(componentField.modelValue) }}
            </div>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Case Field (Optional) -->
    <FormField v-slot="{ componentField }" name="caseId">
      <FormItem>
        <FormLabel>{{ t('expense.form.fields.case') }}</FormLabel>
        <Select v-bind="componentField" :disabled="disabled">
          <FormControl>
            <SelectTrigger>
              <SelectValue :placeholder="t('expense.form.placeholders.case')" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="">{{ t('common.none') }}</SelectItem>
            <!-- TODO: Cases will be loaded dynamically from API -->
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Tags Field -->
    <FormField v-slot="{ value, handleChange }" name="tagIds">
      <FormItem>
        <FormLabel>{{ t('expense.form.fields.tags') }}</FormLabel>
        <FormControl>
          <div class="space-y-2">
            <!-- Selected tags display -->
            <div v-if="(value || []).length > 0" class="flex flex-wrap gap-2">
              <Badge 
                v-for="tagId in (value || [])" 
                :key="tagId"
                variant="secondary"
                :style="{ backgroundColor: tagHelpers.getTagColor(tagId) + '20', borderColor: tagHelpers.getTagColor(tagId) }"
                class="cursor-pointer hover:opacity-75 transition-opacity"
                @click="!disabled && handleTagRemove(tagId, value, handleChange)"
              >
                {{ tagHelpers.getTagName(tagId) }}
                <Icon v-if="!disabled" name="lucide:x" class="w-3 h-3 ml-1" />
              </Badge>
            </div>
            <!-- Add tag button -->
            <Button
              v-if="!disabled"
              type="button"
              variant="outline"
              size="sm"
              :disabled="tagsLoading"
              @click="emit('openTagSelector')"
            >
              <Icon name="lucide:plus" class="w-4 h-4 mr-1" />
              {{ t('expense.actions.addTag') }}
            </Button>
            <!-- Loading state -->
            <div v-if="tagsLoading" class="text-xs text-muted-foreground">
              {{ t('common.loading') }}...
            </div>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Memo Field -->
    <FormField v-slot="{ componentField }" name="memo">
      <FormItem>
        <FormLabel>{{ t('expense.form.fields.memo') }}</FormLabel>
        <FormControl>
          <Textarea 
            :placeholder="t('expense.form.placeholders.memo')"
            rows="3"
            v-bind="componentField"
            :disabled="disabled"
            @blur="handleFieldBlur('memo', componentField.modelValue)"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Attachments Field -->
    <FormField v-slot="{ value, handleChange }" name="attachmentIds">
      <FormItem>
        <FormLabel>{{ t('expense.form.fields.attachments') }}</FormLabel>
        <FormControl>
          <div class="space-y-2">
            <!-- Attachment list -->
            <div v-if="(value || []).length > 0" class="space-y-2">
              <div 
                v-for="attachmentId in (value || [])" 
                :key="attachmentId"
                class="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div class="flex items-center space-x-3">
                  <Icon 
                    :name="getAttachmentIcon(attachmentId)" 
                    class="w-4 h-4 text-muted-foreground" 
                  />
                  <div class="flex flex-col">
                    <span class="text-sm font-medium">{{ attachmentHelpers.getAttachmentName(attachmentId) }}</span>
                    <span class="text-xs text-muted-foreground">{{ getAttachmentSize(attachmentId) }}</span>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    :title="t('expense.actions.downloadAttachment')"
                    @click="handleAttachmentDownload(attachmentId)"
                  >
                    <Icon name="lucide:download" class="w-4 h-4" />
                  </Button>
                  <Button
                    v-if="!disabled"
                    type="button"
                    variant="ghost"
                    size="sm"
                    :title="t('expense.actions.removeAttachment')"
                    @click="handleAttachmentRemove(attachmentId, value, handleChange)"
                  >
                    <Icon name="lucide:x" class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <!-- Upload button -->
            <Button
              v-if="!disabled"
              type="button"
              variant="outline"
              size="sm"
              :disabled="attachmentsUploading"
              @click="emit('openAttachmentUpload')"
            >
              <Icon 
                :name="attachmentsUploading ? 'lucide:loader-2' : 'lucide:upload'" 
                class="w-4 h-4 mr-2"
:class="[{ 'animate-spin': attachmentsUploading }]" 
              />
              {{ attachmentsUploading ? t('expense.actions.uploading') : t('expense.actions.uploadAttachment') }}
            </Button>
            
            <!-- Loading state -->
            <div v-if="attachmentsLoading" class="text-xs text-muted-foreground">
              {{ t('common.loading') }}...
            </div>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { 
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Icon } from '#components'

// Composables
import { useExpenseCategories } from '~/composables/useExpenseCategories'
import { useExpenseTags } from '~/composables/useExpenseTags'
import { useExpenseAttachments } from '~/composables/useExpenseAttachments'
import { useExpenseForm } from '~/composables/useExpenseForm'

// Types
import type { 
  IExpenseFormFieldsProps, 
  IExpenseFormFieldsEmits, 
  IExpenseFieldChangeEvent 
} from '~/types/expense'

defineOptions({
  name: 'ExpenseFormFields'
})

const props = withDefaults(defineProps<IExpenseFormFieldsProps>(), {
  disabled: false,
  mode: 'create'
})

const emit = defineEmits<IExpenseFormFieldsEmits>()

// Composables
const { t } = useI18n()

// Initialize all composables
const categoryHelpers = useExpenseCategories()
const tagHelpers = useExpenseTags()
const attachmentHelpers = useExpenseAttachments()
const formHelpers = useExpenseForm(props.initialData)

// Computed properties for loading states
const categoriesLoading = computed(() => categoryHelpers.isLoading.value)
const tagsLoading = computed(() => tagHelpers.isLoading.value)
const attachmentsLoading = computed(() => attachmentHelpers.isLoading.value)
const attachmentsUploading = computed(() => attachmentHelpers.isUploading.value)

// Computed properties for data
const categoryOptions = computed(() => categoryHelpers.categoryOptions.value)

// Form field change handler with type safety  
const handleFieldChange = (field: keyof import('~/schemas/expense').ExpenseFormData, value: string | number | string[] | undefined): void => {
  const changeEvent: IExpenseFieldChangeEvent = { field, value }
  emit('fieldChange', changeEvent)
  
  // Emit validation state changes
  emit('validationChange', formHelpers.canSubmit.value)
}

// Specific handler for amount inputs with proper typing
const handleAmountFieldChange = (field: 'incomeAmount' | 'expenseAmount', value: number): void => {
  handleFieldChange(field, value)
}

// Field blur handler for validation
const handleFieldBlur = (field: keyof import('~/schemas/expense').ExpenseFormData, value: unknown): void => {
  formHelpers.markFieldAsTouched(field)
  formHelpers.debouncedValidateField(field, value)
}

// Tag management handlers
const handleTagRemove = (tagId: string, currentValue: string[], handleChange: (value: string[]) => void): void => {
  const newValue = tagHelpers.removeTagFromList(tagId, currentValue || [], handleChange)
  handleFieldChange('tagIds', newValue)
}

// Attachment management handlers
const handleAttachmentRemove = (attachmentId: string, currentValue: string[], handleChange: (value: string[]) => void): void => {
  const newValue = attachmentHelpers.removeAttachmentFromList(attachmentId, currentValue || [], handleChange)
  handleFieldChange('attachmentIds', newValue)
}

const handleAttachmentDownload = (attachmentId: string): void => {
  attachmentHelpers.downloadAttachment(attachmentId)
}

const getAttachmentIcon = (attachmentId: string): string => {
  const attachment = attachmentHelpers.getAttachmentById(attachmentId)
  return attachment ? attachmentHelpers.getFileIcon(attachment.mimeType) : 'lucide:paperclip'
}

const getAttachmentSize = (attachmentId: string): string => {
  const attachment = attachmentHelpers.getAttachmentById(attachmentId)
  return attachment ? attachmentHelpers.formatFileSize(attachment.fileSize) : ''
}

// Load data on component mount
onMounted(async () => {
  await Promise.all([
    categoryHelpers.loadCategories(),
    tagHelpers.loadTags(),
    // Only load attachments if we have IDs
    props.initialData?.attachmentIds?.length ? 
      attachmentHelpers.loadAttachments(props.initialData.attachmentIds) : 
      Promise.resolve()
  ])
})
</script>

<style scoped>
.expense-form-fields {
  @apply w-full;
}

/* Improve visual feedback for amount fields */
.amount-field {
  @apply relative;
}

/* Better spacing for tag badges */
.tag-badge {
  @apply transition-all duration-200 ease-in-out;
}

.tag-badge:hover {
  @apply scale-105;
}

/* Attachment item hover effects */
.attachment-item {
  @apply transition-colors duration-200;
}
</style>