<script setup lang="ts">
import { computed, ref } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { Progress } from '~/components/ui/progress'
import { 
  FileText,
  AlertCircle,
  Edit,
  Eye,
  EyeOff,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  DollarSign,
  TrendingUp
} from 'lucide-vue-next'
import type { Matter } from '~/types/matter'
import { getMatterPriorityColor } from '~/utils/matter'

interface Props {
  matter?: Matter | null
  loading?: boolean
  error?: string | null
  className?: string
  showCompact?: boolean
  showFinancials?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  className: '',
  showCompact: false,
  showFinancials: true
})

const emit = defineEmits<{
  'edit': [field: string]
  'generate-summary': []
  'refresh': []
}>()

// Local state
const isExpanded = ref(!props.showCompact)
const showFullDescription = ref(false)

// Computed properties
const truncatedDescription = computed(() => {
  if (!props.matter?.description) return null
  if (showFullDescription.value || props.matter.description.length <= 150) {
    return props.matter.description
  }
  return props.matter.description.substring(0, 150) + '...'
})

const hasLongDescription = computed(() => {
  return props.matter?.description && props.matter.description.length > 150
})

const keyHighlights = computed(() => {
  if (!props.matter) return []
  
  const highlights = []
  
  // Priority highlight
  if (props.matter.priority === 'HIGH' || props.matter.priority === 'URGENT') {
    highlights.push({
      icon: TrendingUp,
      label: 'High Priority Matter',
      color: getMatterPriorityColor(props.matter.priority),
      type: 'priority'
    })
  }
  
  // Document count highlight
  if ((props.matter.documentCount || props.matter.relatedDocuments || 0) > 10) {
    highlights.push({
      icon: FileText,
      label: `${props.matter.documentCount || props.matter.relatedDocuments} Documents`,
      color: 'bg-blue-500',
      type: 'documents'
    })
  }
  
  // Overdue highlight
  if (props.matter.isOverdue) {
    highlights.push({
      icon: AlertCircle,
      label: 'Overdue',
      color: 'bg-red-500',
      type: 'overdue'
    })
  }
  
  return highlights
})

const financialSummary = computed(() => {
  if (!props.matter || !props.showFinancials) return null
  
  const budget = props.matter.budget || 0
  const spent = props.matter.amountSpent || 0
  const remaining = budget - spent
  const percentUsed = budget > 0 ? (spent / budget) * 100 : 0
  
  return {
    budget,
    spent,
    remaining,
    percentUsed: Math.round(percentUsed),
    isOverBudget: spent > budget,
    hasFinancialData: budget > 0 || spent > 0
  }
})

// Handlers
const handleRetry = () => {
  emit('refresh')
}

const handleEdit = (field: string) => {
  emit('edit', field)
}

const handleGenerateSummary = () => {
  emit('generate-summary')
}

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const toggleDescription = () => {
  showFullDescription.value = !showFullDescription.value
}
</script>

