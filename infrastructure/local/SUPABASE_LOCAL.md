# Supabase Local Development Setup

## 1. Start Supabase locally

```bash
# Start Supabase containers
docker-compose up -d

# Wait for PostgreSQL to be ready
docker-compose logs -f postgres

# Create test table
docker exec -i astar-supabase-db psql -U postgres < init.sql
```

## 2. Run Spring Boot with local profile

```bash
SPRING_PROFILES_ACTIVE=local ./gradlew bootRun
```

## 3. Test endpoints

```bash
# Test connection
curl http://localhost:8080/api/v1/supabase-test/connection

# Fetch data
curl http://localhost:8080/api/v1/supabase-test/data/test_table

# Insert data
curl -X POST http://localhost:8080/api/v1/supabase-test/data/test_table \
  -H "Content-Type: application/json" \
  -d '{"name": "New Item", "description": "Created via API"}'
```

## Stop Supabase

```bash
docker-compose down
# To remove data as well
docker-compose down -v
```