import { useState, type FC } from "react";
import Input from "components/utils/Input";
import Button from "components/utils/Button";
import Modal, { type ModalProps } from "components/utils/Modal";
import { loadedPublicKey } from "@service/walletService";
import { toast } from "utils/utils";

const JoinCommunityModal: FC<ModalProps> = ({ onClose }) => {
  const [address, setAddress] = useState<string>(loadedPublicKey() ?? "");
  const [meta, setMeta] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!address) {
      toast.error("Address", "Address is required");
      return;
    }
    if (!meta) {
      toast.error("Metadata", "Metadata is required");
      return;
    }

    try {
      setIsLoading(true);
      const { addMember } = await import("@service/WriteContractService");
      await addMember(address, meta);
      toast.success("Success", "You have successfully joined the community!");
      onClose?.();
    } catch (err: any) {
      toast.error("Something Went Wrong!", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center gap-[18px]">
        <div className="flex flex-col gap-[42px]">
          <div className="flex flex-col gap-[30px] w-[360px] md:w-[480px]">
            <h2 className="text-2xl font-bold text-primary">
              Join the Community
            </h2>
            <Input
              label="Member Address"
              placeholder="Write the address as G..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Input
              label="Metadata"
              placeholder="Write some metadata (e.g., profile link)"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-[18px]">
            <Button type="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button isLoading={isLoading} onClick={handleJoin}>
              Join
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default JoinCommunityModal;
