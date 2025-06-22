<template>
  <div class="container mx-auto space-y-8 p-8">
    <h1 class="text-4xl font-bold">Additional UI Components Test</h1>

    <!-- Avatar Section -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Avatar Component</h2>
      
      <div class="space-y-4">
        <div class="flex items-center space-x-4">
          <Avatar 
            src="https://github.com/shadcn.png" 
            alt="shadcn"
            size="xs"
          />
          <Avatar 
            src="https://github.com/shadcn.png" 
            alt="shadcn"
            size="sm"
          />
          <Avatar 
            src="https://github.com/shadcn.png" 
            alt="shadcn"
          />
          <Avatar 
            src="https://github.com/shadcn.png" 
            alt="shadcn"
            size="lg"
          />
          <Avatar 
            src="https://github.com/shadcn.png" 
            alt="shadcn"
            size="xl"
          />
          <Avatar 
            src="https://github.com/shadcn.png" 
            alt="shadcn"
            size="2xl"
          />
        </div>

        <div class="flex items-center space-x-4">
          <Avatar 
            alt="John Doe"
            fallback="JD"
          />
          <Avatar 
            alt="Jane Smith"
          />
          <Avatar 
            src="invalid-url.jpg"
            alt="Error Example"
          />
          <Avatar />
        </div>
      </div>
    </section>

    <Separator />

    <!-- Skeleton Section -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Skeleton Component</h2>
      
      <div class="space-y-4">
        <div class="space-y-2">
          <Skeleton shape="text" />
          <Skeleton shape="text" class="w-3/4" />
          <Skeleton shape="text" class="w-1/2" />
        </div>

        <div class="flex items-center space-x-4">
          <Skeleton shape="circle" class="h-12 w-12" />
          <div class="space-y-2 flex-1">
            <Skeleton shape="text" class="w-1/4" />
            <Skeleton shape="text" />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <Skeleton class="h-32" />
          <Skeleton class="h-32" />
          <Skeleton class="h-32" />
        </div>
      </div>
    </section>

    <Separator />

    <!-- ScrollArea Section -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">ScrollArea Component</h2>
      
      <ScrollArea class="h-[200px] w-full rounded-md border p-4">
        <div class="space-y-4">
          <p v-for="i in 10" :key="i" class="text-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do 
            eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
          </p>
        </div>
      </ScrollArea>

      <div class="grid grid-cols-2 gap-4">
        <ScrollArea class="h-[150px] rounded-md border p-4">
          <div class="w-[300px]">
            <p class="whitespace-nowrap">
              This is a very long line of text that extends beyond the visible area and requires horizontal scrolling to read completely.
            </p>
          </div>
        </ScrollArea>

        <ScrollArea class="h-[150px] rounded-md border p-4">
          <div class="space-y-2">
            <div v-for="i in 20" :key="i" class="flex items-center space-x-2">
              <Skeleton shape="circle" class="h-8 w-8" />
              <Skeleton shape="text" class="flex-1" />
            </div>
          </div>
        </ScrollArea>
      </div>
    </section>

    <Separator />

    <!-- Form Components Section -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Form Components</h2>
      
      <form class="space-y-6 max-w-md">
        <FormField name="username" :required="true">
          <FormItem>
            <FormLabel>Username</FormLabel>
            <FormControl>
              <Input 
                v-model="formData.username" 
                placeholder="Enter your username"
              />
            </FormControl>
            <FormDescription>
              This is your public display name.
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="email" :required="true" :error="emailError">
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input 
                v-model="formData.email" 
                type="email"
                placeholder="email@example.com"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="bio">
          <FormItem>
            <FormLabel>Bio</FormLabel>
            <FormControl>
              <Textarea 
                v-model="formData.bio" 
                placeholder="Tell us about yourself"
                :rows="3"
              />
            </FormControl>
            <FormDescription>
              Write a short bio. Max 500 characters.
            </FormDescription>
          </FormItem>
        </FormField>

        <FormField name="notifications" :required="true">
          <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
            <div class="space-y-0.5">
              <FormLabel>Email Notifications</FormLabel>
              <FormDescription>
                Receive emails about your account activity.
              </FormDescription>
            </div>
            <FormControl>
              <Switch v-model="formData.notifications" />
            </FormControl>
          </FormItem>
        </FormField>

        <Button type="submit" @click.prevent="handleSubmit">
          Submit
        </Button>
      </form>
    </section>

    <!-- Separator Variants -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Separator Variants</h2>
      
      <div class="space-y-4">
        <div>
          <p>Horizontal separator (default):</p>
          <Separator class="my-4" />
        </div>

        <div class="flex h-20 items-center space-x-4 text-sm">
          <div>Item 1</div>
          <Separator orientation="vertical" />
          <div>Item 2</div>
          <Separator orientation="vertical" />
          <div>Item 3</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Avatar } from '~/components/ui/avatar'
import { Skeleton } from '~/components/ui/skeleton'
import { Separator } from '~/components/ui/separator'
import { ScrollArea } from '~/components/ui/scroll-area'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Switch } from '~/components/ui/switch'
import { Button } from '~/components/ui/button'

const formData = ref({
  username: '',
  email: '',
  bio: '',
  notifications: false
})

const emailError = ref('')

const handleSubmit = () => {
  // Simple validation example
  if (!formData.value.email.includes('@')) {
    emailError.value = 'Please enter a valid email address'
  } else {
    emailError.value = ''
    console.log('Form submitted:', formData.value)
  }
}
</script>