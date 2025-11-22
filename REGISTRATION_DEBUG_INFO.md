# Device Registration Debug Info

## Who Is Performing the Transaction?

### YOUR BROWSER is the transaction signer

The device registration works as follows:

1. **User's Wallet**: The app uses an embedded wallet stored in the browser's IndexedDB
2. **Private Key**: Encrypted with AES-GCM using the user's password
3. **Transaction Signing**: When you click "Register Device", your browser:
   - Prompts for password to decrypt the private key
   - Creates a signer using ethers.js
   - Calls the smart contract with this signer

## Which Contract is Being Called?

The app calls the **DeviceRegistry** smart contract at this address:

```javascript
// From src/config/index.js
deviceRegistry: import.meta.env.VITE_DEVICE_REGISTRY_ADDRESS
```

### Current Configuration (from Dockerfile):

```dockerfile
ENV VITE_DEVICE_REGISTRY_ADDRESS=0x1234567890123456789012345678901234567890
```

⚠️ **THIS IS A PLACEHOLDER ADDRESS!** This is why the transaction is failing.

## The Problem

### Why No Transaction Hash Appears:

1. **Fake Contract Address**: The Dockerfile uses dummy addresses (`0x1234...7890`)
2. **Transaction Fails**: The smart contract call fails because the address doesn't exist
3. **Error Caught**: The error is caught in the `catch` block
4. **Step 3 Never Reached**: The success screen (where txHash is shown) never displays
5. **You See**: Only the error toast "Failed to register device"

## The Full Flow

```javascript
// 1. User clicks "Register Device" button (line 295-305 in RegisterDevice.jsx)
handleRegister() {
  // 2. Prompt for password (line 56)
  const password = prompt('Enter your password...')
  
  // 3. Get wallet from IndexedDB (line 68)
  const wallet = await getStoredWallet(address)
  
  // 4. Decrypt private key with password (line 69)
  const privateKey = await decryptPrivateKey(wallet.encryptedKey, wallet.iv, password)
  
  // 5. Create ethers signer (line 70)
  const signer = getSigner(privateKey)
  
  // 6. Call registerDevice() function (line 86)
  // This calls src/utils/blockchain.js line 146-149
  const receipt = await registerDevice(signer, deviceId, metadata)
  
  // 7. Set state variables (line 106-107)
  setTxHash(receipt.hash)  // ← This should show the hash
  setTokenId(newTokenId)
  
  // 8. Show success screen (line 108)
  setStep(3)  // ← Shows step 3 with transaction hash
}
```

## The Blockchain Call

Looking at `src/utils/blockchain.js` lines 146-149:

```javascript
export const registerDevice = async (signer, deviceId, metadata) => {
  const contract = getDeviceRegistryContract(signer)  // Gets contract instance
  const tx = await contract.registerDevice(deviceId, metadata)  // Calls smart contract
  return await tx.wait()  // Waits for transaction confirmation
}
```

This calls the smart contract method defined in `src/config/contracts.js` line 33:

```javascript
'function registerDevice(string memory deviceId, string memory metadata) returns (uint256)'
```

## What You Need To Do

### 1. Deploy the Smart Contracts

You need to actually deploy the BigWater smart contracts to the XDC network:

```bash
# Clone contracts repo
git clone https://github.com/BigWater-Protocol/BigWater-Smart-Contracts.git
cd BigWater-Smart-Contracts

# Install dependencies
npm install

# Configure deployment
# Edit hardhat.config.js with your wallet private key

# Deploy to XDC testnet
npx hardhat run scripts/deploy.js --network xdc-testnet

# OR deploy to XDC mainnet
npx hardhat run scripts/deploy.js --network xdc
```

### 2. Update Your .env File

After deployment, copy the actual contract addresses:

```bash
# .env file
VITE_DEVICE_REGISTRY_ADDRESS=0xYourActualDeployedAddress
VITE_BIGWATER_NFT_ADDRESS=0xYourActualNFTAddress
VITE_BIGWATER_TOKEN_ADDRESS=0xYourActualTokenAddress
```

### 3. Rebuild the App

Since Vite bakes environment variables at build time:

```bash
# If running with npm
npm run dev

# If running with Docker
docker-compose down
docker-compose up --build
```

## How to Debug Right Now

### Open Browser Console

1. Click "Register Device"
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for the new debug logs I added

You'll see:
```
🚀 Starting device registration...
Device ID: BIGW-2025-001
Metadata: {...}
Signer address: 0xYourAddress
📋 Contract Address: 0x1234567890123456789012345678901234567890
🌐 RPC URL: https://rpc.xinfin.network
```

This will confirm:
- Which address is being used
- Which contract is being called
- Which RPC endpoint is being used

## Expected Behavior After Fix

Once you have real contract addresses:

1. ✅ Transaction will succeed
2. ✅ `receipt.hash` will contain the transaction hash
3. ✅ Step 3 will show the transaction hash
4. ✅ You can click the hash to view on XDC Explorer
5. ✅ NFT will be minted to your address

## Summary

- **Who**: Your browser (with your decrypted private key)
- **What**: Calling the DeviceRegistry smart contract's `registerDevice()` method
- **Why it fails**: Contract addresses are fake placeholders in the Dockerfile
- **Solution**: Deploy real contracts and update `.env` with actual addresses

## Using Your Seed Phrase

- **Create/restore wallet**: On the Login page choose “Import wallet”, paste your 12/24-word phrase, and click *Import* to recreate your wallet in the browser.
- **Security reminder**: Anyone with the phrase can control your wallet—keep it offline, avoid storing in shared/cloud locations, and never share it.
- **Recover elsewhere**: You can enter the same phrase in any wallet app that supports the XDC network (e.g., MetaMask with custom RPC) to regain access to your funds and NFTs.
