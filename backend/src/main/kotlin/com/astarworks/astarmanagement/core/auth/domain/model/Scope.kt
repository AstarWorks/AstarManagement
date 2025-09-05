package com.astarworks.astarmanagement.core.auth.domain.model

/**
 * リソースアクセスのスコープ（範囲）を定義
 * 階層順: ALL > TEAM > OWN > RESOURCE_GROUP > RESOURCE_ID
 * 
 * 文字列処理は一切行わない。データベースとの変換はMapper層で行う。
 */
enum class Scope {
    ALL,            // 階層1: 全リソースへのアクセス
    TEAM,           // 階層2: チーム所有リソースへのアクセス
    OWN,            // 階層3: 個人所有リソースへのアクセス
    RESOURCE_GROUP, // 階層4: リソースグループ経由のアクセス
    RESOURCE_ID;    // 階層5: 特定リソースインスタンスへのアクセス
    
    /**
     * このスコープが他のスコープより強い（より広い権限）かチェック
     * @return このスコープが他のスコープより強い場合true
     */
    fun isStrongerThan(other: Scope): Boolean {
        return this.ordinal < other.ordinal
    }
    
    /**
     * このスコープが他のスコープを包含するかチェック
     * @return このスコープが他のスコープを包含する場合true
     */
    fun includes(other: Scope): Boolean {
        return this.ordinal <= other.ordinal
    }
}