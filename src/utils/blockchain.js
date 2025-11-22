import { ethers } from 'ethers'
import { config } from '../config'
import {
  BigWaterTokenABI,
  BigWaterDeviceNFTABI,
  DeviceRegistryABI,
  RewardDistributionABI,
  DePINStakingABI,
} from '../config/contracts'

// Get provider
export const getProvider = () => {
  return new ethers.JsonRpcProvider(config.network.rpcUrl)
}

// Get signer from private key
export const getSigner = (privateKey) => {
  const provider = getProvider()
  return new ethers.Wallet(privateKey, provider)
}

// Get contract instance
export const getContract = (contractAddress, abi, signerOrProvider) => {
  return new ethers.Contract(contractAddress, abi, signerOrProvider)
}

// BigWater Token functions
export const getBigWaterTokenContract = (signerOrProvider) => {
  return getContract(
    config.contracts.bigWaterToken,
    BigWaterTokenABI,
    signerOrProvider
  )
}

export const getTokenBalance = async (address) => {
  try {
    const provider = getProvider()
    const contract = getBigWaterTokenContract(provider)
    console.log('Getting token balance for address:', address)
    console.log('Contract address:', config.contracts.bigWaterToken)
    const balance = await contract.balanceOf(address)
    let decimals = 18
    try {
      decimals = await contract.decimals()
    } catch (decError) {
      console.warn('Failed to fetch token decimals, defaulting to 18:', decError)
    }
    const formattedBalance = ethers.formatUnits(balance, decimals)
    console.log('Token balance:', formattedBalance)
    return formattedBalance
  } catch (error) {
    console.error('Error getting token balance:', error)
    return '0'
  }
}

export const transferToken = async (signer, toAddress, amount) => {
  const contract = getBigWaterTokenContract(signer)
  let decimals = 18
  try {
    decimals = await contract.decimals()
  } catch (decError) {
    console.warn('Failed to fetch token decimals, defaulting to 18 before transfer:', decError)
  }
  const amountWei = ethers.parseUnits(amount.toString(), decimals)
  const tx = await contract.transfer(toAddress, amountWei)
  return await tx.wait()
}

// Transfer XDC (native currency)
export const transferXDC = async (signer, toAddress, amount) => {
  const amountWei = ethers.parseEther(amount.toString())
  const tx = await signer.sendTransaction({
    to: toAddress,
    value: amountWei,
  })
  return await tx.wait()
}

// NFT functions
export const getBigWaterNFTContract = (signerOrProvider) => {
  return getContract(
    config.contracts.bigWaterNFT,
    BigWaterDeviceNFTABI,
    signerOrProvider
  )
}

export const getNFTBalance = async (address) => {
  const provider = getProvider()
  const contract = getBigWaterNFTContract(provider)
  const balance = await contract.balanceOf(address)
  return balance.toString()
}

