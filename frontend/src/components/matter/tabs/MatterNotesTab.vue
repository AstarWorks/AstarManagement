<template>
  <div class="matter-notes-tab">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibant">Notes</h3>
        <p class="text-muted-foreground text-sm">
          Create and manage case notes with markdown support
        </p>
      </div>
      <Button>
        <Plus class="w-4 h-4 mr-2" />
        New Note
      </Button>
    </div>

    <!-- Placeholder Content -->
    <Card>
      <CardContent class="p-8 text-center">
        <StickyNote class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h4 class="text-lg font-medium mb-2">Notes Coming Soon</h4>
        <p class="text-muted-foreground">
          Note-taking functionality will be implemented in the next iteration.
        </p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Plus, StickyNote } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

interface Props {
  matterId: string
}

const props = defineProps<Props>()
</script>