<template>
  <!-- Quick Actions with shadcn/ui DropdownMenu -->
  <div class="case-actions flex items-center gap-1 ml-2 opacity-0 transition-opacity duration-200">
    <Button
      variant="ghost"
      size="sm"
      class="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      @click.stop="$emit('edit')"
    >
      <Icon name="lucide:edit-3" class="h-3 w-3" />
    </Button>
    
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="sm"
          class="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          @click.stop
        >
          <Icon name="lucide:more-horizontal" class="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-48">
        <DropdownMenuItem @click="$emit('edit')">
          <Icon name="lucide:edit-3" class="h-4 w-4 mr-2" />
          {{ $t('common.edit') }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="$emit('duplicate')">
          <Icon name="lucide:copy" class="h-4 w-4 mr-2" />
          {{ $t('common.copy') }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem class="text-destructive" @click="$emit('delete')">
          <Icon name="lucide:trash-2" class="h-4 w-4 mr-2" />
          {{ $t('common.delete') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>

<script setup lang="ts">
interface Emits {
  (e: 'edit'): void
  (e: 'duplicate'): void
  (e: 'delete'): void
}

defineEmits<Emits>()
</script>