export const getNFTsByOwner = async (address) => {
  try {
    if (!address) {
      console.warn('getNFTsByOwner called with no address')
      return []
    }

    const provider = getProvider()
    const nftContract = getBigWaterNFTContract(provider)
    const registryContract = getDeviceRegistryContract(provider)

    console.log('Getting NFTs for address:', address)
    console.log('NFT contract address:', config.contracts.bigWaterNFT)
    console.log('Registry contract address:', config.contracts.deviceRegistry)

    // Ensure address is checksummed
    const checksummedAddress = address && address.startsWith('0x') 
      ? ethers.getAddress(address) 
      : address

    const nfts = []
    const seenTokenIds = new Set()

    // Fetch device IDs owned by the address via registry mapping
    let deviceIds = []
    try {
      deviceIds = await registryContract.getDevicesByOwner(checksummedAddress)
      console.log('Found deviceIds from registry:', deviceIds?.length || 0, deviceIds)
    } catch (e) {
      console.warn('getDevicesByOwner failed, continuing with balance fallback:', e?.message || e)
    }

    for (const deviceId of deviceIds) {
      try {
        // Query device registry for NFT ID associated with this device
        const tokenIdRaw = await registryContract.getDeviceNFT(deviceId)
        const hasToken = typeof tokenIdRaw !== 'undefined' && tokenIdRaw !== null && tokenIdRaw !== 0n
        const tokenId = hasToken ? tokenIdRaw.toString() : ''
        
        // If device has an NFT, verify the user actually owns it
        if (hasToken && tokenId) {
          try {
            // Verify actual ownership from NFT contract
            const actualOwner = await nftContract.ownerOf(tokenIdRaw)
            
            // Only include NFT if user still owns it
            if (actualOwner.toLowerCase() !== checksummedAddress.toLowerCase()) {
              console.log(`Device ${deviceId} has NFT #${tokenId} but it's owned by ${actualOwner}, not ${checksummedAddress}. Skipping.`)
              continue // Skip this NFT - it's been transferred
            }
            
            let tokenURI = ''
            let metadata = null

            try {
              const deviceInfo = await registryContract.getDevice(tokenIdRaw)
              tokenURI = deviceInfo?.tokenURI || ''
            } catch (deviceErr) {
              console.warn(`getDevice failed for tokenId ${tokenId}:`, deviceErr)
            }

            if (!tokenURI) {
              try {
                tokenURI = await nftContract.tokenURI(tokenIdRaw)
              } catch (uriErr) {
                console.warn(`tokenURI lookup failed for tokenId ${tokenId}:`, uriErr)
              }
            }

            seenTokenIds.add(tokenId)
            
            nfts.push({
              tokenId,
              tokenURI,
              metadata,
              deviceId,
              owner: checksummedAddress,
            })
          } catch (ownerErr) {
            // If ownerOf fails, the NFT might not exist anymore
            console.warn(`Failed to verify ownership of NFT #${tokenId} for device ${deviceId}:`, ownerErr)
            // Don't add it if we can't verify ownership
            continue
          }
        } else {
          // Device exists but has no NFT associated
          console.log(`Device ${deviceId} has no NFT associated (tokenId: ${tokenIdRaw})`)
        }
      } catch (error) {
        console.error(`Error fetching NFT for deviceId ${deviceId}:`, error)
        // Don't add invalid entries
      }
    }

    // Secondary pass: enumerate tokens directly from NFT contract to catch any that
    // may not yet be linked in registry mappings.
    try {
      const bal = await nftContract.balanceOf(checksummedAddress)
      const count = Number(bal)
      console.log('NFT contract balanceOf:', count)
      
      for (let i = 0; i < count; i++) {
        try {
          const tokenIdRaw = await nftContract.tokenOfOwnerByIndex(checksummedAddress, i)
          const tokenId = tokenIdRaw.toString()
          if (seenTokenIds.has(tokenId)) continue

          let deviceId = ''
          try {
            deviceId = await nftContract.getDeviceId(tokenIdRaw)
          } catch (deviceErr) {
            console.warn(`getDeviceId failed for tokenId ${tokenId}:`, deviceErr)
          }

          let tokenURI = ''
          try {
            tokenURI = await nftContract.tokenURI(tokenIdRaw)
          } catch (uriErr) {
            console.warn(`tokenURI lookup failed for tokenId ${tokenId}:`, uriErr)
          }

          nfts.push({
            tokenId,
            tokenURI,
            metadata: null,
            deviceId,
            owner: checksummedAddress,
          })
          seenTokenIds.add(tokenId)
        } catch (tokenErr) {
          console.warn(`tokenOfOwnerByIndex failed for index ${i}:`, tokenErr)
        }
      }
    } catch (e) {
      console.warn('NFT contract enumeration fallback failed:', e?.message || e)
    }

    // Filter out complete blanks - keep NFTs that have at least a tokenId or deviceId
    const normalized = nfts.filter(
      (item) => {
        const hasTokenId = item.tokenId && String(item.tokenId).trim() !== ''
        const hasDeviceId = item.deviceId && String(item.deviceId).trim() !== ''
        return hasTokenId || hasDeviceId
      }
    )

    console.log('Total NFTs found before filter:', nfts.length)
    console.log('Final NFTs array after filter:', normalized.length, normalized)
    console.log('NFTs details:', normalized.map(n => ({ 
      tokenId: n.tokenId, 
      deviceId: n.deviceId,
      tokenURI: n.tokenURI?.substring(0, 50) + '...'
    })))
    
    return normalized
  } catch (error) {
    console.error('Error getting NFTs by owner:', error)
    return []
  }
}

