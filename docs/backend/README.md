# バックエンド概要

## Spring Boot アプリケーション

Kotlin + Spring Boot 3.5で構築されたRESTful APIサーバー。
Spring Modulithによるモジュラーモノリス設計を採用。

## API設計原則

### RESTful設計
```
GET    /api/v1/tables          # 一覧取得
POST   /api/v1/tables          # 新規作成
GET    /api/v1/tables/{id}     # 個別取得
PUT    /api/v1/tables/{id}     # 更新
DELETE /api/v1/tables/{id}     # 削除
```

### レスポンス形式
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### エラーハンドリング
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": { ... }
  }
}
```

## ドキュメント構成

```
backend/
├── features/              # 機能別詳細ドキュメント
│   ├── auth/             # 認証・認可機能
│   ├── table/            # 柔軟テーブルシステム
│   ├── role/             # Discord風ロールシステム
│   ├── workspace/        # ワークスペース管理
│   ├── user/             # ユーザー管理
│   ├── membership/       # メンバーシップ管理
│   └── template/         # テンプレート機能
├── architecture/         # アーキテクチャ設計書
└── database/            # データベース設計書
```

## 実装済み機能

### コア機能
1. **[認証・認可](./features/auth/)**: JWT認証、マルチテナント対応
2. **[柔軟テーブル](./features/table/)**: PostgreSQL JSONB型によるスキーマレステーブル
3. **[ロールシステム](./features/role/)**: Discord風の動的ロール管理

### 管理機能
4. **[ワークスペース](./features/workspace/)**: マルチテナント管理
5. **[ユーザー管理](./features/user/)**: ユーザーCRUD
6. **[メンバーシップ](./features/membership/)**: ワークスペースメンバー管理
7. **[テンプレート](./features/template/)**: 業界別テンプレート
8. **[ドキュメント管理](./features/editor/)**: 階層型フォルダ + ドキュメント CRUD（M1: 平文版）

### 計画中の機能
- **AIエージェント**: MCP統合によるAI操作

## 開発規約

### パッケージ構造
```
com.astarworks.astarmanagement.core.{module}/
├── domain/          # ドメインモデル
├── application/     # ビジネスロジック（@Service）
├── infrastructure/  # 外部連携（@Repository）
└── presentation/    # REST API（@RestController）
```

### レイヤールール
1. **Controller → Service → Repository**の流れを厳守
2. **@Transactional**はServiceレイヤーに配置
3. ビジネスロジックはServiceに集約
4. Repositoryは純粋なCRUD操作のみ

### 命名規約
```kotlin
// Entity
data class FlexibleTable(...)

// Service
@Service
class FlexibleTableService { ... }

// Repository  
@Repository
interface FlexibleTableRepository : JpaRepository<FlexibleTable, UUID>

// Controller
@RestController
@RequestMapping("/api/v1/tables")
class FlexibleTableController { ... }
```

## 技術スタック

### 主要依存関係
- Spring Boot 3.5
- Spring Security（JWT認証）
- Spring Data JPA
- PostgreSQL Driver
- Jackson（JSON処理）
- OpenAPI Generator

### ビルド・実行
```bash
# ビルド
./gradlew build

# テスト
./gradlew test

# 起動
./gradlew bootRun

# OpenAPI（ローカル環境で最新化）
./gradlew generateOpenApiDocs

# Docker起動
docker-compose up -d
```

## 環境変数

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/astar
    username: ${DB_USER:astar}
    password: ${DB_PASSWORD:password}
    
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        default_schema: public
        
jwt:
  secret: ${JWT_SECRET:your-secret-key}
  expiration: 86400000 # 24時間
```

## テスト戦略

### 単体テスト
```kotlin
@Test
fun `should create flexible table`() {
    // Given
    val table = FlexibleTable(...)
    
    // When
    val result = service.create(table)
    
    // Then
    assertThat(result).isNotNull()
}
```

### 統合テスト
```kotlin
@SpringBootTest
@AutoConfigureMockMvc
class FlexibleTableIntegrationTest {
    @Test
    fun `should return 200 on GET tables`() {
        mockMvc.perform(get("/api/v1/tables"))
            .andExpect(status().isOk)
    }
}
```