<template>
  <div class="matter-communications-tab">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold">Communications</h3>
        <p class="text-muted-foreground text-sm">
          View communication history, emails, and messages
        </p>
      </div>
      <Button>
        <Plus class="w-4 h-4 mr-2" />
        New Message
      </Button>
    </div>

    <!-- Placeholder Content -->
    <Card>
      <CardContent class="p-8 text-center">
        <MessageSquare class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h4 class="text-lg font-medium mb-2">Communications Coming Soon</h4>
        <p class="text-muted-foreground">
          Communication hub functionality will be implemented in the next iteration.
        </p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Plus, MessageSquare } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

interface Props {
  matterId: string
}

const props = defineProps<Props>()
</script>