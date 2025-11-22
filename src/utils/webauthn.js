import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
import { config } from '../config'

// Generate a random challenge
const generateChallenge = () => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

// Register a new WebAuthn credential
export const registerWebAuthn = async (username) => {
  try {
    // Generate registration options
    const challenge = generateChallenge()
    
    const registrationOptions = {
      challenge,
      rp: {
        name: config.webauthn.rpName,
        id: config.webauthn.rpId,
      },
      user: {
        id: btoa(username),
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },  // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      timeout: 60000,
      attestation: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: false,
        userVerification: 'required',
      },
    }

    // Start registration
    const credential = await startRegistration(registrationOptions)

    return {
      success: true,
      credential,
      challenge,
    }
  } catch (error) {
    console.error('WebAuthn registration error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Authenticate with existing WebAuthn credential
export const authenticateWebAuthn = async (username) => {
  try {
    // Get stored credential from IndexedDB
    const credentials = await getStoredCredentials(username)
    
    if (!credentials || credentials.length === 0) {
      throw new Error('No credentials found for this user')
    }

    const challenge = generateChallenge()
    
    const authenticationOptions = {
      challenge,
      timeout: 60000,
      userVerification: 'required',
      rpId: config.webauthn.rpId,
      allowCredentials: credentials.map(cred => ({
        id: cred.id,
        type: 'public-key',
        transports: cred.transports || ['internal'],
      })),
    }

    // Start authentication
    const credential = await startAuthentication(authenticationOptions)

    return {
      success: true,
      credential,
      challenge,
    }
  } catch (error) {
    console.error('WebAuthn authentication error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Store credential in IndexedDB
export const storeCredential = async (username, credential) => {
  try {
    const db = await openDB()
    const tx = db.transaction('credentials', 'readwrite')
    const store = tx.objectStore('credentials')
    
    await store.put({
      username,
      credentialId: credential.id,
      publicKey: credential.response.publicKey,
      transports: credential.response.transports || ['internal'],
      createdAt: Date.now(),
    })

    await tx.complete
    return true
  } catch (error) {
    console.error('Error storing credential:', error)
    return false
  }
}

// Get stored credentials from IndexedDB
export const getStoredCredentials = async (username) => {
  try {
    const db = await openDB()
    const tx = db.transaction('credentials', 'readonly')
    const store = tx.objectStore('credentials')
    const index = store.index('username')
    
    const credentials = await index.getAll(username)
    return credentials
  } catch (error) {
    console.error('Error getting credentials:', error)
    return []
  }
}

// Open IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BigWaterAuth', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      if (!db.objectStoreNames.contains('credentials')) {
        const store = db.createObjectStore('credentials', { keyPath: 'credentialId' })
        store.createIndex('username', 'username', { unique: false })
      }
    }
  })
}

// Check if WebAuthn is supported
export const isWebAuthnSupported = () => {
  return window.PublicKeyCredential !== undefined && 
         navigator.credentials !== undefined
}

