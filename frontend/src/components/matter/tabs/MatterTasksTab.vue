<template>
  <div class="matter-tasks-tab">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold">Tasks</h3>
        <p class="text-muted-foreground text-sm">
          Manage tasks and track progress for this matter
        </p>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- View Toggle -->
        <div class="view-toggle">
          <ToggleGroup 
            :value="currentView" 
            @update:value="handleViewChange"
            type="single"
            class="gap-0"
          >
            <ToggleGroupItem value="kanban" aria-label="Kanban view">
              <Layout class="w-4 h-4 mr-2" />
              Kanban
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <Table class="w-4 h-4 mr-2" />
              Table
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>
    </div>

    <!-- View Content -->
    <div class="tasks-content">
      <!-- Kanban View -->
      <div v-if="currentView === 'kanban'" class="kanban-view">
        <Card>
          <CardContent class="p-8 text-center">
            <Layout class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h4 class="text-lg font-medium mb-2">Kanban Board</h4>
            <p class="text-muted-foreground mb-4">
              Visual task management with drag-and-drop functionality will be implemented here.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div class="kanban-column p-4 bg-muted/50 rounded-lg">
                <h5 class="font-medium mb-3">To Do</h5>
                <div class="space-y-2">
                  <div class="task-card p-3 bg-background rounded border">
                    <p class="text-sm font-medium">Review contract terms</p>
                    <p class="text-xs text-muted-foreground mt-1">Due: Tomorrow</p>
                  </div>
                  <div class="task-card p-3 bg-background rounded border">
                    <p class="text-sm font-medium">Client meeting prep</p>
                    <p class="text-xs text-muted-foreground mt-1">Due: Next week</p>
                  </div>
                </div>
              </div>
              <div class="kanban-column p-4 bg-muted/50 rounded-lg">
                <h5 class="font-medium mb-3">In Progress</h5>
                <div class="space-y-2">
                  <div class="task-card p-3 bg-background rounded border">
                    <p class="text-sm font-medium">Document analysis</p>
                    <p class="text-xs text-muted-foreground mt-1">Started: 2 days ago</p>
                  </div>
                </div>
              </div>
              <div class="kanban-column p-4 bg-muted/50 rounded-lg">
                <h5 class="font-medium mb-3">Done</h5>
                <div class="space-y-2">
                  <div class="task-card p-3 bg-background rounded border opacity-75">
                    <p class="text-sm font-medium">Initial research</p>
                    <p class="text-xs text-muted-foreground mt-1">Completed yesterday</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Table View -->
      <div v-else-if="currentView === 'table'" class="table-view">
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-lg font-medium">Task List</h4>
              <div class="flex items-center gap-2">
                <Input placeholder="Search tasks..." class="w-64" />
                <Button variant="outline" size="sm">
                  <Filter class="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
            
            <div class="border rounded-lg">
              <div class="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
                <div class="col-span-4">Task</div>
                <div class="col-span-2">Status</div>
                <div class="col-span-2">Assignee</div>
                <div class="col-span-2">Due Date</div>
                <div class="col-span-2">Priority</div>
              </div>
              
              <div class="divide-y">
                <div class="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30">
                  <div class="col-span-4">
                    <p class="font-medium">Review contract terms</p>
                    <p class="text-xs text-muted-foreground">Analyze client agreement</p>
                  </div>
                  <div class="col-span-2">
                    <Badge variant="outline">To Do</Badge>
                  </div>
                  <div class="col-span-2">
                    <p class="text-sm">Yamada Taro</p>
                  </div>
                  <div class="col-span-2">
                    <p class="text-sm">Tomorrow</p>
                  </div>
                  <div class="col-span-2">
                    <Badge variant="destructive">High</Badge>
                  </div>
                </div>
                
                <div class="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30">
                  <div class="col-span-4">
                    <p class="font-medium">Document analysis</p>
                    <p class="text-xs text-muted-foreground">Review submitted documents</p>
                  </div>
                  <div class="col-span-2">
                    <Badge variant="default">In Progress</Badge>
                  </div>
                  <div class="col-span-2">
                    <p class="text-sm">Sato Hanako</p>
                  </div>
                  <div class="col-span-2">
                    <p class="text-sm">Next week</p>
                  </div>
                  <div class="col-span-2">
                    <Badge variant="outline">Medium</Badge>
                  </div>
                </div>
                
                <div class="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 opacity-75">
                  <div class="col-span-4">
                    <p class="font-medium">Initial research</p>
                    <p class="text-xs text-muted-foreground">Background investigation</p>
                  </div>
                  <div class="col-span-2">
                    <Badge variant="secondary">Done</Badge>
                  </div>
                  <div class="col-span-2">
                    <p class="text-sm">Yamada Taro</p>
                  </div>
                  <div class="col-span-2">
                    <p class="text-sm">Yesterday</p>
                  </div>
                  <div class="col-span-2">
                    <Badge variant="outline">Low</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus, CheckSquare, Layout, Table, Filter } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'

interface Props {
  matterId: string
}

const props = defineProps<Props>()

// Get matter detail store for sub-tab state
import { useMatterDetailStore } from '~/stores/matterDetail'

const matterDetailStore = useMatterDetailStore()

// Current view from store
const currentView = computed(() => matterDetailStore.subTabs.tasks)

// Handle view changes
const handleViewChange = (view: 'kanban' | 'table') => {
  if (view && view !== currentView.value) {
    matterDetailStore.setSubTabView('tasks', view)
  }
}
</script>