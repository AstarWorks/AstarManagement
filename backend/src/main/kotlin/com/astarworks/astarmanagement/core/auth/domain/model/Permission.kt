package com.astarworks.astarmanagement.core.auth.domain.model

/**
 * Permission types for resource access control.
 * Each permission represents a specific action that can be performed on resources.
 */
enum class Permission {
    VIEW,    // 閲覧権限 - リソースの参照
    CREATE,  // 作成権限 - 新規リソースの作成
    EDIT,    // 編集権限 - 既存リソースの変更
    DELETE,  // 削除権限 - リソースの削除
    MANAGE   // 管理権限 - すべての操作権限（全権限）
}