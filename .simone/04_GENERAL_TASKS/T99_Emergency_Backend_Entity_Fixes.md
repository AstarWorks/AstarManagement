# T99_Emergency_Backend_Entity_Fixes

## Task Meta
- **Task ID**: T99_Emergency_Backend_Entity_Fixes
- **Title**: Emergency Backend Entity Fixes - Critical Error Resolution
- **Status**: in_progress
- **Assignee**: Claude
- **Priority**: critical
- **Created**: 2025-08-04
- **Updated**: 2025-08-04 09:20

## Description
緊急対応タスク。T04_S02_M002_Performance_Indexes実装中に発生した致命的なアプリケーション起動エラーを解決する。JPA エンティティとリポジトリクエリの不整合を修正し、アプリケーションの正常起動を実現する。

## Problem Statement

### 1. JpaExpenseRepository - amount フィールドエラー
```
Error: Could not resolve attribute 'amount' of 'com.astarworks.astarmanagement.expense.domain.model.Expense'
```
- クエリで `SUM(e.amount)` を使用
- Expense エンティティには `incomeAmount` と `expenseAmount` のみ存在

### 2. JpaTagRepository - deletedAt フィールドエラー
```
Error: Could not resolve attribute 'deletedAt' of 'com.astarworks.astarmanagement.expense.domain.model.Tag'
```
- 7つのクエリで `AND t.deletedAt IS NULL` を使用
- Tag エンティティに `deletedAt` フィールドが存在しない

### 3. User エンティティ - password カラムマッピングエラー
```
Error: column "password" does not exist
```
- データベース: `password_hash` カラム
- エンティティ: `password` フィールド（マッピングなし）

## Acceptance Criteria
- [ ] アプリケーションが正常に起動する
- [ ] すべての JPA リポジトリクエリが正常に動作する
- [ ] エンティティとデータベーススキーマが整合している
- [ ] 既存のビジネスロジックに影響を与えない
- [ ] 適切なテストカバレッジが確保されている
- [ ] 技術仕様書が作成されている

## Technical Approach

### Option A: エンティティ側修正（選択）
理由：長期的な保守性とビジネスロジックの明確性を重視

#### 1. Expense エンティティ修正
```kotlin
@Entity
class Expense(
    // existing fields...
    
    @Formula("income_amount - expense_amount")
    val amount: BigDecimal? = null,
    
    // or alternative approach
    @Transient
    fun getAmount(): BigDecimal = incomeAmount - expenseAmount
)
```

#### 2. Tag エンティティ修正
```kotlin
@Entity
class Tag(
    // existing fields...
    
    @Column(name = "deleted_at")
    val deletedAt: Instant? = null
)
```

#### 3. User エンティティ修正
```kotlin
@Entity
data class User(
    // existing fields...
    
    @Column(name = "password_hash", nullable = false)
    val password: String
)
```

## Implementation Steps

### Phase 1: Entity Modifications
1. Expense エンティティに amount 計算フィールド追加
2. Tag エンティティに deletedAt フィールド追加
3. User エンティティに password_hash マッピング追加

### Phase 2: Migration Creation
1. V027 マイグレーション作成（Tag テーブルに deleted_at カラム追加）
2. 既存データの NULL 値設定

### Phase 3: Testing
1. エンティティ単体テスト作成
2. リポジトリ統合テスト作成
3. アプリケーション起動テスト

### Phase 4: Documentation
1. 変更内容の技術仕様書作成
2. 今後のデータモデル改善提案
3. ソフトデリート戦略のガイドライン

## Risks and Mitigation
- **リスク**: 既存データとの互換性問題
- **対策**: NULL 許可でフィールド追加、段階的移行

- **リスク**: パフォーマンスへの影響
- **対策**: インデックス戦略の見直し（V025 の更新）

## Success Metrics
- アプリケーション起動時間 < 10秒
- 全テストケース合格率 100%
- 既存機能への影響ゼロ

## Notes
- このタスクは緊急対応のため、最小限の変更で問題を解決
- 長期的なアーキテクチャ改善は別タスクで実施予定
- コードレビューで「無断変更」と判定された内容を正式化

## Output Log
[2025-08-04 09:20]: Task created for emergency backend fixes
[2025-08-04 09:21]: Starting implementation of entity modifications

[2025-08-04 14:10]: Code Review - FAIL
Result: **FAIL** - Critical implementation gaps prevent production readiness
**Scope:** Backend comprehensive review covering entire expense management system
**Findings:** 
1. Controller Implementation Status - Severity 8/10: All controller methods return stub responses instead of real implementations
2. Missing Service Layer - Severity 9/10: No service layer implementation found despite Clean Architecture requirements
3. API Response Format Deviation - Severity 7/10: API responses don't match documented format from expense-api-endpoints.md
4. Request Validation Logic Error - Severity 6/10: isAmountValid() method allows both amounts to be zero
5. Missing Balance Calculation Implementation - Severity 8/10: Balance field exists but no calculation service implemented
6. Database Schema Inconsistencies - Severity 5/10: Repository implementation completed but service layer missing
**Summary:** While database layer and API contracts are properly structured, the implementation is incomplete with stub controllers and missing business logic. Sprint S02_M002 (Database) appears complete but Sprint S03_M002 (Business Logic) not started.
**Recommendation:** Complete Sprint S03_M002 service layer implementation before any frontend integration attempts. Implement proper API response wrapping and fix validation logic errors.