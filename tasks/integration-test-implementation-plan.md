# 結合テスト実装計画

## 📋 概要
Astar Management バックエンドの認可システム結合テスト実装計画

**作成日**: 2025-01-02  
**更新日**: 2025-01-02  
**優先度**: 高  

## 🎯 Phase 1: AuthorizationServiceIntegrationTest (最優先)

### 実装ファイル
`backend/src/test/kotlin/com/astarworks/astarmanagement/integration/auth/AuthorizationServiceIntegrationTest.kt`

### テストケース詳細

#### 1. 権限評価テスト
```kotlin
@Test fun `should evaluate GeneralRule with ALL scope correctly`()
@Test fun `should evaluate GeneralRule with TEAM scope correctly`()
@Test fun `should evaluate GeneralRule with OWN scope correctly`()
@Test fun `should evaluate ResourceGroupRule correctly`()
@Test fun `should evaluate ResourceIdRule correctly`()
@Test fun `should respect scope hierarchy ALL > TEAM > OWN`()
```

#### 2. ロール集約テスト
```kotlin
@Test fun `should aggregate permissions from multiple roles`()
@Test fun `should return empty permissions for user without roles`()
@Test fun `should update permissions when role is added`()
@Test fun `should update permissions when role is removed`()
@Test fun `should handle role with no permissions`()
```

#### 3. アクション包含テスト
```kotlin
@Test fun `MANAGE action should include all other actions`()
@Test fun `VIEW action should not include CREATE action`()
@Test fun `should evaluate action inclusion in permission check`()
```

#### 4. キャッシュ動作テスト
```kotlin
@Test fun `should cache user effective permissions`()
@Test fun `should evict cache when role is updated`()
@Test fun `should evict cache when permission is updated`()
```

### 必要なテストデータ
- テナント: 2つ (TenantA, TenantB)
- ユーザー: 4つ (Admin, Editor, Viewer, NoRole)
- ロール: 3つ (AdminRole, EditorRole, ViewerRole)
- 権限ルール:
  - AdminRole: table.manage.all, document.manage.all
  - EditorRole: table.edit.team, document.edit.own
  - ViewerRole: table.view.all, document.view.all

### 実装順序
1. テストクラスとセットアップメソッド作成
2. 権限評価テスト実装（6ケース）
3. ロール集約テスト実装（5ケース）
4. アクション包含テスト実装（3ケース）
5. キャッシュ動作テスト実装（3ケース）

### 期待される動作

#### スコープ階層の評価
- ALL権限を持つユーザーは、TEAM/OWN/RESOURCE_GROUP/RESOURCE_IDすべてにアクセス可能
- TEAM権限を持つユーザーは、OWNも含むがALLは含まない
- OWN権限を持つユーザーは、自分のリソースのみアクセス可能

#### 複数ロール集約
- ユーザーAがRole1(table.view.all)とRole2(table.edit.team)を持つ場合
- 最終的な権限は両方の和集合となる
- 重複する権限は1つにまとめられる

#### MANAGEアクション
- table.manage.allは以下をすべて含む:
  - table.view.all
  - table.create.all
  - table.edit.all
  - table.delete.all
  - table.export.all
  - table.import.all

## 🎯 Phase 2: RoleControllerAuthorizationTest

### 実装ファイル
`backend/src/test/kotlin/com/astarworks/astarmanagement/integration/auth/RoleControllerAuthorizationTest.kt`

### エンドポイント権限マトリックス
| エンドポイント | 必要権限 | テストケース |
|------------|---------|------------|
| GET /api/roles | role.view.all | 権限ありで200, なしで403 |
| POST /api/roles | role.create.all | 権限ありで201, なしで403 |
| PUT /api/roles/{id} | role.edit.all | 権限ありで200, なしで403 |
| DELETE /api/roles/{id} | role.delete.all | 権限ありで204, なしで403 |

## 🎯 Phase 3: ResourceAccessIntegrationTest

### 実装ファイル
`backend/src/test/kotlin/com/astarworks/astarmanagement/integration/auth/ResourceAccessIntegrationTest.kt`

### リソースオーナーシップテスト
- OWNスコープ: リソース所有者のみアクセス可能
- TEAMスコープ: 同じチームメンバーがアクセス可能
- ResourceIdRule: 特定リソースIDへの直接アクセス
- ResourceGroupRule: グループに属するリソースへのアクセス

## 🎯 Phase 4: MultiTenantSecurityIntegrationTest

### 実装ファイル
`backend/src/test/kotlin/com/astarworks/astarmanagement/integration/auth/MultiTenantSecurityIntegrationTest.kt`

### セキュリティテスト
- テナント間データ分離
- 権限昇格防止
- 不正アクセス検知
- 監査ログ記録

## 📊 成功指標
- すべてのテストケースがグリーン
- カバレッジ80%以上達成
- 実行時間5分以内
- CI/CDパイプライン統合完了

## 🔗 関連ファイル
- [全体計画](./authorization-test-implementation-plan.md)
- [実装済みフィクスチャ](../backend/src/test/kotlin/com/astarworks/astarmanagement/fixture/)
- [AuthorizationService](../backend/src/main/kotlin/com/astarworks/astarmanagement/core/auth/domain/service/AuthorizationService.kt)