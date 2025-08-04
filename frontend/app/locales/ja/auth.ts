/**
 * 認証翻訳ファイル - 日本語
 * Authentication translations - Japanese
 */

export default {
  meta: {
    login: {
      title: 'ログイン - Astar Management',
      description: '法律事務所管理システムへのログイン'
    },
    devTest: {
      description: 'コンポーネントと機能のテストページ'
    }
  },
  
  auth: {
    login: {
      title: 'ログイン',
      subtitle: 'アカウントにサインインしてください',
      appTitle: 'Astar Management',
      appSubtitle: '法律事務所業務管理システム',
      email: {
        label: 'メールアドレス',
        placeholder: 'メールアドレスを入力してください'
      },
      password: {
        label: 'パスワード',
        placeholder: 'パスワードを入力',
        show: 'パスワードを表示',
        hide: 'パスワードを隠す'
      },
      rememberMe: 'ログイン状態を保持する',
      forgotPassword: 'パスワードをお忘れですか？',
      submit: 'ログイン',
      loading: 'ログイン中...',
      debug: {
        title: '開発用デバッグ機能',
        demoLogin: 'デモログイン',
        twoFactorUser: '2FA有効ユーザー'
      }
    },
    password: {
      show: 'パスワードを表示',
      hide: 'パスワードを隠す'
    },
    debug: {
      environmentLabel: '開発環境',
      description: '開発用の認証情報を自動入力できます',
      demoUser: 'デモユーザー',
      twoFactorUser: '2FAユーザー',
      adminUser: '管理者',
      advancedOptions: '詳細オプション',
      environment: '環境',
      apiEndpoint: 'APIエンドポイント',
      buildTime: 'ビルド時刻'
    },
    header: {
      title: 'アカウントにログイン',
      subtitle: 'メールアドレスとパスワードを入力してください'
    },
    footer: {
      copyright: '© 2024 Astar Management. All rights reserved.',
      privacy: 'プライバシーポリシー',
      terms: '利用規約'
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
      sessionExpiredDetail: 'セッションの有効期限が切れました。再度ログインしてください。',
      networkError: 'ネットワークエラーが発生しました',
      genericError: 'ログインに失敗しました',
      loginRequired: 'このページにアクセスするにはログインが必要です。',
      loginFailed: 'ログインに失敗しました'
    },
    lastLogin: {
      label: '最終ログイン',
      never: '未ログイン',
      minutesAgo: '{minutes}分前',
      hoursAgo: '{hours}時間前',
      daysAgo: '{days}日前'
    },
    status: {
      online: 'オンライン',
      offline: 'オフライン'
    },
    roles: {
      LAWYER: '弁護士',
      CLERK: '事務員',
      CLIENT: '依頼者',
      ADMIN: '管理者',
      lawyer: '弁護士',
      clerk: '事務員',
      client: '依頼者',
      admin: '管理者',
      unknown: '未設定',
      guest: 'ゲスト'
    },
    validation: {
      email: {
        required: 'メールアドレスを入力してください',
        invalid: '有効なメールアドレスを入力してください'
      },
      password: {
        required: 'パスワードを入力してください',
        minLength: 'パスワードは{min}文字以上で入力してください',
        pattern: 'パスワードは英小文字、英大文字、数字を含む必要があります'
      },
      twoFactor: {
        required: '2要素認証シークレットが必要です',
        codeRequired: '認証コードは6桁で入力してください',
        codeInvalid: '認証コードは数字のみで入力してください'
      },
      passwordReset: {
        tokenRequired: 'リセットトークンが必要です',
        confirmRequired: 'パスワード確認を入力してください',
        mismatch: 'パスワードが一致しません'
      }
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
} as const