// stores/chat.ts
import { defineStore } from 'pinia'

interface Chat {
  id: string
  title: string
  lastUpdated: Date
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    isSidebarCollapsed: false,
    chatHistory: [
      { id: '1', title: 'Vueコンポーネントの基本', lastUpdated: new Date() },
      { id: '2', title: 'Piniaの使い方について', lastUpdated: new Date() },
    ] as Chat[],
    activeChatId: '1' as string | null,
    searchQuery: '' as string, // ◀️ 1. 検索キーワードを保持するstateを追加
  }),

  getters: {
    // ◀️ 2. フィルタリングされたチャット履歴を返すgetterを追加
    filteredChatHistory(state): Chat[] {
      // 検索キーワードがなければ、全履歴を返す
      if (!state.searchQuery) {
        return state.chatHistory
      }
      // あれば、タイトルにキーワードが含まれるものだけを返す(大文字・小文字を区別しない)
      return state.chatHistory.filter(chat =>
        chat.title.toLowerCase().includes(state.searchQuery.toLowerCase())
      )
    },
  },

  actions: {
    // サイドバーの開閉を切り替える
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed
    },
    // 新しいチャットを開始する
    createNewChat() {
      const newChat = {
        id: Date.now().toString(),
        title: '無題のチャット',
        lastUpdated: new Date(),
      }
      this.chatHistory.unshift(newChat) // 配列の先頭に追加
      this.activeChatId = newChat.id
    },
    // チャットを選択する
    selectChat(id: string) {
      this.activeChatId = id
    },
    // チャットを削除する
    deleteChat(id: string) {
      this.chatHistory = this.chatHistory.filter(chat => chat.id !== id)
      if (this.activeChatId === id) {
        this.activeChatId = this.chatHistory[0]?.id || null
      }
    },
    // ◀️ 3. 検索キーワードを更新するactionを追加
    updateSearchQuery(query: string) {
      this.searchQuery = query
    },
  },
})