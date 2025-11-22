import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, Coins, Package, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useWalletStore } from '../stores/walletStore'
import { useActivityStore } from '../stores/activityStore'
import {
  getXDCBalance,
  getTokenBalance,
  getNFTsByOwner,
  getRegisteredDevicesCount,
  getRegisteredDevices,
} from '../utils/blockchain'
import BalanceCard from '../components/BalanceCard'
import NFTCard from '../components/NFTCard'
import DeviceCard from '../components/DeviceCard'
import DeviceURIModal from '../components/DeviceURIModal'
import ActivityItem from '../components/ActivityItem'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const navigate = useNavigate()
  const { address } = useAuthStore()
  const { balance, setBalance, setLoading, loading, updateRegisteredDevices } = useWalletStore()
  const { activities } = useActivityStore()
  const [refreshing, setRefreshing] = useState(false)
  const [registeredDevices, setRegisteredDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)

  const loadBalances = async () => {
    if (!address) return

    try {
      setLoading(true)
      
      console.log('Loading balances for address:', address)
      
      // Load balances in parallel
      const [xdcBal, bigwBal, nfts, deviceCount, devices] = await Promise.all([
        getXDCBalance(address),
        getTokenBalance(address),
        getNFTsByOwner(address),
        getRegisteredDevicesCount(address),
        getRegisteredDevices(address),
      ])

      console.log('Loaded balances:', { 
        xdcBal, 
        bigwBal, 
        nftCount: nfts?.length || 0, 
        registeredDevices: deviceCount,
        devices,
        nfts 
      })

      setBalance({
        xdc: xdcBal,
        bigw: bigwBal,
        nfts: nfts || [],
        registeredDevices: deviceCount,
      })
      updateRegisteredDevices(deviceCount)
      setRegisteredDevices(devices || [])
    } catch (error) {
      console.error('Error loading balances:', error)
      toast.error('Failed to load balances: ' + (error.message || 'Unknown error'))
      
      // Still set NFTs as empty array on error to avoid undefined issues
      setBalance({
        ...balance,
        nfts: [],
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBalances()
  }, [address])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadBalances()
    setRefreshing(false)
    toast.success('Balances refreshed')
  }

  const recentActivities = activities.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">View your assets and recent activity</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-outline flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BalanceCard
          title="BIGW Tokens"
          value={loading ? '...' : `${parseFloat(balance.bigw).toFixed(2)} BIGW`}
          subtitle="BigWater Token"
          icon={Coins}
          loading={loading}
        />
        <BalanceCard
          title="Registered Devices"
          value={loading ? '...' : (balance.registeredDevices || 0).toString()}
          subtitle={`${balance.nfts?.length || 0} with NFTs`}
          icon={Package}
          loading={loading}
        />
        <BalanceCard
          title="XDC Balance"
          value={loading ? '...' : `${parseFloat(balance.xdc).toFixed(4)} XDC`}
          subtitle="Native Currency"
          icon={Wallet}
          loading={loading}
        />
      </div>

      {/* Registered Devices Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Registered Devices</h2>
          <button
            className="btn btn-outline"
            onClick={() => navigate('/register-device')}
          >
            Register Device
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : registeredDevices && registeredDevices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {registeredDevices.map((device, idx) => (
              <div key={device.deviceId || `device-${idx}`} className="w-full max-w-xs">
                <DeviceCard 
                  device={device} 
                  onShowURI={(device) => setSelectedDevice(device)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No devices registered yet</p>
            <button className="btn btn-primary mt-4" onClick={() => navigate('/register-device')}>
              Register Your First Device
            </button>
          </div>
        )}
      </div>

      {/* NFTs Section */}
      {balance.nfts && balance.nfts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Device NFTs</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {balance.nfts.map((nft, idx) => {
              // Ensure we have a valid tokenId or deviceId for display
              if (!nft || (!nft.tokenId && !nft.deviceId)) {
                console.warn('Skipping invalid NFT at index', idx, nft)
                return null
              }
              return (
                <div key={(nft.tokenId || nft.deviceId || `nft-${idx}`)} className="w-full max-w-xs">
                  <NFTCard nft={nft} />
                </div>
              )
            }).filter(Boolean)}
          </div>
        </div>
      )}

      {/* Device URI Modal */}
      {selectedDevice && (
        <DeviceURIModal 
          device={selectedDevice} 
          onClose={() => setSelectedDevice(null)} 
        />
      )}

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <a href="/activity" className="text-sm text-primary-600 hover:text-primary-700">
            View All
          </a>
        </div>

        {recentActivities.length > 0 ? (
          <div className="card divide-y divide-gray-200">
            {recentActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-600">No activity yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard

