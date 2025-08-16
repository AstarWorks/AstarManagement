<template>
  <div class="expense-detail-header">
    <!-- Breadcrumb -->
    <Breadcrumb class="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink :as="NuxtLink" to="/expenses">
            {{ t('expense.navigation.title') }}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            {{ expense.description }}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
    
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 class="text-2xl font-bold">{{ t('expense.form.title.view') }}</h1>
      
      <!-- Desktop actions -->
      <div class="hidden md:flex items-center gap-2">
        <!-- Back button -->
        <Button variant="outline" @click="$emit('back')">
          <Icon name="lucide:arrow-left" class="w-4 h-4 mr-2" />
          {{ t('common.back') }}
        </Button>
        
        <!-- More actions dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="icon">
              <Icon name="lucide:more-horizontal" class="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="$emit('print')">
              <Icon name="lucide:printer" class="w-4 h-4 mr-2" />
              {{ t('expense.actions.print') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="$emit('copy')">
              <Icon name="lucide:copy" class="w-4 h-4 mr-2" />
              {{ t('expense.actions.copy') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <!-- Primary actions -->
        <Button variant="default" @click="$emit('edit')">
          <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
          {{ t('expense.actions.edit') }}
        </Button>
        
        <Button 
          variant="destructive" 
          :disabled="deleting"
          @click="$emit('delete')"
        >
          <Icon v-if="deleting" name="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
          <Icon v-else name="lucide:trash-2" class="w-4 h-4 mr-2" />
          {{ t('expense.actions.delete') }}
        </Button>
      </div>
    </div>
    
    <!-- Mobile floating action buttons -->
    <div class="md:hidden fixed bottom-4 right-4 z-10 flex flex-col gap-2">
      <!-- Main action button -->
      <Button 
        size="icon"
        class="rounded-full w-14 h-14 shadow-lg"
        @click="showMobileMenu = !showMobileMenu"
      >
        <Icon name="lucide:more-horizontal" class="w-6 h-6" />
      </Button>
      
      <!-- Action menu -->
      <Transition name="slide-up">
        <div v-if="showMobileMenu" class="flex flex-col gap-2 mb-2">
          <Button 
            size="icon"
            variant="outline"
            class="rounded-full w-12 h-12 shadow-md"
            @click="handleMobileAction('back')"
          >
            <Icon name="lucide:arrow-left" class="w-5 h-5" />
          </Button>
          <Button 
            size="icon"
            variant="outline"
            class="rounded-full w-12 h-12 shadow-md"
            @click="handleMobileAction('copy')"
          >
            <Icon name="lucide:copy" class="w-5 h-5" />
          </Button>
          <Button 
            size="icon"
            variant="outline"
            class="rounded-full w-12 h-12 shadow-md"
            @click="handleMobileAction('print')"
          >
            <Icon name="lucide:printer" class="w-5 h-5" />
          </Button>
          <Button 
            size="icon"
            variant="default"
            class="rounded-full w-12 h-12 shadow-md"
            @click="handleMobileAction('edit')"
          >
            <Icon name="lucide:edit" class="w-5 h-5" />
          </Button>
          <Button 
            size="icon"
            variant="destructive"
            class="rounded-full w-12 h-12 shadow-md"
            @click="handleMobileAction('delete')"
          >
            <Icon name="lucide:trash-2" class="w-5 h-5" />
          </Button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IExpense } from '~/modules/expense/types'
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '~/foundation/components/ui/breadcrumb'
import { Button } from '~/foundation/components/ui/button/index'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/foundation/components/ui/dropdown-menu'
import { Icon } from '#components'

interface Props {
  expense: IExpense
  deleting?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  edit: []
  delete: []
  print: []
  copy: []
  back: []
}>()

const { t } = useI18n()
const NuxtLink = resolveComponent('NuxtLink')

// Mobile menu state
const showMobileMenu = ref(false)

// Handle mobile action
const handleMobileAction = (action: 'edit' | 'delete' | 'print' | 'copy' | 'back') => {
  showMobileMenu.value = false
  switch (action) {
    case 'edit':
      emit('edit')
      break
    case 'delete':
      emit('delete')
      break
    case 'print':
      emit('print')
      break
    case 'copy':
      emit('copy')
      break
    case 'back':
      emit('back')
      break
    default:
      break
  }
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>