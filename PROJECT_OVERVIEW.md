# BigWater DePIN App - Project Overview

## Architecture Overview

This is a modern React-based decentralized application (dApp) for managing BigWater DePIN (Decentralized Physical Infrastructure Network) devices. The application provides a seamless user experience with WebAuthn authentication and embedded wallet functionality.

## Technology Stack

### Frontend Framework
- **React 18** - UI library
- **Vite** - Build tool and development server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework

### Web3 Integration
- **Ethers.js v6** - Ethereum library for blockchain interaction
- **Custom Smart Contract ABIs** - Interface definitions for BigWater contracts

### Authentication & Security
- **SimpleWebAuthn** - WebAuthn/FIDO2 implementation
- **Web Crypto API** - Cryptographic operations for wallet encryption
- **IndexedDB** - Secure local storage for credentials and encrypted keys

### State Management
- **Zustand** - Lightweight state management
- **Persist Middleware** - State persistence across sessions

### UI Components
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications
- **Date-fns** - Date formatting utilities

## Project Structure

```
bigwater-depin-app/
├── public/                 # Static assets
│   └── vite.svg
├── scripts/               # Utility scripts
│   ├── install.sh        # Installation script
│   └── deploy-contracts.sh
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Layout.jsx
│   │   ├── BalanceCard.jsx
│   │   ├── NFTCard.jsx
│   │   ├── ActivityItem.jsx
│   │   └── LoadingSpinner.jsx
│   ├── config/          # Configuration files
│   │   ├── index.js     # Main config with env vars
│   │   └── contracts.js # Smart contract ABIs
│   ├── pages/           # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── RegisterDevice.jsx
│   │   ├── SendReceive.jsx
│   │   └── Activity.jsx
│   ├── stores/          # Zustand state stores
│   │   ├── authStore.js
│   │   ├── walletStore.js
│   │   └── activityStore.js
│   ├── utils/           # Utility functions
│   │   ├── webauthn.js  # WebAuthn helpers
│   │   ├── wallet.js    # Wallet operations
│   │   └── blockchain.js # Blockchain interactions
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── .env                 # Environment variables
├── .env.example         # Environment template
├── .dockerignore        # Docker ignore rules
├── .eslintrc.cjs        # ESLint configuration
├── .gitignore           # Git ignore rules
├── docker-compose.yml   # Docker Compose config
├── Dockerfile           # Docker build instructions
├── index.html           # HTML entry point
├── nginx.conf           # Nginx configuration
├── package.json         # Dependencies
├── postcss.config.js    # PostCSS configuration
├── tailwind.config.js   # Tailwind configuration
├── vite.config.js       # Vite configuration
├── README.md            # Main documentation
├── SETUP.md             # Setup guide
├── CONTRIBUTING.md      # Contribution guidelines
└── PROJECT_OVERVIEW.md  # This file
```

## Core Features

### 1. WebAuthn Authentication

**Location**: `src/utils/webauthn.js`, `src/pages/Login.jsx`

- Passwordless biometric authentication
- Platform authenticator support (Face ID, Touch ID, Windows Hello)
- Fallback to password-based authentication
- Secure credential storage in IndexedDB

**Flow**:
1. User registers with username/password
2. WebAuthn credential created and stored
3. Future logins use biometric authentication
4. Password required only for transaction signing

### 2. Embedded Wallet

**Location**: `src/utils/wallet.js`

- Non-custodial wallet generated on registration
- Private key encrypted with AES-GCM
- Mnemonic phrase provided for recovery
- Keys never leave the browser

**Security**:
- **Encryption**: AES-GCM with PBKDF2 key derivation
- **Salt**: Static salt for key derivation (should be user-specific in production)
- **Storage**: IndexedDB with encrypted data
- **Recovery**: 12-word mnemonic phrase

### 3. Smart Contract Integration

**Location**: `src/utils/blockchain.js`, `src/config/contracts.js`

Supports all BigWater contracts:
- **BigWaterToken** - ERC20 token for rewards
- **BigWaterDeviceNFT** - ERC721 NFT for device registration
- **DeviceRegistry** - Device management and metadata
- **RewardDistribution** - Reward calculations and distribution
- **DePINStaking** - Token staking mechanism

### 4. Dashboard

**Location**: `src/pages/Dashboard.jsx`

- Real-time balance display (XDC, BIGW, NFTs)
- Device NFT gallery
- Recent activity feed
- Refresh functionality

### 5. Device Registration

**Location**: `src/pages/RegisterDevice.jsx`

Three-step registration process:
1. **Device Information** - Collect device details
2. **Confirmation** - Review and confirm
3. **Success** - Transaction receipt and NFT ID

Creates an NFT on the blockchain with device metadata.

### 6. Send/Receive

**Location**: `src/pages/SendReceive.jsx`

- Send BIGW tokens to any address
- Transfer device NFTs
- Display wallet address with QR code capability
- Transaction history

### 7. Activity Feed

**Location**: `src/pages/Activity.jsx`

- Complete transaction history
- Filter by type (send, receive, register)
- Export to CSV
- Transaction statistics

## State Management

### Auth Store (`authStore.js`)

```javascript
{
  isAuthenticated: boolean,
  username: string,
  address: string,
  login: (username, address) => void,
  logout: () => void,
  updateAddress: (address) => void
}
```

### Wallet Store (`walletStore.js`)

