import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Key, Wallet } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { createWallet, storeWallet, getStoredWallet, hashPassword, storeUserCredentials, getWalletAddressByIdentifier } from '../utils/wallet'
import { apiSendRegistrationEmail, apiStoreWallet } from '../utils/api'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [webauthnSupported] = useState(false)
  const [privateKeyModal, setPrivateKeyModal] = useState({
    open: false,
    privateKey: '',
    walletAddress: '',
    userEmail: '',
    username: '',
  })

  const handleRegister = async (e) => {
    e.preventDefault()
    
    if (!username.trim()) {
      toast.error('Please enter a username')
      return
    }

    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      // Create wallet
      const wallet = createWallet()
      
      // Hash password for storage
      const passwordHash = await hashPassword(password)
      console.log('Registration - Password hash created:', passwordHash.substring(0, 10) + '...')
      
      // Store wallet with password hash, email, and username
      await storeWallet(wallet.address, wallet.privateKey, '', passwordHash, email.trim(), username.trim())
      
      // Store user credentials mapping (username/email -> address)
      await storeUserCredentials(username.trim(), email.trim(), wallet.address)
      
      // Verify it was stored correctly
      const stored = await getStoredWallet(wallet.address)
      if (!stored || !stored.plaintextKey) {
        throw new Error('Failed to store wallet. Please try again.')
      }

      // Store wallet address in auth store immediately (so it's available for login)
      login(username, wallet.address)
      
      // Surface private key in modal so user can save it before continuing
      setPrivateKeyModal({
        open: true,
        privateKey: wallet.privateKey,
        walletAddress: wallet.address,
        userEmail: email.trim(),
        username: username,
      })
      toast.success('Wallet created successfully! Save your private key securely.', { duration: 5000 })
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Registration failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!username.trim()) {
      toast.error('Please enter a username')
      return
    }

    if (!password) {
      toast.error('Please enter your password')
      return
    }

    setLoading(true)

    try {
      let addr = null
      
      // First, try to get address from localStorage (previous session)
      const stored = localStorage.getItem('auth-storage')
      if (stored) {
        try {
          const data = JSON.parse(stored)
          addr = data.address
        } catch {}
      }
      
      // If not in localStorage, lookup by username/email
      if (!addr) {
        addr = await getWalletAddressByIdentifier(username.trim())
      }
      
      if (!addr) {
        toast.error('No wallet found. Please register a new wallet or import your private key.')
        setLoading(false)
        return
      }
      
      // Verify wallet exists in IndexedDB
      const wallet = await getStoredWallet(addr)
      
      if (!wallet) {
        toast.error('Wallet not found. Please register or import your private key.')
        setLoading(false)
        return
      }
      
      // Verify password if password hash exists
      if (wallet.passwordHash) {
        const inputPasswordHash = await hashPassword(password)
        // Normalize both hashes to ensure comparison works (hashPassword already returns lowercase hex)
        const storedHash = (wallet.passwordHash || '').toLowerCase().trim()
        const inputHash = (inputPasswordHash || '').toLowerCase().trim()
        
        console.log('Login - Password verification:', {
          storedHashLength: storedHash.length,
          inputHashLength: inputHash.length,
          storedHashPrefix: storedHash.substring(0, 10),
          inputHashPrefix: inputHash.substring(0, 10),
          match: storedHash === inputHash,
        })
        
        if (inputHash !== storedHash) {
          console.error('Password mismatch:', {
            storedHash: storedHash.substring(0, 20) + '...',
            inputHash: inputHash.substring(0, 20) + '...',
            storedLength: storedHash.length,
            inputLength: inputHash.length,
          })
          toast.error('Incorrect password')
          setLoading(false)
          return
        }
      } else {
        console.warn('Login - No password hash found in wallet, skipping password verification')
      }
      
      // Check if private key is available (required for transactions)
      if (!wallet.plaintextKey) {
        toast.error('Private key not found. Please import your private key to access your wallet.')
        setLoading(false)
        return
      }
      
      // Ensure plaintextKey is synced to Redis (in case it was missing before)
      // This is a background operation, don't wait for it
      if (wallet.plaintextKey) {
        apiStoreWallet(wallet).catch(err => {
          console.warn('Failed to sync plaintextKey to Redis after login:', err)
        })
      }
      
      toast.success('Login successful!')
      login(username, addr)
      navigate('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Biometrics removed

  const handlePrivateKeySaved = async () => {
    if (!privateKeyModal.walletAddress) {
      setPrivateKeyModal({ open: false, privateKey: '', walletAddress: '', userEmail: '', username: '' })
      return
    }

    try {
      // Send registration email notification
      await sendRegistrationEmail(
        privateKeyModal.userEmail || email, 
        privateKeyModal.username || username, 
        privateKeyModal.walletAddress
      )
      
      // Wallet address is already stored in auth store from registration
      // Just navigate to dashboard
      navigate('/dashboard')
      setPrivateKeyModal({ open: false, privateKey: '', walletAddress: '', userEmail: '', username: '' })
    } catch (error) {
      console.error('Error sending registration email:', error)
      // Still proceed even if email fails
      navigate('/dashboard')
      setPrivateKeyModal({ open: false, privateKey: '', walletAddress: '', userEmail: '', username: '' })
    }
  }

  // Send registration email notification
  const sendRegistrationEmail = async (userEmail, username, walletAddress) => {
    try {
      // Call backend API to send registration email
      await apiSendRegistrationEmail(userEmail, username, walletAddress)
      
      toast.success('Registration email sent to viku453@gmail.com', {
        duration: 3000,
      })
    } catch (error) {
      console.error('Failed to send registration email:', error)
      // Don't throw - allow registration to complete even if email fails
      toast.error('Registration successful, but failed to send notification email', {
        duration: 3000,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="/logo-full.png" 
              alt="BigWater Protocol" 
              className="h-20 w-auto object-contain drop-shadow-lg"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = '/logomark.png'
              }}
            />
            <div className="hidden items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
              <Wallet className="h-10 w-10 text-white" />
            </div>
          </div>
          <p className="text-gray-700 mt-2 font-medium">Decentralized Physical Infrastructure Network</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Mode Toggle */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all shadow-sm ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all shadow-sm ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Register
            </button>
          </div>

          {/* Login/Register Form */}
          <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
              <div className="space-y-4">
                <div>
                  <label className="label">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input"
                    placeholder="Enter your username"
                    disabled={loading}
                    required
                  />
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="label">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                      placeholder="Enter your email"
                      disabled={loading}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used for password recovery
                    </p>
                  </div>
                )}

                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="Enter your password"
                    disabled={loading}
                    required
                    minLength={8}
                  />
                  {mode === 'register' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 8 characters
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Key className="h-4 w-4" />
                      <span>{mode === 'login' ? 'Login' : 'Create Wallet'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          {/* Import from private key */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or import wallet</span>
            </div>
          </div>

          <MnemonicImport mode={mode} />

          {/* Warning removed */}
        </div>

        {/* Info */}
        <p className="text-center text-sm text-gray-600 mt-6">
          {mode === 'register' ? (
            <>Create a wallet or import with your private key.</>
          ) : (
            <>Enter your username and password to login.</>
          )}
        </p>
      </div>
      {privateKeyModal.open && (
        <PrivateKeyModal
          privateKey={privateKeyModal.privateKey}
          walletAddress={privateKeyModal.walletAddress}
          onClose={handlePrivateKeySaved}
          loading={loading}
        />
      )}
    </div>
  )
}

// Generate a random username for imported wallets
const generateUsername = () => {
  const adjectives = ['Swift', 'Bold', 'Bright', 'Cool', 'Fast', 'Smart', 'Quick', 'Sharp', 'Bright', 'Clear', 'Fresh', 'Grand', 'Happy', 'Jolly', 'Kind', 'Lucky', 'Mighty', 'Noble', 'Proud', 'Royal', 'Super', 'Tough', 'Wise', 'Young', 'Zesty']
  const nouns = ['Eagle', 'Lion', 'Tiger', 'Wolf', 'Bear', 'Hawk', 'Falcon', 'Shark', 'Dragon', 'Phoenix', 'Stallion', 'Panther', 'Jaguar', 'Leopard', 'Cheetah', 'Falcon', 'Raven', 'Crow', 'Fox', 'Lynx', 'Puma', 'Cobra', 'Viper', 'Python', 'Serpent']
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 9999) + 1
  
  return `${adjective}${noun}${number}`
}

// Wallet import component using private key
const MnemonicImport = ({ mode }) => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [privateKey, setPrivateKey] = useState('')
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    if (!privateKey.trim()) {
      toast.error('Please enter a private key')
      return
    }

    try {
      setLoading(true)
      
      // Handle private key with or without 0x prefix
      const key = privateKey.trim().startsWith('0x') 
        ? privateKey.trim() 
        : `0x${privateKey.trim()}`
      
      const wallet = new ethers.Wallet(key)

      // Generate a username for the imported wallet
      const generatedUsername = generateUsername()

      // Store wallet with private key in IndexedDB
      await storeWallet(wallet.address, wallet.privateKey, '', null, null, generatedUsername)
      
      // Store user credentials mapping (username -> address)
      await storeUserCredentials(generatedUsername, null, wallet.address)
      
      // Verify it was stored correctly
      const stored = await getStoredWallet(wallet.address)
      if (!stored || !stored.plaintextKey) {
        throw new Error('Failed to store wallet. Please try again.')
      }
      
      login(generatedUsername, wallet.address)
      toast.success(`Wallet imported successfully as ${generatedUsername}!`)
      navigate('/dashboard')
    } catch (e) {
      const errorMsg = e.message || 'Invalid private key'
      toast.error(errorMsg)
      console.error('Import error:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
      <div>
        <label className="label">Private Key</label>
        <textarea
          className="input font-mono text-sm"
          rows="3"
          placeholder="0x..."
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter your private key (with or without 0x prefix)
        </p>
      </div>

      <button 
        className="btn btn-primary w-full flex items-center justify-center space-x-2" 
        disabled={loading || !privateKey.trim()} 
        onClick={handleImport}
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <Key className="h-4 w-4" />
            <span>{mode === 'login' ? 'Import and Login' : 'Import and Register'}</span>
          </>
        )}
      </button>
    </div>
  )
}

