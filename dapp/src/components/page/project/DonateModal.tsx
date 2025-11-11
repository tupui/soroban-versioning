import {
  useRef,
  useState,
  type FC,
  type ReactNode,
  isValidElement,
  cloneElement,
} from "react";

import Modal from "components/utils/Modal";
import Tooltip from "components/utils/Tooltip";
import { toast } from "utils/utils";
import Button from "components/utils/Button";

import { sendXLM } from "service/TxService";
import { getAddressFromDomain } from "service/SorobanDomainContractService";
import { StrKey } from "@stellar/stellar-sdk";

interface Props {
  children: ReactNode;
  onBeforeOpen?: () => void;
}

const DonateModal: FC<Props> = ({ children, onBeforeOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number>(10);
  const [tipAmount, setTipAmount] = useState<string>("");
  const [donateMessage, setDonateMessage] = useState<string>("");
  const [updateSuccessful, setUpdateSuccessful] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);
  const tipAmountInputRef = useRef<HTMLInputElement>(null);

  const amountOptions = [10, 100, 1000];

  // --- Reset form state ---
  const resetForm = () => {
    setAmount(10);
    setTipAmount("");
    setDonateMessage("");
    setUpdateSuccessful(false);
    setIsLoading(false);
    amountInputRef.current?.blur();
    tipAmountInputRef.current?.blur();
  };

  const onClose = () => {
    const wasSuccessful = updateSuccessful;
    setIsOpen(false);
    resetForm();
    if (wasSuccessful) {
      window.location.reload();
    }
  };

  const handleOpen = () => {
    onBeforeOpen?.();
    resetForm(); // clean slate on open
    setIsOpen(true);
  };

  // --- Input handlers ---
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(Number(e.target.value));
  };

  const handleTipAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTipAmount(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handleAmountButtonClick = (value: number) => {
    setAmount(value);
  };

  // --- Donation logic ---
  const handleContribute = async () => {
    if (amount < 1) {
      toast.error("Support", "Minimum donation is 1 XLM.");
      return;
    }

    setIsLoading(true);

    try {
      // Resolve domain owner
      const domainInfo = await getAddressFromDomain("tansu").catch(() => null);
      if (!domainInfo || !domainInfo.owner) {
        toast.error("Support", "Could not resolve domain owner. Please try again.");
        return;
      }

      let dest = (domainInfo as any).address || domainInfo.owner;
      if (!StrKey.isValidEd25519PublicKey(dest)) {
        toast.error("Support", "Invalid owner address in domain record.");
        return;
      }
      const domainOwnerAddress = dest as string;

      // Attempt payment (sendXLM handles wallet checks)
      const payment = await sendXLM(
        amount.toString(),
        domainOwnerAddress,
        tipAmount.toString(),
        donateMessage,
      );

      if (payment) {
        toast.success("Congratulation!", "You successfully donated.");
        setUpdateSuccessful(true);
      } else {
        toast.error("Support", "Donation failed. Please reconnect wallet and try again.");
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error during donation:", error);
      }
      toast.error(
        "Support",
        error?.message || "An unexpected error occurred during the contribution process."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div onClick={handleOpen}>
        {isValidElement(children)
          ? cloneElement(children as any, { id: "support-button" } as any)
          : children}
      </div>

      {isOpen && (
        <Modal onClose={onClose}>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-[18px]">
            <img
              src="/images/heart.svg"
              alt="Heart"
              className="w-16 h-16 sm:w-auto sm:h-auto mx-auto sm:mx-0 mb-2 sm:mb-0"
            />
            <div className="flex-grow flex flex-col gap-4 sm:gap-6 w-full">
              <div className="flex flex-col gap-2 sm:gap-3">
                <h6 className="text-xl sm:text-2xl font-medium text-primary text-center sm:text-left">
                  Support
                </h6>
                <p className="text-sm sm:text-base text-secondary text-center sm:text-left">
                  Help bring this project to life with your contribution.
                </p>
              </div>

              {/* Amount Input */}
              <div className="flex flex-col gap-2 sm:gap-3">
                <p className="text-sm sm:text-base font-[600] text-primary">Contribute</p>
                <div className="w-full flex-grow flex border border-[#978AA1]">
                  <input
                    ref={amountInputRef}
                    className="flex-grow p-3 sm:p-[18px] outline-none text-sm sm:text-base"
                    placeholder="Enter the amount"
                    value={amount}
                    onChange={handleAmountChange}
                  />
                  <div className="px-2 sm:px-[18px] flex items-center">
                    <p className="text-base sm:text-xl text-primary">XLM</p>
                  </div>
                </div>
                <div className="w-full grid grid-cols-3 text-sm sm:text-base">
                  {amountOptions.map((value, index) => (
                    <button
                      key={index}
                      className={`amount-button py-2 sm:py-[11px] flex justify-center items-center leading-5 text-base sm:text-xl border border-[#FFB21E] ${
                        amount === value ? "bg-[#FFB21E] text-white" : "text-primary"
                      }`}
                      onClick={() => handleAmountButtonClick(value)}
                    >
                      {value} XLM
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <p className="text-xs sm:text-base text-tertiary">Minimum amount:</p>
                  <p className="text-xs sm:text-base font-[600] text-primary">1 XLM</p>
                </div>
              </div>

              {/* Message Input */}
              <div className="flex flex-col gap-2">
                <p className="text-sm sm:text-base font-[600] text-primary">
                  Say Something to Support the Project (optional)
                </p>
                <textarea
                  className="p-3 sm:p-[18px] w-full border border-[#978AA1] outline-none text-sm sm:text-base"
                  placeholder="Write your message here"
                  value={donateMessage}
                  onChange={(e) => setDonateMessage(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Platform Tip */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <p className="text-sm sm:text-base font-[600] text-primary">
                    Platform tip (optional)
                  </p>
                  <Tooltip text="Help us run the Tansu platform sustainably">
                    <img src="/icons/info.svg" alt="Info" className="w-4 h-4 sm:w-auto sm:h-auto" />
                  </Tooltip>
                </div>
                <div className="flex border border-[#978AA1]">
                  <input
                    ref={tipAmountInputRef}
                    className="flex-grow p-3 sm:p-[18px] outline-none text-sm sm:text-base"
                    placeholder="Enter the amount"
                    value={tipAmount}
                    onChange={handleTipAmountChange}
                  />
                  <div className="px-2 sm:px-[18px] flex items-center">
                    <p className="text-base sm:text-xl text-primary">XLM</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end w-full">
                <Button
                  className="w-full sm:w-[220px] h-[48px] sm:h-[56px]"
                  onClick={handleContribute}
                  isLoading={isLoading}
                >
                  Contribute
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default DonateModal;
