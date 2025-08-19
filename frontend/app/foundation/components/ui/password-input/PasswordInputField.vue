<template>
  <FormField v-slot="{ componentField }" :name="name">
    <FormItem>
      <FormLabel>{{ label }}</FormLabel>
      <FormControl>
        <div class="relative">
          <Input
            v-bind="componentField"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="placeholder"
            :disabled="disabled"
            class="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="absolute right-0 top-0 h-full"
            :disabled="disabled"
            @click="showPassword = !showPassword"
          >
            <Icon
              :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'"
              class="h-4 w-4"
            />
            <span class="sr-only">
              {{ showPassword ? $t('modules.auth.login.fields.password.hide') : $t('modules.auth.login.fields.password.show') }}
            </span>
          </Button>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  </FormField>
</template>

<script setup lang="ts">
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '~/foundation/components/ui/form'
import { Input } from '~/foundation/components/ui/input'
import { Button } from '~/foundation/components/ui/button'

interface Props {
  name: string
  label: string
  placeholder?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  placeholder: '',
  disabled: false
})

const showPassword = ref(false)
</script>