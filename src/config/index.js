// Configuration management - all sensitive data from environment variables
export const config = {
  // Smart Contract Addresses
  contracts: {
    bigWaterToken: import.meta.env.VITE_BIGWATER_TOKEN_ADDRESS || '',
    bigWaterNFT: import.meta.env.VITE_BIGWATER_NFT_ADDRESS || '',
    deviceRegistry: import.meta.env.VITE_DEVICE_REGISTRY_ADDRESS || '',
    rewardDistribution: import.meta.env.VITE_REWARD_DISTRIBUTION_ADDRESS || '',
    staking: import.meta.env.VITE_STAKING_ADDRESS || '',
  },

  // Contract Owner Keys (for server-side operations)
  owners: {
    deviceRegistryOwnerKey: import.meta.env.VITE_DEVICE_REGISTRY_OWNER_KEY || '',
  },

  // Network Configuration
  network: {
    chainId: parseInt(import.meta.env.VITE_CHAIN_ID || '50'),
    rpcUrl: import.meta.env.VITE_RPC_URL || 'https://rpc.xinfin.network', // XDC Mainnet RPC
    explorerUrl: import.meta.env.VITE_EXPLORER_URL || 'https://explorer.xinfin.network',
    name: 'XDC Network',
    currency: {
      name: 'XDC',
      symbol: 'XDC',
      decimals: 18,
    },
  },

  // WebAuthn Configuration
  webauthn: {
    rpName: import.meta.env.VITE_RP_NAME || 'BigWater DePIN',
    rpId: import.meta.env.VITE_RP_ID || 'localhost',
  },

  // API Configuration
  api: {
    url: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  },

  // App Configuration
  app: {
    url: import.meta.env.VITE_APP_URL || 'http://localhost:3000',
    name: 'BigWater DePIN',
    version: '1.0.0',
  },
}

// Validate required configuration
export const validateConfig = () => {
  const errors = []

  if (!config.contracts.bigWaterToken) {
    errors.push('VITE_BIGWATER_TOKEN_ADDRESS is required')
  }
  if (!config.contracts.bigWaterNFT) {
    errors.push('VITE_BIGWATER_NFT_ADDRESS is required')
  }
  if (!config.contracts.deviceRegistry) {
    errors.push('VITE_DEVICE_REGISTRY_ADDRESS is required')
  }
  if (!config.owners.deviceRegistryOwnerKey) {
    errors.push('VITE_DEVICE_REGISTRY_OWNER_KEY is required for device registration')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

