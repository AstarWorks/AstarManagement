<template>
  <div class="documents-page">
    <Breadcrumbs />
    <h1>Documents</h1>
    <p>This is the documents page.</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Documents',
  layout: 'app'
})
</script>

<style scoped>
.documents-page {
  @apply p-6;
}

h1 {
  @apply text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4 mb-2;
}
</style>