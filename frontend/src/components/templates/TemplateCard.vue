<template>
  <Card 
    :class="[
      'template-card',
      { 
        'is-favorite': template.isFavorite,
        'list-mode': viewMode === 'list',
        'hover-lift': !compact
      }
    ]"
    @click="$emit('click', template)"
  >
    <!-- Thumbnail -->
    <div class="card-thumbnail" :class="{ 'list-thumbnail': viewMode === 'list' }">
      <img 
        :src="template.thumbnailUrl" 
        :alt="`${template.name} template preview`"
        loading="lazy"
        class="thumbnail-image"
        @error="handleImageError"
      />
      
      <!-- Overlay actions -->
      <div class="card-actions">
        <Button 
          size="icon" 
          variant="ghost"
          class="action-button preview-button"
          @click.stop="$emit('preview', template)"
          :aria-label="`Preview ${template.name} template`"
        >
          <Eye class="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="ghost"
          class="action-button favorite-button"
          @click.stop="$emit('toggle-favorite', template.id)"
          :aria-label="template.isFavorite ? `Remove ${template.name} from favorites` : `Add ${template.name} to favorites`"
        >
          <Star 
            class="h-4 w-4" 
            :class="{ 'fill-current text-yellow-500': template.isFavorite }"
          />
        </Button>
      </div>
      
      <!-- File type badge -->
      <Badge 
        variant="secondary" 
        class="file-type-badge"
      >
        {{ template.metadata.fileType.toUpperCase() }}
      </Badge>
    </div>
    
    <!-- Content -->
    <CardContent :class="{ 'list-content': viewMode === 'list' }">
      <!-- Header -->
      <div class="card-header">
        <h4 class="template-name" :title="template.name">
          {{ template.name }}
        </h4>
        <Badge 
          :variant="getCategoryVariant(template.category)"
          class="category-badge"
        >
          {{ template.category.name }}
        </Badge>
      </div>
      
      <!-- Description -->
      <p class="template-description" :title="template.description">
        {{ template.description }}
      </p>
      
      <!-- Metadata -->
      <div class="template-meta">
        <div class="meta-item">
          <FileText class="meta-icon" />
          <span>{{ template.metadata.pageCount }} page{{ template.metadata.pageCount === 1 ? '' : 's' }}</span>
        </div>
        <div class="meta-item">
          <Clock class="meta-icon" />
          <span>~{{ template.metadata.estimatedTime }}min</span>
        </div>
        <div class="meta-item">
          <TrendingUp class="meta-icon" />
          <span>{{ template.statistics.usageCount }} use{{ template.statistics.usageCount === 1 ? '' : 's' }}</span>
        </div>
        <div v-if="template.statistics.userRating" class="meta-item">
          <Star class="meta-icon" />
          <span>{{ template.statistics.userRating.toFixed(1) }}</span>
        </div>
      </div>
      
      <!-- Tags (only in grid mode) -->
      <div v-if="viewMode === 'grid' && template.tags.length > 0" class="template-tags">
        <Badge
          v-for="tag in template.tags.slice(0, 3)"
          :key="tag"
          variant="outline"
          class="tag-badge"
        >
          {{ tag }}
        </Badge>
        <span v-if="template.tags.length > 3" class="more-tags">
          +{{ template.tags.length - 3 }} more
        </span>
      </div>
      
      <!-- Footer (only in list mode) -->
      <div v-if="viewMode === 'list'" class="card-footer">
        <div class="footer-info">
          <span class="last-updated">
            Updated {{ formatDate(template.updatedAt) }}
          </span>
          <span class="created-by">
            by {{ template.createdBy.name }}
          </span>
        </div>
        <div class="footer-actions">
          <Button
            size="sm"
            variant="outline"
            @click.stop="$emit('preview', template)"
          >
            Preview
          </Button>
          <Button
            size="sm"
            @click.stop="$emit('click', template)"
          >
            Use Template
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  FileText, 
  Clock, 
  TrendingUp, 
  Star, 
  Eye
} from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Template, TemplateCategory } from '@/types/template'

