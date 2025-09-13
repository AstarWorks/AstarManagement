/**
 * Inline Table Editing Composable
 * Notionライクなインライン編集機能を管理
 */

import { ref, computed, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { z } from 'zod'
import type { 
  ActiveCellState,
  EditableRecord,
  NewRecordRow,
  TableEditingState,
  AutoSaveState,
  FieldValidationResult,
  RecordEditRepository
} from '../types/inline-editing'
import type { RecordResponse, PropertyDefinitionDto } from '../types'
import type { PropertyValue } from '~/types'
import { createRecordSchema, updateRecordSchema, getPropertyZodType } from '../validators/record.schema'

export function useTableEditing(
  tableId: string,
  records: Ref<RecordResponse[]>,
  properties: Ref<Record<string, PropertyDefinitionDto>>,
  repository: RecordEditRepository
) {
  const { t } = useI18n()

  // アクティブセルの状態管理
  const activeCell = ref<ActiveCellState | null>(null)
  
  // 自動保存状態
  const autoSaveState = ref<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null
  })

  // 新規レコード行の表示制御
  const showNewRecordRow = ref(false)
  
  // 新規レコード行
  const newRecordRow = ref<NewRecordRow>({
    id: 'new-record',
    tableId,
    data: {},
    _isNewRecord: true,
    _validationErrors: {},
    _lastModified: new Date()
  })

  // 空の新規レコード行を作成するヘルパー関数
  const createEmptyNewRecord = (): NewRecordRow => ({
    id: 'new-record',
    tableId,
    data: {},
    _isNewRecord: true,
    _validationErrors: {},
    _lastModified: new Date()
  })

  // バリデーション用のZodスキーマ
  const createSchema = computed(() => createRecordSchema(properties.value))
  const updateSchema = computed(() => updateRecordSchema(properties.value))

  // テーブル表示用データ（新規行 + 既存レコード）
  const tableData = computed<(EditableRecord | NewRecordRow)[]>(() => {
    const editableRecords: EditableRecord[] = records.value.map(record => ({
      ...record,
      _isNewRecord: false,
      _pendingChanges: {},
      _validationErrors: {}
    }))

    // 新規レコード行を表示するかどうかで分岐
    if (showNewRecordRow.value) {
      return [newRecordRow.value, ...editableRecords]
    }
    
    return editableRecords
  })

  // フィールド単体のバリデーション
  const validateField = (
    propertyKey: string,
    value: PropertyValue,
    isNewRecord: boolean = false
  ): FieldValidationResult => {
    try {
      const property = properties.value[propertyKey]
      if (!property) {
        return { isValid: false, errors: [t('foundation.messages.error.validation')] }
      }

      const fieldSchema = getPropertyZodType(property)
      
      // 必須チェック
      if (property.required && (value === null || value === undefined || value === '')) {
        return {
          isValid: false,
          errors: [t('modules.table.property.errors.valueRequired')]
        }
      }

      // 値が空でないときのみタイプバリデーション
      if (value !== null && value !== undefined && value !== '') {
        fieldSchema.parse(value)
      }

      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map((err: z.ZodIssue) => err.message)
        }
      }
      return { isValid: false, errors: [t('foundation.messages.error.validation')] }
    }
  }

  // レコード全体の完成度チェック
  const isRecordComplete = (record: NewRecordRow | EditableRecord): boolean => {
    return Object.entries(properties.value).every(([key, property]) => {
      const value = record.data?.[key]
      if (property.required && (value === null || value === undefined || value === '')) {
        return false
      }
      return true
    })
  }

  // セルにフォーカス
  const focusCell = (recordId: string, propertyKey: string) => {
    activeCell.value = { recordId, propertyKey }
  }

  // セルからフォーカス外す
  const blurCell = () => {
    activeCell.value = null
  }

  // 新規レコード作成を開始
  const startNewRecord = () => {
    showNewRecordRow.value = true
    
    // 最初のプロパティを取得してフォーカス
    const firstPropertyKey = Object.keys(properties.value)[0]
    if (firstPropertyKey) {
      // 少し遅延してフォーカス（DOM更新を待つ）
      nextTick(() => {
        focusCell('new-record', firstPropertyKey)
      })
    }
  }

  // 新規レコード作成をキャンセル
  const cancelNewRecord = () => {
    showNewRecordRow.value = false
    newRecordRow.value = createEmptyNewRecord()
    activeCell.value = null
  }

  // 新規レコード行を非表示（データは保持）
  const hideNewRecord = () => {
    showNewRecordRow.value = false
    activeCell.value = null
  }

  // セル値の更新
  const updateCellValue = async (
    recordId: string,
    propertyKey: string,
    value: PropertyValue
  ) => {
    const validation = validateField(propertyKey, value, recordId === 'new-record')
    
    if (recordId === 'new-record') {
      // 新規レコードの場合
      newRecordRow.value.data[propertyKey] = value
      newRecordRow.value._lastModified = new Date()
      
      // バリデーションエラーを更新
      if (!validation.isValid) {
        newRecordRow.value._validationErrors = {
          ...newRecordRow.value._validationErrors,
          [propertyKey]: validation.errors
        }
      } else {
        const errors = { ...newRecordRow.value._validationErrors }
        delete errors[propertyKey]
        newRecordRow.value._validationErrors = errors
      }

      // 全必須項目が埋まったら自動保存
      if (validation.isValid && isRecordComplete(newRecordRow.value)) {
        debouncedSaveNewRecord()
      }
    } else {
      // 既存レコードの場合：即座に更新をトリガー
      if (validation.isValid) {
        debouncedUpdateRecord(recordId, propertyKey, value)
      } else {
        // バリデーションエラーを表示
        toast.error(validation.errors[0] || t('foundation.messages.error.validation') as string)
      }
    }

    autoSaveState.value.hasUnsavedChanges = !validation.isValid || recordId === 'new-record'
  }

  // 新規レコードの保存（デバウンス付き）
  const debouncedSaveNewRecord = useDebounceFn(async () => {
    if (autoSaveState.value.isSaving) return

    try {
      autoSaveState.value.isSaving = true
      toast.info(t('modules.table.inline.autoSaving') as string)

      const result = await repository.createRecord({
        tableId,
        data: newRecordRow.value.data
      })

      // レコードリストに新しいレコードを追加
      records.value.unshift(result)
      
      // 新規行を非表示にしてリセット
      showNewRecordRow.value = false
      newRecordRow.value = createEmptyNewRecord()

      autoSaveState.value.lastSaved = new Date()
      autoSaveState.value.hasUnsavedChanges = false
      autoSaveState.value.error = null

    } catch (error) {
      console.error('Failed to save new record:', error)
      autoSaveState.value.error = t('foundation.messages.error.default')
      toast.error(t('foundation.messages.error.default') as string)
    } finally {
      autoSaveState.value.isSaving = false
    }
  }, 800) // 800ms のデバウンス

  // 既存レコードの更新（デバウンス付き）
  const debouncedUpdateRecord = useDebounceFn(async (
    recordId: string,
    propertyKey: string,
    value: PropertyValue
  ) => {
    if (autoSaveState.value.isSaving) return

    try {
      autoSaveState.value.isSaving = true

      await repository.updateRecord(recordId, {
        tableId,
        data: { [propertyKey]: value }
      })

      // レコードリスト内のデータを更新
      const recordIndex = records.value.findIndex(r => r.id === recordId)
      if (recordIndex !== -1) {
        const updatedRecord = { ...records.value[recordIndex] }
        if (!updatedRecord.data) updatedRecord.data = {}
        updatedRecord.data[propertyKey] = value
        updatedRecord.updatedAt = new Date().toISOString()
        records.value[recordIndex] = updatedRecord
      }

      autoSaveState.value.lastSaved = new Date()
      autoSaveState.value.hasUnsavedChanges = false
      autoSaveState.value.error = null

    } catch (error) {
      console.error('Failed to update record:', error)
      autoSaveState.value.error = t('foundation.messages.error.default')
      toast.error(t('foundation.messages.error.default') as string)
    } finally {
      autoSaveState.value.isSaving = false
    }
  }, 500) // 500ms のデバウンス

  // アクティブセルがnew-recordかどうか
  const isEditingNewRecord = computed(() => 
    activeCell.value?.recordId === 'new-record'
  )

  // 編集状態の全体情報
  const editingState = computed<TableEditingState>(() => ({
    activeCell: activeCell.value,
    autoSave: autoSaveState.value,
    newRecordRow: newRecordRow.value
  }))

  return {
    // 状態
    activeCell: readonly(activeCell),
    autoSaveState: readonly(autoSaveState),
    newRecordRow: readonly(newRecordRow),
    showNewRecordRow: readonly(showNewRecordRow),
    tableData,
    editingState,
    isEditingNewRecord,

    // アクション
    focusCell,
    blurCell,
    updateCellValue,
    validateField,
    isRecordComplete,
    startNewRecord,
    cancelNewRecord,
    hideNewRecord
  }
}