-- complete-reset-database.sql
-- データベースを完全にリセットしてクリーンな状態にする

-- 1. 既存の接続を切断
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'astarmanagement_dev'
  AND pid <> pg_backend_pid();

-- 2. postgres データベースに接続を切り替え
\c postgres;

-- 3. データベースを削除（存在する場合）
DROP DATABASE IF EXISTS astarmanagement_dev;

-- 4. データベースを新規作成
CREATE DATABASE astarmanagement_dev
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TEMPLATE = template0;

-- 5. 新しいデータベースに接続
\c astarmanagement_dev;

-- 6. 必要な拡張機能をインストール
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 7. public スキーマの権限を確認
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;