<template>
  <Breadcrumb class="hidden md:flex">
    <BreadcrumbList>
      <template v-for="(crumb, index) in breadcrumbs" :key="index">
        <BreadcrumbItem>
          <BreadcrumbLink
            v-if="crumb.href"
            :as="NuxtLink"
            :to="crumb.href"
            class="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-800 hover:decoration-2 transition-all cursor-pointer"
          >
            {{ crumb.labelKey ? $t(crumb.labelKey) : crumb.label }}
          </BreadcrumbLink>
          <BreadcrumbPage v-else class="font-semibold text-gray-600">
            {{ crumb.labelKey ? $t(crumb.labelKey) : crumb.label }}
          </BreadcrumbPage>
        </BreadcrumbItem>
        <BreadcrumbSeparator v-if="index < breadcrumbs.length - 1" />
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>

<script setup lang="ts">
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '~/foundation/components/ui/breadcrumb'
import { useHeaderBreadcrumb } from '~/foundation/composables/navigation/useHeaderBreadcrumb'

// NuxtLinkの型解決
const NuxtLink = resolveComponent('NuxtLink')

// ブレッドクラム機能をcomposableから取得
const { breadcrumbs } = useHeaderBreadcrumb()
</script>