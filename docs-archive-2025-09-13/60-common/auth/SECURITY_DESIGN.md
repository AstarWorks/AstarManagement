# セキュリティ設計書

## 1. セキュリティ概要

### 1.1 基本方針
Astar Managementは汎用ビジネス管理プラットフォームとして、極めて高い機密性が要求される企業情報を扱います。以下の原則に基づいてセキュリティを設計・実装します。

1. **Defense in Depth（多層防御）**
   - 単一の対策に依存せず、複数層のセキュリティ対策を実装

2. **Zero Trust Security（ゼロトラスト）**
   - 内部ネットワークも信頼せず、すべてのアクセスを検証

3. **Principle of Least Privilege（最小権限の原則）**
   - 必要最小限の権限のみを付与

4. **Security by Design**
   - 設計段階からセキュリティを組み込む

### 1.2 保護対象資産
- **顧客情報**: クライアントの個人情報、機密ビジネス情報
- **プロジェクト情報**: プロジェクト内容、戦略、内部メモ
- **文書データ**: ビジネス文書、機密資料
- **財務情報**: 経費、請求、財務情報
- **システム情報**: ユーザー認証情報、システム設定

### 1.3 脅威モデル
- **外部攻撃者**: 不正アクセス、DDoS攻撃、マルウェア
- **内部不正**: 権限濫用、情報持ち出し
- **過失**: 誤操作、設定ミス
- **物理的脅威**: 機器盗難、災害

## 2. 認証・認可

### 2.1 認証アーキテクチャ

#### JWT (JSON Web Token) 構成
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-id-2024-01"
  },
  "payload": {
    "sub": "user-uuid",
    "email": "user@example.com",
    "name": "山田太郎",
    "role": "manager",
    "permissions": ["project:read", "project:write"],
    "iat": 1706236800,
    "exp": 1706237700,
    "jti": "unique-token-id"
  }
}
```

#### トークン管理
- **アクセストークン**: 15分（短命）
- **リフレッシュトークン**: 7日（Redis保存、即座に無効化可能）
- **署名アルゴリズム**: RS256（非対称鍵）
- **鍵ローテーション**: 3ヶ月ごと

### 2.2 多要素認証（MFA）

#### 実装方式
1. **TOTP (Time-based One-Time Password)**
   - Google Authenticator対応
   - バックアップコード（10個）生成

2. **実装フロー**
```
1. ユーザーがメール/パスワードでログイン
2. MFAが有効な場合、6桁のコード入力を要求
3. コード検証（±30秒の時間窓）
4. 成功時にJWTトークン発行
```

### 2.3 パスワードポリシー
- **最小長**: 12文字
- **複雑性**: 大文字、小文字、数字、記号を含む
- **履歴**: 過去5世代のパスワードは使用不可
- **有効期限**: 90日
- **ハッシュ**: bcrypt (cost factor: 12)

### 2.4 権限管理（動的RBAC）

#### Discord風ロールシステム
```yaml
roleSystem:
  type: "dynamic"  # 初期ロールなし
  features:
    - カスタムロール作成
    - テンプレートロールインポート
    - 複数ロール付与
    - 色分けと表示順序
    - 一時的ロール付与

# テンプレートロール例（法律事務所）
templateRoleExamples:
  lawFirmTemplate:
    partnerLawyer:
      name: "パートナー弁護士"
      color: "#8b5cf6"
      permissions: ["*:*"]
    
    associateLawyer:
      name: "アソシエイト弁護士"
      color: "#06b6d4"
      permissions: ["project:*", "document:*", "client:read"]
    
    paralegal:
      name: "パラリーガル"
      color: "#10b981"
      permissions: ["project:read", "document:create", "document:update"]
    
    client:
      name: "依頼者"
      color: "#6b7280"
      permissions: ["project:read:own", "document:read:own"]
```

#### 動的ロール権限チェック実装
```kotlin
@PreAuthorize("@rolePermissionService.hasPermission(authentication, #projectId, 'project:read')")
fun getProjectDetails(projectId: UUID): ProjectDto {
    // 実装
}

