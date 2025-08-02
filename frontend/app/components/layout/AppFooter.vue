<template>
  <footer class="bg-muted/20 border-t border-border py-4 px-4 lg:px-6">
    <div class="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
      <!-- Copyright -->
      <div class="flex items-center gap-4">
        <p>&copy; 2025 Astar Management. All rights reserved.</p>
        <div class="hidden md:block w-px h-4 bg-border" />
        <p class="hidden md:block">法律事務所業務管理システム</p>
      </div>
      
      <!-- Legal Links -->
      <div class="flex items-center gap-4">
        <NuxtLink 
          to="/privacy" 
          class="hover:text-foreground transition-colors"
        >
          プライバシーポリシー
        </NuxtLink>
        <div class="w-px h-4 bg-border" />
        <NuxtLink 
          to="/terms" 
          class="hover:text-foreground transition-colors"
        >
          利用規約
        </NuxtLink>
        <div class="w-px h-4 bg-border" />
        <NuxtLink 
          to="/security" 
          class="hover:text-foreground transition-colors"
        >
          セキュリティ
        </NuxtLink>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// Footer component - no additional logic needed
</script>

