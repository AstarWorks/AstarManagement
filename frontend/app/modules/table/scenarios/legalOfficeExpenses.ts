/**
 * 法律事務所向け経費管理テーブル
 * 実際の法律事務所の会計実務に基づいた構造とデータ
 */

import type { TableResponse, RecordResponse } from '../types'
import { getRecordId } from '../../mock/constants/mockIds'

/**
 * 法律事務所向け経費管理テーブル定義
 */
export function generateLegalExpenseTable(workspaceId: string): TableResponse {
  const now = new Date().toISOString()
  
  return {
    id: 'table-legal-expenses',
    workspaceId,
    name: '経費管理',
    description: '法律事務所の収支管理台帳',
    icon: '💰',
    color: '#F59E0B',
    properties: {
      payment_date: {
        key: 'payment_date',
        type: 'date',
        displayName: '支払日',
        required: true
      },
      account_title: {
        key: 'account_title',
        type: 'select',
        displayName: '科目',
        required: true,
        config: {
          options: [
            // 収入科目（緑系）
            { value: 'consulting_fee', label: '顧問料', color: '#10B981' },
            { value: 'retainer_fee', label: '着手金', color: '#16A34A' },
            { value: 'success_fee', label: '成功報酬', color: '#059669' },
            { value: 'consultation_fee', label: '相談料', color: '#047857' },
            { value: 'document_fee', label: '書類作成料', color: '#065F46' },
            { value: 'other_income', label: 'その他収入', color: '#064E3B' },
            // 支出科目（赤・オレンジ系）
            { value: 'court_fee', label: '裁判所費用', color: '#EF4444' },
            { value: 'transportation', label: '交通費', color: '#F97316' },
            { value: 'communication', label: '通信費', color: '#DC2626' },
            { value: 'office_supplies', label: '事務用品費', color: '#EA580C' },
            { value: 'expert_fee', label: '専門家費用', color: '#B91C1C' },
            { value: 'copy_printing', label: '印刷・コピー代', color: '#C2410C' },
            { value: 'postage', label: '郵送費', color: '#991B1B' },
            { value: 'meeting_expense', label: '会議費', color: '#9A3412' },
            { value: 'travel_expense', label: '出張費', color: '#7C2D12' },
            { value: 'research_fee', label: '調査費用', color: '#92400E' },
            { value: 'other_expense', label: 'その他支出', color: '#78350F' }
          ]
        }
      },
      description: {
        key: 'description',
        type: 'text',
        displayName: '摘要',
        required: true
      },
      income_amount: {
        key: 'income_amount',
        type: 'number',
        displayName: '収入金額',
        required: false,
        config: {
          min: 0,
          max: 100000000
        }
      },
      expense_amount: {
        key: 'expense_amount',
        type: 'number',
        displayName: '支払金額',
        required: false,
        config: {
          min: 0,
          max: 100000000
        }
      },
      balance: {
        key: 'balance',
        type: 'number',
        displayName: '差引残高',
        required: false,
        config: {
          min: -100000000,
          max: 100000000
        }
      }
    },
    propertyOrder: ['payment_date', 'account_title', 'description', 'income_amount', 'expense_amount', 'balance'],
    createdAt: now,
    updatedAt: now
  }
}

/**
 * 法律事務所向け経費レコード生成
 */
