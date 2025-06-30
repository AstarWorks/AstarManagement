<!--
  Dynamic Field Group Component
  Groups related fields with collapsible sections
-->
<template>
  <div class="dynamic-field-group" :class="groupClasses">
    <!-- Group header -->
    <div 
      v-if="showHeader"
      class="group-header"
      :class="{ 'cursor-pointer': group.collapsible }"
      @click="handleHeaderClick"
    >
      <h3 class="group-title">
        {{ group.title }}
        <ChevronDownIcon 
          v-if="group.collapsible"
          class="collapse-icon"
          :class="{ 'rotate-180': isCollapsed }"
        />
      </h3>
      <p v-if="group.description" class="group-description">
        {{ group.description }}
      </p>
    </div>
    
    <!-- Group fields -->
    <div 
      v-show="!isCollapsed"
      class="group-fields"
      :class="gridClasses"
    >
      <DynamicField
        v-for="field in group.fields"
        :key="field.name"
        :variable="field"
        :model-value="getFieldValue(field.name)"
        :errors="getFieldErrors(field.name)"
        :disabled="disabled"
        :readonly="readonly"
        :size="size"
        @update:model-value="(value) => handleFieldUpdate(field.name, value)"
        @blur="handleFieldBlur"
        @focus="handleFieldFocus"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDownIcon } from 'lucide-vue-next'
import type { FieldGroupProps, FieldGroupEmits } from './types'
import DynamicField from './DynamicField.vue'

const props = withDefaults(defineProps<FieldGroupProps>(), {
  disabled: false,
  readonly: false,
  size: 'md'
})

const emit = defineEmits<FieldGroupEmits>()

// Local state for collapse
const isCollapsed = ref(props.group.collapsed ?? false)

// Computed properties
const showHeader = computed(() => 
  props.group.title || props.group.description || props.group.collapsible
)

const groupClasses = computed(() => [
  'dynamic-field-group',
  `dynamic-field-group--${props.group.section}`,
  {
    'dynamic-field-group--collapsed': isCollapsed.value,
    'dynamic-field-group--collapsible': props.group.collapsible
  }
])

const gridClasses = computed(() => {
  const columns = props.group.columns || 1
  return [
    'group-fields',
    `grid-cols-1`,
    {
      'md:grid-cols-2': columns >= 2,
      'lg:grid-cols-3': columns >= 3,
      'xl:grid-cols-4': columns >= 4
    }
  ]
})

// Field value and error helpers
const getFieldValue = (fieldName: string) => {
  return props.formData[fieldName]
}

const getFieldErrors = (fieldName: string): string[] => {
  // This would come from form validation context
  return []
}

// Event handlers
const handleHeaderClick = () => {
  if (props.group.collapsible) {
    isCollapsed.value = !isCollapsed.value
    emit('groupToggle', props.group.id, isCollapsed.value)
  }
}

const handleFieldUpdate = (fieldName: string, value: any) => {
  emit('update', fieldName, value)
}

const handleFieldBlur = (event: FocusEvent) => {
  // Could emit field blur events if needed
}

const handleFieldFocus = (event: FocusEvent) => {
  // Could emit field focus events if needed
}
</script>

<style scoped>
.dynamic-field-group {
  @apply mb-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden;
}

.dynamic-field-group--collapsible {
  @apply transition-all duration-200;
}

.dynamic-field-group--collapsed {
  @apply border-gray-100 dark:border-gray-800;
}

.group-header {
  @apply p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;
}

.group-header.cursor-pointer:hover {
  @apply bg-gray-100 dark:bg-gray-700;
}

.group-title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 m-0;
}

.collapse-icon {
  @apply w-5 h-5 transition-transform duration-200;
}

.group-description {
  @apply mt-1 text-sm text-gray-600 dark:text-gray-400 m-0;
}

.group-fields {
  @apply p-4 grid gap-4;
}

/* Responsive grid adjustments */
@media (min-width: 768px) {
  .group-fields.md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .group-fields.lg\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .group-fields.xl\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>