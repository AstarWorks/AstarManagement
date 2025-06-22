<template>
  <div class="space-y-6">
    <!-- Client Information -->
    <div v-if="clientInfo" class="border rounded-lg p-4">
      <h4 class="font-medium text-foreground mb-3 flex items-center">
        <User class="h-4 w-4 mr-2" />
        Client Information
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div v-if="clientInfo.clientType === 'new'">
          <div class="space-y-2">
            <div v-if="clientInfo.clientEntityType === 'individual'">
              <span class="font-medium">Name:</span>
              {{ clientInfo.firstName }} {{ clientInfo.lastName }}
            </div>
            <div v-if="clientInfo.clientEntityType === 'corporate'">
              <span class="font-medium">Company:</span>
              {{ clientInfo.companyName }}
            </div>
            <div v-if="clientInfo.email">
              <span class="font-medium">Email:</span>
              {{ clientInfo.email }}
            </div>
            <div v-if="clientInfo.phone">
              <span class="font-medium">Phone:</span>
              {{ clientInfo.phone }}
            </div>
          </div>
        </div>
        <div v-else-if="clientInfo.existingClientId">
          <span class="font-medium">Existing Client ID:</span>
          {{ clientInfo.existingClientId }}
        </div>
      </div>
    </div>

    <!-- Matter Details -->
    <div v-if="matterInfo" class="border rounded-lg p-4">
      <h4 class="font-medium text-foreground mb-3 flex items-center">
        <FileText class="h-4 w-4 mr-2" />
        Matter Details
      </h4>
      <div class="space-y-3 text-sm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span class="font-medium">Title:</span>
            {{ matterInfo.matterTitle }}
          </div>
          <div>
            <span class="font-medium">Type:</span>
            {{ formatMatterType(matterInfo.matterType) }}
          </div>
          <div>
            <span class="font-medium">Priority:</span>
            <Badge :variant="getPriorityVariant(matterInfo.priority)">
              {{ matterInfo.priority }}
            </Badge>
          </div>
          <div>
            <span class="font-medium">Open Date:</span>
            {{ formatDate(matterInfo.openDate) }}
          </div>
        </div>
        
        <div v-if="matterInfo.matterDescription">
          <span class="font-medium">Description:</span>
          <p class="mt-1 text-muted-foreground">{{ matterInfo.matterDescription }}</p>
        </div>
        
        <div v-if="matterInfo.estimatedValue">
          <span class="font-medium">Estimated Value:</span>
          ¥{{ matterInfo.estimatedValue.toLocaleString() }}
        </div>

        <!-- Opposing Parties -->
        <div v-if="matterInfo.opposingParties && matterInfo.opposingParties.length > 0">
          <span class="font-medium">Opposing Parties:</span>
          <ul class="mt-1 space-y-1">
            <li v-for="party in matterInfo.opposingParties" :key="party.name" class="text-muted-foreground">
              • {{ party.name }}
              <span v-if="party.representative" class="text-xs">
                (Rep: {{ party.representative }})
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Case Settings -->
    <div v-if="settingsInfo" class="border rounded-lg p-4">
      <h4 class="font-medium text-foreground mb-3 flex items-center">
        <Settings class="h-4 w-4 mr-2" />
        Case Settings
      </h4>
      <div class="space-y-3 text-sm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span class="font-medium">Assigned Lawyer:</span>
            {{ settingsInfo.assignedLawyer }}
          </div>
          <div v-if="settingsInfo.responsibleClerk">
            <span class="font-medium">Responsible Clerk:</span>
            {{ settingsInfo.responsibleClerk }}
          </div>
          <div>
            <span class="font-medium">Billing Type:</span>
            {{ formatBillingType(settingsInfo.billingType) }}
          </div>
          <div v-if="settingsInfo.hourlyRate">
            <span class="font-medium">Hourly Rate:</span>
            ¥{{ settingsInfo.hourlyRate.toLocaleString() }}
          </div>
          <div v-if="settingsInfo.flatFee">
            <span class="font-medium">Flat Fee:</span>
            ¥{{ settingsInfo.flatFee.toLocaleString() }}
          </div>
        </div>

        <!-- Important Dates -->
        <div v-if="settingsInfo.statute_limitation || settingsInfo.next_hearing">
          <span class="font-medium">Important Dates:</span>
          <div class="mt-1 space-y-1 text-muted-foreground">
            <div v-if="settingsInfo.statute_limitation">
              • Statute of Limitations: {{ formatDate(settingsInfo.statute_limitation) }}
            </div>
            <div v-if="settingsInfo.next_hearing">
              • Next Hearing: {{ formatDateTime(settingsInfo.next_hearing) }}
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="settingsInfo.tags && settingsInfo.tags.length > 0">
          <span class="font-medium">Tags:</span>
          <div class="mt-1 flex flex-wrap gap-1">
            <Badge v-for="tag in settingsInfo.tags" :key="tag" variant="secondary">
              {{ tag }}
            </Badge>
          </div>
        </div>

        <!-- Settings Flags -->
        <div class="space-y-1">
          <div v-if="settingsInfo.isConfidential" class="flex items-center gap-2">
            <Lock class="h-4 w-4 text-amber-500" />
            <span class="text-amber-700">Confidential Case</span>
          </div>
          <div v-if="settingsInfo.enableAutoReminders" class="flex items-center gap-2">
            <Bell class="h-4 w-4 text-blue-500" />
            <span class="text-blue-700">Auto-reminders Enabled</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="bg-muted/50 rounded-lg p-4">
      <h4 class="font-medium text-foreground mb-3">Summary</h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-center">
        <div>
          <div class="font-semibold text-lg">{{ completedSections }}</div>
          <div class="text-muted-foreground">Completed Sections</div>
        </div>
        <div>
          <div class="font-semibold text-lg">{{ totalFields }}</div>
          <div class="text-muted-foreground">Total Fields</div>
        </div>
        <div>
          <div class="font-semibold text-lg">{{ filledFields }}</div>
          <div class="text-muted-foreground">Fields Filled</div>
        </div>
        <div>
          <div class="font-semibold text-lg">{{ completionPercentage }}%</div>
          <div class="text-muted-foreground">Completion</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '~/components/ui/badge'
