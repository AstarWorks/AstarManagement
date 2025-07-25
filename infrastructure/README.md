# Infrastructure

インフラストラクチャ設定とデプロイメント用ファイル

## 構成

### Docker
- `docker/backend/` - バックエンド用Dockerfile
- `docker/frontend/` - フロントエンド用Dockerfile  
- `docker/compose/` - Docker Compose設定

### Kubernetes
- `kubernetes/base/` - 基本設定
- `kubernetes/overlays/` - 環境別設定（dev/staging/prod）
- `kubernetes/components/` - 再利用可能コンポーネント

### Terraform
- `terraform/modules/` - Terraformモジュール
- `terraform/environments/` - 環境別設定

## デプロイメント

### 開発環境
```bash
docker-compose -f docker/compose/docker-compose.dev.yml up
```

### Kubernetes
```bash
# 基本リソース適用
kubectl apply -k kubernetes/base/

# 環境別設定適用
kubectl apply -k kubernetes/overlays/staging/
```