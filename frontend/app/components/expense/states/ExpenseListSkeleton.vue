<script setup lang="ts">
import LoadingSkeleton from '~/components/common/states/LoadingSkeleton.vue'

interface ExpenseListSkeletonProps {
  count?: number
  variant?: 'list' | 'card' | 'table'
  compact?: boolean
}

const _props = withDefaults(defineProps<ExpenseListSkeletonProps>(), {
  count: 5,
  variant: 'list',
  compact: false
})
</script>

<template>
  <div class="space-y-4">
    <!-- List variant -->
    <div v-if="variant === 'list'" class="space-y-3">
      <div 
        v-for="i in count" 
        :key="i" 
        class="expense-list-skeleton p-4 border rounded-lg"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1 space-y-2">
            <!-- Title and amount -->
            <div class="flex items-center justify-between">
              <LoadingSkeleton 
                variant="text" 
                width="40%" 
                height="20px"
                class="rounded-sm"
              />
              <LoadingSkeleton 
                variant="text" 
                width="80px" 
                height="20px"
                class="rounded-sm"
              />
            </div>
            
            <!-- Description -->
            <LoadingSkeleton 
              variant="text" 
              width="75%" 
              height="16px"
              class="rounded-sm"
            />
            
            <!-- Metadata row -->
            <div class="flex items-center gap-4 mt-2">
              <LoadingSkeleton 
                variant="text" 
                width="60px" 
                height="14px"
                class="rounded-sm"
              />
              <LoadingSkeleton 
                variant="text" 
                width="80px" 
                height="14px"
                class="rounded-sm"
              />
              <LoadingSkeleton 
                variant="rounded" 
                width="50px" 
                height="20px"
              />
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex items-center gap-2 ml-4">
            <LoadingSkeleton 
              variant="circular" 
              width="32px" 
              height="32px"
            />
            <LoadingSkeleton 
              variant="circular" 
              width="32px" 
              height="32px"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Card variant -->
    <div v-else-if="variant === 'card'" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div 
        v-for="i in count" 
        :key="i" 
        class="expense-card-skeleton p-6 border rounded-lg"
      >
        <div class="space-y-4">
          <!-- Header -->
          <div class="flex items-start justify-between">
            <LoadingSkeleton 
              variant="text" 
              width="70%" 
              height="20px"
            />
            <LoadingSkeleton 
              variant="circular" 
              width="24px" 
              height="24px"
            />
          </div>
          
          <!-- Amount -->
          <LoadingSkeleton 
            variant="text" 
            width="40%" 
            height="28px"
            class="rounded-md"
          />
          
          <!-- Description -->
          <div class="space-y-2">
            <LoadingSkeleton 
              variant="text" 
              width="100%" 
              height="14px"
            />
            <LoadingSkeleton 
              variant="text" 
              width="80%" 
              height="14px"
            />
          </div>
          
          <!-- Footer -->
          <div class="flex items-center justify-between pt-2">
            <LoadingSkeleton 
              variant="text" 
              width="60px" 
              height="12px"
            />
            <div class="flex gap-1">
              <LoadingSkeleton 
                variant="rounded" 
                width="40px" 
                height="16px"
              />
              <LoadingSkeleton 
                variant="rounded" 
                width="50px" 
                height="16px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Table variant -->
    <div v-else-if="variant === 'table'" class="space-y-2">
      <!-- Table header -->
      <div class="grid grid-cols-6 gap-4 p-4 border rounded-t-lg bg-muted/50">
        <LoadingSkeleton 
          v-for="i in 6" 
          :key="`header-${i}`"
          variant="text" 
          width="80%" 
          height="16px"
        />
      </div>
      
      <!-- Table rows -->
      <div 
        v-for="i in count" 
        :key="i" 
        class="grid grid-cols-6 gap-4 p-4 border-x border-b last:rounded-b-lg"
      >
        <LoadingSkeleton variant="text" width="90%" height="16px" />
        <LoadingSkeleton variant="text" width="70%" height="16px" />
        <LoadingSkeleton variant="text" width="80%" height="16px" />
        <LoadingSkeleton variant="text" width="60%" height="16px" />
        <LoadingSkeleton variant="rounded" width="50px" height="18px" />
        <div class="flex gap-2">
          <LoadingSkeleton variant="circular" width="24px" height="24px" />
          <LoadingSkeleton variant="circular" width="24px" height="24px" />
        </div>
      </div>
    </div>
  </div>
</template>