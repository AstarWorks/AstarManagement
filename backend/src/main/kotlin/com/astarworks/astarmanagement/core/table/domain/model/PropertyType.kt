package com.astarworks.astarmanagement.core.table.domain.model

import com.fasterxml.jackson.annotation.JsonProperty
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import com.google.gson.annotations.SerializedName

/**
 * プロパティ型のEnum定義
 * 
 * システムで利用可能なプロパティ型を定義します。
 * シンプルで実用的な型のみを含みます。
 */
@Serializable
enum class PropertyType {
    // 基本型
    @SerialName("text")
    @SerializedName("text")
    @JsonProperty("text")
    TEXT,
    
    @SerialName("long_text")
    @SerializedName("long_text")
    @JsonProperty("long_text")
    LONG_TEXT,
    
    @SerialName("number")
    @SerializedName("number")
    @JsonProperty("number")
    NUMBER,
    
    @SerialName("checkbox")
    @SerializedName("checkbox")
    @JsonProperty("checkbox")
    CHECKBOX,
    
    @SerialName("date")
    @SerializedName("date")
    @JsonProperty("date")
    DATE,
    
    @SerialName("datetime")
    @SerializedName("datetime")
    @JsonProperty("datetime")
    DATETIME,
    
    // 選択型
    @SerialName("select")
    @SerializedName("select")
    @JsonProperty("select")
    SELECT,
    
    @SerialName("multi_select")
    @SerializedName("multi_select")
    @JsonProperty("multi_select")
    MULTI_SELECT,
    
    // 特殊型（検証付きテキスト）
    @SerialName("email")
    @SerializedName("email")
    @JsonProperty("email")
    EMAIL,
    
    @SerialName("url")
    @SerializedName("url")
    @JsonProperty("url")
    URL,
    
    @SerialName("file")
    @SerializedName("file")
    @JsonProperty("file")
    FILE,
    
    @SerialName("relation")
    @SerializedName("relation")
    @JsonProperty("relation")
    RELATION;
    
    /**
     * 基本的なテキスト型かどうか
     */
    fun isTextType(): Boolean = this in setOf(TEXT, LONG_TEXT, EMAIL, URL)
    
    /**
     * 選択型かどうか
     */
    fun isSelectType(): Boolean = this in setOf(SELECT, MULTI_SELECT)
    
    /**
     * 数値型かどうか
     */
    fun isNumericType(): Boolean = this == NUMBER
    
    /**
     * 日付型かどうか
     */
    fun isDateType(): Boolean = this in setOf(DATE, DATETIME)
    
    /**
     * リレーション型かどうか
     */
    fun isRelationType(): Boolean = this == RELATION
    
    companion object {
        /**
         * 文字列から PropertyType を取得
         * @param value 文字列値
         * @return 対応する PropertyType、存在しない場合は null
         */
        fun fromValue(value: String): PropertyType? {
            return entries.find { it.name.lowercase() == value.lowercase() }
        }
    }
}