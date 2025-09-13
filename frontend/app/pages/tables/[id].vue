<template>
  <div class="min-h-screen bg-background">
    <!-- Always render container div to prevent hydration mismatch -->
    <div class="container mx-auto py-4">
      <!-- Loading State -->
      <div v-if="pending" class="space-y-4">
        <Skeleton class="h-12 w-1/3" />
        <Skeleton class="h-8 w-1/2" />
        <div class="grid gap-4">
          <Skeleton class="h-40" />
          <Skeleton class="h-40" />
        </div>
      </div>
      
      <!-- Error State -->
      <ErrorDisplay
        v-else-if="error"
        :error="error"
        @retry="refresh"
      />
      
      <!-- Table Content -->
      <div v-else-if="table" class="space-y-4">
        <!-- Header Section -->
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              @click="navigateBack"
            >
              <Icon name="lucide:arrow-left" class="h-4 w-4" />
            </Button>
            <div>
              <h1 class="text-3xl font-bold">{{ table.name }}</h1>
              <p v-if="table.description" class="text-muted-foreground mt-1">
                {{ table.description }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="duplicateTable"
          >
            <Icon name="lucide:copy" class="h-4 w-4" />
            {{ $t('foundation.actions.data.duplicate') }}
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="openEditDialog"
          >
            <Icon name="lucide:edit" class="h-4 w-4" />
            {{ $t('foundation.actions.basic.edit') }}
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="text-destructive hover:text-destructive-foreground"
            @click="openDeleteDialog"
          >
            <Icon name="lucide:trash" class="h-4 w-4" />
            {{ $t('foundation.actions.basic.delete') }}
          </Button>
        </div>
        </div>
        
        <!-- Stats Bar - Compact Cards -->
        <div class="flex gap-3">
        <div class="bg-white border border-gray-200 rounded-md px-3 py-1.5">
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-gray-500">{{ $t('modules.table.detail.stats.records') }}</span>
            <span class="text-sm font-bold text-gray-900">{{ recordCount }}</span>
          </div>
        </div>
        <div class="bg-white border border-gray-200 rounded-md px-3 py-1.5">
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-gray-500">{{ $t('modules.table.detail.stats.properties') }}</span>
            <span class="text-sm font-bold text-gray-900">{{ stats.propertyCount }}</span>
          </div>
        </div>
        <div class="bg-white border border-gray-200 rounded-md px-3 py-1.5">
          <ClientOnly>
            <div class="flex items-center gap-2">
              <span class="text-[10px] text-gray-500">{{ $t('modules.table.detail.stats.created') }}</span>
              <span class="text-sm font-bold text-gray-900">{{ formatDate(stats.createdAt) }}</span>
            </div>
            <template #fallback>
              <Skeleton class="h-4 w-16" />
            </template>
          </ClientOnly>
        </div>
        <div class="bg-white border border-gray-200 rounded-md px-3 py-1.5">
          <ClientOnly>
            <div class="flex items-center gap-2">
              <span class="text-[10px] text-gray-500">{{ $t('modules.table.detail.stats.updated') }}</span>
              <span class="text-sm font-bold text-gray-900">{{ formatDate(stats.updatedAt) }}</span>
            </div>
            <template #fallback>
              <Skeleton class="h-4 w-16" />
            </template>
          </ClientOnly>
        </div>
        </div>
        
        <!-- Tab Navigation -->
        <Tabs v-model="activeTab" class="w-full">
          <TabsList class="w-full">
          <TabsTrigger 
            value="records"
            class="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Icon name="lucide:database" class="mr-2 h-4 w-4" />
            {{ $t('modules.table.detail.tabs.records') }}
            <Badge v-if="recordCount > 0" variant="secondary" class="ml-2 h-5 px-1.5 text-xs">
              {{ recordCount }}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="properties"
            class="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Icon name="lucide:columns" class="mr-2 h-4 w-4" />
            {{ $t('modules.table.detail.tabs.properties') }}
            <Badge v-if="stats.propertyCount > 0" variant="secondary" class="ml-2 h-5 px-1.5 text-xs">
              {{ stats.propertyCount }}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="settings"
            class="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Icon name="lucide:settings" class="mr-2 h-4 w-4" />
            {{ $t('modules.table.detail.tabs.settings') }}
          </TabsTrigger>
          </TabsList>
          
          <!-- Records Tab -->
          <TabsContent value="records" class="mt-6">
          <RecordList
            v-if="table?.id"
            :table-id="table.id"
            :properties="properties as Record<string, PropertyDefinitionDto>"
            enable-pinning
            :initial-pinning="{
              columns: {
                left: ['select'],
                right: ['actions']
              }
            }"
            @update:record-count="updateRecordCount"
          />
          </TabsContent>
          
          <!-- Properties Tab -->
          <TabsContent value="properties" class="mt-6">
          <PropertyList
            v-if="table?.id"
            :table-id="table.id"
            :properties="properties as Record<string, PropertyDefinitionDto>"
            :ordered-properties="orderedProperties as string[]"
            @refresh="refresh"
            @reorder="handlePropertyReorder"
          />
          </TabsContent>
          
          <!-- Settings Tab -->
          <TabsContent value="settings" class="mt-6">
          <div class="rounded-lg border p-6">
            <p class="text-muted-foreground">
              {{ $t('modules.table.detail.comingSoon') }}
            </p>
          </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <!-- Empty state when no data (fallback for SSR) -->
      <div v-else class="space-y-4">
        <Skeleton class="h-12 w-1/3" />
        <Skeleton class="h-8 w-1/2" />
        <div class="grid gap-4">
          <Skeleton class="h-40" />
          <Skeleton class="h-40" />
        </div>
      </div>
    </div>
    
    <!-- Edit Dialog -->
    <CreateTableDialog
      v-model:open="editDialogOpen"
      :table="table as TableResponse"
      :workspace-id="table?.workspaceId || ''"
      @success="handleEditSuccess"
    />
    
    <!-- Delete Confirmation -->
    <Dialog v-model:open="deleteDialogOpen">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>{{ $t('modules.table.delete.title') }}</DialogTitle>
          <DialogDescription>
            {{ $t('modules.table.delete.description', { name: table?.name }) }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="deleteDialogOpen = false">
            {{ $t('foundation.actions.basic.cancel') }}
          </Button>
          <Button
            variant="destructive"
            @click="confirmDelete"
          >
            {{ $t('foundation.actions.basic.delete') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useTableDetail } from '~/modules/table/composables/useTableDetail'
import RecordList from '~/modules/table/components/record/RecordList.vue'
import PropertyList from '~/modules/table/components/property/PropertyList.vue'
import CreateTableDialog from '~/modules/table/components/CreateTableDialog.vue'
import ErrorDisplay from '@foundation/components/common/states/ErrorDisplay.vue'
import type { TableResponse, PropertyDefinitionDto } from '~/modules/table/types'

// Route params
const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

// Table ID from route
const tableId = computed(() => {
  const params = route.params
  if (!params || typeof params !== 'object') {
    return ''
  }
  const id = 'id' in params ? params.id : undefined
  if (typeof id === 'string' && id.length > 0) {
    return id
  }
  if (Array.isArray(id) && id.length > 0 && typeof id[0] === 'string') {
    return id[0]
  }
  return ''
})

// Table detail composable - provide a default value if tableId is undefined
const {
  table,
  properties,
  orderedProperties,
  stats,
  activeTab,
  pending,
  error,
  refresh,
  // updateTable is handled via dialog
  deleteTable,
  duplicateTable,
  reorderProperties
} = useTableDetail(tableId.value || '')

// Local state
const editDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const recordCount = ref(0)

// Actions
const navigateBack = () => {
  const workspaceId = table.value?.workspaceId
  if (workspaceId) {
    router.push(`/workspaces/${workspaceId}?tab=tables`)
  } else {
    router.push('/tables?tab=all')
  }
}

const openEditDialog = () => {
  editDialogOpen.value = true
}

const openDeleteDialog = () => {
  deleteDialogOpen.value = true
}

const handleEditSuccess = () => {
  editDialogOpen.value = false
  refresh()
}

const confirmDelete = async () => {
  try {
    await deleteTable()
  } catch {
    // Error already handled in composable
  } finally {
    deleteDialogOpen.value = false
  }
}

const updateRecordCount = (count: number) => {
  recordCount.value = count
}

const handlePropertyReorder = async (newOrder: string[]) => {
  try {
    await reorderProperties(newOrder)
    // refresh() is already called inside reorderProperties -> updateTable
  } catch (error) {
    console.error('Failed to reorder properties:', error)
    // Error is already handled in useTableDetail
  }
}

const formatDate = computed(() => {
  const currentLocale = locale.value
  return (date?: string) => {
    if (!date) return '-'
    return format(new Date(date), 'PPpp', {
      locale: currentLocale === 'ja' ? ja : undefined
    })
  }
})

// Page meta
definePageMeta({
  layout: 'default'
})

useHead({
  title: computed(() => table.value?.name || t('modules.table.detail.title'))
})
</script>