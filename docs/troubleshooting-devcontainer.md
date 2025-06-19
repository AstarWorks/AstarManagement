# Devcontainer Troubleshooting Guide

## Spring Boot Backend Launch Issues in Devcontainer

### Problem: Network Connectivity Issues
**Symptom**: Spring Boot application fails to connect to PostgreSQL and Redis from devcontainer
**Error**: Connection timeouts, DNS resolution failures, "localhost" unreachable

### Root Cause
The devcontainer runs on a separate Docker network (`devcontainer_default`) from the backend services (`backend_default`), preventing cross-network communication. Additionally, `host.docker.internal` may not resolve correctly in all Docker environments.

### Solution
Use the Docker gateway IP (172.18.0.1) to reach host services from within the devcontainer.

#### 1. Environment Variables Configuration
**File**: `.devcontainer/devcontainer.json`
```json
{
  "containerEnv": {
    "DB_HOST": "172.18.0.1",
    "REDIS_HOST": "172.18.0.1", 
    "SPRING_PROFILES_ACTIVE": "dev"
  }
}
```

#### 2. Application Profile Configuration  
**File**: `backend/src/main/resources/application-dev.properties`
```properties
# Development profile for devcontainer environment
spring.datasource.url=jdbc:postgresql://${DB_HOST:host.docker.internal}:${DB_PORT:5432}/astermanagement
spring.data.redis.host=${REDIS_HOST:host.docker.internal}
```

#### 3. Verify Network Connectivity
```bash
# Test PostgreSQL connectivity
curl -v telnet://172.18.0.1:5432 --connect-timeout 5

# Test Redis connectivity  
curl -v telnet://172.18.0.1:6379 --connect-timeout 5
```

### Prerequisites
1. Ensure backend services are running:
   ```bash
   cd backend && docker-compose up -d
   ```

2. Verify services are healthy:
   ```bash
   docker-compose ps
   ```

### Common Issues and Solutions

#### Issue: `host.docker.internal` not resolving
**Solution**: Use the Docker gateway IP directly (172.18.0.1)

#### Issue: Connection still fails after configuration
**Solution**: 
1. Check if gateway IP is correct: `ip route show default`
2. Verify port forwarding: `docker-compose ps` 
3. Restart devcontainer after configuration changes

#### Issue: Works in devcontainer but breaks host development
**Solution**: Use environment variables with fallback values:
```properties
spring.datasource.url=jdbc:postgresql://${DB_HOST:localhost}:5432/astermanagement
```

### Testing Checklist
- [ ] Database connectivity works from devcontainer
- [ ] Redis connectivity works from devcontainer  
- [ ] Spring Boot application starts successfully
- [ ] Host-based development still works
- [ ] Health endpoints respond correctly

### Network Architecture
```
Host System (172.18.0.1)
├── backend_default network (172.20.0.0/16)
│   ├── PostgreSQL (172.20.0.2:5432) → forwarded to host:5432
│   └── Redis (172.20.0.3:6379) → forwarded to host:6379
└── devcontainer_default network (172.18.0.0/16)
    └── devcontainer (172.18.0.2) → accesses services via 172.18.0.1
```

### Related Files
- `.devcontainer/devcontainer.json` - Environment configuration
- `backend/src/main/resources/application-dev.properties` - Dev profile  
- `backend/docker-compose.yml` - Backend services
- `backend/src/main/resources/application.properties` - Default config