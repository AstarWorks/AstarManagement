# 権限システム移行ガイド

## 1. 概要

本ドキュメントは、既存の文字列ベース権限システムから、新しい型安全な権限システムへの移行手順を説明します。

## 2. 移行の影響範囲

### 2.1 破壊的変更

| コンポーネント | 影響箇所数 | 重要度 |
|------------|-----------|--------|
| TableController | 17箇所 | 高 |
| RecordController | 3箇所 | 高 |
| TableSecurityExpressions | 全体 | 高（削除対象） |
| ResourceAccessEvaluator | evaluateAccess()メソッド | 高 |
| AuthorizationService | 全体的な再設計 | 高 |
| RolePermissionMapper | 権限パース処理 | 中 |

### 2.2 新規追加

- ResourceGroup関連のモデル、サービス、リポジトリ
- 新しいScope（RESOURCE_GROUP、RESOURCE_ID）
- 型安全なPermissionRule評価エンジン

## 3. 移行フェーズ

### Phase 1: 準備フェーズ（影響なし）

#### 1.1 新モデルの追加

```kotlin
// 新しいScopeの追加（既存コードに影響なし）
enum class Scope {
    ALL,
    TEAM,
    OWN,
    RESOURCE_GROUP,  // 新規
    RESOURCE_ID      // 新規
}
```

#### 1.2 ResourceGroup基盤の構築

```sql
-- 新テーブルの作成（既存テーブルに影響なし）
CREATE TABLE resource_groups (...);
CREATE TABLE resource_group_memberships (...);
```

### Phase 2: 並行稼働フェーズ

#### 2.1 AuthorizationServiceの拡張

```kotlin
@Service
class AuthorizationService {
    // 既存メソッド（維持）
    fun hasPermission(tenantUserId: UUID, permission: String): Boolean {
        // 既存の実装を維持
    }
    
    // 新メソッド（追加）
    fun hasPermissionRule(tenantUserId: UUID, rule: PermissionRule): Boolean {
        // 新しい型安全な実装
    }
    
    // 移行用ブリッジメソッド
    fun evaluatePermission(tenantUserId: UUID, permission: String): Boolean {
        // 新旧両方の形式をサポート
        return try {
            val rule = PermissionRule.fromString(permission)
            if (rule != null) {
                hasPermissionRule(tenantUserId, rule)
            } else {
                hasPermission(tenantUserId, permission)  // フォールバック
            }
        } catch (e: Exception) {
            logger.warn("Failed to parse permission: $permission", e)
            hasPermission(tenantUserId, permission)  // フォールバック
        }
    }
}
```

#### 2.2 CustomMethodSecurityExpressionRootの拡張

```kotlin
@Component
class CustomMethodSecurityExpressionRoot {
    // 既存メソッド（維持）
    fun hasPermission(permission: String): Boolean {
        // 既存の実装
    }
    
    // 新メソッド（追加）
    fun hasPermissionRule(rule: String, resourceId: UUID? = null): Boolean {
        // 新しい実装
    }
    
    // 便利メソッド（追加）
    fun canAccessResource(
        resourceId: UUID,
        resourceType: String,
        permission: String
    ): Boolean {
        // Scope階層を評価
    }
}
```

### Phase 3: Controller移行フェーズ

#### 3.1 TableController修正例

**Before（壊れている）:**
```kotlin
@GetMapping("/{id}")
@PreAuthorize("@tableSecurityExpressions.canViewTable(#id)")
fun getTable(@PathVariable id: UUID): TableDto
```

**After（型安全）:**
```kotlin
@GetMapping("/{id}")
@PreAuthorize("""
    hasPermissionRule('table.view.all') or
    (hasPermissionRule('table.view.team') and isTeamResource(#id, 'TABLE')) or
    (hasPermissionRule('table.view.own') and isOwnResource(#id, 'TABLE')) or
    canAccessResource(#id, 'TABLE', 'VIEW')
""")
fun getTable(@PathVariable id: UUID): TableDto
```

**簡略版:**
```kotlin
@GetMapping("/{id}")
@PreAuthorize("canAccessResource(#id, 'TABLE', 'VIEW')")
fun getTable(@PathVariable id: UUID): TableDto
```

#### 3.2 一覧取得の修正

**Before:**
```kotlin
@GetMapping
@PreAuthorize("@tableSecurityExpressions.canViewTablesInWorkspace(#workspaceId)")
fun listTables(@RequestParam workspaceId: UUID): List<TableDto>
```

