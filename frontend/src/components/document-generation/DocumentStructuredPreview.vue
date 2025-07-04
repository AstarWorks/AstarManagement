<template>
  <div class="document-structured-preview">
    <div class="structured-container">
      <!-- Header -->
      <div class="preview-header">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">Document Structure</h3>
          <div class="header-actions">
            <Button @click="toggleExpanded" size="sm" variant="outline">
              <ChevronDown :class="['h-4 w-4', { 'rotate-180': expanded }]" />
              {{ expanded ? 'Collapse All' : 'Expand All' }}
            </Button>
            <Button @click="copyStructure" size="sm" variant="outline">
              <Copy class="h-4 w-4 mr-2" />
              Copy JSON
            </Button>
          </div>
        </div>
        
        <!-- Document Metadata -->
        <div class="document-meta">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg">
            <div class="meta-item">
              <div class="text-sm font-medium">Document Type</div>
              <div class="text-xs text-muted-foreground">
                {{ content?.document_type || 'Unknown' }}
              </div>
            </div>
            <div class="meta-item">
              <div class="text-sm font-medium">Sections</div>
              <div class="text-xs text-muted-foreground">
                {{ content?.sections?.length || 0 }}
              </div>
            </div>
            <div class="meta-item">
              <div class="text-sm font-medium">Variables</div>
              <div class="text-xs text-muted-foreground">
                {{ variables?.length || 0 }}
              </div>
            </div>
            <div class="meta-item">
              <div class="text-sm font-medium">Generated</div>
              <div class="text-xs text-muted-foreground">
                {{ formatDateTime(content?.processed_at || new Date()) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Structure Tree -->
      <div class="structure-tree">
        <div class="space-y-3">
          <!-- Document Title -->
          <div v-if="content?.title" class="document-title">
            <Card>
              <CardContent class="p-4">
                <div class="flex items-center gap-3">
                  <FileText class="h-5 w-5 text-blue-500" />
                  <div>
                    <div class="font-medium">{{ content.title }}</div>
                    <div class="text-xs text-muted-foreground">Document Title</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <!-- Document Sections -->
          <div v-if="content?.sections" class="document-sections">
            <h4 class="text-sm font-medium mb-3">Document Sections</h4>
            <div class="space-y-2">
              <div 
                v-for="(section, index) in content.sections"
                :key="index"
                class="section-item"
              >
                <Card class="section-card">
                  <CardContent class="p-3">
                    <div class="section-header">
                      <Button
                        @click="toggleSection(index)"
                        variant="ghost"
                        size="sm"
                        class="section-toggle"
                      >
                        <ChevronRight 
                          :class="['h-4 w-4 transition-transform', { 
                            'rotate-90': expandedSections.has(index) 
                          }]" 
                        />
                        <div class="flex items-center gap-2 ml-2">
                          <Hash class="h-4 w-4 text-muted-foreground" />
                          <span class="font-medium">{{ section.title }}</span>
                          <Badge variant="outline" class="text-xs">
                            {{ section.variables?.length || 0 }} variables
                          </Badge>
                        </div>
                      </Button>
                    </div>
                    
                    <!-- Section Content -->
                    <div 
                      v-if="expandedSections.has(index)"
                      class="section-content mt-3 ml-6"
                    >
                      <div class="space-y-3">
                        <!-- Section Description -->
                        <div v-if="section.content" class="section-description">
                          <div class="text-sm text-muted-foreground">
                            {{ section.content }}
                          </div>
                        </div>
                        
                        <!-- Section Variables -->
                        <div v-if="section.variables?.length" class="section-variables">
                          <div class="text-xs font-medium mb-2">Variables in this section:</div>
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div 
                              v-for="variable in section.variables"
                              :key="variable"
                              class="variable-item"
                            >
                              <div class="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                                <Variable class="h-3 w-3 text-green-500" />
                                <code class="font-mono">{{ variable }}</code>
                                <span class="text-muted-foreground ml-auto">
                                  {{ getVariableValue(variable) || 'Not set' }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          
          <!-- Variables Overview -->
          <div v-if="variables?.length" class="variables-overview">
            <h4 class="text-sm font-medium mb-3">All Variables</h4>
            <Card>
              <CardContent class="p-3">
                <div class="space-y-2">
                  <div 
                    v-for="variable in variables"
                    :key="variable.name"
                    class="variable-row"
                  >
                    <div class="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                      <div class="flex items-center gap-3">
                        <div class="variable-type">
                          <component 
                            :is="getVariableIcon(variable.type)"
                            class="h-4 w-4"
                            :class="getVariableIconColor(variable.type)"
                          />
                        </div>
                        <div>
                          <div class="text-sm font-mono">{{ variable.name }}</div>
                          <div class="text-xs text-muted-foreground">
                            {{ variable.type }}
                          </div>
                        </div>
                      </div>
                      <div class="variable-value">
                        <div class="text-sm text-right">
                          <div class="font-medium">{{ variable.value }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <!-- Raw JSON View -->
          <div class="raw-json">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium">Raw Structure</h4>
              <Button
                @click="toggleJsonView"
                size="sm"
                variant="outline"
              >
                <Code class="h-4 w-4 mr-2" />
                {{ showJsonView ? 'Hide' : 'Show' }} JSON
              </Button>
            </div>
            
            <div v-if="showJsonView" class="json-viewer">
              <Card>
                <CardContent class="p-0">
                  <pre class="json-content">{{ formattedJson }}</pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  FileText, 
  Hash, 
  Variable,
  Code,
  Type,
  Calendar,
  Hash as HashIcon,
  ToggleLeft
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

// Utils
import { formatDateTime } from '~/utils/helpers'

// Types
interface StructuredContent {
  document_type?: string
  title?: string
  sections?: Array<{
    title: string
    content?: string
    variables?: string[]
  }>
  variables?: Record<string, unknown>
  processed_at?: string | Date
}

interface TemplateVariable {
  name: string
  value: unknown
  type: string
}

// Props
interface Props {
  content: StructuredContent | null
  templateId: string
  variables?: TemplateVariable[]
}

const props = defineProps<Props>()

// State
const expanded = ref(false)
const expandedSections = ref<Set<number>>(new Set([0])) // First section expanded by default
const showJsonView = ref(false)

// Computed
const formattedJson = computed(() => {
  if (!props.content) return '{}'
  return JSON.stringify(props.content, null, 2)
})

// Methods
const toggleExpanded = () => {
  expanded.value = !expanded.value
  
  if (expanded.value) {
    // Expand all sections
    const sectionCount = props.content?.sections?.length || 0
    expandedSections.value = new Set(Array.from({ length: sectionCount }, (_, i) => i))
  } else {
    // Collapse all sections
    expandedSections.value.clear()
  }
}

const toggleSection = (index: number) => {
  if (expandedSections.value.has(index)) {
    expandedSections.value.delete(index)
  } else {
    expandedSections.value.add(index)
  }
}

const toggleJsonView = () => {
  showJsonView.value = !showJsonView.value
}

const copyStructure = async () => {
  try {
    await navigator.clipboard.writeText(formattedJson.value)
    // Show toast notification
    console.log('Structure copied to clipboard')
  } catch (error) {
    console.error('Failed to copy structure:', error)
  }
}

const getVariableValue = (variableName: string): string => {
  const variable = props.variables?.find(v => v.name === variableName)
  if (variable?.value) {
    if (typeof variable.value === 'object') {
      return JSON.stringify(variable.value)
    }
    return String(variable.value)
  }
  
  // Fallback to content variables
  const contentVar = props.content?.variables?.[variableName]
  if (contentVar) {
    if (typeof contentVar === 'object') {
      return JSON.stringify(contentVar)
    }
    return String(contentVar)
  }
  
  return ''
}

const getVariableIcon = (type: string) => {
  switch (type) {
    case 'text': return Type
    case 'date': return Calendar
    case 'number': return HashIcon
    case 'boolean': return ToggleLeft
    default: return Variable
  }
}

const getVariableIconColor = (type: string): string => {
  switch (type) {
    case 'text': return 'text-blue-500'
    case 'date': return 'text-green-500'
    case 'number': return 'text-purple-500'
    case 'boolean': return 'text-orange-500'
    default: return 'text-gray-500'
  }
}
</script>

<style scoped>
.document-structured-preview {
  @apply h-full overflow-auto;
}

.structured-container {
  @apply p-4 space-y-6;
}

.preview-header {
  @apply border-b pb-4;
}

.header-actions {
  @apply flex items-center gap-2;
}

.document-meta .meta-item {
  @apply text-center;
}

.structure-tree {
  @apply space-y-4;
}

.document-title {
  @apply mb-4;
}

.document-sections {
  @apply space-y-2;
}

.section-card {
  @apply border-l-4 border-l-blue-500/30 transition-all duration-200;
}

.section-card:hover {
  @apply border-l-blue-500;
}

.section-toggle {
  @apply w-full justify-start p-2 h-auto;
}

.section-content {
  @apply border-l border-muted pl-4;
}

.variable-item {
  @apply flex items-center;
}

.variables-overview {
  @apply space-y-2;
}

.variable-row {
  @apply border-b border-muted/50 last:border-b-0;
}

.variable-type {
  @apply flex-shrink-0;
}

.variable-value {
  @apply flex-shrink-0;
}

.raw-json {
  @apply space-y-2;
}

.json-viewer {
  @apply max-h-96 overflow-auto;
}

.json-content {
  @apply p-4 text-xs font-mono bg-muted/30 rounded-none border-0 overflow-auto;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Syntax highlighting for JSON */
.json-content {
  color: hsl(var(--foreground));
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .structured-container {
    @apply p-2;
  }
  
  .header-actions {
    @apply flex-col gap-1;
  }
  
  .document-meta .grid {
    @apply grid-cols-2;
  }
  
  .section-content {
    @apply ml-2 pl-2;
  }
  
  .variable-row .flex {
    @apply flex-col items-start gap-2;
  }
  
  .variable-value {
    @apply w-full;
  }
}

/* Print styles */
@media print {
  .header-actions,
  .section-toggle {
    @apply hidden;
  }
  
  .section-content {
    @apply block;
  }
  
  .json-viewer {
    @apply max-h-none;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .json-content {
    background: hsl(var(--muted));
  }
}
</style>