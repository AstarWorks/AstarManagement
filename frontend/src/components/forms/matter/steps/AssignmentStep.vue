<!--
  Assignment Step Component
  
  Third step in the matter creation workflow.
  Handles lawyer and staff assignment with workload considerations.
-->

<script setup lang="ts">
import { computed } from 'vue'

// Form Components
import { FormFieldWrapper } from '~/components/forms'
import LawyerAssignmentField from '../fields/LawyerAssignmentField.vue'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Alert, AlertDescription } from '~/components/ui/alert'
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

// Get assigned lawyers from form
const assignedLawyerIds = computed(() => 
  props.form?.values?.assignedLawyerIds || props.stepData?.assignedLawyerIds || []
)

// Mock lawyer data - in real app, this would come from API
const mockLawyers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@lawfirm.com',
    role: 'Senior Partner',
    specializations: ['Corporate Law', 'M&A', 'Securities'],
    currentCaseLoad: 12,
    maxCaseLoad: 15,
    experience: 15,
    isAvailable: true,
    avatar: '',
    rating: 4.9,
    hourlyRate: 650
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@lawfirm.com',
    role: 'Associate',
    specializations: ['Litigation', 'Civil Rights', 'Employment Law'],
    currentCaseLoad: 8,
    maxCaseLoad: 12,
    experience: 5,
    isAvailable: true,
    avatar: '',
    rating: 4.7,
    hourlyRate: 450
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@lawfirm.com',
    role: 'Partner',
    specializations: ['Family Law', 'Immigration', 'Real Estate'],
    currentCaseLoad: 10,
    maxCaseLoad: 14,
    experience: 12,
    isAvailable: true,
    avatar: '',
    rating: 4.8,
    hourlyRate: 575
  }
]

// Get selected lawyers details
const selectedLawyers = computed(() => {
  return mockLawyers.filter(lawyer => assignedLawyerIds.value.includes(lawyer.id))
})

// Calculate team metrics
const teamMetrics = computed(() => {
  if (selectedLawyers.value.length === 0) return null
  
  const totalExperience = selectedLawyers.value.reduce((sum, lawyer) => sum + lawyer.experience, 0)
  const avgExperience = totalExperience / selectedLawyers.value.length
  const avgRating = selectedLawyers.value.reduce((sum, lawyer) => sum + lawyer.rating, 0) / selectedLawyers.value.length
  const totalHourlyRate = selectedLawyers.value.reduce((sum, lawyer) => sum + lawyer.hourlyRate, 0)
  
  const capacityUtilization = selectedLawyers.value.map(lawyer => ({
    name: lawyer.name,
    utilization: (lawyer.currentCaseLoad / lawyer.maxCaseLoad) * 100
  }))
  
  return {
    totalMembers: selectedLawyers.value.length,
    avgExperience: Math.round(avgExperience * 10) / 10,
    avgRating: Math.round(avgRating * 10) / 10,
    totalHourlyRate,
    capacityUtilization
  }
})

// Validation
const assignmentValidation = computed(() => {
  if (assignedLawyerIds.value.length === 0) {
    return {
      isValid: false,
      type: 'error',
      message: 'At least one lawyer must be assigned to this matter'
    }
  }
  
  if (assignedLawyerIds.value.length > 3) {
    return {
      isValid: false,
      type: 'warning',
      message: 'Large teams may require additional coordination'
    }
  }
  
  // Check for high capacity utilization
  const overCapacity = selectedLawyers.value.filter(lawyer => 
    lawyer.currentCaseLoad / lawyer.maxCaseLoad >= 0.9
  )
  
  if (overCapacity.length > 0) {
    return {
      isValid: true,
      type: 'warning',
      message: `${overCapacity.length} team member(s) are near capacity and may have limited availability`
    }
  }
  
  return {
    isValid: true,
    type: 'success',
    message: 'Team assignment looks good'
  }
})