<template>
  <Card :class="className">
    <CardHeader :class="showCompact ? 'pb-3' : ''">
      <div class="flex items-start justify-between">
        <div class="space-y-1 flex-1">
          <CardTitle class="text-xl font-semibold">
            Matter Summary
          </CardTitle>
          <CardDescription v-if="!showCompact">
            Description and key highlights
          </CardDescription>
        </div>
        <div class="flex items-center gap-2">
          <Button
            v-if="!loading && !error && matter"
            variant="ghost"
            size="sm"
            @click="handleGenerateSummary"
            class="h-8"
          >
            <Sparkles class="h-4 w-4 mr-1" />
            AI Summary
          </Button>
          <Button
            v-if="!showCompact"
            variant="ghost"
            size="sm"
            @click="toggleExpanded"
            class="h-8 w-8 p-0"
          >
            <component :is="isExpanded ? ChevronUp : ChevronDown" class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardHeader>
    
    <CardContent v-show="isExpanded || showCompact" :class="showCompact ? 'pt-0' : ''">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div class="space-y-2">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-3/4" />
          <Skeleton class="h-4 w-1/2" />
        </div>
        <div class="flex gap-2">
          <Skeleton class="h-6 w-20" />
          <Skeleton class="h-6 w-24" />
        </div>
      </div>
      
      <!-- Error State -->
      <Alert v-else-if="error" variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>
          <span>{{ error }}</span>
          <button 
            @click="handleRetry"
            class="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </AlertDescription>
      </Alert>
      
      <!-- Content -->
      <div v-else-if="matter" class="space-y-4">
        <!-- Description Section -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-muted-foreground">Description</p>
            <button
              @click="handleEdit('description')"
              class="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Edit class="h-3 w-3" />
              Edit
            </button>
          </div>
          
          <div v-if="matter.description" class="space-y-2">
            <p class="text-sm whitespace-pre-wrap">{{ truncatedDescription }}</p>
            <button
              v-if="hasLongDescription"
              @click="toggleDescription"
              class="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <component :is="showFullDescription ? EyeOff : Eye" class="h-3 w-3" />
              {{ showFullDescription ? 'Show less' : 'Read more' }}
            </button>
          </div>
          <p v-else class="text-sm text-muted-foreground italic">
            No description provided
          </p>
        </div>
        
        <!-- Key Highlights -->
        <div v-if="keyHighlights.length > 0" class="space-y-2">
          <Separator />
          <p class="text-sm font-medium text-muted-foreground">Key Highlights</p>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(highlight, index) in keyHighlights"
              :key="index"
              class="flex items-center gap-2 text-sm"
            >
              <div 
                class="w-2 h-2 rounded-full"
                :class="highlight.color"
              />
              <component :is="highlight.icon" class="h-3 w-3 text-muted-foreground" />
              <span>{{ highlight.label }}</span>
            </div>
          </div>
        </div>
        
        <!-- Tags -->
        <div v-if="matter.tags && matter.tags.length > 0" class="space-y-2">
          <Separator />
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-muted-foreground">Tags</p>
            <button
              @click="handleEdit('tags')"
              class="text-xs text-primary hover:underline"
            >
              Manage
            </button>
          </div>
          <div class="flex flex-wrap gap-1">
            <Badge 
              v-for="tag in matter.tags" 
              :key="tag"
              variant="secondary"
              class="text-xs"
            >
              <Tag class="h-3 w-3 mr-1" />
              {{ tag }}
            </Badge>
          </div>
        </div>
        
        <!-- Financial Summary (if enabled and not compact) -->
        <div v-if="financialSummary?.hasFinancialData && showFinancials && !showCompact" class="space-y-3">
          <Separator />
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-muted-foreground">Financial Summary</p>
            <Badge 
              v-if="financialSummary.isOverBudget"
              variant="destructive"
              class="text-xs"
            >
              Over Budget
            </Badge>
          </div>
          
          <div class="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p class="text-muted-foreground">Budget</p>
              <p class="font-medium">
                <DollarSign class="inline h-3 w-3" />
                {{ financialSummary.budget.toLocaleString() }}
              </p>
            </div>
            <div>
              <p class="text-muted-foreground">Spent</p>
              <p class="font-medium" :class="{ 'text-red-600': financialSummary.isOverBudget }">
                <DollarSign class="inline h-3 w-3" />
                {{ financialSummary.spent.toLocaleString() }}
              </p>
            </div>
            <div>
              <p class="text-muted-foreground">Remaining</p>
              <p class="font-medium" :class="{ 'text-red-600': financialSummary.remaining < 0 }">
                <DollarSign class="inline h-3 w-3" />
                {{ Math.abs(financialSummary.remaining).toLocaleString() }}
                <span v-if="financialSummary.remaining < 0" class="text-xs"> over</span>
              </p>
            </div>
          </div>
          
          <div class="space-y-1">
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>Budget usage</span>
              <span>{{ financialSummary.percentUsed }}%</span>
            </div>
            <Progress 
              :value="Math.min(100, financialSummary.percentUsed)" 
              :class="financialSummary.isOverBudget ? 'bg-red-100' : ''"
            />
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else class="text-center py-4">
        <p class="text-muted-foreground">No summary information available</p>
      </div>
    </CardContent>
  </Card>
</template>