/**
 * 共通翻訳ファイル - 日本語
 * Common translations - Japanese
 */

export default {
    app: {
        title: 'Astar Management',
        description: '法律事務所向け業務管理システム'
    },

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
        user: 'ユーザー',
        guest: 'ゲスト',
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
        redo: 'やり直し',
        dateNotSet: '未設定',
        columns: '列',
        toggleColumns: '列の表示切替',
        placeholder: {
            enterHere: 'ここに入力してください'
        },
        table: {
            noData: 'データがありません',
            name: '名前',
            email: 'メールアドレス',
            status: 'ステータス',
            active: 'アクティブ',
            inactive: '非アクティブ',
            role: '役職',
            joinDate: '入社日',
            actions: '操作',
            rowsPerPage: '表示件数',
            showing: '{from}～{to}件 / 全{total}件',
            page: 'ページ',
            of: '/',
            firstPage: '最初のページ',
            previousPage: '前のページ',
            nextPage: '次のページ',
            lastPage: '最後のページ'
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

    language: {
        switcher: {
            ariaLabel: '言語を切り替える',
            toggleLabel: '言語選択メニューを開く',
            title: '言語 / Language',
            currentLanguage: '現在の言語: {language}'
        }
    },

    header: {
        search: {
            placeholder: '案件、依頼者、書類を検索...',
            label: 'グローバル検索'
        },
        notifications: {
            label: '通知',
            count: '{count}件の通知があります'
        },
        sidebar: {
            toggle: 'サイドバーを切り替え',
            openMobileMenu: 'モバイルメニューを開く'
        }
    },

    footer: {
        copyright: '© 2025 Astar Management. All rights reserved.'
    }
} as const