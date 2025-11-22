# NFT Display from Device Registry Contract

## Overview

When you call the **DeviceRegistry contract**, the NFTs will automatically show up in the dashboard with your BigWater logo and appealing design.

## How It Works

### 1. Device Registration Flow

```
User Registers Device
       ↓
NFT Metadata Generated (with appealing SVG + logo)
       ↓
registerDevice() called on DeviceRegistry contract
       ↓
NFT minted to user's address
       ↓
Metadata stored on-chain
       ↓
NFT appears in Dashboard
```

### 2. NFT Retrieval Process

The app fetches NFTs using this process:

```javascript
// In src/utils/blockchain.js
export const getNFTsByOwner = async (address) => {
  // 1. Get NFT count from NFT contract
  const balance = await nftContract.balanceOf(address)
  
  // 2. For each NFT, get:
  for (let i = 0; i < balance; i++) {
    const tokenId = await nftContract.tokenOfOwnerByIndex(address, i)
    
    // 3. Get device info from DeviceRegistry (includes metadata!)
    const deviceInfo = await registryContract.getDevice(tokenId)
    
    // 4. Return complete NFT data
    nfts.push({
      tokenId,
      metadata: deviceInfo.metadata, // ← Contains your logo & design
      deviceId: deviceInfo.deviceId,
      owner: deviceInfo.owner
    })
  }
  
  return nfts
}
```

### 3. NFT Display in Dashboard

```javascript
// In src/pages/Dashboard.jsx
const loadBalances = async () => {
  // Calls getNFTsByOwner()
  const nfts = await getNFTsByOwner(address)
  
  // NFTs displayed with NFTCard component
  // Each NFT shows:
  // - Your BigWater logo
  // - Device ID
  // - Device name
  // - Color-coded by type
  // - Appealing gradient background
}
```

## Visual Design

### Appealing NFT Design Features

✨ **Gradient Background** - Multi-layered gradients with wave patterns
✨ **Animated Effects** - Subtle glow and shadow effects
✨ **Color-Coded** - Each device type has unique color scheme:
  - 🔵 Water Sensor: Blue gradient
  - 🟢 Water Meter: Green gradient
  - 🟣 Quality Monitor: Purple gradient
  - 🟠 Flow Meter: Orange gradient

✨ **BigWater Logo** - Your actual logo integrated into design
✨ **Professional Layout** - Badge with device ID, circuit pattern
✨ **Corner Decorations** - Subtle decorative elements

### Background Design

The login page now features:
- ✨ Animated gradient background (blue to cyan)
- ✨ Floating blur circles with pulse animation
- ✨ Glass-morphism card effect (frosted glass)
- ✨ Your BigWater logo prominently displayed
- ✨ Gradient text effects

## Smart Contract Integration

### Required Contract Functions

Your DeviceRegistry contract must implement:

```solidity
function getDevice(uint256 tokenId) 
  external view returns (
    address owner,
    string memory deviceId,
    string memory metadata,  // ← Contains full NFT JSON
    uint256 registeredAt
  )
```

### Metadata Structure Stored

```json
{
  "name": "My Water Sensor",
  "description": "BigWater DePIN Device",
  "image": "data:image/svg+xml;base64,<your_appealing_svg>",
  "attributes": [
    { "trait_type": "Device ID", "value": "BIGW-2025-001" },
    { "trait_type": "Device Type", "value": "Water Sensor" },
    { "trait_type": "Network", "value": "XDC" }
  ]
}
```

## RPC Configuration

The app is configured to use **https://rpc.xinfin.network** as specified.

```javascript
// In src/config/index.js
network: {
  chainId: 50,
  rpcUrl: 'https://rpc.xinfin.network', // ← XDC Mainnet
  explorerUrl: 'https://explorer.xinfin.network',
}
```

## Testing NFT Display

### Steps to Verify

1. **Deploy Smart Contracts** to XDC Network
   ```bash
   cd BigWater-Smart-Contracts
   npx hardhat run scripts/deploy.js --network xdc
   ```

2. **Update .env** with contract addresses
   ```bash
   VITE_BIGWATER_TOKEN_ADDRESS=0x...
   VITE_BIGWATER_NFT_ADDRESS=0x...
   VITE_DEVICE_REGISTRY_ADDRESS=0x...
   ```

3. **Register a Device**
   - Login to app
   - Navigate to "Register Device"
   - Fill in device details
   - Sign transaction
   - Wait for confirmation

4. **View NFT in Dashboard**
   - NFT appears automatically
   - Shows your BigWater logo
   - Displays appealing gradient design
   - Click to see full details

### What You'll See

**Dashboard:**
```
┌─────────────────────┐
│  🌊 BigWater Logo   │
│                     │
│    BIGW-2025-001    │
│                     │
│   Water Sensor      │
└─────────────────────┘
  My Water Sensor
  📍 Building A
```

**NFT Features:**
- ✅ High-resolution (800x800) SVG
- ✅ Appealing gradient backgrounds
- ✅ Professional design with your logo
- ✅ Hover effects and animations
- ✅ Responsive on all devices

## Troubleshooting

### NFT Not Showing Up?

**Check 1: Contract Addresses**
```bash
# Verify addresses in .env
cat .env | grep ADDRESS
```

**Check 2: RPC Connection**
```javascript
// In browser console
console.log(await ethereum.request({ method: 'eth_chainId' }))
// Should return '0x32' (50 in decimal for XDC)
```

**Check 3: Device Registry Call**
```javascript
// In browser console (after login)
const provider = new ethers.JsonRpcProvider('https://rpc.xinfin.network')
const registry = new ethers.Contract(REGISTRY_ADDRESS, ABI, provider)
const device = await registry.getDevice(1) // Token ID 1
console.log(device)
```

**Check 4: Metadata Format**
```javascript
// Metadata should be valid JSON string
const metadata = JSON.parse(device.metadata)
console.log(metadata.image) // Should start with "data:image/svg+xml;base64,"
```

### NFT Logo Not Displaying?

1. Check if `/public/logomark.png` exists
2. Verify image URL in browser: `http://localhost:3000/logomark.png`
3. Check browser console for 404 errors
4. Ensure logo file is copied to public folder

## Production Checklist

Before deploying to production:

- [ ] Deploy contracts to XDC Mainnet
- [ ] Update `.env` with mainnet addresses
- [ ] Verify RPC endpoint: `https://rpc.xinfin.network`
- [ ] Test device registration end-to-end
- [ ] Verify NFTs display correctly
- [ ] Check responsive design on mobile
- [ ] Test logo fallback mechanism
- [ ] Verify metadata parsing
- [ ] Test on multiple browsers
- [ ] Check performance with many NFTs

## Support

For issues:
1. Check browser console for errors
2. Verify contract addresses
3. Test RPC connection
4. Review metadata format
5. Check network (should be chain ID 50)

---

**Summary:** When you register a device, the DeviceRegistry contract mints an NFT with beautiful, appealing metadata (including your logo). The dashboard automatically fetches and displays these NFTs using the `getNFTsByOwner()` function, which retrieves metadata from the DeviceRegistry contract.

🌊 Built for BigWater DePIN

