import { useStore } from "@nanostores/react";
import { loadProjectInfo } from "@service/StateService";
import { loadedPublicKey } from "@service/walletService";
import { addBadges } from "@service/WriteContractService";
import Button from "components/utils/Button";
import Modal from "components/utils/Modal";
import type { Badge } from "../../../../packages/tansu";
import { useEffect, useState } from "react";
import { projectInfoLoaded } from "utils/store";
import { toast } from "utils/utils";

const badgeOptions: { label: string; value: Badge }[] = [
  { label: "Developer", value: 10000000 },
  { label: "Triage", value: 5000000 },
  { label: "Community", value: 1000000 },
  { label: "Verified", value: 500000 },
  { label: "Default", value: 1 },
];

const AddBadgeModal = () => {
  const isProjectInfoLoaded = useStore(projectInfoLoaded);
  const [showButton, setShowButton] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [memberAddress, setMemberAddress] = useState("");
  const [selectedBadges, setSelectedBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isProjectInfoLoaded) {
      const projectInfo = loadProjectInfo();
      if (projectInfo) {
        const publicKey = loadedPublicKey();
        const isMaintainer = publicKey
          ? projectInfo.maintainers.includes(publicKey)
          : false;
        setShowButton(isMaintainer);
      }
    }
  }, [isProjectInfoLoaded]);

  const handleToggleBadge = (badge: Badge) => {
    setSelectedBadges((prev) =>
      prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge],
    );
  };

  const handleAdd = async () => {
    if (!memberAddress || selectedBadges.length === 0) {
      toast.error("Add badge", "Address and badges are required");
      return;
    }
    setIsLoading(true);
    try {
      await addBadges(memberAddress, selectedBadges);
      toast.success("Add badge", "Badges added successfully");
      window.dispatchEvent(new CustomEvent("badgesUpdated"));
      setIsOpen(false);
    } catch (err: any) {
      toast.error("Add badge", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showButton && (
        <button
          id="badge-button"
          className="p-[12px_16px] sm:p-[18px_30px] flex gap-2 sm:gap-3 bg-white cursor-pointer w-full sm:w-auto text-left"
          onClick={() => setIsOpen(true)}
        >
          <img
            src="/icons/plus-fill.svg"
            className="w-5 h-5 sm:w-auto sm:h-auto"
          />
          <p className="leading-5 text-base sm:text-xl text-primary whitespace-nowrap">
            Add badge
          </p>
        </button>
      )}
      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-[18px]">
            <img
              src="/images/scan.svg"
              className="w-16 h-16 sm:w-auto sm:h-auto mx-auto sm:mx-0"
            />
            <div className="flex-grow flex flex-col gap-6 sm:gap-9 w-full">
              <h6 className="text-xl sm:text-2xl font-medium text-primary text-center sm:text-left">
                Add badge
              </h6>
              <div className="flex flex-col gap-4 sm:gap-[18px]">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <p className="text-sm sm:text-base font-[600] text-primary">
                    Member address
                  </p>
                  <input
                    type="text"
                    className="p-3 sm:p-[18px] border border-[#978AA1] outline-none w-full text-sm sm:text-base"
                    placeholder="Member address as G..."
                    value={memberAddress}
                    onChange={(e) => setMemberAddress(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2 sm:gap-3">
                  <p className="text-sm sm:text-base font-[600] text-primary">
                    Badges
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {badgeOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex gap-2 items-center text-sm sm:text-base text-primary"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBadges.includes(opt.value)}
                          onChange={() => handleToggleBadge(opt.value)}
                          className="w-4 h-4"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end mt-2 sm:mt-0">
                  <Button
                    onClick={handleAdd}
                    isLoading={isLoading}
                    className="w-full sm:w-auto"
                  >
                    Add Badges
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AddBadgeModal;
