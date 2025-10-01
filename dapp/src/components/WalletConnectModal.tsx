import { useState, useEffect } from 'react';
import { useNetwork } from '../contexts/NetworkContext';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (network: 'mainnet' | 'testnet', walletId: string) => Promise<void>;
}

interface SupportedWallet {
  id: string;
  name: string;
  type: string;
  isAvailable: boolean;
  isPlatformWrapper: boolean;
  icon: string;
  url: string;
}

export default function WalletConnectModal({ isOpen, onClose, onConnect }: WalletConnectModalProps) {
  const { network, setNetwork } = useNetwork();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [supportedWallets, setSupportedWallets] = useState<SupportedWallet[]>([]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && supportedWallets.length === 0) {
      const fetchWallets = async () => {
        try {
          const { kit } = await import('./stellar-wallets-kit');
          const wallets = await kit.getSupportedWallets();
          const hiddenWallets = ['klever', 'rabet', 'hana', 'albedo'];
          const filteredWallets = wallets.filter(wallet => !hiddenWallets.includes(wallet.id.toLowerCase()));
          setSupportedWallets(filteredWallets);
        } catch (error) {
          
        }
      };
      fetchWallets();
    }
  }, [isOpen, supportedWallets.length]);

  const handleConnect = async (walletId: string) => {
    setIsConnecting(true);
    try {
      await onConnect(network, walletId);
      onClose();
    } catch (error) {
      setIsConnecting(false);
    }
  };

  const renderWalletButton = (wallet: SupportedWallet) => (
    <button
      key={wallet.id}
      onClick={() => handleConnect(wallet.id)}
      disabled={isConnecting || !wallet.isAvailable}
      className={`w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition-colors bg-white ${!wallet.isAvailable ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        <img 
          src={wallet.icon} 
          alt={`${wallet.name} wallet`} 
          className="w-8 h-8 rounded-lg"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzY2NjY2NiIvPgo8dGV4dCB4PSIxNiIgeT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPiEhPC90ZXh0Pgo8L3N2Zz4K';
          }}
        />
        <div className="flex flex-col items-start">
          <span className="font-medium text-gray-900">{wallet.name}</span>
          {wallet.id === 'freighter' && (
            <span className="text-xs text-gray-500">Extension required</span>
          )}
        </div>
      </div>
      <span className="text-gray-400">→</span>
    </button>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-600 text-sm">💼</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Connect Wallet</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="relative bg-gray-100 rounded-full p-1 flex border border-gray-200">
            <button
              onClick={() => setNetwork('mainnet')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all flex-1 ${
                network === 'mainnet'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Mainnet
            </button>
            <button
              onClick={() => setNetwork('testnet')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all flex-1 ${
                network === 'testnet'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Testnet
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="space-y-2">
            {supportedWallets.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Loading wallets...</div>
            ) : (
              <>
                {supportedWallets.slice(0, showMore ? supportedWallets.length : 5).map((wallet) => 
                  renderWalletButton(wallet)
                )}
                
                {supportedWallets.length > 5 && (
                  <button
                    onClick={() => setShowMore(!showMore)}
                    className="w-full text-yellow-600 hover:text-yellow-700 transition-colors py-2 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    See more wallets ({supportedWallets.length - 5}) {showMore ? '▲' : '▼'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center">
          By connecting, you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  );
}