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
            :style="{ backgroundColor: workspace.color + '20', color: workspace.color }"
          >
            {{ workspace.icon || '📁' }}
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
            <TabsTrigger value="overview">
              <Icon name="lucide:layout-dashboard" class="mr-2 h-4 w-4" />
              {{ $t('dashboard') }}
            </TabsTrigger>
            <TabsTrigger value="tables">
              <Icon name="lucide:table" class="mr-2 h-4 w-4" />
              {{ $t('foundation.common.fields.type') }}
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

          <!-- Overview Tab -->
          <TabsContent value="overview" class="mt-6">
            <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle class="text-sm font-medium">
                    {{ $t('foundation.common.fields.type') }}
                  </CardTitle>
                  <Icon name="lucide:table" class="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div class="text-2xl font-bold">{{ tableCount }}</div>
                  <p class="text-xs text-muted-foreground">
                    {{ $t('foundation.common.fields.count') }}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle class="text-sm font-medium">
                    {{ $t('foundation.common.general.users') }}
                  </CardTitle>
                  <Icon name="lucide:users" class="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div class="text-2xl font-bold">{{ memberCount }}</div>
                  <p class="text-xs text-muted-foreground">
                    {{ $t('foundation.common.fields.count') }}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle class="text-sm font-medium">
                    {{ $t('foundation.common.fields.file') }}
                  </CardTitle>
                  <Icon name="lucide:file-text" class="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div class="text-2xl font-bold">{{ documentCount }}</div>
                  <p class="text-xs text-muted-foreground">
                    {{ $t('foundation.common.fields.count') }}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle class="text-sm font-medium">
                    {{ $t('foundation.common.general.system') }}
                  </CardTitle>
                  <Icon name="lucide:hard-drive" class="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div class="text-2xl font-bold">{{ storageUsed }}</div>
                  <p class="text-xs text-muted-foreground">
                    {{ $t('foundation.common.fields.total') }}
                  </p>
                </CardContent>
              </Card>
            </div>

            <!-- Quick Actions -->
            <div class="mt-8">
              <h2 class="text-xl font-semibold mb-4">{{ $t('foundation.common.ui.actions') }}</h2>
              <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" class="h-auto p-4 justify-start" @click="createTable">
                  <Icon name="lucide:table-plus" class="mr-3 h-5 w-5" />
                  <div class="text-left">
                    <div class="font-semibold">{{ $t('foundation.actions.basic.create') }}</div>
                    <div class="text-sm text-muted-foreground">
                      {{ $t('foundation.common.fields.type') }}
                    </div>
                  </div>
                </Button>

                <Button variant="outline" class="h-auto p-4 justify-start" @click="inviteMember">
                  <Icon name="lucide:user-plus" class="mr-3 h-5 w-5" />
                  <div class="text-left">
                    <div class="font-semibold">{{ $t('foundation.actions.data.share') }}</div>
                    <div class="text-sm text-muted-foreground">
                      {{ $t('foundation.common.general.users') }}
                    </div>
                  </div>
                </Button>

                <Button variant="outline" class="h-auto p-4 justify-start" @click="createDocument">
                  <Icon name="lucide:file-plus" class="mr-3 h-5 w-5" />
                  <div class="text-left">
                    <div class="font-semibold">{{ $t('foundation.actions.basic.create') }}</div>
                    <div class="text-sm text-muted-foreground">
                      {{ $t('foundation.common.fields.file') }}
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </TabsContent>

          <!-- Tables Tab -->
          <TabsContent value="tables" class="mt-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-semibold">{{ $t('foundation.common.fields.type') }}</h2>
              <Button @click="createTable">
                <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
                {{ $t('foundation.actions.basic.create') }}
              </Button>
            </div>

            <!-- Tables will be loaded here -->
            <div class="text-center py-12 text-muted-foreground">
              {{ $t('foundation.messages.info.processing') }}
            </div>
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
            <div v-if="members.length > 0" class="space-y-4">
              <Card v-for="member in members" :key="member.id">
                <CardContent class="flex items-center justify-between py-4">
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
                  <div class="flex items-center gap-2">
                    <Badge variant="outline">{{ member.role }}</Badge>
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
                  </div>
                </CardContent>
              </Card>
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
import type { WorkspaceResponse, WorkspaceUpdateRequest, WorkspaceMember } from '~/modules/workspace/types'

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

// State
const workspace = ref<WorkspaceResponse | null>(null)
const members = ref<WorkspaceMember[]>([])
const pending = ref(true)
const error = ref<Error | null>(null)
const activeTab = ref('overview')
const savingSettings = ref(false)

// Statistics (mock for now)
const tableCount = ref(5)
const memberCount = ref(2)
const documentCount = ref(12)
const storageUsed = ref('124 MB')

// Settings form
const settingsForm = reactive({
  name: '',
  description: '',
  icon: '',
  color: ''
})

// Load workspace data
const loadWorkspace = async () => {
  pending.value = true
  error.value = null
  
  try {
    workspace.value = await workspaceApi.getWorkspace(workspaceId.value)
    
    // Initialize settings form
    settingsForm.name = workspace.value.name
    settingsForm.description = workspace.value.description || ''
    settingsForm.icon = workspace.value.icon || '📁'
    settingsForm.color = workspace.value.color || '#3B82F6'
    
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
    settingsForm.name = workspace.value.name
    settingsForm.description = workspace.value.description || ''
    settingsForm.icon = workspace.value.icon || '📁'
    settingsForm.color = workspace.value.color || '#3B82F6'
  }
}

const saveSettings = async () => {
  savingSettings.value = true
  
  try {
    const data: WorkspaceUpdateRequest = {
      name: settingsForm.name,
      description: settingsForm.description,
      icon: settingsForm.icon,
      color: settingsForm.color
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