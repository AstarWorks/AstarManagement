<template>
  <div class="template-details">
    <!-- Basic Information -->
    <div class="details-section">
      <h4 class="section-title">Basic Information</h4>
      <div class="details-grid">
        <div class="detail-item">
          <label class="detail-label">Template Name</label>
          <p class="detail-value">{{ template.name }}</p>
        </div>
        
        <div class="detail-item">
          <label class="detail-label">Category</label>
          <div class="detail-value">
            <Badge :variant="getCategoryVariant(template.category)">
              {{ template.category.name }}
            </Badge>
          </div>
        </div>
        
        <div class="detail-item">
          <label class="detail-label">Description</label>
          <p class="detail-value">{{ template.description }}</p>
        </div>
        
        <div class="detail-item">
          <label class="detail-label">Version</label>
          <p class="detail-value">{{ template.version }}</p>
        </div>
        
        <div class="detail-item">
          <label class="detail-label">Language</label>
          <p class="detail-value">
            {{ template.metadata.language === 'en' ? 'English' : '日本語 (Japanese)' }}
          </p>
        </div>
        
        <div class="detail-item">
          <label class="detail-label">File Type</label>
          <p class="detail-value">{{ template.metadata.fileType.toUpperCase() }}</p>
        </div>
      </div>
    </div>

    <!-- Document Specifications -->
    <div class="details-section">
      <h4 class="section-title">Document Specifications</h4>
      <div class="details-grid">
        <div class="detail-item">
          <label class="detail-label">Page Count</label>
          <p class="detail-value">{{ template.metadata.pageCount }} page{{ template.metadata.pageCount === 1 ? '' : 's' }}</p>
        </div>
        
        <div class="detail-item">
          <label class="detail-label">Estimated Time</label>
          <p class="detail-value">{{ template.metadata.estimatedTime }} minutes</p>
        </div>
        
        <div class="detail-item">
          <label class="detail-label">Required Fields</label>
          <div class="detail-value">
            <div class="field-list">
              <Badge 
                v-for="field in template.metadata.requiredFields" 
                :key="field"
                variant="outline"
                class="field-badge"
              >
                {{ field }}
              </Badge>
            </div>
          </div>
        </div>
        
        <div v-if="template.metadata.approvalStatus" class="detail-item">
          <label class="detail-label">Approval Status</label>
          <div class="detail-value">
            <Badge :variant="getStatusVariant(template.metadata.approvalStatus)">
              {{ getStatusLabel(template.metadata.approvalStatus) }}
            </Badge>
          </div>
        </div>
      </div>
    </div>

    <!-- Usage Statistics -->
    <div class="details-section">
      <h4 class="section-title">Usage Statistics</h4>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <TrendingUp class="h-5 w-5 text-primary" />
          </div>
          <div class="stat-content">
            <p class="stat-value">{{ template.statistics.usageCount }}</p>
            <p class="stat-label">Times Used</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <Star class="h-5 w-5 text-yellow-500" />
          </div>
          <div class="stat-content">
            <p class="stat-value">{{ template.statistics.userRating?.toFixed(1) || 'N/A' }}</p>
            <p class="stat-label">User Rating</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <Heart class="h-5 w-5 text-red-500" />
          </div>
          <div class="stat-content">
            <p class="stat-value">{{ template.statistics.favoriteCount }}</p>
            <p class="stat-label">Favorites</p>
          </div>
        </div>
        
        <div v-if="template.statistics.successRate" class="stat-card">
          <div class="stat-icon">
            <CheckCircle class="h-5 w-5 text-green-500" />
          </div>
          <div class="stat-content">
            <p class="stat-value">{{ template.statistics.successRate }}%</p>
            <p class="stat-label">Success Rate</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tags -->
    <div v-if="template.tags.length > 0" class="details-section">
      <h4 class="section-title">Tags</h4>
      <div class="tags-container">
        <Badge 
          v-for="tag in template.tags" 
          :key="tag"
          variant="outline"
          class="tag-badge"
        >
          {{ tag }}
        </Badge>
      </div>
    </div>

    <!-- Related Templates -->
    <div v-if="template.metadata.relatedTemplates.length > 0" class="details-section">
      <h4 class="section-title">Related Templates</h4>
      <div class="related-templates">
        <div 
          v-for="relatedId in template.metadata.relatedTemplates" 
          :key="relatedId"
          class="related-item"
        >
          <FileText class="h-4 w-4 text-muted-foreground" />
          <span class="related-name">Template {{ relatedId }}</span>
          <Button 
            size="sm" 
            variant="ghost"
            @click="$emit('view-related', relatedId)"
          >
            View
          </Button>
        </div>
      </div>
    </div>

    <!-- Timestamps -->
    <div class="details-section">
      <h4 class="section-title">Timeline</h4>
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-icon">
            <Plus class="h-4 w-4" />
          </div>
          <div class="timeline-content">
            <p class="timeline-title">Created</p>
            <p class="timeline-date">{{ formatDate(template.createdAt) }}</p>
            <p class="timeline-author">by {{ template.createdBy.name }}</p>
          </div>
        </div>
        
        <div class="timeline-item">
          <div class="timeline-icon">
            <Edit class="h-4 w-4" />
          </div>
          <div class="timeline-content">
            <p class="timeline-title">Last Updated</p>
            <p class="timeline-date">{{ formatDate(template.updatedAt) }}</p>
            <p v-if="template.metadata.lastModifiedBy" class="timeline-author">
              by {{ template.metadata.lastModifiedBy }}
            </p>
          </div>
        </div>
        
        <div v-if="template.statistics.lastUsedAt" class="timeline-item">
          <div class="timeline-icon">
            <Clock class="h-4 w-4" />
          </div>
          <div class="timeline-content">
            <p class="timeline-title">Last Used</p>
            <p class="timeline-date">{{ formatDate(template.statistics.lastUsedAt) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  TrendingUp, 
  Star, 
  Heart, 
  CheckCircle, 
  FileText, 
  Plus, 
  Edit, 
  Clock 
} from 'lucide-vue-next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import type { Template, TemplateCategory } from '~/types/template'

interface Props {
  template: Template
}

defineProps<Props>()

const emit = defineEmits<{
  'view-related': [templateId: string]
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

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const statusMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: 'outline',
    approved: 'default',
    deprecated: 'destructive'
  }
  return statusMap[status] || 'secondary'
}

const getStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    draft: 'Draft',
    approved: 'Approved',
    deprecated: 'Deprecated'
  }
  return labelMap[status] || status
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.template-details {
  @apply space-y-6;
}

.details-section {
  @apply space-y-4;
}

.section-title {
  @apply text-lg font-semibold text-foreground;
}

.details-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.detail-item {
  @apply space-y-1;
}

.detail-label {
  @apply text-sm font-medium text-muted-foreground;
}

.detail-value {
  @apply text-sm text-foreground;
}

.field-list {
  @apply flex flex-wrap gap-1;
}

.field-badge {
  @apply text-xs;
}

/* Statistics */
.stats-grid {
  @apply grid grid-cols-2 lg:grid-cols-4 gap-4;
}

.stat-card {
  @apply flex items-center space-x-3 p-4 rounded-lg border border-border bg-card;
}

.stat-icon {
  @apply flex-shrink-0;
}

.stat-content {
  @apply flex-1 min-w-0;
}

.stat-value {
  @apply text-lg font-semibold text-foreground;
}

.stat-label {
  @apply text-xs text-muted-foreground;
}

/* Tags */
.tags-container {
  @apply flex flex-wrap gap-2;
}

.tag-badge {
  @apply text-sm;
}

/* Related templates */
.related-templates {
  @apply space-y-2;
}

.related-item {
  @apply flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30;
}

.related-name {
  @apply flex-1 text-sm font-medium;
}

/* Timeline */
.timeline {
  @apply space-y-4;
}

.timeline-item {
  @apply flex items-start space-x-3;
}

.timeline-icon {
  @apply flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary flex-shrink-0;
}

.timeline-content {
  @apply flex-1 min-w-0;
}

.timeline-title {
  @apply text-sm font-medium text-foreground;
}

.timeline-date {
  @apply text-sm text-muted-foreground;
}

.timeline-author {
  @apply text-xs text-muted-foreground italic;
}

/* Responsive design */
@media (max-width: 768px) {
  .details-grid {
    @apply grid-cols-1;
  }
  
  .stats-grid {
    @apply grid-cols-1 sm:grid-cols-2;
  }
  
  .stat-card {
    @apply p-3;
  }
  
  .stat-value {
    @apply text-base;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    @apply grid-cols-1;
  }
  
  .related-item {
    @apply flex-col items-start space-y-2;
  }
  
  .related-item .button {
    @apply self-end;
  }
}

/* Enhanced visual hierarchy */
.details-section:not(:last-child) {
  @apply pb-6 border-b border-border;
}

/* Improved spacing for readability */
.detail-item {
  @apply p-3 rounded-lg bg-muted/20;
}

.detail-label {
  @apply mb-2;
}

/* Animation for interactive elements */
.stat-card {
  @apply transition-colors duration-200 hover:bg-muted/40;
}

.related-item {
  @apply transition-colors duration-200 hover:bg-muted/50;
}

/* Focus styles for accessibility */
.related-item:focus-within {
  @apply ring-2 ring-primary ring-offset-2;
}

/* Enhanced badge styling */
.field-badge,
.tag-badge {
  @apply transition-colors duration-200 hover:bg-primary/10;
}
</style>