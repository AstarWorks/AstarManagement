/**
 * フィルター設定 - Simple over Easy
 * Filter Configuration - Centralized and extensible
 * 
 * 法律事務所特有のフィルター設定を一元管理  
 */

import type {  ICaseFilters  } from '~/modules/case/types/case'

/**
 * フィルター設定のベース型
 */
export interface IFilterOptionConfig {
  value: string
  labelKey: string // i18n key
  description?: string
}

/**
 * フィルターグループ設定
 */
export interface IFilterGroupConfig {
  id: string
  labelKey: string
  type: 'select' | 'search' | 'dateRange' | 'tags' | 'multiSelect'
  options?: IFilterOptionConfig[]
  placeholder?: string
  required?: boolean
  advanced?: boolean // 詳細フィルターに配置するか
}

/**
 * 法律事務所特有のタグ（業務分野）
 * 実際の環境では動的に取得することを想定
 */
export const LEGAL_PRACTICE_TAGS = [
  '不動産', '契約', 'M&A', '企業法務', '労働法', '調停', 
  '民事', '刑事', '家事', '知的財産', '税務', '国際'
] as const

/**
 * 案件フィルター設定
 */
export const CASE_FILTER_CONFIG: IFilterGroupConfig[] = [
  // 基本フィルター
  {
    id: 'search',
    labelKey: 'matter.filters.search.label',
    type: 'search',
    placeholder: 'matter.filters.search.placeholder',
    advanced: false
  },
  {
    id: 'clientType',
    labelKey: 'matter.filters.clientType.label',
    type: 'select',
    advanced: false,
    options: [
      { value: 'all', labelKey: 'matter.filters.clientType.options.all' },
      { value: 'individual', labelKey: 'matter.filters.clientType.options.individual' },
      { value: 'corporate', labelKey: 'matter.filters.clientType.options.corporate' }
    ]
  },
  {
    id: 'priority',
    labelKey: 'matter.filters.priority.label',
    type: 'select',
    advanced: false,
    options: [
      { value: 'all', labelKey: 'matter.filters.priority.options.all' },
      { value: 'high', labelKey: 'matter.filters.priority.options.high' },
      { value: 'medium', labelKey: 'matter.filters.priority.options.medium' },
      { value: 'low', labelKey: 'matter.filters.priority.options.low' }
    ]
  },
  {
    id: 'assignedLawyer',
    labelKey: 'matter.filters.assignedLawyer.label',
    type: 'select',
    advanced: false,
    options: [
      { value: 'all', labelKey: 'matter.filters.assignedLawyer.options.all' }
      // 動的に弁護士リストを追加
    ]
  },
  {
    id: 'dateRange',
    labelKey: 'matter.filters.dateRange.label',
    type: 'dateRange',
    advanced: false
  },
  
  // 詳細フィルター
  {
    id: 'tags',
    labelKey: 'matter.filters.tags.label',
    type: 'tags',
    advanced: true
  },
  {
    id: 'sortBy',
    labelKey: 'matter.filters.sort.label',
    type: 'select',
    advanced: true,
    options: [
      { value: 'dueDate', labelKey: 'matter.filters.sort.by.dueDate' },
      { value: 'priority', labelKey: 'matter.filters.sort.by.priority' },
      { value: 'createdAt', labelKey: 'matter.filters.sort.by.createdAt' },
      { value: 'updatedAt', labelKey: 'matter.filters.sort.by.updatedAt' },
      { value: 'title', labelKey: 'matter.filters.sort.by.title' }
    ]
  },
  {
    id: 'sortOrder',
    labelKey: 'matter.filters.sort.order.label',
    type: 'select',
    advanced: true,
    options: [
      { value: 'asc', labelKey: 'matter.filters.sort.order.asc' },
      { value: 'desc', labelKey: 'matter.filters.sort.order.desc' }
    ]
  }
]

/**
 * デフォルトフィルター値
 */
export const DEFAULT_CASE_FILTERS: ICaseFilters = {
  search: '',
  clientType: 'all',
  priority: 'all',
  assignedLawyer: 'all',
  tags: [],
  dateRange: null,
  sortBy: 'dueDate',
  sortOrder: 'asc'
}

/**
 * フィルター設定を取得する関数
 */
export function getFilterConfig(filterId: string): IFilterGroupConfig | undefined {
  return CASE_FILTER_CONFIG.find(config => config.id === filterId)
}

/**
 * 基本フィルター設定のみを取得
 */
export function getBasicFilterConfigs(): IFilterGroupConfig[] {
  return CASE_FILTER_CONFIG.filter(config => !config.advanced)
}

/**
 * 詳細フィルター設定のみを取得
 */
export function getAdvancedFilterConfigs(): IFilterGroupConfig[] {
  return CASE_FILTER_CONFIG.filter(config => config.advanced === true)
}