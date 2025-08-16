import type { PaginationState } from '@tanstack/vue-table'

interface ITablePaginationOptions {
  /** 初期ページサイズ */
  pageSize?: number
  /** 初期ページインデックス（0ベース） */
  pageIndex?: number
  /** URLクエリパラメータと同期するか */
  syncWithUrl?: boolean
  /** マニュアルページネーション（サーバーサイド用） */
  manualPagination?: boolean
  /** 総ページ数（サーバーサイド用） */
  pageCount?: number
}

/**
 * TanStackTable用のページネーション状態管理
 */
export const useTablePagination = (options: ITablePaginationOptions = {}) => {
  const {
    pageSize: initialPageSize = 20,
    pageIndex: initialPageIndex = 0,
    syncWithUrl = false,
    manualPagination = false,
    pageCount
  } = options

  const route = useRoute()
  const router = useRouter()

  // ページネーション状態
  const pagination = ref<PaginationState>({
    pageIndex: initialPageIndex,
    pageSize: initialPageSize,
  })

  // URL同期機能
  if (syncWithUrl) {
    // URLからの初期値設定
    pagination.value = {
      pageIndex: parseInt(route.query.page as string) - 1 || initialPageIndex, // 1ベースから0ベースに変換
      pageSize: parseInt(route.query.pageSize as string) || initialPageSize,
    }

    // ページネーション変更時のURL更新
    watch(pagination, (newPagination) => {
      let query = {
        ...route.query,
        page: String(newPagination.pageIndex + 1), // 0ベースから1ベースに変換
        pageSize: String(newPagination.pageSize),
      }

      // pageが1の場合はクエリから削除（デフォルト値のため）
      if (newPagination.pageIndex === 0) {
        const { page: _, ...queryWithoutPage } = query
        query = queryWithoutPage as typeof query
      }

      // pageSizeがデフォルトの場合はクエリから削除
      if (newPagination.pageSize === initialPageSize) {
        const { pageSize: _, ...queryWithoutPageSize } = query
        query = queryWithoutPageSize as typeof query
      }

      router.push({ query })
    }, { deep: true })
  }

  /**
   * ページネーション変更ハンドラー
   */
  const onPaginationChange = (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
    if (typeof updater === 'function') {
      pagination.value = updater(pagination.value)
    } else {
      pagination.value = updater
    }
  }

  /**
   * 特定のページに移動
   */
  const goToPage = (pageIndex: number) => {
    pagination.value = {
      ...pagination.value,
      pageIndex: Math.max(0, pageIndex)
    }
  }

  /**
   * ページサイズを変更
   */
  const setPageSize = (pageSize: number) => {
    pagination.value = {
      pageIndex: 0, // ページサイズ変更時は最初のページに戻る
      pageSize
    }
  }

  /**
   * 次のページに移動
   */
  const nextPage = () => {
    goToPage(pagination.value.pageIndex + 1)
  }

  /**
   * 前のページに移動
   */
  const previousPage = () => {
    goToPage(pagination.value.pageIndex - 1)
  }

  /**
   * 最初のページに移動
   */
  const firstPage = () => {
    goToPage(0)
  }

  /**
   * 最後のページに移動
   */
  const lastPage = (totalPages: number) => {
    goToPage(totalPages - 1)
  }

  // 派生値
  const currentPage = computed(() => pagination.value.pageIndex + 1) // 1ベースの現在ページ
  const currentPageSize = computed(() => pagination.value.pageSize)

  /**
   * ページネーション情報を取得
   * @param totalItems 総アイテム数
   */
  const getPaginationInfo = (totalItems: number) => {
    const { pageIndex, pageSize } = pagination.value
    const totalPages = Math.ceil(totalItems / pageSize)
    const startItem = pageIndex * pageSize + 1
    const endItem = Math.min((pageIndex + 1) * pageSize, totalItems)

    return {
      currentPage: pageIndex + 1,
      totalPages,
      pageSize,
      totalItems,
      startItem,
      endItem,
      hasNextPage: pageIndex < totalPages - 1,
      hasPreviousPage: pageIndex > 0,
      isFirstPage: pageIndex === 0,
      isLastPage: pageIndex === totalPages - 1,
    }
  }

  return {
    // State
    pagination: readonly(pagination),
    currentPage,
    currentPageSize,

    // Actions
    onPaginationChange,
    goToPage,
    setPageSize,
    nextPage,
    previousPage,
    firstPage,
    lastPage,

    // Utilities
    getPaginationInfo,

    // TanStackTable config values
    manualPagination,
    pageCount,
  }
}