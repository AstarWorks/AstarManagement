# Authorization Integration Test 実装計画

## 📋 概要

Astar Management バックエンドの認可システム（PermissionRule、Role、Scope）に関する包括的なテスト実装計画。

**作成日**: 2025-01-02  
**優先度**: 高  
**推定期間**: 4週間

## 🎯 目標

1. 認可システムのテストカバレッジ80%以上達成
2. 権限チェックの抜け漏れ防止
3. リグレッション防止の仕組み構築
4. テストによるシステム仕様のドキュメント化

## 📁 ファイル配置計画

```
backend/src/test/kotlin/com/astarworks/astarmanagement/
├── integration/
│   └── auth/
│       ├── AuthenticationIntegrationTest.kt (既存)
│       ├── AuthorizationIntegrationTest.kt (新規) ← メイン統合テスト
│       ├── PermissionRuleIntegrationTest.kt (新規)
│       └── RoleManagementIntegrationTest.kt (新規)
├── unit/
│   └── core/
│       └── auth/
│           ├── domain/
│           │   ├── model/
│           │   │   ├── PermissionRuleTest.kt (新規)
│           │   │   ├── ScopeHierarchyTest.kt (新規)
│           │   │   └── ActionInclusionTest.kt (新規)
│           │   └── service/
│           │       ├── AuthorizationServiceTest.kt (新規)
│           │       └── RolePermissionServiceTest.kt (新規)
│           └── infrastructure/
│               └── security/
│                   ├── CustomMethodSecurityExpressionRootTest.kt (新規)
│                   └── PermissionEvaluatorTest.kt (新規)
├── fixture/
│   ├── builder/
│   │   ├── PermissionTestDataBuilder.kt (新規)
│   │   └── RoleTestDataBuilder.kt (新規)
│   └── setup/
│       └── AuthorizationTestSetup.kt (新規)
└── slice/
    └── web/
        └── auth/
            ├── TableControllerAuthorizationTest.kt (新規)
            └── RoleControllerAuthorizationTest.kt (新規)
```

## 🚀 実装フェーズ

### Phase 1: 基盤テストとフィクスチャ作成（Week 1）

#### タスクリスト
- [ ] `AuthorizationTestBase.kt` - 認可テスト用基底クラス作成
- [ ] `AuthorizationTestSetup.kt` - テストシナリオセットアップ
- [ ] `PermissionTestDataBuilder.kt` - 権限テストデータビルダー
- [ ] `RoleTestDataBuilder.kt` - ロールテストデータビルダー

#### 主要メソッド
```kotlin
// AuthorizationTestBase.kt
- withUser(userId: UUID, block: () -> Unit)
- withTenant(tenantId: UUID, block: () -> Unit)
- assertPermissionGranted(permission: String)
- assertPermissionDenied(permission: String)

// AuthorizationTestSetup.kt
- setupComplexPermissionScenario()
- setupResourceOwnershipScenario()
- setupTeamAccessScenario()
- setupResourceGroupScenario()
```

### Phase 2: ドメインモデル単体テスト（Week 2）

#### タスクリスト
- [ ] `PermissionRuleTest.kt` - PermissionRuleモデルテスト
- [ ] `ScopeHierarchyTest.kt` - スコープ階層テスト
- [ ] `ActionInclusionTest.kt` - アクション包含テスト
- [ ] `AuthorizationServiceTest.kt` - 認可サービステスト
- [ ] `RolePermissionServiceTest.kt` - ロール権限サービステスト

#### 主要テストケース
```kotlin
// PermissionRuleTest.kt
@Test fun `should parse GeneralRule from database string`()
@Test fun `should parse ResourceGroupRule with UUID`()
@Test fun `should parse ResourceIdRule with UUID`()
@Test fun `should reject invalid permission format`()

// ScopeHierarchyTest.kt
@Test fun `ALL scope should include all other scopes`()
@Test fun `TEAM scope should include OWN but not ALL`()
@Test fun `scope hierarchy should be transitive`()
```

### Phase 3: 統合テスト実装（Week 3）

#### タスクリスト
- [ ] `AuthorizationIntegrationTest.kt` - メイン認可統合テスト
- [ ] `PermissionRuleIntegrationTest.kt` - 権限ルール統合テスト
- [ ] `RoleManagementIntegrationTest.kt` - ロール管理統合テスト

