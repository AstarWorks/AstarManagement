<!--
  Lawyer Assignment Field Component
  
  Multi-select field for assigning lawyers to matters with role specification,
  workload indicators, and team collaboration features.
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { FormFieldWrapper } from '~/components/forms'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Skeleton } from '~/components/ui/skeleton'
import { useField } from 'vee-validate'
import { UserPlus, Search, Users, Briefcase, Star } from 'lucide-vue-next'

interface Props {
  /** Error message from form validation */
  error?: string
  /** Field name for form binding */
  name?: string
  /** Whether field is required */
  required?: boolean
  /** Minimum number of lawyers required */
  minLawyers?: number
  /** Maximum number of lawyers allowed */
  maxLawyers?: number
}

const props = withDefaults(defineProps<Props>(), {
  name: 'assignedLawyerIds',
  required: true,
  minLawyers: 1,
  maxLawyers: 5
})

// Field binding
const { value: selectedLawyerIds, setValue } = useField<string[]>(props.name)

// State
const loading = ref(false)
const lawyers = ref<any[]>([])
const searchQuery = ref('')

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
    avatar: null,
    rating: 4.9
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
    avatar: null,
    rating: 4.7
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
    avatar: null,
    rating: 4.8
  },
  {
    id: '4',
    name: 'David Wilson',
    email: 'david.wilson@lawfirm.com',
    role: 'Junior Associate',
    specializations: ['Criminal Defense', 'Personal Injury'],
    currentCaseLoad: 15,
    maxCaseLoad: 15,
    experience: 2,
    isAvailable: false,
    avatar: null,
    rating: 4.5
  }
]

// Load lawyers
const loadLawyers = async () => {
  loading.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    lawyers.value = mockLawyers
  } catch (error) {
    console.error('Failed to load lawyers:', error)
  } finally {
    loading.value = false
  }
}

// Computed properties
const filteredLawyers = computed(() => {
  if (!searchQuery.value) return lawyers.value
  
  const query = searchQuery.value.toLowerCase()
  return lawyers.value.filter(lawyer => {
    return lawyer.name.toLowerCase().includes(query) ||
           lawyer.email.toLowerCase().includes(query) ||
           lawyer.role.toLowerCase().includes(query) ||
           lawyer.specializations.some((spec: string) => spec.toLowerCase().includes(query))
  })
})

const selectedLawyers = computed(() => {
  if (!selectedLawyerIds.value) return []
  return lawyers.value.filter(lawyer => selectedLawyerIds.value.includes(lawyer.id))
})

const availableLawyers = computed(() => {
  return filteredLawyers.value.filter(lawyer => lawyer.isAvailable)
})

const canAddMore = computed(() => {
  return !selectedLawyerIds.value || selectedLawyerIds.value.length < props.maxLawyers
})

// Methods
const toggleLawyer = (lawyerId: string) => {
  const currentIds = selectedLawyerIds.value || []
  
  if (currentIds.includes(lawyerId)) {
    // Remove lawyer
    setValue(currentIds.filter(id => id !== lawyerId))
  } else {
    // Add lawyer (if under limit)
    if (currentIds.length < props.maxLawyers) {
      setValue([...currentIds, lawyerId])
    }
  }
}

const removeLawyer = (lawyerId: string) => {
  const currentIds = selectedLawyerIds.value || []
  setValue(currentIds.filter(id => id !== lawyerId))
}

const getWorkloadStatus = (lawyer: any) => {
  const ratio = lawyer.currentCaseLoad / lawyer.maxCaseLoad
  if (ratio >= 1) return { status: 'full', color: 'red', label: 'At Capacity' }
  if (ratio >= 0.8) return { status: 'high', color: 'yellow', label: 'High Load' }
  if (ratio >= 0.5) return { status: 'medium', color: 'blue', label: 'Moderate Load' }
  return { status: 'low', color: 'green', label: 'Available' }
}

const getWorkloadColor = (lawyer: any) => {
  const workload = getWorkloadStatus(lawyer)
  switch (workload.status) {
    case 'full': return 'text-red-600 bg-red-50'
    case 'high': return 'text-yellow-600 bg-yellow-50'
    case 'medium': return 'text-blue-600 bg-blue-50'
    default: return 'text-green-600 bg-green-50'
  }
}

// Initialize with empty array if undefined
if (!selectedLawyerIds.value) {
  setValue([])
}

// Load lawyers on mount
loadLawyers()
</script>

