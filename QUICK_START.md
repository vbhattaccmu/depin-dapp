# BigWater DePIN App - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

```bash
cd bigwater-depin-app
npm install
```

Or use the install script:
```bash
./scripts/install.sh
```

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your contract addresses
nano .env
```

**Required Configuration:**
- `VITE_BIGWATER_TOKEN_ADDRESS` - Your BigWaterToken contract
- `VITE_BIGWATER_NFT_ADDRESS` - Your BigWaterDeviceNFT contract  
- `VITE_DEVICE_REGISTRY_ADDRESS` - Your DeviceRegistry contract

### 3. Run the App

```bash
npm run dev
```

App opens at `http://localhost:3000` 🎉

---

## 📱 Features Overview

| Feature | Description | Status |
|---------|-------------|--------|
| **WebAuthn Login** | Biometric authentication (Face ID, Touch ID) | ✅ Ready |
| **Embedded Wallet** | Non-custodial, encrypted wallet | ✅ Ready |
| **NFT Minting** | Auto-generate NFTs with logo | ✅ Ready |
| **Device Registry** | Register DePIN devices | ✅ Ready |
| **Token Transfers** | Send/receive BIGW tokens | ✅ Ready |
| **NFT Transfers** | Send/receive device NFTs | ✅ Ready |
| **Activity Feed** | Transaction history | ✅ Ready |
| **Dashboard** | Balance tracking | ✅ Ready |

---

## 🎨 NFT Preview

**See your NFTs before minting!**

```bash
# Open in browser
open docs/nft-preview.html
```

Sample NFTs with BigWater logo for each device type.

---

## 📚 Documentation

- **Setup Guide**: [`SETUP.md`](SETUP.md) - Detailed installation
- **NFT Minting**: [`docs/NFT_MINTING.md`](docs/NFT_MINTING.md) - NFT documentation
- **Project Overview**: [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md) - Architecture
- **Contributing**: [`CONTRIBUTING.md`](CONTRIBUTING.md) - How to contribute

---

## 🐳 Docker Quick Start

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t bigwater-depin-app .
docker run -p 3000:80 bigwater-depin-app
```

---

## 🔑 First Time User Flow

### 1. Register Account
- Click "Register" tab
- Enter username & password (min 8 chars)
- **Save your recovery phrase!** (shown once)
- Complete biometric setup (optional)

### 2. View Dashboard
- See your XDC, BIGW, and NFT balances
- Dashboard auto-refreshes on load
- Click "Refresh" to manually update

### 3. Register a Device
1. Navigate to "Register Device"
2. Fill in device details:
   - **Device ID**: Unique identifier (e.g., `BIGW-2025-001`)
   - **Device Name**: Friendly name (e.g., `Lab Sensor`)
   - **Device Type**: Select from dropdown
   - **Location**: Where it's installed (optional)
   - **Description**: Additional info (optional)
3. Review and confirm
4. Enter password to sign transaction
5. Wait for minting (~30 seconds)
6. **NFT created!** View in dashboard with custom logo

### 4. Transfer Assets
- **Send Tokens**: Select "Send/Receive" → Choose BIGW → Enter address & amount
- **Send NFTs**: Select "Send/Receive" → Choose NFT → Select device → Enter address
- **Receive**: Copy your address and share it

### 5. View Activity
- Navigate to "Activity"
- See all transactions
- Filter by type (send, receive, register)
- Export to CSV

---

## 🧪 Testing Tips

### Test Device Registration

```
Device ID: TEST-001
Device Name: My Test Sensor  
Device Type: Water Sensor
Location: Test Lab
Description: Testing NFT minting feature
```

### Verify NFT

1. After registration, check Dashboard
2. NFT should appear with custom BigWater logo
3. Logo color matches device type
4. Click NFT to see metadata

### Check Transaction

- Copy transaction hash from success screen
- Visit: `https://explorer.xinfin.network/tx/{hash}`
- Verify device registration event

---

## ⚠️ Troubleshooting

### WebAuthn Not Working
- **Issue**: Can't use biometric login
- **Fix**: Ensure HTTPS (or localhost), check browser support

### Balance Shows 0
- **Issue**: Dashboard shows 0 for everything
- **Fix**: Check contract addresses in `.env`, verify network connection

### Transaction Failing
- **Issue**: Registration or transfer fails
- **Fix**: Ensure you have XDC for gas, check contract deployment

### NFT Image Not Showing
- **Issue**: NFT shows placeholder instead of logo
- **Fix**: Check metadata was stored, inspect browser console

---

## 🔒 Security Checklist

Before using with real assets:

- [ ] Never share your password
- [ ] Save recovery phrase securely offline
- [ ] Test with small amounts first
- [ ] Verify contract addresses
- [ ] Use HTTPS in production
- [ ] Enable biometric authentication
- [ ] Regular backups of credentials

---

## 📞 Need Help?

1. **Documentation**: Check `SETUP.md` and `docs/`
2. **Issues**: GitHub Issues
3. **Smart Contracts**: [BigWater-Smart-Contracts](https://github.com/BigWater-Protocol/BigWater-Smart-Contracts)

---

## 🎯 Quick Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Lint code

# Docker
docker-compose up -d  # Start with Docker
docker-compose down   # Stop Docker containers

# Scripts
./scripts/install.sh            # Install dependencies
./scripts/deploy-contracts.sh   # Help deploy contracts
```

---

## 🌐 Network Information

**XDC Mainnet:**
- Chain ID: `50`
- RPC: `https://rpc.xinfin.network`
- Explorer: `https://explorer.xinfin.network`

**XDC Testnet (Apothem):**
- Chain ID: `51`
- RPC: `https://rpc.apothem.network`
- Explorer: `https://explorer.apothem.network`
- Faucet: `https://faucet.apothem.network`

---

## 🎉 You're Ready!

Your BigWater DePIN app is configured and ready to:
- ✅ Register devices with beautiful NFTs
- ✅ Transfer tokens securely
- ✅ Track all activity
- ✅ Manage your DePIN infrastructure

**Happy Building! 🌊**