export default Login

const PrivateKeyModal = ({ privateKey, walletAddress, onClose, loading }) => {
  const [revealed, setRevealed] = useState(false)
  const [copyAttempted, setCopyAttempted] = useState(false)

  if (!privateKey) return null

  // Security: Prevent context menu, text selection, and copy shortcuts
  useEffect(() => {
    const preventDefaults = (e) => {
      e.preventDefault()
      return false
    }

    const preventCopy = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault()
        toast.error('Copying is disabled for security. Please write it down manually.')
        setCopyAttempted(true)
        return false
      }
    }

    const preventPrintScreen = (e) => {
      if (e.key === 'PrintScreen' || (e.key === 'F13')) {
        e.preventDefault()
        toast.error('Screenshots are disabled for security.')
        return false
      }
    }

    // Add event listeners
    document.addEventListener('contextmenu', preventDefaults)
    document.addEventListener('selectstart', preventDefaults)
    document.addEventListener('copy', preventDefaults)
    document.addEventListener('keydown', preventCopy)
    document.addEventListener('keydown', preventPrintScreen)
    document.addEventListener('keydown', (e) => {
      // Prevent Ctrl+A, Cmd+A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        return false
      }
    })

    return () => {
      document.removeEventListener('contextmenu', preventDefaults)
      document.removeEventListener('selectstart', preventDefaults)
      document.removeEventListener('copy', preventDefaults)
      document.removeEventListener('keydown', preventCopy)
      document.removeEventListener('keydown', preventPrintScreen)
    }
  }, [])

  const handleReveal = () => {
    const confirmed = window.confirm(
      '⚠️ SECURITY WARNING ⚠️\n\n' +
      'Revealing your private key makes it visible on screen.\n\n' +
      'Make sure:\n' +
      '• No one is watching your screen\n' +
      '• You are not screen sharing\n' +
      '• You are in a private location\n' +
      '• You will write it down immediately\n\n' +
      'Do you want to continue?'
    )
    if (confirmed) {
      setRevealed(true)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(privateKey)
      toast.success('Private key copied to clipboard', { duration: 2000 })
      toast('⚠️ Security: Clear your clipboard after pasting!', { 
        icon: '⚠️',
        duration: 5000 
      })
    } catch (error) {
      console.error('Failed to copy private key:', error)
      toast.error('Unable to copy. Please write it down manually.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 space-y-6"
        onContextMenu={(e) => e.preventDefault()}
        style={{ userSelect: 'none' }}
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900">⚠️ Save Your Private Key</h2>
          <p className="text-red-600 font-semibold mt-2">
            This is your ONLY way to recover your wallet. Store it securely offline.
          </p>
          <p className="text-gray-600 mt-2 text-sm">
            <strong>Never share this key with anyone.</strong> Anyone who has it can access your wallet and funds.
          </p>
        </div>

        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800 font-medium mb-2">🔒 Security Reminders:</p>
          <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
            <li>Do not take screenshots</li>
            <li>Do not share your screen</li>
            <li>Write it down on paper and store it safely</li>
            <li>Never enter it on any website except this app</li>
            <li>Consider using a password manager for digital storage</li>
          </ul>
        </div>

        <div>
          <label className="label">Wallet Address</label>
          <div className="bg-gray-100 rounded-lg p-3 font-mono text-sm break-all">
            {walletAddress}
          </div>
        </div>

        <div>
          <label className="label">Private Key</label>
          {!revealed ? (
            <div className="bg-gray-900 rounded-xl p-6 font-mono text-sm border border-gray-700">
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <Key className="h-5 w-5" />
                <span>Click to reveal private key</span>
              </div>
              <button
                type="button"
                className="btn btn-primary w-full mt-4"
                onClick={handleReveal}
              >
                🔓 Reveal Private Key
              </button>
            </div>
          ) : (
            <div className="bg-gray-900 text-gray-100 rounded-xl p-4 font-mono text-xs leading-relaxed break-all border-2 border-red-500">
              <div className="select-text" style={{ userSelect: 'text' }}>
                {privateKey}
              </div>
            </div>
          )}
        </div>

        {revealed && (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="btn btn-outline flex-1"
              onClick={handleCopy}
              disabled={loading}
            >
              📋 Copy Private Key
            </button>
            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={onClose}
              disabled={loading}
            >
              ✓ I&apos;ve Saved It Securely
            </button>
          </div>
        )}

        <p className="text-xs text-red-600 text-center font-semibold">
          ⚠️ If you lose this private key, you will permanently lose access to your wallet and all funds. ⚠️
        </p>
      </div>
    </div>
  )
}

