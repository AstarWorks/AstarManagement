package com.astarworks.astarmanagement.shared.exception.common

/**
 * バリデーションタイプのEnum定義
 * 
 * ValidationExceptionで使用されるバリデーション種別を定義
 */
enum class ValidationType(val displayName: String) {
    REQUIRED("Required Field"),
    FORMAT("Format"),
    LENGTH("Length"),
    RANGE("Range"),
    UNIQUE("Uniqueness"),
    REFERENCE("Reference"),
    BUSINESS_RULE("Business Rule"),
    TYPE_MISMATCH("Type Mismatch"),
    PATTERN("Pattern"),
    CONSTRAINT("Constraint"),
    OTHER("Other");
    
    companion object {
        /**
         * 文字列値からValidationTypeを取得
         * @param value バリデーションタイプの文字列値
         * @return 対応するValidationType、見つからない場合はOTHER
         */
        fun fromValue(value: String): ValidationType {
            return entries.find { it.name.equals(value, ignoreCase = true) } ?: OTHER
        }
    }
}