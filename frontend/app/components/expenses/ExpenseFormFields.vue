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
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Category Field -->
    <FormField v-slot="{ componentField }" name="category">
      <FormItem>
        <FormLabel>{{ t('expense.form.fields.category') }}</FormLabel>
        <Select v-bind="componentField" :disabled="disabled">
          <FormControl>
            <SelectTrigger>
              <SelectValue :placeholder="t('expense.form.placeholders.category')" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="travel">{{ t('expense.categories.travel') }}</SelectItem>
            <SelectItem value="meal">{{ t('expense.categories.meal') }}</SelectItem>
            <SelectItem value="office">{{ t('expense.categories.office') }}</SelectItem>
            <SelectItem value="communication">{{ t('expense.categories.communication') }}</SelectItem>
            <SelectItem value="other">{{ t('expense.categories.other') }}</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
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
              @input="handleAmountInput($event, 'incomeAmount')"
            />
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
              @input="handleAmountInput($event, 'expenseAmount')"
            />
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
            <SelectItem :value="null">{{ t('common.none') }}</SelectItem>
            <!-- Cases will be loaded dynamically -->
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
          <div class="flex flex-wrap gap-2">
            <!-- Tag selection component will be added here -->
            <Badge 
              v-for="tagId in (value || [])" 
              :key="tagId"
              variant="secondary"
              class="cursor-pointer"
              @click="!disabled && removeTag(tagId, value, handleChange)"
            >
              {{ getTagName(tagId) }}
              <Icon v-if="!disabled" name="lucide:x" class="w-3 h-3 ml-1" />
            </Badge>
            <Button
              v-if="!disabled"
              type="button"
              variant="outline"
              size="sm"
              @click="emit('openTagSelector')"
            >
              <Icon name="lucide:plus" class="w-4 h-4 mr-1" />
              {{ t('expense.actions.addTag') }}
            </Button>
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
                class="flex items-center justify-between p-2 border rounded-md"
              >
                <div class="flex items-center space-x-2">
                  <Icon name="lucide:paperclip" class="w-4 h-4 text-muted-foreground" />
                  <span class="text-sm">{{ getAttachmentName(attachmentId) }}</span>
                </div>
                <Button
                  v-if="!disabled"
                  type="button"
                  variant="ghost"
                  size="sm"
                  @click="removeAttachment(attachmentId, value, handleChange)"
                >
                  <Icon name="lucide:x" class="w-4 h-4" />
                </Button>
              </div>
            </div>
            <!-- Upload button -->
            <Button
              v-if="!disabled"
              type="button"
              variant="outline"
              size="sm"
              @click="emit('openAttachmentUpload')"
            >
              <Icon name="lucide:upload" class="w-4 h-4 mr-2" />
              {{ t('expense.actions.uploadAttachment') }}
            </Button>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
  </div>
</template>

<script setup lang="ts">
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

export interface IExpenseFormFieldsProps {
  disabled?: boolean
  mode?: 'create' | 'edit'
}

interface IExpenseFormFieldsEmits {
  (e: 'openTagSelector' | 'openAttachmentUpload'): void
  (e: 'fieldChange', field: string, value: unknown): void
}

defineOptions({
  name: 'ExpenseFormFields'
})

withDefaults(defineProps<IExpenseFormFieldsProps>(), {
  disabled: false,
  mode: 'create'
})

const emit = defineEmits<IExpenseFormFieldsEmits>()

// Composables
const { t } = useI18n()

// Handle numeric input for amount fields
const handleAmountInput = (event: Event, field: string) => {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value) || 0
  emit('fieldChange', field, value)
}

// Tag management
const getTagName = (tagId: string): string => {
  // TODO: Implement tag name lookup from store or API
  return `Tag ${tagId}`
}

const removeTag = (tagId: string, currentValue: string[], handleChange: (value: string[]) => void) => {
  const newValue = currentValue.filter(id => id !== tagId)
  handleChange(newValue)
  emit('fieldChange', 'tagIds', newValue)
}

// Attachment management
const getAttachmentName = (attachmentId: string): string => {
  // TODO: Implement attachment name lookup from store or API
  return `attachment_${attachmentId}.pdf`
}

const removeAttachment = (attachmentId: string, currentValue: string[], handleChange: (value: string[]) => void) => {
  const newValue = currentValue.filter(id => id !== attachmentId)
  handleChange(newValue)
  emit('fieldChange', 'attachmentIds', newValue)
}
</script>

<style scoped>
.expense-form-fields {
  @apply w-full;
}
</style>