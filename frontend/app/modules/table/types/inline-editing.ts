/**
 * Inline Editing Type Definitions
 * Notionライクなインライン編集機能のための型定義
 */

import type { RecordResponse, PropertyDefinitionDto } from '~/types'
import type { PropertyValue } from '~/types'

/**
 * アクティブセルの位置情報
 */
export interface ActiveCellState {
  recordId: string | 'new-record'
  propertyKey: string
}

/**
 * レコードに編集状態を付加した型
 */
export interface EditableRecord extends RecordResponse {
  /** 新規作成レコードかどうか */
  _isNewRecord?: boolean
  /** 保存待ちの変更データ */
  _pendingChanges?: Partial<RecordResponse['data']>
  /** フィールド別のバリデーションエラー */
  _validationErrors?: Record<string, string[]>
  /** 最後の変更時刻 */
  _lastModified?: Date
}

/**
 * 新規作成行の型定義
 */
export interface NewRecordRow {
  id: 'new-record'
  tableId: string
  data: Record<string, PropertyValue>
  _isNewRecord: true
  _validationErrors?: Record<string, string[]>
  _lastModified?: Date
}

/**
 * セル編集コンポーネントのプロパティ型
 */
export interface EditableCellProps {
  /** レコードデータ */
  record: EditableRecord | NewRecordRow
  /** プロパティ定義 */
  property: PropertyDefinitionDto
  /** 現在の値 */
  value: PropertyValue
  /** アクティブ（フォーカス中）かどうか */
  isActive: boolean
  /** 必須項目かどうか */
  isRequired: boolean
  /** バリデーションエラーリスト */
  validationErrors: string[]
  /** 密度設定 */
  density?: 'compact' | 'normal' | 'comfortable'
  /** フォーカスイベント */
  onFocus: () => void
  /** ブラーイベント */
  onBlur: () => void
  /** 値変更イベント */
  onChange: (value: PropertyValue) => void
  /** キーボードナビゲーション */
  onNavigate?: (direction: NavigationDirection) => void
}

/**
 * キーボードナビゲーション方向
 */
export type NavigationDirection = 'up' | 'down' | 'left' | 'right' | 'tab' | 'shift-tab'

/**
 * フィールドバリデーション結果
 */
export interface FieldValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * 自動保存状態
 */
export interface AutoSaveState {
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  error: string | null
}

/**
 * テーブル編集状態の全体管理
 */
export interface TableEditingState {
  /** アクティブセル */
  activeCell: ActiveCellState | null
  /** 自動保存状態 */
  autoSave: AutoSaveState
  /** 新規レコード行 */
  newRecordRow: NewRecordRow
}

/**
 * プロパティタイプ別のエディターマッピング
 */
export interface PropertyEditorMap {
  TEXT: string
  LONG_TEXT: string
  NUMBER: number | null
  CHECKBOX: boolean
  DATE: string
  DATETIME: string
  SELECT: string
  MULTI_SELECT: string[]
  EMAIL: string
  URL: string
  FILE: string[]
  RELATION: string | string[]
}

/**
 * エディターコンポーネントのインターフェース
 */
export interface CellEditorComponent {
  value: PropertyValue
  property: PropertyDefinitionDto
  isActive: boolean
  validationErrors: string[]
  onValueChange: (value: PropertyValue) => void
  onFocus: () => void
  onBlur: () => void
}

/**
 * レコード編集用リポジトリのインターフェース
 */
export interface RecordEditRepository {
  createRecord: (data: { tableId: string; data: Record<string, PropertyValue> }) => Promise<RecordResponse>
  updateRecord: (id: string, data: { tableId: string; data: Record<string, PropertyValue> }) => Promise<RecordResponse>
  deleteRecord: (id: string) => Promise<void>
}