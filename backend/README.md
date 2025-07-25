# Backend

Spring Boot + Kotlin + Spring Modulithによるバックエンドモノリス

## 技術スタック

- **言語**: Kotlin (Java 21)
- **フレームワーク**: Spring Boot 3.5.0
- **モジュール化**: Spring Modulith
- **認証**: Spring Security + OAuth2/JWT
- **データベース**: PostgreSQL 15 + Spring Data JPA
- **キャッシュ**: Redis
- **API**: REST + GraphQL

## モジュール構成

- `auth/` - 認証・認可
- `case-management/` - 案件管理
- `document/` - 文書管理
- `communication/` - コミュニケーション
- `financial/` - 財務管理
- `calendar/` - カレンダー・スケジュール
- `client/` - クライアント管理
- `shared/` - 共有機能

## 開発

```bash
# アプリケーション起動
./gradlew bootRun

# テスト実行
./gradlew test

# ビルド
./gradlew build
```