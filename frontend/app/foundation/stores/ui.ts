/**
 * UI状態管理ストア
 * Simple over Easy: UI状態のみに責任を限定
 */

import { defineStore } from 'pinia'

export interface IUIState {
  // Sidebar state
  isSidebarOpen: boolean
  isSidebarCollapsed: boolean
  isMobileMenuOpen: boolean
  isAgentOpen: boolean
  isAgentCollapsed: boolean
  isAgentSidebarCollapsed: boolean
  
  // Breadcrumbs
  breadcrumbs: Array<{ label: string; path?: string }>
  
  // Recently visited pages
  recentlyVisited: Array<{ 
    label: string
    path: string
    timestamp: number 
  }>
  
  // Current page info
  currentPath: string
  pageTitle: string
}

export const useUIStore = defineStore('ui', {
  state: (): IUIState => ({
    isSidebarOpen: true,
    isSidebarCollapsed: false,
    isMobileMenuOpen: false,
    isAgentOpen: true,
    isAgentCollapsed: false,
    isAgentSidebarCollapsed: false,
    breadcrumbs: [],
    recentlyVisited: [],
    currentPath: '',
    pageTitle: ''
  }),

  getters: {
    /**
     * 最近訪問したページ（最大5件）
     */
    recentPages: (state) => {
      return state.recentlyVisited
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
    }
  },

  actions: {
    /**
     * サイドバーの開閉
     */
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed
      this.persistSidebarState()
    },

    /**
     * サイドバーの開閉状態を設定
     */
    toggleSidebarOpen() {
      this.isSidebarOpen = !this.isSidebarOpen
      this.persistSidebarState()
    },

    /**
     * モバイルメニューの開閉
     */
    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen
    },

    /**
     * モバイルメニューを閉じる
     */
    closeMobileMenu() {
      this.isMobileMenuOpen = false
    },

    /**
     * エージェントの開閉
     */
    toggleAgent() {
      this.isAgentCollapsed = !this.isAgentCollapsed
      this.isAgentSidebarCollapsed = false
      this.persistAgentState()
    },

    /**
     * エージェント内サイドバーの開閉
     */
    toggleAgentSidebar() {
      this.isAgentSidebarCollapsed = !this.isAgentSidebarCollapsed
      this.persistAgentState()
    },

    /**
     * 現在のパスを更新
     */
    setCurrentPath(path: string) {
      this.currentPath = path
    },

    /**
     * ページタイトルを設定
     */
    setPageTitle(title: string) {
      this.pageTitle = title
    },

    /**
     * パンくずリストを設定
     */
    setBreadcrumbs(breadcrumbs: Array<{ label: string; path?: string }>) {
      this.breadcrumbs = breadcrumbs
    },

    /**
     * 最近訪問したページを追加
     */
    addRecentlyVisited(item: { label: string; path: string }) {
      const existingIndex = this.recentlyVisited.findIndex(
        visited => visited.path === item.path
      )
      
      if (existingIndex >= 0) {
        // 既存項目のタイムスタンプを更新
        const existingItem = this.recentlyVisited[existingIndex]
        if (existingItem) {
          existingItem.timestamp = Date.now()
        }
      } else {
        // 新しい項目を追加
        this.recentlyVisited.unshift({
          ...item,
          timestamp: Date.now()
        })
        
        // 最大10件まで保持
        if (this.recentlyVisited.length > 10) {
          this.recentlyVisited = this.recentlyVisited.slice(0, 10)
        }
      }
    },

    /**
     * サイドバー状態の永続化
     */
    persistSidebarState() {
      if (import.meta.client) {
        localStorage.setItem('sidebar-collapsed', this.isSidebarCollapsed.toString())
      }
    },

    /**
     * エージェント状態の永続化
     */
    persistAgentState() {
      if (import.meta.client) {
        localStorage.setItem('agent-collapsed', this.isAgentCollapsed.toString())
        localStorage.setItem('agent-sidebar-collapsed', this.isAgentSidebarCollapsed.toString())
      }
    },

    persistAgentSidebarState() {
      if (import.meta.client) {
        localStorage.setItem('agent-sidebar-collapsed', this.isAgentSidebarCollapsed.toString())
      } 
    },

    /**
     * 設定を復元
     */
    restoreSettings() {
      if (import.meta.client) {
        const sidebarCollapsed = localStorage.getItem('sidebar-collapsed')
        if (sidebarCollapsed !== null) {
          this.isSidebarCollapsed = sidebarCollapsed === 'true'
        }
        const sidebarOpen = localStorage.getItem('sidebar-open')
        if (sidebarOpen !== null) {
          this.isSidebarOpen = sidebarOpen === 'true'
        }
      }
    }
  },

  // 永続化設定
  persist: {
    key: 'ui-store',
    pick: ['recentlyVisited', 'isSidebarCollapsed', 'isAgentCollapsed', 'isAgentSidebarCollapsed']
  }
})