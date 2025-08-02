<!--
  Authentication Form Footer Component
  Provides consistent footer with copyright and links for authentication forms
-->
<template>
  <div class="text-center space-y-2">
    <div class="text-xs text-muted-foreground">
      <p>{{ $t('auth.footer.copyright') }}</p>
    </div>
    
    <!-- Optional footer links -->
    <div v-if="showLinks" class="flex justify-center space-x-4 text-xs">
      <Button
        variant="link"
        size="sm"
        class="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
        @click="$emit('privacyClick')"
      >
        {{ $t('auth.footer.privacy') }}
      </Button>
      
      <Separator orientation="vertical" class="h-3" />
      
      <Button
        variant="link"
        size="sm"
        class="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
        @click="$emit('termsClick')"
      >
        {{ $t('auth.footer.terms') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'

interface Props {
  showLinks?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLinks: true
})

interface Emits {
  (e: 'privacyClick'): void
  (e: 'termsClick'): void
}

const emit = defineEmits<Emits>()
</script>

<style scoped>
/* Footer specific styling */
.text-xs {
  line-height: 1.5;
}

/* Hover effects for footer links */
:deep(.text-muted-foreground:hover) {
  transition: color 0.2s ease-in-out;
}
</style>