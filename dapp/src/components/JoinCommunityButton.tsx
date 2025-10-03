import { useState, useEffect } from "react";
import Button from "components/utils/Button";
import JoinCommunityModal from "components/page/dashboard/JoinCommunityModal";

import { getMember } from "@service/ReadContractService";
import type { Member } from "../../packages/tansu";
import { useStore } from "@nanostores/react";
import { connectedPublicKey } from "utils/store";

const JoinCommunityButton = () => {
  const publicKey = useStore(connectedPublicKey);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [_showProfileModal, _setShowProfileModal] = useState(false);
  const [_isMember, setIsMember] = useState(false);
  const [_memberData, setMemberData] = useState<Member | null>(null);

  const fetchMember = async (address: string) => {
    try {
      const member = await getMember(address);
      // If getMember succeeds, they are a member regardless of metadata content
      setIsMember(true);
      setMemberData(member);
    } catch {
      // If getMember fails for any reason, treat as not a member
      // This is expected behavior for non-members
      setIsMember(false);
      setMemberData(null);
    }
  };

  useEffect(() => {
    // Reset state first to avoid showing stale profile
    setIsMember(false);
    setMemberData(null);
    _setShowProfileModal(false);

    if (publicKey) {
      fetchMember(publicKey);
    }
  }, [publicKey]);

  const _handleJoined = () => {
    if (publicKey) fetchMember(publicKey);
  };

  // If user is connected (publicKey exists), don't render the button
  if (publicKey) {
    return null;
  }

  return (
    <>
      <Button
        type="secondary"
        className="h-8 md:h-10 lg:h-12 px-3 md:px-4 lg:px-6 flex justify-center items-center gap-1 md:gap-2 shadow-button focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
        onClick={() => setShowJoinModal(true)}
      >
        <p className="text-xs md:text-sm lg:text-base font-medium text-primary truncate">
          Join
        </p>
      </Button>

      {showJoinModal && (
        <JoinCommunityModal
          onClose={() => setShowJoinModal(false)}
          onJoined={() => {}}
        />
      )}
    </>
  );
};

export default JoinCommunityButton;
