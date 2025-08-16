/**
 * Mock Case Data
 * 開発・テスト用のモックデータ
 * 本番環境ではAPIから取得
 */

import type { ICase } from '~/modules/case/types/case'

export const mockCases: ICase[] = [
  {
    id: '1',
    caseNumber: 'CASE-2024-001',
    title: '不動産売買契約トラブル',
    client: {
      id: '1',
      name: '田中太郎',
      type: 'individual'
    },
    status: 'new',
    priority: 'high',
    assignedLawyer: '佐藤弁護士',
    dueDate: '2024-08-15',
    tags: ['不動産', '契約'],
    createdAt: '2024-07-01',
    updatedAt: '2024-07-24'
  },
  {
    id: '2',
    caseNumber: 'CASE-2024-002',
    title: '企業買収案件',
    client: {
      id: '2', 
      name: 'ABC株式会社',
      type: 'corporate'
    },
    status: 'accepted',
    priority: 'medium',
    assignedLawyer: '山田弁護士',
    dueDate: '2024-09-30',
    tags: ['M&A', '企業法務'],
    createdAt: '2024-07-05',
    updatedAt: '2024-07-20'
  },
  {
    id: '3',
    caseNumber: 'CASE-2024-003',
    title: '労働争議調停',
    client: {
      id: '3',
      name: '鈴木花子',
      type: 'individual'
    },
    status: 'investigation',
    priority: 'high',
    assignedLawyer: '佐藤弁護士',
    dueDate: '2024-08-01',
    tags: ['労働法', '調停'],
    createdAt: '2024-06-15',
    updatedAt: '2024-07-22'
  },
  {
    id: '4',
    caseNumber: 'CASE-2024-004',
    title: '特許侵害訴訟',
    client: {
      id: '4',
      name: 'XYZ技術株式会社',
      type: 'corporate'
    },
    status: 'court',
    priority: 'high',
    assignedLawyer: '山田弁護士',
    dueDate: '2024-08-20',
    tags: ['知的財産', '特許'],
    createdAt: '2024-06-20',
    updatedAt: '2024-07-23'
  },
  {
    id: '5',
    caseNumber: 'CASE-2024-005',
    title: '離婚調停',
    client: {
      id: '5',
      name: '佐々木美香',
      type: 'individual'
    },
    status: 'mediation',
    priority: 'medium',
    assignedLawyer: '田中弁護士',
    dueDate: '2024-09-10',
    tags: ['家事', '調停'],
    createdAt: '2024-07-10',
    updatedAt: '2024-07-24'
  },
  {
    id: '6',
    caseNumber: 'CASE-2024-006',
    title: '債権回収案件',
    client: {
      id: '6',
      name: '金融サービス株式会社',
      type: 'corporate'
    },
    status: 'resolved',
    priority: 'low',
    assignedLawyer: '佐藤弁護士',
    dueDate: '2024-07-25',
    tags: ['債権', '民事'],
    createdAt: '2024-06-01',
    updatedAt: '2024-07-20'
  },
  {
    id: '7',
    caseNumber: 'CASE-2024-007',
    title: '商標登録申請',
    client: {
      id: '7',
      name: 'ブランド株式会社',
      type: 'corporate'
    },
    status: 'accepted',
    priority: 'low',
    assignedLawyer: '山田弁護士',
    dueDate: '2024-10-15',
    tags: ['知的財産', '商標'],
    createdAt: '2024-07-15',
    updatedAt: '2024-07-22'
  },
  {
    id: '8',
    caseNumber: 'CASE-2024-008',
    title: '労働契約違反',
    client: {
      id: '8',
      name: '高橋健一',
      type: 'individual'
    },
    status: 'investigation',
    priority: 'medium',
    assignedLawyer: '田中弁護士',
    dueDate: '2024-08-30',
    tags: ['労働法', '契約'],
    createdAt: '2024-07-18',
    updatedAt: '2024-07-24'
  },
  {
    id: '9',
    caseNumber: 'CASE-2024-009',
    title: '遺産相続争議',
    client: {
      id: '9',
      name: '伊藤家',
      type: 'individual'
    },
    status: 'new',
    priority: 'high',
    assignedLawyer: '佐藤弁護士',
    dueDate: '2024-09-05',
    tags: ['相続', '家事'],
    createdAt: '2024-07-20',
    updatedAt: '2024-07-24'
  },
  {
    id: '10',
    caseNumber: 'CASE-2024-010',
    title: 'システム開発契約紛争',
    client: {
      id: '10',
      name: 'ITソリューション株式会社',
      type: 'corporate'
    },
    status: 'negotiation',
    priority: 'medium',
    assignedLawyer: '山田弁護士',
    dueDate: '2024-09-20',
    tags: ['契約', 'IT'],
    createdAt: '2024-07-22',
    updatedAt: '2024-07-24'
  }
]

/**
 * 利用可能な弁護士のリスト（モック）
 */
export const mockLawyers = [
  { id: 'sato', name: '佐藤弁護士' },
  { id: 'yamada', name: '山田弁護士' },
  { id: 'tanaka', name: '田中弁護士' },
  { id: 'suzuki', name: '鈴木弁護士' },
  { id: 'watanabe', name: '渡辺弁護士' }
]

/**
 * 利用可能なタグのリスト（モック）
 */
export const mockTags = [
  '不動産', '契約', 'M&A', '企業法務', '労働法', '調停',
  '民事', '刑事', '家事', '知的財産', '税務', '国際',
  '特許', '商標', '相続', '債権', 'IT'
]