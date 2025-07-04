<template>
  <div
    v-if="isVisible"
    class="conditional-field-wrapper"
    :class="wrapperClasses"
  >
    <Transition
      :name="transitionName"
      mode="out-in"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-show="isVisible"
        :key="field.name"
        class="field-container"
        :class="fieldClasses"
      >
        <slot
          :field="field"
          :is-enabled="isEnabled"
          :is-required="isRequired"
          :is-visible="isVisible"
          :validation-state="validationState"
        />
        
        <!-- Dependency indicator -->
        <div
          v-if="showDependencyInfo && (hasDependencies || isDependedUpon)"
          class="dependency-info"
        >
          <Icon
            v-if="hasDependencies"
            name="link"
            class="dependency-icon"
            :title="`Depends on: ${dependsOn.join(', ')}`"
          />
          <Icon
            v-if="isDependedUpon"
            name="users"
            class="dependent-icon"
            :title="`Affects: ${affectedFields.join(', ')}`"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, watch, type PropType } from 'vue'
import { Icon } from 'lucide-vue-next'
import type { ParsedTemplateVariable } from '~/composables/form/types'

// Props
interface Props {
  field: ParsedTemplateVariable
  showDependencyInfo?: boolean
  animationDuration?: number
  customClasses?: string
}

const props = withDefaults(defineProps<Props>(), {
  showDependencyInfo: false,
  animationDuration: 200,
  customClasses: ''
})

// Inject conditional logic context
const conditionalLogic = inject('conditionalLogic', null) as unknown
const fieldDependencies = inject('fieldDependencies', null) as unknown

// Field state
const isVisible = computed(() => {
  if (!conditionalLogic) return true
  return conditionalLogic.isFieldVisible(props.field.name)
})

const isEnabled = computed(() => {
  if (!conditionalLogic) return !props.field.disabled
  return conditionalLogic.isFieldEnabled(props.field.name)
})

const isRequired = computed(() => {
  if (!conditionalLogic) return props.field.required || false
  return conditionalLogic.isFieldRequired(props.field.name)
})

// Dependency information
const hasDependencies = computed(() => {
  if (!fieldDependencies) return false
  return fieldDependencies.hasFieldDependencies(props.field.name)
})

const isDependedUpon = computed(() => {
  if (!fieldDependencies) return false
  return fieldDependencies.isFieldDependedUpon(props.field.name)
})

const dependsOn = computed(() => {
  if (!fieldDependencies) return []
  return fieldDependencies.getFieldDependencies(props.field.name)
})

const affectedFields = computed(() => {
  if (!fieldDependencies) return []
  return fieldDependencies.getDependentFields(props.field.name)
})

// Validation state
const validationState = computed(() => {
  // This would be injected from a validation context
  return {
    isValid: true,
    error: null,
    touched: false
  }
})

// CSS classes
const wrapperClasses = computed(() => [
  'conditional-field-wrapper',
  {
    'field-disabled': !isEnabled.value,
    'field-required': isRequired.value,
    'field-has-dependencies': hasDependencies.value,
    'field-is-dependency': isDependedUpon.value,
    'field-hidden': !isVisible.value
  },
  props.customClasses
])

const fieldClasses = computed(() => [
  'field-container',
  {
    'field-entering': false, // Set during animations
    'field-leaving': false   // Set during animations
  }
])

// Animation
const transitionName = computed(() => {
  return props.animationDuration > 0 ? 'conditional-field' : ''
})

// Transition handlers
const onEnter = (el: Element) => {
  // Animation enter logic
}

const onLeave = (el: Element) => {
  // Animation leave logic
}

// Emit events
const emit = defineEmits<{
  visibilityChange: [visible: boolean]
  enabledChange: [enabled: boolean]
  requiredChange: [required: boolean]
}>()

// Watch for state changes
watch(isVisible, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    emit('visibilityChange', newVal)
  }
})

watch(isEnabled, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    emit('enabledChange', newVal)
  }
})

watch(isRequired, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    emit('requiredChange', newVal)
  }
})
</script>

<style scoped>
.conditional-field-wrapper {
  position: relative;
  width: 100%;
}

.field-container {
  position: relative;
  width: 100%;
}

.field-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.field-required {
  position: relative;
}

.field-required::after {
  content: '*';
  color: hsl(var(--destructive));
  margin-left: 0.25rem;
}

.dependency-info {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
  z-index: 10;
}

.dependency-icon,
.dependent-icon {
  width: 1rem;
  height: 1rem;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.dependency-icon {
  color: hsl(var(--primary));
}

.dependent-icon {
  color: hsl(var(--secondary));
}

.conditional-field-wrapper:hover .dependency-icon,
.conditional-field-wrapper:hover .dependent-icon {
  opacity: 0.8;
}

/* Transition animations */
.conditional-field-enter-active,
.conditional-field-leave-active {
  transition: all 200ms ease;
  overflow: hidden;
}

.conditional-field-enter-from {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.conditional-field-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.conditional-field-enter-to,
.conditional-field-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 200px; /* Adjust based on typical field height */
}

/* Responsive design */
@media (max-width: 640px) {
  .dependency-info {
    position: static;
    margin-top: 0.5rem;
    justify-content: flex-end;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .field-disabled {
    opacity: 0.8;
    filter: contrast(0.5);
  }
  
  .dependency-icon,
  .dependent-icon {
    opacity: 1;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .conditional-field-enter-active,
  .conditional-field-leave-active {
    transition: none;
  }
  
  .dependency-icon,
  .dependent-icon {
    transition: none;
  }
}
</style>