<template>
  <div class="flex-1 max-w-md">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger as-child>
          <div class="relative">
            <Icon name="lucide:search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              :placeholder="$t('header.search.placeholder')"
              class="pl-10 bg-muted/50"
              @keydown.enter="handleSearch"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {{ $t('header.search.label') }}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>

<script setup lang="ts">
import { Input } from '~/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { useHeaderSearch } from '~/composables/useHeaderSearch'

// 検索機能をcomposableから取得
const { searchQuery, handleSearch } = useHeaderSearch()
</script>