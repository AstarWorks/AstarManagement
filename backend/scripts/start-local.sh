#!/bin/bash

# Start backend with local profile (Mock Auth + PostgreSQL)

echo "Starting Astar Management Backend (Local Profile)"
echo "================================================"
echo "Profile: local"
echo "Mock Auth: Enabled"
echo "Database: PostgreSQL (172.17.0.1:5433)"
echo ""

# Check if PostgreSQL is running
if ! docker ps | grep -q astarmanagement-postgres-dev; then
    echo "❌ PostgreSQL container is not running"
    echo "Please start it with: docker-compose up -d postgres"
    exit 1
fi

echo "✅ PostgreSQL is running"
echo ""

# Start the application
echo "Starting Spring Boot application..."
echo "Overriding any existing SPRING_PROFILES_ACTIVE with 'local'"
export SPRING_PROFILES_ACTIVE=local
./gradlew bootRun