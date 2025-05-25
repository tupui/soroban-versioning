import type { FC } from "react";
import Modal, { type ModalProps } from "components/utils/Modal";
import Button from "components/utils/Button";
import type { Member, Badge } from "../../../../packages/tansu";
import { Buffer } from "buffer";

interface Props extends ModalProps {
  member: Member;
}

const badgeName = (b: Badge) => {
  switch (b) {
    case 10000000:
      return "Developer";
    case 5000000:
      return "Triage";
    case 1000000:
      return "Community";
    case 500000:
      return "Verified";
    case 1:
      return "Default";
    default:
      return b.toString();
  }
};

const MemberProfileModal: FC<Props> = ({ onClose, member }) => {
  const noBadges = member.projects.every((p) => p.badges.length === 0);
  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col gap-[30px] w-[360px] md:w-[600px]">
        <h2 className="text-2xl font-bold text-primary">My Profile</h2>
        {member.meta && (
          <p className="text-base text-secondary break-words">
            Meta: {member.meta}
          </p>
        )}
        {noBadges ? (
          <p className="text-lg text-primary">
            Welcome to the Tansu community! You don't have any badges yet. Start
            contributing to projects to earn your first badge.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {member.projects.map((proj, idx) => (
              <div key={idx} className="border p-3">
                <p className="font-semibold text-primary mb-2 break-words">
                  Project ID:{" "}
                  {Buffer.from(proj.project).toString("hex").slice(0, 16)}...
                </p>
                <div className="flex flex-wrap gap-2">
                  {proj.badges.map((b, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-primary text-white text-xs rounded"
                    >
                      {badgeName(b)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-[18px] mt-4">
          <Button type="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MemberProfileModal;
