/**
 * IT企業向けシナリオデータ
 * SaaS開発企業の実際の業務フローに基づいたリアルなデータセット
 */

export const techCompanyScenario = {
  name: 'テクノロジー企業テンプレート',
  description: 'SaaS開発企業向けのプロジェクト管理・開発管理システム',
  
  // プロジェクト
  projects: [
    {
      name: 'Customer Portal v2.0',
      client: '内部プロジェクト',
      status: '開発中',
      startDate: '2024-10-01',
      endDate: '2025-03-31',
      budget: 15000000,
      description: '顧客向けポータルサイトの大型アップデート。UI/UX全面刷新、パフォーマンス改善。'
    },
    {
      name: 'API Gateway構築',
      client: '株式会社ABCコーポレーション',
      status: '設計中',
      startDate: '2024-11-15',
      endDate: '2025-02-28',
      budget: 8000000,
      description: 'マイクロサービス間の統合APIゲートウェイ構築。認証・認可、レート制限機能を含む。'
    },
    {
      name: 'モバイルアプリ開発',
      client: 'XYZ株式会社',
      status: '開発中',
      startDate: '2024-09-01',
      endDate: '2025-01-31',
      budget: 12000000,
      description: 'iOS/Android対応のネイティブアプリ開発。React Native使用。'
    },
    {
      name: 'AI機能実装',
      client: '内部プロジェクト',
      status: 'リサーチ中',
      startDate: '2024-12-01',
      endDate: '2025-06-30',
      budget: 20000000,
      description: 'ChatGPT APIを活用した自動応答機能、レコメンデーション機能の実装。'
    },
    {
      name: 'レガシーシステム移行',
      client: '田中商事株式会社',
      status: 'テスト中',
      startDate: '2024-07-01',
      endDate: '2024-12-31',
      budget: 25000000,
      description: 'オンプレミスシステムからクラウド（AWS）への完全移行。'
    }
  ],
  
  // 開発タスク
  tasks: [
    // フロントエンド
    { title: 'ログイン画面のUI改善', type: 'frontend', priority: 'high', points: 5 },
    { title: 'ダッシュボードのレスポンシブ対応', type: 'frontend', priority: 'medium', points: 8 },
    { title: 'グラフコンポーネントの実装', type: 'frontend', priority: 'medium', points: 13 },
    { title: 'フォームバリデーション強化', type: 'frontend', priority: 'low', points: 3 },
    { title: 'アクセシビリティ対応', type: 'frontend', priority: 'medium', points: 8 },
    
    // バックエンド
    { title: 'REST API エンドポイント追加', type: 'backend', priority: 'high', points: 5 },
    { title: 'データベースインデックス最適化', type: 'backend', priority: 'high', points: 8 },
    { title: 'キャッシュ機構の実装', type: 'backend', priority: 'medium', points: 13 },
    { title: 'バッチ処理の並列化', type: 'backend', priority: 'low', points: 21 },
    { title: 'ログ収集システム構築', type: 'backend', priority: 'medium', points: 8 },
    
    // インフラ
    { title: 'CI/CDパイプライン構築', type: 'infra', priority: 'high', points: 13 },
    { title: 'Kubernetes設定最適化', type: 'infra', priority: 'medium', points: 8 },
    { title: '監視アラート設定', type: 'infra', priority: 'high', points: 5 },
    { title: 'バックアップ自動化', type: 'infra', priority: 'high', points: 8 },
    
    // バグ修正
    { title: 'ログイン後のリダイレクト不具合', type: 'bug', priority: 'urgent', points: 3 },
    { title: 'メモリリーク調査・修正', type: 'bug', priority: 'high', points: 13 },
    { title: 'エラーメッセージの文言修正', type: 'bug', priority: 'low', points: 1 },
    
    // セキュリティ
    { title: 'SQLインジェクション対策', type: 'security', priority: 'urgent', points: 8 },
    { title: 'パスワードポリシー強化', type: 'security', priority: 'high', points: 5 },
    { title: 'ペネトレーションテスト実施', type: 'security', priority: 'medium', points: 21 }
  ],
  
  // スプリント
  sprints: [
    { name: 'Sprint 23', startDate: '2024-11-18', endDate: '2024-12-01', goal: 'ユーザー認証機能の完成' },
    { name: 'Sprint 24', startDate: '2024-12-02', endDate: '2024-12-15', goal: 'API Gateway基本機能実装' },
    { name: 'Sprint 25', startDate: '2024-12-16', endDate: '2024-12-29', goal: 'パフォーマンス改善' },
    { name: 'Sprint 26', startDate: '2025-01-06', endDate: '2025-01-19', goal: 'モバイルアプリβ版リリース' }
  ],
  
  // チームメンバー
  team: [
    { name: '開発部長 山田', role: 'エンジニアリングマネージャー', skills: ['アーキテクチャ', 'マネジメント'] },
    { name: 'シニアエンジニア 鈴木', role: 'テックリード', skills: ['Node.js', 'AWS', 'Docker'] },
    { name: 'エンジニア 田中', role: 'フルスタックエンジニア', skills: ['React', 'TypeScript', 'PostgreSQL'] },
    { name: 'エンジニア 佐藤', role: 'バックエンドエンジニア', skills: ['Go', 'gRPC', 'Kubernetes'] },
    { name: 'エンジニア 高橋', role: 'フロントエンドエンジニア', skills: ['Vue.js', 'CSS', 'Figma'] },
    { name: 'エンジニア 渡辺', role: 'モバイルエンジニア', skills: ['React Native', 'Swift', 'Kotlin'] },
    { name: 'SRE 伊藤', role: 'サイト信頼性エンジニア', skills: ['Terraform', 'Prometheus', 'Grafana'] },
    { name: 'QA 加藤', role: 'QAエンジニア', skills: ['Selenium', 'Jest', 'Cypress'] },
    { name: 'デザイナー 中村', role: 'UIデザイナー', skills: ['Figma', 'Adobe XD', 'Illustrator'] },
    { name: 'PM 山本', role: 'プロダクトマネージャー', skills: ['Jira', 'Confluence', 'スクラム'] }
  ],
  
  // 経費カテゴリ
  expenseCategories: [
    { id: 'software', name: 'ソフトウェアライセンス', typical: [5000, 50000] },
    { id: 'cloud', name: 'クラウドサービス', typical: [10000, 200000] },
    { id: 'equipment', name: '開発機材', typical: [50000, 300000] },
    { id: 'training', name: '研修・セミナー', typical: [10000, 100000] },
    { id: 'books', name: '技術書籍', typical: [3000, 10000] },
    { id: 'conference', name: 'カンファレンス参加費', typical: [30000, 150000] },
    { id: 'outsource', name: '外注費', typical: [100000, 1000000] },
    { id: 'meal', name: 'チームビルディング', typical: [5000, 50000] }
  ],
  
  // ステータス
  taskStatuses: [
    { value: 'backlog', label: 'バックログ', progress: 0 },
    { value: 'todo', label: 'TODO', progress: 0 },
    { value: 'in_progress', label: '作業中', progress: 50 },
    { value: 'review', label: 'レビュー中', progress: 75 },
    { value: 'testing', label: 'テスト中', progress: 90 },
    { value: 'done', label: '完了', progress: 100 },
    { value: 'blocked', label: 'ブロック中', progress: null }
  ],
  
  // 技術スタック
  techStack: [
    'TypeScript', 'React', 'Next.js', 'Node.js', 'Express',
    'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS',
    'GitHub Actions', 'Terraform', 'Datadog', 'Sentry'
  ],
  
  // バグの優先度
  priorities: [
    { value: 'urgent', label: '緊急', color: '#FF4444' },
    { value: 'high', label: '高', color: '#FF8800' },
    { value: 'medium', label: '中', color: '#FFBB33' },
    { value: 'low', label: '低', color: '#99CC00' }
  ]
}