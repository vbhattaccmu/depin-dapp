import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useActivityStore } from '../stores/activityStore'
import { useWalletStore } from '../stores/walletStore'
import { registerDevice, getNFTsByOwner } from '../utils/blockchain'
import { getSigner } from '../utils/blockchain'
import { getBigWaterNFTContract, getDeviceRegistryContract, getProvider } from '../utils/blockchain'
import { getStoredWallet, decryptPrivateKey } from '../utils/wallet'
import { generateNFTMetadata, metadataToJSON } from '../utils/nftMetadata'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const RegisterDevice = () => {
  const navigate = useNavigate()
  const { address } = useAuthStore()
  const { addActivity } = useActivityStore()
  const { updateNFTs } = useWalletStore()
  
  const [step, setStep] = useState(1) // 1: Device Info, 2: Confirm, 3: Success
  const [formData, setFormData] = useState({
    deviceId: '',
    deviceName: '',
    deviceType: 'air_purifier',
    location: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState(null)
  const [tokenId, setTokenId] = useState(null)
  const [emailError, setEmailError] = useState('')

  const isValidEmail = (value) => {
    const email = (value || '').trim()
    // Simple, robust email regex (no Unicode)
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Immediate email validation
    if (name === 'deviceId') {
      const trimmed = (value || '').trim()
      if (trimmed.length === 0) {
        setEmailError('')
      } else if (!isValidEmail(trimmed)) {
        setEmailError('Please enter a valid email')
      } else {
        setEmailError('')
      }
    }
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (!isValidEmail(formData.deviceId)) {
        toast.error('Please enter a valid email')
        return
      }
      setStep(2)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
    }
  }

  const handleRegister = async () => {
    setLoading(true)

    try {
      // Validate email again before submitting
      if (!isValidEmail(formData.deviceId)) {
        throw new Error('Please enter a valid email')
      }
      // For device registration, we'll use the device registry contract owner's private key
      // This allows the contract owner to register devices on behalf of users
      // In production, this would be handled by a backend service
      
      // Check if we have a device registry owner private key configured
      const { config } = await import('../config')
      
      if (!config.owners.deviceRegistryOwnerKey) {
        throw new Error('Device registry owner key not configured. Please set VITE_DEVICE_REGISTRY_OWNER_KEY in .env')
      }

      // Use the device registry owner's private key to sign the transaction
      const signer = getSigner(config.owners.deviceRegistryOwnerKey)

      // Generate NFT metadata with BigWater logo
      const nftMetadata = generateNFTMetadata({
        deviceId: formData.deviceId,
        deviceName: formData.deviceName,
        deviceType: formData.deviceType,
        location: formData.location,
        description: formData.description,
      })

      // Build on-chain tokenURI expected by registry (must start with bigw://)
      const tokenURI = `bigw://${formData.deviceId}`

      // Register device on blockchain (this mints the NFT)
      console.log('🚀 Starting device registration...')
      console.log('Device ID:', formData.deviceId)
      console.log('TokenURI:', tokenURI)
      console.log('Signer address:', await signer.getAddress())
      
      // Log contract address being called
      console.log('📋 Contract Address:', config.contracts.deviceRegistry)
      console.log('🌐 RPC URL:', config.network.rpcUrl)
      
      if (!config.contracts.deviceRegistry || config.contracts.deviceRegistry === '0x1234567890123456789012345678901234567890') {
        throw new Error('Device Registry contract address not configured! Please set VITE_DEVICE_REGISTRY_ADDRESS in .env')
      }

      // Preflight: ensure NFT ownership is handed to registry, otherwise calls may revert during estimation
      try {
        const provider = getProvider()
        const nft = getBigWaterNFTContract(provider)
        const registry = getDeviceRegistryContract(provider)
        const nftOwner = await nft.owner()
        const registryAddress = await registry.getAddress()
        if (nftOwner.toLowerCase() !== registryAddress.toLowerCase()) {
          throw new Error('NFT contract owner is not the registry. Please call nft.transferOwnership(registry) then registry.acceptNFTContractOwnership()')
        }
      } catch (e) {
        throw new Error(e.message || 'Failed preflight ownership check between NFT and Registry')
      }
      
      toast.loading('Minting Device NFT...')
      const ownerAddress = address
      const receipt = await registerDevice(signer, ownerAddress, formData.deviceId, tokenURI)
      toast.dismiss()

      console.log('✅ Transaction successful!')
      console.log('Transaction Hash:', receipt.hash)
      console.log('Receipt:', receipt)

      // Extract token ID from events
      // DeviceRegistered event signature: DeviceRegistered(uint256 indexed tokenId, address indexed owner, string deviceId)
      const deviceRegisteredEvent = receipt.logs.find(log => {
        // Check if this is a DeviceRegistered event by looking for the event signature
        // The event signature hash is: keccak256("DeviceRegistered(uint256,address,string)")
        return log.topics && log.topics[0] === '0x...' // We'll need to calculate the actual event signature
      })
      
      let newTokenId = '1' // Default fallback
      if (deviceRegisteredEvent && deviceRegisteredEvent.topics && deviceRegisteredEvent.topics[1]) {
        newTokenId = parseInt(deviceRegisteredEvent.topics[1], 16).toString()
      }
      
      console.log('Device registered event:', deviceRegisteredEvent)
      console.log('Token ID:', newTokenId)

      setTxHash(receipt.hash)
      setTokenId(newTokenId)

      // Refresh NFTs in wallet store so counts update immediately
      try {
        const nfts = await getNFTsByOwner(address)
        updateNFTs(nfts)
      } catch (e) {
        console.warn('Failed to refresh NFTs after registration:', e)
      }

      setStep(3)

      // Add to activity
      addActivity({
        type: 'register',
        status: 'success',
        deviceId: formData.deviceId,
        hash: receipt.hash,
        title: `Registered ${formData.deviceName}`,
      })

      toast.success('Device registered successfully!')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Failed to register device: ' + error.message)
      
      // Add failed activity
      addActivity({
        type: 'register',
        status: 'failed',
        deviceId: formData.deviceId,
        title: `Failed to register ${formData.deviceName}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  s < step
                    ? 'bg-success text-white'
                    : s === step
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s < step ? <CheckCircle className="h-6 w-6" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    s < step ? 'bg-success' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-600">Device Info</span>
          <span className="text-xs text-gray-600">Confirm</span>
          <span className="text-xs text-gray-600">Complete</span>
        </div>
      </div>

      {/* Step 1: Device Information */}
      {step === 1 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Device Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">User Email *</label>
              <input
                type="text"
                name="deviceId"
                value={formData.deviceId}
                onChange={handleInputChange}
                className={`input ${emailError ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="e.g., user@example.com"
              />
              {emailError ? (
                <p className="text-xs text-red-600 mt-1">{emailError}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  We'll use your email as the unique identifier
                </p>
              )}
            </div>

            <div>
              <label className="label">Device Name *</label>
              <input
                type="text"
                name="deviceName"
                value={formData.deviceName}
                onChange={handleInputChange}
                className="input"
                placeholder="e.g., My Water Sensor"
              />
            </div>

            <div>
              <label className="label">Device Type</label>
              <select
                name="deviceType"
                value={formData.deviceType}
                onChange={handleInputChange}
                className="input"
              >
                <option value="air_purifier">Air Purifier</option>
              </select>
            </div>

            <div>
              <label className="label">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="input"
                placeholder="e.g., Building A, Floor 2"
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="input"
                rows="3"
                placeholder="Additional information about your device"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button type="button" onClick={handleNextStep} disabled={!!emailError || !(formData.deviceId || '').trim()} className="btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Confirmation */}
      {step === 2 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Registration</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">User Email:</span>
              <span className="font-medium text-gray-900">{formData.deviceId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Device Name:</span>
              <span className="font-medium text-gray-900">{formData.deviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium text-gray-900">
                {formData.deviceType.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            {formData.location && (
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium text-gray-900">{formData.location}</span>
              </div>
            )}
          </div>

          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-primary-800">
                <p className="font-medium mb-1">Device Registration</p>
                <p>
                  Registering this device will mint an NFT on the blockchain. The transaction will be
                  signed by the device registry contract owner on your behalf.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={handleBack} className="btn btn-secondary" disabled={loading}>
              Back
            </button>
            <button
              onClick={handleRegister}
              disabled={loading}
              className="btn btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Package className="h-4 w-4" />
                  <span>Register Device</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="card text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Device Registered!</h2>
          <p className="text-gray-600 mb-6">
            Your device has been successfully registered on the blockchain.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-6 text-left">
            <div className="flex justify-between">
              <span className="text-gray-600">Device NFT #:</span>
              <span className="font-medium text-gray-900">{tokenId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction Hash:</span>
              <a
                href={`${import.meta.env.VITE_EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 font-mono text-sm"
              >
                {txHash?.slice(0, 10)}...{txHash?.slice(-8)}
              </a>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary flex-1"
            >
              View Dashboard
            </button>
            <button
              onClick={() => {
                setStep(1)
                setFormData({
                  deviceId: '',
                  deviceName: '',
                  deviceType: 'air_purifier',
                  location: '',
                  description: '',
                })
                setTxHash(null)
                setTokenId(null)
              }}
              className="btn btn-primary flex-1"
            >
              Register Another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegisterDevice

