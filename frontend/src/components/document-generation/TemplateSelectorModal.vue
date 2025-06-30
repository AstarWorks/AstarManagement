<template>
  <Dialog :open="true" @update:open="handleClose">
    <DialogContent class="template-selector-modal max-w-4xl max-h-[80vh] overflow-hidden">
      <DialogHeader>
        <DialogTitle>Select Template</DialogTitle>
        <DialogDescription>
          Choose a template to generate your document. Browse by category or search for specific templates.
        </DialogDescription>
      </DialogHeader>
      
      <div class="modal-content">
        <div class="flex flex-col h-full">
          <!-- Search and Filters -->
          <div class="search-section">
            <div class="flex items-center gap-4 mb-4">
              <div class="search-box flex-1">
                <Search class="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  v-model="searchQuery"
                  placeholder="Search templates..."
                  class="pl-9"
                />
              </div>
              
              <Select v-model="selectedCategory">
                <SelectTrigger class="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem 
                    v-for="category in categories"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Template Grid -->
          <div class="template-grid flex-1 overflow-auto">
            <div v-if="filteredTemplates.length === 0" class="empty-state">
              <div class="text-center py-12">
                <FileText class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 class="text-lg font-medium mb-2">No templates found</h3>
                <p class="text-muted-foreground">
                  Try adjusting your search or category filter
                </p>
              </div>
            </div>
            
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="template in filteredTemplates"
                :key="template.id"
                class="template-card"
                @click="selectTemplate(template)"
              >
                <Card class="template-card-content cursor-pointer hover:shadow-md transition-all duration-200">
                  <CardContent class="p-4">
                    <div class="template-header">
                      <div class="flex items-start gap-3 mb-3">
                        <div class="template-icon">
                          <FileText class="h-8 w-8 text-blue-500" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="font-medium text-sm truncate">{{ template.name }}</h4>
                          <div class="text-xs text-muted-foreground">
                            {{ template.category }}
                          </div>
                        </div>
                        <Badge 
                          v-if="template.isPremium" 
                          variant="outline"
                          class="text-xs"
                        >
                          Premium
                        </Badge>
                      </div>
                    </div>
                    
                    <div class="template-description">
                      <p class="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {{ template.description }}
                      </p>
                    </div>
                    
                    <div class="template-meta">
                      <div class="flex items-center justify-between text-xs text-muted-foreground">
                        <div class="flex items-center gap-3">
                          <span class="flex items-center gap-1">
                            <Variable class="h-3 w-3" />
                            {{ template.variableCount }} vars
                          </span>
                          <span class="flex items-center gap-1">
                            <Clock class="h-3 w-3" />
                            {{ template.lastUsed ? formatRelativeTime(template.lastUsed) : 'Never used' }}
                          </span>
                        </div>
                        <div class="usage-count">
                          Used {{ template.usageCount || 0 }} times
                        </div>
                      </div>
                    </div>
                    
                    <!-- Template Preview -->
                    <div v-if="template.preview" class="template-preview mt-3">
                      <div class="preview-content">
                        <div class="text-xs font-medium mb-1">Preview:</div>
                        <div class="preview-text text-xs text-muted-foreground line-clamp-3">
                          {{ template.preview }}
                        </div>
                      </div>
                    </div>
                    
                    <!-- Template Tags -->
                    <div v-if="template.tags?.length" class="template-tags mt-3">
                      <div class="flex flex-wrap gap-1">
                        <Badge
                          v-for="tag in template.tags.slice(0, 3)"
                          :key="tag"
                          variant="secondary"
                          class="text-xs"
                        >
                          {{ tag }}
                        </Badge>
                        <Badge
                          v-if="template.tags.length > 3"
                          variant="outline"
                          class="text-xs"
                        >
                          +{{ template.tags.length - 3 }}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <!-- Recent Templates Section -->
          <div v-if="recentTemplates.length > 0" class="recent-section mt-6">
            <div class="border-t pt-4">
              <h4 class="text-sm font-medium mb-3">Recently Used</h4>
              <div class="flex gap-2 overflow-x-auto pb-2">
                <Button
                  v-for="template in recentTemplates"
                  :key="template.id"
                  @click="selectTemplate(template)"
                  variant="outline"
                  size="sm"
                  class="flex-shrink-0"
                >
                  <FileText class="h-3 w-3 mr-2" />
                  {{ template.name }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <div class="flex items-center justify-between w-full">
          <div class="template-count text-sm text-muted-foreground">
            {{ filteredTemplates.length }} templates available
          </div>
          <div class="modal-actions">
            <Button @click="handleClose" variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, FileText, Variable, Clock } from 'lucide-vue-next'

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

