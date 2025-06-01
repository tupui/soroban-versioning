import { useState, useEffect } from "react";
import Button from "components/utils/Button";
import JoinCommunityModal from "components/page/dashboard/JoinCommunityModal";
import MemberProfileModal from "./page/dashboard/MemberProfileModal";
import { getMember } from "@service/ReadContractService";
import type { Member } from "../../packages/tansu";
import { useStore } from "@nanostores/react";
import { connectedPublicKey } from "utils/store";

const JoinCommunityButton = () => {
  const publicKey = useStore(connectedPublicKey);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [memberData, setMemberData] = useState<Member | null>(null);

  const fetchMember = async (address: string) => {
    try {
      const member = await getMember(address);
      // If getMember succeeds, they are a member regardless of metadata content
      setIsMember(true);
      setMemberData(member);
    } catch (e: any) {
      // If getMember fails for any reason, treat as not a member
      console.log("getMember error:", e);
      setIsMember(false);
      setMemberData(null);
    }
  };

  useEffect(() => {
    // Reset state first to avoid showing stale profile
    setIsMember(false);
    setMemberData(null);
    setShowProfileModal(false);

    if (publicKey) {
      fetchMember(publicKey);
    }
  }, [publicKey]);

  const handleJoined = () => {
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
        className="w-[130px] sm:w-[162px] md:w-[180px] h-10 md:h-12 px-2 sm:px-4 md:px-[30px]"
        onClick={() => setShowJoinModal(true)}
      >
        <p className="text-sm sm:text-base md:text-xl leading-4 md:leading-5 text-primary truncate">
          Join community
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
