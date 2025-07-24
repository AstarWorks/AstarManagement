<template>
  <div class="matter-documents-tab">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold">Documents</h3>
        <p class="text-muted-foreground text-sm">
          Manage case documents, files, and attachments
        </p>
      </div>
      <Button>
        <Upload class="w-4 h-4 mr-2" />
        Upload Document
      </Button>
    </div>

    <!-- Placeholder Content -->
    <Card>
      <CardContent class="p-8 text-center">
        <FolderOpen class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h4 class="text-lg font-medium mb-2">Documents Coming Soon</h4>
        <p class="text-muted-foreground">
          Document management functionality will be implemented in the next iteration.
        </p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Upload, FolderOpen } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

interface Props {
  matterId: string
}

const props = defineProps<Props>()
</script>