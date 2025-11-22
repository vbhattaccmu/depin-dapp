import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Send, ArrowDownLeft, Coins, Package, Wallet } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useWalletStore } from '../stores/walletStore'
import { useActivityStore } from '../stores/activityStore'
import { config } from '../config/index'
import {
  transferToken,
  transferNFT,
  transferXDC,
  getSigner,
  getNFTsByOwner,
  getTokenBalance,
  getBigWaterNFTContract,
  getProvider,
} from '../utils/blockchain'
import { getStoredWallet, decryptPrivateKey, formatAddress } from '../utils/wallet'
import { ethers } from 'ethers'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const SendReceive = () => {
  const { address } = useAuthStore()
  const location = useLocation()
  const { balance, updateNFTs, updateBIGWBalance } = useWalletStore()
  const { addActivity } = useActivityStore()
  
  const [tab, setTab] = useState('send') // 'send' or 'receive'
  const [assetType, setAssetType] = useState('xdc') // 'xdc', 'bigw', or 'nft'
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    tokenId: '',
  })
  const [loading, setLoading] = useState(false)

  const selectableNFTs = balance.nfts.filter(
    (nft) =>
      nft &&
      nft.tokenId !== undefined &&
      nft.tokenId !== null &&
      String(nft.tokenId).trim() !== ''
  )

  // Preselect NFT from URL query (?nft=TOKEN_ID)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const preselect = params.get('nft') || ''
    if (preselect) {
      setTab('send')
      setAssetType('nft')
      setFormData((prev) => ({ ...prev, tokenId: preselect }))
    }
  }, [location.search])

  // Ensure balances & NFTs are loaded when opening this page so dropdown has items
  useEffect(() => {
    const load = async () => {
      if (!address) return
      try {
        const [bigw, nfts] = await Promise.all([
          getTokenBalance(address),
          getNFTsByOwner(address),
        ])
        updateBIGWBalance(bigw)
        updateNFTs(nfts)
      } catch (e) {
        console.warn('Failed to load balances for send page:', e)
      }
    }
    load()
  }, [address, updateBIGWBalance, updateNFTs])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSend = async (e) => {
    e.preventDefault()

    if (!formData.recipient) {
      toast.error('Please enter recipient address')
      return
    }

    if ((assetType === 'xdc' || assetType === 'bigw') && (!formData.amount || parseFloat(formData.amount) <= 0)) {
      toast.error('Please enter a valid amount')
      return
    }

    if (assetType === 'nft' && !formData.tokenId) {
      toast.error('Please select an NFT to send')
      return
    }

    setLoading(true)

    try {
      // Get wallet and resolve private key (prefer plaintext key if present)
      if (!address) {
        throw new Error('No wallet address found. Please login first.')
      }
      
      const wallet = await getStoredWallet(address)
      
      if (!wallet) {
        throw new Error('Wallet not found. Please register or import a wallet first.')
      }
      
      let privateKey = wallet?.plaintextKey || ''
      
      if (!privateKey) {
        // Check if there's encrypted key that needs password (not supported in current flow)
        if (wallet.encryptedKey) {
          throw new Error('Wallet is encrypted. Please login and import your private key to store it in cache.')
        }
        throw new Error('No private key found in cache. Please login and import your private key to store it before sending transactions.')
      }
      
      const signer = getSigner(privateKey)

      let receipt

      if (assetType === 'xdc') {
        // Send XDC (native currency)
        toast.loading('Sending XDC...')
        receipt = await transferXDC(signer, formData.recipient, formData.amount)
        toast.dismiss()

        // Add to activity
        addActivity({
          type: 'send',
          status: 'success',
          to: formData.recipient,
          amount: formData.amount,
          asset: 'XDC',
          hash: receipt.hash,
        })

        const explorerUrl = `${config.network.explorerUrl}/tx/${receipt.hash}`
        toast.success(
          (t) => (
            <div className="flex flex-col space-y-2">
              <span>Sent {formData.amount} XDC successfully!</span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-sm"
                onClick={() => toast.dismiss(t.id)}
              >
                View on Explorer →
              </a>
            </div>
          ),
          { duration: 5000 }
        )
      } else if (assetType === 'bigw') {
        // Send BIGW tokens
        toast.loading('Sending BIGW tokens...')
        receipt = await transferToken(signer, formData.recipient, formData.amount)
        toast.dismiss()

        // Add to activity
        addActivity({
          type: 'send',
          status: 'success',
          to: formData.recipient,
          amount: formData.amount,
          asset: 'BIGW',
          hash: receipt.hash,
        })

        const explorerUrl = `${config.network.explorerUrl}/tx/${receipt.hash}`
        toast.success(
          (t) => (
            <div className="flex flex-col space-y-2">
              <span>Sent {formData.amount} BIGW successfully!</span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-sm"
                onClick={() => toast.dismiss(t.id)}
              >
                View on Explorer →
              </a>
            </div>
          ),
          { duration: 5000 }
        )
      } else {
        // Send NFT
        toast.loading('Transferring NFT...')
        
        // Verify NFT ownership before transfer
        try {
          const provider = getProvider()
          const nftContract = getBigWaterNFTContract(provider)
          const owner = await nftContract.ownerOf(formData.tokenId)
          const checksummedAddress = ethers.getAddress(address)
          
          if (owner.toLowerCase() !== checksummedAddress.toLowerCase()) {
            toast.dismiss()
            throw new Error(`You are not the owner of NFT #${formData.tokenId}. Current owner: ${owner.slice(0, 8)}...${owner.slice(-6)}`)
          }
        } catch (preCheckError) {
          toast.dismiss()
          if (preCheckError.message && preCheckError.message.includes('not the owner')) {
            throw preCheckError
          }
          // If ownerOf fails, the NFT might not exist or there's another issue
          throw new Error(`NFT #${formData.tokenId} does not exist or cannot be found. ${preCheckError.message || ''}`)
        }
        
        receipt = await transferNFT(signer, address, formData.recipient, formData.tokenId)
        toast.dismiss()

        // Wait a moment for the transaction to be indexed
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Refresh NFTs from blockchain to remove the sent NFT
        toast.loading('Verifying transfer...')
        try {
          const updatedNFTs = await getNFTsByOwner(address)
          updateNFTs(updatedNFTs)
          
          // Verify the NFT is no longer in the account
          const nftStillPresent = updatedNFTs.some(
            (nft) => String(nft.tokenId) === String(formData.tokenId)
          )
          
          if (nftStillPresent) {
            toast.dismiss()
            toast.error(`Transfer completed, but NFT #${formData.tokenId} still appears in your account. The transfer may have failed or the NFT is restricted.`, {
              duration: 8000,
            })
          } else {
            toast.dismiss()
            toast.success(`Transferred Device NFT #${formData.tokenId} successfully!`)
            
            // Add to activity
            addActivity({
              type: 'send',
              status: 'success',
              to: formData.recipient,
              amount: `Device #${formData.tokenId}`,
              asset: 'NFT',
              hash: receipt.hash,
            })
          }
        } catch (refreshError) {
          console.warn('Failed to refresh NFTs after transfer:', refreshError)
          toast.dismiss()
          // Still add activity with success, but warn user
          toast.success(`Transaction sent for NFT #${formData.tokenId}`, {
            duration: 4000,
          })
          toast('Please refresh the page to verify the transfer status', {
            icon: 'ℹ️',
            duration: 5000,
          })
          
          // Add to activity with pending status
          addActivity({
            type: 'send',
            status: 'pending',
            to: formData.recipient,
            amount: `Device #${formData.tokenId}`,
            asset: 'NFT',
            hash: receipt?.hash,
          })
        }
      }

      // Reset form
      setFormData({
        recipient: '',
        amount: '',
        tokenId: '',
      })
    } catch (error) {
      console.error('Send error:', error)
      toast.error('Transaction failed: ' + error.message)

        // Add failed activity
        addActivity({
          type: 'send',
          status: 'failed',
          to: formData.recipient,
          amount: assetType === 'nft' ? `Device #${formData.tokenId}` : formData.amount,
          asset: assetType === 'xdc' ? 'XDC' : assetType === 'bigw' ? 'BIGW' : 'NFT',
        })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Send & Receive</h1>
      <p className="text-gray-600 mb-8">Transfer tokens and NFTs to other users</p>

      {/* Tab Selector */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setTab('send')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
            tab === 'send'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Send className="h-5 w-5" />
          <span>Send</span>
        </button>
        <button
          onClick={() => setTab('receive')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
            tab === 'receive'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <ArrowDownLeft className="h-5 w-5" />
          <span>Receive</span>
        </button>
      </div>

      {/* Send Tab */}
      {tab === 'send' && (
        <div className="card">
          {/* Asset Type Selector */}
          <div className="mb-6">
            <label className="label">Asset Type</label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setAssetType('xdc')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  assetType === 'xdc'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Wallet className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                <div className="font-medium text-gray-900">XDC</div>
                <div className="text-sm text-gray-600 mt-1">
                  Balance: {parseFloat(balance.xdc).toFixed(4)} XDC
                </div>
              </button>
              <button
                onClick={() => setAssetType('bigw')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  assetType === 'bigw'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Coins className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                <div className="font-medium text-gray-900">BIGW Token</div>
                <div className="text-sm text-gray-600 mt-1">
                  Balance: {parseFloat(balance.bigw).toFixed(2)} BIGW
                </div>
              </button>
              <button
                onClick={() => setAssetType('nft')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  assetType === 'nft'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Package className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                <div className="font-medium text-gray-900">Device NFT</div>
                <div className="text-sm text-gray-600 mt-1">
                  Balance: {balance.nfts.length} NFTs
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="label">Recipient Address</label>
              <input
                type="text"
                name="recipient"
                value={formData.recipient}
                onChange={handleInputChange}
                className="input"
                placeholder="0x..."
                disabled={loading}
              />
            </div>

            {(assetType === 'xdc' || assetType === 'bigw') ? (
              <div>
                <label className="label">Amount ({assetType === 'xdc' ? 'XDC' : 'BIGW'})</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="0.00"
                  step={assetType === 'xdc' ? "0.0001" : "0.01"}
                  min="0"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Available: {assetType === 'xdc' 
                    ? parseFloat(balance.xdc).toFixed(4) + ' XDC'
                    : parseFloat(balance.bigw).toFixed(2) + ' BIGW'}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ 
                        ...prev, 
                        amount: assetType === 'xdc' ? balance.xdc : balance.bigw 
                      }))
                    }
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Max
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="label">Select NFT</label>
                {selectableNFTs.length > 0 ? (
                  <select
                    name="tokenId"
                    value={formData.tokenId}
                    onChange={handleInputChange}
                    className="input"
                    disabled={loading}
                  >
                    <option value="">Select a device NFT...</option>
                    {selectableNFTs.map((nft) => (
                      <option key={String(nft.tokenId)} value={String(nft.tokenId)}>
                        Device #{nft.tokenId}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
                    You don't have any NFTs to send. Register a device first.
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (assetType === 'nft' && selectableNFTs.length === 0)}
              className="btn btn-primary w-full flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send {assetType === 'xdc' ? 'XDC' : assetType === 'bigw' ? 'BIGW' : 'NFT'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Receive Tab */}
      {tab === 'receive' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Wallet Address</h2>
          <p className="text-gray-600 mb-6">
            Share this address to receive BIGW tokens or Device NFTs
          </p>

          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="text-2xl font-mono font-semibold text-gray-900 break-all mb-4">
              {address}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(address)
                toast.success('Address copied to clipboard!')
              }}
              className="btn btn-primary"
            >
              Copy Address
            </button>
          </div>

          <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <h3 className="font-medium text-primary-900 mb-2">Important:</h3>
            <ul className="text-sm text-primary-800 space-y-1">
              <li>• Only send XDC Network (XDC) assets to this address</li>
              <li>• Double-check the address before sending any assets</li>
              <li>• Sending unsupported assets may result in permanent loss</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default SendReceive

