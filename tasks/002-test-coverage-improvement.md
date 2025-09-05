# テストカバレッジ改善計画

## 📊 現状分析

### カバレッジ状況
| コンポーネント | 実装数 | テスト数 | カバレッジ |
|---|---|---|---|
| **Controller** | 14 | 0 | 0% |
| **Service** | 20 | 1 | 5% |
| **Repository** | 34 | 0 | 0% |
| **Domain Model** | 多数 | 1 | <5% |

### 重大なギャップ
- ❌ 新機能（Table/Workspace/Record）のテストが完全欠落
- ❌ マルチテナント分離のテストなし
- ❌ 権限管理（RBAC）のテストなし
- ❌ リポジトリ層のテストなし

## 🎯 改善ロードマップ

### Priority 1: セキュリティ・クリティカルパス 【今すぐ】

#### RLSテスト
- [ ] RLS基本機能テスト実装（→ 001-rls-test-implementation.md参照）
- [ ] マルチテナント分離検証
- [ ] 権限エスカレーション防止テスト

#### 認証・認可テスト
- [ ] JWT認証フローテスト強化
- [ ] ロールベースアクセス制御テスト
- [ ] APIエンドポイント保護テスト

### Priority 2: コア機能テスト 【今週中】

#### Table/Workspace/Record機能
- [ ] `TableServiceTest.kt` 作成
  - [ ] テーブル作成・更新・削除
  - [ ] プロパティ管理
  - [ ] テンプレート適用
  
- [ ] `WorkspaceServiceTest.kt` 作成
  - [ ] ワークスペース作成・更新
  - [ ] テナント関連付け
  - [ ] 所有権管理

- [ ] `RecordServiceTest.kt` 作成
  - [ ] レコードCRUD操作
  - [ ] バリデーション
  - [ ] バッチ操作

#### Repository層テスト
- [ ] `TableRepositoryTest.kt` 作成
- [ ] `WorkspaceRepositoryTest.kt` 作成
- [ ] `RecordRepositoryTest.kt` 作成
- [ ] Spring Data JDBCトランザクションテスト

### Priority 3: Controller層テスト 【来週】

#### REST APIテスト
- [ ] `TableControllerTest.kt` 作成
  - [ ] RESTfulエンドポイント
  - [ ] リクエスト/レスポンスマッピング
  - [ ] エラーハンドリング

- [ ] `WorkspaceControllerTest.kt` 作成
- [ ] `RecordControllerTest.kt` 作成
- [ ] `AuthControllerTest.kt` 強化

### Priority 4: ドメインモデルテスト 【2週間以内】

#### エンティティテスト
- [ ] `TableTest.kt` - ビジネスルール検証
- [ ] `WorkspaceTest.kt` - バリデーション
- [ ] `RecordTest.kt` - データ整合性
- [ ] `DynamicRoleTest.kt` - 権限ルール

#### Value Objectテスト
- [ ] `EntityIdTest.kt` - ID生成・検証
- [ ] `TenantIdTest.kt` - テナントID管理
- [ ] `WorkspaceIdTest.kt` - ワークスペースID管理

### Priority 5: 統合・E2Eテスト 【3週間以内】

#### シナリオテスト
- [ ] ユーザージャーニーテスト
- [ ] マルチテナント操作シナリオ
- [ ] 権限切り替えシナリオ
- [ ] エラーリカバリーシナリオ

#### パフォーマンステスト
- [ ] 大量データ処理テスト
- [ ] 同時アクセステスト
- [ ] RLS性能影響測定

## 📝 実装ガイドライン

### テスト作成基準

#### Unit Test (70%)
```kotlin
@UnitTest
class SomeServiceTest : UnitTestBase() {
    // Mockを使用した単体テスト
    // ビジネスロジックに焦点
}
```

#### Integration Test (20%)
```kotlin
@IntegrationTest
class SomeIntegrationTest : IntegrationTestBase() {
    // TestContainersを使用
    // 実DBでの動作確認
}
```

#### E2E Test (10%)
```kotlin
@E2ETest
class SomeE2ETest {
    // 完全なアプリケーション起動
    // ユーザー視点のシナリオ
}
```

### テストの品質基準

1. **Arrange-Act-Assert パターン**
```kotlin
@Test
fun `should calculate total correctly`() {
    // Arrange
    val items = listOf(Item(100), Item(200))
    
    // Act
    val total = service.calculateTotal(items)
    
    // Assert
    assertThat(total).isEqualTo(300)
}
```

2. **Given-When-Then 形式**
```kotlin
@Test
@DisplayName("Given valid user, When login, Then return JWT token")
fun testLogin() {
    // Implementation
}
```

3. **エラーケースも必須**
```kotlin
@Test
fun `should throw exception when invalid input`() {
    assertThrows<ValidationException> {
        service.process(invalidData)
    }
}
```

## 🎯 目標メトリクス

### 短期目標（1ヶ月）
- 全体カバレッジ: 30%以上
- クリティカルパス: 80%以上
- 新機能: 50%以上

### 中期目標（3ヶ月）
- 全体カバレッジ: 60%以上
- Service層: 80%以上
- Controller層: 70%以上

### 長期目標（6ヶ月）
- 全体カバレッジ: 80%以上
- ミューテーションテスト導入
- パフォーマンステスト自動化

## 🚀 次のアクション

### 今すぐ開始
1. [ ] RLSテスト実装（001-rls-test-implementation.md）
2. [ ] TableServiceTest作成
3. [ ] WorkspaceServiceTest作成

### 今週中に完了
4. [ ] RecordServiceTest作成
5. [ ] 基本的なRepository層テスト
6. [ ] 認証・認可テスト強化

## 📊 進捗トラッキング

| 週 | 目標 | 実績 | 達成率 |
|---|---|---|---|
| Week 1 | RLS + Service層 5件 | - | 0% |
| Week 2 | Repository層 10件 | - | 0% |
| Week 3 | Controller層 5件 | - | 0% |
| Week 4 | 統合テスト 3件 | - | 0% |

## 🔧 必要なツール・設定

### 導入済み
- ✅ JUnit 5
- ✅ Mockito/MockK
- ✅ TestContainers
- ✅ Spring Boot Test

### 導入検討
- [ ] Testcontainers Cloud (CI高速化)
- [ ] Pitest (ミューテーションテスト)
- [ ] JaCoCo (カバレッジレポート)
- [ ] ArchUnit (アーキテクチャテスト)

## 📝 チームへの共有事項

1. **テストファースト開発の推奨**
   - 新機能開発時は先にテストを書く
   - バグ修正時は再現テストを先に作成

2. **レビュー基準**
   - テストなしのPRは原則マージ不可
   - カバレッジ低下するPRは要説明

3. **継続的改善**
   - 週次でカバレッジレポート確認
   - 月次で改善計画見直し

---
作成日: 2025-09-02
最終更新: 2025-09-02
担当: Development Team