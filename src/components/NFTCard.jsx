import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package } from 'lucide-react'
import { parseNFTMetadata, getNFTImageURL } from '../utils/nftMetadata'

const NFTCard = ({ nft, onSelect }) => {
  const navigate = useNavigate()
  const [metadata, setMetadata] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)

  useEffect(() => {
    // Parse metadata if available
    if (nft.metadata) {
      const parsed = parseNFTMetadata(nft.metadata)
      setMetadata(parsed)
      if (parsed?.image) {
        setImageUrl(parsed.image)
      }
    }
  }, [nft])

  return (
    <div 
      className="card cursor-pointer hover:shadow-2xl transition-all transform hover:-translate-y-2 hover:scale-105 border-2 border-transparent hover:border-blue-300"
      onClick={() => {
        if (onSelect) onSelect(nft)
        if (nft?.tokenId) navigate(`/send-receive?nft=${encodeURIComponent(nft.tokenId)}`)
        else navigate('/send-receive?nft=')
      }}
    >
      <div className="aspect-square bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden shadow-inner">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={metadata?.name || `Device #${nft.tokenId}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center">
            <Package className="h-16 w-16 text-primary-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary-600">
              #{nft.tokenId || nft.deviceId || 'NFT'}
            </div>
            <div className="text-sm text-primary-700 mt-2">Device NFT</div>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">
          {metadata?.name || `Device #${nft.tokenId || nft.deviceId || 'Unknown'}`}
        </h3>
        {nft?.tokenURI && (
          <div className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
            {nft.tokenURI}
          </div>
        )}
        {metadata?.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{metadata.description}</p>
        )}
        {metadata?.attributes && (
          <div className="flex flex-wrap gap-2 mt-2">
            {metadata.attributes.slice(0, 2).map((attr, idx) => (
              <span 
                key={idx}
                className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
              >
                {attr.value}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default NFTCard

