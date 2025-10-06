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
  network = "mainnet",
}: WalletFundingModalProps) => {
  if (!isOpen) return null;

  const title = !exists
    ? "Wallet not funded"
    : "Low wallet balance";

  const message = !exists
    ? "Your wallet does not yet exist on this network. Please fund it to activate your account before continuing."
    : `Your wallet balance is currently ${balance.toFixed(
        2
      )} XLM — below the recommended minimum of ${minRequired.toFixed(
        2
      )} XLM required for transactions.`;

  const friendbotUrl =
    network === "testnet"
      ? `https://friendbot.stellar.org/?addr=${encodeURIComponent(
          window?.localStorage?.getItem("publicKey") || ""
        )}`
      : undefined;

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

        <div className="w-full mt-3 flex flex-col sm:flex-row gap-3 justify-center">
          {friendbotUrl ? (
            <a href={friendbotUrl} target="_blank" rel="noreferrer">
              <Button className="w-full sm:w-auto">Fund via Friendbot</Button>
            </a>
          ) : (
            <a
              href="https://www.stellar.org/get-started"
              target="_blank"
              rel="noreferrer"
            >
              <Button className="w-full sm:w-auto">Learn How to Fund</Button>
            </a>
          )}
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WalletFundingModal;
