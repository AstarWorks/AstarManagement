/**
 * useTableHelpers Composable
 * テーブル関連のヘルパー関数を提供するComposable
 */

import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { TableResponse } from '../../types'

export const useTableHelpers = () => {
  const { locale } = useI18n()
  
  /**
   * テーブルのプロパティ数を取得
   */
  const getPropertyCount = (table: TableResponse): number => {
    return Object.keys(table.properties || {}).length
  }
  
  /**
   * テーブルのレコード数を型安全に取得
   * any型を使わずに、適切な型ガードで処理
   */
  const getRecordCount = (table: TableResponse): number => {
    // 型安全な方法でrecordCountを取得
    if ('recordCount' in table && typeof table.recordCount === 'number') {
      return table.recordCount
    }
    return 0
  }
  
  /**
   * 日付を相対時間形式でフォーマット
   */
  const formatRelativeTime = (date: string | undefined | null): string => {
    if (!date) return ''
    
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true,
        locale: locale.value === 'ja' ? ja : undefined
      })
    } catch (error) {
      // 不正な日付の場合は空文字を返す
      return ''
    }
  }
  
  /**
   * テーブル名のバリデーション
   */
  const validateTableName = (name: string): { valid: boolean; error?: string } => {
    const { t } = useI18n()
    
    if (!name || name.trim().length === 0) {
      return { valid: false, error: t('modules.table.validation.nameRequired') }
    }
    
    if (name.length > 100) {
      return { valid: false, error: t('modules.table.validation.nameTooLong') }
    }
    
    return { valid: true }
  }
  
  /**
   * テーブルの統計情報を計算
   */
  const calculateTableStats = (tables: TableResponse[]) => {
    const total = tables.length
    const withRecords = tables.filter(t => getRecordCount(t) > 0).length
    const withoutRecords = total - withRecords
    
    const totalRecords = tables.reduce((sum, t) => sum + getRecordCount(t), 0)
    const averageRecords = total > 0 ? Math.round(totalRecords / total) : 0
    
    return {
      total,
      withRecords,
      withoutRecords,
      totalRecords,
      averageRecords
    }
  }
  
  return {
    getPropertyCount,
    getRecordCount,
    formatRelativeTime,
    validateTableName,
    calculateTableStats
  }
}