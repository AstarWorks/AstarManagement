package com.astarworks.astarmanagement.shared.exception.common

/**
 * リソースタイプのEnum定義（例外用）
 * 
 * ResourceNotFoundExceptionなどで使用されるリソース種別を定義
 */
enum class ResourceType(val displayName: String) {
    TABLE("Table"),
    RECORD("Record"),
    DOCUMENT("Document"),
    DIRECTORY("Directory"),
    WORKSPACE("Workspace"),
    TENANT("Tenant"),
    USER("User"),
    ROLE("Role"),
    PROPERTY_TYPE("Property Type"),
    RESOURCE_GROUP("Resource Group"),
    SETTINGS("Settings"),
    FILE("File"),
    TEMPLATE("Template"),
    PERMISSION("Permission"),
    OTHER("Other");
    
    companion object {
        /**
         * 文字列値からResourceTypeを取得
         * @param value リソースタイプの文字列値
         * @return 対応するResourceType、見つからない場合はOTHER
         */
        fun fromValue(value: String): ResourceType {
            return entries.find { it.name.equals(value, ignoreCase = true) } ?: OTHER
        }
    }
}