<template>
  <Card v-if="attachments && attachments.length > 0">
    <CardHeader>
      <div class="flex justify-between items-center">
        <CardTitle>{{ t('expense.form.fields.attachments') }}</CardTitle>
        <NuxtLink 
          :to="`/expenses/${expenseId}/attachments`" 
          class="text-sm text-primary hover:underline"
        >
          {{ t('expense.actions.manageAttachments') }}
        </NuxtLink>
      </div>
    </CardHeader>
    <CardContent>
      <div class="space-y-2">
        <div 
          v-for="attachment in attachments" 
          :key="attachment.id"
          class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <Icon 
              :name="getFileIcon(attachment.mimeType)" 
              class="w-5 h-5 text-muted-foreground" 
            />
            <div>
              <p class="font-medium">{{ attachment.fileName }}</p>
              <p class="text-sm text-muted-foreground">
                {{ formatFileSize(attachment.fileSize) }}
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button
              v-if="isPreviewable(attachment.mimeType)"
              variant="ghost"
              size="sm"
              @click="$emit('preview', attachment)"
            >
              <Icon name="lucide:eye" class="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              @click="handleDownload(attachment)"
            >
              <Icon name="lucide:download" class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { IAttachment } from '~/types/expense'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Icon } from '#components'

interface Props {
  attachments: IAttachment[]
  expenseId: string
}

defineProps<Props>()
defineEmits<{
  preview: [attachment: IAttachment]
}>()

const { t } = useI18n()
const NuxtLink = resolveComponent('NuxtLink')

// File icon mapping
const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'lucide:image'
  if (mimeType === 'application/pdf') return 'lucide:file-text'
  if (mimeType.startsWith('video/')) return 'lucide:video'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'lucide:file-text'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'lucide:table'
  return 'lucide:file'
}

// Check if file can be previewed
const isPreviewable = (mimeType: string): boolean => {
  const previewableTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ]
  return previewableTypes.includes(mimeType)
}

// Format file size
const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// Handle file download
const handleDownload = (attachment: IAttachment) => {
  // In production, this would trigger actual download
  // For now, just log
  console.log('Downloading:', attachment.fileName)
  // TODO: Implement actual download logic
}
</script>