#!/bin/bash

# BigWater DePIN App - Installation Script

set -e

echo "🌊 BigWater DePIN App - Installation Script"
echo "============================================"
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18.x"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version is too old. Please upgrade to Node.js >= 18.x"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit the .env file and add your contract addresses"
    echo "   You can find them after deploying the BigWater smart contracts"
else
    echo ""
    echo "✅ .env file already exists"
fi

echo ""
echo "============================================"
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your contract addresses"
echo "2. Run 'npm run dev' to start the development server"
echo ""
echo "For more information, see SETUP.md"
echo "============================================"

