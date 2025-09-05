# RLS (Row Level Security) テスト実装タスク

## 🎯 目的
PostgreSQLのRow Level Security機能を使用したマルチテナントデータ分離のテスト実装

## 📋 実装タスクリスト

### Phase 1: 基盤構築 【優先度: 最高】

#### Migration作成
- [ ] `V021__Add_RLS_to_workspace_tables.sql` を作成
  - [ ] workspacesテーブルへのRLS有効化
  - [ ] tablesテーブルへのRLS有効化
  - [ ] recordsテーブルへのRLS有効化
  - [ ] 各テーブルのポリシー定義

#### テストヘルパー実装
- [ ] `RLSTestHelper.kt` を作成
  - [ ] setRLSContext() メソッド実装
  - [ ] clearRLSContext() メソッド実装
  - [ ] validateSession() メソッド実装
  - [ ] getCurrentContext() メソッド実装

- [ ] `RLSTestDataBuilder.kt` を作成
  - [ ] マルチテナント環境構築メソッド
  - [ ] テストユーザー作成メソッド
  - [ ] ロール・権限設定メソッド

### Phase 2: コアテスト実装 【優先度: 高】

#### セキュリティ境界テスト
- [ ] `RLSSecurityIntegrationTest.kt` を作成
  - [ ] テナント間データ分離テスト
  - [ ] 権限エスカレーション防止テスト
  - [ ] 無効ユーザーアクセス拒否テスト
  - [ ] SQLインジェクション対策テスト

#### ポリシー検証テスト
- [ ] `RLSPolicyValidationTest.kt` を作成
  - [ ] tenant_usersテーブルのポリシーテスト
  - [ ] rolesテーブルのポリシーテスト
  - [ ] user_rolesテーブルのポリシーテスト
  - [ ] role_permissionsテーブルのポリシーテスト

### Phase 3: API層テスト 【優先度: 中】

#### Table API RLSテスト
- [ ] `TableRLSIntegrationTest.kt` を作成
  - [ ] 別テナントのテーブルアクセス不可テスト
  - [ ] 同一テナント内でのアクセス可能テスト
  - [ ] ワークスペース経由の権限継承テスト

#### Workspace API RLSテスト
- [ ] `WorkspaceRLSIntegrationTest.kt` を作成
  - [ ] テナント別ワークスペース分離テスト
  - [ ] 所有権ベースのアクセス制御テスト

### Phase 4: 統合テスト 【優先度: 中】

#### E2Eシナリオテスト
- [ ] `MultiTenantRLSScenarioTest.kt` を作成
  - [ ] 完全なユーザージャーニーテスト
  - [ ] 複数テナント同時操作テスト
  - [ ] ロール切り替えシナリオテスト

#### インターセプター動作テスト
- [ ] `RLSInterceptorIntegrationTest.kt` を作成
  - [ ] @Transactional自動設定テスト
  - [ ] ネストトランザクションテスト
  - [ ] 例外時のクリーンアップテスト

## 📁 ファイル配置

```
backend/src/
├── main/resources/db/migration/
│   └── V021__Add_RLS_to_workspace_tables.sql
│
└── test/kotlin/com/astarworks/astarmanagement/
    ├── integration/
    │   ├── security/
    │   │   ├── RLSSecurityIntegrationTest.kt
    │   │   ├── RLSPolicyValidationTest.kt
    │   │   └── RLSInterceptorIntegrationTest.kt
    │   ├── api/
    │   │   ├── table/
    │   │   │   └── TableRLSIntegrationTest.kt
    │   │   └── workspace/
    │   │       └── WorkspaceRLSIntegrationTest.kt
    │   └── scenario/rls/
    │       └── MultiTenantRLSScenarioTest.kt
    └── fixture/
        ├── helper/
        │   └── RLSTestHelper.kt
        └── builder/
            └── RLSTestDataBuilder.kt
```

## 🚨 重要な検証ポイント

### 必須確認事項
- [ ] 異なるテナント間でデータ漏洩がないこと
- [ ] 管理者権限の不正取得ができないこと
- [ ] システムロールが改竄されないこと
- [ ] セッション情報の偽装ができないこと

### パフォーマンス確認
- [ ] RLS有効時のクエリ性能が許容範囲内
- [ ] インデックスが適切に使用される
- [ ] 大量データでも動作する

## 📝 実装時の注意事項

1. **IntegrationTestBase継承**
   - すべての統合テストは`IntegrationTestBase`を継承
   - TestContainersは自動設定される

2. **テストデータ**
   - `IntegrationTestSetup.TestIds`の固定UUIDを使用
   - 再現性のあるテストデータを構築

3. **アサーション**
   - データ可視性の明示的チェック
   - 例外発生の確認
   - SQLレベルでの検証も実施

4. **クリーンアップ**
   - 各テスト後にRLSコンテキストをクリア
   - @Transactionalで自動ロールバック

## 🔄 進捗状況

| フェーズ | ステータス | 完了率 |
|---|---|---|
| Phase 1: 基盤構築 | 未着手 | 0% |
| Phase 2: コアテスト | 未着手 | 0% |
| Phase 3: API層テスト | 未着手 | 0% |
| Phase 4: 統合テスト | 未着手 | 0% |

## 次のアクション
1. V021マイグレーションファイル作成から開始
2. RLSTestHelper実装
3. RLSSecurityIntegrationTest作成

---
作成日: 2025-09-02
最終更新: 2025-09-02
担当: Development Team