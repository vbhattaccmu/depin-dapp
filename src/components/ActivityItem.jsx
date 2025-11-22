import React from 'react'
import { ArrowUpRight, ArrowDownLeft, Package, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDistance } from 'date-fns'
import { formatAddress } from '../utils/wallet'

const ActivityItem = ({ activity }) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'send':
        return <ArrowUpRight className="h-5 w-5 text-orange-500" />
      case 'receive':
        return <ArrowDownLeft className="h-5 w-5 text-success" />
      case 'register':
        return <Package className="h-5 w-5 text-primary-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusIcon = () => {
    switch (activity.status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-error" />
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />
      default:
        return null
    }
  }

  const getTitle = () => {
    switch (activity.type) {
      case 'send':
        return `Sent ${activity.amount} ${activity.asset} to ${formatAddress(activity.to)}`
      case 'receive':
        return `Received ${activity.amount} ${activity.asset} from ${formatAddress(activity.from)}`
      case 'register':
        return `Registered Device #${activity.deviceId}`
      default:
        return activity.title || 'Transaction'
    }
  }

  return (
    <div className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{getTitle()}</p>
        <p className="text-xs text-gray-500 mt-1">
          {formatDistance(new Date(activity.timestamp), new Date(), { addSuffix: true })}
        </p>
        {activity.hash && (
          <a
            href={`${import.meta.env.VITE_EXPLORER_URL}/tx/${activity.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-600 hover:text-primary-700 mt-1 inline-block"
          >
            View on Explorer
          </a>
        )}
      </div>

      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>
    </div>
  )
}

export default ActivityItem

