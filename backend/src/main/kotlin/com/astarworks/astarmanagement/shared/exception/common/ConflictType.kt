package com.astarworks.astarmanagement.shared.exception.common

/**
 * コンフリクトタイプのEnum定義
 * 
 * ConflictExceptionで使用されるコンフリクト種別を定義
 */
enum class ConflictType(val displayName: String) {
    DUPLICATE("Duplicate Resource"),
    VERSION_MISMATCH("Version Mismatch"),
    STATE_CONFLICT("State Conflict"),
    DEPENDENCY("Dependency Conflict"),
    BUSINESS_RULE("Business Rule Conflict"),
    CONCURRENT_UPDATE("Concurrent Update"),
    LOCK_CONFLICT("Lock Conflict"),
    UNIQUE_CONSTRAINT("Unique Constraint Violation"),
    REFERENCE_INTEGRITY("Reference Integrity Violation"),
    OTHER("Other Conflict");
    
    companion object {
        /**
         * 文字列値からConflictTypeを取得
         * @param value コンフリクトタイプの文字列値
         * @return 対応するConflictType、見つからない場合はOTHER
         */
        fun fromValue(value: String): ConflictType {
            return entries.find { it.name.equals(value, ignoreCase = true) } ?: OTHER
        }
    }
}