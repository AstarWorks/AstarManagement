<template>
  <div class="container mx-auto py-8">
    <!-- Loading State -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <LoadingSpinner />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="py-12">
      <ErrorDisplay :error="error" @retry="refresh" />
    </div>

    <!-- Workspace Content -->
    <div v-else-if="workspace">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" @click="$router.back()">
            <Icon name="lucide:arrow-left" class="h-4 w-4" />
          </Button>
          <div
            class="h-12 w-12 rounded-lg flex items-center justify-center text-2xl"
            :style="{ backgroundColor: ((workspace.settings as components['schemas']['JsonObject'])?.color as string || '#3B82F6') + '20', color: (workspace.settings as components['schemas']['JsonObject'])?.color as string || '#3B82F6' }"
          >
            {{ (workspace.settings as components['schemas']['JsonObject'])?.icon as string || '📁' }}
          </div>
          <div class="flex-1">
            <h1 class="text-3xl font-bold">{{ workspace.name }}</h1>
            <p v-if="workspace.description" class="text-muted-foreground mt-1">
              {{ workspace.description }}
            </p>
          </div>
          <Button variant="outline" @click="editWorkspace">
            <Icon name="lucide:settings" class="mr-2 h-4 w-4" />
            {{ $t('settings') }}
          </Button>
        </div>

        <!-- Tabs -->
        <Tabs v-model="activeTab" class="mt-6">
          <TabsList>
            <TabsTrigger value="tables">
              <Icon name="lucide:table" class="mr-2 h-4 w-4" />
              {{ $t('foundation.common.fields.table') }}
            </TabsTrigger>
            <TabsTrigger value="members">
              <Icon name="lucide:users" class="mr-2 h-4 w-4" />
              {{ $t('foundation.common.general.users') }}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Icon name="lucide:settings" class="mr-2 h-4 w-4" />
              {{ $t('settings') }}
            </TabsTrigger>
          </TabsList>

          <!-- Tables Tab (integrated with overview) -->
          <TabsContent value="tables" class="mt-6 space-y-6">
            <!-- Compact Stats -->
            <div class="grid gap-3 grid-cols-2 md:grid-cols-4">
              <Card class="p-3">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:table" class="h-4 w-4 text-muted-foreground" />
                  <span class="text-sm text-muted-foreground">{{ $t('foundation.common.fields.table') }}</span>
                  <span class="ml-auto text-lg font-semibold">{{ tableCount }}</span>
                </div>
              </Card>

              <Card class="p-3">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:users" class="h-4 w-4 text-muted-foreground" />
                  <span class="text-sm text-muted-foreground">{{ $t('foundation.common.general.users') }}</span>
                  <span class="ml-auto text-lg font-semibold">{{ memberCount }}</span>
                </div>
              </Card>

              <Card class="p-3">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:file-text" class="h-4 w-4 text-muted-foreground" />
                  <span class="text-sm text-muted-foreground">{{ $t('foundation.common.fields.file') }}</span>
                  <span class="ml-auto text-lg font-semibold">{{ documentCount }}</span>
                </div>
              </Card>

              <Card class="p-3">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:hard-drive" class="h-4 w-4 text-muted-foreground" />
                  <span class="text-sm text-muted-foreground">{{ $t('foundation.common.general.system') }}</span>
                  <span class="ml-auto text-lg font-semibold">{{ storageUsed }}</span>
                </div>
              </Card>
            </div>


            <!-- Table List -->
            <TableList :workspace-id="workspace.id || ''" />
          </TabsContent>

          <!-- Members Tab -->
          <TabsContent value="members" class="mt-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-semibold">{{ $t('foundation.common.general.users') }}</h2>
              <Button @click="inviteMember">
                <Icon name="lucide:user-plus" class="mr-2 h-4 w-4" />
                {{ $t('foundation.actions.data.share') }}
              </Button>
            </div>

            <!-- Member list -->
            <div v-if="members.length > 0" class="max-w-4xl mx-auto">
              <div class="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="w-auto">{{ $t('foundation.common.general.users') }}</TableHead>
                    <TableHead class="w-32">ロール</TableHead>
                    <TableHead class="w-40">{{ $t('foundation.common.fields.date') }}</TableHead>
                    <TableHead class="w-20 text-right">{{ $t('foundation.common.labels.actions') }}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="member in members" :key="member.id">
                    <!-- Member column with avatar, name, email -->
                    <TableCell class="py-4">
                      <div class="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {{ member.userName.charAt(0).toUpperCase() }}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div class="font-semibold">{{ member.userName }}</div>
                          <div class="text-sm text-muted-foreground">{{ member.userEmail }}</div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <!-- Role column -->
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        :style="getRoleStyle(member.role)"
                      >
                        {{ getRoleDisplayName(member.role) }}
                      </Badge>
                    </TableCell>
                    
                    <!-- Join date column -->
                    <TableCell class="text-sm text-muted-foreground">
                      {{ new Date(member.joinedAt).toLocaleDateString('ja-JP') }}
                    </TableCell>
                    
                    <!-- Actions column -->
                    <TableCell class="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="icon">
                            <Icon name="lucide:more-vertical" class="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem @click="changeRole(member)">
                            <Icon name="lucide:shield" class="mr-2 h-4 w-4" />
                            {{ $t('foundation.actions.basic.edit') }}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            class="text-destructive"
                            @click="removeMember(member)"
                          >
                            <Icon name="lucide:user-x" class="mr-2 h-4 w-4" />
                            {{ $t('foundation.actions.basic.delete') }}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              </div>
            </div>
            <div v-else class="text-center py-12 text-muted-foreground">
              {{ $t('foundation.messages.info.noData') }}
            </div>
          </TabsContent>

          <!-- Settings Tab -->
          <TabsContent value="settings" class="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{{ $t('settings') }}</CardTitle>
                <CardDescription>
                  {{ $t('foundation.common.fields.description') }}
                </CardDescription>
              </CardHeader>
              <CardContent class="space-y-6">
                <div class="space-y-2">
                  <Label for="workspace-name">{{ $t('foundation.common.fields.name') }}</Label>
                  <Input id="workspace-name" v-model="settingsForm.name" />
                </div>

                <div class="space-y-2">
                  <Label for="workspace-description">{{ $t('foundation.common.fields.description') }}</Label>
                  <Textarea 
                    id="workspace-description" 
                    v-model="settingsForm.description"
                    rows="3"
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <Label for="workspace-icon">{{ $t('foundation.common.fields.tags') }}</Label>
                    <Input id="workspace-icon" v-model="settingsForm.icon" maxlength="2" />
                  </div>
                  <div class="space-y-2">
                    <Label for="workspace-color">{{ $t('foundation.common.fields.type') }}</Label>
                    <Input id="workspace-color" v-model="settingsForm.color" type="color" />
                  </div>
                </div>

                <div class="flex justify-end gap-2">
                  <Button variant="outline" @click="resetSettings">
                    {{ $t('foundation.actions.basic.cancel') }}
                  </Button>
                  <Button :disabled="savingSettings" @click="saveSettings">
                    <LoadingSpinner v-if="savingSettings" class="mr-2 h-4 w-4" />
                    {{ $t('foundation.actions.basic.save') }}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <!-- Danger Zone -->
            <Card class="mt-6 border-destructive">
              <CardHeader>
                <CardTitle class="text-destructive">{{ $t('foundation.messages.warning.default') }}</CardTitle>
                <CardDescription>
                  {{ $t('foundation.messages.warning.irreversible') }}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" @click="deleteWorkspace">
                  <Icon name="lucide:trash" class="mr-2 h-4 w-4" />
                  {{ $t('foundation.actions.basic.delete') }}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'
