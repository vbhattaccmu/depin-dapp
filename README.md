# BigWater DePIN App

A decentralized physical infrastructure network (DePIN) application for managing BigWater devices with seamless WebAuthn authentication and embedded wallet functionality.

## Features

- 🔐 **WebAuthn Authentication** - Passwordless login using biometrics (Face ID, Touch ID, Windows Hello)
- 💼 **Embedded Wallet** - Non-custodial wallet with encrypted private key storage
- 🎨 **NFT Minting with Logo** - Auto-generate custom NFTs with BigWater logo when registering devices
- 📊 **Dashboard** - Track NFT, BIGW tokens, and XDC balances in real-time
- 🔄 **Send/Receive** - Transfer tokens and NFTs to other users securely
- 📱 **Device Registration** - Step-by-step device registration with blockchain NFT minting
- 📜 **Activity Feed** - View complete transaction history with export to CSV

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS
- **Web3**: Ethers.js v6
- **Authentication**: SimpleWebAuthn
- **State Management**: Zustand
- **Blockchain**: XDC Network

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd bigwater-depin-app
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` and add your contract addresses and configuration.

### Development

Start the development server:
```bash
npm run dev
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Build

Build for production:
```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Smart Contract Integration

This app integrates with the BigWater smart contracts:
- **BigWaterToken** - ERC20 token (BIGW)
- **BigWaterDeviceNFT** - ERC721 NFT for devices
- **DeviceRegistry** - Device management
- **RewardDistribution** - Reward tracking
- **DePINStaking** - Staking functionality

Contract repository: [BigWater-Smart-Contracts](https://github.com/BigWater-Protocol/BigWater-Smart-Contracts)

## NFT Features

Each registered device automatically mints a unique NFT with:

- ✅ **Custom BigWater Logo** - Beautiful SVG graphic with water drop and circuit pattern
- ✅ **Color-Coded Design** - Different colors for each device type
- ✅ **Device Information** - Embedded metadata following ERC-721 standard
- ✅ **On-Chain Storage** - Base64-encoded SVG, no external dependencies
- ✅ **Marketplace Ready** - Compatible with OpenSea and other NFT platforms

See [NFT Minting Documentation](docs/NFT_MINTING.md) for details.

**Preview:** Open `docs/nft-preview.html` in your browser to see sample NFTs!

## Security

- Private keys are stored encrypted in browser's IndexedDB
- WebAuthn provides secure biometric authentication
- All sensitive configuration via environment variables
- Never commit `.env` files

## License

MIT

