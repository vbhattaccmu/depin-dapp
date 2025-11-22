#!/bin/bash

# Script to help deploy BigWater smart contracts

set -e

echo "🌊 BigWater Smart Contracts Deployment Helper"
echo "=============================================="
echo ""

# Check if contracts repo exists
if [ ! -d "../BigWater-Smart-Contracts" ]; then
    echo "📥 Cloning BigWater smart contracts repository..."
    cd ..
    git clone https://github.com/BigWater-Protocol/BigWater-Smart-Contracts.git
    cd bigwater-depin-app
    echo "✅ Repository cloned"
else
    echo "✅ Smart contracts repository found"
fi

echo ""
echo "📋 To deploy the contracts:"
echo ""
echo "1. Navigate to the contracts directory:"
echo "   cd ../BigWater-Smart-Contracts"
echo ""
echo "2. Install dependencies:"
echo "   npm install"
echo ""
echo "3. Configure your wallet private key in hardhat.config.js"
echo ""
echo "4. Deploy to XDC testnet:"
echo "   npx hardhat run scripts/deploy.js --network xdc-testnet"
echo ""
echo "5. Or deploy to XDC mainnet:"
echo "   npx hardhat run scripts/deploy.js --network xdc"
echo ""
echo "6. Copy the deployed contract addresses to your .env file"
echo ""
echo "=============================================="

