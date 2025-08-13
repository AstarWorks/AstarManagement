/**
 * 文書管理翻訳ファイル - 日本語
 * Document management translations - Japanese
 */

export default {
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
} as const