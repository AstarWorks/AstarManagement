<template>
  <div class="matter-billing-tab">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold">Billing</h3>
        <p class="text-muted-foreground text-sm">
          Track invoices, payments, and financial information
        </p>
      </div>
      <Button>
        <Plus class="w-4 h-4 mr-2" />
        Add Invoice
      </Button>
    </div>

    <!-- Placeholder Content -->
    <Card>
      <CardContent class="p-8 text-center">
        <DollarSign class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h4 class="text-lg font-medium mb-2">Billing Coming Soon</h4>
        <p class="text-muted-foreground">
          Financial management functionality will be implemented in the next iteration.
        </p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Plus, DollarSign } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

interface Props {
  matterId: string
}

const props = defineProps<Props>()
</script>