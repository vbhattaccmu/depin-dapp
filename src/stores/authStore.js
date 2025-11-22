import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({
      isAuthenticated: false,
      username: null,
      address: null,

      login: (username, address) => {
        set({
          isAuthenticated: true,
          username,
          address,
        })
      },

      logout: () => {
        set({
          isAuthenticated: false,
          username: null,
          address: null,
        })
      },

      updateAddress: (address) => {
        set({ address })
      },
    }))

// Persist to localStorage manually
if (typeof window !== 'undefined') {
  useAuthStore.subscribe((state) => {
    localStorage.setItem('auth-storage', JSON.stringify({
      isAuthenticated: state.isAuthenticated,
      username: state.username,
      address: state.address,
    }))
  })

  // Load from localStorage on init
  const stored = localStorage.getItem('auth-storage')
  if (stored) {
    try {
      const data = JSON.parse(stored)
      useAuthStore.setState(data)
    } catch (e) {
      console.error('Failed to load auth state:', e)
    }
  }
}

