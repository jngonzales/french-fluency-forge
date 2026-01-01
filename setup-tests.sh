#!/bin/bash

echo "🎭 French Fluency Forge - E2E Test Setup"
echo "========================================"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

echo "✓ npm found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"
echo ""

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npm run test:install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Playwright browsers"
    exit 1
fi

echo "✓ Playwright browsers installed"
echo ""

# Check if .env.test exists
if [ ! -f .env.test ]; then
    echo "⚠️  .env.test not found"
    echo ""
    echo "Creating .env.test from template..."
    
    if [ -f .env.test.example ]; then
        cp .env.test.example .env.test
        echo "✓ Created .env.test"
        echo ""
        echo "⚠️  IMPORTANT: Edit .env.test with your Supabase test credentials!"
        echo ""
        echo "Required variables:"
        echo "  - VITE_SUPABASE_URL"
        echo "  - VITE_SUPABASE_PUBLISHABLE_KEY"
        echo "  - SUPABASE_SERVICE_ROLE_KEY"
        echo ""
    else
        echo "❌ .env.test.example not found"
        exit 1
    fi
else
    echo "✓ .env.test already exists"
    echo ""
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.test with your Supabase test credentials"
echo "2. Start dev server: npm run dev"
echo "3. Run tests: npm run test:e2e:ui"
echo ""
echo "📚 Documentation:"
echo "  - Quick Start: e2e/QUICKSTART.md"
echo "  - Full Docs: e2e/README.md"
echo "  - Summary: TEST_SUITE_SUMMARY.md"
echo ""
echo "Happy testing! 🚀"