// Utils
import { formatRelativeTime } from '~/utils/formatters'

// Types
interface Template {
  id: string
  name: string
  description: string
  category: string
  variableCount: number
  lastUsed?: Date
  usageCount: number
  isPremium?: boolean
  preview?: string
  tags?: string[]
}

interface Category {
  id: string
  name: string
  count: number
}

// Emits
const emit = defineEmits<{
  select: [template: Template]
  close: []
}>()

// State
const searchQuery = ref('')
const selectedCategory = ref('all')

// Mock Data
const templates = ref<Template[]>([
  {
    id: 'will-basic',
    name: 'Basic Will Template',
    description: 'A simple last will and testament template for basic estate planning needs.',
    category: 'Estate Planning',
    variableCount: 8,
    lastUsed: new Date(Date.now() - 86400000), // 1 day ago
    usageCount: 24,
    preview: 'I, [CLIENT_NAME], being of sound mind and disposing memory, do hereby make, publish and declare this to be my Last Will and Testament...',
    tags: ['will', 'estate', 'basic', 'individual']
  },
  {
    id: 'contract-amendment',
    name: 'Contract Amendment',
    description: 'Standard template for amending existing contracts with detailed modification clauses.',
    category: 'Contracts',
    variableCount: 12,
    lastUsed: new Date(Date.now() - 172800000), // 2 days ago
    usageCount: 18,
    preview: 'This Amendment is entered into on [AMENDMENT_DATE] between [PARTY_1] and [PARTY_2] to modify the original contract dated [ORIGINAL_DATE]...',
    tags: ['contract', 'amendment', 'modification', 'business']
  },
  {
    id: 'power-of-attorney',
    name: 'Power of Attorney',
    description: 'Comprehensive power of attorney document with customizable authority levels.',
    category: 'Estate Planning',
    variableCount: 15,
    lastUsed: new Date(Date.now() - 604800000), // 1 week ago
    usageCount: 31,
    isPremium: true,
    preview: 'I, [PRINCIPAL_NAME], hereby appoint [AGENT_NAME] as my attorney-in-fact to act in my name, place and stead...',
    tags: ['power of attorney', 'agent', 'authority', 'legal']
  },
  {
    id: 'employment-contract',
    name: 'Employment Contract',
    description: 'Standard employment agreement with salary, benefits, and termination clauses.',
    category: 'Employment',
    variableCount: 20,
    lastUsed: new Date(Date.now() - 259200000), // 3 days ago
    usageCount: 42,
    preview: 'This Employment Agreement is made between [COMPANY_NAME] and [EMPLOYEE_NAME] for the position of [JOB_TITLE]...',
    tags: ['employment', 'contract', 'salary', 'benefits']
  },
  {
    id: 'lease-agreement',
    name: 'Residential Lease Agreement',
    description: 'Comprehensive residential lease agreement with standard terms and conditions.',
    category: 'Real Estate',
    variableCount: 25,
    usageCount: 67,
    preview: 'This Lease Agreement is made between [LANDLORD_NAME] (Landlord) and [TENANT_NAME] (Tenant) for the rental of [PROPERTY_ADDRESS]...',
    tags: ['lease', 'rental', 'residential', 'property']
  },
  {
    id: 'partnership-agreement',
    name: 'Business Partnership Agreement',
    description: 'Detailed partnership agreement for business ventures with profit sharing and management clauses.',
    category: 'Business',
    variableCount: 30,
    lastUsed: new Date(Date.now() - 432000000), // 5 days ago
    usageCount: 15,
    isPremium: true,
    preview: 'This Partnership Agreement is entered into by [PARTNER_1_NAME] and [PARTNER_2_NAME] to establish a business partnership...',
    tags: ['partnership', 'business', 'profit sharing', 'management']
  }
])