@Service
class RolePermissionService {
    fun hasPermission(auth: Authentication, resourceId: UUID, permission: String): Boolean {
        val user = auth.principal as User
        val userRoles = roleService.getUserRoles(user.id)
        
        return userRoles.any { role ->
            role.permissions.any { perm ->
                matchesPermission(perm, permission) && 
                hasResourceAccess(user, role, resourceId)
            }
        }
    }
}
```

## 3. データ保護

### 3.1 暗号化

#### 保存時暗号化（Encryption at Rest）
1. **データベース**
   - PostgreSQL Transparent Data Encryption (TDE)
   - 暗号化アルゴリズム: AES-256-GCM
   
2. **ファイルストレージ**
   - MinIO/S3サーバーサイド暗号化
   - 顧客管理キー（CMK）使用

3. **機密フィールド暗号化**
```kotlin
@Entity
class Project {
    @Encrypted
    var internalNotes: String? = null  // アプリケーションレベルで暗号化
}
```

#### 通信時暗号化（Encryption in Transit）
1. **TLS設定**
   - 最小バージョン: TLS 1.3
   - 暗号スイート: 
     - TLS_AES_256_GCM_SHA384
     - TLS_CHACHA20_POLY1305_SHA256
   - HSTS有効化

2. **証明書管理**
   - Let's Encrypt（本番環境）
   - 自動更新設定
   - 証明書ピニング（モバイルアプリ用）

### 3.2 データマスキング
```kotlin
data class CustomerDto(
    val id: UUID,
    val name: String,
    @Masked(type = MaskType.PARTIAL)
    val email: String,  // "u***@example.com"
    @Masked(type = MaskType.FULL)
    val phone: String   // "***-****-****"
)
```

### 3.3 データ分類とアクセス制御
| 分類 | 説明 | アクセス制御 | 暗号化 |
|------|------|------------|--------|
| 極秘 | 顧客の機密情報、戦略メモ | 担当者のみ | 必須 |
| 機密 | プロジェクト詳細、文書内容 | 関係者のみ | 必須 |
| 内部 | スケジュール、タスク | 組織内全員 | 推奨 |
| 公開 | システム情報 | 全員 | 不要 |

## 4. マルチテナントセキュリティ

### 4.1 ハイブリッド型マルチテナンシー

#### 分離レベル別セキュリティ
```yaml
Starterプラン (Shared DB + RLS):
  isolation: "Row Level Security"
  security_features:
    - テナントIDによるデータ分離
    - 共有暗号化キー
    - 標準監査ログ
  risks:
    - 隣接テナントからの影響可能性
    - パフォーマンス競合
  mitigations:
    - クエリ制限
    - リソースクォータ

Professionalプラン (Dedicated Schema):
  isolation: "Schema分離"
  security_features:
    - スキーマレベルの完全分離
    - カスタムインデックス
    - 独立バックアップ
  risks:
    - スキーマ間の誤参照
    - 管理複雑性
  mitigations:
    - スキーマアクセス制御
    - 自動化された管理

Enterpriseプラン (Dedicated Container):
  isolation: "物理分離"
  security_features:
    - 完全な計算リソース分離
    - 専用暗号化キー
    - カスタムセキュリティポリシー
    - 独立ネットワーク
  risks:
    - 運用コスト増大
  mitigations:
    - 自動化インフラ管理
    - コスト最適化
```

### 4.2 テナント間のデータ分離

#### Row Level Security実装
```sql
-- テナント分離ポリシー
CREATE POLICY tenant_isolation ON records
FOR ALL
USING (
    database_id IN (
        SELECT d.id FROM databases d
        JOIN workspaces w ON d.workspace_id = w.id
        WHERE w.tenant_id = current_setting('app.current_tenant_id')::UUID
    )
);

