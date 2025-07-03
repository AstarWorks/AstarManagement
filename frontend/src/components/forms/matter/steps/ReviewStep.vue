<!--
  Review Step Component
  
  Final step in the matter creation workflow.
  Provides comprehensive review of all form data before submission.
-->

<script setup lang="ts">
import { computed } from 'vue'

// Components
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Separator } from '~/components/ui/separator'

interface Props {
  /** Form instance from parent */
  form: any
  /** Step-specific data */
  stepData: any
  /** Complete form data */
  formData: any
  /** Form mode */
  mode: 'create' | 'edit'
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  update: [data: any]
}>()

// Get form values
const values = computed(() => props.formData || props.form?.values || {})

// Mock data for client and lawyers (in real app, fetch from API)
const clientData = computed(() => {
  if (!values.value.clientId) return null
  return {
    id: values.value.clientId,
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1 (555) 123-4567',
    type: 'Corporate'
  }
})

const lawyersData = computed(() => {
  if (!values.value.assignedLawyerIds?.length) return []
  
  const mockLawyers = [
    { id: '1', name: 'Sarah Johnson', role: 'Senior Partner', hourlyRate: 650 },
    { id: '2', name: 'Michael Chen', role: 'Associate', hourlyRate: 450 },
    { id: '3', name: 'Emily Rodriguez', role: 'Partner', hourlyRate: 575 }
  ]
  
  return mockLawyers.filter(lawyer => values.value.assignedLawyerIds.includes(lawyer.id))
})

// Form validation summary
const validationSummary = computed(() => {
  const errors = props.form?.errors || {}
  const errorCount = Object.keys(errors).length
  
  const required = [
    { field: 'title', label: 'Matter Title', value: values.value.title },
    { field: 'type', label: 'Matter Type', value: values.value.type },
    { field: 'status', label: 'Status', value: values.value.status },
    { field: 'priority', label: 'Priority', value: values.value.priority },
    { field: 'clientId', label: 'Client', value: values.value.clientId },
    { field: 'assignedLawyerIds', label: 'Assigned Lawyers', value: values.value.assignedLawyerIds?.length > 0 }
  ]
  
  const missingRequired = required.filter(req => !req.value)
  
  return {
    hasErrors: errorCount > 0,
    errorCount,
    missingRequired,
    isValid: errorCount === 0 && missingRequired.length === 0
  }
})

// Calculate estimated costs
const estimatedCosts = computed(() => {
  const hours = Number(values.value.billableHours) || 0
  const lawyerCosts = lawyersData.value.reduce((total, lawyer) => {
    return total + (lawyer.hourlyRate * (hours / lawyersData.value.length))
  }, 0)
  
  return {
    estimatedValue: Number(values.value.estimatedValue) || 0,
    billableHours: hours,
    estimatedLegalFees: lawyerCosts,
    totalEstimate: lawyerCosts
  }
})

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Get priority badge variant
const getPriorityVariant = (priority: string) => {
  switch (priority?.toUpperCase()) {
    case 'URGENT': return 'destructive'
    case 'HIGH': return 'destructive'
    case 'MEDIUM': return 'default'
    case 'LOW': return 'secondary'
    default: return 'outline'
  }
}

