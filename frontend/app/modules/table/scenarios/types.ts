/**
 * Scenario Type Definitions
 * シナリオデータの型定義
 */

import type { PropertyDefinitionDto as PropertyDefinition, RecordResponse } from '~/types'

/**
 * テーブル定義
 */
export interface ScenarioTableDefinition {
  name: string
  description?: string
  icon?: string
  color?: string
  properties: PropertyDefinition[]
  propertyOrder?: string[]
}

/**
 * レコードデータ生成関数
 */
export type RecordGenerator = (tableId: string, count: number) => Omit<RecordResponse, 'id' | 'createdAt' | 'updatedAt'>[]

/**
 * シナリオ定義
 */
export interface ScenarioDefinition {
  id: string
  name: string
  description: string
  workspaceIds: string[]  // このシナリオが適用されるワークスペースID
  tables: ScenarioTableDefinition[]
  generateRecords: RecordGenerator
}

/**
 * シナリオマップ（ワークスペースIDからシナリオへのマッピング）
 */
export interface ScenarioMap {
  [workspaceId: string]: ScenarioDefinition
}