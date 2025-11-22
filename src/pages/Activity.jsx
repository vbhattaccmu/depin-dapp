import React, { useState } from 'react'
import { Filter, Download } from 'lucide-react'
import { useActivityStore } from '../stores/activityStore'
import ActivityItem from '../components/ActivityItem'

const Activity = () => {
  const { activities } = useActivityStore()
  const [filter, setFilter] = useState('all') // 'all', 'send', 'receive', 'register'

  const filteredActivities =
    filter === 'all'
      ? activities
      : activities.filter((activity) => activity.type === filter)

  const handleExport = () => {
    const csv = [
      ['Type', 'Status', 'Amount', 'Asset', 'Address', 'Hash', 'Timestamp'],
      ...filteredActivities.map((activity) => [
        activity.type,
        activity.status,
        activity.amount || '',
        activity.asset || '',
        activity.to || activity.from || '',
        activity.hash || '',
        new Date(activity.timestamp).toISOString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bigwater-activity-${Date.now()}.csv`
    a.click()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity</h1>
          <p className="text-gray-600 mt-1">View your transaction history</p>
        </div>
        <button
          onClick={handleExport}
          disabled={activities.length === 0}
          className="btn btn-outline flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <Filter className="h-5 w-5 text-gray-500 flex-shrink-0" />
          {[
            { value: 'all', label: 'All' },
            { value: 'send', label: 'Sent' },
            { value: 'receive', label: 'Received' },
            { value: 'register', label: 'Registered' },
          ].map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === filterOption.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      {filteredActivities.length > 0 ? (
        <div className="card divide-y divide-gray-200">
          {filteredActivities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-600">
            {filter === 'all'
              ? 'No activity yet. Start by registering a device or sending assets.'
              : `No ${filter} activity found.`}
          </p>
        </div>
      )}

      {/* Stats */}
      {activities.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="text-sm text-gray-600">Total Transactions</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {activities.length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Sent</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {activities.filter((a) => a.type === 'send').length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Received</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {activities.filter((a) => a.type === 'receive').length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Devices Registered</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {activities.filter((a) => a.type === 'register').length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Activity

