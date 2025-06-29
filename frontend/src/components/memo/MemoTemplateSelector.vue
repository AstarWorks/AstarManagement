<!--
  Memo Template Selector Component
  Provides template selection with preview and variable input
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { 
  Search, 
  FileText, 
  Briefcase, 
  MessageCircle, 
  Bell, 
  Scale, 
  User,
  Star,
  Clock,
  ChevronDown,
  Eye,
  Plus
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Card } from '~/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useMemoTemplateStore, type MemoTemplate, type TemplateVariable } from '~/stores/memoTemplates'

interface Props {
  /** Show categories in sidebar */
  showCategories?: boolean
  /** Maximum height for template list */
  maxHeight?: string
  /** Show template preview */
  showPreview?: boolean
  /** Default active tab */
  defaultTab?: string
}

const props = withDefaults(defineProps<Props>(), {
  showCategories: true,
  maxHeight: '400px',
  showPreview: true,
  defaultTab: 'all'
})

const emit = defineEmits<{
  /** Template selected with variables */
  templateSelected: [template: MemoTemplate, variables: Record<string, string>]
  /** Template preview requested */
  templatePreview: [template: MemoTemplate]
}>()

// Template store
const templateStore = useMemoTemplateStore()

// Local state
const searchQuery = ref('')
const selectedCategory = ref<string>('')
const activeTab = ref(props.defaultTab)
const selectedTemplate = ref<MemoTemplate | null>(null)
const templateVariables = ref<Record<string, string>>({})
const showVariableDialog = ref(false)
const showPreviewDialog = ref(false)

// Template icons
const categoryIcons = {
  formal: Briefcase,
  informal: MessageCircle,
  notice: Bell,
  legal: Scale,
  custom: User
}

// Computed
const filteredTemplates = computed(() => {
  let templates = templateStore.filteredTemplates

  if (activeTab.value === 'popular') {
    templates = templateStore.popularTemplates
  } else if (activeTab.value === 'recent') {
    templates = templateStore.recentTemplates
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    templates = templates.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    )
  }

  if (selectedCategory.value) {
    templates = templates.filter(t => t.category === selectedCategory.value)
  }

  return templates
})

const selectedTemplateVariables = computed(() => {
  if (!selectedTemplate.value) return []
  return templateStore.getVariableDefinitions(selectedTemplate.value.variables)
})

const canInsertTemplate = computed(() => {
  if (!selectedTemplate.value) return false
  
  const requiredVars = selectedTemplateVariables.value.filter(v => v.required)
  return requiredVars.every(v => templateVariables.value[v.key]?.trim())
})

// Methods
const selectTemplate = (template: MemoTemplate) => {
  selectedTemplate.value = template
  
  // Initialize variables with default values
  const variables: Record<string, string> = {}
  const varDefinitions = templateStore.getVariableDefinitions(template.variables)
  
  varDefinitions.forEach(varDef => {
    if (varDef.defaultValue) {
      variables[varDef.key] = varDef.defaultValue
    } else {
      variables[varDef.key] = ''
    }
  })
  
  templateVariables.value = variables
  
  if (template.variables.length > 0) {
    showVariableDialog.value = true
  } else {
    insertTemplate()
  }
}

const insertTemplate = () => {
  if (!selectedTemplate.value) return
  
  emit('templateSelected', selectedTemplate.value, templateVariables.value)
  closeDialogs()
}

const previewTemplate = (template: MemoTemplate) => {
  selectedTemplate.value = template
  emit('templatePreview', template)
  showPreviewDialog.value = true
}

const closeDialogs = () => {
  showVariableDialog.value = false
  showPreviewDialog.value = false
  selectedTemplate.value = null
  templateVariables.value = {}
}

const filterByCategory = (category: string) => {
  selectedCategory.value = selectedCategory.value === category ? '' : category
  templateStore.searchTemplates({ 
    category: selectedCategory.value || undefined,
    query: searchQuery.value || undefined
  })
}

const handleSearch = () => {
  templateStore.searchTemplates({
    query: searchQuery.value || undefined,
    category: selectedCategory.value || undefined
  })
}

// Watch for search changes
watch(searchQuery, handleSearch)

// Initialize
onMounted(() => {
  if (templateStore.templates.length === 0) {
    templateStore.fetchTemplates()
  }
})
</script>

