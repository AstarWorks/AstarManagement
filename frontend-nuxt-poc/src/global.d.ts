/// <reference types="nuxt" />
/// <reference types="vue/macros-global" />
/// <reference types="@nuxt/types" />

// Import Nuxt composables globally
export * from '#imports'

// Ensure Vue types are available
import '@vue/runtime-core'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {}
}

// Make sure these are available globally
declare global {
  // Vue imports
  const useHead: typeof import('#imports')['useHead']
  const onMounted: typeof import('#imports')['onMounted']
  const onUnmounted: typeof import('#imports')['onUnmounted']
  const readonly: typeof import('#imports')['readonly']
  const ref: typeof import('#imports')['ref']
  const computed: typeof import('#imports')['computed']
  const reactive: typeof import('#imports')['reactive']
  const watch: typeof import('#imports')['watch']
  const watchEffect: typeof import('#imports')['watchEffect']
  const toRefs: typeof import('#imports')['toRefs']
  const inject: typeof import('#imports')['inject']
  const nextTick: typeof import('#imports')['nextTick']
  const defineProps: typeof import('#imports')['defineProps']
  const defineEmits: typeof import('#imports')['defineEmits']
  const withDefaults: typeof import('#imports')['withDefaults']
  
  // Vue types
  type Ref<T = any> = import('vue').Ref<T>
  type MaybeRef<T = any> = import('vue').MaybeRef<T>
  type ComputedRef<T = any> = import('vue').ComputedRef<T>
  
  // Nuxt imports
  const useRouter: typeof import('#imports')['useRouter']
  const useRoute: typeof import('#imports')['useRoute']
  const navigateTo: typeof import('#imports')['navigateTo']
  const useNuxtApp: typeof import('#imports')['useNuxtApp']
  const useRuntimeConfig: typeof import('#imports')['useRuntimeConfig']
  const defineNuxtRouteMiddleware: typeof import('#imports')['defineNuxtRouteMiddleware']
  const createError: typeof import('#imports')['createError']
  const definePageMeta: typeof import('#imports')['definePageMeta']
  const provide: typeof import('#imports')['provide']
  const defineNuxtPlugin: typeof import('#imports')['defineNuxtPlugin']
  const defineEventHandler: typeof import('#imports')['defineEventHandler']
  const getRouterParam: typeof import('#imports')['getRouterParam']
  const readBody: typeof import('#imports')['readBody']
  const getQuery: typeof import('#imports')['getQuery']
  const setHeader: typeof import('#imports')['setHeader']
  
  // Nuxt route types
  type RouteLocationNormalized = import('vue-router').RouteLocationNormalized
  type RouteLocationNormalizedLoaded = import('vue-router').RouteLocationNormalizedLoaded
  
  // Custom composables
  const useTheme: typeof import('#imports')['useTheme']
  const useAuthStore: typeof import('#imports')['useAuthStore']
  const useNavigationStore: typeof import('#imports')['useNavigationStore']
  const useKanbanStore: typeof import('#imports')['useKanbanStore']
  const useWindowSize: typeof import('#imports')['useWindowSize']
  const useColorMode: typeof import('#imports')['useColorMode']
  const useFetch: typeof import('#imports')['useFetch']
  const useSeoMeta: typeof import('#imports')['useSeoMeta']
  const useBreadcrumbs: typeof import('#imports')['useBreadcrumbs']
  const useIsMobileVueUse: typeof import('#imports')['useIsMobileVueUse']
}

export {}