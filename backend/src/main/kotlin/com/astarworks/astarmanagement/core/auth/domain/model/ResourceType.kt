package com.astarworks.astarmanagement.core.auth.domain.model

/**
 * 権限制御の対象となるリソースタイプ
 * PermissionRuleの構成要素の1つ
 * 
 * 文字列処理は一切行わない。データベースとの変換はMapper層で行う。
 */
enum class ResourceType {
    TABLE,          // テーブル
    RECORD,         // レコード
    DOCUMENT,       // ドキュメント  
    DIRECTORY,      // ディレクトリ
    WORKSPACE,      // ワークスペース
    TENANT,         // テナント
    USER,           // ユーザー
    ROLE,           // ロール
    PROPERTY_TYPE,  // プロパティタイプ
    RESOURCE_GROUP, // リソースグループ
    SETTINGS        // 設定
}