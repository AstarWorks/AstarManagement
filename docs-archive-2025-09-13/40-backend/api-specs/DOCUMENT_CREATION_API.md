必須要件:
- マルチテナント対応
- 全文検索 + AI検索
- ファイル添付（〜数GB）
- 既存Word/Excel互換性

- リアルタイム共同編集(初期は共同編集時に他のユーザーが開いていると表示して、編集不可とする)
- バージョン管理
- 監査ログ
  |


データ保存
メタデータ: PostgreSQL
ファイル本体: Cloud Storage/MinIO
キャッシュ/セッション: Redis
全文検索: ElasticSerach

ファイルの保存はプレーンテキストはPostgreSQLに直、バイナリファイルはオブジェクトストレージに保存するものとする
理由は
データベースにバイナリファイルを直接埋め込むのはパフォーマンスが非常に悪いこと
メモリのリソース効率が悪いこと
永続データのストレージ金額がオブジェクトストレージの方がクラウドは安いこと
シンプルにそれが世界標準であるから

オブジェクトストレージは
クラウド: Google Cloud Storage
オンプレ: MinIO
を使用するものとする
class DocumentStorage:
def save_document(self, doc):
# マークダウン/テキスト → PostgreSQL
if doc.type in ['markdown', 'text']:
db.execute("""
INSERT INTO documents (id, content, search_vector)
VALUES ($1, $2, to_tsvector($2))
""", doc.id, doc.content)

        # バイナリファイル → オブジェクトストレージ
        elif doc.type in ['pdf', 'image', 'video']:
            # メタデータのみDB
            db.execute("""
                INSERT INTO documents (id, title, file_type, file_size, s3_path)
                VALUES ($1, $2, $3, $4, $5)
            """, doc.id, doc.title, doc.type, doc.size, s3_path)
            
            # 実ファイルはS3
            s3.upload_file(doc.binary_data, bucket, s3_path)


def db_only_pattern():
"""
Client → Backend → PostgreSQL
← 10MB ←
"""
# 1. DBから10MB取得
result = db.query("SELECT file_data FROM documents WHERE id = $1")
# メモリに10MB載る
# ネットワークで10MB転送
return result.file_data  # クライアントに10MB転送

# ケース2: DB + Object Storage
def hybrid_pattern():
"""
Client → Backend → PostgreSQL (メタデータ)
↘ Object Storage (並列取得)
"""
# 1. メタデータ取得（1KB）
meta = db.query("SELECT title, s3_url FROM documents WHERE id = $1")

    # 2. 署名付きURL生成
    presigned_url = s3.generate_presigned_url(meta.s3_url)
    
    # 3. クライアントが直接S3から取得
    return {"url": presigned_url}  # 1KBのレスポンス

暗号化について
クラウド側の機能を使うことによって、暗号化はデータベースやクラウドストレージに丸投げを行い、閉じることができ、バックエンドは業務ロジックに集中できる。
from google.cloud import kms
from google.cloud import storage

class GCPEncryption:
def __init__(self):
self.kms_client = kms.KeyManagementServiceClient()
self.storage_client = storage.Client()

        # KMSキーの作成
        self.key_name = self.create_kms_key()
    
    def create_kms_key(self):
        """KMS暗号鍵の作成（初回のみ）"""
        project_id = "my-project"
        location = "asia-northeast1"
        key_ring_id = "document-encryption"
        key_id = "document-key"
        
        # キーリング作成
        key_ring_name = f"projects/{project_id}/locations/{location}/keyRings/{key_ring_id}"
        
        try:
            self.kms_client.create_key_ring(
                request={
                    "parent": f"projects/{project_id}/locations/{location}",
                    "key_ring_id": key_ring_id,
                    "key_ring": {}
                }
            )
        except:
            pass  # 既に存在
        
        # 暗号鍵作成
        key = {
            "purpose": kms.CryptoKey.CryptoKeyPurpose.ENCRYPT_DECRYPT,
            "version_template": {
                "algorithm": kms.CryptoKeyVersion.CryptoKeyVersionAlgorithm.GOOGLE_SYMMETRIC_ENCRYPTION
            },
            "rotation_period": {"seconds": 2592000},  # 30日で自動ローテーション
        }
        
        try:
            created_key = self.kms_client.create_crypto_key(
                request={
                    "parent": key_ring_name,
                    "crypto_key_id": key_id,
                    "crypto_key": key
                }
            )
            return created_key.name
        except:
            return f"{key_ring_name}/cryptoKeys/{key_id}"
