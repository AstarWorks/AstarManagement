<template>
  <div class="dashboard-page">
    <h1 class="page-title">Dashboard</h1>
    
    <!-- Dashboard content -->
    <div class="dashboard-grid">
      <div class="dashboard-card">
        <h2>Quick Stats</h2>
        <p>Overview of your matters and tasks</p>
      </div>
      
      <div class="dashboard-card">
        <h2>Recent Activity</h2>
        <p>Latest updates and changes</p>
      </div>
      
      <div class="dashboard-card">
        <h2>Upcoming Deadlines</h2>
        <p>Important dates and deadlines</p>
      </div>
    </div>
    
    <!-- Simplified content -->
    <div class="content-section">
      <h2 class="section-title">Legal Matter Management System</h2>
      <p class="text-gray-600 dark:text-gray-400">Your legal matter management dashboard is loading.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Dashboard',
  layout: 'app'
})
</script>

<style scoped>
.dashboard-page {
  @apply p-6;
}

.page-title {
  @apply text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4 mb-6;
}

.dashboard-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8;
}

.dashboard-card {
  @apply bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700;
}

.dashboard-card h2 {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2;
}

.dashboard-card p {
  @apply text-gray-600 dark:text-gray-400;
}

.kanban-section {
  @apply mt-8;
}

.section-title {
  @apply text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4;
}
</style>