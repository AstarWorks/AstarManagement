<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Separator } from '~/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { 
  User, 
  Users, 
  Mail, 
  Phone, 
  Briefcase, 
  Scale,
  AlertCircle,
  Building
} from 'lucide-vue-next'
import type { Matter } from '~/types/matter'
import { formatAssigneeName, getInitials } from '~/utils/matter'

interface Props {
  matter?: Matter | null
  loading?: boolean
  error?: string | null
  className?: string
  showCompact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  className: '',
  showCompact: false
})

const emit = defineEmits<{
  'contact': [type: 'email' | 'phone', value: string]
  'refresh': []
}>()

// Computed properties for assignee information
const lawyerInfo = computed(() => {
  if (!props.matter?.assignedLawyer) return null
  
  if (typeof props.matter.assignedLawyer === 'string') {
    return {
      name: props.matter.assignedLawyer,
      initials: getInitials(props.matter.assignedLawyer)
    }
  }
  
  return {
    name: props.matter.assignedLawyer.name,
    initials: props.matter.assignedLawyer.initials || getInitials(props.matter.assignedLawyer.name),
    avatar: props.matter.assignedLawyer.avatar
  }
})

const clerkInfo = computed(() => {
  if (!props.matter?.assignedClerk) return null
  
  if (typeof props.matter.assignedClerk === 'string') {
    return {
      name: props.matter.assignedClerk,
      initials: getInitials(props.matter.assignedClerk)
    }
  }
  
  return {
    name: props.matter.assignedClerk.name,
    initials: props.matter.assignedClerk.initials || getInitials(props.matter.assignedClerk.name),
    avatar: props.matter.assignedClerk.avatar
  }
})

// Handle contact actions
const handleContact = (type: 'email' | 'phone', value: string) => {
  emit('contact', type, value)
}

// Handle retry on error
const handleRetry = () => {
  emit('refresh')
}
</script>

<template>
  <Card :class="className">
    <CardHeader :class="showCompact ? 'pb-3' : ''">
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <CardTitle class="text-xl font-semibold">
            Parties & Assignments
          </CardTitle>
          <CardDescription v-if="!showCompact">
            Client, opposing party, and legal team
          </CardDescription>
        </div>
        <Users class="h-5 w-5 text-muted-foreground" />
      </div>
    </CardHeader>
    
    <CardContent :class="showCompact ? 'pt-0' : ''">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="space-y-2">
          <Skeleton class="h-4 w-24" />
          <div class="flex items-center space-x-3">
            <Skeleton class="h-10 w-10 rounded-full" />
            <div class="space-y-1">
              <Skeleton class="h-4 w-32" />
              <Skeleton class="h-3 w-24" />
            </div>
          </div>
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
        <!-- Client Information -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <User class="h-4 w-4" />
            Client
          </div>
          
          <div class="pl-6 space-y-2">
            <div class="flex items-center justify-between">
              <p class="font-medium">{{ matter.clientName || 'Not specified' }}</p>
              <Badge v-if="matter.client?.id" variant="outline" class="text-xs">
                ID: {{ matter.client.id }}
              </Badge>
            </div>
            
            <div v-if="matter.clientEmail || matter.clientPhone" class="space-y-1">
              <button
                v-if="matter.clientEmail"
                @click="handleContact('email', matter.clientEmail)"
                class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail class="h-3 w-3" />
                {{ matter.clientEmail }}
              </button>
              
              <button
                v-if="matter.clientPhone"
                @click="handleContact('phone', matter.clientPhone)"
                class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone class="h-3 w-3" />
                {{ matter.clientPhone }}
              </button>
            </div>
          </div>
        </div>
        
        <!-- Opposing Party (if present) -->
        <div v-if="matter.opponentName" class="space-y-3">
          <Separator />
          
          <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Building class="h-4 w-4" />
            Opposing Party
          </div>
          
          <div class="pl-6">
            <p class="font-medium">{{ matter.opponentName }}</p>
          </div>
        </div>
        
        <!-- Legal Team Assignment -->
        <div class="space-y-3">
          <Separator />
          
          <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Scale class="h-4 w-4" />
            Legal Team
          </div>
          
          <div class="pl-6 space-y-3">
            <!-- Assigned Lawyer -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Avatar class="h-10 w-10">
                  <AvatarImage v-if="lawyerInfo?.avatar" :src="lawyerInfo.avatar" />
                  <AvatarFallback>
                    {{ lawyerInfo?.initials || '?' }}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p class="font-medium">{{ lawyerInfo?.name || 'Unassigned' }}</p>
                  <p class="text-sm text-muted-foreground">Lead Lawyer</p>
                </div>
              </div>
              <Badge v-if="lawyerInfo" variant="outline">
                <Briefcase class="h-3 w-3 mr-1" />
                Lawyer
              </Badge>
            </div>
            
            <!-- Assigned Clerk (if present) -->
            <div v-if="clerkInfo" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Avatar class="h-10 w-10">
                  <AvatarImage v-if="clerkInfo.avatar" :src="clerkInfo.avatar" />
                  <AvatarFallback>
                    {{ clerkInfo.initials }}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p class="font-medium">{{ clerkInfo.name }}</p>
                  <p class="text-sm text-muted-foreground">Legal Clerk</p>
                </div>
              </div>
              <Badge variant="outline">
                <User class="h-3 w-3 mr-1" />
                Clerk
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else class="text-center py-4">
        <p class="text-muted-foreground">No party information available</p>
      </div>
    </CardContent>
  </Card>
</template>