import Modal from "components/utils/Modal";
import Button from "components/utils/Button";

interface WalletFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  exists: boolean;
  balance: number;
  minRequired: number;
  network?: "mainnet" | "testnet";
}

const WalletFundingModal = ({
  isOpen,
  onClose,
  exists,
  balance,
  minRequired,
}: WalletFundingModalProps) => {
  if (!isOpen) return null;

  const title = !exists ? "Wallet not funded" : "Low wallet balance";

  const message = !exists
    ? "Your wallet does not yet exist on this network. Please fund it with XLM before continuing."
    : `Your wallet balance is ${balance.toFixed(
        2
      )} XLM — below the recommended minimum of ${minRequired.toFixed(
        2
      )} XLM required for transactions.`;

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col items-center text-center gap-4 sm:gap-6 p-4 sm:p-6">
        <img
          src="/images/wrong.svg"
          alt="Wallet warning"
          className="w-16 h-16"
        />
        <h3 className="text-xl font-semibold text-primary">{title}</h3>
        <p className="text-sm sm:text-base text-secondary">{message}</p>

        <p className="text-xs text-tertiary mt-2">
          You need XLM in your wallet to interact with this dApp.
        </p>

        <div className="w-full mt-3 flex justify-center">
          <Button onClick={onClose} variant="secondary" className="w-full sm:w-auto">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WalletFundingModal;
