<script setup lang="ts">
import { ref } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Label } from '~/components/ui/label'
import { AlertCircle } from 'lucide-vue-next'

export interface ConflictData {
  id: string
  field: string
  localValue: any
  remoteValue: any
  timestamp: Date
}

interface Props {
  conflicts: ConflictData[]
  open: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  resolve: [conflictId: string, resolution: 'local' | 'remote']
  dismiss: []
}>()

const selectedResolutions = ref(new Map<string, 'local' | 'remote'>())

/**
 * Resolves all conflicts with the same resolution
 */
const resolveAll = (resolution: 'local' | 'remote') => {
  props.conflicts.forEach(conflict => {
    emit('resolve', conflict.id, resolution)
  })
}

/**
 * Resolves a single conflict based on selected resolution
 */
const resolveConflict = (conflictId: string) => {
  const resolution = selectedResolutions.value.get(conflictId)
  if (resolution) {
    emit('resolve', conflictId, resolution)
  }
}

/**
 * Sets resolution choice for a conflict
 */
const setResolution = (conflictId: string, resolution: 'local' | 'remote') => {
  selectedResolutions.value.set(conflictId, resolution)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('dismiss')">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Resolve Update Conflicts</DialogTitle>
      </DialogHeader>
      
      <div class="space-y-4">
        <Alert variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>
            {{ conflicts.length }} conflict(s) detected. Choose which version to keep.
          </AlertDescription>
        </Alert>
        
        <div class="flex gap-2 justify-end">
          <Button size="sm" variant="outline" @click="resolveAll('local')">
            Keep All Local
          </Button>
          <Button size="sm" variant="outline" @click="resolveAll('remote')">
            Keep All Remote
          </Button>
        </div>
        
        <div class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="conflict in conflicts"
            :key="conflict.id"
            class="border rounded-lg p-4"
          >
            <div class="font-medium mb-2">{{ conflict.field }}</div>
            
            <RadioGroup 
              :model-value="selectedResolutions.get(conflict.id)"
              @update:model-value="(value) => setResolution(conflict.id, value as 'local' | 'remote')"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="local" :id="`${conflict.id}-local`" />
                    <Label :for="`${conflict.id}-local`" class="text-sm font-medium">
                      Local Version
                    </Label>
                  </div>
                  <div class="mt-2 p-2 bg-muted rounded text-sm">
                    <pre class="whitespace-pre-wrap">{{ JSON.stringify(conflict.localValue, null, 2) }}</pre>
                  </div>
                </div>
                
                <div>
                  <div class="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="remote" :id="`${conflict.id}-remote`" />
                    <Label :for="`${conflict.id}-remote`" class="text-sm font-medium">
                      Remote Version
                    </Label>
                  </div>
                  <div class="mt-2 p-2 bg-muted rounded text-sm">
                    <pre class="whitespace-pre-wrap">{{ JSON.stringify(conflict.remoteValue, null, 2) }}</pre>
                  </div>
                </div>
              </div>
            </RadioGroup>
            
            <div class="mt-3 flex justify-end">
              <Button
                size="sm"
                :disabled="!selectedResolutions.has(conflict.id)"
                @click="resolveConflict(conflict.id)"
              >
                Apply Resolution
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>