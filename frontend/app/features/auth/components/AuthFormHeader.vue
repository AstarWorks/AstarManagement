<!--
  Authentication Form Header Component
  Provides consistent branding and title section for authentication forms
-->
<template>
  <div class="text-center space-y-2">
    <h1 class="text-2xl font-bold text-foreground">
      {{ title || $t('auth.login.appTitle') }}
    </h1>
    <p class="text-sm text-muted-foreground">
      {{ subtitle || $t('auth.login.appSubtitle') }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  showLogo?: boolean
}

withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  showLogo: false
})
</script>

<style scoped>
/* Header specific styling for consistent branding */
h1 {
  font-weight: 700;
  letter-spacing: -0.025em;
}

/* Responsive font scaling */
@media (max-width: 640px) {
  h1 {
    font-size: 1.5rem;
    line-height: 2rem;
  }
}
</style>