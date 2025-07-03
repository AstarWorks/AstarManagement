<!--
  Client Details Step Component
  
  Second step in the matter creation workflow.
  Handles client selection and important dates.
-->

<script setup lang="ts">
import { ref, computed } from 'vue'

// Form Components
import { FormFieldWrapper } from '~/components/forms'
import ClientSelectionField from '../fields/ClientSelectionField.vue'
import MatterDateFields from '../fields/MatterDateFields.vue'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'

interface Props {
  /** Form instance from parent */
  form: any
  /** Step-specific data */
  stepData: any
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  update: [data: any]
}>()

// Mock client data - in real app, this would come from the form selection
const selectedClient = computed(() => {
  const clientId = props.form?.values?.clientId || props.stepData?.clientId
  if (!clientId) return null
  
  // Mock client data - in real app, fetch from API
  return {
    id: clientId,
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1 (555) 123-4567',
    type: 'Corporate',
    status: 'Active',
    address: '123 Business Street, City, State 12345',
    contactPerson: 'John Smith',
    industry: 'Technology',
    avatar: ''
  }
})

// Computed properties for date validation
const openDate = computed(() => props.form?.values?.openDate || props.stepData?.openDate)
const closeDate = computed(() => props.form?.values?.closeDate || props.stepData?.closeDate)

const dateValidation = computed(() => {
  if (!openDate.value || !closeDate.value) return { isValid: true, message: '' }
  
  const open = new Date(openDate.value)
  const close = new Date(closeDate.value)
  
  if (close <= open) {
    return {
      isValid: false,
      message: 'Close date must be after open date'
    }
  }
  
  return { isValid: true, message: '' }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Client Selection Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <Users class="h-5 w-5" />
          Client Information
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Client Selection Field -->
        <ClientSelectionField />
        
        <!-- Selected Client Details -->
        <div v-if="selectedClient" class="mt-4 p-4 bg-muted/30 rounded-lg border">
          <div class="flex items-start gap-4">
            <Avatar class="h-12 w-12">
              <AvatarImage :src="selectedClient.avatar" />
              <AvatarFallback>
                {{ selectedClient.name.split(' ').map(n => n[0]).join('') }}
              </AvatarFallback>
            </Avatar>
            
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-2">
                <h4 class="font-semibold">{{ selectedClient.name }}</h4>
                <Badge variant="outline">{{ selectedClient.type }}</Badge>
                <Badge 
                  :variant="selectedClient.status === 'Active' ? 'default' : 'secondary'"
                  class="text-xs"
                >
                  {{ selectedClient.status }}
                </Badge>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <Mail class="h-4 w-4" />
                    <span>{{ selectedClient.email }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Phone class="h-4 w-4" />
                    <span>{{ selectedClient.phone }}</span>
                  </div>
                </div>
                
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <User class="h-4 w-4" />
                    <span>{{ selectedClient.contactPerson }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Building class="h-4 w-4" />
                    <span>{{ selectedClient.industry }}</span>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin class="h-4 w-4" />
                <span>{{ selectedClient.address }}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Important Dates Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <Calendar class="h-5 w-5" />
          Important Dates
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Date Fields Component -->
        <MatterDateFields />
        
        <!-- Date Validation Message -->
        <div v-if="!dateValidation.isValid" class="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div class="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle class="h-4 w-4" />
            <span>{{ dateValidation.message }}</span>
          </div>
        </div>
        
        <!-- Date Summary -->
        <div v-if="openDate || closeDate" class="p-3 bg-primary/5 border border-primary/20 rounded-md">
          <h5 class="font-medium text-sm mb-2">Date Summary</h5>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div v-if="openDate" class="flex items-center gap-2">
              <CalendarDays class="h-4 w-4 text-muted-foreground" />
              <span class="text-muted-foreground">Opens:</span>
              <span class="font-medium">{{ new Date(openDate).toLocaleDateString() }}</span>
            </div>
            
            <div v-if="closeDate" class="flex items-center gap-2">
              <CalendarX class="h-4 w-4 text-muted-foreground" />
              <span class="text-muted-foreground">Closes:</span>
              <span class="font-medium">{{ new Date(closeDate).toLocaleDateString() }}</span>
            </div>
          </div>
          
          <!-- Duration calculation -->
          <div v-if="openDate && closeDate && dateValidation.isValid" class="mt-2 text-sm text-muted-foreground">
            Duration: {{ Math.ceil((new Date(closeDate).getTime() - new Date(openDate).getTime()) / (1000 * 60 * 60 * 24)) }} days
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Matter Context Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <FileText class="h-5 w-5" />
          Matter Context
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <p class="text-sm text-muted-foreground">
          This section can be expanded to include additional context about the matter,
          such as related cases, previous interactions with the client, or specific
          requirements for this type of legal work.
        </p>
        
        <!-- Placeholder for future features -->
        <div class="p-4 border-2 border-dashed border-muted rounded-lg text-center">
          <div class="text-sm text-muted-foreground">
            Additional context fields will be added here based on client requirements
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { 
  Users, 
  Mail, 
  Phone, 
  User, 
  Building, 
  MapPin, 
  Calendar, 
  CalendarDays, 
  CalendarX, 
  AlertTriangle, 
  FileText 
} from 'lucide-vue-next'
</script>

<style scoped>
/* Grid responsive adjustments */
@media (max-width: 768px) {
  .grid-cols-1.md\\:grid-cols-2 {
    @apply grid-cols-1;
  }
}

/* Card styling */
.bg-muted\\/30 {
  background-color: hsl(var(--muted) / 0.3);
}

.bg-primary\\/5 {
  background-color: hsl(var(--primary) / 0.05);
}

.border-primary\\/20 {
  border-color: hsl(var(--primary) / 0.2);
}

.bg-destructive\\/10 {
  background-color: hsl(var(--destructive) / 0.1);
}

.border-destructive\\/20 {
  border-color: hsl(var(--destructive) / 0.2);
}

/* Animation for client details */
.bg-muted\\/30 {
  @apply transition-all duration-200;
}

.bg-muted\\/30:hover {
  @apply shadow-sm;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .flex.items-start.gap-4 {
    @apply flex-col items-center text-center;
  }
  
  .grid.grid-cols-1.md\\:grid-cols-2 {
    @apply space-y-2;
  }
}
</style>