-- 関数でのテナントコンテキスト設定
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Spring Bootでのテナントコンテキスト管理
```kotlin
@Component
class TenantInterceptor : HandlerInterceptor {
    override fun preHandle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any
    ): Boolean {
        val tenantId = extractTenantFromJWT(request)
        TenantContext.setCurrentTenant(tenantId)
        
        // データベースセッションにテナントID設定
        jdbcTemplate.execute("SELECT set_tenant_context('$tenantId')")
        
        return true
    }
    
    override fun afterCompletion(...) {
        TenantContext.clear()
    }
}
```

### 4.3 テナント別セキュリティ設定

#### カスタムセキュリティポリシー
```yaml
tenant_security_config:
  starter:
    password_policy:
      min_length: 8
      complexity: standard
    mfa: optional
    session_timeout: 30_minutes
    
  professional:
    password_policy:
      min_length: 12
      complexity: high
    mfa: recommended
    session_timeout: 15_minutes
    ip_whitelist: optional
    
  enterprise:
    password_policy:
      min_length: 16
      complexity: very_high
    mfa: required
    session_timeout: 10_minutes
    ip_whitelist: available
    sso: available
    custom_encryption_key: true
```

### 4.4 クロステナント攻撃の防御

#### 防御メカニズム
1. **テナントID検証**
   - すべてのAPIリクエストでテナントID検証
   - JWTトークン内のテナントIDと一致確認

2. **リソースアクセス制御**
   ```kotlin
   @PreAuthorize("@tenantService.validateResourceAccess(#resourceId)")
   fun getResource(resourceId: UUID): Resource {
       // リソースが現在のテナントに属することを確認
   }
   ```

3. **クエリインジェクション防止**
   - テナントIDのパラメータバインディング
   - 動的SQL生成の禁止

4. **監査ログでの異常検知**
   - クロステナントアクセス試行の記録
   - 異常パターンの自動検出

## 5. アプリケーションセキュリティ

### 4.1 入力検証

#### バリデーション実装
```kotlin
@RestController
class ProjectController {
    @PostMapping("/projects")
    fun createProject(@Valid @RequestBody request: CreateProjectRequest): ProjectDto {
        // 実装
    }
}

data class CreateProjectRequest(
    @field:NotBlank
    @field:Size(max = 255)
    @field:Pattern(regexp = "^[\\p{L}\\p{N}\\s\\-_]+$")
    val title: String,
    
    @field:NotNull
    @field:UUID
    val clientId: String,
    
    @field:Size(max = 5000)
    @field:SafeHtml  // XSS対策
    val summary: String?
)
```

### 4.2 OWASP Top 10対策

#### 1. インジェクション対策
- **SQLインジェクション**: JPA/Hibernateの使用、パラメータバインディング
- **NoSQLインジェクション**: 入力値の型チェック
- **OSコマンドインジェクション**: コマンド実行の禁止

#### 2. 認証の不備
- JWT実装（前述）
- セッション固定攻撃対策
- ブルートフォース対策（アカウントロック）

#### 3. 機密データの露出
- HTTPSの強制
- エラーメッセージの汎用化
- ログのサニタイジング

#### 4. XXE（XML外部エンティティ）
```kotlin
@Configuration
class XmlConfig {
    @Bean
    fun xmlInputFactory(): XMLInputFactory {
        val factory = XMLInputFactory.newInstance()
        factory.setProperty(XMLInputFactory.SUPPORT_DTD, false)
        factory.setProperty(XMLInputFactory.IS_SUPPORTING_EXTERNAL_ENTITIES, false)
        return factory
    }
}
```

#### 5. アクセス制御の不備
- 関数レベルのアクセス制御
- オブジェクトレベルのアクセス制御
- CORS設定

#### 6. セキュリティ設定の不備
- デフォルトパスワードの禁止
- 不要なサービスの無効化
- セキュリティヘッダーの設定

