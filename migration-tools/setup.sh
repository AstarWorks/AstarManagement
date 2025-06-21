#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Setting up React to Vue Migration Tools"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18 or higher is required"
    echo "   Current version: $(node -v)"
    exit 1
fi

echo "✓ Node.js version: $(node -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo ""
echo "🔨 Building TypeScript..."
npm run build

# Make CLI tools executable
echo ""
echo "🔧 Making CLI tools executable..."
chmod +x src/cli/transform.ts
chmod +x src/examples/transform-matter-card.ts

# Create output directories
echo ""
echo "📁 Creating output directories..."
mkdir -p output/examples
mkdir -p dashboard/dist
mkdir -p tests/output

# Check database connection
echo ""
echo "🗄️  Checking database connection..."
if command -v psql &> /dev/null; then
    echo "   PostgreSQL client found"
else
    echo "   ⚠️  Warning: PostgreSQL client not found"
    echo "   You'll need to set up the database manually"
fi

# Create .env file if not exists
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aster_management
DB_USER=aster_user
DB_PASSWORD=aster_password

# Application ports
DASHBOARD_PORT=5173
COMPARISON_PORT=8080
EOF
    echo "   ✓ .env file created (please update with your database credentials)"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Quick Start Guide:"
echo ""
echo "1. Analyze your React codebase:"
echo "   npm run analyze ../frontend/src"
echo ""
echo "2. Transform a component:"
echo "   npm run transform ../frontend/src/components/Button.tsx"
echo ""
echo "3. Start the migration dashboard:"
echo "   npm run dashboard"
echo ""
echo "4. Run side-by-side comparison:"
echo "   npm run compare"
echo ""
echo "For more information, see README.md"