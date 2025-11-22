import { ethers } from 'ethers'
import * as api from './api.js'

// Generate a new wallet
export const createWallet = () => {
  const wallet = ethers.Wallet.createRandom()
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
  }
}

// Encrypt private key
export const encryptPrivateKey = async (privateKey, password) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(privateKey)
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('bigwater-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )

  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
    iv: btoa(String.fromCharCode(...iv)),
  }
}

// Decrypt private key
const base64ToUint8Array = (value, label) => {
  if (!value || typeof value !== 'string') {
    throw new Error(`${label} is missing or invalid`)
  }
  try {
    // Remove any characters outside base64 charset to avoid atob crashes
    const cleaned = value.replace(/[^A-Za-z0-9+/=]/g, '')
    const binary = atob(cleaned)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch (e) {
    throw new Error(`${label} is not correctly base64-encoded`)
  }
}

export const decryptPrivateKey = async (encryptedKey, iv, password) => {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  
  if (!password) {
    throw new Error('Password is required to decrypt wallet')
  }

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('bigwater-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )

  const encryptedData = base64ToUint8Array(encryptedKey, 'Encrypted key')
  const ivData = base64ToUint8Array(iv, 'Initialization vector (iv)')

  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivData },
    key,
    encryptedData
  )

  return decoder.decode(decryptedData)
}

// Hash password using SHA-256
export const hashPassword = async (password) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Store encrypted wallet in IndexedDB and sync with server
export const storeWallet = async (address, encryptedKey, iv, passwordHash = null, email = null, username = null) => {
  const walletData = {
    address,
    // For simplified UX, store plaintextKey when provided (encryptedKey otherwise)
    plaintextKey: encryptedKey && encryptedKey.startsWith('0x') ? encryptedKey : undefined,
    encryptedKey: encryptedKey && !encryptedKey.startsWith('0x') ? encryptedKey : undefined,
    iv,
    passwordHash, // Store password hash for verification
    email, // Store email for password recovery
    username, // Store username
    createdAt: Date.now(),
  }

  // Store in IndexedDB first (local cache)
  const db = await openWalletDB()
  await new Promise((resolve, reject) => {
    const tx = db.transaction('wallets', 'readwrite')
    const store = tx.objectStore('wallets')
    
    const request = store.put(walletData)
    
    request.onsuccess = () => {
      // Transaction will complete after all requests succeed
    }
    
    request.onerror = () => {
      reject(request.error || new Error('Failed to store wallet locally'))
    }
    
    tx.oncomplete = () => {
      resolve()
    }
    
    tx.onerror = () => {
      reject(tx.error || new Error('Transaction failed'))
    }
  })

  // Try to sync with server (non-blocking)
  try {
    await api.apiStoreWallet(walletData)
    console.log('Wallet synced to server successfully', {
      hasPlaintextKey: !!walletData.plaintextKey,
      hasEncryptedKey: !!walletData.encryptedKey,
    })
  } catch (error) {
    console.warn('Failed to sync wallet to server, using local storage only:', error.message)
    // Don't throw - local storage succeeded, server sync is optional
  }
}

// Get wallet from IndexedDB, with server fallback
export const getStoredWallet = async (address) => {
  // Try IndexedDB first (faster, local cache)
  const db = await openWalletDB()
  const localWallet = await new Promise((resolve, reject) => {
    const tx = db.transaction('wallets', 'readonly')
    const store = tx.objectStore('wallets')
    
    const request = store.get(address)
    
    request.onsuccess = () => {
      resolve(request.result)
    }
    
    request.onerror = () => {
      reject(request.error || new Error('Failed to retrieve wallet'))
    }
    
    tx.onerror = () => {
      reject(tx.error || new Error('Transaction failed'))
    }
  })

  // If found locally, return it and optionally sync from server in background
  if (localWallet) {
    // Try to sync from server in background (non-blocking)
    api.apiGetWallet(address).then(serverWallet => {
      if (serverWallet) {
        // Merge server data with local data, preserving plaintextKey from local if server doesn't have it
        const mergedWallet = {
          ...serverWallet,
          // Preserve local plaintextKey if server doesn't have it
          plaintextKey: serverWallet.plaintextKey || localWallet.plaintextKey,
        }
        
        // Update local cache with merged data if server data is newer
        if (serverWallet.updatedAt > (localWallet.updatedAt || 0)) {
          const tx = db.transaction('wallets', 'readwrite')
          const store = tx.objectStore('wallets')
          store.put(mergedWallet)
        }
      }
    }).catch(() => {
      // Server unavailable, use local data
    })
    return localWallet
  }

  // Not found locally, try server
  try {
    const serverWallet = await api.apiGetWallet(address)
    if (serverWallet) {
      // If server wallet doesn't have plaintextKey, check if we have it locally (maybe from a previous session)
      // This handles the case where Redis was updated before we added plaintextKey support
      if (!serverWallet.plaintextKey) {
        // Try to get from local one more time (in case it was just created)
        const localCheck = await new Promise((resolve) => {
          const tx = db.transaction('wallets', 'readonly')
          const store = tx.objectStore('wallets')
          const request = store.get(address)
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => resolve(null)
        })
        
        if (localCheck && localCheck.plaintextKey) {
          // Merge local plaintextKey into server wallet and sync back to server
          serverWallet.plaintextKey = localCheck.plaintextKey
          // Sync back to server in background
          api.apiStoreWallet(serverWallet).catch(err => 
            console.warn('Failed to sync plaintextKey to server:', err)
          )
        }
      }
      
      // Store in IndexedDB for future use
      const tx = db.transaction('wallets', 'readwrite')
      const store = tx.objectStore('wallets')
      store.put(serverWallet)
      return serverWallet
    }
  } catch (error) {
    console.warn('Server unavailable, using local storage only:', error.message)
  }

  return null
}

