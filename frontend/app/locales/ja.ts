/**
 * 日本語翻訳ファイル
 * Japanese Language Messages
 */

import type { LocaleMessages } from '~/types/i18n'

export default {
  common: {
    confirm: '確認',
    cancel: 'キャンセル',
    save: '保存',
    delete: '削除',
    edit: '編集',
    create: '作成',
    update: '更新',
    search: '検索',
    filter: 'フィルター',
    sort: '並び替え',
    loading: '読み込み中...',
    error: 'エラー',
    success: '成功',
    warning: '警告',
    info: '情報',
    yes: 'はい',
    no: 'いいえ',
    close: '閉じる',
    back: '戻る',
    next: '次へ',
    previous: '前へ',
    submit: '送信',
    reset: 'リセット',
    clear: 'クリア',
    select: '選択',
    selectAll: '全て選択',
    deselectAll: '全て選択解除',
    required: '必須',
    optional: '任意',
    show: '表示',
    hide: '非表示',
    expand: '展開',
    collapse: '折りたたみ',
    refresh: '更新',
    export: 'エクスポート',
    import: 'インポート',
    download: 'ダウンロード',
    upload: 'アップロード',
    print: '印刷',
    copy: 'コピー',
    cut: '切り取り',
    paste: '貼り付け',
    undo: '元に戻す',
    redo: 'やり直し'
  },

  navigation: {
    dashboard: 'ダッシュボード',
    matters: '案件管理',
    clients: '顧客管理',  
    documents: '文書管理',
    finance: '財務管理',
    admin: 'システム管理',
    settings: '設定',
    profile: 'プロフィール',
    help: 'ヘルプ',
    logout: 'ログアウト',
    home: 'ホーム',
    calendar: 'カレンダー',
    feedback: 'フィードバック',
    language: {
      switch: '言語を切り替え'
    },
    menu: {
      user: 'ユーザーメニュー'
    },
    breadcrumb: {
      separator: '/',
      home: 'ホーム'
    },
    sidebar: {
      toggle: 'サイドバーを切り替え',
      collapse: 'サイドバーを閉じる',
      expand: 'サイドバーを開く',
      mainMenu: 'メインメニュー',
      adminMenu: 'システム管理',
      recentPages: '最近のページ'
    },
    menu: {
      matters: {
        list: '案件一覧',
        create: '新規案件',
        kanban: 'カンバンボード'
      },
      clients: {
        list: '顧客一覧',
        create: '新規顧客'
      },
      documents: {
        list: '文書一覧',
        create: '文書作成',
        templates: 'テンプレート'
      },
      finance: {
        dashboard: '財務ダッシュボード',
        expenses: '実費管理',
        billing: '請求管理',
        reports: 'レポート'
      },
      admin: {
        users: 'ユーザー管理',
        roles: '権限管理',
        audit: '監査ログ',
        system: 'システム設定'
      }
    }
  },

  auth: {
    login: {
      title: 'ログイン',
      subtitle: 'アカウントにサインインしてください',
      email: {
        label: 'メールアドレス',
        placeholder: 'example@example.com'
      },
      password: {
        label: 'パスワード',
        placeholder: 'パスワードを入力してください',
        show: 'パスワードを表示',
        hide: 'パスワードを非表示'
      },
      rememberMe: 'ログイン状態を保持する',
      forgotPassword: 'パスワードを忘れた場合',
      submit: 'ログイン',
      loading: 'ログイン中...'
    },
    logout: {
      title: 'ログアウト',
      message: 'ログアウトしますか？',
      confirm: 'ログアウト',
      cancel: 'キャンセル'
    },
    twoFactor: {
      title: '2要素認証',
      subtitle: '認証アプリに表示されたコードを入力してください',
      code: {
        label: '認証コード',
        placeholder: '6桁のコードを入力'
      },
      submit: '認証',
      resend: 'コードを再送信',
      loading: '認証中...'
    },
    errors: {
      invalidCredentials: 'メールアドレスまたはパスワードが正しくありません',
      accountLocked: 'アカウントがロックされています',
      twoFactorRequired: '2要素認証が必要です',
      twoFactorInvalid: '認証コードが正しくありません',
      sessionExpired: 'セッションが期限切れです',
      networkError: 'ネットワークエラーが発生しました',
      genericError: 'ログインに失敗しました'
    },
    lastLogin: {
      never: '未ログイン',
      minutesAgo: '{minutes}分前',
      hoursAgo: '{hours}時間前',
      daysAgo: '{days}日前'
    },
    status: {
      online: 'オンライン',
      offline: 'オフライン'
    }
  },

  dashboard: {
    title: 'ダッシュボード',
    subtitle: 'システムの概要と重要な情報を確認できます',
    stats: {
      activeMatter: '進行中の案件',
      totalClients: '総顧客数',
      documentsThisMonth: '今月の文書数',
      revenueThisMonth: '今月の売上'
    },
    sections: {
      recentMatters: {
        title: '最近の案件',
        viewAll: 'すべての案件を表示'
      },
      upcomingTasks: {
        title: '期限の近いタスク',
        viewAll: 'すべてのタスクを表示',
        dueDate: '期限',
        status: {
          overdue: '期限切れ',
          tomorrow: '明日',
          urgent: '緊急',
          normal: '通常'
        }
      },
      quickActions: {
        title: 'クイックアクション',
        newMatter: '新規案件',
        newClient: '新規顧客',
        createDocument: '文書作成',
        addExpense: '実費入力'
      }
    },
    debug: {
      title: 'デバッグ情報',
      userInfo: 'ユーザー情報',
      permissions: '権限',
      roles: 'ロール'
    }
  },

  matter: {
    title: '案件管理',
    list: {
      title: '案件一覧',
      empty: '案件がありません'
    },
    create: {
      title: '新規案件作成',
      subtitle: '新しい案件を作成します'
    },
    edit: {
      title: '案件編集',
      subtitle: '案件情報を編集します'
    },
    status: {
      active: '進行中',
      completed: '完了',
      pending: '保留',
      cancelled: 'キャンセル'
    },
    priority: {
      high: '高',
      medium: '中',
      low: '低'
    },
    fields: {
      title: {
        label: '案件名',
        placeholder: '案件名を入力してください'
      },
      description: {
        label: '案件詳細',
        placeholder: '案件の詳細を入力してください'
      },
      client: {
        label: '依頼者',
        placeholder: '依頼者を選択してください'
      },
      status: {
        label: 'ステータス'
      },
      priority: {
        label: '優先度'
      },
      dueDate: {
        label: '期限'
      }
    }
  },

  client: {
    title: '顧客管理',
    list: {
      title: '顧客一覧',
      empty: '顧客がありません'
    },
    create: {
      title: '新規顧客登録',
      subtitle: '新しい顧客を登録します'
    },
    edit: {
      title: '顧客編集',
      subtitle: '顧客情報を編集します'
    },
    fields: {
      name: {
        label: '顧客名',
        placeholder: '顧客名を入力してください'
      },
      email: {
        label: 'メールアドレス',
        placeholder: 'example@example.com'
      },
      phone: {
        label: '電話番号',
        placeholder: '090-1234-5678'
      },
      address: {
        label: '住所',
        placeholder: '住所を入力してください'
      }
    },
    type: {
      individual: '個人',
      corporate: '法人'
    }
  },

  document: {
    title: '文書管理',
    list: {
      title: '文書一覧',
      empty: '文書がありません'
    },
    create: {
      title: '文書作成',
      subtitle: '新しい文書を作成します'
    },
    upload: {
      title: 'ファイルアップロード',
      dragDrop: 'ファイルをドラッグ&ドロップするか、クリックして選択してください',
      browse: 'ファイルを選択',
      maxSize: '最大ファイルサイズ',
      supportedFormats: '対応形式'
    },
    fields: {
      title: {
        label: '文書タイトル',
        placeholder: '文書のタイトルを入力してください'
      },
      description: {
        label: '文書説明',
        placeholder: '文書の説明を入力してください'
      },
      category: {
        label: 'カテゴリー'
      },
      tags: {
        label: 'タグ',
        placeholder: 'タグを入力してください（カンマ区切り）'
      }
    }
  },

  finance: {
    title: '財務管理',
    dashboard: {
      title: '財務ダッシュボード',
      subtitle: '売上・経費の管理'
    },
    expenses: {
      title: '実費管理',
      create: '実費入力',
      list: '実費一覧'
    },
    billing: {
      title: '請求管理',
      create: '請求書作成',
      list: '請求書一覧'
    },
    reports: {
      title: 'レポート',
      generate: 'レポート生成'
    }
  },

  admin: {
    title: 'システム管理',
    users: {
      title: 'ユーザー管理',
      create: 'ユーザー作成',
      list: 'ユーザー一覧'
    },
    roles: {
      title: '権限管理',
      create: '権限作成',
      list: '権限一覧'
    },
    audit: {
      title: '監査ログ',
      search: 'ログ検索'
    },
    system: {
      title: 'システム設定',
      settings: '設定'
    }
  },

  error: {
    validation: {
      required: 'この項目は必須です',
      email: '有効なメールアドレスを入力してください',
      minLength: '{min}文字以上で入力してください',
      maxLength: '{max}文字以下で入力してください',
      numeric: '数値を入力してください',
      alphaNumeric: '英数字のみ入力してください'
    },
    network: {
      offline: 'オフラインです',
      timeout: '通信がタイムアウトしました',
      serverError: 'サーバーエラーが発生しました',
      notFound: 'ページが見つかりません',
      unauthorized: '認証が必要です',
      forbidden: 'アクセス権限がありません'
    },
    generic: {
      somethingWentWrong: '問題が発生しました',
      tryAgain: 'もう一度お試しください',
      contactSupport: 'サポートにお問い合わせください'
    }
  },

  notification: {
    title: '通知',
    empty: '新しい通知はありません',
    viewAll: 'すべての通知を表示',
    types: {
      matter: '案件',
      document: '文書',
      client: '顧客',
      finance: '財務',
      system: 'システム'
    },
    priority: {
      high: '重要',
      medium: '通常',
      low: '低'
    },
    time: {
      now: 'たった今',
      minutesAgo: '{minutes}分前',
      hoursAgo: '{hours}時間前',
      daysAgo: '{days}日前'
    }
  },

  access: {
    denied: {
      title: 'アクセス拒否',
      subtitle: 'このページにアクセスする権限がありません',
      reasons: {
        insufficientPermissions: '必要な権限がありません',
        insufficientRole: '必要なロールがありません',
        insufficientRolesAll: 'すべての必要なロールがありません',
        alreadyAuthenticated: '既にログイン済みです',
        unauthenticated: '認証が必要です',
        sessionExpired: 'セッションが期限切れです',
        twoFactorRequired: '2要素認証が必要です',
        accountDisabled: 'アカウントが無効です',
        maintenanceMode: 'メンテナンス中です'
      }
    },
    actions: {
      goBack: '前のページに戻る',
      goToDashboard: 'ダッシュボードに戻る',
      goToLogin: 'ログインページに移動',
      contactAdmin: 'システム管理者にお問い合わせください'
    },
    details: {
      reason: '理由',
      requiredPermissions: '必要な権限',
      requiredRoles: '必要なロール',
      currentUser: '現在のユーザー',
      path: 'アクセス先'
    }
  }
} as const satisfies LocaleMessages