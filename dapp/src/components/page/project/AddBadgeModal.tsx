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
          className="p-[18px_30px] flex gap-3 bg-white cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <img src="/icons/plus-fill.svg" />
          <p className="leading-5 text-xl text-primary">Add badge</p>
        </button>
      )}
      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          <div className="flex items-start gap-[18px]">
            <img src="/images/scan.svg" />
            <div className="flex-grow flex flex-col gap-9">
              <h6 className="text-2xl font-medium text-primary">Add badge</h6>
              <div className="flex flex-col gap-[18px]">
                <div className="flex flex-col gap-3">
                  <p className="text-base font-[600] text-primary">
                    Member address
                  </p>
                  <input
                    type="text"
                    className="p-[18px] border border-[#978AA1] outline-none"
                    placeholder="Member address as G..."
                    value={memberAddress}
                    onChange={(e) => setMemberAddress(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-base font-[600] text-primary">Badges</p>
                  <div className="grid grid-cols-2 gap-2">
                    {badgeOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex gap-2 items-center text-primary"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBadges.includes(opt.value)}
                          onChange={() => handleToggleBadge(opt.value)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleAdd} isLoading={isLoading}>
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
