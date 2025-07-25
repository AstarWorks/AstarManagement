#!/bin/sh

# MinIO初期化スクリプト
# バケット作成とポリシー設定

echo "MinIO初期化開始..."

# MinIOサーバーの接続設定
mc alias set minio http://minio:9000 minioadmin minioadmin123

# 基本バケット作成
echo "バケット作成中..."
mc mb minio/documents --ignore-existing
mc mb minio/images --ignore-existing
mc mb minio/backups --ignore-existing
mc mb minio/temp --ignore-existing

# パブリック読み取りポリシー設定（必要に応じて）
echo "ポリシー設定中..."
mc anonymous set download minio/temp

# バージョニング有効化（重要なバケットのみ）
mc version enable minio/documents
mc version enable minio/backups

echo "MinIO初期化完了！"

# 作成されたバケット一覧表示
mc ls minio/