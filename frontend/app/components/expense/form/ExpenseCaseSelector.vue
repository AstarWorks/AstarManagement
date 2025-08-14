<template>
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
            v-for="case_ in caseOptions" 
            :key="case_.id"
            :value="case_.id"
          >
            <div class="flex items-center gap-2">
              <Icon name="lucide:briefcase" class="w-4 h-4" />
              {{ case_.clientName }} - {{ case_.name }}
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
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '~/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useExpenseCases } from '~/composables/useExpenseCases'

// Composables
const { t } = useI18n()
const { caseOptions, loadCases, isLoading: _isLoading } = useExpenseCases()

// Load cases on mount
onMounted(async () => {
  await loadCases()
})
</script>