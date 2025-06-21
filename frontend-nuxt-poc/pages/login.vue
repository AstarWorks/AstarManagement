<template>
  <div class="login-page">
    <h1>Login Page</h1>
    <p>This is a placeholder login page for testing navigation.</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  requiresAuth: false
})
</script>

<style scoped>
.login-page {
  @apply flex flex-col items-center justify-center min-h-screen p-8;
}
</style>