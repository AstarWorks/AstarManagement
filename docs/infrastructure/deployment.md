# デプロイメント

## Docker構成

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: astar
      POSTGRES_USER: astar
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U astar"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      SPRING_PROFILES_ACTIVE: docker
      DB_HOST: postgres
      REDIS_HOST: redis
      S3_ENDPOINT: http://minio:9000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "8080:8080"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NUXT_PUBLIC_API_BASE: http://backend:8080/api
      NUXT_PUBLIC_WS_URL: ws://backend:8080/ws
    depends_on:
      - backend
    ports:
      - "3000:3000"

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### Backend Dockerfile
```dockerfile
# ビルドステージ
FROM gradle:8-jdk21 AS builder
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts ./
COPY src ./src
RUN gradle build -x test

# 実行ステージ
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -g 1000 spring && adduser -u 1000 -G spring -s /bin/sh -D spring
USER spring:spring
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

### Frontend Dockerfile
```dockerfile
# ビルドステージ
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# 実行ステージ
FROM oven/bun:1-alpine
WORKDIR /app
COPY --from=builder /app/.output .output
EXPOSE 3000
CMD ["bun", "run", ".output/server/index.mjs"]
```

## Kubernetes

### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: astar-backend
  labels:
    app: astar-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: astar-backend
  template:
    metadata:
      labels:
        app: astar-backend
    spec:
      containers:
      - name: backend
        image: astar/backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "kubernetes"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 5
```

### Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: astar-backend
spec:
  selector:
    app: astar-backend
  ports:
  - port: 8080
    targetPort: 8080
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: astar-frontend
spec:
  selector:
    app: astar-frontend
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

### Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: astar-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - app.astar-management.com
    secretName: astar-tls
  rules:
  - host: app.astar-management.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: astar-backend
            port:
              number: 8080
      - path: /
        pathType: Prefix
        backend:
          service:
            name: astar-frontend
            port:
              number: 3000
```

### HPA (Horizontal Pod Autoscaler)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: astar-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: astar-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## CI/CD (GitHub Actions)

### .github/workflows/deploy.yml
```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up JDK 21
      uses: actions/setup-java@v3
      with:
        java-version: '21'
        distribution: 'temurin'
    
    - name: Run backend tests
      working-directory: ./backend
      run: ./gradlew test
    
    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest
    
    - name: Run frontend tests
      working-directory: ./frontend
      run: |
        bun install
        bun test

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push Backend
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend:latest
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend:${{ github.sha }}
    
    - name: Build and push Frontend
      uses: docker/build-push-action@v4
      with:
        context: ./frontend
        push: true
        tags: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend:latest
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to Kubernetes
      uses: azure/k8s-deploy@v4
      with:
        manifests: |
          k8s/deployment.yaml
          k8s/service.yaml
          k8s/ingress.yaml
        images: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend:${{ github.sha }}
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend:${{ github.sha }}
```

## 環境別設定

### Development
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      target: development
    volumes:
      - ./backend:/app
    environment:
      SPRING_PROFILES_ACTIVE: dev
    command: ./gradlew bootRun
```

### Staging
```yaml
# values.staging.yaml
replicaCount: 2
image:
  tag: staging
resources:
  limits:
    cpu: 300m
    memory: 512Mi
```

### Production
```yaml
# values.production.yaml
replicaCount: 5
image:
  tag: stable
resources:
  limits:
    cpu: 1000m
    memory: 2Gi
autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 20
```

## 監視・ロギング

### Prometheus設定
```yaml
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: astar-backend
spec:
  selector:
    matchLabels:
      app: astar-backend
  endpoints:
  - port: metrics
    interval: 30s
    path: /actuator/prometheus
```

### Grafanaダッシュボード
```json
{
  "dashboard": {
    "title": "Astar Management",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_server_requests_seconds_count[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_server_requests_seconds_count{status=~\"5..\"}[5m])"
          }
        ]
      }
    ]
  }
}
```

## バックアップ

### PostgreSQLバックアップ
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/postgres"

# フルバックアップ
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# 古いバックアップを削除（30日以上）
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

### S3同期
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: s3-backup
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: s3-sync
            image: amazon/aws-cli
            command:
            - /bin/sh
            - -c
            - |
              aws s3 sync /data s3://backup-bucket/astar/
```

## まとめ

インフラストラクチャにより：
1. **コンテナ化**: Docker/Kubernetesで一貫した環境
2. **自動スケーリング**: 負荷に応じた自動拡張
3. **CI/CD**: GitHub Actionsによる自動デプロイ
4. **監視**: Prometheus/Grafanaでリアルタイム監視