<template>
  <div class="memo-template-selector">
    <!-- Search Bar -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <Search class="search-icon" />
        <Input
          v-model="searchQuery"
          placeholder="Search templates..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Category Filter (if enabled) -->
    <div v-if="showCategories" class="category-filter">
      <div class="category-buttons">
        <Button
          v-for="category in templateStore.templateCategories"
          :key="category.id"
          :variant="selectedCategory === category.id ? 'default' : 'ghost'"
          size="sm"
          @click="filterByCategory(category.id)"
          class="category-button"
        >
          <component :is="categoryIcons[category.id as keyof typeof categoryIcons] || FileText" class="category-icon" />
          {{ category.name }}
          <Badge variant="secondary" class="category-count">
            {{ category.templates.length }}
          </Badge>
        </Button>
      </div>
    </div>

    <!-- Template Tabs -->
    <Tabs v-model="activeTab" class="template-tabs">
      <TabsList class="tabs-list">
        <TabsTrigger value="all">All Templates</TabsTrigger>
        <TabsTrigger value="popular">
          <Star class="h-4 w-4" />
          Popular
        </TabsTrigger>
        <TabsTrigger value="recent">
          <Clock class="h-4 w-4" />
          Recent
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" class="tab-content">
        <ScrollArea :style="{ height: maxHeight }" class="template-list">
          <div class="template-grid">
            <Card
              v-for="template in filteredTemplates"
              :key="template.id"
              class="template-card"
              @click="selectTemplate(template)"
            >
              <div class="template-header">
                <div class="template-info">
                  <h3 class="template-name">{{ template.name }}</h3>
                  <p class="template-description">{{ template.description }}</p>
                </div>
                <div class="template-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    @click.stop="previewTemplate(template)"
                    class="preview-button"
                  >
                    <Eye class="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div class="template-meta">
                <Badge :variant="template.isSystem ? 'secondary' : 'outline'" class="category-badge">
                  {{ template.category }}
                </Badge>
                <span class="usage-count">{{ template.usage }} uses</span>
                <div v-if="template.variables.length > 0" class="variables-count">
                  {{ template.variables.length }} variables
                </div>
              </div>
            </Card>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="popular" class="tab-content">
        <ScrollArea :style="{ height: maxHeight }" class="template-list">
          <div class="template-grid">
            <Card
              v-for="template in templateStore.popularTemplates"
              :key="template.id"
              class="template-card popular"
              @click="selectTemplate(template)"
            >
              <div class="template-header">
                <div class="template-info">
                  <h3 class="template-name">
                    <Star class="popular-icon" />
                    {{ template.name }}
                  </h3>
                  <p class="template-description">{{ template.description }}</p>
                </div>
              </div>
              <div class="template-meta">
                <Badge variant="secondary">{{ template.category }}</Badge>
                <span class="usage-count">{{ template.usage }} uses</span>
              </div>
            </Card>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="recent" class="tab-content">
        <ScrollArea :style="{ height: maxHeight }" class="template-list">
          <div class="template-grid">
            <Card
              v-for="template in templateStore.recentTemplates"
              :key="template.id"
              class="template-card recent"
              @click="selectTemplate(template)"
            >
              <div class="template-header">
                <div class="template-info">
                  <h3 class="template-name">
                    <Clock class="recent-icon" />
                    {{ template.name }}
                  </h3>
                  <p class="template-description">{{ template.description }}</p>
                </div>
              </div>
              <div class="template-meta">
                <Badge variant="outline">{{ template.category }}</Badge>
                <span class="updated-date">
                  {{ template.updatedAt.toLocaleDateString() }}
                </span>
              </div>
            </Card>
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>

    <!-- Template Variables Dialog -->
    <Dialog v-model:open="showVariableDialog">
      <DialogContent class="variable-dialog">
        <DialogHeader>
          <DialogTitle>Template Variables</DialogTitle>
        </DialogHeader>
        
        <div v-if="selectedTemplate" class="variable-form">
          <p class="variable-description">
            Fill in the variables for "{{ selectedTemplate.name }}"
          </p>
          
          <div class="variable-fields">
            <div
              v-for="variable in selectedTemplateVariables"
              :key="variable.key"
              class="variable-field"
            >
              <Label :for="variable.key" class="variable-label">
                {{ variable.label }}
                <span v-if="variable.required" class="required">*</span>
              </Label>
              
              <Input
                v-if="variable.type === 'text'"
                :id="variable.key"
                v-model="templateVariables[variable.key]"
                :placeholder="variable.placeholder"
                :required="variable.required"
                class="variable-input"
              />
              
              <Input
                v-else-if="variable.type === 'date'"
                :id="variable.key"
                v-model="templateVariables[variable.key]"
                type="date"
                :required="variable.required"
                class="variable-input"
              />
              
              <Select
                v-else-if="variable.type === 'select'"
                v-model="templateVariables[variable.key]"
              >
                <SelectTrigger class="variable-input">
                  <SelectValue :placeholder="`Select ${variable.label}`" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in variable.options"
                    :key="option"
                    :value="option"
                  >
                    {{ option }}
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <p v-if="variable.description" class="variable-help">
                {{ variable.description }}
              </p>
            </div>
          </div>
          
          <div class="dialog-actions">
            <Button variant="ghost" @click="closeDialogs()">
              Cancel
            </Button>
            <Button 
              :disabled="!canInsertTemplate" 
              @click="insertTemplate()"
            >
              Insert Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Template Preview Dialog -->
    <Dialog v-model:open="showPreviewDialog">
      <DialogContent class="preview-dialog">
        <DialogHeader>
          <DialogTitle>Template Preview</DialogTitle>
        </DialogHeader>
        
        <div v-if="selectedTemplate" class="preview-content">
          <div class="preview-header">
            <h3>{{ selectedTemplate.name }}</h3>
            <p>{{ selectedTemplate.description }}</p>
          </div>
          
          <div class="preview-body">
            <pre class="template-content">{{ selectedTemplate.content }}</pre>
          </div>
          
          <div class="preview-footer">
            <Button @click="selectTemplate(selectedTemplate)">
              Use This Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Empty State -->
    <div v-if="filteredTemplates.length === 0 && !templateStore.loading" class="empty-state">
      <FileText class="empty-icon" />
      <p class="empty-text">No templates found</p>
      <Button variant="ghost" size="sm" @click="searchQuery = ''; selectedCategory = ''">
        Clear filters
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="templateStore.loading" class="loading-state">
      <div class="loading-spinner" />
      <p>Loading templates...</p>
    </div>
  </div>
