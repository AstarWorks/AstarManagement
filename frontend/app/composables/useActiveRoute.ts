export const useActiveRoute = () => {
  const route = useRoute()

  const isActiveRoute = (path: string, exact = false): boolean => {
    if (exact) {
      return route.path === path
    }
    return route.path.startsWith(path)
  }

  const getActiveClass = (path: string, exact = false): string => {
    return isActiveRoute(path, exact) ? 'active' : ''
  }

  const isExpenseRoute = computed(() => isActiveRoute('/expenses'))
  const isFinanceRoute = computed(() => isActiveRoute('/expenses') || isActiveRoute('/billing'))

  return {
    isActiveRoute,
    getActiveClass,
    isExpenseRoute,
    isFinanceRoute
  }
}