/**
 * 法律事務所向けシナリオデータ
 * 実際の法律事務所の業務フローに基づいたリアルなデータセット
 */

export const legalOfficeScenario = {
  name: '法律事務所テンプレート',
  description: '法律事務所向けの案件管理・顧客管理システム',
  
  // クライアント企業・個人
  clients: [
    { name: '株式会社山田製作所', type: '法人', industry: '製造業', contact: '山田太郎', email: 'yamada@yamada-mfg.co.jp' },
    { name: '田中商事株式会社', type: '法人', industry: '卸売業', contact: '田中次郎', email: 'tanaka@tanaka-corp.jp' },
    { name: 'ABCテクノロジー株式会社', type: '法人', industry: 'IT', contact: '鈴木花子', email: 'suzuki@abc-tech.jp' },
    { name: '佐藤建設株式会社', type: '法人', industry: '建設業', contact: '佐藤健一', email: 'sato@sato-const.co.jp' },
    { name: '高橋物流株式会社', type: '法人', industry: '物流', contact: '高橋美咲', email: 'takahashi@takahashi-log.jp' },
    { name: '渡辺不動産', type: '法人', industry: '不動産', contact: '渡辺誠', email: 'watanabe@watanabe-re.jp' },
    { name: '伊藤太郎', type: '個人', industry: '-', contact: '伊藤太郎', email: 'ito.taro@example.com' },
    { name: '加藤花子', type: '個人', industry: '-', contact: '加藤花子', email: 'kato.hanako@example.com' }
  ],
  
  // 案件タイプと典型的なタイトル
  cases: [
    // 企業法務
    { 
      title: '株式会社山田製作所 - 販売代理店契約書作成',
      type: '契約書作成',
      status: '進行中',
      client: '株式会社山田製作所',
      fee: 300000,
      description: '新規販売代理店との契約書作成。独占販売権、テリトリー、最低購入数量などの条項を含む。'
    },
    {
      title: '田中商事株式会社 - 業務委託契約レビュー',
      type: '契約書レビュー',
      status: '進行中',
      client: '田中商事株式会社',
      fee: 150000,
      description: 'IT システム開発の業務委託契約書のレビュー。瑕疵担保責任、知的財産権の帰属について重点的に確認。'
    },
    {
      title: 'ABCテクノロジー - SaaS利用規約作成',
      type: '規約作成',
      status: '完了',
      client: 'ABCテクノロジー株式会社',
      fee: 500000,
      description: 'BtoB SaaSサービスの利用規約、プライバシーポリシー、SLAの作成。'
    },
    
    // M&A・投資
    {
      title: '佐藤建設 - 企業買収デューデリジェンス',
      type: 'M&A',
      status: '進行中',
      client: '佐藤建設株式会社',
      fee: 2000000,
      description: '建設会社買収に伴う法務デューデリジェンス。労務、コンプライアンス、契約関係の精査。'
    },
    
    // 労働法務
    {
      title: '高橋物流 - 就業規則改定',
      type: '労働法務',
      status: '進行中',
      client: '高橋物流株式会社',
      fee: 400000,
      description: '働き方改革に対応した就業規則の全面改定。テレワーク規程、副業規程の新設。'
    },
    {
      title: '山田製作所 - 労働紛争対応',
      type: '紛争解決',
      status: '調査中',
      client: '株式会社山田製作所',
      fee: 800000,
      description: '元従業員からの不当解雇申立への対応。労働審判の準備。'
    },
    
    // 不動産関連
    {
      title: '渡辺不動産 - 不動産売買契約書作成',
      type: '不動産',
      status: '完了',
      client: '渡辺不動産',
      fee: 250000,
      description: '商業ビル売買に関する契約書作成。瑕疵担保責任、表明保証条項を詳細に規定。'
    },
    
    // 個人案件
    {
      title: '伊藤太郎様 - 相続手続き支援',
      type: '相続',
      status: '進行中',
      client: '伊藤太郎',
      fee: 600000,
      description: '遺産分割協議書の作成、相続税申告のサポート。不動産3件、預貯金、有価証券を含む。'
    },
    {
      title: '加藤花子様 - 離婚協議書作成',
      type: '家事',
      status: '完了',
      client: '加藤花子',
      fee: 200000,
      description: '協議離婚に伴う離婚協議書、財産分与、養育費に関する合意書の作成。'
    }
  ],
  
  // タスクテンプレート
  taskTemplates: {
    '契約書作成': [
      'クライアントヒアリング',
      '契約条件の整理',
      '契約書ドラフト作成',
      '内部レビュー',
      'クライアントへの説明',
      '修正対応',
      '最終版作成',
      '締結サポート'
    ],
    'デューデリジェンス': [
      '資料リスト作成',
      '開示資料の受領',
      '契約書レビュー',
      '法的リスクの分析',
      'レポート作成',
      'クライアント報告',
      'Q&A対応',
      '最終報告書提出'
    ],
    '紛争解決': [
      '事実関係の整理',
      '証拠収集',
      '法的論点の検討',
      '相手方との交渉',
      '和解案の検討',
      '訴状・答弁書作成',
      '口頭弁論準備',
      '和解・判決対応'
    ]
  },
  
  // 経費カテゴリ
  expenseCategories: [
    { id: 'transport', name: '交通費', typical: [3000, 15000] },
    { id: 'copy', name: '印刷・コピー代', typical: [500, 5000] },
    { id: 'postage', name: '郵送費', typical: [1000, 3000] },
    { id: 'court', name: '裁判所費用', typical: [10000, 50000] },
    { id: 'research', name: '調査費用', typical: [5000, 30000] },
    { id: 'expert', name: '専門家費用', typical: [50000, 200000] },
    { id: 'travel', name: '出張費', typical: [20000, 100000] },
    { id: 'meal', name: '会議費', typical: [3000, 20000] }
  ],
  
  // スタッフ
  staff: [
    { name: '弁護士 高橋', role: 'パートナー弁護士', email: 'takahashi@law-firm.jp' },
    { name: '弁護士 山本', role: 'アソシエイト弁護士', email: 'yamamoto@law-firm.jp' },
    { name: '弁護士 中村', role: 'アソシエイト弁護士', email: 'nakamura@law-firm.jp' },
    { name: 'パラリーガル 佐々木', role: 'パラリーガル', email: 'sasaki@law-firm.jp' },
    { name: '事務 田中', role: '事務スタッフ', email: 'tanaka@law-firm.jp' }
  ],
  
  // 進捗ステータス
  statuses: [
    { value: 'new', label: '新規受任', progress: 0 },
    { value: 'investigation', label: '調査中', progress: 20 },
    { value: 'drafting', label: '書面作成中', progress: 40 },
    { value: 'review', label: 'レビュー中', progress: 60 },
    { value: 'negotiation', label: '交渉中', progress: 70 },
    { value: 'finalization', label: '最終調整', progress: 90 },
    { value: 'completed', label: '完了', progress: 100 },
    { value: 'on_hold', label: '保留', progress: null }
  ]
}