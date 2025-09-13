/**
 * Mock Data Generator
 * プロパティタイプに応じたリアルなモックデータを生成
 */

import { faker } from '@faker-js/faker/locale/ja'
import type { PropertyDefinitionDto, RecordResponse, TableResponse } from '../types'
import { legalOfficeScenario } from '../scenarios/legalOffice'
import { techCompanyScenario } from '../scenarios/techCompany'
import { generateLegalExpenseTable } from '../scenarios/legalOfficeExpenses'
import { getRecordId, MOCK_WORKSPACE_IDS } from '~/modules/mock/constants/mockIds'

// 現在のシナリオコンテキスト
let currentScenario: 'legal' | 'tech' | 'general' = 'general'
let scenarioIndex = 0

/**
 * シナリオを設定
 */
export function setScenario(scenario: 'legal' | 'tech' | 'general') {
  currentScenario = scenario
  scenarioIndex = 0
}

/**
 * プロパティタイプに応じた値を生成（シナリオ対応）
 */
export function generateValueForProperty(property: PropertyDefinitionDto, _context?: { scenario?: string; index?: number }): unknown {
  const { type, config } = property

  switch (type) {
    case 'text': {
      // テキスト: 名前、タイトル、短い文章など
      if (property.key?.includes('name')) {
        return faker.person.fullName()
      }
      if (property.key?.includes('title')) {
        // シナリオに応じたタイトル生成
        if (currentScenario === 'legal') {
          const caseData = legalOfficeScenario.cases[scenarioIndex % legalOfficeScenario.cases.length]
          return caseData?.title ?? '法律相談'
        } else if (currentScenario === 'tech') {
          const taskData = techCompanyScenario.tasks[scenarioIndex % techCompanyScenario.tasks.length]
          return taskData?.title ?? 'システム開発'
        } else {
          const titles = [
            '新規プロジェクト提案書',
            '月次売上レポート',
            '顧客満足度向上施策',
            '業務効率化の検討',
            '市場調査結果まとめ',
            '製品開発ロードマップ',
            'チーム目標設定',
            '四半期業績報告'
          ]
          return faker.helpers.arrayElement(titles)
        }
      }
      if (property.key?.includes('company') || property.key?.includes('client')) {
        if (currentScenario === 'legal') {
          const client = legalOfficeScenario.clients[scenarioIndex % legalOfficeScenario.clients.length]
          return client?.name ?? 'クライアント株式会社'
        } else if (currentScenario === 'tech') {
          const project = techCompanyScenario.projects[scenarioIndex % techCompanyScenario.projects.length]
          return project?.client ?? 'Tech Company'
        }
        return faker.company.name()
      }
      // 日本語の短文
      const phrases = [
        '本日の会議資料',
        '重要な連絡事項',
        '確認が必要です',
        '進捗状況の更新',
        'タスクの優先順位',
        '顧客からのフィードバック',
        '改善提案',
        '定期レビュー'
      ]
      return faker.helpers.arrayElement(phrases)
    }

    case 'long_text': {
      // シナリオに応じた説明文生成
      if (currentScenario === 'legal' && property.key?.includes('description')) {
        const caseData = legalOfficeScenario.cases[scenarioIndex % legalOfficeScenario.cases.length]
        return caseData?.description ?? '法的サービスを提供します。'
      } else if (currentScenario === 'tech' && property.key?.includes('description')) {
        const project = techCompanyScenario.projects[scenarioIndex % techCompanyScenario.projects.length]
        return project?.description ?? 'テクノロジーソリューションを提供します。'
      } else {
        const descriptions = [
          'このプロジェクトは、顧客満足度の向上を目的として開始されました。現在、要件定義フェーズを完了し、設計フェーズに移行しています。\n\n今後のスケジュールについては、来月末までに実装を完了し、その後テストフェーズに入る予定です。',
          '本日の会議では、四半期の売上目標について議論しました。各部門からの報告を基に、今後の戦略を検討しています。\n\n特に重要なポイントとして、新規顧客の獲得と既存顧客の満足度向上が挙げられました。',
          '製品の品質向上に向けた取り組みを継続しています。ユーザーフィードバックを分析した結果、いくつかの改善点が明確になりました。\n\n次回のリリースでは、これらの改善点を反映させる予定です。'
        ]
        return faker.helpers.arrayElement(descriptions)
      }
    }

    case 'number': {
      // 数値
      const min = (config?.min as number) ?? 0
      const max = (config?.max as number) ?? 10000
      return faker.number.int({ min, max })
    }

    case 'date':
      // 日付
      return faker.date.between({ 
        from: '2024-01-01', 
        to: '2025-12-31' 
      }).toISOString().split('T')[0]

    case 'datetime':
      // 日時
      return faker.date.between({ 
        from: '2024-01-01', 
        to: '2025-12-31' 
      }).toISOString()

    case 'checkbox':
      // チェックボックス
      return faker.datatype.boolean()

    case 'select': {
      // 選択（単一）
      const selectOptions = config?.options as Array<{ value: string; label: string }> | undefined
      if (selectOptions && selectOptions.length > 0) {
        return faker.helpers.arrayElement(selectOptions).value
      }
      return null
    }

    case 'multi_select': {
      // 複数選択
      const multiOptions = config?.options as Array<{ value: string; label: string }> | undefined
      if (multiOptions && multiOptions.length > 0) {
        const count = faker.number.int({ min: 1, max: Math.min(3, multiOptions.length) })
        return faker.helpers.arrayElements(multiOptions, count).map(o => o.value)
      }
      return []
    }

    case 'email':
      // シナリオに応じたメールアドレス
      if (currentScenario === 'legal') {
        const person = faker.helpers.arrayElement([...legalOfficeScenario.staff, ...legalOfficeScenario.clients])
        return person.email
      } else if (currentScenario === 'tech') {
        const member = faker.helpers.arrayElement(techCompanyScenario.team)
        const nameParts = member.name.split(' ')
        const lastName = nameParts[nameParts.length - 1] ?? 'user'
        return `${lastName.toLowerCase()}@tech-company.jp`
      }
      return faker.internet.email()

    case 'url':
      // URL
      return faker.internet.url()

    case 'file': {
      // ファイル（メタデータのみ）
      return {
        name: `${faker.system.fileName()}.${faker.system.fileExt()}`,
        size: faker.number.int({ min: 1024, max: 10485760 }),
        type: faker.system.mimeType(),
        url: faker.image.url()
      }
    }

    default:
      return null
  }
}

