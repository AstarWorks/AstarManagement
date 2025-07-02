<template>
  <div class="matter-schedule-tab">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold">Schedule</h3>
        <p class="text-muted-foreground text-sm">
          View and manage deadlines, appointments, and important dates
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
            <ToggleGroupItem value="list" aria-label="List view">
              <List class="w-4 h-4 mr-2" />
              List
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Calendar view">
              <Calendar class="w-4 h-4 mr-2" />
              Calendar
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>
    </div>

    <!-- View Content -->
    <div class="schedule-content">
      <!-- List View -->
      <div v-if="currentView === 'list'" class="list-view">
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-lg font-medium">Upcoming Events</h4>
              <div class="flex items-center gap-2">
                <Input placeholder="Search events..." class="w-64" />
                <Button variant="outline" size="sm">
                  <Filter class="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
            
            <div class="space-y-4">
              <!-- Today's Events -->
              <div class="event-group">
                <h5 class="font-medium text-sm text-muted-foreground mb-3 flex items-center">
                  <Clock class="w-4 h-4 mr-2" />
                  Today
                </h5>
                <div class="space-y-2">
                  <div class="event-item p-4 border rounded-lg hover:bg-muted/30">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <h6 class="font-medium">Client Meeting</h6>
                        <p class="text-sm text-muted-foreground">Review case progress with John Doe</p>
                        <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span class="flex items-center">
                            <Clock class="w-3 h-3 mr-1" />
                            2:00 PM - 3:00 PM
                          </span>
                          <span class="flex items-center">
                            <MapPin class="w-3 h-3 mr-1" />
                            Conference Room A
                          </span>
                        </div>
                      </div>
                      <Badge variant="default">Meeting</Badge>
                    </div>
                  </div>
                  
                  <div class="event-item p-4 border rounded-lg hover:bg-muted/30">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <h6 class="font-medium text-destructive">Document Filing Deadline</h6>
                        <p class="text-sm text-muted-foreground">Submit motion to court</p>
                        <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span class="flex items-center">
                            <Clock class="w-3 h-3 mr-1" />
                            5:00 PM
                          </span>
                          <span class="flex items-center">
                            <AlertTriangle class="w-3 h-3 mr-1" />
                            Critical
                          </span>
                        </div>
                      </div>
                      <Badge variant="destructive">Deadline</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Tomorrow's Events -->
              <div class="event-group">
                <h5 class="font-medium text-sm text-muted-foreground mb-3 flex items-center">
                  <Calendar class="w-4 h-4 mr-2" />
                  Tomorrow
                </h5>
                <div class="space-y-2">
                  <div class="event-item p-4 border rounded-lg hover:bg-muted/30">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <h6 class="font-medium">Court Hearing</h6>
                        <p class="text-sm text-muted-foreground">Preliminary hearing for case #2024-001</p>
                        <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span class="flex items-center">
                            <Clock class="w-3 h-3 mr-1" />
                            10:00 AM - 12:00 PM
                          </span>
                          <span class="flex items-center">
                            <MapPin class="w-3 h-3 mr-1" />
                            Tokyo District Court
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline">Court</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- This Week -->
              <div class="event-group">
                <h5 class="font-medium text-sm text-muted-foreground mb-3 flex items-center">
                  <Calendar class="w-4 h-4 mr-2" />
                  This Week
                </h5>
                <div class="space-y-2">
                  <div class="event-item p-4 border rounded-lg hover:bg-muted/30">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <h6 class="font-medium">Team Review</h6>
                        <p class="text-sm text-muted-foreground">Weekly case review meeting</p>
                        <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span class="flex items-center">
                            <Clock class="w-3 h-3 mr-1" />
                            Friday, 3:00 PM
                          </span>
                          <span class="flex items-center">
                            <Users class="w-3 h-3 mr-1" />
                            Internal
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary">Review</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Calendar View -->
      <div v-else-if="currentView === 'calendar'" class="calendar-view">
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h4 class="text-lg font-medium">January 2025</h4>
              <div class="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <ChevronLeft class="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  Today
                </Button>
                <Button variant="outline" size="sm">
                  <ChevronRight class="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <!-- Calendar Grid -->
            <div class="calendar-grid">
              <!-- Days of week header -->
              <div class="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden mb-4">
                <div v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" 
                     :key="day" 
                     class="p-2 text-center text-sm font-medium bg-muted">
                  {{ day }}
                </div>
              </div>
              
              <!-- Calendar days -->
              <div class="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                <!-- Sample calendar days with events -->
                <div v-for="day in 35" :key="day" class="bg-background min-h-24 p-2">
                  <div class="text-sm" :class="{
                    'text-muted-foreground': day < 6 || day > 31,
                    'font-medium': day >= 6 && day <= 31,
                    'bg-primary text-primary-foreground rounded px-2 py-1': day === 15
                  }">
                    {{ day < 6 ? day + 26 : day > 31 ? day - 31 : day - 5 }}
                  </div>
                  
                  <!-- Sample events on specific days -->
                  <div v-if="day === 15" class="mt-1 space-y-1">
                    <div class="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate">
                      Client Meeting
                    </div>
                    <div class="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded truncate">
                      Deadline
                    </div>
                  </div>
                  
                  <div v-if="day === 16" class="mt-1">
                    <div class="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded truncate">
                      Court Hearing
                    </div>
                  </div>
                  
                  <div v-if="day === 20" class="mt-1">
                    <div class="text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded truncate">
                      Team Review
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Calendar Legend -->
            <div class="flex items-center gap-6 mt-6 text-sm">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Meetings</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-red-500 rounded"></div>
                <span>Deadlines</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-green-500 rounded"></div>
                <span>Court Events</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-purple-500 rounded"></div>
                <span>Reviews</span>
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
import { 
  Plus, 
  Calendar, 
  List, 
  Filter, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
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
const matterDetailStore = useMatterDetailStore()

// Current view from store
const currentView = computed(() => matterDetailStore.subTabs.schedule)

// Handle view changes
const handleViewChange = (view: 'list' | 'calendar') => {
  if (view && view !== currentView.value) {
    matterDetailStore.setSubTabView('schedule', view)
  }
}
</script>