const categories = ref<Category[]>([
  { id: 'estate-planning', name: 'Estate Planning', count: 2 },
  { id: 'contracts', name: 'Contracts', count: 1 },
  { id: 'employment', name: 'Employment', count: 1 },
  { id: 'real-estate', name: 'Real Estate', count: 1 },
  { id: 'business', name: 'Business', count: 1 }
])

// Computed
const filteredTemplates = computed(() => {
  let filtered = templates.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(template =>
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Category filter
  if (selectedCategory.value !== 'all') {
    const categoryName = categories.value.find(c => c.id === selectedCategory.value)?.name
    if (categoryName) {
      filtered = filtered.filter(template => template.category === categoryName)
    }
  }

  // Sort by usage and recency
  return filtered.sort((a, b) => {
    // Recently used templates first
    if (a.lastUsed && b.lastUsed) {
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    }
    if (a.lastUsed && !b.lastUsed) return -1
    if (!a.lastUsed && b.lastUsed) return 1
    
    // Then by usage count
    return b.usageCount - a.usageCount
  })
})

const recentTemplates = computed(() => {
  return templates.value
    .filter(t => t.lastUsed)
    .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
    .slice(0, 3)
})

// Methods
const selectTemplate = (template: Template) => {
  emit('select', template)
}

const handleClose = () => {
  emit('close')
}

// Lifecycle
onMounted(() => {
  // Focus search input
  // In a real implementation, you might load templates from an API here
})
</script>

<style scoped>
.template-selector-modal {
  @apply w-full h-full;
}

.modal-content {
  @apply flex-1 overflow-hidden;
}

.search-section {
  @apply flex-shrink-0;
}

.search-box {
  @apply relative;
}

.template-grid {
  @apply min-h-0;
}

.empty-state {
  @apply border-2 border-dashed border-muted-foreground/25 rounded-lg;
}

.template-card {
  @apply transition-all duration-200;
}

.template-card:hover .template-card-content {
  @apply shadow-lg border-primary/20;
}

.template-card-content {
  @apply h-full transition-all duration-200;
}

.template-header {
  @apply border-b border-muted/50 pb-3;
}

.template-icon {
  @apply flex-shrink-0;
}

.template-description {
  @apply min-h-0;
}

.template-meta {
  @apply border-t border-muted/50 pt-2;
}

.template-preview {
  @apply border-t border-muted/50 pt-2;
}

.preview-content {
  @apply bg-muted/30 p-2 rounded text-xs;
}

.preview-text {
  @apply font-mono leading-relaxed;
}

.template-tags {
  @apply border-t border-muted/50 pt-2;
}

.recent-section {
  @apply flex-shrink-0;
}

.template-count {
  @apply flex-shrink-0;
}

.modal-actions {
  @apply flex items-center gap-2;
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .search-section .flex {
    @apply flex-col gap-2;
  }
  
  .template-grid .grid {
    @apply grid-cols-1;
  }
  
  .recent-section .flex {
    @apply flex-col gap-2;
  }
  
  .modal-actions {
    @apply w-full justify-end;
  }
}

/* Scrollbar styling */
.template-grid::-webkit-scrollbar,
.recent-section .flex::-webkit-scrollbar {
  @apply w-2 h-2;
}

.template-grid::-webkit-scrollbar-track,
.recent-section .flex::-webkit-scrollbar-track {
  @apply bg-muted/30;
}

.template-grid::-webkit-scrollbar-thumb,
.recent-section .flex::-webkit-scrollbar-thumb {
  @apply bg-muted-foreground/30 rounded;
}

.template-grid::-webkit-scrollbar-thumb:hover,
.recent-section .flex::-webkit-scrollbar-thumb:hover {
  @apply bg-muted-foreground/50;
}
</style>