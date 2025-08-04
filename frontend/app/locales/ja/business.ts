/**
 * ビジネスドメイン翻訳ファイル - 日本語
 * Business domain translations - Japanese
 */

export default {
  cases: {
    status: {
      new: '新規',
      accepted: '受任',
      investigation: '調査',
      preparation: '準備',
      negotiation: '交渉',
      trial: '裁判',
      completed: '完了'
    },
    data: {
      loadSuccess: '案件データを正常に読み込みました（{count}件）',
      loadError: '案件データの読み込みに失敗しました',
      statusUpdateSuccess: '案件 {caseId} を {oldStatus} から {newStatus} に移動しました',
      statusUpdateError: '案件のステータス更新に失敗しました',
      createSuccess: '案件「{title}」を作成しました',
      createError: '案件の作成に失敗しました',
      deleteSuccess: '案件「{title}」を削除しました',
      deleteError: '案件の削除に失敗しました'
    },
    dragDrop: {
      dragStarted: '案件 {caseId} ({status}) のドラッグを開始しました',
      dragEnded: 'ドラッグを終了しました',
      invalidTransition: '{from} から {to} への移動は許可されていません',
      sameColumn: '同じカラム内での移動はスキップされました',
      transitionNotAllowed: '{from} から {to} への移動は許可されていません',
      moveSuccess: '案件 {caseId} を {from} から {to} に移動しました',
      moveError: '案件の移動に失敗しました'
    },
    card: {
      progress: '進捗状況',
      ariaLabel: '案件: {title} - 依頼者: {client}',
      dueDate: {
        notSet: '期限未設定',
        overdue: '{days}日遅れ',
        today: '本日期限',
        tomorrow: '明日期限',
        daysLeft: '{days}日後'
      }
    },
    detail: {
      basicInfo: {
        title: '基本情報',
        client: '依頼者',
        assignedLawyer: '担当弁護士',
        dueDate: '期限日',
        tags: 'タグ'
      },
      info: {
        caseNumber: '案件番号'
      },
      progress: {
        title: '進捗状況',
        currentStatus: '現在の状態',
        createdAt: '作成日',
        updatedAt: '最終更新',
        actions: {
          changeStatus: 'ステータス変更',
          edit: '案件を編集'
        }
      },
      description: {
        title: '案件詳細',
        subtitle: '案件の詳細な説明や特記事項を記載してください。',
        noDescription: '詳細な説明はまだ追加されていません。'
      }
    }
  },
  dashboard: {
    title: 'ダッシュボード',
    subtitle: 'システムの概要と重要な情報を確認できます',
    stats: {
      activeMatter: '進行中の案件',
      activeCases: '進行中の案件',
      totalClients: '総顧客数',
      documentsThisMonth: '今月の文書数',
      revenueThisMonth: '今月の売上',
      tasksToday: '今日のタスク',
      unreadMessages: '未読メッセージ'
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
    kanban: {
      title: '案件管理カンバンボード',
      subtitle: '案件の進捗状況を可視化し、効率的な案件管理を実現',
      actions: {
        filter: 'フィルター',
        newCase: '新規案件',
        addCase: '案件を追加',
        columnSettings: 'カラム設定'
      },
      columns: {
        new: {
          title: '新規',
          description: '案件受付',
          empty: '新しい案件がありません'
        },
        accepted: {
          title: '受任',
          description: '正式受任',
          empty: '受任中の案件がありません'
        },
        investigation: {
          title: '調査',
          description: '証拠収集',
          empty: '調査中の案件がありません'
        },
        preparation: {
          title: '準備',
          description: '案件準備',
          empty: '準備中の案件がありません'
        },
        negotiation: {
          title: '交渉',
          description: '和解交渉',
          empty: '交渉中の案件がありません'
        },
        trial: {
          title: '裁判',
          description: '法廷手続',
          empty: '裁判中の案件がありません'
        },
        completed: {
          title: '完了',
          description: '案件終了',
          empty: '完了した案件がありません'
        }
      },
      dragDrop: {
        dropHere: 'ここにドロップして「{status}」に移動'
      }
    },
    filters: {
      title: 'フィルター',
      search: {
        label: '検索',
        placeholder: '案件名、案件番号、依頼者名で検索...'
      },
      clientType: {
        label: '依頼者種別',
        options: {
          all: '全て',
          individual: '個人',
          corporate: '法人'
        }
      },
      priority: {
        label: '優先度',
        options: {
          all: '全て',
          high: '緊急',
          medium: '通常',
          low: '低'
        }
      },
      assignedLawyer: {
        label: '担当弁護士',
        options: {
          all: '全て'
        }
      },
      dateRange: {
        label: '期限',
        options: {
          all: '全期間',
          overdue: '期限切れ',
          today: '本日期限',
          thisWeek: '今週期限',
          thisMonth: '今月期限'
        },
        custom: {
          label: 'カスタム期間',
          startDate: '開始日',
          endDate: '終了日'
        }
      },
      tags: {
        label: 'タグ'
      },
      sort: {
        label: '並び順',
        by: {
          dueDate: '期限日',
          priority: '優先度',
          createdAt: '作成日',
          updatedAt: '更新日',
          title: '案件名'
        },
        order: {
          asc: '昇順',
          desc: '降順'
        }
      },
      actions: {
        clear: 'クリア',
        advanced: '詳細',
        apply: '適用'
      },
      activeFilters: {
        search: '検索: {query}',
        clientType: '種別: {type}',
        priority: '優先度: {priority}'
      }
    },
    create: {
      title: '新規案件作成',
      subtitle: '新しい案件を作成します'
    },
    edit: {
      title: '案件編集',
      subtitle: '案件情報を編集します'
    },
    detail: {
      tabs: {
        overview: '概要',
        timeline: '経緯',
        documents: '書類',
        communications: '連絡',
        billing: '請求'
      },
      basicInfo: {
        title: '基本情報',
        client: '依頼者',
        assignedLawyer: '担当弁護士',
        dueDate: '期限日',
        tags: 'タグ'
      },
      progress: {
        title: '進捗状況',
        currentStatus: '現在の状態',
        createdAt: '作成日',
        updatedAt: '最終更新',
        actions: {
          changeStatus: 'ステータス変更',
          edit: '案件を編集'
        }
      },
      description: {
        title: '案件詳細',
        subtitle: '案件の詳細な説明や特記事項を記載してください。',
        noDescription: '詳細な説明はまだ追加されていません。'
      },
      actions: {
        changeStatus: 'ステータス変更',
        edit: '案件を編集',
        close: '閉じる'
      },
      placeholders: {
        timeline: 'タイムライン機能は開発中です',
        documents: '書類管理機能は開発中です',
        communications: '連絡履歴機能は開発中です',
        billing: '請求管理機能は開発中です'
      },
      sections: {
        timelineTitle: '案件の経緯',
        timelineDesc: '案件に関する重要なイベントや変更履歴を時系列で表示します。',
        documentsTitle: '関連書類',
        documentsDesc: 'この案件に関連する書類やファイルを管理します。',
        communicationsTitle: '連絡履歴',
        communicationsDesc: '依頼者や関係者との連絡記録を管理します。',
        billingTitle: '請求・時間管理',
        billingDesc: 'この案件の請求情報や作業時間を管理します。'
      }
    },
    status: {
      new: '新規',
      accepted: '受任',
      investigation: '調査',
      preparation: '準備',
      negotiation: '交渉',
      trial: '裁判',
      completed: '完了',
      active: '進行中',
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

  settings: {
    title: '設定',
    subtitle: 'システム設定と個人設定を管理',
    sections: {
      profile: 'プロフィール設定',
      preferences: '環境設定',
      security: 'セキュリティ設定',
      notifications: '通知設定'
    }
  },

  admin: {
    title: 'システム管理',
    dashboard: {
      title: '管理ダッシュボード',
      subtitle: 'システム全体の管理と監視'
    },
    users: {
      title: 'ユーザー管理',
      create: 'ユーザー作成',
      list: 'ユーザー一覧'
    },
    settings: {
      title: 'システム設定',
      subtitle: 'システム全体の設定を管理'
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

  expense: {
    navigation: {
      title: '実費管理',
      list: '実費一覧',
      new: '新規実費',
      import: 'CSVインポート',
      reports: '集計レポート'
    },
    form: {
      title: {
        create: '新規実費登録',
        edit: '実費編集',
        view: '実費詳細'
      },
      fields: {
        date: '日付',
        category: 'カテゴリ',
        description: '内容',
        incomeAmount: '収入金額',
        expenseAmount: '支出金額',
        balance: '残高',
        caseId: '案件',
        memo: 'メモ',
        tags: 'タグ',
        attachments: '添付ファイル'
      },
      placeholders: {
        date: '日付を選択してください',
        category: '交通費、事務用品など',
        description: '詳細な内容を入力してください',
        incomeAmount: '0',
        expenseAmount: '0',
        memo: '補足事項があれば入力してください'
      },
      validation: {
        required: '{field}は必須です',
        minAmount: '金額は0円以上で入力してください',
        maxAmount: '金額は999,999,999円以下で入力してください',
        futureDate: '未来の日付は選択できません',
        invalidCategory: 'カテゴリは50文字以内で入力してください',
        invalidDescription: '内容は500文字以内で入力してください'
      }
    },
    list: {
      title: '実費一覧',
      empty: '実費データがありません',
      columns: {
        date: '日付',
        category: 'カテゴリ',
        description: '内容',
        amount: '金額',
        balance: '残高',
        tags: 'タグ',
        actions: '操作'
      },
      summary: {
        total: '合計',
        income: '収入',
        expense: '支出',
        balance: '残高'
      }
    },
    actions: {
      create: '新規作成',
      edit: '編集',
      delete: '削除',
      save: '保存',
      cancel: 'キャンセル',
      back: '戻る',
      import: 'インポート',
      export: 'エクスポート',
      filter: '絞り込み',
      search: '検索',
      clear: 'クリア'
    },
    filters: {
      title: '絞り込み条件',
      dateRange: '期間',
      category: 'カテゴリ',
      case: '案件',
      tags: 'タグ',
      amount: '金額範囲',
      all: 'すべて'
    },
    status: {
      draft: '下書き',
      confirmed: '確定',
      deleted: '削除済み'
    },
    notifications: {
      created: '実費を登録しました',
      updated: '実費を更新しました',
      deleted: '実費を削除しました',
      importSuccess: '{count}件の実費をインポートしました',
      importError: 'インポートに失敗しました'
    },
    errors: {
      loadFailed: '実費データの読み込みに失敗しました',
      saveFailed: '実費の保存に失敗しました',
      deleteFailed: '実費の削除に失敗しました',
      notFound: '指定された実費が見つかりません',
      networkError: 'ネットワークエラーが発生しました',
      unauthorized: 'この操作を実行する権限がありません'
    }
  }
} as const