import TableList from '~/modules/table/components/TableList.vue'
import { useWorkspaceNavigation } from '~/composables/useWorkspaceNavigation'
import type { WorkspaceResponse, WorkspaceUpdateRequest, WorkspaceMember } from '~/modules/workspace/types'
import type { components } from '~/types/api'
import LoadingSpinner from "@foundation/components/common/states/LoadingSpinner.vue";
import ErrorDisplay from "@foundation/components/common/states/ErrorDisplay.vue";
// Table components
import { 
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@foundation/components/ui/table'

// Page meta
definePageMeta({
  layout: 'default'
})

// Route params - 型安全な処理
const route = useRoute()
const router = useRouter()
const workspaceId = computed(() => {
  const params = route.params as Record<string, string | string[]>
  const id = params.id
  if (!id || Array.isArray(id)) {
    throw createError({ 
      statusCode: 404, 
      statusMessage: 'Invalid workspace ID format' 
    })
  }
  return id
})

// Composables
const { t } = useI18n()
const workspaceApi = useWorkspace()
const { setWorkspaceId } = useWorkspaceNavigation()

// State
const workspace = ref<WorkspaceResponse | null>(null)
const members = ref<WorkspaceMember[]>([])
const pending = ref(true)
const error = ref<Error | null>(null)
const activeTab = ref((route.query.tab as string) || 'tables')
const savingSettings = ref(false)

// Table data
const table = useTable()
const { data: tableListData } = await useAsyncData(
  `tables-${workspaceId.value}`,
  () => table.listTables(workspaceId.value),
  { server: false }
)

// Statistics
const tableCount = computed(() => tableListData.value?.tables?.length || 0)
// memberCount is updated from API in loadWorkspace()
const memberCount = ref(0)
// TODO: These values should come from workspace stats API when available
const documentCount = computed(() => 0)
const storageUsed = computed(() => '計算中...')

// Settings form
const settingsForm = reactive({
  name: '',
  description: '',
  icon: '',
  color: ''
})

// Watch activeTab changes and sync with URL query
watch(activeTab, (newTab) => {
  if (newTab !== (route.query.tab || 'tables')) {
    router.push({ 
      path: route.path, 
      query: { ...route.query, tab: newTab } 
    })
  }
})

// Load workspace data
const loadWorkspace = async () => {
  pending.value = true
  error.value = null
  
  try {
    workspace.value = await workspaceApi.getWorkspace(workspaceId.value)
    
    // Set current workspace ID for global navigation
    setWorkspaceId(workspaceId.value)
    
    // Initialize settings form
    settingsForm.name = workspace.value.name || ''
    settingsForm.description = workspace.value.description || ''
    settingsForm.icon = (workspace.value.settings as components["schemas"]["JsonObject"])?.icon as string || '📁'
    settingsForm.color = (workspace.value.settings as components["schemas"]["JsonObject"])?.color as string || '#3B82F6'
    
    // Load members
    const memberResponse = await workspaceApi.listMembers(workspaceId.value)
    members.value = memberResponse.members
    memberCount.value = memberResponse.totalCount
  } catch (e) {
    error.value = e as Error
    console.error('Failed to load workspace:', e)
  } finally {
    pending.value = false
  }
}

// Methods
const refresh = () => {
  loadWorkspace()
}

const editWorkspace = () => {
  activeTab.value = 'settings'
}

const createTable = () => {
  router.push(`/workspaces/${workspaceId.value}/tables/new`)
}

const inviteMember = () => {
  toast.info(t('foundation.messages.info.processing'))
}

const createDocument = () => {
  toast.info(t('foundation.messages.info.processing'))
}

const changeRole = (_member: WorkspaceMember) => {
  toast.info(t('foundation.messages.info.processing'))
}

// Role styling functions
const getRoleStyle = (role: string) => {
  const styles = {
    'owner': { backgroundColor: '#dc262620', borderColor: '#dc2626', color: '#dc2626' },
    'admin': { backgroundColor: '#2563eb20', borderColor: '#2563eb', color: '#2563eb' }, 
    'member': { backgroundColor: '#6b728020', borderColor: '#6b7280', color: '#6b7280' }
  }
  return styles[role as keyof typeof styles] || styles.member
}

const getRoleDisplayName = (role: string) => {
  return t(`modules.auth.domain.roles.${role.toUpperCase()}`) || role
}

const removeMember = async (member: WorkspaceMember) => {
  try {
    await workspaceApi.removeMember(workspaceId.value, member.id)
    members.value = members.value.filter(m => m.id !== member.id)
    memberCount.value--
    toast.success(t('foundation.messages.success.deleted'))
  } catch (error) {
    console.error('Failed to remove member:', error)
    toast.error(t('foundation.messages.error.default'))
  }
}

const resetSettings = () => {
  if (workspace.value) {
    settingsForm.name = workspace.value.name || ''
    settingsForm.description = workspace.value.description || ''
    settingsForm.icon = (workspace.value.settings as components["schemas"]["JsonObject"])?.icon as string || '📁'
    settingsForm.color = (workspace.value.settings as components["schemas"]["JsonObject"])?.color as string || '#3B82F6'
  }
}

const saveSettings = async () => {
  savingSettings.value = true
  
  try {
    const data: WorkspaceUpdateRequest = {
      name: settingsForm.name,
      description: settingsForm.description,
      settings: {
        icon: settingsForm.icon,
        color: settingsForm.color
      } as components["schemas"]["JsonObject"]
    }
    
    workspace.value = await workspaceApi.updateWorkspace(workspaceId.value, data)
    toast.success(t('foundation.messages.success.saved'))
  } catch (error) {
    console.error('Failed to save settings:', error)
    toast.error(t('foundation.messages.error.default'))
  } finally {
    savingSettings.value = false
  }
}

const deleteWorkspace = () => {
  // Confirmation dialog would go here
  toast.info(t('foundation.messages.info.processing'))
}

// Initialize
onMounted(() => {
  loadWorkspace()
})
</script>