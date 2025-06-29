<template>
  <CommunicationLayout>
    <div class="communications-overview">
      <div class="welcome-section">
        <h2 class="text-2xl font-bold text-foreground mb-4">
          Communications Hub
        </h2>
        <p class="text-muted-foreground mb-6">
          Manage all your legal communications in one place. Access client memos, internal notes, 
          email correspondence, messages, and phone call logs.
        </p>
      </div>
      
      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div 
          v-for="stat in communicationStats"
          :key="stat.type"
          class="stat-card"
          @click="() => navigateTo(`/communications/${stat.type}`)"
        >
          <div class="stat-content">
            <component :is="stat.icon" class="stat-icon" />
            <div class="stat-details">
              <h3 class="stat-title">{{ stat.title }}</h3>
              <p class="stat-count">{{ stat.count }}</p>
              <p class="stat-description">{{ stat.description }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Activity -->
      <div class="recent-activity">
        <h3 class="text-lg font-semibold mb-4">Recent Activity</h3>
        <div class="activity-list">
          <div 
            v-for="activity in recentActivity"
            :key="activity.id"
            class="activity-item"
          >
            <div class="activity-icon">
              <component :is="activity.icon" class="size-4" />
            </div>
            <div class="activity-content">
              <p class="activity-title">{{ activity.title }}</p>
              <p class="activity-meta">{{ activity.type }} • {{ activity.time }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </CommunicationLayout>
</template>

<script setup lang="ts">
import { 
  MessageSquare,
  StickyNote,
  Mail,
  MessageCircle,
  Phone
} from 'lucide-vue-next'
import { CommunicationLayout } from '~/components/communication'

// Define the page meta
definePageMeta({
  title: 'Communications',
  description: 'Legal communications management hub'
})

// Communication statistics (mock data)
const communicationStats = [
  {
    type: 'memos',
    title: 'Client Memos',
    count: 12,
    description: 'Active memos',
    icon: MessageSquare
  },
  {
    type: 'notes',
    title: 'Internal Notes',
    count: 5,
    description: 'Team notes',
    icon: StickyNote
  },
  {
    type: 'emails',
    title: 'Emails',
    count: 23,
    description: 'Unread emails',
    icon: Mail
  },
  {
    type: 'messages',
    title: 'Messages',
    count: 8,
    description: 'New messages',
    icon: MessageCircle
  },
  {
    type: 'calls',
    title: 'Phone Calls',
    count: 3,
    description: 'Recent calls',
    icon: Phone
  }
]

// Recent activity (mock data)
const recentActivity = [
  {
    id: 1,
    title: 'New memo from John Doe regarding Contract Review',
    type: 'Client Memo',
    time: '2 hours ago',
    icon: MessageSquare
  },
  {
    id: 2,
    title: 'Email received from legal@company.com',
    type: 'Email',
    time: '4 hours ago',
    icon: Mail
  },
  {
    id: 3,
    title: 'Internal note added to Case #2024-001',
    type: 'Internal Note',
    time: '6 hours ago',
    icon: StickyNote
  },
  {
    id: 4,
    title: 'Phone call with client - Settlement discussion',
    type: 'Phone Call',
    time: '1 day ago',
    icon: Phone
  }
]
</script>

<style scoped>
.communications-overview {
  @apply max-w-6xl mx-auto;
}

.welcome-section {
  @apply mb-8;
}

.stat-card {
  @apply bg-card border border-border rounded-lg p-4 cursor-pointer transition-all;
  @apply hover:shadow-md hover:border-primary/50;
}

.stat-content {
  @apply flex items-start gap-3;
}

.stat-icon {
  @apply size-8 text-primary flex-shrink-0 mt-1;
}

.stat-details {
  @apply flex-1;
}

.stat-title {
  @apply font-medium text-foreground text-sm;
}

.stat-count {
  @apply text-2xl font-bold text-foreground mt-1;
}

.stat-description {
  @apply text-xs text-muted-foreground mt-1;
}

.recent-activity {
  @apply bg-card border border-border rounded-lg p-6;
}

.activity-list {
  @apply space-y-4;
}

.activity-item {
  @apply flex items-start gap-3 p-3 rounded-md hover:bg-accent/50 transition-colors;
}

.activity-icon {
  @apply size-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0;
}

.activity-content {
  @apply flex-1;
}

.activity-title {
  @apply text-sm font-medium text-foreground;
}

.activity-meta {
  @apply text-xs text-muted-foreground mt-1;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .stat-card {
    @apply p-3;
  }
  
  .stat-content {
    @apply gap-2;
  }
  
  .stat-icon {
    @apply size-6;
  }
  
  .stat-count {
    @apply text-xl;
  }
}
</style>