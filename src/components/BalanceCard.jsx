import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

const BalanceCard = ({ title, value, subtitle, icon: Icon, trend, loading }) => {
  // Different gradient colors for different cards
  const getGradient = () => {
    if (title.includes('XDC')) return 'from-blue-500 to-cyan-500'
    if (title.includes('BIGW')) return 'from-emerald-500 to-teal-500'
    if (title.includes('NFT')) return 'from-purple-500 to-pink-500'
    return 'from-blue-500 to-cyan-500'
  }

  const getIconBg = () => {
    if (title.includes('XDC')) return 'bg-gradient-to-br from-blue-100 to-cyan-100'
    if (title.includes('BIGW')) return 'bg-gradient-to-br from-emerald-100 to-teal-100'
    if (title.includes('NFT')) return 'bg-gradient-to-br from-purple-100 to-pink-100'
    return 'bg-gradient-to-br from-blue-100 to-cyan-100'
  }

  return (
    <div className={`card hover:shadow-2xl transition-all transform hover:-translate-y-1 bg-gradient-to-br ${getGradient()} p-[2px]`}>
      <div className="bg-white rounded-2xl p-6 h-full">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700">{title}</p>
            {loading ? (
              <div className="mt-2 h-8 w-32 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg" />
            ) : (
              <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">{value}</p>
            )}
            {subtitle && (
              <p className="mt-2 text-sm text-gray-600 font-medium">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={`p-3 ${getIconBg()} rounded-xl shadow-md`}>
              <Icon className={`h-7 w-7 bg-gradient-to-br ${getGradient()} bg-clip-text text-transparent`} style={{WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text'}} />
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            {trend.direction === 'up' ? (
              <TrendingUp className="h-4 w-4 text-success mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-error mr-1" />
            )}
            <span className={trend.direction === 'up' ? 'text-success' : 'text-error'}>
              {trend.value}%
            </span>
            <span className="text-gray-500 ml-2">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default BalanceCard

