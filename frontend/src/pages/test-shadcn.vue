<template>
  <div class="p-8 space-y-8">
    <h1 class="text-3xl font-bold">Shadcn-vue Test Page</h1>
    
    <!-- Theme Toggle Test -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Theme Toggle</h2>
      <div class="flex items-center gap-4">
        <Button @click="toggleTheme">
          Toggle Theme (Current: {{ resolvedTheme }})
        </Button>
        <Badge :variant="isDark ? 'secondary' : 'default'">
          {{ isDark ? 'Dark Mode' : 'Light Mode' }}
        </Badge>
      </div>
    </div>

    <!-- Component Tests -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Components</h2>
      
      <!-- Buttons -->
      <div class="flex gap-2 flex-wrap">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>

      <!-- Badges -->
      <div class="flex gap-2 flex-wrap">
        <Badge>Default Badge</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>

      <!-- Card -->
      <Card class="p-6 max-w-md">
        <CardHeader>
          <h3 class="text-lg font-semibold">Card Title</h3>
        </CardHeader>
        <CardContent>
          <p>This is a test card using shadcn-vue components.</p>
        </CardContent>
      </Card>

      <!-- Input -->
      <div class="max-w-md space-y-2">
        <Input placeholder="Test input field" v-model="testInput" />
        <p class="text-sm text-muted-foreground">Input value: {{ testInput }}</p>
      </div>
    </div>

    <!-- Mobile Detection Test -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Mobile Detection</h2>
      <Badge :variant="isMobile ? 'destructive' : 'default'">
        {{ isMobile ? 'Mobile Device' : 'Desktop Device' }}
      </Badge>
    </div>

    <!-- Date Utilities Test -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Date Utilities</h2>
      <div class="space-y-2">
        <p>Current date: {{ formatDate(new Date()) }}</p>
        <p>Relative date: {{ formatRelativeDate(new Date()) }}</p>
        <p>Due soon test: {{ isDueSoon(addDays(new Date(), 2)) ? 'Yes' : 'No' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { addDays } from 'date-fns'
import { formatDate, formatRelativeDate, isDueSoon } from '~/lib/date'

definePageMeta({
  title: 'Shadcn-vue Test Page',
  layout: 'default'
})

// Theme testing
const { isDark, resolvedTheme, toggleTheme } = useTheme()

// Mobile detection testing
const { isMobile } = useIsMobileVueUse()

// Input testing
const testInput = ref('')
</script>