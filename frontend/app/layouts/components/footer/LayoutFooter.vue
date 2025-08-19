<template>
  <footer class="bg-muted/20 border-t border-border py-4 px-4 lg:px-6">
    <div class="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
      <!-- Copyright -->
      <div class="flex items-center gap-4">
        <p>{{ t('foundation.common.app.copyright') }}</p>
        <div class="hidden md:block w-px h-4 bg-border" />
        <p class="hidden md:block">{{ t('modules.auth.login.appSubtitle') }}</p>
      </div>
      
      <!-- Legal Links -->
      <div class="flex items-center gap-4">
        <NuxtLink 
          to="/privacy" 
          class="hover:text-foreground transition-colors"
        >
          {{ t('foundation.common.app.privacyPolicy') }}
        </NuxtLink>
        <div class="w-px h-4 bg-border" />
        <NuxtLink 
          to="/terms" 
          class="hover:text-foreground transition-colors"
        >
          {{ t('foundation.common.app.termsOfService') }}
        </NuxtLink>
        <div class="w-px h-4 bg-border" />
        <NuxtLink 
          to="/security" 
          class="hover:text-foreground transition-colors"
        >
          {{ t('foundation.common.app.features.security') }}
        </NuxtLink>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>

