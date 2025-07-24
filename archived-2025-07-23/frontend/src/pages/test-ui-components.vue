<template>
  <div class="container mx-auto p-8 space-y-8">
    <h1 class="text-3xl font-bold mb-8">Basic UI Components Test Page</h1>

    <!-- Button Component Tests -->
    <section>
      <h2 class="text-2xl font-semibold mb-4">Button Component</h2>
      
      <div class="space-y-4">
        <div>
          <h3 class="text-lg font-medium mb-2">Variants</h3>
          <div class="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-2">Sizes</h3>
          <div class="flex items-center gap-2">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <Plus class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-2">States</h3>
          <div class="flex gap-2">
            <Button disabled>Disabled</Button>
            <Button loading>Loading</Button>
            <Button variant="outline" loading>Loading Outline</Button>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-2">With Icons</h3>
          <div class="flex gap-2">
            <Button>
              <Mail class="mr-2 h-4 w-4" />
              Login with Email
            </Button>
            <Button variant="outline">
              <Github class="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Badge Component Tests -->
    <section>
      <h2 class="text-2xl font-semibold mb-4">Badge Component</h2>
      
      <div class="space-y-4">
        <div>
          <h3 class="text-lg font-medium mb-2">Variants</h3>
          <div class="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-2">With Icons</h3>
          <div class="flex flex-wrap gap-2">
            <Badge :icon="CheckCircle2" variant="default">Success</Badge>
            <Badge :icon="AlertCircle" variant="destructive">Error</Badge>
            <Badge :icon="Info" variant="secondary">Info</Badge>
            <Badge :icon="Clock" variant="outline">Pending</Badge>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-2">Text Truncation</h3>
          <div class="flex flex-wrap gap-2">
            <Badge truncate class="max-w-[100px]">This is a very long badge text that should be truncated</Badge>
            <Badge truncate :icon="FileText" class="max-w-[150px]">Long document name that gets truncated</Badge>
          </div>
        </div>
      </div>
    </section>

    <!-- Card Component Tests -->
    <section>
      <h2 class="text-2xl font-semibold mb-4">Card Component</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Basic Card</CardTitle>
            <CardDescription>This is a basic card example with all components</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here. This is where you can add any content you want.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" class="mr-2">Cancel</Button>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>

        <Card interactive>
          <CardHeader>
            <CardTitle>Interactive Card</CardTitle>
            <CardDescription>This card has hover and focus states</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Hover over this card to see the shadow effect. Click inside to see the focus ring.</p>
            <div class="mt-4 flex gap-2">
              <Badge variant="secondary">Interactive</Badge>
              <Badge variant="outline">Focusable</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle>Card with Actions</CardTitle>
              <Button size="icon" variant="ghost">
                <MoreVertical class="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Example with header actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <Users class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm">Team: Engineering</span>
              </div>
              <div class="flex items-center gap-2">
                <Calendar class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm">Due: Tomorrow</span>
              </div>
            </div>
          </CardContent>
          <CardFooter class="justify-between">
            <Badge variant="outline">In Progress</Badge>
            <Button size="sm">View Details</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase class="h-6 w-6 text-primary" />
              </div>
              <div class="flex-1">
                <CardTitle class="text-lg">Statistics Card</CardTitle>
                <p class="text-2xl font-bold">1,234</p>
                <p class="text-sm text-muted-foreground">Active cases this month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- Dark Mode Toggle -->
    <section>
      <h2 class="text-2xl font-semibold mb-4">Theme Testing</h2>
      <div class="flex items-center gap-4">
        <Button @click="toggleTheme" variant="outline">
          <Sun v-if="!isDark" class="mr-2 h-4 w-4" />
          <Moon v-else class="mr-2 h-4 w-4" />
          Toggle Theme
        </Button>
        <Badge>Current: {{ isDark ? 'Dark' : 'Light' }} Mode</Badge>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { 
  Plus, Mail, Github, CheckCircle2, AlertCircle, Info, Clock, 
  FileText, MoreVertical, Users, Calendar, Briefcase, Sun, Moon 
} from 'lucide-vue-next'

const { isDark, toggleTheme } = useTheme()
</script>