#### テストカテゴリ
1. **Permission Rule Evaluation**
   - ALL/TEAM/OWNスコープの評価
   - スコープ階層の検証
   - MANAGEアクションのワイルドカード動作

2. **Role-Based Access Control**
   - 複数ロールからの権限集約
   - 動的ロール更新の反映
   - ロール優先順位の処理

3. **Resource Access Control**
   - リソースオーナーシップ確認
   - チームメンバーシップ確認
   - ResourceIdRuleによる特定リソースアクセス
   - ResourceGroupRuleによるグループベースアクセス

4. **API Protection**
   - @PreAuthorizeアノテーションの動作確認
   - 403 Forbiddenレスポンスの検証
   - 権限による条件付きアクセス

### Phase 4: API層とセキュリティテスト（Week 4）

#### タスクリスト
- [ ] `TableControllerAuthorizationTest.kt` - テーブルAPI認可テスト
- [ ] `RoleControllerAuthorizationTest.kt` - ロールAPI認可テスト
- [ ] `PermissionSecurityTest.kt` - セキュリティエッジケーステスト

#### セキュリティテストケース
```kotlin
@Test fun `should prevent privilege escalation`()
@Test fun `should prevent cross-tenant data access`()
@Test fun `should audit permission denials`()
@Test fun `should handle malformed permission strings`()
```

## 📊 テストケース一覧

### 優先度: 高（必須）
1. ✅ PermissionRule文字列パース
2. ✅ スコープ階層評価（ALL > TEAM > OWN）
3. ✅ 複数ロールからの権限集約
4. ✅ @PreAuthorize統合
5. ✅ テナント分離
6. ✅ 403 Forbiddenレスポンス

### 優先度: 中
1. ⏳ ResourceGroupRule評価
2. ⏳ ResourceIdRule評価
3. ⏳ 動的ロール更新
4. ⏳ キャッシュ動作確認
5. ⏳ 権限昇格防止

### 優先度: 低
1. 📝 パフォーマンステスト
2. 📝 並行アクセステスト
3. 📝 異常系網羅テスト

## 🛠️ 技術スタック

- **テストフレームワーク**: JUnit 5
- **モック**: Mockito-Kotlin
- **アサーション**: AssertJ
- **統合テスト**: @SpringBootTest, @AutoConfigureMockMvc
- **データベース**: Testcontainers (PostgreSQL)
- **認証**: JWT生成ヘルパー

## 📈 成功指標

1. **カバレッジ目標**
   - ラインカバレッジ: 80%以上
   - ブランチカバレッジ: 70%以上
   - クラスカバレッジ: 90%以上

2. **品質指標**
   - すべてのPublic APIにテスト存在
   - エッジケースカバー率: 80%以上
   - テスト実行時間: 5分以内

3. **保守性**
   - テストコードの重複率: 10%以下
   - テストメソッド名の明確性: 100%
   - フィクスチャの再利用率: 70%以上

## 🔄 進捗管理

### Week 1 (基盤構築)
- [ ] フィクスチャ作成完了
- [ ] テスト基底クラス実装
- [ ] ビルダーパターン実装

### Week 2 (単体テスト)
- [ ] ドメインモデルテスト完了
- [ ] サービス層テスト完了
- [ ] カバレッジ60%達成

### Week 3 (統合テスト)
- [ ] 認可統合テスト完了
- [ ] ロール管理テスト完了
- [ ] カバレッジ75%達成

### Week 4 (完成)
- [ ] API層テスト完了
- [ ] セキュリティテスト完了
- [ ] カバレッジ80%達成
- [ ] ドキュメント更新

## 📝 備考

- テスト実装時は`@Transactional`でロールバック制御
- 各テストは独立して実行可能にする
- CI/CDパイプラインでの自動実行を考慮
- テストデータは固定IDを使用して決定的にする

## 🔗 関連ドキュメント

- [認可システム設計書](../docs/60-common/auth/permission-system-redesign.md)
- [Discord風ロールシステム](../CLAUDE.md#discord風ロールシステム)
- [Spring Security統合](../backend/src/main/kotlin/com/astarworks/astarmanagement/core/auth/infrastructure/config/MethodSecurityConfig.kt)

---

**最終更新**: 2025-01-02  
**作成者**: Claude  
**レビュー状態**: 未レビュー