#### 7. XSS（クロスサイトスクリプティング）
```kotlin
// Content Security Policy
@Configuration
class SecurityHeadersConfig : WebSecurityConfigurerAdapter() {
    override fun configure(http: HttpSecurity) {
        http.headers()
            .contentSecurityPolicy("default-src 'self'; script-src 'self' 'unsafe-inline'")
            .xssProtection().and()
            .contentTypeOptions()
    }
}
```

#### 8. 安全でないデシリアライゼーション
- Jacksonのセーフリスト設定
- 型情報の検証

#### 9. 既知の脆弱性のあるコンポーネント
- 依存関係の定期スキャン
- 自動アップデート通知

#### 10. 不十分なロギングとモニタリング
- 包括的な監査ログ（後述）

### 4.3 CSRF対策
```kotlin
@Configuration
class CsrfConfig {
    @Bean
    fun csrfTokenRepository(): CsrfTokenRepository {
        val repository = CookieCsrfTokenRepository.withHttpOnlyFalse()
        repository.setCookieName("XSRF-TOKEN")
        repository.setHeaderName("X-XSRF-TOKEN")
        return repository
    }
}
```

### 4.4 レート制限
```kotlin
@RestController
@RateLimiter(name = "api", fallbackMethod = "rateLimitFallback")
class ApiController {
    // Rate Limiter設定
    // - 一般API: 100リクエスト/分
    // - 認証API: 5リクエスト/分
    // - ファイルアップロード: 10リクエスト/分
}
```

## 5. インフラストラクチャセキュリティ

### 5.1 ネットワークセキュリティ

#### ネットワーク分離
```yaml
# Kubernetes NetworkPolicy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-netpol
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    - podSelector:
        matchLabels:
          app: nginx
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
```

#### ファイアウォール設定
- 最小限のポート開放
- IP許可リスト（管理者アクセス）
- DDoS対策（CloudFlare等）

### 5.2 コンテナセキュリティ

#### Dockerイメージ
```dockerfile
# マルチステージビルド
FROM gradle:7-jdk17 AS builder
WORKDIR /app
COPY . .
RUN gradle build --no-daemon

# 実行用の最小イメージ
FROM eclipse-temurin:17-jre-alpine
RUN addgroup -g 1000 app && adduser -u 1000 -G app -s /bin/sh -D app
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### セキュリティスキャン
- イメージスキャン（Trivy）
- ランタイム保護（Falco）
- Pod Security Standards適用

### 5.3 シークレット管理

#### Kubernetes Secrets
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  database-password: <base64-encoded>
  jwt-private-key: <base64-encoded>
---
# Sealed Secrets使用（本番環境）
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: app-secrets
spec:
  encryptedData:
    database-password: <encrypted>
```

#### 外部シークレット管理
- HashiCorp Vault統合
- AWS Secrets Manager（クラウド環境）
- 定期的なローテーション

## 6. 監査とロギング

### 6.1 監査ログ設計

#### ログ項目
```json
{
  "timestamp": "2024-01-26T10:30:00Z",
  "eventType": "data_access",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "userName": "田中太郎",
  "userRole": "lawyer",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "resource": "case",
  "resourceId": "123e4567-e89b-12d3-a456-426614174001",
  "action": "read",
  "result": "success",
  "details": {
    "caseNumber": "2024-001",
    "fields": ["title", "summary", "internalNotes"]
  }
}
```

#### ログ種別
1. **認証ログ**: ログイン、ログアウト、認証失敗
2. **アクセスログ**: データ参照、更新、削除
3. **システムログ**: エラー、警告、設定変更
4. **セキュリティログ**: 権限違反、不正アクセス試行

### 6.2 ログ保護
- ログの改ざん防止（ハッシュチェーン）
- ログの暗号化
- アクセス制限（監査担当者のみ）

### 6.3 モニタリングとアラート

#### アラート条件
- 連続ログイン失敗（5回以上）
- 異常なデータアクセスパターン
- 権限昇格の試み
- 大量データのエクスポート
- システムエラーの急増