interface Props {
  template: Template
  viewMode?: 'grid' | 'list'
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'grid',
  compact: false
})

const emit = defineEmits<{
  click: [template: Template]
  preview: [template: Template]
  'toggle-favorite': [templateId: string]
}>()

// Methods
const getCategoryVariant = (category: TemplateCategory): "default" | "secondary" | "destructive" | "outline" => {
  const colorMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    blue: 'default',
    green: 'secondary',
    purple: 'outline',
    orange: 'secondary'
  }
  return colorMap[category.color] || 'default'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'today'
  if (diffInDays === 1) return 'yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/placeholder-template.svg' // Fallback image
}
</script>

<style scoped>
.template-card {
  @apply relative cursor-pointer transition-all duration-200 overflow-hidden;
  @apply hover:shadow-md hover:border-primary/50;
}

.template-card.hover-lift {
  @apply hover:-translate-y-1;
}

.template-card.is-favorite {
  @apply ring-2 ring-yellow-500/20;
}

.template-card.list-mode {
  @apply flex flex-row;
}

/* Thumbnail */
.card-thumbnail {
  @apply relative bg-muted aspect-[4/3] overflow-hidden;
}

.list-thumbnail {
  @apply w-32 aspect-[4/3] flex-shrink-0;
}

.thumbnail-image {
  @apply w-full h-full object-cover transition-transform duration-200;
}

.template-card:hover .thumbnail-image {
  @apply scale-105;
}

.card-actions {
  @apply absolute top-2 right-2 flex space-x-1 opacity-0 transition-opacity duration-200;
}

.template-card:hover .card-actions {
  @apply opacity-100;
}

.action-button {
  @apply h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background;
}

.preview-button:hover {
  @apply bg-primary text-primary-foreground;
}

.favorite-button:hover {
  @apply bg-yellow-500/10 text-yellow-600;
}

.file-type-badge {
  @apply absolute top-2 left-2 text-xs font-mono;
}

/* Content */
.card-content {
  @apply p-4 space-y-3;
}

.list-content {
  @apply flex-1 flex flex-col justify-between;
}

.card-header {
  @apply flex items-start justify-between gap-2;
}

.template-name {
  @apply font-medium text-sm line-clamp-2 flex-1;
}

.category-badge {
  @apply text-xs flex-shrink-0;
}

.template-description {
  @apply text-sm text-muted-foreground line-clamp-2;
}

.template-meta {
  @apply flex flex-wrap gap-3 text-xs text-muted-foreground;
}

.meta-item {
  @apply flex items-center gap-1;
}

.meta-icon {
  @apply h-3 w-3;
}

.template-tags {
  @apply flex flex-wrap gap-1;
}

.tag-badge {
  @apply text-xs px-1.5 py-0.5;
}

.more-tags {
  @apply text-xs text-muted-foreground;
}

/* List mode footer */
.card-footer {
  @apply flex items-center justify-between pt-3 border-t border-border;
}

.footer-info {
  @apply flex flex-col gap-1 text-xs text-muted-foreground;
}

.footer-actions {
  @apply flex gap-2;
}

/* Responsive design */
@media (max-width: 640px) {
  .template-card.list-mode {
    @apply flex-col;
  }
  
  .list-thumbnail {
    @apply w-full aspect-[16/9];
  }
  
  .template-meta {
    @apply grid grid-cols-2 gap-2;
  }
  
  .template-tags {
    @apply hidden;
  }
  
  .card-footer {
    @apply flex-col gap-2 items-stretch;
  }
  
  .footer-actions {
    @apply w-full;
  }
  
  .footer-actions .button {
    @apply flex-1;
  }
}

/* Accessibility */
.template-card:focus-visible {
  @apply ring-2 ring-primary ring-offset-2 outline-none;
}

/* Animation for favorite state */
.favorite-button .lucide-star {
  @apply transition-all duration-200;
}

.favorite-button .lucide-star.fill-current {
  @apply scale-110;
}

/* Loading state for images */
.thumbnail-image {
  @apply bg-muted;
}

.thumbnail-image[src=""] {
  @apply animate-pulse;
}
</style>