// Get role badge variant
const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'Senior Partner': return 'default'
    case 'Partner': return 'secondary'
    case 'Associate': return 'outline'
    default: return 'outline'
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Lawyer Assignment Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <UserPlus class="h-5 w-5" />
          Team Assignment
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Assignment Field -->
        <LawyerAssignmentField 
          :min-lawyers="1"
          :max-lawyers="5"
          required
        />
        
        <!-- Assignment Validation -->
        <Alert v-if="!assignmentValidation.isValid" variant="destructive">
          <AlertTriangle class="h-4 w-4" />
          <AlertDescription>
            {{ assignmentValidation.message }}
          </AlertDescription>
        </Alert>
        
        <Alert v-else-if="assignmentValidation.type === 'warning'" variant="default">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>
            {{ assignmentValidation.message }}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>

    <!-- Selected Team Overview -->
    <Card v-if="selectedLawyers.length > 0">
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <Users class="h-5 w-5" />
          Team Overview
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Team Members -->
        <div class="space-y-3">
          <div 
            v-for="lawyer in selectedLawyers" 
            :key="lawyer.id"
            class="flex items-center gap-4 p-3 bg-muted/20 rounded-lg border"
          >
            <Avatar class="h-10 w-10">
              <AvatarImage :src="lawyer.avatar" />
              <AvatarFallback class="text-sm">
                {{ lawyer.name.split(' ').map(n => n[0]).join('') }}
              </AvatarFallback>
            </Avatar>
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="font-medium text-sm">{{ lawyer.name }}</h4>
                <Badge :variant="getRoleBadgeVariant(lawyer.role)" class="text-xs">
                  {{ lawyer.role }}
                </Badge>
              </div>
              
              <div class="flex items-center gap-3 text-xs text-muted-foreground">
                <span class="flex items-center gap-1">
                  <Star class="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {{ lawyer.rating }}
                </span>
                <span>{{ lawyer.experience }}y exp</span>
                <span>${{ lawyer.hourlyRate }}/hr</span>
              </div>
              
              <div class="flex items-center gap-1 mt-1">
                <Briefcase class="h-3 w-3 text-muted-foreground" />
                <span class="text-xs text-muted-foreground">
                  {{ lawyer.specializations.slice(0, 2).join(', ') }}
                  <span v-if="lawyer.specializations.length > 2">
                    +{{ lawyer.specializations.length - 2 }}
                  </span>
                </span>
              </div>
            </div>
            
            <!-- Capacity Indicator -->
            <div class="text-right">
              <div class="text-xs text-muted-foreground mb-1">
                {{ lawyer.currentCaseLoad }}/{{ lawyer.maxCaseLoad }}
              </div>
              <div class="w-16 h-2 bg-muted rounded-full">
                <div 
                  class="h-full rounded-full transition-all"
                  :class="{
                    'bg-green-500': lawyer.currentCaseLoad / lawyer.maxCaseLoad < 0.7,
                    'bg-yellow-500': lawyer.currentCaseLoad / lawyer.maxCaseLoad >= 0.7 && lawyer.currentCaseLoad / lawyer.maxCaseLoad < 0.9,
                    'bg-red-500': lawyer.currentCaseLoad / lawyer.maxCaseLoad >= 0.9
                  }"
                  :style="{ width: `${(lawyer.currentCaseLoad / lawyer.maxCaseLoad) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Team Metrics -->
        <div v-if="teamMetrics" class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div class="text-center">
            <div class="text-lg font-semibold">{{ teamMetrics.totalMembers }}</div>
            <div class="text-xs text-muted-foreground">Team Members</div>
          </div>
          
          <div class="text-center">
            <div class="text-lg font-semibold">{{ teamMetrics.avgExperience }}y</div>
            <div class="text-xs text-muted-foreground">Avg Experience</div>
          </div>
          
          <div class="text-center">
            <div class="text-lg font-semibold flex items-center justify-center gap-1">
              <Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {{ teamMetrics.avgRating }}
            </div>
            <div class="text-xs text-muted-foreground">Avg Rating</div>
          </div>
          
          <div class="text-center">
            <div class="text-lg font-semibold">${{ teamMetrics.totalHourlyRate }}</div>
            <div class="text-xs text-muted-foreground">Total Rate/hr</div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Assignment Guidelines -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <Info class="h-5 w-5" />
          Assignment Guidelines
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div class="space-y-2">
            <h5 class="font-medium flex items-center gap-2">
              <CheckCircle class="h-4 w-4 text-green-600" />
              Best Practices
            </h5>
            <ul class="space-y-1 text-muted-foreground">
              <li>• Assign primary lawyer based on expertise</li>
              <li>• Consider current workload and availability</li>
              <li>• Balance experience levels for complex matters</li>
              <li>• Ensure proper supervision structure</li>
            </ul>
          </div>
          
          <div class="space-y-2">
            <h5 class="font-medium flex items-center gap-2">
              <AlertTriangle class="h-4 w-4 text-amber-600" />
              Considerations
            </h5>
            <ul class="space-y-1 text-muted-foreground">
              <li>• Team size affects coordination overhead</li>
              <li>• Check for potential conflicts of interest</li>
              <li>• Consider client preferences and history</li>
              <li>• Review specialization alignment</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { 
  UserPlus, 
  Users, 
  Star, 
  Briefcase, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle 
} from 'lucide-vue-next'
</script>

<style scoped>
/* Grid responsive adjustments */
@media (max-width: 768px) {
  .grid-cols-2.md\\:grid-cols-4 {
    @apply grid-cols-2;
  }
  
  .grid-cols-1.md\\:grid-cols-2 {
    @apply grid-cols-1;
  }
}

/* Team member card styling */
.bg-muted\\/20 {
  background-color: hsl(var(--muted) / 0.2);
}

/* Capacity indicator animations */
.bg-green-500,
.bg-yellow-500,
.bg-red-500 {
  @apply transition-all duration-300;
}

/* Hover effects */
.flex.items-center.gap-4.p-3 {
  @apply transition-shadow duration-200;
}

.flex.items-center.gap-4.p-3:hover {
  @apply shadow-sm;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .flex.items-center.gap-4 {
    @apply gap-3;
  }
  
  .text-lg {
    @apply text-base;
  }
}

/* High contrast support */
@media (prefers-contrast: high) {
  .bg-green-500 {
    @apply bg-green-700;
  }
  
  .bg-yellow-500 {
    @apply bg-yellow-700;
  }
  
  .bg-red-500 {
    @apply bg-red-700;
  }
}
</style>