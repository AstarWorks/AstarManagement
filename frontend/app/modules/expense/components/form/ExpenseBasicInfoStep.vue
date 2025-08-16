<template>
  <div class="expense-basic-info-step space-y-6">
    <div class="text-center mb-6">
      <Icon name="lucide:receipt" class="w-12 h-12 mx-auto mb-3 text-primary" />
      <h3 class="text-xl font-semibold mb-2">
        {{ t('expense.form.steps.basic') }}
      </h3>
      <p class="text-muted-foreground">
        {{ t('expense.form.steps.basicDescription') }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Date Field -->
      <FormField v-slot="{ componentField }" name="date">
        <FormItem>
          <FormLabel for="date">
            {{ t('expense.form.fields.date') }}
            <span class="text-destructive">*</span>
          </FormLabel>
          <FormControl>
            <Input
              id="date"
              v-bind="componentField"
              type="date"
              :placeholder="t('expense.form.placeholders.date')"
              class="w-full"
            />
          </FormControl>
          <FormDescription>
            {{ t('expense.form.descriptions.date') }}
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <!-- Category Field -->
      <FormField v-slot="{ componentField }" name="category">
        <FormItem>
          <FormLabel for="category">
            {{ t('expense.form.fields.category') }}
            <span class="text-destructive">*</span>
          </FormLabel>
          <Select v-bind="componentField">
            <FormControl>
              <SelectTrigger>
                <SelectValue :placeholder="t('expense.form.placeholders.category')" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem 
                v-for="category in expenseCategories" 
                :key="category.value"
                :value="category.value"
              >
                <div class="flex items-center gap-2">
                  <Icon :name="category.icon" class="w-4 h-4" />
                  {{ category.label }}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <FormDescription>
            {{ t('expense.form.descriptions.category') }}
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>

    <!-- Description Field -->
    <FormField v-slot="{ componentField }" name="description">
      <FormItem>
        <FormLabel for="description">
          {{ t('expense.form.fields.description') }}
          <span class="text-destructive">*</span>
        </FormLabel>
        <FormControl>
          <Textarea
            id="description"
            v-bind="componentField"
            :placeholder="t('expense.form.placeholders.description')"
            class="min-h-[100px] resize-none"
            maxlength="500"
          />
        </FormControl>
        <div class="flex justify-between">
          <FormDescription>
            {{ t('expense.form.descriptions.description') }}
          </FormDescription>
          <div class="text-xs text-muted-foreground">
            {{ (componentField.modelValue || '').length }}/500
          </div>
        </div>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Quick Description Templates -->
    <div class="mt-4">
      <Label class="text-sm font-medium mb-3 block">
        {{ t('expense.form.quickTemplates') }}
      </Label>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Button
          v-for="template in descriptionTemplates"
          :key="template.value"
          type="button"
          variant="outline"
          size="sm"
          class="text-xs"
          @click="applyTemplate(template.value)"
        >
          {{ template.label }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useField } from 'vee-validate'
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '~/foundation/components/ui/form'
import { Input } from '~/foundation/components/ui/input/index'
import { Textarea } from '~/foundation/components/ui/textarea'
import { Button } from '~/foundation/components/ui/button/index'
import { Label } from '~/foundation/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/foundation/components/ui/select'

// Composables
const { t } = useI18n()

// Form fields
const { setValue: setDescription } = useField('description')

// Expense categories with icons
const expenseCategories = computed(() => [
  {
    value: 'transportation',
    label: t('expense.categories.transportation'),
    icon: 'lucide:car'
  },
  {
    value: 'stampFees',
    label: t('expense.categories.stampFees'),
    icon: 'lucide:stamp'
  },
  {
    value: 'copyFees',
    label: t('expense.categories.copyFees'),
    icon: 'lucide:copy'
  },
  {
    value: 'postage',
    label: t('expense.categories.postage'),
    icon: 'lucide:mail'
  },
  {
    value: 'other',
    label: t('expense.categories.other'),
    icon: 'lucide:more-horizontal'
  }
])

// Quick description templates for common legal practice expenses
const descriptionTemplates = computed(() => [
  {
    value: '裁判所への交通費',
    label: t('expense.form.templates.court')
  },
  {
    value: 'クライアント面談のための交通費',
    label: t('expense.form.templates.client')
  },
  {
    value: '書類のコピー代',
    label: t('expense.form.templates.copying')
  },
  {
    value: '郵送料',
    label: t('expense.form.templates.postage')
  },
  {
    value: '印紙代',
    label: t('expense.form.templates.stamp')
  },
  {
    value: '事務用品',
    label: t('expense.form.templates.supplies')
  },
  {
    value: '資料代',
    label: t('expense.form.templates.materials')
  },
  {
    value: 'その他実費',
    label: t('expense.form.templates.other')
  }
])

// Apply template to description field
const applyTemplate = (template: string) => {
  setDescription(template)
}
</script>