GCSの自動暗号化とそのオプション
class GCSEncryptionOptions:

    def option1_default_encryption(self):
        """オプション1: Google管理の暗号化（デフォルト）"""
        # 何もしなくても自動暗号化！
        bucket = self.storage_client.bucket('my-bucket')
        blob = bucket.blob('document.pdf')
        
        # アップロード時に自動的にAES-256で暗号化
        blob.upload_from_string(b"sensitive data")
        # ダウンロード時に自動的に復号
        content = blob.download_as_bytes()
        
    def option2_cmek_encryption(self):
        """オプション2: Cloud KMS暗号化（CMEK）"""
        
        # バケットレベルでKMS暗号化を設定
        bucket = self.storage_client.bucket('secure-documents')
        bucket.default_kms_key_name = self.key_name
        bucket.patch()
        
        # 以降、このバケットへの全アップロードが自動的にKMSで暗号化
        blob = bucket.blob('confidential.pdf')
        blob.upload_from_string(b"very sensitive data")
        # KMSキーがないとアクセス不可
        
    def option3_csek_encryption(self):
        """オプション3: 顧客提供の暗号鍵（CSEK）"""
        import base64
        import os
        
        # 自分で鍵を生成・管理
        encryption_key = base64.b64encode(os.urandom(32)).decode('utf-8')
        
        bucket = self.storage_client.bucket('my-bucket')
        blob = bucket.blob('secret.pdf')
        
        # アップロード時に鍵を指定
        blob.upload_from_string(
            b"top secret",
            encryption_key=encryption_key
        )
        
        # ダウンロード時も同じ鍵が必要
        blob.encryption_key = encryption_key
        content = blob.download_as_bytes()
まとめ
# GCPは本当にシンプル
def gcp_simple_encryption():
# バケット作成時に1行追加するだけ
bucket = storage.Client().create_bucket(
"my-secure-bucket",
default_kms_key_name="projects/xxx/locations/xxx/keyRings/xxx/cryptoKeys/xxx"
)

    # 以降、普通に使うだけで全て暗号化
    blob = bucket.blob("file.pdf")
    blob.upload_from_string(data)  # 自動暗号化
    
    # Cloud SQLも作成時のオプションだけ
    # Firestoreは何もしなくても暗号化
検索について
基盤
from google.cloud import storage, firestore
import psycopg2
import openai
from typing import List, Dict

class GCPDocumentSearch:
def __init__(self):
# Cloud SQL (PostgreSQL)
self.db = psycopg2.connect(
host="/cloudsql/project:region:instance",
database="legal_docs"
)
# Firestore（メタデータ用）
self.firestore = firestore.Client()
# Cloud Storage
self.bucket = storage.Client().bucket('legal-documents')
# OpenAI
openai.api_key = "sk-..."

    def setup_database(self):
        """初期セットアップ"""
        self.db.execute("""
            -- pgvector拡張
            CREATE EXTENSION IF NOT EXISTS vector;
            
            -- メインテーブル
            CREATE TABLE documents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title TEXT NOT NULL,
                content TEXT NOT NULL,  -- 平文保存（現実的）
                content_vector vector(1536),  -- AI検索用
                search_text tsvector,  -- 全文検索用
                created_at TIMESTAMP DEFAULT NOW()
            );
            
            -- インデックス
            CREATE INDEX idx_fulltext ON documents USING GIN(search_text);
            CREATE INDEX idx_vector ON documents USING ivfflat(content_vector vector_cosine_ops);
            CREATE INDEX idx_title ON documents(lower(title));
        """)