<template>
  <FormFieldWrapper
    name="lawyer-assignment"
    :label="'Assigned Lawyers'"
    :description="`Select ${minLawyers}-${maxLawyers} lawyers to assign to this matter`"
    :required="required"
  >
    <div class="space-y-4">
      <!-- Search Bar -->
      <div class="relative">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search lawyers by name, role, or specialization..."
          class="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-md bg-background"
          :disabled="loading"
        />
      </div>

      <!-- Selected Lawyers -->
      <div v-if="selectedLawyers.length > 0" class="space-y-2">
        <div class="flex items-center gap-2">
          <Users class="h-4 w-4 text-muted-foreground" />
          <span class="text-sm font-medium">Selected Lawyers ({{ selectedLawyers.length }})</span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Card 
            v-for="lawyer in selectedLawyers" 
            :key="lawyer.id"
            class="p-3 bg-primary/5 border-primary/20"
          >
            <div class="flex items-center gap-3">
              <Avatar class="h-8 w-8">
                <AvatarImage :src="lawyer.avatar" />
                <AvatarFallback class="text-xs">
                  {{ lawyer.name.split(' ').map((n: string) => n[0]).join('') }}
                </AvatarFallback>
              </Avatar>
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium truncate">{{ lawyer.name }}</p>
                  <Badge variant="outline" class="text-xs">Primary</Badge>
                </div>
                <p class="text-xs text-muted-foreground">{{ lawyer.role }}</p>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="removeLawyer(lawyer.id)"
                class="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              >
                ×
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <!-- Available Lawyers -->
      <div v-if="canAddMore" class="space-y-2">
        <div class="flex items-center gap-2">
          <UserPlus class="h-4 w-4 text-muted-foreground" />
          <span class="text-sm font-medium">Available Lawyers</span>
          <Badge v-if="!canAddMore" variant="secondary" class="text-xs">
            Maximum reached ({{ maxLawyers }})
          </Badge>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 3" :key="i" class="flex items-center gap-3 p-3 border rounded-lg">
            <Skeleton class="h-8 w-8 rounded-full" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-1/2" />
              <Skeleton class="h-3 w-1/3" />
            </div>
          </div>
        </div>

        <!-- Lawyer List -->
        <div v-else class="space-y-1 max-h-60 overflow-y-auto">
          <div 
            v-for="lawyer in availableLawyers" 
            :key="lawyer.id"
            class="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 cursor-pointer"
            :class="{ 'opacity-50': !lawyer.isAvailable }"
            @click="lawyer.isAvailable && toggleLawyer(lawyer.id)"
          >
            <!-- Checkbox -->
            <Checkbox
              :checked="selectedLawyerIds?.includes(lawyer.id)"
              :disabled="!lawyer.isAvailable || (!selectedLawyerIds?.includes(lawyer.id) && !canAddMore)"
              @update:checked="() => toggleLawyer(lawyer.id)"
            />
            
            <!-- Avatar -->
            <Avatar class="h-8 w-8">
              <AvatarImage :src="lawyer.avatar" />
              <AvatarFallback class="text-xs">
                {{ lawyer.name.split(' ').map((n: string) => n[0]).join('') }}
              </AvatarFallback>
            </Avatar>
            
            <!-- Lawyer Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <p class="text-sm font-medium truncate">{{ lawyer.name }}</p>
                <div class="flex items-center gap-1">
                  <Star class="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span class="text-xs text-muted-foreground">{{ lawyer.rating }}</span>
                </div>
              </div>
              
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{{ lawyer.role }}</span>
                <span>•</span>
                <span>{{ lawyer.experience }} years</span>
                <span>•</span>
                <Badge 
                  variant="outline" 
                  :class="getWorkloadColor(lawyer)"
                  class="text-xs"
                >
                  {{ getWorkloadStatus(lawyer).label }}
                </Badge>
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

            <!-- Workload Indicator -->
            <div class="text-xs text-muted-foreground text-right">
              <div>{{ lawyer.currentCaseLoad }}/{{ lawyer.maxCaseLoad }}</div>
              <div class="w-12 h-1 bg-muted rounded-full mt-1">
                <div 
                  class="h-full rounded-full transition-all"
                  :class="getWorkloadColor(lawyer).replace('text-', 'bg-').replace(' bg-', ' bg-')"
                  :style="{ width: `${(lawyer.currentCaseLoad / lawyer.maxCaseLoad) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Lawyers Found -->
        <div v-if="!loading && availableLawyers.length === 0" class="text-center py-4">
          <div class="text-sm text-muted-foreground">
            <span v-if="searchQuery">No lawyers found matching "{{ searchQuery }}"</span>
            <span v-else>No available lawyers found</span>
          </div>
        </div>
      </div>

      <!-- Validation Messages -->
      <div v-if="error" class="text-sm text-destructive">
        {{ error }}
      </div>
      
      <div v-else-if="selectedLawyerIds && selectedLawyerIds.length < minLawyers" class="text-sm text-amber-600">
        Please select at least {{ minLawyers }} lawyer{{ minLawyers > 1 ? 's' : '' }}
      </div>
    </div>
  </FormFieldWrapper>
</template>

<style scoped>
/* Search input focus styles */
input:focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
}

/* Scrollbar styling for lawyer list */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground));
  border-radius: 3px;
}

/* Hover effects */
.cursor-pointer:hover .checkbox {
  @apply border-primary;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .grid-cols-1.md\\:grid-cols-2 {
    @apply grid-cols-1;
  }
  
  .flex.items-center.gap-2 {
    @apply gap-1;
  }
}

/* Loading state animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>