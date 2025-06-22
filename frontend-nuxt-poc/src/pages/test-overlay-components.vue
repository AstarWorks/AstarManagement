<template>
  <TooltipProvider>
    <div class="container mx-auto space-y-8 p-8">
      <h1 class="text-4xl font-bold">Overlay Components Test</h1>

      <!-- Sheet Component Section -->
      <section class="space-y-4">
        <h2 class="text-2xl font-semibold">Sheet Component</h2>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Right Sheet -->
          <Sheet v-model:open="rightSheetOpen">
            <SheetTrigger as-child>
              <Button>Open Right Sheet</Button>
            </SheetTrigger>
            <SheetContent side="right" size="md">
              <SheetHeader>
                <SheetTitle>Right Sheet</SheetTitle>
                <SheetDescription>
                  This sheet slides in from the right side. You can swipe right to dismiss it.
                </SheetDescription>
              </SheetHeader>
              
              <div class="py-4">
                <div class="space-y-4">
                  <div>
                    <Label for="name">Name</Label>
                    <Input id="name" placeholder="Enter your name" />
                  </div>
                  <div>
                    <Label for="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter your email" />
                  </div>
                  <div>
                    <Label for="message">Message</Label>
                    <Textarea id="message" placeholder="Enter your message" />
                  </div>
                </div>
              </div>
              
              <SheetFooter>
                <Button variant="outline" @click="rightSheetOpen = false">
                  Cancel
                </Button>
                <Button @click="rightSheetOpen = false">
                  Save Changes
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <!-- Left Sheet -->
          <Sheet v-model:open="leftSheetOpen">
            <SheetTrigger as-child>
              <Button variant="outline">Open Left Sheet</Button>
            </SheetTrigger>
            <SheetContent side="left" size="sm">
              <SheetHeader>
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>
                  Quick navigation links and actions.
                </SheetDescription>
              </SheetHeader>
              
              <div class="py-4">
                <nav class="space-y-2">
                  <a href="#" class="block px-2 py-1 rounded hover:bg-accent">Dashboard</a>
                  <a href="#" class="block px-2 py-1 rounded hover:bg-accent">Projects</a>
                  <a href="#" class="block px-2 py-1 rounded hover:bg-accent">Team</a>
                  <a href="#" class="block px-2 py-1 rounded hover:bg-accent">Settings</a>
                  <Separator class="my-2" />
                  <a href="#" class="block px-2 py-1 rounded hover:bg-accent">Help</a>
                  <a href="#" class="block px-2 py-1 rounded hover:bg-accent">Logout</a>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <!-- Top Sheet -->
          <Sheet v-model:open="topSheetOpen">
            <SheetTrigger as-child>
              <Button variant="secondary">Open Top Sheet</Button>
            </SheetTrigger>
            <SheetContent side="top" size="md">
              <SheetHeader>
                <SheetTitle>Notification Banner</SheetTitle>
                <SheetDescription>
                  Important system notifications and alerts.
                </SheetDescription>
              </SheetHeader>
              
              <div class="py-4">
                <div class="space-y-3">
                  <div class="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Info class="h-4 w-4 text-blue-500 mr-2" />
                    <span class="text-sm">System maintenance scheduled for tonight.</span>
                  </div>
                  <div class="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle class="h-4 w-4 text-green-500 mr-2" />
                    <span class="text-sm">Your data has been backed up successfully.</span>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <!-- Bottom Sheet -->
          <Sheet v-model:open="bottomSheetOpen">
            <SheetTrigger as-child>
              <Button variant="destructive">Open Bottom Sheet</Button>
            </SheetTrigger>
            <SheetContent side="bottom" size="lg">
              <SheetHeader>
                <SheetTitle>Mobile-style Bottom Sheet</SheetTitle>
                <SheetDescription>
                  This mimics mobile bottom sheet behavior. Swipe down to dismiss.
                </SheetDescription>
              </SheetHeader>
              
              <div class="py-4">
                <div class="grid grid-cols-3 gap-4">
                  <Button variant="outline" class="h-20 flex-col">
                    <Share class="h-6 w-6 mb-2" />
                    Share
                  </Button>
                  <Button variant="outline" class="h-20 flex-col">
                    <Copy class="h-6 w-6 mb-2" />
                    Copy
                  </Button>
                  <Button variant="outline" class="h-20 flex-col">
                    <Download class="h-6 w-6 mb-2" />
                    Download
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <!-- Sheet Sizes Demo -->
        <div class="flex gap-2 flex-wrap">
          <Sheet v-model:open="sheetSizes.sm">
            <SheetTrigger as-child>
              <Button size="sm">Small Sheet</Button>
            </SheetTrigger>
            <SheetContent side="right" size="sm">
              <SheetHeader>
                <SheetTitle>Small Sheet</SheetTitle>
                <SheetDescription>This is a small-sized sheet.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>

          <Sheet v-model:open="sheetSizes.lg">
            <SheetTrigger as-child>
              <Button size="sm">Large Sheet</Button>
            </SheetTrigger>
            <SheetContent side="right" size="lg">
              <SheetHeader>
                <SheetTitle>Large Sheet</SheetTitle>
                <SheetDescription>This is a large-sized sheet with more content space.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>

          <Sheet v-model:open="sheetSizes.full">
            <SheetTrigger as-child>
              <Button size="sm">Full Sheet</Button>
            </SheetTrigger>
            <SheetContent side="right" size="full">
              <SheetHeader>
                <SheetTitle>Full Sheet</SheetTitle>
                <SheetDescription>This sheet takes up the full viewport width.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </section>

      <Separator />

      <!-- Popover Component Section -->
      <section class="space-y-4">
        <h2 class="text-2xl font-semibold">Popover Component</h2>
        
        <div class="flex flex-wrap gap-4">
          <!-- Basic Popover -->
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent>
              <div class="space-y-2">
                <h4 class="font-medium leading-none">Dimensions</h4>
                <p class="text-sm text-muted-foreground">
                  Set the dimensions for the layer.
                </p>
                <div class="grid gap-2">
                  <div class="grid grid-cols-3 items-center gap-4">
                    <Label for="width">Width</Label>
                    <Input id="width" value="100%" class="col-span-2 h-8" />
                  </div>
                  <div class="grid grid-cols-3 items-center gap-4">
                    <Label for="height">Height</Label>
                    <Input id="height" value="25px" class="col-span-2 h-8" />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <!-- Popover with Arrow -->
          <Popover>
            <PopoverTrigger as-child>
              <Button>Popover with Arrow</Button>
            </PopoverTrigger>
            <PopoverContent :show-arrow="true">
              <div class="space-y-2">
                <h4 class="font-medium">Account Settings</h4>
                <p class="text-sm text-muted-foreground">
                  Manage your account preferences here.
                </p>
                <div class="flex justify-between">
                  <Button size="sm" variant="outline">Cancel</Button>
                  <Button size="sm">Save</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <!-- Different Placements -->
          <div class="flex gap-2">
            <Popover>
              <PopoverTrigger as-child>
                <Button variant="secondary" size="sm">Top</Button>
              </PopoverTrigger>
              <PopoverContent side="top">
                <p class="text-sm">This popover appears on top</p>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger as-child>
                <Button variant="secondary" size="sm">Bottom</Button>
              </PopoverTrigger>
              <PopoverContent side="bottom">
                <p class="text-sm">This popover appears on bottom</p>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger as-child>
                <Button variant="secondary" size="sm">Left</Button>
              </PopoverTrigger>
              <PopoverContent side="left">
                <p class="text-sm">This popover appears on left</p>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger as-child>
                <Button variant="secondary" size="sm">Right</Button>
              </PopoverTrigger>
              <PopoverContent side="right">
                <p class="text-sm">This popover appears on right</p>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </section>

      <Separator />

      <!-- Tooltip Component Section -->
      <section class="space-y-4">
        <h2 class="text-2xl font-semibold">Tooltip Component</h2>
        
        <div class="flex flex-wrap gap-4 items-center">
          <!-- Basic Tooltip -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is a helpful tooltip!</p>
            </TooltipContent>
          </Tooltip>

          <!-- Tooltip with Arrow -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button>Tooltip with Arrow</Button>
            </TooltipTrigger>
            <TooltipContent :show-arrow="true">
              <p>Tooltip with a pointing arrow</p>
            </TooltipContent>
          </Tooltip>

          <!-- Different Sides -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="secondary" size="sm">Top Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Appears on top</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="secondary" size="sm">Right Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Appears on right</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="secondary" size="sm">Bottom Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Appears on bottom</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="secondary" size="sm">Left Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Appears on left</p>
            </TooltipContent>
          </Tooltip>

          <!-- Long Content Tooltip -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost">Long Content</Button>
            </TooltipTrigger>
            <TooltipContent class="max-w-xs">
              <p>This is a tooltip with longer content that wraps to multiple lines. It demonstrates how tooltips handle longer text content gracefully.</p>
            </TooltipContent>
          </Tooltip>

          <!-- Disabled Button with Tooltip -->
          <Tooltip>
            <TooltipTrigger as-child>
              <span tabindex="0">
                <Button disabled>Disabled Button</Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>This button is disabled because you need to complete the previous step first.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <!-- Icon Tooltips -->
        <div class="flex gap-4 items-center">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon">
                <Info class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>More information</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon">
                <Settings class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open settings</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon">
                <HelpCircle class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Get help and support</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </section>

      <Separator />

      <!-- Advanced Examples -->
      <section class="space-y-4">
        <h2 class="text-2xl font-semibold">Advanced Examples</h2>
        
        <!-- Nested Overlays -->
        <div class="space-y-2">
          <h3 class="text-lg font-medium">Nested Overlays</h3>
          <Sheet v-model:open="nestedSheetOpen">
            <SheetTrigger as-child>
              <Button>Sheet with Nested Popover</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Sheet with Nested Content</SheetTitle>
                <SheetDescription>
                  This sheet contains a popover inside it.
                </SheetDescription>
              </SheetHeader>
              
              <div class="py-4 space-y-4">
                <p>This demonstrates proper z-index stacking.</p>
                
                <Popover>
                  <PopoverTrigger as-child>
                    <Button variant="outline">Open Popover in Sheet</Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div class="space-y-2">
                      <h4 class="font-medium">Nested Popover</h4>
                      <p class="text-sm text-muted-foreground">
                        This popover appears inside the sheet.
                      </p>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <Button size="sm">Tooltip too!</Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Even tooltips work inside nested overlays</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </section>

      <!-- State Display -->
      <section class="space-y-4">
        <h2 class="text-2xl font-semibold">Component State</h2>
        <div class="p-4 bg-muted rounded-lg">
          <pre class="text-sm">{{ JSON.stringify({
            rightSheetOpen,
            leftSheetOpen,
            topSheetOpen,
            bottomSheetOpen,
            nestedSheetOpen,
            sheetSizes
          }, null, 2) }}</pre>
        </div>
      </section>
    </div>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger
} from '~/components/ui/sheet'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '~/components/ui/popover'
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '~/components/ui/tooltip'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Separator } from '~/components/ui/separator'
import { 
  Info, 
  CheckCircle, 
  Share, 
  Copy, 
  Download, 
  Settings, 
  HelpCircle 
} from 'lucide-vue-next'

// Sheet states
const rightSheetOpen = ref(false)
const leftSheetOpen = ref(false)
const topSheetOpen = ref(false)
const bottomSheetOpen = ref(false)
const nestedSheetOpen = ref(false)

const sheetSizes = ref({
  sm: false,
  lg: false,
  full: false
})
</script>