<script setup lang="ts">
import { ref, computed } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { FileText, AlertCircle } from 'lucide-vue-next'
import { documentMetadataSchema } from '~/schemas/document'
import type { DocumentCategory, UploadMetadata } from '~/types/document'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'
import { formatFileSize } from '~/schemas/document'

interface Props {
  files: File[]
  matterId?: string
  defaultCategory?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [metadata: UploadMetadata]
  cancel: []
}>()

// Form setup
const formSchema = documentMetadataSchema.extend({
  applyToAll: z.boolean().default(true)
})

type FormData = z.infer<typeof formSchema>

const { handleSubmit, defineField, errors, values } = useForm({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    title: props.files.length === 1 ? props.files[0].name.replace(/\.[^/.]+$/, '') : '',
    description: '',
    matterId: props.matterId || '',
    category: (props.defaultCategory as DocumentCategory) || 'other',
    tags: [],
    confidential: false,
    applyToAll: true
  }
})

// Form fields
const [title, titleAttrs] = defineField('title')
const [description, descriptionAttrs] = defineField('description')
const [matterId, matterIdAttrs] = defineField('matterId')
const [category, categoryAttrs] = defineField('category')
const [tags, tagsAttrs] = defineField('tags')
const [confidential, confidentialAttrs] = defineField('confidential')
const [applyToAll, applyToAllAttrs] = defineField('applyToAll')

// Ensure tags is always an array
if (!tags.value) {
  tags.value = []
}

// Local state
const tagInput = ref('')

// Computed
const totalSize = computed(() => 
  props.files.reduce((sum, file) => sum + file.size, 0)
)

const categoryOptions: Array<{ value: DocumentCategory; label: string }> = [
  { value: 'contract', label: 'Contract' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'court_filing', label: 'Court Filing' },
  { value: 'other', label: 'Other' }
]

// Handlers
const onSubmit = handleSubmit((formData: FormData) => {
  const { applyToAll, ...metadata } = formData
  emit('submit', metadata as UploadMetadata)
})

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && tags.value && !tags.value.includes(tag)) {
    tags.value = [...tags.value, tag]
    tagInput.value = ''
  }
}

const removeTag = (tag: string) => {
  if (tags.value) {
    tags.value = tags.value.filter(t => t !== tag)
  }
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="document-metadata-form">
    <form @submit="onSubmit" class="space-y-6">
      <!-- Files summary -->
      <div class="bg-muted/50 rounded-lg p-4 space-y-2">
        <h3 class="text-sm font-medium flex items-center gap-2">
          <FileText class="w-4 h-4" />
          Selected Files ({{ files.length }})
        </h3>
        <div class="space-y-1 max-h-32 overflow-y-auto">
          <div 
            v-for="file in files" 
            :key="file.name"
            class="text-xs text-muted-foreground flex items-center justify-between"
          >
            <span class="truncate mr-2">{{ file.name }}</span>
            <span class="flex-shrink-0">{{ formatFileSize(file.size) }}</span>
          </div>
        </div>
        <div class="text-xs text-muted-foreground pt-2 border-t">
          Total size: {{ formatFileSize(totalSize) }}
        </div>
      </div>
      
      <!-- Apply to all checkbox (for multiple files) -->
      <div v-if="files.length > 1" class="flex items-center space-x-2">
        <Checkbox
          :id="applyToAllAttrs.id"
          v-model:checked="applyToAll"
          v-bind="applyToAllAttrs"
        />
        <Label :for="applyToAllAttrs.id" class="text-sm">
          Apply metadata to all files
        </Label>
      </div>
      
      <!-- Title field -->
      <div class="space-y-2">
        <Label for="title">Title *</Label>
        <Input
          id="title"
          v-model="title"
          v-bind="titleAttrs"
          placeholder="Document title"
          :disabled="files.length > 1 && applyToAll"
        />
        <p v-if="files.length > 1 && applyToAll" class="text-xs text-muted-foreground">
          Individual file names will be used as titles
        </p>
        <span v-if="errors.title" class="text-xs text-destructive">
          {{ errors.title }}
        </span>
      </div>
      
      <!-- Description field -->
      <div class="space-y-2">
        <Label for="description">Description</Label>
        <Textarea
          id="description"
          v-model="description"
          v-bind="descriptionAttrs"
          placeholder="Optional document description"
          rows="3"
        />
      </div>
      
      <!-- Matter ID field -->
      <div v-if="!matterId" class="space-y-2">
        <Label for="matterId">Matter ID</Label>
        <Input
          id="matterId"
          v-model="matterId"
          v-bind="matterIdAttrs"
          placeholder="Associated matter ID (optional)"
        />
        <span v-if="errors.matterId" class="text-xs text-destructive">
          {{ errors.matterId }}
        </span>
      </div>
      
      <!-- Category field -->
      <div class="space-y-2">
        <Label for="category">Category *</Label>
        <Select v-model="category" v-bind="categoryAttrs">
          <SelectTrigger id="category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem 
              v-for="option in categoryOptions" 
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <span v-if="errors.category" class="text-xs text-destructive">
          {{ errors.category }}
        </span>
      </div>
      
      <!-- Tags field -->
      <div class="space-y-2">
        <Label for="tags">Tags</Label>
        <div class="flex gap-2">
          <Input
            id="tags"
            v-model="tagInput"
            placeholder="Add tags..."
            @keyup.enter.prevent="addTag"
          />
          <Button type="button" variant="outline" @click="addTag">
            Add
          </Button>
        </div>
        <div v-if="tags && tags.length > 0" class="flex flex-wrap gap-2 mt-2">
          <Badge 
            v-for="tag in tags" 
            :key="tag"
            variant="secondary"
            class="cursor-pointer"
            @click="removeTag(tag)"
          >
            {{ tag }}
            <span class="ml-1">×</span>
          </Badge>
        </div>
      </div>
      
      <!-- Confidential checkbox -->
      <div class="flex items-center space-x-2">
        <Checkbox
          :id="confidentialAttrs.id"
          v-model:checked="confidential"
          v-bind="confidentialAttrs"
        />
        <Label :for="confidentialAttrs.id" class="text-sm">
          Mark as confidential
        </Label>
      </div>
      
      <!-- Warning for confidential documents -->
      <div v-if="confidential" class="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
        <AlertCircle class="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5" />
        <div class="text-sm text-orange-600 dark:text-orange-400">
          <p class="font-medium">Confidential Document</p>
          <p class="text-xs mt-1">
            This document will be marked as confidential and access will be restricted.
          </p>
        </div>
      </div>
      
      <!-- Form actions -->
      <div class="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" @click="handleCancel">
          Cancel
        </Button>
        <Button type="submit">
          Upload {{ files.length }} {{ files.length === 1 ? 'File' : 'Files' }}
        </Button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.document-metadata-form {
  @apply w-full max-w-2xl mx-auto;
}
</style>