完全一致検索
class ExactSearch:
def save_for_exact_search(self, doc: Dict) -> str:
"""完全一致検索用の保存"""
# コンテンツを保存（実用性重視）
with self.db.cursor() as cur:
cur.execute("""
INSERT INTO documents (
title,
content,
search_text  -- PostgreSQL全文検索インデックス
) VALUES (
%s, %s,
to_tsvector('japanese', %s || ' ' || %s)
) RETURNING id
""", (
doc['title'],
doc['content'],
doc['title'],
doc['content']
))
doc_id = cur.fetchone()[0]
self.db.commit()

        # 大きなファイルはGCSに
        if doc.get('attachments'):
            for file in doc['attachments']:
                blob = self.bucket.blob(f'{doc_id}/{file.name}')
                blob.upload_from_string(file.content)
        
        return doc_id
    
    def exact_search(self, query: str) -> List[Dict]:
        """完全一致検索の実行"""
        with self.db.cursor() as cur:
            # 複数の検索戦略を組み合わせ
            cur.execute("""
                SELECT 
                    id, title, 
                    substring(content, 1, 200) as snippet,
                    CASE
                        -- タイトル完全一致が最優先
                        WHEN lower(title) = lower(%s) THEN 1000
                        -- タイトル部分一致
                        WHEN lower(title) LIKE lower('%%' || %s || '%%') THEN 100
                        -- コンテンツ完全一致
                        WHEN content LIKE '%%' || %s || '%%' THEN 50
                        -- 全文検索マッチ
                        WHEN search_text @@ plainto_tsquery('japanese', %s) THEN 
                            ts_rank(search_text, plainto_tsquery('japanese', %s))
                        ELSE 0
                    END as score
                FROM documents
                WHERE 
                    lower(title) = lower(%s)
                    OR lower(title) LIKE lower('%%' || %s || '%%')
                    OR content LIKE '%%' || %s || '%%'
                    OR search_text @@ plainto_tsquery('japanese', %s)
                ORDER BY score DESC
                LIMIT 20
            """, (query, query, query, query, query, query, query, query, query))
            
            results = []
            for row in cur.fetchall():
                results.append({
                    'id': str(row[0]),
                    'title': row[1],
                    'snippet': row[2],
                    'score': float(row[3])
                })
            
            return results

