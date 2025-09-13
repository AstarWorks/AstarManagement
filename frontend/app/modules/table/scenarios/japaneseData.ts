/**
 * 日本のビジネスシーンで使用される現実的なデータ
 */

export const japaneseBusinessData = {
  // 日本人の姓名
  names: {
    lastNames: [
      '山田', '鈴木', '田中', '佐藤', '高橋', '渡辺', '伊藤', '中村',
      '小林', '加藤', '吉田', '山本', '森', '斎藤', '清水', '山口',
      '松本', '井上', '木村', '林', '斉藤', '西村', '太田', '藤田'
    ],
    firstNamesMale: [
      '太郎', '次郎', '健一', '隆', '誠', '浩', '健太', '大輔',
      '翔', '拓也', '和也', '直樹', '達也', '雄大', '健', '剛'
    ],
    firstNamesFemale: [
      '花子', '美咲', 'さくら', '愛', '優子', '美穂', '由美', '恵子',
      '真由美', '陽子', '直美', '智子', '裕子', '理恵', '美香', '綾'
    ]
  },
  
  // 日本企業名のパターン
  companyPatterns: [
    '{lastName}製作所',
    '{lastName}商事',
    '{lastName}工業',
    '{lastName}建設',
    '{lastName}不動産',
    '{lastName}物流',
    '{lastName}システム',
    '{lastName}ソリューションズ',
    '{lastName}テクノロジー',
    '{businessType}株式会社',
    '株式会社{businessType}',
    '{region}{businessType}'
  ],
  
  businessTypes: [
    'アドバンス', 'イノベーション', 'クリエイト', 'ネクスト',
    'フューチャー', 'グローバル', 'ユニバーサル', 'インターナショナル'
  ],
  
  regions: [
    '東京', '大阪', '名古屋', '福岡', '札幌', '仙台', '広島', '神戸',
    '横浜', '京都', '千葉', '埼玉', '関東', '関西', '東海', '九州'
  ],
  
  // 部署名
  departments: [
    '営業部', '開発部', '総務部', '人事部', '経理部', '企画部',
    'マーケティング部', '製造部', '品質管理部', '法務部', '広報部',
    'IT推進部', '経営企画部', '事業開発部', '研究開発部', 'DX推進部'
  ],
  
  // 役職
  positions: [
    '代表取締役', '専務取締役', '常務取締役', '取締役',
    '執行役員', '部長', '次長', '課長', '係長', '主任',
    'チームリーダー', 'マネージャー', 'シニアスタッフ', 'スタッフ'
  ],
  
  // プロジェクト名のパターン
  projectNames: [
    '{year}年度{department}{type}',
    '{client}向け{system}構築',
    '{product}{version}開発',
    '{region}{service}展開',
    '新{technology}導入プロジェクト'
  ],
  
  projectTypes: [
    '改革プロジェクト', '効率化プロジェクト', '統合プロジェクト',
    'DX推進', 'システム刷新', '業務改善', '品質向上'
  ],
  
  // 製品・サービス名
  products: [
    '販売管理システム', '在庫管理システム', '顧客管理システム',
    '生産管理システム', '人事管理システム', '会計システム',
    'ワークフローシステム', 'グループウェア', 'ECサイト',
    'モバイルアプリ', 'クラウドサービス', 'AIソリューション'
  ],
  
  // 業界
  industries: [
    '製造業', '卸売業', '小売業', '金融業', '不動産業', '建設業',
    'IT・通信業', '運輸業', '医療・福祉', '教育', 'サービス業',
    '飲食業', 'エンターテインメント', 'コンサルティング', '広告業'
  ],
  
  // 住所パターン
  addresses: [
    '{region}{district}{number}丁目{subNumber}番{buildingNumber}号',
    '{region}{area}{number}-{subNumber}-{buildingNumber}',
    '{prefecture}{city}{ward}{number}-{subNumber}'
  ],
  
  districts: [
    '中央', '港', '新宿', '文京', '台東', '墨田', '江東', '品川',
    '目黒', '大田', '世田谷', '渋谷', '中野', '杉並', '豊島', '北'
  ],
  
  // 電話番号パターン
  phonePatterns: [
    '03-{fourDigit}-{fourDigit}',  // 東京
    '06-{fourDigit}-{fourDigit}',  // 大阪
    '052-{threeDigit}-{fourDigit}', // 名古屋
    '092-{threeDigit}-{fourDigit}', // 福岡
    '090-{fourDigit}-{fourDigit}',  // 携帯
    '080-{fourDigit}-{fourDigit}'   // 携帯
  ],
  
  // 実際の取引でよく使われる用語
  businessTerms: {
    contracts: [
      '売買契約', '請負契約', '委任契約', '賃貸借契約', '使用貸借契約',
      '雇用契約', '業務委託契約', '秘密保持契約', 'ライセンス契約',
      '代理店契約', '販売店契約', '共同開発契約', '業務提携契約'
    ],
    
    payments: [
      '前払い', '後払い', '分割払い', '一括払い', '月末締め翌月払い',
      '月末締め翌々月払い', '納品後30日以内', '検収後支払い'
    ],
    
    deliveryTerms: [
      '即納', '受注後2週間', '受注後1ヶ月', '別途協議',
      '納期厳守', '分納可', '一括納品', '都度納品'
    ]
  },
  
  // 会議の種類
  meetingTypes: [
    '定例会議', '経営会議', '営業会議', '開発会議', 'プロジェクト会議',
    'キックオフミーティング', '進捗報告会', 'レビュー会議',
    '予算会議', '戦略会議', '全体会議', '部門会議'
  ],
  
  // タスクの優先度と現実的な対応
  taskPriorities: [
    { level: '緊急', responseTime: '即日対応', color: '#FF0000' },
    { level: '重要', responseTime: '3日以内', color: '#FF6600' },
    { level: '通常', responseTime: '1週間以内', color: '#0066FF' },
    { level: '低', responseTime: '2週間以内', color: '#666666' }
  ]
}

