import React from 'react'
import { X, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

const DeviceURIModal = ({ device, onClose }) => {
  if (!device || !device.tokenURI) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(device.tokenURI)
      toast.success('Device URI copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy URI')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Device URI</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Device ID</label>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono text-sm">
              {device.deviceId}
            </div>
          </div>

          {device.tokenId && (
            <div>
              <label className="text-sm font-medium text-gray-700">NFT Token ID</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                #{device.tokenId}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Device URI</label>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg break-all font-mono text-sm">
              {device.tokenURI}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <button
            onClick={handleCopy}
            className="btn btn-primary flex items-center space-x-2 w-full"
          >
            <Copy className="h-4 w-4" />
            <span>Copy URI</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeviceURIModal
