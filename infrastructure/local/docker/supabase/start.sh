#!/bin/bash

# Stop existing containers if running
echo "Stopping existing containers..."
docker compose down 2>/dev/null || true

# Start Supabase services
echo "Starting Supabase services..."
docker compose up -d

echo "Waiting for services to be ready..."
sleep 15

echo "✅ Services started!"
echo ""
echo "🔗 Supabase Studio: http://localhost:3000"
echo "🔗 API Gateway: http://localhost:8000"
echo "📊 Dashboard: http://localhost:8000/dashboard (user: supabase, pass: this_password_is_insecure_and_should_be_updated)"
echo ""
echo "🔑 API Keys:"
echo "  anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE"
echo ""
echo "🧪 Test API endpoint:"
echo "  curl http://localhost:8000/rest/v1/test_table"