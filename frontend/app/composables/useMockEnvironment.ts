/**
 * Mock Environment Helper
 * モック環境の管理とデバッグツール
 */

import { MockTableRepository } from '~/modules/table/repositories/MockTableRepository'

export const useMockEnvironment = () => {
  const config = useRuntimeConfig()
  const toast = {
    add: (notification: { title: string; description?: string; color?: string }) => {
      console.log(`[Toast] ${notification.title}: ${notification.description}`)
    }
  }

  /**
   * モックモードかどうかを判定
   */
  const isMockMode = computed(() => {
    return config.public.apiMode === 'mock'
  })

  /**
   * 開発モードかどうか
   */
  const isDevelopment = computed(() => {
    return config.public.appEnv === 'development'
  })

  /**
   * デバッグ情報を表示するかどうか
   */
  const showDebugInfo = computed(() => {
    return config.public.showDebugInfo === true
  })

  /**
   * モックデータをリセット
   */
  const resetMockData = async () => {
    if (!isMockMode.value) {
      console.warn('[useMockEnvironment] Not in mock mode')
      return
    }

    try {
      const repository = new MockTableRepository()
      await repository.resetMockData()
      toast?.add({
        title: 'モックデータリセット',
        description: 'モックデータが正常にリセットされました',
        color: 'green'
      })
      
      // ページをリロード
      window.location.reload()
    } catch (error) {
      console.error('[useMockEnvironment] Failed to reset mock data:', error)
      toast?.add({
        title: 'エラー',
        description: 'モックデータのリセットに失敗しました',
        color: 'red'
      })
    }
  }

  /**
   * モックデータの統計を取得
   */
  const getMockDataStats = () => {
    if (!isMockMode.value) {
      return null
    }

    try {
      const repository = new MockTableRepository()
      return repository.getDataStats()
    } catch (error) {
      console.error('[useMockEnvironment] Failed to get data stats:', error)
      return null
    }
  }

  /**
   * LocalStorageのデータサイズを取得
   */
  const getStorageSize = (): string => {
    try {
      const data = localStorage.getItem('astar_mock_data')
      if (!data) return '0 KB'

      const sizeInBytes = new Blob([data]).size
      if (sizeInBytes < 1024) {
        return `${sizeInBytes} B`
      } else if (sizeInBytes < 1024 * 1024) {
        return `${(sizeInBytes / 1024).toFixed(2)} KB`
      } else {
        return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
      }
    } catch {
      return '不明'
    }
  }

  /**
   * 環境情報を取得
   */
  const getEnvironmentInfo = () => {
    return {
      mode: isMockMode.value ? 'Mock' : 'Real API',
      apiBaseUrl: config.public.apiBaseUrl as string,
      appEnv: config.public.appEnv as string,
      features: {
        ai: config.public.enableAiFeatures === true,
        realTimeSync: config.public.enableRealTimeSync === true,
        offlineMode: config.public.enableOfflineMode === true
      }
    }
  }

  /**
   * モックデータをエクスポート（デバッグ用）
   */
  const exportMockData = () => {
    if (!isMockMode.value) {
      console.warn('[useMockEnvironment] Not in mock mode')
      return
    }

    try {
      const data = localStorage.getItem('astar_mock_data')
      if (!data) {
        toast?.add({
          title: '警告',
          description: 'エクスポートするデータがありません',
          color: 'yellow'
        })
        return
      }

      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mock-data-${new Date().toISOString()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast?.add({
        title: 'エクスポート完了',
        description: 'モックデータがダウンロードされました',
        color: 'green'
      })
    } catch (error) {
      console.error('[useMockEnvironment] Failed to export mock data:', error)
      toast?.add({
        title: 'エラー',
        description: 'データのエクスポートに失敗しました',
        color: 'red'
      })
    }
  }

  /**
   * モックデータをインポート（デバッグ用）
   */
  const importMockData = async (file: File) => {
    if (!isMockMode.value) {
      console.warn('[useMockEnvironment] Not in mock mode')
      return
    }

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // バリデーション
      if (!data.version || !data.tables || !data.records) {
        throw new Error('Invalid mock data format')
      }

      localStorage.setItem('astar_mock_data', text)
      
      toast?.add({
        title: 'インポート完了',
        description: 'モックデータがインポートされました',
        color: 'green'
      })

      // ページをリロード
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('[useMockEnvironment] Failed to import mock data:', error)
      toast?.add({
        title: 'エラー',
        description: 'データのインポートに失敗しました',
        color: 'red'
      })
    }
  }

  return {
    // State
    isMockMode: readonly(isMockMode),
    isDevelopment: readonly(isDevelopment),
    showDebugInfo: readonly(showDebugInfo),

    // Actions
    resetMockData,
    getMockDataStats,
    getStorageSize,
    getEnvironmentInfo,
    exportMockData,
    importMockData
  }
}