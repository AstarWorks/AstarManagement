<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="icon">
        <Icon name="lucide:settings-2" class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      <DropdownMenuLabel>{{ $t('modules.table.record.viewSettings.title') }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      
      <!-- Pinning Settings -->
      <div v-if="showPinningControls" class="px-2 py-1.5">
        <div class="text-xs font-medium mb-1">{{ $t('modules.table.pinning.title') }}</div>
        <Button
          size="sm"
          variant="ghost"
          class="w-full justify-start"
          @click="$emit('clear-all-pins')"
        >
          <Icon name="lucide:pin-off" class="mr-2 h-3 w-3" />
          {{ $t('modules.table.pinning.clearAll') }}
        </Button>
      </div>
      <DropdownMenuSeparator v-if="showPinningControls" />
      
      <!-- Density Settings -->
      <DropdownMenuRadioGroup
        :model-value="density"
        @update:model-value="$emit('change-density', $event as 'compact' | 'normal' | 'comfortable')"
      >
        <DropdownMenuRadioItem value="compact">
          {{ $t('modules.table.record.viewSettings.compact') }}
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="normal">
          {{ $t('modules.table.record.viewSettings.normal') }}
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="comfortable">
          {{ $t('modules.table.record.viewSettings.comfortable') }}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
      
      <DropdownMenuSeparator />
      
      <!-- Reset to Default -->
      <DropdownMenuItem @click="$emit('reset-to-default')">
        <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
        {{ $t('modules.table.view.resetToDefault') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
// Props
const props = defineProps<{
  density: 'compact' | 'normal' | 'comfortable'
  showPinningControls?: boolean
}>()

// Emits
const emit = defineEmits<{
  'change-density': [density: 'compact' | 'normal' | 'comfortable']
  'clear-all-pins': []
  'reset-to-default': []
}>()
</script>