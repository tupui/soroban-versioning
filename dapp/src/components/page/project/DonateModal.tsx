import { useRef, useState, type FC, type ReactNode } from "react";

import Modal from "components/utils/Modal";
import Tooltip from "components/utils/Tooltip";
import { toast } from "utils/utils";
import Button from "components/utils/Button";

interface Props {
  children: ReactNode;
}

const DonateModal: FC<Props> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number>(10);
  const [tipAmount, setTipAmount] = useState<string>("");
  const [donateMessage, setDonateMessage] = useState<string>("");
  const amountInputRef = useRef<HTMLInputElement>(null);
  const tipAmountInputRef = useRef<HTMLInputElement>(null);
  const onClose = () => setIsOpen(false);

  const amountOptions = [10, 100, 1000];

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setAmount(value);
  };

  const handleTipAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTipAmount(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handleAmountButtonClick = (value: number) => {
    setAmount(value);
  };

  const handleContribute = async () => {
    const { sendXLM } = await import("service/PaymentService");
    const { getAddressFromDomain } = await import(
      "service/SorobanDomainContractService"
    );

    if (amount < 1) {
      toast.error("Support", "Minimum donation is 1 XLM.");
      return;
    }

    try {
      const domainInfo = await getAddressFromDomain("tansu");

      if ("owner" in domainInfo.value) {
        const domainOwnerAddress = domainInfo.value.owner;
        const payment = await sendXLM(
          amount.toString(),
          domainOwnerAddress as string,
          tipAmount.toString(),
          donateMessage,
        );

        if (payment) {
          toast.success("Congratulation!", "You successfully donated.");
          onClose(); // Close modal after success
        } else {
          toast.error("Support", "Donation failed.");
        }
      } else {
        toast.error("Support", "Cannot read domain information.");
      }
    } catch (error) {
      toast.error(
        "Support",
        "An error occurred during the contribution process.",
      );
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>
      {isOpen && (
        <Modal onClose={onClose}>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-[18px]">
            <img
              src="/images/heart.svg"
              alt="Heart"
              className="w-16 h-16 sm:w-auto sm:h-auto mx-auto sm:mx-0 mb-2 sm:mb-0"
            />
            <div className="flex-grow flex flex-col gap-6 sm:gap-9 w-full">
              <div className="flex flex-col gap-2 sm:gap-3">
                <h6 className="text-xl sm:text-2xl font-medium text-primary text-center sm:text-left">
                  Support
                </h6>
                <p className="text-sm sm:text-base text-secondary text-center sm:text-left">
                  Help bring this project to life with your contribution.
                </p>
              </div>

              {/* Amount Input */}
              <div className="flex flex-col gap-3 sm:gap-[18px]">
                <p className="text-sm sm:text-base font-[600] text-primary">
                  Contribute
                </p>
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
                        amount === value
                          ? "bg-[#FFB21E] text-white"
                          : "text-primary"
                      }`}
                      onClick={() => handleAmountButtonClick(value)}
                    >
                      {value} XLM
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <p className="text-xs sm:text-base text-tertiary">
                    Minimum amount:
                  </p>
                  <p className="text-xs sm:text-base font-[600] text-primary">
                    1 XLM
                  </p>
                </div>
              </div>

              {/* Message Input */}
              <div className="flex flex-col gap-2 sm:gap-3">
                <p className="text-sm sm:text-base font-[600] text-primary">
                  Say Something to Support the Project (optional)
                </p>
                <textarea
                  className="p-3 sm:p-[18px] w-full border border-[#978AA1] outline-none text-sm sm:text-base"
                  placeholder="Write your message here"
                  value={donateMessage}
                  onChange={(e) => setDonateMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Platform Tip */}
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <p className="text-sm sm:text-base font-[600] text-primary">
                    Platform tip (optional)
                  </p>
                  <Tooltip text="Help us run the Tansu platform sustainably">
                    <img
                      src="/icons/info.svg"
                      alt="Info"
                      className="w-4 h-4 sm:w-auto sm:h-auto"
                    />
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