export const transferNFT = async (signer, fromAddress, toAddress, tokenId) => {
  const contract = getBigWaterNFTContract(signer)
  
  // Validate ownership before attempting transfer
  try {
    const owner = await contract.ownerOf(tokenId)
    const checksummedFrom = ethers.getAddress(fromAddress)
    if (owner.toLowerCase() !== checksummedFrom.toLowerCase()) {
      throw new Error(`You are not the owner of NFT #${tokenId}. Current owner: ${owner}`)
    }
  } catch (error) {
    if (error.message.includes('not the owner')) {
      throw error
    }
    // If ownerOf fails, the NFT might not exist
    throw new Error(`NFT #${tokenId} does not exist or you do not have permission to transfer it`)
  }
  
  // Attempt transfer
  try {
    const tx = await contract.safeTransferFrom(fromAddress, toAddress, tokenId)
    return await tx.wait()
  } catch (error) {
    // Decode common custom errors
    if (error.data) {
      const errorData = error.data
      
      // Common ERC721 errors
      if (errorData === '0x815e1d64' || error.message.includes('not owner')) {
        throw new Error(`You are not the owner of NFT #${tokenId}`)
      }
      if (errorData === '0x90b8ec18' || error.message.includes('not authorized')) {
        throw new Error(`You are not authorized to transfer NFT #${tokenId}`)
      }
      if (errorData === '0x177e802f' || error.message.includes('0x177e802f')) {
        throw new Error(`NFT #${tokenId} transfer is restricted. The NFT may be locked or controlled by the Device Registry.`)
      }
      if (errorData === '0x' || error.message.includes('ERC721')) {
        throw new Error(`NFT #${tokenId} transfer failed. Please verify you own this NFT and it can be transferred.`)
      }
    }
    
    // Re-throw with better message if we can't decode it
    throw new Error(error.reason || error.message || `Failed to transfer NFT #${tokenId}`)
  }
}

// Device Registry functions
export const getDeviceRegistryContract = (signerOrProvider) => {
  return getContract(
    config.contracts.deviceRegistry,
    DeviceRegistryABI,
    signerOrProvider
  )
}

export const registerDevice = async (signer, ownerAddress, deviceId, tokenURI) => {
  const contract = getDeviceRegistryContract(signer)
  // Ensure tokenURI conforms if contract enforces it
  if (!tokenURI || !tokenURI.startsWith('bigw://')) {
    throw new Error("tokenURI must start with 'bigw://'")
  }

  // Try modern signature: registerDevice(address,string,string)
  try {
    const gas = await contract.registerDevice.estimateGas(ownerAddress, deviceId, tokenURI)
    const tx = await contract.registerDevice(ownerAddress, deviceId, tokenURI, { gasLimit: gas })
    return await tx.wait()
  } catch (e) {
    // Fallback: legacy signature registerDevice(string,string)
    try {
      const gasLegacy = await contract.registerDevice.estimateGas(deviceId, tokenURI)
      const txLegacy = await contract.registerDevice(deviceId, tokenURI, { gasLimit: gasLegacy })
      return await txLegacy.wait()
    } catch (inner) {
      // Surface a concise, actionable message
      const hint = 'Check that the registry address matches the ABI and that NFT ownership is transferred to the registry.'
      throw new Error((inner?.reason || inner?.message || 'Registration failed') + ' — ' + hint)
    }
  }
}

export const getDeviceInfo = async (tokenId) => {
  const provider = getProvider()
  const contract = getDeviceRegistryContract(provider)
  return await contract.getDevice(tokenId)
}

