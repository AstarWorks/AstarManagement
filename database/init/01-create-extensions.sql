-- PostgreSQL 17 初期化スクリプト
-- 必要な拡張機能のインストール

-- UUID生成機能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 全文検索機能
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- PostgreSQL統計情報
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 日時関数拡張
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- 将来的なベクター検索用（AI機能拡張時）
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- データベース設定
ALTER DATABASE Astar_management SET timezone TO 'Asia/Tokyo';
ALTER DATABASE Astar_management SET search_path TO public;