# データベース設計

## 設計方針

- **認証**: Auth0に完全委譲（パスワード管理なし）
- **マルチテナント**: 1ユーザーが複数組織に所属可能（Slack型）
- **権限管理**: Discord風の柔軟なロールシステム（デフォルトロールなし）
- **最小構成**: MVPに必要な7テーブルのみ

## 現在のテーブル構成

実際のスキーマ定義は [migration files](../../../backend/src/main/resources/db/migration/) を参照。

### 1. users
Auth0アカウントの参照。1つのAuth0アカウントで複数テナントに参加可能。
- `auth0_sub` (UNIQUE) - Auth0の識別子（真のID）
- `email` - メールアドレス（UNIQUEではない、表示用キャッシュ）

### 2. tenants  
組織/ワークスペースの管理。
- `is_active` - テナント全体が有効か（料金支払い、停止状態など）

### 3. tenant_users
ユーザーとテナントの多対多リレーション。
- `tenant_id`, `user_id` - 所属関係
- `is_active` - このメンバーシップが有効か（退職、一時停止など）
- `UNIQUE(tenant_id, user_id)` - 重複防止

### 4. roles
テナントごとのロール定義（admin, user, viewer）。
- Discord風: 新規ユーザーはロールなしがデフォルト
- 管理者が明示的にロールを付与

### 5. user_roles
テナントコンテキストでのロール割り当て。
- `tenant_user_id` - tenant_users を参照（テナントコンテキスト）
- `role_id` - 割り当てるロール

### 6. role_permissions
ロールごとの権限ルール（`resource.action.scope`形式）。
- 例: `table.view.all`, `document.edit.own`

### 7. user_profiles
ユーザーの表示名とアバター画像。

## ビューと関数

### v_user_tenant_roles (VIEW)
よく使うJOINパターンをまとめたビュー。ユーザー、テナント、ロール情報を統合。
- `is_fully_active` - テナントもメンバーシップも両方有効な場合のみTRUE

### user_has_permission() (FUNCTION)
ユーザーが特定のテナントで権限を持つかチェック。
```sql
SELECT user_has_permission(user_id, tenant_id, 'table.edit.all');
```

## 重要な設計判断

### 2種類のis_active
- **tenants.is_active**: 組織全体の状態（料金未払い、サービス停止など）
- **tenant_users.is_active**: 個人のメンバーシップ状態（退職、アクセス停止など）

両方がTRUEの場合のみ、ユーザーはそのテナントにアクセス可能。

### Discord風ロールシステム
- **デフォルトロールなし**: 新規ユーザーは何も権限を持たない
- **明示的な付与**: 管理者が意図的にロールを割り当てる
- **複数ロール可能**: 1ユーザーが複数のロールを持てる

### なぜemailがUNIQUEではないのか？
- Auth0が真の認証プロバイダー
- auth0_subが真の識別子
- 同じメールでも別のAuth0アカウントの可能性（開発/本番環境など）

## セキュリティ実装の注意点

### テナントコンテキストの徹底
```kotlin
// ❌ 悪い例：テナントを考慮しない
fun getUser(userId: UUID): User

// ✅ 良い例：常にテナントコンテキスト
fun getUserInTenant(userId: UUID, tenantId: UUID): User? {
    // tenant_usersテーブルで所属確認
    val tenantUser = tenantUserRepo.findByUserAndTenant(userId, tenantId)
        ?: throw UnauthorizedException("User not in tenant")
    // ...
}
```

### クロステナントアクセス防止
- 全てのクエリでtenantIdをWHERE句に含める
- JWTにtenantIdを含めて検証
- APIレベルでテナント境界を守る

## Row Level Security (RLS)

### 概要
V010でRLSを実装。データベースレベルでテナント間のデータ分離を保証。

### RLS有効テーブル
- **tenant_users**: テナントメンバーシップ
- **roles**: ロール定義
- **user_roles**: ロール割り当て
- **role_permissions**: 権限ルール

### データベースユーザー
- **app_user**: アプリケーション接続用（RLS適用）
- **postgres**: 管理用（RLSバイパス）

### アプリケーション実装

#### 1. 接続設定
```kotlin
// app_userで接続
val dataSource = HikariDataSource().apply {
    jdbcUrl = "jdbc:postgresql://localhost:5432/db"
    username = "app_user"
    password = System.getenv("DB_APP_PASSWORD")
}
```

#### 2. リクエストごとの設定
```kotlin
// 各リクエストの開始時に設定
connection.execute("SET app.current_tenant_id = ?", tenantId)
connection.execute("SET app.current_user_id = ?", userId)

// リクエスト処理...

// リクエスト終了時にクリア（接続プール使用時は必須）
connection.execute("RESET app.current_tenant_id")
connection.execute("RESET app.current_user_id")
```

### RLSポリシー

#### 基本ルール
- **SELECT**: テナントメンバーのみデータ閲覧可能
- **INSERT/UPDATE/DELETE**: 管理者ロールのみ変更可能
- **システムロール**: 変更・削除不可

#### セッション未設定時の動作
- テナントID未設定 → データが見えない（安全）
- ユーザーID未設定 → 管理操作不可

## マイグレーション履歴

- V001-V003: users基本構造とAuth0連携
- V004: tenants追加
- V005: Discord風ロールシステム
- V006: user_profiles分離
- V007: Auth0完全移行（password_hash削除）
- V008: マルチテナント構造修正（tenant_users追加）
- V009: レビュー改善（不要インデックス削除、VIEW追加）
- V010: Row Level Security実装

## 今後の拡張予定

必要になったら追加：
- 柔軟なテーブル（databases, records）
- ドキュメント管理（documents）
- 監査ログ（audit_logs）
- 招待システム（invitations）