**After:**
```kotlin
@GetMapping
@PreAuthorize("isAuthenticated()")  // 認証のみ
fun listTables(
    @RequestParam(required = false) workspaceId: UUID?,
    @PageableDefault pageable: Pageable
): Page<TableDto> {
    // Service層で権限フィルタリング
    return tableService.findAccessibleTables(workspaceId, pageable)
}
```

### Phase 4: Service層の移行

#### 4.1 権限フィルタリング実装

```kotlin
@Service
class TableService {
    // 新実装
    fun findAccessibleTables(
        workspaceId: UUID?,
        pageable: Pageable
    ): Page<TableDto> {
        val userId = getCurrentUserId()
        val userRules = authorizationService.getUserEffectivePermissionRules(userId)
        
        // Scope階層に基づくフィルタリング
        val specification = buildAccessSpecification(userId, userRules, workspaceId)
        return tableRepository.findAll(specification, pageable).map { it.toDto() }
    }
    
    // 移行期間中の互換性メソッド
    @Deprecated("Use findAccessibleTables instead")
    fun findByWorkspace(workspaceId: UUID): List<TableDto> {
        return findAccessibleTables(workspaceId, Pageable.unpaged()).content
    }
}
```

### Phase 5: クリーンアップフェーズ

#### 5.1 削除対象

```kotlin
// 削除
@Component("tableSecurityExpressions")
class TableSecurityExpressions  // 完全削除

// 削除
fun canAccessWorkspace(workspaceId: UUID, scope: String)  // "edit"などの誤用

// 削除または書き換え
fun evaluateAccess(tenantUserId: UUID, resourceId: UUID, 
                  resourceType: String, scope: String)  // String → Enum
```

## 4. データ移行

### 4.1 既存権限の変換

```sql
-- 既存の権限文字列を新形式に変換
UPDATE role_permissions
SET permission_rule = 
    CASE 
        WHEN permission_rule = 'table.view' THEN 'table.view.all'
        WHEN permission_rule = 'table.edit' THEN 'table.edit.all'
        WHEN permission_rule = 'table.delete' THEN 'table.delete.all'
        WHEN permission_rule LIKE '%.all' THEN permission_rule
        WHEN permission_rule LIKE '%.team' THEN permission_rule
        WHEN permission_rule LIKE '%.own' THEN permission_rule
        ELSE permission_rule
    END
WHERE permission_rule NOT LIKE '%.%.$%';
```

### 4.2 ResourceGroup初期データ

```kotlin
// 部署別グループの作成
val departments = listOf("経理部", "営業部", "開発部", "人事部")
departments.forEach { dept ->
    resourceGroupService.createResourceGroup(
        name = dept,
        resourceType = ResourceType.TABLE,
        metadata = mapOf("type" to "department")
    )
}

// 既存リソースのグループ割り当て
tableRepository.findAll().forEach { table ->
    val departmentGroup = determineDepartmentGroup(table)
    resourceGroupService.addResourceToGroup(table.id, departmentGroup.id)
}
```

## 5. テスト戦略

### 5.1 統合テストの修正

```kotlin
@SpringBootTest
class PermissionIntegrationTest {
    
    @Test
    fun `should handle both old and new permission formats during migration`() {
        // 旧形式
        val oldPermission = "table.view"
        assertTrue(authorizationService.evaluatePermission(userId, oldPermission))
        
        // 新形式
        val newPermission = "table.view.all"
        assertTrue(authorizationService.evaluatePermission(userId, newPermission))
        
        // ResourceGroup形式
        val groupPermission = "table.view.resource_group:$groupId"
        assertTrue(authorizationService.evaluatePermission(userId, groupPermission))
    }
}
```

### 5.2 403エラーの解決確認

```kotlin
@Test
fun `MultiTenantIsolationTests should pass after migration`() {
    // 問題の原因だった403エラーが解決することを確認
    
    // Before: canAccessWorkspace(workspaceId, "edit") → 403
    // After: canAccessResource(workspaceId, 'WORKSPACE', 'EDIT') → 200
    
    mockMvc.perform(
        post("/api/tables")
            .contentType(MediaType.APPLICATION_JSON)
            .content(createTableRequest)
    )
    .andExpect(status().isOk)  // 403ではなく200
}
```

## 6. ロールバック計画

### 6.1 フィーチャーフラグによる制御

