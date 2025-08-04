# Infrastructure

インフラストラクチャ設定とデプロイメント用ファイル

## ディレクトリ構成

### 環境別構成
- `local/` - ローカル開発環境
  - `docker/` - Docker Compose設定（Supabase、Redis等）
  - ドキュメントとセットアップスクリプト
- `staging/` - ステージング環境
  - Kubernetes設定
  - CI/CD設定
- `production/` - 本番環境
  - Kubernetes設定
  - Terraform設定
  - CI/CD設定

## 開発環境

### ローカルSupabase起動
```bash
cd local/docker/supabase
docker-compose up -d
```

詳細は `local/SUPABASE_LOCAL.md` を参照

## ステージング・本番環境

（今後追加予定）