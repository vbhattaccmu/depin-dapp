// Test script to verify contract interaction
import { ethers } from 'ethers'

const config = {
  contracts: {
    deviceRegistry: '0xb2b5E3a3F0D619c05e3Bbf4ef75Df3Ea53a0C3E7'
  },
  network: {
    rpcUrl: 'https://rpc.xinfin.network'
  },
}

const DeviceRegistryABI = [
  'function registerDevice(string memory deviceId, string memory metadata) returns (uint256)',
  'function getDevice(uint256 tokenId) view returns (address owner, string deviceId, string metadata, uint256 registeredAt)',
  'function getDevicesByOwner(address owner) view returns (uint256[])',
  'function isDeviceRegistered(string memory deviceId) view returns (bool)',
  'function updateDeviceMetadata(uint256 tokenId, string memory metadata)',
  'event DeviceRegistered(uint256 indexed tokenId, address indexed owner, string deviceId)',
  'event DeviceMetadataUpdated(uint256 indexed tokenId, string metadata)',
]

async function testContract() {
  try {
    console.log('🔍 Testing contract interaction...')
    
    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(config.network.rpcUrl)
    const signer = new ethers.Wallet(config.owners.deviceRegistryOwnerKey, provider)
    
    console.log('📍 Signer address:', await signer.getAddress())
    console.log('📍 Contract address:', config.contracts.deviceRegistry)
    
    // Check if contract exists by trying to get code
    const code = await provider.getCode(config.contracts.deviceRegistry)
    console.log('📋 Contract code length:', code.length)
    
    if (code === '0x') {
      console.error('❌ Contract does not exist at this address!')
      return
    }
    
    // Create contract instance
    const contract = new ethers.Contract(config.contracts.deviceRegistry, DeviceRegistryABI, signer)
    
    // Test a view function first
    console.log('🧪 Testing view function...')
    try {
      const devices = await contract.getDevicesByOwner(await signer.getAddress())
      console.log('✅ View function works. Devices:', devices)
    } catch (error) {
      console.error('❌ View function failed:', error.message)
    }
    
    // Test if device ID is already registered
    console.log('🧪 Testing device ID check...')
    try {
      const isRegistered = await contract.isDeviceRegistered('test-device-123')
      console.log('✅ Device ID check works. Is registered:', isRegistered)
    } catch (error) {
      console.error('❌ Device ID check failed:', error.message)
    }
    
    // Test gas estimation for registerDevice
    console.log('🧪 Testing gas estimation...')
    try {
      const gasEstimate = await contract.registerDevice.estimateGas('test-device-123', '{"name":"test"}')
      console.log('✅ Gas estimation works. Gas needed:', gasEstimate.toString())
    } catch (error) {
      console.error('❌ Gas estimation failed:', error.message)
      console.error('Error details:', error)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testContract()
