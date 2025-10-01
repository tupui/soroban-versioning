import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type Network = 'mainnet' | 'testnet';

interface NetworkContextType {
  network: Network;
  setNetwork: (network: Network) => void;
  isHydrated: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider = ({ children }: NetworkProviderProps) => {
  const [network, setNetworkState] = useState<Network>('testnet');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('network');
      if (saved === 'testnet' || saved === 'mainnet') {
        setNetworkState(saved);
      }
      setIsHydrated(true);
    }
  }, []);

  const setNetwork = (newNetwork: Network) => {
    setNetworkState(newNetwork);
    if (typeof window !== 'undefined') {
      localStorage.setItem('network', newNetwork);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('network', network);
    }
  }, [network]);

  return (
    <NetworkContext.Provider value={{ network, setNetwork, isHydrated }}>
      {children}
    </NetworkContext.Provider>
  );
};