#### SIEM統合
```yaml
# Fluentd設定
<source>
  @type tail
  path /var/log/app/*.log
  pos_file /var/log/td-agent/app.log.pos
  tag app.log
  <parse>
    @type json
  </parse>
</source>

<match app.log>
  @type elasticsearch
  host elasticsearch.monitoring.svc.cluster.local
  port 9200
  index_name audit-logs
  type_name _doc
</match>
```

## 7. インシデント対応

### 7.1 インシデント分類
| レベル | 説明 | 対応時間 |
|--------|------|----------|
| Critical | データ漏洩、システム全体停止 | 15分以内 |
| High | 不正アクセス、部分的停止 | 1時間以内 |
| Medium | 軽微な障害、設定ミス | 4時間以内 |
| Low | 潜在的脆弱性 | 1営業日以内 |

### 7.2 対応手順
1. **検知**: 自動アラート、ユーザー報告
2. **評価**: 影響範囲、深刻度の判定
3. **封じ込め**: 被害拡大防止
4. **根絶**: 原因の除去
5. **復旧**: サービス再開
6. **事後分析**: 再発防止策

### 7.3 連絡体制
```
インシデント発生
    ↓
セキュリティ担当者
    ↓
  ┌─────┴─────┐
  ↓           ↓
CTO        コンプライアンス担当
  ↓           ↓
開発チーム  顧客対応
```

## 8. コンプライアンス

### 8.1 準拠法令・規格
- **個人情報保護法**: 個人データの適切な取り扱い
- **企業秘密保護**: 機密情報の保護
- **電子帳簿保存法**: 電子データの保存要件
- **ISO 27001**: 情報セキュリティマネジメント

### 8.2 データ保持ポリシー
| データ種別 | 保持期間 | 削除方法 |
|------------|----------|----------|
| プロジェクトデータ | 終了後10年 | 完全削除 |
| 監査ログ | 5年 | アーカイブ後削除 |
| バックアップ | 90日 | 自動削除 |
| 一時ファイル | 7日 | 自動削除 |

### 8.3 プライバシー対策
- データ最小化の原則
- 目的外利用の禁止
- データポータビリティ
- 削除権（忘れられる権利）

## 9. セキュリティテスト

### 9.1 テスト種別
1. **脆弱性スキャン**: 週次自動実行
2. **ペネトレーションテスト**: 年2回
3. **コードレビュー**: プルリクエスト時
4. **依存関係チェック**: 日次

### 9.2 セキュリティテスト自動化
```yaml
# GitHub Actions
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@mAstar
      
    - name: SonarQube Scan
      uses: sonarsource/sonarqube-scan-action@mAstar
      
    - name: OWASP Dependency Check
      uses: dependency-check/Dependency-Check_Action@main
```

## 10. 教育とトレーニング

### 10.1 セキュリティ教育プログラム
- 入社時セキュリティ研修
- 年次セキュリティ更新研修
- フィッシング訓練（四半期）
- インシデント対応訓練

### 10.2 開発者向けガイドライン
- セキュアコーディング規約
- OWASP対策チェックリスト
- 脆弱性事例集
- セキュリティツール使用方法

## 11. 事業継続計画（BCP）

### 11.1 バックアップ戦略
- **RPO（目標復旧時点）**: 1時間
- **RTO（目標復旧時間）**: 4時間
- **バックアップ**: 3-2-1ルール
  - 3つのコピー
  - 2つの異なるメディア
  - 1つのオフサイト

### 11.2 災害復旧手順
1. バックアップからのリストア
2. データ整合性チェック
3. サービス再開
4. 顧客への通知

## 12. セキュリティKPI

### 12.1 測定指標
- パッチ適用率: 95%以上
- 脆弱性修正時間: Critical 24時間以内
- セキュリティ訓練参加率: 100%
- インシデント対応時間: SLA遵守率90%以上

### 12.2 定期レビュー
- 月次: インシデント分析
- 四半期: 脆弱性評価
- 年次: セキュリティ監査