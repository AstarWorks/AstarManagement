package com.astarworks.astarmanagement.core.auth.domain.model

/**
 * リソースに対する操作（アクション）を定義
 * PermissionRuleの構成要素の1つ
 * 
 * 文字列処理は一切行わない。データベースとの変換はMapper層で行う。
 */
enum class Action {
    VIEW,    // 閲覧 - リソースの参照
    CREATE,  // 作成 - 新規リソースの作成
    EDIT,    // 編集 - 既存リソースの変更
    DELETE,  // 削除 - リソースの削除
    MANAGE,  // 管理 - すべての操作権限（全権限）
    EXPORT,  // エクスポート - リソースの外部出力
    IMPORT;  // インポート - リソースの外部入力
    
    /**
     * MANAGEは他のすべての権限を包含
     */
    fun includes(other: Action): Boolean {
        return this == MANAGE || this == other
    }
}