```javascript
{
  balance: {
    xdc: string,
    bigw: string,
    nfts: array
  },
  loading: boolean,
  error: string | null,
  setBalance: (balance) => void,
  updateXDCBalance: (xdc) => void,
  updateBIGWBalance: (bigw) => void,
  updateNFTs: (nfts) => void,
  setLoading: (loading) => void,
  setError: (error) => void
}
```

### Activity Store (`activityStore.js`)

```javascript
{
  activities: array,
  addActivity: (activity) => void,
  clearActivities: () => void,
  getActivitiesByType: (type) => array
}
```

## Security Considerations

### Current Implementation

✅ **Private Key Encryption** - AES-GCM encryption before storage
✅ **WebAuthn** - FIDO2 authentication standard
✅ **No Server Storage** - All keys stored locally
✅ **HTTPS Required** - WebAuthn requires secure context
✅ **Environment Variables** - Sensitive config externalized

### Production Recommendations

⚠️ **User-Specific Salt** - Use unique salt per user for PBKDF2
⚠️ **Key Derivation** - Increase PBKDF2 iterations to 310,000+
⚠️ **Backup System** - Implement secure backup/recovery mechanism
⚠️ **Session Management** - Add automatic logout after inactivity
⚠️ **Transaction Limits** - Implement spending limits and confirmations
⚠️ **Hardware Wallet** - Add hardware wallet support for large amounts
⚠️ **Multi-Signature** - Consider multi-sig for high-value accounts

## API Integration

### Blockchain RPC

The app connects to XDC Network via JSON-RPC:
- **Mainnet**: `https://rpc.xinfin.network`
- **Testnet**: `https://rpc.apothem.network`

### Contract Interactions

All contract calls go through ethers.js:
1. Create provider from RPC URL
2. Create signer from encrypted private key
3. Initialize contract with address + ABI
4. Call contract methods
5. Wait for transaction confirmation

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Docker Development

```bash
# Build image
docker build -t bigwater-depin-app .

# Run container
docker run -p 3000:80 bigwater-depin-app

# Or use docker-compose
docker-compose up -d
```

## Environment Variables

All configuration via environment variables (see `.env.example`):

### Required
- `VITE_BIGWATER_TOKEN_ADDRESS` - Token contract address
- `VITE_BIGWATER_NFT_ADDRESS` - NFT contract address
- `VITE_DEVICE_REGISTRY_ADDRESS` - Registry contract address

### Optional
- `VITE_CHAIN_ID` - Network chain ID (default: 50)
- `VITE_RPC_URL` - RPC endpoint
- `VITE_EXPLORER_URL` - Block explorer URL
- `VITE_RP_NAME` - WebAuthn relying party name
- `VITE_RP_ID` - WebAuthn relying party ID

## Deployment

### Static Hosting

Deploy `dist/` folder to:
- **Vercel** - Zero config deployment
- **Netlify** - Automatic builds from Git
- **AWS S3 + CloudFront** - Enterprise scale
- **GitHub Pages** - Free for open source

### Docker

Production-ready Dockerfile included:
- Multi-stage build for optimization
- Nginx for static file serving
- Health checks configured
- Gzip compression enabled

### CI/CD

Consider setting up:
- Automated testing on PR
- Automatic deployment on merge
- Contract address validation
- Security scanning

## Testing Strategy

### Manual Testing Checklist

- [ ] User registration with WebAuthn
- [ ] User login with biometrics
- [ ] Wallet balance loading
- [ ] Device registration flow
- [ ] Token transfer
- [ ] NFT transfer
- [ ] Activity tracking
- [ ] CSV export
- [ ] Mobile responsiveness
- [ ] Logout and session clear

### Automated Testing (Future)

Consider adding:
- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright or Cypress
- **Contract Tests**: Hardhat testing framework
- **Integration Tests**: Mock blockchain interactions

## Performance Optimization

### Current Optimizations

✅ Code splitting with React.lazy (can be added)
✅ Vite for fast builds
✅ Tailwind CSS purging
✅ Image optimization
✅ Gzip compression in Docker

### Future Improvements

- Add React.lazy for route-based code splitting
- Implement service worker for offline support
- Add image lazy loading
- Optimize bundle size
- Add caching strategy

## Troubleshooting

### Common Issues

**WebAuthn not working**
- Check HTTPS (required except localhost)
- Verify browser support
- Enable biometrics on device

**Transactions failing**
- Verify contract addresses
- Check gas balance (XDC)
- Confirm network connection

**Balance not updating**
- Click refresh button
- Check RPC endpoint
- Verify contract deployment

## Future Enhancements

### Planned Features

1. **Multi-Language Support** - i18n integration
2. **Dark Mode** - Theme switching
3. **Hardware Wallet** - Ledger/Trezor support
4. **Social Recovery** - Shamir's secret sharing
5. **Push Notifications** - Transaction alerts
6. **Analytics Dashboard** - Device metrics
7. **Batch Operations** - Multiple transactions
8. **Gas Optimization** - Fee estimation

### Integration Opportunities

- **The Graph** - Indexing and querying
- **IPFS** - Decentralized metadata storage
- **ENS** - Human-readable addresses
- **WalletConnect** - External wallet support
- **Chainlink** - Oracle data feeds

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - See LICENSE file for details.

## Support

- **Documentation**: README.md and SETUP.md
- **Issues**: GitHub Issues
- **Smart Contracts**: [BigWater-Smart-Contracts](https://github.com/BigWater-Protocol/BigWater-Smart-Contracts)

---

Built with ❤️ for the BigWater DePIN ecosystem

