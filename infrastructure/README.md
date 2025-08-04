# Astar Management Infrastructure

法律事務所向け業務管理システムのインフラストラクチャ設定です。

## 概要

このディレクトリには、Astar Managementシステムの実行に必要なインフラストラクチャ設定が含まれています。

## 構成

```
infrastructure/
├── local/                      # ローカル開発環境
│   └── docker/                # Docker設定
│       ├── postgresql/        # PostgreSQL設定
│       │   ├── docker-compose.yml
│       │   ├── init/         # DB初期化スクリプト
│       │   ├── .env.example
│       │   └── README.md
│       └── supabase/         # Supabase設定（廃止予定）
└── README.md                 # このファイル
```

## クイックスタート

### PostgreSQL（推奨）

```bash
# PostgreSQLディレクトリに移動
cd local/docker/postgresql

# 環境変数の設定
cp .env.example .env

# 開発用PostgreSQLを起動
docker-compose up -d postgres-dev

# 接続確認
docker exec -it astarmanagement-postgres-dev psql -U postgres -d astarmanagement_dev
```

詳細は[PostgreSQL README](local/docker/postgresql/README.md)を参照してください。

## 開発環境

### ローカル開発環境の選択

1. **PostgreSQL**（推奨）
   - 本番環境と同じデータベース
   - Flywayマイグレーション対応
   - [セットアップ手順](local/docker/postgresql/README.md)

2. **H2 Database**（簡易テスト用）
   - PostgreSQLなしで動作
   - メモリ内データベース
   - `--spring.profiles.active=default`で使用

## 本番環境

本番環境では管理されたPostgreSQLサービスの使用を推奨します：
- Amazon RDS for PostgreSQL
- Google Cloud SQL
- Azure Database for PostgreSQL

## セキュリティ注意事項

- パスワードは環境変数で管理
- `.env`ファイルはGitにコミットしない
- 本番環境では必ず強力なパスワードを使用
- ネットワークアクセスを適切に制限