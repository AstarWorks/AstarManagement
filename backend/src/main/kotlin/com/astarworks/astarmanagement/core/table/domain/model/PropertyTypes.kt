package com.astarworks.astarmanagement.core.table.domain.model

/**
 * プロパティ型の定数定義
 * 
 * システムで利用可能なプロパティ型を定義します。
 * これらの値はproperty_type_catalogテーブルのIDと対応しています。
 */
object PropertyTypes {
    // 基本型
    const val TEXT = "text"
    const val LONG_TEXT = "long_text"
    const val NUMBER = "number"
    const val CHECKBOX = "checkbox"
    const val DATE = "date"
    const val DATETIME = "datetime"
    
    // 選択型
    const val SELECT = "select"
    const val MULTI_SELECT = "multi_select"
    
    // 特殊型
    const val USER = "user"
    const val EMAIL = "email"
    const val PHONE = "phone"
    const val URL = "url"
    const val FILE = "file"
    
    /**
     * 全ての有効な型ID
     */
    val ALL = setOf(
        TEXT, LONG_TEXT, NUMBER, CHECKBOX, 
        DATE, DATETIME, SELECT, MULTI_SELECT,
        USER, EMAIL, PHONE, URL, FILE
    )
    
    /**
     * 基本型のセット
     */
    val BASIC_TYPES = setOf(
        TEXT, LONG_TEXT, NUMBER, CHECKBOX, DATE, DATETIME
    )
    
    /**
     * 選択型のセット
     */
    val SELECT_TYPES = setOf(SELECT, MULTI_SELECT)
    
    /**
     * 特殊型のセット
     */
    val SPECIAL_TYPES = setOf(USER, EMAIL, PHONE, URL, FILE)
    
    /**
     * 型IDが有効かどうかを検証
     */
    fun isValid(typeId: String): Boolean = typeId in ALL
    
    /**
     * 型IDから表示名を取得（デフォルト値）
     */
    fun getDefaultDisplayName(typeId: String): String = when(typeId) {
        TEXT -> "Text"
        LONG_TEXT -> "Long Text"
        NUMBER -> "Number"
        CHECKBOX -> "Checkbox"
        DATE -> "Date"
        DATETIME -> "Date & Time"
        SELECT -> "Select"
        MULTI_SELECT -> "Multi-Select"
        USER -> "User"
        EMAIL -> "Email"
        PHONE -> "Phone"
        URL -> "URL"
        FILE -> "File"
        else -> typeId.capitalize()
    }
}