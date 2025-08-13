/**
 * 経費管理関連の翻訳
 * Expense Management Translations
 */

export default {
    // General
    title: '経費管理',
    titlePlural: '経費',

    // Navigation
    navigation: {
        title: '実費管理',
        badge: '新着',
        list: '実費一覧',
        new: '新規実費',
        import: 'CSVインポート',
        reports: '集計レポート'
    },

    // Actions
    actions: {
        create: '経費を作成',
        edit: '編集',
        view: '詳細表示',
        delete: '削除',
        duplicate: '複製',
        bulkEdit: '一括編集',
        bulkDelete: '一括削除',
        export: 'エクスポート',
        import: 'インポート',
        save: '保存',
        cancel: 'キャンセル',
        reset: 'リセット',
        apply: '適用',
        clear: 'クリア',
        print: '印刷',
        copy: 'コピー',
        copySuccess: 'クリップボードにコピーしました',
        copySuccessDescription: '経費情報をクリップボードにコピーしました',
        copyFailed: 'コピーに失敗しました',
        copyFailedDescription: 'クリップボードへのアクセスが拒否されました',
        manageAttachments: '添付ファイル管理'
    },

    // Table
    table: {
        columns: '表示列',
        actions: '操作',
        date: '日付',
        category: 'カテゴリ',
        description: '説明',
        amount: '金額',
        balance: '残高',
        case: '案件',
        tags: 'タグ',
        memo: 'メモ',
        attachments: '添付ファイル',
        createdAt: '作成日時',
        updatedAt: '更新日時',
        createdBy: '作成者',
        updatedBy: '更新者'
    },

    // List view
    list: {
        title: '経費一覧',
        description: '経費の記録と管理を行います',
        loading: '読み込み中...',
        loadingMore: 'さらに読み込み中...',
        empty: {
            title: '経費がありません',
            description: '経費を作成して、業務の支出を記録しましょう。'
        },
        selected: {
            one: '{count}件選択',
            other: '{count}件選択'
        }
    },

    // Filters
    filters: {
        title: 'フィルター',
        clear: 'クリア',
        advanced: '詳細',
        quickFilters: 'クイックフィルター',
        dateRange: '期間',
        startDate: '開始日',
        endDate: '終了日',
        category: 'カテゴリ',
        categoryPlaceholder: 'カテゴリを選択',
        allCategories: 'すべてのカテゴリ',
        search: '検索',
        searchPlaceholder: '説明やメモを検索...',
        amountRange: '金額範囲',
        minAmount: '最小金額',
        maxAmount: '最大金額',
        case: '案件',
        casePlaceholder: '案件を選択',
        allCases: 'すべての案件',
        balanceType: '収支タイプ',
        hasMemo: 'メモあり',
        hasAttachments: '添付ファイルあり',
        activeFilters: '適用中のフィルター',
        stats: {
            matched: '該当件数',
            income: '収入合計',
            expense: '支出合計',
            balance: '収支'
        }
    },

    // Categories
    categories: {
        transportation: '交通費',
        stampFees: '印紙代',
        copyFees: 'コピー代',
        postage: '郵送料',
        other: 'その他',
        all: 'すべて'
    },

    // Balance types
    balanceTypes: {
        all: 'すべて',
        positive: '収入',
        negative: '支出',
        zero: '収支0'
    },

    // Date presets
    datePresets: {
        today: '今日',
        thisWeek: '今週',
        thisMonth: '今月',
        lastMonth: '前月',
        thisQuarter: '今四半期',
        thisYear: '今年',
        lastYear: '昨年',
        custom: 'カスタム'
    },

    // Pagination
    pagination: {
        itemsPerPage: '表示件数',
        goToPage: 'ページ',
        previous: '前へ',
        next: '次へ',
        first: '最初',
        last: '最後',
        totalItems: '全 {count} 件',
        totalPages: '全 {count} ページ',
        currentPage: '{current} / {total} ページ',
        of: '/',
        showing: '表示中',
        to: '〜',
        results: '件',
        noResults: '結果がありません',
        summary: '{start}-{end} / {total} 件'
    },

    // Form fields
    form: {
        // Field labels
        fields: {
            date: '日付',
            category: '分類',
            description: '説明',
            incomeAmount: '収入金額',
            expenseAmount: '支出金額',
            case: '案件',
            memo: 'メモ',
            tags: 'タグ'
        },

        // Form placeholders
        placeholders: {
            date: '日付を選択',
            category: '分類を選択してください',
            description: '経費の詳細を入力してください',
            incomeAmount: '0',
            expenseAmount: '0',
            case: '案件を選択（任意）',
            memo: '追加情報やメモを入力',
            tags: 'タグを選択'
        },

        // Form descriptions
        descriptions: {
            date: '経費が発生した日付を選択してください',
            category: '経費のカテゴリを選択してください',
            description: '経費の詳細な説明を入力してください（最大500文字）',
            incomeAmount: '収入として受け取った金額を入力してください',
            expenseAmount: '支出として支払った金額を入力してください',
            case: '関連する案件があれば選択してください',
            memo: '追加の説明やメモがあれば入力してください（最大1000文字）',
            tags: '分類用のタグを選択してください'
        },

        // Multi-step form
        steps: {
            basic: '基本情報',
            basicDescription: '経費の基本的な情報を入力してください',
            amount: '金額情報',
            amountDescription: '収入または支出の金額を入力してください',
            additional: '追加情報',
            additionalDescription: '案件やタグなどの追加情報を入力してください'
        },

        // Form validation messages
        validation: {
            required: '{field}は必須です',
            futureDate: '未来の日付は入力できません',
            invalidCategory: '無効なカテゴリです',
            invalidDescription: '説明は500文字以内で入力してください',
            minAmount: '金額は0以上である必要があります',
            maxAmount: '金額が上限を超えています',
            maxMemo: 'メモは1000文字以内で入力してください',
            amountRequired: '収入金額または支出金額のいずれかを入力してください'
        },

        // Amount types and calculations
        amountType: '取引種別',
        amountTypes: {
            expense: '支出',
            income: '収入'
        },
        balanceCalculation: '収支計算',
        balanceTypes: {
            positive: '収入超過',
            negative: '支出超過',
            zero: '収支0'
        },
        commonAmounts: 'よく使う金額',

        // Quick templates and tags
        quickTemplates: 'よく使う説明',
        templates: {
            court: '裁判所',
            client: 'クライアント',
            copying: 'コピー',
            postage: '郵送',
            stamp: '印紙',
            supplies: '用品',
            materials: '資料',
            other: 'その他'
        },
        quickTags: 'よく使うタグ',

        // Additional info
        noCase: '案件なし',
        noTags: 'タグなし',
        characters: '文字',
        summary: '入力内容確認',
        attachmentPlaceholder: '添付ファイル',
        attachmentComingSoon: '添付ファイル機能は次のバージョンで実装予定です'
    },

    // Virtual scrolling
    virtual: {
        loading: '読み込み中...',
        scrollToTop: 'トップに戻る',
        scrollToBottom: '最下部に移動',
        performanceMode: 'パフォーマンスモード',
        itemsVisible: '表示アイテム',
        totalItems: '総アイテム数'
    },

    // Status messages
    status: {
        creating: '作成中...',
        updating: '更新中...',
        deleting: '削除中...',
        loading: '読み込み中...',
        saving: '保存中...',
        created: '経費を作成しました',
        updated: '経費を更新しました',
        deleted: '経費を削除しました',
        bulkDeleted: '{count}件の経費を削除しました',
        bulkUpdated: '{count}件の経費を更新しました',
        exported: '経費データをエクスポートしました',
        imported: '経費データをインポートしました'
    },

    // Error messages
    errors: {
        loadFailed: '経費の読み込みに失敗しました',
        createFailed: '経費の作成に失敗しました',
        updateFailed: '経費の更新に失敗しました',
        deleteFailed: '経費の削除に失敗しました',
        bulkDeleteFailed: '経費の一括削除に失敗しました',
        exportFailed: 'エクスポートに失敗しました',
        importFailed: 'インポートに失敗しました',
        networkError: 'ネットワークエラーが発生しました',
        serverError: 'サーバーエラーが発生しました',
        validationError: '入力データに不備があります',
        notFound: '指定された経費が見つかりません',
        unauthorized: 'この操作を実行する権限がありません',
        forbidden: 'アクセスが拒否されました'
    },

    // Confirmations
    confirmations: {
        delete: 'この経費を削除してもよろしいですか？',
        bulkDelete: '{count}件の経費を削除してもよろしいですか？',
        unsavedChanges: '未保存の変更があります。本当にページを離れますか？',
        reset: 'すべての変更をリセットしてもよろしいですか？'
    },

    // Detail view
    detail: {
        basicInfo: '基本情報',
        caseInfo: '案件情報',
        caseTitle: '案件名',
        caseStatus: '案件ステータス',
        auditInfo: '監査情報',
        tagCount: 'タグ数: {count}',
        notFound: {
            title: '経費が見つかりません',
            message: '指定された経費が見つかりませんでした。'
        },
        actions: {
            backToList: '経費一覧に戻る'
        }
    },

    // Preview
    preview: {
        notImplemented: 'プレビュー機能は未実装です',
        comingSoon: 'この機能は今後実装予定です'
    },

    // Delete
    delete: {
        title: '実費を削除',
        message: '「{{title}}」を削除してもよろしいですか？',
        warning: 'この操作は30日間元に戻すことができます',
        confirm: '削除する',
        success: '実費を削除しました',
        successDescription: '30日以内であれば復元できます',
        error: '削除に失敗しました',
        undo: '元に戻す'
    },

    // Restore
    restore: {
        success: '実費を復元しました',
        successDescription: '削除が取り消されました',
        error: '復元に失敗しました'
    },

    // Confirm dialog
    confirm: {
        delete: 'この経費を削除してもよろしいですか？'
    },

    // Tooltips and help text
    tooltips: {
        date: '経費が発生した日付',
        category: '経費のカテゴリ分類',
        description: '経費の詳細説明',
        amount: '経費の金額（日本円）',
        balance: '収入 - 支出の差額',
        case: '関連する案件（任意）',
        memo: '追加の説明やメモ',
        tags: '分類用のタグ',
        attachments: 'レシートや証明書などの添付ファイル',
        bulkSelect: '複数の経費を選択して一括操作',
        sortColumn: 'この列でソート',
        filterActive: 'フィルターが適用されています',
        virtualScrolling: 'パフォーマンス向上のため仮想スクロールを使用',
        export: 'CSV形式でエクスポート',
        import: 'CSV形式でインポート'
    },

    // Indicators
    indicators: {
        hasAttachments: '添付ファイルあり',
        hasMemo: 'メモあり',
        hasCase: '案件関連',
        selected: '選択済み',
        modified: '変更あり',
        new: '新規'
    },

    // Keyboard shortcuts
    shortcuts: {
        title: 'キーボードショートカット',
        create: 'Ctrl+N : 新規作成',
        save: 'Ctrl+S : 保存',
        delete: 'Delete : 削除',
        edit: 'Enter : 編集',
        selectAll: 'Ctrl+A : 全選択',
        copy: 'Ctrl+C : コピー',
        paste: 'Ctrl+V : 貼り付け',
        undo: 'Ctrl+Z : 元に戻す',
        redo: 'Ctrl+Y : やり直し',
        search: 'Ctrl+F : 検索',
        filter: 'Ctrl+Shift+F : フィルター',
        nextPage: 'Ctrl+→ : 次のページ',
        prevPage: 'Ctrl+← : 前のページ',
        firstPage: 'Ctrl+Home : 最初のページ',
        lastPage: 'Ctrl+End : 最後のページ'
    },

    // Export/Import
    export: {
        title: 'エクスポート',
        format: 'フォーマット',
        csv: 'CSV',
        excel: 'Excel',
        pdf: 'PDF',
        dateRange: 'エクスポート期間',
        allData: 'すべてのデータ',
        filteredData: 'フィルター適用データ',
        selectedData: '選択されたデータ',
        includeHeaders: 'ヘッダーを含める',
        filename: 'ファイル名',
        downloading: 'ダウンロード中...',
        success: 'エクスポートが完了しました',
        failed: 'エクスポートに失敗しました'
    },

    import: {
        title: 'インポート',
        selectFile: 'ファイルを選択',
        dragDrop: 'ファイルをドラッグ&ドロップ',
        supportedFormats: 'サポート形式: CSV, Excel',
        maxFileSize: '最大ファイルサイズ: 10MB',
        hasHeaders: 'ヘッダー行あり',
        preview: 'プレビュー',
        mapping: 'フィールドマッピング',
        validate: '検証',
        importing: 'インポート中...',
        success: '{count}件の経費をインポートしました',
        failed: 'インポートに失敗しました',
        errors: 'エラーが {count} 件あります',
        skipErrors: 'エラーをスキップして続行',
        fixErrors: 'エラーを修正'
    },

    // Empty states hint
    emptyHint: '最初の実費を追加して管理を始めましょう'
} as const