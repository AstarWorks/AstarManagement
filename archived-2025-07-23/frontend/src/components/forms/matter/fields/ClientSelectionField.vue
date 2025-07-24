<!--
  Client Selection Field Component
  
  Specialized field for selecting clients with search functionality,
  new client creation option, and client information display.
-->

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { FormFieldWrapper } from '~/components/forms'
import { FormSelect } from '~/components/forms'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { Skeleton } from '~/components/ui/skeleton'
import { useField } from 'vee-validate'
import { Plus, Search, User, Building2 } from 'lucide-vue-next'

interface Props {
  /** Error message from form validation */
  error?: string
  /** Field name for form binding */
  name?: string
  /** Whether field is required */
  required?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Enable new client creation */
  allowCreate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  name: 'clientId',
  required: true,
  placeholder: 'Search and select a client...',
  allowCreate: true
})

// Emits
const emit = defineEmits<{
  /** Fired when a new client is created */
  clientCreated: [client: any]
}>()

// Field binding
const { value: selectedClientId, setValue } = useField(props.name)

// State
const loading = ref(false)
const clients = ref<any[]>([])
const selectedClient = ref<any>(null)
const searchQuery = ref('')
const showCreateDialog = ref(false)

// Mock client data - in real app, this would come from API
const mockClients = [
  {
    id: '1',
    type: 'INDIVIDUAL',
    clientCode: 'CLI-001',
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      middleName: 'Michael'
    },
    email: 'john.doe@email.com',
    phone: '+1-555-123-4567',
    address: {
      street: '123 Main St',
      city: 'Tokyo',
      state: 'Tokyo',
      postalCode: '100-0001',
      country: 'Japan'
    },
    isActive: true
  },
  {
    id: '2',
    type: 'CORPORATION',
    clientCode: 'CLI-002',
    companyInfo: {
      companyName: 'Tech Solutions Inc.',
      registrationNumber: 'REG-123456',
      industry: 'Technology'
    },
    email: 'legal@techsolutions.com',
    phone: '+1-555-987-6543',
    address: {
      street: '456 Corporate Blvd',
      city: 'Osaka',
      state: 'Osaka',
      postalCode: '530-0001',
      country: 'Japan'
    },
    isActive: true
  },
  {
    id: '3',
    type: 'INDIVIDUAL',
    clientCode: 'CLI-003',
    personalInfo: {
      firstName: 'Jane',
      lastName: 'Smith',
      middleName: ''
    },
    email: 'jane.smith@email.com',
    phone: '+1-555-456-7890',
    address: {
      street: '789 Business Ave',
      city: 'Kyoto',
      state: 'Kyoto',
      postalCode: '600-0001',
      country: 'Japan'
    },
    isActive: true
  }
]

// Load clients
const loadClients = async () => {
  loading.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    clients.value = mockClients
  } catch (error) {
    console.error('Failed to load clients:', error)
  } finally {
    loading.value = false
  }
}

// Computed properties
const filteredClients = computed(() => {
  if (!searchQuery.value) return clients.value
  
  const query = searchQuery.value.toLowerCase()
  return clients.value.filter(client => {
    const name = client.type === 'INDIVIDUAL'
      ? `${client.personalInfo.firstName} ${client.personalInfo.lastName}`.toLowerCase()
      : client.companyInfo.companyName.toLowerCase()
    
    return name.includes(query) ||
           client.clientCode.toLowerCase().includes(query) ||
           client.email.toLowerCase().includes(query)
  })
})

const clientOptions = computed(() => {
  return filteredClients.value.map(client => {
    const label = client.type === 'INDIVIDUAL'
      ? `${client.personalInfo.firstName} ${client.personalInfo.lastName} (${client.clientCode})`
      : `${client.companyInfo.companyName} (${client.clientCode})`
    
    return {
      value: client.id,
      label
    }
  })
})

// Watch for selected client changes
watch(selectedClientId, (newId) => {
  if (newId) {
    selectedClient.value = clients.value.find(c => c.id === newId)
  } else {
    selectedClient.value = null
  }
})