/**
 * レコードを生成
 */
export function generateRecord(
  tableId: string,
  properties: Record<string, PropertyDefinitionDto>,
  position: number,
  scenario?: 'legal' | 'tech' | 'general'
): RecordResponse {
  // シナリオインデックスを更新
  scenarioIndex = position
  if (scenario) {
    setScenario(scenario)
  }
  const data: Record<string, unknown> = {}

  // 各プロパティの値を生成
  Object.entries(properties).forEach(([key, property]) => {
    // 必須フィールドは必ず値を生成、オプショナルは70%の確率で生成
    if (property.required || faker.datatype.boolean({ probability: 0.7 })) {
      data[key] = generateValueForProperty(property)
    }
  })

  return {
    id: getRecordId(tableId, position),
    tableId,
    data,
    position,
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString()
  }
}

/**
 * テーブル定義のサンプルを生成
 */
export function generateSampleTables(workspaceId: string = 'workspace-1'): TableResponse[] {
  const now = new Date().toISOString()
  
  // 法律事務所ワークスペースかどうかチェック
  const isLegalWorkspace = workspaceId === MOCK_WORKSPACE_IDS.LEGAL_1 || workspaceId === MOCK_WORKSPACE_IDS.LEGAL_2

  const tables: TableResponse[] = [
    // 1. タスク管理テーブル
    {
      id: 'table-tasks',
      workspaceId,
      name: 'タスク管理',
      description: 'プロジェクトのタスク管理テーブル',
      icon: '📋',
      color: '#3B82F6',
      properties: {
        title: {
          key: 'title',
          type: 'text',
          displayName: 'タイトル',
          required: true
        },
        description: {
          key: 'description',
          type: 'long_text',
          displayName: '説明',
          required: false
        },
        status: {
          key: 'status',
          type: 'select',
          displayName: 'ステータス',
          required: true,
          config: {
            options: [
              { value: 'todo', label: '未着手' },
              { value: 'in_progress', label: '進行中' },
              { value: 'review', label: 'レビュー中' },
              { value: 'done', label: '完了' }
            ]
          }
        },
        priority: {
          key: 'priority',
          type: 'select',
          displayName: '優先度',
          required: false,
          config: {
            options: [
              { value: 'low', label: '低' },
              { value: 'medium', label: '中' },
              { value: 'high', label: '高' },
              { value: 'urgent', label: '緊急' }
            ]
          }
        },
        assignee: {
          key: 'assignee',
          type: 'text',
          displayName: '担当者',
          required: false
        },
        due_date: {
          key: 'due_date',
          type: 'date',
          displayName: '期限',
          required: false
        },
        progress: {
          key: 'progress',
          type: 'number',
          displayName: '進捗率',
          required: false
        },
        tags: {
          key: 'tags',
          type: 'multi_select',
          displayName: 'タグ',
          required: false,
          config: {
            options: [
              { value: 'bug', label: 'バグ' },
              { value: 'feature', label: '機能' },
              { value: 'improvement', label: '改善' },
              { value: 'documentation', label: 'ドキュメント' }
            ]
          }
        },
        completed: {
          key: 'completed',
          type: 'checkbox',
          displayName: '完了',
          required: false
        }
      },
      propertyOrder: ['title', 'status', 'priority', 'assignee', 'due_date', 'progress', 'tags', 'description', 'completed'],
      createdAt: now,
      updatedAt: now
    },

    // 2. 顧客管理テーブル
    {
      id: 'table-customers',
      workspaceId,
      name: '顧客管理',
      description: 'CRM - 顧客情報管理',
      icon: '👥',
      color: '#10B981',
      properties: {
        company_name: {
          key: 'company_name',
          type: 'text',
          displayName: '会社名',
          required: true
        },
        contact_name: {
          key: 'contact_name',
          type: 'text',
          displayName: '担当者名',
          required: true
        },
        email: {
          key: 'email',
          type: 'email',
          displayName: 'メールアドレス',
          required: true
        },
        phone: {
          key: 'phone',
          type: 'text',
          displayName: '電話番号',
          required: false
        },
        website: {
          key: 'website',
          type: 'url',
          displayName: 'Webサイト',
          required: false
        },
        industry: {
          key: 'industry',
          type: 'select',
          displayName: '業界',
          required: false,
          config: {
            options: [
              { value: 'tech', label: 'IT・テクノロジー' },
              { value: 'finance', label: '金融' },
              { value: 'retail', label: '小売' },
              { value: 'manufacturing', label: '製造業' },
              { value: 'healthcare', label: 'ヘルスケア' },
              { value: 'other', label: 'その他' }
            ]
          }
        },
        annual_revenue: {
          key: 'annual_revenue',
          type: 'number',
          displayName: '年間売上',
          required: false,
          config: {
            min: 1000000,
            max: 100000000000
          }
        },
        employee_count: {
          key: 'employee_count',
          type: 'number',
          displayName: '従業員数',
          required: false,
          config: {
            min: 1,
            max: 100000
          }
        },
        notes: {
          key: 'notes',
          type: 'long_text',
          displayName: '備考',
          required: false
        },
        last_contact: {
          key: 'last_contact',
          type: 'datetime',
          displayName: '最終連絡日時',
          required: false
        },
        is_active: {
          key: 'is_active',
          type: 'checkbox',
          displayName: 'アクティブ',
          required: false
        }
      },
      propertyOrder: ['company_name', 'contact_name', 'email', 'phone', 'website', 'industry', 'annual_revenue', 'employee_count', 'last_contact', 'is_active', 'notes'],
      createdAt: now,
      updatedAt: now
    },

    // 3. 経費管理テーブル（法律事務所用または汎用）
    isLegalWorkspace 
      ? generateLegalExpenseTable(workspaceId)
      : {
          id: 'table-expenses',
          workspaceId,
          name: '経費管理',
          description: '経費精算と予算管理',
          icon: '💰',
          color: '#F59E0B',
          properties: {
            expense_date: {
              key: 'expense_date',
              type: 'date',
              displayName: '支出日',
              required: true
            },
            category: {
              key: 'category',
              type: 'select',
              displayName: 'カテゴリー',
              required: true,
              config: {
                options: [
                  { value: 'travel', label: '交通費' },
                  { value: 'meal', label: '飲食費' },
                  { value: 'accommodation', label: '宿泊費' },
                  { value: 'office', label: '事務用品' },
                  { value: 'software', label: 'ソフトウェア' },
                  { value: 'other', label: 'その他' }
                ]
              }
            },
            amount: {
              key: 'amount',
              type: 'number',
              displayName: '金額',
              required: true,
              config: {
                min: 0,
                max: 10000000
              }
            },
            description: {
              key: 'description',
              type: 'text',
              displayName: '内容',
              required: true
            },
            receipt: {
              key: 'receipt',
              type: 'file',
              displayName: '領収書',
              required: false
            },
            approved: {
              key: 'approved',
              type: 'checkbox',
              displayName: '承認済み',
              required: false
            },
            project_id: {
              key: 'project_id',
              type: 'text',
              displayName: 'プロジェクト',
              required: false
            },
            memo: {
              key: 'memo',
              type: 'long_text',
              displayName: 'メモ',
              required: false
            }
          },
          propertyOrder: ['expense_date', 'category', 'amount', 'description', 'receipt', 'project_id', 'approved', 'memo'],
          createdAt: now,
          updatedAt: now
        },

    // 4. 在庫管理テーブル
    {
      id: 'table-inventory',
      workspaceId,
      name: '在庫管理',
      description: '商品在庫の管理',
      icon: '📦',
      color: '#8B5CF6',
      properties: {
        product_code: {
          key: 'product_code',
          type: 'text',
          displayName: '商品コード',
          required: true
        },
        product_name: {
          key: 'product_name',
          type: 'text',
          displayName: '商品名',
          required: true
        },
        quantity: {
          key: 'quantity',
          type: 'number',
          displayName: '在庫数',
          required: true,
          config: {
            min: 0,
            max: 99999
          }
        },
        unit_price: {
          key: 'unit_price',
          type: 'number',
          displayName: '単価',
          required: true
        },
        reorder_point: {
          key: 'reorder_point',
          type: 'number',
          displayName: '発注点',
          required: false,
          config: {
            min: 0,
            max: 1000
          }
        },
        supplier: {
          key: 'supplier',
          type: 'text',
          displayName: '仕入先',
          required: false
        },
        location: {
          key: 'location',
          type: 'text',
          displayName: '保管場所',
          required: false
        },
        last_restocked: {
          key: 'last_restocked',
          type: 'date',
          displayName: '最終入荷日',
          required: false
        },
        metadata: {
          key: 'metadata',
          type: 'text',
          displayName: 'メタデータ',
          required: false
        }
      },
      propertyOrder: ['product_code', 'product_name', 'quantity', 'unit_price', 'reorder_point', 'supplier', 'location', 'last_restocked', 'metadata'],
      createdAt: now,
      updatedAt: now
    },

    // 5. イベント管理テーブル
    {
      id: 'table-events',
      workspaceId,
      name: 'イベント管理',
      description: 'イベント・会議の管理',
      icon: '📅',
      color: '#EC4899',
      properties: {
        event_name: {
          key: 'event_name',
          type: 'text',
          displayName: 'イベント名',
          required: true
        },
        event_date: {
          key: 'event_date',
          type: 'date',
          displayName: '開催日',
          required: true
        },
        start_time: {
          key: 'start_time',
          type: 'datetime',
          displayName: '開始時刻',
          required: true
        },
        end_time: {
          key: 'end_time',
          type: 'datetime',
          displayName: '終了時刻',
          required: true
        },
        location: {
          key: 'location',
          type: 'text',
          displayName: '場所',
          required: false
        },
        online_url: {
          key: 'online_url',
          type: 'url',
          displayName: 'オンラインURL',
          required: false
        },
        attendees: {
          key: 'attendees',
          type: 'multi_select',
          displayName: '参加者',
          required: false,
          config: {
            options: [
              { value: 'team_a', label: 'チームA' },
              { value: 'team_b', label: 'チームB' },
              { value: 'management', label: '経営陣' },
              { value: 'external', label: '外部' }
            ]
          }
        },
        agenda: {
          key: 'agenda',
          type: 'long_text',
          displayName: 'アジェンダ',
          required: false
        },
        is_recurring: {
          key: 'is_recurring',
          type: 'checkbox',
          displayName: '定期開催',
          required: false
        }
      },
      propertyOrder: ['event_name', 'event_date', 'start_time', 'end_time', 'location', 'online_url', 'attendees', 'is_recurring', 'agenda'],
      createdAt: now,
      updatedAt: now
    }
  ]
  
  return tables
}