/**
 * 日本人の名前を生成
 */
export function generateJapaneseName(gender?: 'male' | 'female' | 'random'): { lastName: string; firstName: string; fullName: string } {
  const { names } = japaneseBusinessData
  const lastName = names.lastNames[Math.floor(Math.random() * names.lastNames.length)] ?? '山田'
  
  let firstName: string
  if (gender === 'male' || (gender === 'random' && Math.random() > 0.5)) {
    firstName = names.firstNamesMale[Math.floor(Math.random() * names.firstNamesMale.length)] ?? '太郎'
  } else {
    firstName = names.firstNamesFemale[Math.floor(Math.random() * names.firstNamesFemale.length)] ?? '花子'
  }
  
  return {
    lastName,
    firstName,
    fullName: `${lastName} ${firstName}`
  }
}

/**
 * 日本企業名を生成
 */
export function generateJapaneseCompanyName(): string {
  const { companyPatterns, names, businessTypes, regions } = japaneseBusinessData
  const pattern = companyPatterns[Math.floor(Math.random() * companyPatterns.length)] ?? '{lastName}株式会社'
  
  return pattern
    .replace('{lastName}', names.lastNames[Math.floor(Math.random() * names.lastNames.length)] ?? '山田')
    .replace('{businessType}', businessTypes[Math.floor(Math.random() * businessTypes.length)] ?? 'システム')
    .replace('{region}', regions[Math.floor(Math.random() * regions.length)] ?? '東京')
}

/**
 * 日本の電話番号を生成
 */
export function generateJapanesePhoneNumber(): string {
  const patterns = japaneseBusinessData.phonePatterns
  const pattern = patterns[Math.floor(Math.random() * patterns.length)] ?? '03-{fourDigit}-{fourDigit}'
  
  return pattern
    .replace('{threeDigit}', Math.floor(Math.random() * 900 + 100).toString())
    .replace(/{fourDigit}/g, () => Math.floor(Math.random() * 9000 + 1000).toString())
}