</template>

<style scoped>
.memo-template-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
}

/* Search Bar */
.search-bar {
  display: flex;
  gap: 0.5rem;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: hsl(var(--muted-foreground));
  pointer-events: none;
}

.search-input {
  padding-left: 2.5rem;
}

/* Category Filter */
.category-filter {
  border-bottom: 1px solid hsl(var(--border));
  padding-bottom: 1rem;
}

.category-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  height: 2rem;
  padding: 0 0.75rem;
  font-size: 0.875rem;
}

.category-icon {
  width: 1rem;
  height: 1rem;
}

.category-count {
  margin-left: 0.25rem;
  font-size: 0.75rem;
}

/* Template Tabs */
.template-tabs {
  flex: 1;
}

.tabs-list {
  grid-template-columns: repeat(3, 1fr);
}

.tab-content {
  margin-top: 1rem;
}

/* Template Grid */
.template-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.template-card {
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-card:hover {
  background: hsl(var(--muted) / 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.template-card.popular {
  border-left: 3px solid hsl(var(--primary));
}

.template-card.recent {
  border-left: 3px solid hsl(var(--secondary));
}

.template-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.template-info {
  flex: 1;
  min-width: 0;
}

.template-name {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: hsl(var(--foreground));
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.popular-icon,
.recent-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: hsl(var(--primary));
}

.template-description {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.template-actions {
  display: flex;
  gap: 0.25rem;
}

.preview-button {
  padding: 0.25rem;
  width: 2rem;
  height: 2rem;
}

.template-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
}

.category-badge {
  font-size: 0.625rem;
}

.usage-count,
.updated-date,
.variables-count {
  font-size: 0.75rem;
}

/* Variable Dialog */
.variable-dialog {
  max-width: 500px;
}

.variable-description {
  color: hsl(var(--muted-foreground));
  margin-bottom: 1rem;
}

.variable-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 1.5rem;
}

.variable-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.variable-label {
  font-weight: 500;
  font-size: 0.875rem;
}

.required {
  color: hsl(var(--destructive));
}

.variable-input {
  width: 100%;
}

.variable-help {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  margin: 0;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Preview Dialog */
.preview-dialog {
  max-width: 600px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
}

.preview-header p {
  margin: 0;
  color: hsl(var(--muted-foreground));
}

.preview-body {
  border: 1px solid hsl(var(--border));
  border-radius: 0.375rem;
  padding: 1rem;
  background: hsl(var(--muted) / 0.3);
}

.template-content {
  font-family: inherit;
  white-space: pre-wrap;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.preview-footer {
  display: flex;
  justify-content: flex-end;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: hsl(var(--muted-foreground));
  margin-bottom: 1rem;
}

.empty-text {
  margin: 0 0 1rem 0;
  color: hsl(var(--muted-foreground));
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid hsl(var(--border));
  border-top: 2px solid hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .template-grid {
    grid-template-columns: 1fr;
  }
  
  .category-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .template-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>