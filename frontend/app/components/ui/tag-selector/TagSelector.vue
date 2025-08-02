<template>
  <div class="flex flex-wrap gap-2">
    <Button
      v-for="tag in availableTags"
      :key="tag"
      variant="outline"
      size="sm"
      :class="{
        'bg-primary text-primary-foreground': selectedTags.includes(tag),
        'border-primary': selectedTags.includes(tag)
      }"
      @click="toggleTag(tag)"
    >
      <Icon 
        :name="selectedTags.includes(tag) ? 'lucide:check' : 'lucide:plus'" 
        class="h-3 w-3 mr-1" 
      />
      {{ tag }}
    </Button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  availableTags: string[]
  selectedTags: string[]
}

interface Emits {
  (e: 'update:selectedTags', tags: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const toggleTag = (tag: string) => {
  const newTags = [...props.selectedTags]
  const index = newTags.indexOf(tag)
  
  if (index > -1) {
    newTags.splice(index, 1)
  } else {
    newTags.push(tag)
  }
  
  emit('update:selectedTags', newTags)
}
</script>