AI検索（2番目に重要）
class AISearch:
def save_for_ai_search(self, doc: Dict) -> str:
"""AI検索用の保存"""
# ベクトル生成（OpenAI）
embedding = openai.Embedding.create(
input=doc['content'][:2000],  # 最初の2000文字
model="text-embedding-ada-002"
)['data'][0]['embedding']

        # 保存
        with self.db.cursor() as cur:
            cur.execute("""
                INSERT INTO documents (
                    title, content, content_vector
                ) VALUES (%s, %s, %s::vector) 
                RETURNING id
            """, (
                doc['title'],
                doc['content'],
                embedding
            ))
            doc_id = cur.fetchone()[0]
            self.db.commit()
        
        return doc_id
    
    def ai_search(self, query: str) -> List[Dict]:
        """AI検索の実行"""
        # クエリをベクトル化
        query_embedding = openai.Embedding.create(
            input=query,
            model="text-embedding-ada-002"
        )['data'][0]['embedding']
        
        # ベクトル類似度検索
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT 
                    id, title,
                    substring(content, 1, 200) as snippet,
                    1 - (content_vector <=> %s::vector) as similarity
                FROM documents
                WHERE content_vector IS NOT NULL
                ORDER BY content_vector <=> %s::vector
                LIMIT 20
            """, (query_embedding, query_embedding))
            
            results = []
            for row in cur.fetchall():
                if row[3] > 0.7:  # 類似度閾値
                    results.append({
                        'id': str(row[0]),
                        'title': row[1],
                        'snippet': row[2],
                        'similarity': float(row[3])
                    })
            
            return results

Atsuki Katayama
[おさかな]
スレ主
— 20:13
まとめ
## 暗号化と検索の現実的な構成

### 結論：3段階のセキュリティレベルで使い分け

#### 通常文書（80%）
- 保存: PostgreSQLに平文保存
- 検索: 全文検索 + AI検索すべて可能
- 理由: 法律事務所の大半の文書は社内アクセス制御で十分

#### 機密文書（15%）
- 保存:
    - 本文 → GCS（自動暗号化）
    - キーワード/要約 → PostgreSQL（平文）
- 検索: キーワードと要約のみで検索
- 実装:
    1. 保存時にキーワード100個抽出
    2. 安全な要約500文字生成
    3. これらだけDB保存、本文は暗号化

#### 極秘文書（5%）
- 保存: 完全暗号化、タイトルのみDB
- 検索: タイトル検索のみ（または諦める）
- 理由: 本当にヤバいものは検索性を犠牲に

### 技術選択
- DB: Cloud SQL（PostgreSQL + pgvector）
- ストレージ: GCS（CMEK自動暗号化）
- 検索:
    - 完全一致: PostgreSQL全文検索
    - AI検索: OpenAI Embedding + pgvector

### 重要な現実
- 完全な暗号化と全文検索の両立は不可能
- NotionもSalesforceも基本は平文検索
- セキュリティは暗号化よりアクセス制御で実現
- 機密度に応じて3段階で使い分けるのが実用的

Atsuki Katayama
[おさかな]
スレ主
— 20:37
@ベア | bea4dev
何か疑問点、懸念点等あればドシドシ送ってきてほしい。

また、下記のようなマイルストーンで行ってもらいたいのだけれど、行ける？
## バックエンドタスク・マイルストーン

### Week 1: 基本CRUD完成
目標：ドキュメントの作成・読み取り・更新・削除ができる

#### 必要なエンドポイント（5個）
1. GET /api/documents - 一覧取得
2. GET /api/documents/{id} - 単体取得
3. POST /api/documents - 新規作成
4. PUT /api/documents/{id} - 更新
5. DELETE /api/documents/{id} - 削除

#### テーブル設計
documents:
- ID、タイトル、本文、作成日時、更新日時
- 暗号化準備: security_level、encrypted_content（NULL可）

#### 完了条件
- Postmanで全エンドポイントが動作確認できる
- Docker Composeで起動可能

### Week 2: 検索機能完成
目標：タイトル検索と全文検索が動く

#### 追加エンドポイント（2個）
6. GET /api/documents/search?q={query} - タイトル検索
7. GET /api/documents/fulltext?q={query} - 全文検索

#### 追加テーブル情報
- 全文検索用インデックス（tsvector）
- 日本語対応の検索設定

#### 完了条件
- 日本語でタイトル・本文検索ができる
- 検索結果に該当箇所のスニペット含む

### Week 3: ファイル管理完成
目標：画像・PDFのアップロードと取得ができる

#### 追加エンドポイント（3個）
8. POST /api/files/upload - アップロード
9. GET /api/files/{id} - ダウンロード
10. GET /api/documents/{id}/files - ドキュメント関連ファイル一覧

#### 追加テーブル
files:
- ID、ファイル名、MIMEタイプ、サイズ
- document_id（関連付け）
- storage_path（保存先パス）

#### 完了条件
- 10MBまでのファイルアップロード可能
- ドキュメントとファイルの関連付け動作

### Week 4: 本番対応
目標：スケーラビリティとパフォーマンス改善

#### 改善項目
- ファイルストレージをS3/GCSに移行
- DBコネクションプール最適化
- ページネーション実装
- エラーハンドリング強化

#### 完了条件
- 100件以上のドキュメントで高速動作
- ファイルが外部ストレージに保存される

### 将来の拡張性担保

#### 今から準備しておく設計
1. security_levelフィールド（'public'/'confidential'/'secret'）
2. encrypted_contentフィールド（暗号化本文用、NULL可）
3. content_vectorフィールド（AI検索用、NULL可）

これらを最初から用意しておけば、後から以下が追加可能：
- 段階的な暗号化導入
- AI検索機能
- アクセス制御の細分化

### 成功指標

Week 1終了: フロントエンドがCRUD操作可能
Week 2終了: 検索機能が使える
Week 3終了: ファイル付きドキュメント作成可能
Week 4終了: 100人規模で使える状態

### 注意事項
- 認証認可は既存システムを使うので実装不要
- 最初はローカルファイル保存でOK（Week 4で移行）