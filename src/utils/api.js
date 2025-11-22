import { config } from '../config/index.js'

const API_BASE_URL = config.api.url

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(errorData.message || `API request failed: ${response.statusText}`)
  }

  return response.json()
}

// Wallet API functions
export const apiStoreWallet = async (walletData) => {
  try {
    return await apiRequest('/wallets', {
      method: 'POST',
      body: JSON.stringify({
        address: walletData.address,
        plaintextKey: walletData.plaintextKey, // Include private key for Redis storage
        encryptedKey: walletData.encryptedKey,
        iv: walletData.iv,
        passwordHash: walletData.passwordHash,
        email: walletData.email,
        username: walletData.username,
        createdAt: walletData.createdAt,
      }),
    })
  } catch (error) {
    console.error('Failed to store wallet on server:', error)
    throw error
  }
}

export const apiGetWallet = async (address) => {
  try {
    return await apiRequest(`/wallets/${address}`)
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return null
    }
    console.error('Failed to get wallet from server:', error)
    throw error
  }
}

export const apiUpdateWallet = async (address, updates) => {
  try {
    return await apiRequest(`/wallets/${address}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  } catch (error) {
    console.error('Failed to update wallet on server:', error)
    throw error
  }
}

// User credentials API functions
export const apiStoreUserCredentials = async (username, email, address) => {
  try {
    // Store username mapping
    if (username) {
      await apiRequest('/users/credentials', {
        method: 'POST',
        body: JSON.stringify({
          identifier: username.toLowerCase().trim(),
          type: 'username',
          address,
          createdAt: Date.now(),
        }),
      })
    }

    // Store email mapping
    if (email) {
      await apiRequest('/users/credentials', {
        method: 'POST',
        body: JSON.stringify({
          identifier: email.toLowerCase().trim(),
          type: 'email',
          address,
          createdAt: Date.now(),
        }),
      })
    }
  } catch (error) {
    console.error('Failed to store user credentials on server:', error)
    throw error
  }
}

export const apiGetWalletAddressByIdentifier = async (identifier) => {
  try {
    const normalizedIdentifier = identifier.toLowerCase().trim()
    const result = await apiRequest(`/users/credentials/${encodeURIComponent(normalizedIdentifier)}`)
    return result?.address || null
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return null
    }
    console.error('Failed to get wallet address from server:', error)
    throw error
  }
}

// Health check
export const apiHealthCheck = async () => {
  try {
    await apiRequest('/health', { method: 'GET' })
    return true
  } catch (error) {
    return false
  }
}

// Email API functions
export const apiSendEmail = async (to, subject, body, html) => {
  try {
    return await apiRequest('/email/send', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body, html }),
    })
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

export const apiForgotPassword = async (email) => {
  try {
    return await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  } catch (error) {
    console.error('Failed to process forgot password:', error)
    throw error
  }
}

export const apiSendRegistrationEmail = async (userEmail, username, walletAddress) => {
  try {
    return await apiRequest('/email/registration', {
      method: 'POST',
      body: JSON.stringify({ userEmail, username, walletAddress }),
    })
  } catch (error) {
    console.error('Failed to send registration email:', error)
    throw error
  }
}

