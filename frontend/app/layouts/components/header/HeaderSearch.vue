<template>
  <div class="w-full">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger as-child>
          <div class="relative">
            <Icon name="lucide:search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              v-model="searchQuery"
              :placeholder="$t('modules.header.search.placeholder')"
              class="pl-10 bg-white border border-gray-300 focus:border-primary font-medium"
              @keydown.enter="handleSearch"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {{ $t('modules.header.search.label') }}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>

<script setup lang="ts">
import { Input } from '~/foundation/components/ui/input/index'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/foundation/components/ui/tooltip'
import { useHeaderSearch } from '~/foundation/composables/navigation/useHeaderSearch'

// 検索機能をcomposableから取得
const { searchQuery, handleSearch } = useHeaderSearch()
</script>