import { User, FileText, Settings, Lock, Bell } from 'lucide-vue-next'
import { format, parseISO } from 'date-fns'

interface MatterSummaryProps {
  formData: Record<string, any>
}

const props = defineProps<MatterSummaryProps>()

// Extract sections from form data
const clientInfo = computed(() => props.formData.client)
const matterInfo = computed(() => props.formData.matter)
const settingsInfo = computed(() => props.formData.settings)

// Summary statistics
const completedSections = computed(() => {
  let count = 0
  if (clientInfo.value && Object.keys(clientInfo.value).length > 0) count++
  if (matterInfo.value && Object.keys(matterInfo.value).length > 0) count++
  if (settingsInfo.value && Object.keys(settingsInfo.value).length > 0) count++
  return count
})

const totalFields = computed(() => {
  let count = 0
  if (clientInfo.value) count += Object.keys(clientInfo.value).length
  if (matterInfo.value) count += Object.keys(matterInfo.value).length
  if (settingsInfo.value) count += Object.keys(settingsInfo.value).length
  return count
})

const filledFields = computed(() => {
  let count = 0
  
  const countFilledFields = (obj: any) => {
    if (!obj) return 0
    return Object.values(obj).filter(value => 
      value !== null && 
      value !== undefined && 
      value !== '' && 
      (!Array.isArray(value) || value.length > 0)
    ).length
  }
  
  count += countFilledFields(clientInfo.value)
  count += countFilledFields(matterInfo.value)
  count += countFilledFields(settingsInfo.value)
  
  return count
})

const completionPercentage = computed(() => {
  if (totalFields.value === 0) return 0
  return Math.round((filledFields.value / totalFields.value) * 100)
})

// Formatting functions
const formatDate = (dateString: string) => {
  if (!dateString) return 'Not specified'
  try {
    const date = parseISO(dateString)
    return format(date, 'MMM d, yyyy')
  } catch {
    return dateString
  }
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return 'Not specified'
  try {
    const date = parseISO(dateString)
    return format(date, 'MMM d, yyyy h:mm a')
  } catch {
    return dateString
  }
}

const formatMatterType = (type: string) => {
  const types: Record<string, string> = {
    'CIVIL': 'Civil Law',
    'CRIMINAL': 'Criminal Law',
    'CORPORATE': 'Corporate Law',
    'FAMILY': 'Family Law',
    'IMMIGRATION': 'Immigration Law',
    'INTELLECTUAL_PROPERTY': 'Intellectual Property',
    'LABOR': 'Labor Law',
    'REAL_ESTATE': 'Real Estate Law',
    'TAX': 'Tax Law',
    'OTHER': 'Other'
  }
  return types[type] || type
}

const formatBillingType = (type: string) => {
  const types: Record<string, string> = {
    'hourly': 'Hourly Rate',
    'flat': 'Flat Fee',
    'contingency': 'Contingency'
  }
  return types[type] || type
}

const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return 'destructive'
    case 'HIGH':
      return 'default'
    case 'MEDIUM':
      return 'secondary'
    case 'LOW':
      return 'outline'
    default:
      return 'secondary'
  }
}
</script>