// Get status badge variant
const getStatusVariant = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE': return 'default'
    case 'INVESTIGATION': return 'secondary'
    case 'ON_HOLD': return 'outline'
    case 'CLOSED': return 'secondary'
    default: return 'outline'
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Validation Summary -->
    <Alert v-if="!validationSummary.isValid" variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertDescription>
        <div class="space-y-1">
          <div class="font-medium">Please complete the following before submitting:</div>
          <ul class="list-disc list-inside space-y-1 text-sm">
            <li v-for="missing in validationSummary.missingRequired" :key="missing.field">
              {{ missing.label }} is required
            </li>
            <li v-if="validationSummary.hasErrors">
              {{ validationSummary.errorCount }} form validation error(s)
            </li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
    
    <Alert v-else variant="default" class="border-green-200 bg-green-50">
      <CheckCircle class="h-4 w-4 text-green-600" />
      <AlertDescription class="text-green-800">
        All required information has been provided. Ready to {{ mode === 'create' ? 'create' : 'update' }} matter.
      </AlertDescription>
    </Alert>

    <!-- Basic Information Review -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <FileText class="h-5 w-5" />
          Matter Information
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium text-muted-foreground">Title</label>
              <p class="text-sm">{{ values.title || 'Not specified' }}</p>
            </div>
            
            <div>
              <label class="text-sm font-medium text-muted-foreground">Type</label>
              <p class="text-sm">{{ values.type || 'Not specified' }}</p>
            </div>
            
            <div>
              <label class="text-sm font-medium text-muted-foreground">Priority</label>
              <div class="flex items-center gap-2">
                <Badge :variant="getPriorityVariant(values.priority)" class="text-xs">
                  {{ values.priority || 'Not set' }}
                </Badge>
              </div>
            </div>
          </div>
          
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium text-muted-foreground">Status</label>
              <div class="flex items-center gap-2">
                <Badge :variant="getStatusVariant(values.status)" class="text-xs">
                  {{ values.status || 'Not set' }}
                </Badge>
              </div>
            </div>
            
            <div>
              <label class="text-sm font-medium text-muted-foreground">Open Date</label>
              <p class="text-sm">{{ formatDate(values.openDate) }}</p>
            </div>
            
            <div v-if="values.closeDate">
              <label class="text-sm font-medium text-muted-foreground">Close Date</label>
              <p class="text-sm">{{ formatDate(values.closeDate) }}</p>
            </div>
          </div>
        </div>
        
        <div v-if="values.description">
          <label class="text-sm font-medium text-muted-foreground">Description</label>
          <p class="text-sm mt-1 p-3 bg-muted/30 rounded border">{{ values.description }}</p>
        </div>
        
        <div v-if="values.tags">
          <label class="text-sm font-medium text-muted-foreground">Tags</label>
          <div class="flex flex-wrap gap-1 mt-1">
            <Badge 
              v-for="tag in values.tags.split(',')" 
              :key="tag.trim()"
              variant="outline" 
              class="text-xs"
            >
              {{ tag.trim() }}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Client Information Review -->
    <Card v-if="clientData">
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <Users class="h-5 w-5" />
          Client Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex items-center gap-4">
          <Avatar class="h-12 w-12">
            <AvatarFallback>
              {{ clientData.name.split(' ').map(n => n[0]).join('') }}
            </AvatarFallback>
          </Avatar>
          
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <h4 class="font-medium">{{ clientData.name }}</h4>
              <Badge variant="outline" class="text-xs">{{ clientData.type }}</Badge>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div class="flex items-center gap-2">
                <Mail class="h-4 w-4" />
                <span>{{ clientData.email }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Phone class="h-4 w-4" />
                <span>{{ clientData.phone }}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Team Assignment Review -->
    <Card v-if="lawyersData.length > 0">
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <UserPlus class="h-5 w-5" />
          Team Assignment
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <div 
          v-for="lawyer in lawyersData" 
          :key="lawyer.id"
          class="flex items-center gap-3 p-3 bg-muted/20 rounded border"
        >
          <Avatar class="h-8 w-8">
            <AvatarFallback class="text-xs">
              {{ lawyer.name.split(' ').map(n => n[0]).join('') }}
            </AvatarFallback>
          </Avatar>
          
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="font-medium text-sm">{{ lawyer.name }}</span>
              <Badge variant="outline" class="text-xs">{{ lawyer.role }}</Badge>
            </div>
            <div class="text-xs text-muted-foreground">
              {{ formatCurrency(lawyer.hourlyRate) }}/hour
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Financial Summary -->
    <Card v-if="estimatedCosts.estimatedValue > 0 || estimatedCosts.billableHours > 0">
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <DollarSign class="h-5 w-5" />
          Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div v-if="estimatedCosts.estimatedValue > 0" class="text-center p-3 bg-muted/20 rounded">
            <div class="text-lg font-semibold">{{ formatCurrency(estimatedCosts.estimatedValue) }}</div>
            <div class="text-xs text-muted-foreground">Estimated Value</div>
          </div>
          
          <div v-if="estimatedCosts.billableHours > 0" class="text-center p-3 bg-muted/20 rounded">
            <div class="text-lg font-semibold">{{ estimatedCosts.billableHours }}h</div>
            <div class="text-xs text-muted-foreground">Billable Hours</div>
          </div>
          
          <div v-if="estimatedCosts.estimatedLegalFees > 0" class="text-center p-3 bg-muted/20 rounded">
            <div class="text-lg font-semibold">{{ formatCurrency(estimatedCosts.estimatedLegalFees) }}</div>
            <div class="text-xs text-muted-foreground">Estimated Legal Fees</div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Submission Confirmation -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <Check class="h-5 w-5" />
          {{ mode === 'create' ? 'Create Matter' : 'Update Matter' }}
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="p-4 bg-primary/5 border border-primary/20 rounded">
          <div class="flex items-start gap-3">
            <Info class="h-5 w-5 text-primary mt-0.5" />
            <div class="space-y-2">
              <p class="text-sm font-medium">Ready to {{ mode === 'create' ? 'create' : 'update' }} matter</p>
              <p class="text-sm text-muted-foreground">
                {{ mode === 'create' 
                  ? 'Once created, the matter will be available to the assigned team members and the client will be notified.' 
                  : 'The matter will be updated with the new information and relevant parties will be notified of changes.'
                }}
              </p>
              
              <div class="text-xs text-muted-foreground space-y-1">
                <div>• All form data has been validated</div>
                <div>• Team members will receive notifications</div>
                <div>• Matter will appear in active cases</div>
                <div v-if="mode === 'create'">• Auto-save data will be cleared after creation</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { 
  FileText, 
  Users, 
  UserPlus, 
  DollarSign, 
  Check, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  Mail, 
  Phone 
} from 'lucide-vue-next'
</script>

<style scoped>
/* Grid responsive adjustments */
@media (max-width: 768px) {
  .grid-cols-1.md\\:grid-cols-2 {
    @apply grid-cols-1;
  }
  
  .grid-cols-1.md\\:grid-cols-3 {
    @apply grid-cols-1;
  }
}

/* Background color utilities */
.bg-muted\\/20 {
  background-color: hsl(var(--muted) / 0.2);
}

.bg-muted\\/30 {
  background-color: hsl(var(--muted) / 0.3);
}

.bg-primary\\/5 {
  background-color: hsl(var(--primary) / 0.05);
}

.border-primary\\/20 {
  border-color: hsl(var(--primary) / 0.2);
}

/* Section styling */
.space-y-3 > div:not(:last-child) {
  @apply border-b border-muted pb-3;
}

.space-y-3 > div:last-child {
  @apply pb-0;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .flex.items-center.gap-4 {
    @apply gap-3;
  }
  
  .text-lg {
    @apply text-base;
  }
  
  .grid.grid-cols-1.md\\:grid-cols-2.gap-4 {
    @apply gap-2;
  }
}

/* Print styles */
@media print {
  .space-y-6 {
    @apply space-y-4;
  }
  
  .p-3,
  .p-4 {
    @apply p-2;
  }
}
</style>