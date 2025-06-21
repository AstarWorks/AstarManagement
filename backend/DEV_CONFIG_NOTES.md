# Development Environment Configuration Notes

## HikariCP Connection Pool Settings

The development environment (`application-dev.properties`) intentionally uses reduced connection pool settings compared to production to conserve resources in local development:

### Production Settings (application.properties)
- **Maximum Pool Size**: 20 connections
- **Minimum Idle**: 5 connections

### Development Settings (application-dev.properties)
- **Maximum Pool Size**: 10 connections (reduced by 50%)
- **Minimum Idle**: 2 connections (reduced by 60%)

### Rationale
These reduced settings in development are appropriate because:

1. **Resource Conservation**: Development environments typically run on developer machines with limited resources
2. **Lower Concurrency**: Development testing rarely requires high concurrent database connections
3. **Faster Startup**: Smaller pool sizes result in faster application startup during development
4. **Docker Constraints**: When running in devcontainers or Docker environments, resource limits may be more restrictive

### Performance Impact
The reduced settings should not impact development work as:
- Most development testing involves single-user scenarios
- Integration tests can use their own pool configurations
- Performance testing should be done in staging/production-like environments

### Other Optimizations for Development
The development profile also includes:
- SQL logging enabled (`show-sql=true`) for debugging
- Hibernate statistics enabled for performance analysis
- Debug logging for JDBC operations

## Monitoring in Development
To monitor connection pool usage in development:
1. Access the performance metrics dashboard at `/api/v1/metrics/dashboard`
2. Check HikariCP metrics via Spring Boot Actuator at `/actuator/metrics/hikaricp.*`
3. Monitor logs for connection pool warnings

## Switching to Production Settings
If you need production-like settings in development:
1. Override the specific properties via environment variables:
   ```bash
   export SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=20
   export SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE=5
   ```
2. Or create a custom profile that extends dev but overrides pool settings