/**
 * 複数のレコードを一括生成
 */
export function generateRecords(
  tableId: string,
  properties: Record<string, PropertyDefinitionDto>,
  count: number
): RecordResponse[] {
  const records: RecordResponse[] = []
  for (let i = 0; i < count; i++) {
    records.push(generateRecord(tableId, properties, i))
  }
  return records
}

/**
 * モックデータセット全体を生成
 */
export function generateMockDataset(scenario?: 'legal' | 'tech' | 'general', workspaceId?: string): {
  tables: TableResponse[]
  records: Record<string, RecordResponse[]>
} {
  // シナリオを設定（デフォルトは'general'）
  const selectedScenario = scenario || 'general'
  setScenario(selectedScenario)
  
  // workspaceIdを決定
  let wsId = workspaceId
  if (!wsId) {
    if (selectedScenario === 'legal') {
      wsId = 'workspace-legal-1'
    } else if (selectedScenario === 'tech') {
      wsId = 'workspace-tech-1'
    } else {
      wsId = 'workspace-consulting-1'
    }
  }
  
  const tables = generateSampleTables(wsId)
  const records: Record<string, RecordResponse[]> = {}

  // シナリオに応じたレコード数を設定
  const recordCounts: Record<string, number> = {
    legal: 30,  // 法律事務所は案件中心なので少なめ
    tech: 100,  // IT企業はタスクが多いので多め
    general: 50 // 一般的な数
  }
  
  const recordCount = recordCounts[selectedScenario]

  // 各テーブルにシナリオベースのレコードを生成
  tables.forEach(table => {
    if (table.properties && table.id) {
      records[table.id] = generateRecords(table.id, table.properties, recordCount ?? 20)
    }
  })

  return { tables, records }
}