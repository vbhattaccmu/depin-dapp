import React from 'react'
import { Package, ExternalLink } from 'lucide-react'

const DeviceCard = ({ device, onShowURI }) => {
  return (
    <div 
      className="card cursor-pointer hover:shadow-2xl transition-all transform hover:-translate-y-2 hover:scale-105 border-2 border-transparent hover:border-blue-300 h-full flex flex-col"
      onClick={() => {
        if (device.hasNFT && device.tokenURI && onShowURI) {
          onShowURI(device)
        }
      }}
    >
      <div className="aspect-square bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden shadow-inner relative">
        <img 
          src="/device.png" 
          alt={`Device ${device.deviceId}`}
          className="w-full h-full object-contain p-4"
          onError={(e) => {
            // Fallback if device.png doesn't exist
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextElementSibling.style.display = 'flex'
          }}
        />
        <div className="hidden absolute inset-0 items-center justify-center text-center">
          <Package className="h-16 w-16 text-primary-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-primary-600">
            {device.deviceId}
          </div>
        </div>
        
        {/* NFT Badge */}
        {device.hasNFT && device.nftOwner && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            NFT
          </div>
        )}
        {device.hasNFT && !device.nftOwner && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Transferred
          </div>
        )}
      </div>
      
      <div className="space-y-2 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900">
          {device.deviceId}
        </h3>
        
        <div className="flex-1 flex flex-col justify-end">
          {device.hasNFT ? (
            <div className="space-y-1">
              <div className="text-xs text-gray-600">
                NFT Token ID: <span className="font-mono font-semibold">#{device.tokenId}</span>
              </div>
              {device.tokenURI && (
                <div className="flex items-center space-x-1 text-xs text-primary-600">
                  <ExternalLink className="h-3 w-3" />
                  <span>Click to view URI</span>
                </div>
              )}
              {!device.nftOwner && (
                <div className="text-xs text-yellow-600">
                  NFT has been transferred
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              No NFT associated
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DeviceCard
