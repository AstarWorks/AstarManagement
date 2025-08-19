# Backend Scripts

## Available Scripts

### start-local.sh
ローカル開発環境でバックエンドを起動します。
- Mock認証を有効化
- PostgreSQLに接続
- Swagger UIが利用可能

```bash
./scripts/start-local.sh
```

### test-api.sh
Mock認証を使用してAPIエンドポイントをテストします。

```bash
# バックエンドを起動してから実行
./scripts/test-api.sh
```

テスト内容:
1. Mock認証トークンの取得
2. JWKSエンドポイントの確認
3. 認証付きAPIアクセス
4. 認証なしAPIアクセス（拒否確認）
5. Swagger UIアクセス確認

## 開発フロー

```bash
# 1. PostgreSQLを起動
docker-compose up -d postgres

# 2. バックエンドを起動
./scripts/start-local.sh

# 3. 別ターミナルでAPIテスト
./scripts/test-api.sh

# 4. Swagger UIでAPI確認
open http://localhost:8080/swagger-ui/index.html
```