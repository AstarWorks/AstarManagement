# Devcontainer Troubleshooting Guide

## Spring Boot Backend Launch Issues

### Problem
Spring Boot backend cannot connect to PostgreSQL and Redis when running in devcontainer due to network isolation.

### Root Cause
- Devcontainer runs on `devcontainer_default` network (172.18.0.0/16)
- Backend services (PostgreSQL/Redis) run on `backend_default` network (172.20.0.0/16)
- `host.docker.internal` doesn't resolve in this devcontainer setup
- Application configured to use `localhost` which resolves to container, not host

### Solution

#### 1. Network Configuration
Updated `.devcontainer/devcontainer.json` to use Docker gateway IP:
```json
{
  "containerEnv": {
    "DB_HOST": "172.18.0.1",
    "REDIS_HOST": "172.18.0.1", 
    "SPRING_PROFILES_ACTIVE": "dev"
  }
}
```

#### 2. Application Configuration
Updated `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://${DB_HOST:localhost}:5432/astermanagement
```

Created `application-dev.properties` with devcontainer-specific settings using gateway IP as default.

### Verification Steps

1. **Test network connectivity:**
   ```bash
   curl -v 172.18.0.1:5432  # Should connect to PostgreSQL
   curl -v 172.18.0.1:6379  # Should connect to Redis
   ```

2. **Check Docker networks:**
   ```bash
   ip route show  # Shows 172.18.0.1 as gateway
   ```

3. **Start Spring Boot:**
   ```bash
   export SPRING_PROFILES_ACTIVE=dev
   export DB_HOST=172.18.0.1
   export REDIS_HOST=172.18.0.1
   ./gradlew bootRun
   ```

### Common Issues

#### `host.docker.internal` not resolving
- **Cause**: Not all Docker setups support `host.docker.internal`
- **Solution**: Use Docker gateway IP (172.18.0.1) instead

#### Connection timeouts
- **Cause**: Services not running on host
- **Solution**: Start backend services: `cd backend && docker-compose up -d`

#### Permission errors
- **Cause**: Docker socket permissions
- **Solution**: Devcontainer already configured with Docker-outside-of-Docker feature

### Alternative Solutions

If gateway IP approach doesn't work:

1. **Bridge networks** (add to `.devcontainer/docker-compose.yaml`):
   ```yaml
   networks:
     default:
       external: true
       name: backend_default
   ```

2. **Host networking** (not recommended for development):
   ```json
   "runArgs": ["--network=host"]
   ```

### Testing Matrix

| Configuration | Database | Redis | Status |
|---------------|----------|-------|---------|
| `localhost` | ❌ | ❌ | Fails (network isolation) |
| `host.docker.internal` | ❌ | ❌ | Fails (DNS resolution) |
| `172.18.0.1` (gateway) | ✅ | ✅ | Works |

### Next Steps

When opening in devcontainer:
1. Services auto-start via environment variables
2. Spring Boot `dev` profile automatically activated
3. Database/Redis connectivity verified on startup
4. No manual configuration needed