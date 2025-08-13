/**
 * 案件管理翻訳ファイル - 日本語
 * Matter management translations - Japanese
 */

export default {
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
    },
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
        }
    }
} as const