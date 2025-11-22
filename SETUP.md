# BigWater DePIN App - Setup Guide

## Prerequisites

- Node.js >= 18.x
- npm or yarn
- A modern browser with WebAuthn support (Chrome, Safari, Firefox, Edge)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` to `.env` and update with your contract addresses:

```bash
cp .env.example .env
```

Edit `.env` and add your deployed smart contract addresses from the [BigWater-Smart-Contracts](https://github.com/BigWater-Protocol/BigWater-Smart-Contracts) repository.

**Required Configuration:**
- `VITE_BIGWATER_TOKEN_ADDRESS` - Address of the BigWaterToken contract
- `VITE_BIGWATER_NFT_ADDRESS` - Address of the BigWaterDeviceNFT contract
- `VITE_DEVICE_REGISTRY_ADDRESS` - Address of the DeviceRegistry contract
- `VITE_REWARD_DISTRIBUTION_ADDRESS` - Address of the RewardDistribution contract
- `VITE_STAKING_ADDRESS` - Address of the DePINStaking contract

### 3. Start Development Server

```bash
npm run dev
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Deploying Smart Contracts

Before using the app, you need to deploy the BigWater smart contracts to the XDC Network:

1. Clone the contracts repository:
```bash
git clone https://github.com/BigWater-Protocol/BigWater-Smart-Contracts.git
cd BigWater-Smart-Contracts
```

2. Install dependencies:
```bash
npm install
```

3. Configure your wallet private key in the hardhat config

4. Deploy contracts:
```bash
npx hardhat run scripts/deploy.js --network xdc
```

5. Copy the deployed contract addresses to your `.env` file

## Using Docker

### Build and Run with Docker

```bash
# Build the image
docker build -t bigwater-depin-app .

# Run the container
docker run -p 3000:80 bigwater-depin-app
```

### Using Docker Compose

```bash
# Start the app
docker-compose up -d

# Stop the app
docker-compose down
```

## Features

### 1. WebAuthn Authentication
- Seamless biometric login (fingerprint, Face ID, etc.)
- Secure credential storage in browser's IndexedDB
- Fallback to password authentication

### 2. Embedded Wallet
- Non-custodial wallet generated on registration
- Private keys encrypted with user password
- Secure storage in browser's IndexedDB

### 3. Dashboard
- View XDC, BIGW token, and NFT balances
- Display registered device NFTs
- Recent activity feed

### 4. Device Registration
- Step-by-step registration flow
- Mint NFT on blockchain
- Store device metadata

### 5. Send/Receive
- Transfer BIGW tokens to other users
- Transfer device NFTs
- Copy wallet address to receive assets

### 6. Activity Feed
- View all transactions
- Filter by type (send, receive, register)
- Export to CSV

## Security Features

✅ **Encrypted Private Keys** - All private keys are encrypted with AES-GCM before storage

✅ **Biometric Authentication** - WebAuthn provides secure, passwordless login

✅ **Secure Storage** - Credentials stored in browser's IndexedDB, never sent to server

✅ **Environment Variables** - Sensitive configuration via env vars, never committed

✅ **HTTPS Only** - WebAuthn requires HTTPS in production

## Testing the App

### Test User Registration

1. Click "Register" tab
2. Enter a username and password (min 8 characters)
3. Save the recovery phrase securely
4. Set up biometric authentication (if supported)

### Test Device Registration

1. Navigate to "Register Device"
2. Fill in device information
3. Confirm and sign transaction
4. View your new NFT in Dashboard

### Test Token Transfer

1. Navigate to "Send/Receive"
2. Select "Send" tab and "BIGW Token"
3. Enter recipient address and amount
4. Sign transaction to send

## Production Deployment

### Environment Configuration

For production, update your `.env` with:

```bash
VITE_RP_ID=yourdomain.com
VITE_APP_URL=https://yourdomain.com
```

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Deploy to Hosting

Deploy the `dist/` directory to your hosting provider:

- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy --prod`
- **AWS S3**: Upload to S3 bucket with static website hosting
- **Docker**: Use the provided Dockerfile

## Browser Compatibility

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| WebAuthn | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Web3 | ✅ | ✅ | ✅ | ✅ |

## Troubleshooting

### WebAuthn not working
- Ensure you're using HTTPS (or localhost for development)
- Check browser compatibility
- Enable biometric authentication on your device

### Transactions failing
- Verify contract addresses in `.env`
- Check you have enough XDC for gas fees
- Ensure contracts are deployed to XDC Network

### Balance not updating
- Click "Refresh" button on Dashboard
- Check network connection
- Verify RPC URL is correct

## Support

For issues and questions:
- GitHub Issues: [BigWater-Protocol/BigWater-Smart-Contracts](https://github.com/BigWater-Protocol/BigWater-Smart-Contracts/issues)
- Documentation: See README.md

## License

MIT