// Methods
const handleCreateClient = () => {
  showCreateDialog.value = true
}

const handleClientCreated = (newClient: any) => {
  clients.value.unshift(newClient)
  setValue(newClient.id)
  selectedClient.value = newClient
  showCreateDialog.value = false
  emit('clientCreated', newClient)
}

// Load clients on mount
loadClients()
</script>

<template>
  <FormFieldWrapper
    name="client-selection"
    :label="'Client'"
    :description="'Select the client for this matter'"
    :required="required"
  >
    <div class="space-y-3">
      <!-- Client Selection -->
      <div class="flex gap-2">
        <div class="flex-1">
          <FormSelect
            :name="name"
            :placeholder="placeholder"
            :options="clientOptions"
            :error="error"
            :loading="loading"
          />
        </div>
        <Button
          v-if="allowCreate"
          type="button"
          variant="outline"
          size="icon"
          @click="handleCreateClient"
          :disabled="loading"
        >
          <Plus class="h-4 w-4" />
        </Button>
      </div>

      <!-- Search Bar -->
      <div class="relative">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search clients by name, code, or email..."
          class="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-md bg-background"
          :disabled="loading"
        />
      </div>

      <!-- Selected Client Info -->
      <Card v-if="selectedClient" class="bg-muted/30">
        <CardContent class="p-4">
          <div class="flex items-start gap-3">
            <!-- Client Type Icon -->
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User v-if="selectedClient.type === 'INDIVIDUAL'" class="h-4 w-4 text-primary" />
              <Building2 v-else class="h-4 w-4 text-primary" />
            </div>
            
            <!-- Client Details -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="font-medium text-sm">
                  <span v-if="selectedClient.type === 'INDIVIDUAL'">
                    {{ selectedClient.personalInfo.firstName }} {{ selectedClient.personalInfo.lastName }}
                  </span>
                  <span v-else>
                    {{ selectedClient.companyInfo.companyName }}
                  </span>
                </h4>
                <Badge variant="outline" class="text-xs">
                  {{ selectedClient.clientCode }}
                </Badge>
              </div>
              
              <div class="space-y-1 text-xs text-muted-foreground">
                <div class="flex items-center gap-4">
                  <span>{{ selectedClient.email }}</span>
                  <span>{{ selectedClient.phone }}</span>
                </div>
                <div>
                  {{ selectedClient.address.street }}, {{ selectedClient.address.city }}, {{ selectedClient.address.postalCode }}
                </div>
                <div v-if="selectedClient.type === 'CORPORATION'" class="flex items-center gap-2">
                  <span>Industry: {{ selectedClient.companyInfo.industry }}</span>
                  <span>•</span>
                  <span>Registration: {{ selectedClient.companyInfo.registrationNumber }}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Loading State -->
      <div v-if="loading && !clients.length" class="space-y-2">
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-3/4" />
        <Skeleton class="h-4 w-1/2" />
      </div>

      <!-- No Clients Found -->
      <div v-if="!loading && filteredClients.length === 0 && searchQuery" class="text-center py-4">
        <div class="text-sm text-muted-foreground">
          No clients found matching "{{ searchQuery }}"
        </div>
        <Button
          v-if="allowCreate"
          type="button"
          variant="link"
          size="sm"
          @click="handleCreateClient"
          class="mt-2"
        >
          Create new client
        </Button>
      </div>
    </div>

    <!-- Create Client Dialog -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
        </DialogHeader>
        <div class="py-4">
          <p class="text-sm text-muted-foreground mb-4">
            Client creation form would be implemented here with full client data collection.
          </p>
          <div class="flex justify-end gap-2">
            <Button variant="outline" @click="showCreateDialog = false">Cancel</Button>
            <Button @click="showCreateDialog = false">Create Client</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </FormFieldWrapper>
</template>

<style scoped>
/* Search input focus styles */
input:focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
}

/* Loading state for select */
.select-loading {
  @apply opacity-50 pointer-events-none;
}

/* Client card hover effect */
.client-card:hover {
  @apply bg-muted/50;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .flex.items-center.gap-4 {
    @apply flex-col items-start gap-1;
  }
}
</style>