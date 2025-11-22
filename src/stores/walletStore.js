import { create } from 'zustand'

export const useWalletStore = create((set, get) => ({
  balance: {
    xdc: '0',
    bigw: '0',
    nfts: [],
    registeredDevices: 0,
  },
  loading: false,
  error: null,

  setBalance: (balance) => set({ balance }),
  
  updateXDCBalance: (xdc) => 
    set((state) => ({ 
      balance: { ...state.balance, xdc } 
    })),
  
  updateBIGWBalance: (bigw) => 
    set((state) => ({ 
      balance: { ...state.balance, bigw } 
    })),
  
  updateNFTs: (nfts) => 
    set((state) => ({ 
      balance: { ...state.balance, nfts } 
    })),
  
  updateRegisteredDevices: (count) => 
    set((state) => ({ 
      balance: { ...state.balance, registeredDevices: count } 
    })),

  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
}))

