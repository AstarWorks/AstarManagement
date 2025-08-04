# PostgreSQL Local Development Environment

Astar Management システムのローカルPostgreSQL環境です。

## クイックスタート

```bash
# このディレクトリに移動
cd infrastructure/local/docker/postgresql

# PostgreSQL開発環境を起動
docker-compose up -d postgres-dev

# ログを確認
docker-compose logs -f postgres-dev

# PostgreSQLに接続
docker exec -it astarmanagement-postgres-dev psql -U postgres -d astarmanagement_dev
```

## 接続情報

### 開発環境
- **ホスト**: localhost
- **ポート**: 5433
- **データベース**: astarmanagement_dev
- **ユーザー**: postgres
- **パスワード**: postgres

### Spring Boot接続
```bash
# backendディレクトリから実行
./gradlew bootRun --args='--spring.profiles.active=local'
```

## 管理コマンド

```bash
# 停止
docker-compose stop

# 再起動
docker-compose restart postgres-dev

# 削除（データも削除）
docker-compose down -v

# PgAdminを起動
docker-compose up -d pgadmin
# http://localhost:5050 でアクセス
```