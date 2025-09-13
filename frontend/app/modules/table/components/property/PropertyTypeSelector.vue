<template>
  <div class="space-y-2">
    <RadioGroup v-model="selectedType" @update:model-value="handleChange">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div
          v-for="type in propertyTypes"
          :key="type.value"
          class="relative"
        >
          <RadioGroupItem
            :id="type.value"
            :value="type.value"
            class="peer sr-only"
          />
          <Label
            :for="type.value"
            class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <Icon :name="type.icon" class="mb-2 h-6 w-6" />
            <span class="text-sm font-medium">{{ type.label }}</span>
            <span class="mt-1 text-xs text-muted-foreground">{{ type.description }}</span>
          </Label>
        </div>
      </div>
    </RadioGroup>

    <!-- Advanced Types (Collapsed by default) -->
    <div v-if="showAdvanced" class="pt-4">
      <div class="mb-2 flex items-center text-sm text-muted-foreground">
        <Icon name="lucide:sparkles" class="mr-2 h-4 w-4" />
        {{ $t('modules.table.property.types.advanced') }}
      </div>
      <RadioGroup v-model="selectedType" @update:model-value="handleChange">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div
            v-for="type in advancedTypes"
            :key="type.value"
            class="relative"
          >
            <RadioGroupItem
              :id="`adv-${type.value}`"
              :value="type.value"
              class="peer sr-only"
            />
            <Label
              :for="`adv-${type.value}`"
              class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <Icon :name="type.icon" class="mb-2 h-6 w-6" />
              <span class="text-sm font-medium">{{ type.label }}</span>
              <span class="mt-1 text-xs text-muted-foreground">{{ type.description }}</span>
            </Label>
          </div>
        </div>
      </RadioGroup>
    </div>

    <!-- Toggle Advanced Types -->
    <Button
      variant="ghost"
      size="sm"
      class="w-full"
      @click="showAdvanced = !showAdvanced"
    >
      <Icon 
        :name="showAdvanced ? 'lucide:chevron-up' : 'lucide:chevron-down'" 
        class="mr-2 h-4 w-4" 
      />
      {{ showAdvanced 
        ? $t('modules.table.property.types.hideAdvanced') 
        : $t('modules.table.property.types.showAdvanced') 
      }}
    </Button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
}>()

const { t } = useI18n()

// Selected type
const selectedType = useVModel(props, 'modelValue', emit)

// Show advanced types
const showAdvanced = ref(false)

// Basic property types
const propertyTypes = [
  {
    value: 'text',
    icon: 'lucide:type',
    label: t('modules.table.property.types.text.label'),
    description: t('modules.table.property.types.text.description')
  },
  {
    value: 'number',
    icon: 'lucide:hash',
    label: t('modules.table.property.types.number.label'),
    description: t('modules.table.property.types.number.description')
  },
  {
    value: 'date',
    icon: 'lucide:calendar',
    label: t('modules.table.property.types.date.label'),
    description: t('modules.table.property.types.date.description')
  },
  {
    value: 'checkbox',
    icon: 'lucide:check-square',
    label: t('modules.table.property.types.checkbox.label'),
    description: t('modules.table.property.types.checkbox.description')
  },
  {
    value: 'select',
    icon: 'lucide:chevron-down-circle',
    label: t('modules.table.property.types.select.label'),
    description: t('modules.table.property.types.select.description')
  },
  {
    value: 'currency',
    icon: 'lucide:dollar-sign',
    label: t('modules.table.property.types.currency.label'),
    description: t('modules.table.property.types.currency.description')
  }
]

// Advanced property types
const advancedTypes = [
  {
    value: 'textarea',
    icon: 'lucide:align-left',
    label: t('modules.table.property.types.textarea.label'),
    description: t('modules.table.property.types.textarea.description')
  },
  {
    value: 'datetime',
    icon: 'lucide:calendar-clock',
    label: t('modules.table.property.types.datetime.label'),
    description: t('modules.table.property.types.datetime.description')
  },
  {
    value: 'time',
    icon: 'lucide:clock',
    label: t('modules.table.property.types.time.label'),
    description: t('modules.table.property.types.time.description')
  },
  {
    value: 'percent',
    icon: 'lucide:percent',
    label: t('modules.table.property.types.percent.label'),
    description: t('modules.table.property.types.percent.description')
  },
  {
    value: 'email',
    icon: 'lucide:mail',
    label: t('modules.table.property.types.email.label'),
    description: t('modules.table.property.types.email.description')
  },
  {
    value: 'url',
    icon: 'lucide:link',
    label: t('modules.table.property.types.url.label'),
    description: t('modules.table.property.types.url.description')
  },
  {
    value: 'multiselect',
    icon: 'lucide:list-checks',
    label: t('modules.table.property.types.multiselect.label'),
    description: t('modules.table.property.types.multiselect.description')
  },
  {
    value: 'richtext',
    icon: 'lucide:file-text',
    label: t('modules.table.property.types.richtext.label'),
    description: t('modules.table.property.types.richtext.description')
  },
  {
    value: 'json',
    icon: 'lucide:code',
    label: t('modules.table.property.types.json.label'),
    description: t('modules.table.property.types.json.description')
  },
  {
    value: 'relation',
    icon: 'lucide:link-2',
    label: t('modules.table.property.types.relation.label'),
    description: t('modules.table.property.types.relation.description')
  }
]

// Handle type change
const handleChange = (value: string) => {
  emit('change', value)
}
</script>