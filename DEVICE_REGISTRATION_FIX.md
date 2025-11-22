# Device Registration Configuration

## Environment Variables Required

To fix the "Encrypted key is missing or invalid" error and enable device registration without password prompts, you need to set up the following environment variables:

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Network Configuration
VITE_CHAIN_ID=50
VITE_RPC_URL=https://rpc.xinfin.network
VITE_EXPLORER_URL=https://explorer.xinfin.network

# Smart Contract Addresses
VITE_BIGWATER_TOKEN_ADDRESS=0xC9B1B2842c60303a06F60FDd005654575d6aE466
VITE_BIGWATER_NFT_ADDRESS=0x74C0Eff3ba0971B9dc7842575DC881d435975dB4
VITE_DEVICE_REGISTRY_ADDRESS=0xb77B308D2235773C9FabC2a6193bE8dE85178D7f
VITE_REWARD_DISTRIBUTION_ADDRESS=0xD07C9456361DfAE1A64a7460c5f08900A7440cB7
VITE_STAKING_ADDRESS=0x0f01172dA622595293Efe0231992E48D39d9E140

# Contract Owner Keys (for server-side operations)
# IMPORTANT: This should be the private key of the device registry contract owner
# This allows the contract owner to register devices on behalf of users
VITE_DEVICE_REGISTRY_OWNER_KEY=0x3ce8dc8235e975b2d83e8816dc22609a3931780d4a9d4ec6e7ca9a2936e9cdfe

# WebAuthn Configuration
VITE_RP_NAME=BigWater DePIN
VITE_RP_ID=localhost

# API Configuration
VITE_API_URL=http://localhost:4000/api

# App Configuration
VITE_APP_URL=http://localhost:3000
```

## Key Changes Made

### 1. Removed Password Requirement
- The device registration no longer prompts for a password
- Transactions are signed by the device registry contract owner
- Users don't need to decrypt their private keys

### 2. Added Device Registry Owner Key
- Added `VITE_DEVICE_REGISTRY_OWNER_KEY` environment variable
- This private key is used to sign device registration transactions
- The contract owner can register devices on behalf of users

### 3. Updated UI Messages
- Changed confirmation message to reflect that no password is needed
- Updated error messages to be more specific about configuration issues

## How It Works Now

1. User fills out device registration form
2. System uses the device registry contract owner's private key to sign the transaction
3. Device is registered and NFT is minted without requiring user's password
4. Transaction is sent by the contract owner on behalf of the user

## Security Considerations

- The device registry owner key should be kept secure
- In production, this should be handled by a backend service
- Consider implementing proper access controls for device registration
- The private key should not be exposed in client-side code in production

## Troubleshooting

If you still get errors:

1. Make sure all environment variables are set correctly
2. Verify the device registry contract address is deployed and correct
3. Ensure the device registry owner key has sufficient permissions
4. Check that the RPC URL is accessible and correct
5. Verify the contract owner has enough XDC for gas fees
