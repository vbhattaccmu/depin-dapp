import { create } from 'zustand'

export const useActivityStore = create((set, get) => ({
      activities: [],

      addActivity: (activity) => {
        const newActivity = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          ...activity,
        }
        set((state) => ({
          activities: [newActivity, ...state.activities].slice(0, 100), // Keep last 100
        }))
      },

      clearActivities: () => set({ activities: [] }),

      getActivitiesByType: (type) => {
        return get().activities.filter(a => a.type === type)
      },
    }))

// Persist to localStorage manually
if (typeof window !== 'undefined') {
  useActivityStore.subscribe((state) => {
    localStorage.setItem('activity-storage', JSON.stringify({
      activities: state.activities,
    }))
  })

  // Load from localStorage on init
  const stored = localStorage.getItem('activity-storage')
  if (stored) {
    try {
      const data = JSON.parse(stored)
      useActivityStore.setState(data)
    } catch (e) {
      console.error('Failed to load activity state:', e)
    }
  }
}