export function generateLegalExpenseRecords(tableId: string, count: number = 30): RecordResponse[] {
  const records: RecordResponse[] = []
  let balance = 5000000 // 初期残高500万円
  
  // 日付を過去3ヶ月から生成
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 3)
  
  // 典型的な取引パターン
  const transactions = [
    // 収入パターン
    { 
      type: 'income',
      account: 'consulting_fee',
      descriptions: [
        '株式会社山田製作所 顧問料（12月分）',
        '田中商事株式会社 顧問料（12月分）',
        'ABCテクノロジー株式会社 顧問料（12月分）'
      ],
      amount: [200000, 300000]
    },
    {
      type: 'income',
      account: 'retainer_fee',
      descriptions: [
        '佐藤建設株式会社 M&A案件着手金',
        '高橋物流株式会社 労働紛争着手金',
        '渡辺不動産 契約書作成着手金'
      ],
      amount: [500000, 1000000]
    },
    {
      type: 'income',
      account: 'consultation_fee',
      descriptions: [
        '新規相談 伊藤太郎様（相続問題）',
        '新規相談 加藤花子様（離婚協議）',
        'スポット相談 株式会社ABC（契約書レビュー）'
      ],
      amount: [30000, 50000]
    },
    {
      type: 'income',
      account: 'document_fee',
      descriptions: [
        '契約書作成料 販売代理店契約',
        '就業規則改定 作成料',
        '離婚協議書 作成料'
      ],
      amount: [100000, 300000]
    },
    // 支出パターン
    {
      type: 'expense',
      account: 'court_fee',
      descriptions: [
        '東京地方裁判所 印紙代（訴訟提起）',
        '東京家庭裁判所 申立手数料',
        '登記事項証明書取得費用'
      ],
      amount: [10000, 60000]
    },
    {
      type: 'expense',
      account: 'transportation',
      descriptions: [
        'クライアント訪問 交通費（山田製作所）',
        '裁判所出廷 交通費',
        '現地調査 交通費（不動産案件）'
      ],
      amount: [2000, 15000]
    },
    {
      type: 'expense',
      account: 'expert_fee',
      descriptions: [
        '公認会計士 意見書作成費用',
        '不動産鑑定士 鑑定費用',
        '司法書士 登記費用'
      ],
      amount: [50000, 200000]
    },
    {
      type: 'expense',
      account: 'office_supplies',
      descriptions: [
        '事務用品購入（文具類）',
        'プリンタートナー購入',
        '法律書籍購入'
      ],
      amount: [5000, 30000]
    },
    {
      type: 'expense',
      account: 'copy_printing',
      descriptions: [
        '訴状コピー代（30部）',
        '契約書印刷費用',
        '資料複写費用'
      ],
      amount: [1000, 10000]
    },
    {
      type: 'expense',
      account: 'postage',
      descriptions: [
        '内容証明郵便 送付費用',
        '書類送付費用（レターパック）',
        '裁判所提出書類 郵送費'
      ],
      amount: [1500, 5000]
    },
    {
      type: 'expense',
      account: 'meeting_expense',
      descriptions: [
        'クライアント会議費（会議室・茶菓子）',
        '専門家打合せ 会議費',
        '和解協議 会議室使用料'
      ],
      amount: [3000, 20000]
    }
  ]
  
  // レコード生成
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + Math.floor(i * 90 / count)) // 3ヶ月間に分散
    
    // 取引タイプをランダムに選択（収入30%、支出70%の確率）
    const isIncome = Math.random() < 0.3
    const transactionType = isIncome ? 'income' : 'expense'
    const availableTransactions = transactions.filter(t => t.type === transactionType)
    const transactionIndex = Math.floor(Math.random() * availableTransactions.length)
    const transaction = availableTransactions[transactionIndex]
    if (!transaction || !transaction.descriptions || !transaction.amount) continue
    
    const descriptionIndex = Math.floor(Math.random() * transaction.descriptions.length)
    const description = transaction.descriptions[descriptionIndex] || ''
    const minAmount = transaction.amount[0] || 0
    const maxAmount = transaction.amount[1] || minAmount
    const amount = minAmount + Math.floor(Math.random() * (maxAmount - minAmount))
    
    // 残高計算
    if (isIncome) {
      balance += amount
    } else {
      balance -= amount
    }
    
    const record: RecordResponse = {
      id: getRecordId(tableId, i),
      tableId,
      data: {
        payment_date: date.toISOString().split('T')[0],
        account_title: transaction?.account || '',
        description,
        income_amount: isIncome ? amount : null,
        expense_amount: !isIncome ? amount : null,
        balance
      },
      createdAt: date.toISOString(),
      updatedAt: date.toISOString()
    }
    
    records.push(record)
  }
  
  // 日付順にソート
  records.sort((a, b) => {
    const dateA = new Date(a.data?.payment_date as string)
    const dateB = new Date(b.data?.payment_date as string)
    return dateA.getTime() - dateB.getTime()
  })
  
  // ソート後に残高を再計算
  let runningBalance = 5000000
  records.forEach(record => {
    const income = record.data?.income_amount as number || 0
    const expense = record.data?.expense_amount as number || 0
    runningBalance = runningBalance + income - expense
    record.data = {
      ...record.data,
      balance: runningBalance
    }
  })
  
  return records
}