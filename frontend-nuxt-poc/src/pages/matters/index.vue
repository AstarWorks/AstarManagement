<template>
  <div class="matters-page">
    <Breadcrumbs />
    <h1>Matters</h1>
    <p>This is the matters list page.</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Matters',
  layout: 'app'
})

// Use breadcrumbs
const { setBreadcrumbs } = useBreadcrumbs()

onMounted(() => {
  setBreadcrumbs([
    { label: 'Home', path: '/' },
    { label: 'Matters', current: true }
  ])
})
</script>

<style scoped>
.matters-page {
  @apply p-6;
}

h1 {
  @apply text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4 mb-2;
}
</style>