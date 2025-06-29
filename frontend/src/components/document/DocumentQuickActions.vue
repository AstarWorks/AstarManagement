<template>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" :title="`More actions for ${document.fileName}`">
        <MoreHorizontal class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    
    <DropdownMenuContent align="end" class="w-48">
      <!-- Preview actions -->
      <DropdownMenuItem @click="$emit('action', 'preview')">
        <Eye class="h-4 w-4 mr-2" />
        Preview
      </DropdownMenuItem>
      
      <DropdownMenuItem @click="$emit('action', 'download')">
        <Download class="h-4 w-4 mr-2" />
        Download
      </DropdownMenuItem>
      
      <DropdownMenuSeparator />
      
      <!-- Share actions -->
      <DropdownMenuItem @click="$emit('action', 'share')">
        <Share2 class="h-4 w-4 mr-2" />
        Share
      </DropdownMenuItem>
      
      <DropdownMenuItem @click="$emit('action', 'copy-link')">
        <Link class="h-4 w-4 mr-2" />
        Copy Link
      </DropdownMenuItem>
      
      <DropdownMenuSeparator />
      
      <!-- Edit actions -->
      <DropdownMenuItem @click="$emit('action', 'rename')">
        <Edit class="h-4 w-4 mr-2" />
        Rename
      </DropdownMenuItem>
      
      <DropdownMenuItem @click="$emit('action', 'move')">
        <FolderOpen class="h-4 w-4 mr-2" />
        Move
      </DropdownMenuItem>
      
      <DropdownMenuItem @click="$emit('action', 'duplicate')">
        <Copy class="h-4 w-4 mr-2" />
        Duplicate
      </DropdownMenuItem>
      
      <DropdownMenuSeparator />
      
      <!-- Advanced actions -->
      <DropdownMenuItem @click="$emit('action', 'properties')">
        <Info class="h-4 w-4 mr-2" />
        Properties
      </DropdownMenuItem>
      
      <DropdownMenuItem @click="$emit('action', 'version-history')">
        <History class="h-4 w-4 mr-2" />
        Version History
      </DropdownMenuItem>
      
      <DropdownMenuSeparator />
      
      <!-- Danger zone -->
      <DropdownMenuItem 
        @click="$emit('action', 'delete')"
        class="text-destructive focus:text-destructive focus:bg-destructive/10"
      >
        <Trash2 class="h-4 w-4 mr-2" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import {
  MoreHorizontal,
  Eye,
  Download,
  Share2,
  Link,
  Edit,
  FolderOpen,
  Copy,
  Info,
  History,
  Trash2
} from 'lucide-vue-next'

import { Button } from '~/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '~/components/ui/dropdown-menu'

import type { Document, DocumentAction } from '~/types/document'

interface Props {
  document: Document
}

interface Emits {
  (e: 'action', action: DocumentAction): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
/* Custom styling handled by shadcn-vue dropdown components */
</style>