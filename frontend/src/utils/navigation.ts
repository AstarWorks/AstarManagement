/**
 * Navigation Utility Functions
 * 
 * @description Helper functions for navigation including permission filtering,
 * path matching, and menu manipulation.
 */

import type { NavItem } from '~/types/navigation'

/**
 * Filter navigation items based on user permissions
 */
export function filterNavigationByPermissions(
  items: NavItem[],
  userPermissions: readonly string[] = []
): NavItem[] {
  return items.filter(item => {
    // If item has no permission requirements, it's visible
    if (!item.permissions || item.permissions.length === 0) {
      // Recursively filter children
      if (item.children) {
        const filteredChildren = filterNavigationByPermissions(item.children, userPermissions)
        if (filteredChildren.length > 0) {
          return true
        }
        // If all children are filtered out, hide the parent too
        return false
      }
      return true
    }
    
    // Check if user has required permissions
    const hasPermission = item.permissions.some(permission => 
      userPermissions.includes(permission)
    )
    
    if (!hasPermission) {
      return false
    }
    
    // Filter children if present
    if (item.children) {
      const filteredChildren = filterNavigationByPermissions(item.children, userPermissions)
      // Only include item if it has visible children
      return filteredChildren.length > 0
    }
    
    return true
  }).map(item => {
    // Return item with filtered children
    if (item.children) {
      return {
        ...item,
        children: filterNavigationByPermissions(item.children, userPermissions)
      }
    }
    return item
  })
}

/**
 * Check if a path matches the current route
 */
export function isPathActive(itemPath: string, currentPath: string, exact = false): boolean {
  if (!itemPath) return false
  
  // Normalize paths
  const normalizedItemPath = itemPath.endsWith('/') ? itemPath.slice(0, -1) : itemPath
  const normalizedCurrentPath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath
  
  if (exact || itemPath === '/') {
    return normalizedItemPath === normalizedCurrentPath
  }
  
  return normalizedCurrentPath.startsWith(normalizedItemPath)
}

/**
 * Find a navigation item by its path
 */
export function findNavItemByPath(
  items: NavItem[],
  path: string
): NavItem | null {
  for (const item of items) {
    if (item.path === path) {
      return item
    }
    
    if (item.children) {
      const found = findNavItemByPath(item.children, path)
      if (found) {
        return found
      }
    }
  }
  
  return null
}

/**
 * Get all parent IDs for a navigation item
 */
export function getParentIds(
  items: NavItem[],
  targetId: string,
  parents: string[] = []
): string[] {
  for (const item of items) {
    if (item.id === targetId) {
      return parents
    }
    
    if (item.children) {
      const foundParents = getParentIds(
        item.children,
        targetId,
        [...parents, item.id]
      )
      if (foundParents.length > parents.length) {
        return foundParents
      }
    }
  }
  
  return []
}

/**
 * Flatten navigation tree into a single array
 */
export function flattenNavigation(
  items: NavItem[],
  parent?: NavItem
): Array<NavItem & { parent?: NavItem }> {
  const result: Array<NavItem & { parent?: NavItem }> = []
  
  for (const item of items) {
    result.push({ ...item, parent })
    
    if (item.children) {
      result.push(...flattenNavigation(item.children, item))
    }
  }
  
  return result
}

/**
 * Generate breadcrumbs from navigation structure
 */
export function generateBreadcrumbs(
  items: NavItem[],
  currentPath: string
): NavItem[] {
  const breadcrumbs: NavItem[] = []
  const flatItems = flattenNavigation(items)
  
  // Find current item
  const currentItem = flatItems.find(item => 
    item.path && isPathActive(item.path, currentPath, item.exact)
  )
  
  if (!currentItem) {
    return breadcrumbs
  }
  
  // Build breadcrumb trail
  let item: typeof currentItem | undefined = currentItem
  while (item) {
    breadcrumbs.unshift({
      id: item.id,
      label: item.label,
      path: item.path,
      icon: item.icon
    })
    item = item.parent
  }
  
  return breadcrumbs
}

/**
 * Search navigation items
 */
export function searchNavigation(
  items: NavItem[],
  query: string
): NavItem[] {
  const lowerQuery = query.toLowerCase()
  const results: NavItem[] = []
  
  for (const item of items) {
    const matches = item.label.toLowerCase().includes(lowerQuery)
    
    if (matches && item.path) {
      results.push(item)
    }
    
    if (item.children) {
      results.push(...searchNavigation(item.children, query))
    }
  }
  
  return results
}