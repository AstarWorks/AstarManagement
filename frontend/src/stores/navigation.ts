/**
 * Navigation Store
 * 
 * @description Manages navigation state including menu expansion,
 * mobile menu visibility, navigation history, and breadcrumbs.
 */

import { defineStore } from 'pinia'
import type { NavigationState, BreadcrumbItem } from '~/types/navigation'

export const useNavigationStore = defineStore('navigation', {
  state: (): NavigationState => ({
    expandedMenuIds: new Set<string>(),
    mobileMenuOpen: false,
    bottomSheetOpen: false,
    navigationHistory: [],
    breadcrumbs: []
  }),

  getters: {
    isMenuExpanded: (state) => (menuId: string) => {
      return state.expandedMenuIds.has(menuId)
    },
    
    currentPath: (state) => {
      return state.navigationHistory[state.navigationHistory.length - 1] || '/'
    },
    
    canGoBack: (state) => {
      return state.navigationHistory.length > 1
    }
  },

  actions: {
    toggleMenu(menuId: string) {
      if (this.expandedMenuIds.has(menuId)) {
        this.expandedMenuIds.delete(menuId)
      } else {
        this.expandedMenuIds.add(menuId)
      }
    },
    
    expandMenu(menuId: string) {
      this.expandedMenuIds.add(menuId)
    },
    
    collapseMenu(menuId: string) {
      this.expandedMenuIds.delete(menuId)
    },
    
    collapseAllMenus() {
      this.expandedMenuIds.clear()
    },
    
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
    },
    
    closeMobileMenu() {
      this.mobileMenuOpen = false
    },
    
    openMobileMenu() {
      this.mobileMenuOpen = true
    },
    
    toggleBottomSheet() {
      this.bottomSheetOpen = !this.bottomSheetOpen
    },
    
    addToHistory(path: string) {
      // Avoid duplicate consecutive entries
      if (this.navigationHistory[this.navigationHistory.length - 1] !== path) {
        this.navigationHistory.push(path)
        // Keep only last 20 entries
        if (this.navigationHistory.length > 20) {
          this.navigationHistory.shift()
        }
      }
    },
    
    goBack() {
      if (this.canGoBack) {
        this.navigationHistory.pop()
        return this.currentPath
      }
      return null
    },
    
    setBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
      this.breadcrumbs = breadcrumbs
    },
    
    clearBreadcrumbs() {
      this.breadcrumbs = []
    },
    
    // Persist expanded menus to localStorage
    saveExpandedState() {
      if (process.client) {
        localStorage.setItem(
          'navigation-expanded-menus',
          JSON.stringify(Array.from(this.expandedMenuIds))
        )
      }
    },
    
    // Restore expanded menus from localStorage
    loadExpandedState() {
      if (process.client) {
        const saved = localStorage.getItem('navigation-expanded-menus')
        if (saved) {
          try {
            const ids = JSON.parse(saved) as string[]
            this.expandedMenuIds = new Set(ids)
          } catch (e) {
            console.error('Failed to restore navigation state:', e)
          }
        }
      }
    }
  }
})

// Auto-save functionality will be initialized in a plugin