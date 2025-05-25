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
      const isRealMember =
        (member.meta && member.meta.trim().length > 0) ||
        (member.projects && member.projects.length > 0);

      if (isRealMember) {
        setIsMember(true);
        setMemberData(member);
      } else {
        setIsMember(false);
        setMemberData(null);
      }
    } catch (e: any) {
      // if error code 18 unknown member, treat as not member
      if (e?.code === 18 || e?.errorCode === 18) {
        setIsMember(false);
        setMemberData(null);
      } else {
        console.error(e);
      }
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

  return (
    <>
      {isMember ? (
        <Button
          type="secondary"
          className="w-[162px] md:w-[195px] h-12 md:h-14 px-[30px]"
          onClick={() => setShowProfileModal(true)}
        >
          <p className="text-base md:text-xl leading-4 md:leading-5 text-primary">
            My Profile
          </p>
        </Button>
      ) : (
        <Button
          type="secondary"
          className="w-[162px] md:w-[195px] h-12 md:h-14 px-[30px]"
          onClick={() => setShowJoinModal(true)}
        >
          <p className="text-base md:text-xl leading-4 md:leading-5 text-primary">
            Join community
          </p>
        </Button>
      )}
      {showJoinModal && (
        <JoinCommunityModal
          onClose={() => setShowJoinModal(false)}
          onJoined={handleJoined}
        />
      )}
      {showProfileModal && memberData && (
        <MemberProfileModal
          member={memberData}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  );
};

export default JoinCommunityButton;
