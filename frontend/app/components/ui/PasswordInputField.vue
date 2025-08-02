<!--
  Reusable Password Input Field with Toggle Visibility
  Uses VueUse for clean state management and shadcn/ui components
-->
<template>
  <FormField v-slot="{ componentField }" :name="name">
    <FormItem>
      <FormLabel :for="inputId">{{ label }}</FormLabel>
      <FormControl>
        <div class="relative">
          <Input
            :id="inputId"
            ref="inputRef"
            v-bind="componentField"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="placeholder"
            :autocomplete="autocomplete"
            :disabled="disabled"
            :class="cn('pr-10', inputClass)"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            :class="cn(
              'absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent',
              'transition-colors duration-200',
              toggleButtonClass
            )"
            :disabled="disabled"
            @click="togglePasswordVisibility"
          >
            <Icon
              :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'"
              :class="cn('h-4 w-4 text-muted-foreground', iconClass)"
            />
            <span class="sr-only">
              {{ showPassword ? $t('auth.password.hide') : $t('auth.password.show') }}
            </span>
          </Button>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  </FormField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/lib/utils'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'

interface Props {
  name: string
  label: string
  placeholder?: string
  autocomplete?: string
  disabled?: boolean
  initialVisibility?: boolean
  autoFocus?: boolean
  inputClass?: string
  toggleButtonClass?: string
  iconClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  autocomplete: 'current-password',
  disabled: false,
  initialVisibility: false,
  autoFocus: false,
  inputClass: '',
  toggleButtonClass: '',
  iconClass: ''
})

// VueUse composables for clean state management
const [showPassword, togglePasswordVisibility] = useToggle(props.initialVisibility)

// Generate unique ID for accessibility
const inputId = computed(() => `password-input-${props.name}`)

// Auto-focus support with VueUse
const inputRef = ref<HTMLInputElement>()
const { focused } = useFocus(inputRef, { initialValue: props.autoFocus })

// Expose the toggle function for external control if needed
defineExpose({
  togglePasswordVisibility,
  showPassword: readonly(showPassword),
  focused,
  inputRef
})
</script>

<style scoped>
/* Custom focus states for better UX */
:deep(.relative:focus-within) {
  @apply ring-2 ring-ring ring-offset-2;
}

/* Smooth transitions for icon changes */
:deep(.lucide) {
  transition: opacity 0.2s ease-in-out;
}

/* Enhanced accessibility for screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>