export const getUserDevices = async (address) => {
  const provider = getProvider()
  const registry = getDeviceRegistryContract(provider)
  const nft = getBigWaterNFTContract(provider)
  const deviceIds = await registry.getDevicesByOwner(address)

  const devices = []
  for (const deviceId of deviceIds) {
    try {
      const tokenId = await nft.getTokenId(deviceId)
      const deviceInfo = await registry.getDevice(tokenId)
      devices.push({
        tokenId: tokenId.toString(),
        owner: deviceInfo.owner,
        deviceId: deviceInfo.deviceId,
        metadata: deviceInfo.tokenURI, // align with updated registry
        registeredAt: new Date(Number(deviceInfo.registeredAt) * 1000),
      })
    } catch (error) {
      console.error(`Error fetching device for ${deviceId}:`, error)
    }
  }

  return devices
}

// Get count of registered devices for an address
export const getRegisteredDevicesCount = async (address) => {
  try {
    if (!address) {
      return 0
    }

    const provider = getProvider()
    const registry = getDeviceRegistryContract(provider)
    
    // Ensure address is checksummed
    const checksummedAddress = address && address.startsWith('0x') 
      ? ethers.getAddress(address) 
      : address

    // Query device registry for all devices owned by this address
    const deviceIds = await registry.getDevicesByOwner(checksummedAddress)
    const count = deviceIds ? deviceIds.length : 0
    
    console.log(`Found ${count} registered devices for address ${checksummedAddress}`)
    return count
  } catch (error) {
    console.error('Error getting registered devices count:', error)
    return 0
  }
}

// Get registered device IDs with their NFT information
export const getRegisteredDevices = async (address) => {
  try {
    if (!address) {
      return []
    }

    const provider = getProvider()
    const registry = getDeviceRegistryContract(provider)
    const nftContract = getBigWaterNFTContract(provider)
    
    // Ensure address is checksummed
    const checksummedAddress = address && address.startsWith('0x') 
      ? ethers.getAddress(address) 
      : address

    // Query device registry for all devices owned by this address
    const deviceIds = await registry.getDevicesByOwner(checksummedAddress)
    
    const devices = []
    for (const deviceId of deviceIds) {
      try {
        // Get NFT ID for this device
        const tokenIdRaw = await registry.getDeviceNFT(deviceId)
        const hasNFT = tokenIdRaw && tokenIdRaw !== 0n
        
        let tokenId = null
        let tokenURI = null
        let nftOwner = null
        
        if (hasNFT) {
          tokenId = tokenIdRaw.toString()
          try {
            // Get NFT owner
            nftOwner = await nftContract.ownerOf(tokenIdRaw)
            
            // Get device info which contains tokenURI
            try {
              const deviceInfo = await registry.getDevice(tokenIdRaw)
              tokenURI = deviceInfo?.tokenURI || null
            } catch (err) {
              // Try to get tokenURI from NFT contract
              try {
                tokenURI = await nftContract.tokenURI(tokenIdRaw)
              } catch (uriErr) {
                console.warn(`Could not get tokenURI for token ${tokenId}:`, uriErr)
              }
            }
          } catch (err) {
            console.warn(`Could not verify NFT ownership for device ${deviceId}:`, err)
          }
        }
        
        devices.push({
          deviceId,
          tokenId,
          tokenURI,
          hasNFT,
          nftOwner: nftOwner?.toLowerCase() === checksummedAddress.toLowerCase(),
        })
      } catch (error) {
        console.error(`Error processing device ${deviceId}:`, error)
        // Still add device even if NFT lookup fails
        devices.push({
          deviceId,
          tokenId: null,
          tokenURI: null,
          hasNFT: false,
          nftOwner: false,
        })
      }
    }
    
    return devices
  } catch (error) {
    console.error('Error getting registered devices:', error)
    return []
  }
}

// Get XDC balance
export const getXDCBalance = async (address) => {
  const provider = getProvider()
  const balance = await provider.getBalance(address)
  return ethers.formatEther(balance)
}

// Get transaction history (simplified - would need an indexer in production)
export const getTransactionHistory = async (address) => {
  // In production, you'd use an indexer or API like The Graph
  // For now, we'll return a placeholder
  return []
}

// Format transaction for display
export const formatTransaction = (tx) => {
  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: ethers.formatEther(tx.value || 0),
    timestamp: tx.timestamp,
    status: tx.status === 1 ? 'success' : 'failed',
  }
}