```yaml
# application.yml
features:
  use-new-permission-system: false  # 本番では最初false
  maintain-backward-compatibility: true
```

```kotlin
@Service
class AuthorizationService {
    @Value("\${features.use-new-permission-system}")
    private val useNewSystem: Boolean = false
    
    fun evaluatePermission(tenantUserId: UUID, permission: String): Boolean {
        return if (useNewSystem) {
            // 新システム
            val rule = PermissionRule.fromString(permission)
            hasPermissionRule(tenantUserId, rule!!)
        } else {
            // 旧システム
            hasPermission(tenantUserId, permission)
        }
    }
}
```

### 6.2 段階的ロールアウト

1. **開発環境**: 新システムを有効化
2. **ステージング環境**: 1週間のテスト期間
3. **本番環境**: 
   - 10%のユーザーで新システム
   - 問題なければ50%
   - 最終的に100%

## 7. 監視とアラート

### 7.1 メトリクス

```kotlin
@Component
class PermissionMetrics {
    private val oldSystemCounter = meterRegistry.counter("permission.evaluation.old")
    private val newSystemCounter = meterRegistry.counter("permission.evaluation.new")
    private val migrationErrorCounter = meterRegistry.counter("permission.migration.error")
    
    fun recordEvaluation(isNewSystem: Boolean) {
        if (isNewSystem) {
            newSystemCounter.increment()
        } else {
            oldSystemCounter.increment()
        }
    }
}
```

### 7.2 ログ監視

```kotlin
// 移行期間中の詳細ログ
logger.info("Permission evaluation: " +
    "user=$tenantUserId, " +
    "permission=$permission, " +
    "system=${if (useNewSystem) "NEW" else "OLD"}, " +
    "result=$result")

// エラー監視
logger.error("Permission migration failed: " +
    "permission=$permission, " +
    "error=${e.message}")
```

## 8. チェックリスト

### 移行前
- [ ] 全テストがパスすることを確認
- [ ] データベースバックアップ
- [ ] ロールバック手順の確認
- [ ] フィーチャーフラグの設定

### Phase 1
- [ ] 新モデル（Scope, PermissionRule）の追加
- [ ] ResourceGroupテーブルの作成
- [ ] 基本的なResourceGroupServiceの実装

### Phase 2
- [ ] AuthorizationServiceの拡張
- [ ] CustomMethodSecurityExpressionRootの拡張
- [ ] 並行稼働の確認

### Phase 3
- [ ] TableControllerの修正（17箇所）
- [ ] RecordControllerの修正（3箇所）
- [ ] その他Controllerの修正

### Phase 4
- [ ] Service層の権限フィルタリング実装
- [ ] 既存データの移行スクリプト実行
- [ ] 統合テストの修正と実行

### Phase 5
- [ ] TableSecurityExpressionsの削除
- [ ] 古い権限評価コードの削除
- [ ] ドキュメントの更新

### 移行後
- [ ] 本番環境でのメトリクス監視
- [ ] パフォーマンステスト
- [ ] ユーザーフィードバック収集
- [ ] 最終的なクリーンアップ

## 9. トラブルシューティング

### 9.1 よくある問題

**問題**: 403 Forbiddenエラーが継続する
```
原因: 権限文字列の形式が正しくない
解決: PermissionRule.fromString()でパース可能か確認
```

**問題**: 一覧取得で何も表示されない
```
原因: 権限フィルタリングが厳しすぎる
解決: ALL scopeの権限があるか確認
```

**問題**: ResourceGroupが機能しない
```
原因: リソースがグループに所属していない
解決: ResourceGroupMembershipを確認
```

### 9.2 緊急時の対応

```kotlin
// 緊急時の一時的な権限バイパス（本番では使用しない）
@Profile("emergency")
@Component
class EmergencyAuthorizationOverride {
    fun bypassAllChecks(): Boolean {
        logger.error("EMERGENCY: Authorization bypass is active!")
        return true
    }
}
```

## 10. まとめ

この移行により、以下が実現されます：

1. **型安全性**: コンパイル時のエラー検出
2. **保守性**: 明確な責任分離と一貫した実装
3. **拡張性**: 新しいScope追加が容易
4. **パフォーマンス**: 階層的評価による最適化
5. **信頼性**: テスト可能な設計

移行は段階的に実施し、各フェーズで動作確認を行いながら進めることで、リスクを最小限に抑えます。