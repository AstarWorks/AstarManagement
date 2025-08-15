<template>
  <div class="expense-detail-skeleton">
    <!-- Header skeleton -->
    <div class="mb-6">
      <!-- Breadcrumb skeleton -->
      <div class="flex items-center gap-2 mb-4">
        <Skeleton class="h-4 w-20" />
        <Skeleton class="h-4 w-4" />
        <Skeleton class="h-4 w-32" />
      </div>
      
      <!-- Title and actions skeleton -->
      <div class="flex justify-between items-center">
        <Skeleton class="h-8 w-48" />
        <div class="flex gap-2">
          <Skeleton class="h-10 w-24" />
          <Skeleton class="h-10 w-24" />
          <Skeleton class="h-10 w-24" />
        </div>
      </div>
    </div>
    
    <!-- Content skeleton -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main content skeleton -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Basic info card skeleton -->
        <Card>
          <CardHeader>
            <Skeleton class="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Field skeletons -->
              <div v-for="i in 6" :key="`field-${i}`">
                <Skeleton class="h-4 w-20 mb-2" />
                <Skeleton class="h-6 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Case info card skeleton -->
        <Card>
          <CardHeader>
            <Skeleton class="h-6 w-28" />
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div>
                <Skeleton class="h-4 w-16 mb-2" />
                <Skeleton class="h-6 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Memo card skeleton -->
        <Card>
          <CardHeader>
            <Skeleton class="h-6 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton class="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
      
      <!-- Sidebar skeleton -->
      <div class="space-y-6">
        <!-- Tags card skeleton -->
        <Card>
          <CardHeader>
            <Skeleton class="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <div class="flex flex-wrap gap-2">
              <Skeleton v-for="i in 3" :key="`tag-${i}`" class="h-6 w-16 rounded-full" />
            </div>
          </CardContent>
        </Card>
        
        <!-- Attachments card skeleton -->
        <Card>
          <CardHeader>
            <div class="flex justify-between items-center">
              <Skeleton class="h-6 w-28" />
              <Skeleton class="h-4 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div v-for="i in 2" :key="`attachment-${i}`" class="flex items-center justify-between p-3 border rounded-lg">
                <div class="flex items-center gap-3">
                  <Skeleton class="h-5 w-5" />
                  <div>
                    <Skeleton class="h-5 w-32 mb-1" />
                    <Skeleton class="h-4 w-16" />
                  </div>
                </div>
                <Skeleton class="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Audit info card skeleton -->
        <Card>
          <CardHeader>
            <Skeleton class="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div v-for="i in 4" :key="`audit-${i}`" class="flex items-center gap-2">
                <Skeleton class="h-4 w-4" />
                <Skeleton class="h-4 w-16" />
                <Skeleton class="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@ui/card'
import { Skeleton } from '@ui/skeleton'
</script>

<style scoped>
.expense-detail-skeleton {
  @apply container mx-auto px-4 py-6 max-w-7xl;
}
</style>