// Store user credentials (username/email -> address mapping) in IndexedDB and sync with server
export const storeUserCredentials = async (username, email, address) => {
  const db = await openWalletDB()
  
  // Store in IndexedDB first (local cache)
  await new Promise((resolve, reject) => {
    const tx = db.transaction('users', 'readwrite')
    const store = tx.objectStore('users')
    
    // Store by username
    if (username) {
      const usernameRequest = store.put({
        identifier: username.toLowerCase().trim(),
        type: 'username',
        address,
        createdAt: Date.now(),
      })
      usernameRequest.onerror = () => reject(usernameRequest.error || new Error('Failed to store username'))
    }
    
    // Store by email
    if (email) {
      const emailRequest = store.put({
        identifier: email.toLowerCase().trim(),
        type: 'email',
        address,
        createdAt: Date.now(),
      })
      emailRequest.onerror = () => reject(emailRequest.error || new Error('Failed to store email'))
    }
    
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error || new Error('Transaction failed'))
  })

  // Try to sync with server (non-blocking)
  try {
    await api.apiStoreUserCredentials(username, email, address)
    console.log('User credentials synced to server successfully')
  } catch (error) {
    console.warn('Failed to sync user credentials to server, using local storage only:', error.message)
    // Don't throw - local storage succeeded, server sync is optional
  }
}

// Get wallet address by username or email, with server fallback
export const getWalletAddressByIdentifier = async (identifier) => {
  const db = await openWalletDB()
  const normalizedIdentifier = identifier.toLowerCase().trim()
  
  // Try IndexedDB first (faster, local cache)
  const localResult = await new Promise((resolve, reject) => {
    const tx = db.transaction('users', 'readonly')
    const store = tx.objectStore('users')
    
    const request = store.get(normalizedIdentifier)
    
    request.onsuccess = () => {
      resolve(request.result ? request.result.address : null)
    }
    
    request.onerror = () => {
      reject(request.error || new Error('Failed to retrieve user'))
    }
    
    tx.onerror = () => {
      reject(tx.error || new Error('Transaction failed'))
    }
  })

  // If found locally, return it
  if (localResult) {
    return localResult
  }

  // Not found locally, try server
  try {
    const serverAddress = await api.apiGetWalletAddressByIdentifier(identifier)
    if (serverAddress) {
      // Store in IndexedDB for future use
      const tx = db.transaction('users', 'readwrite')
      const store = tx.objectStore('users')
      store.put({
        identifier: normalizedIdentifier,
        type: identifier.includes('@') ? 'email' : 'username',
        address: serverAddress,
        createdAt: Date.now(),
      })
      return serverAddress
    }
  } catch (error) {
    console.warn('Server unavailable, using local storage only:', error.message)
  }

  return null
}

// Open wallet IndexedDB
const openWalletDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BigWaterWallet', 2)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      const oldVersion = event.oldVersion
      
      // Create wallets store if it doesn't exist
      if (!db.objectStoreNames.contains('wallets')) {
        db.createObjectStore('wallets', { keyPath: 'address' })
      }
      
      // Add users store for username/email -> address mapping (version 2 upgrade)
      if (oldVersion < 2 && !db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'identifier' })
        userStore.createIndex('address', 'address', { unique: false })
        userStore.createIndex('type', 'type', { unique: false })
      }
    }
  })
}

// Format address for display
export const formatAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Format balance
export const formatBalance = (balance, decimals = 18, displayDecimals = 4) => {
  const formatted = ethers.formatUnits(balance, decimals)
  const num = parseFloat(formatted)
  return num.toFixed(displayDecimals)
}

