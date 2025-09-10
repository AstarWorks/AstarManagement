<template>
    <div class="flex-1 max-w-md">
        <div class="relative">
            <Icon name="lucide:search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input v-model="searchQuery" :placeholder="$t('modules.header.search.placeholder')"
                class="pl-10 bg-muted/50" @keydown.enter="handleSearch" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Input } from '~/foundation/components/ui/input/index'
import { useHeaderSearch } from '~/foundation/composables/navigation/useHeaderSearch'

// 検索機能をcomposableから取得
const { searchQuery, handleSearch } = useHeaderSearch()
</script>