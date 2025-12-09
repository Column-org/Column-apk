import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DEFAULT_NETWORK, MovementNetwork, MovementNetworkConfig, NETWORK_CONFIGS, isMovementNetwork } from '../constants/networkConfig'

type NetworkContextValue = {
  network: MovementNetwork
  config: MovementNetworkConfig
  setNetwork: (network: MovementNetwork) => void
  isLoading: boolean
}

const STORAGE_KEY = 'movement-network-selection'

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined)

export const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
  const [network, setNetworkState] = useState<MovementNetwork>(DEFAULT_NETWORK)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStoredNetwork = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY)
        if (isMovementNetwork(stored)) {
          setNetworkState(stored)
        }
      } catch (error) {
        console.error('Failed to load stored network selection', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStoredNetwork()
  }, [])

  const setNetwork = useCallback((value: MovementNetwork) => {
    setNetworkState(value)
    AsyncStorage.setItem(STORAGE_KEY, value).catch((error) => {
      console.error('Failed to persist network selection', error)
    })
  }, [])

  const contextValue = useMemo<NetworkContextValue>(
    () => ({
      network,
      config: NETWORK_CONFIGS[network],
      setNetwork,
      isLoading,
    }),
    [network, setNetwork, isLoading]
  )

  return <NetworkContext.Provider value={contextValue}>{children}</NetworkContext.Provider>
}

export const useNetwork = () => {
  const context = useContext(NetworkContext)
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider')
  }
  return context
}

