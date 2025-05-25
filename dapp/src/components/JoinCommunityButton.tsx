import { useState } from "react";
import Button from "components/utils/Button";
import JoinCommunityModal from "components/page/dashboard/JoinCommunityModal";

const JoinCommunityButton = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        type="secondary"
        className="w-[162px] md:w-[195px] h-12 md:h-14 px-[30px]"
        onClick={() => setShowModal(true)}
      >
        <p className="text-base md:text-xl leading-4 md:leading-5 text-primary">
          Join community
        </p>
      </Button>
      {showModal && <JoinCommunityModal onClose={() => setShowModal(false)} />}
    </>
  );
};

export default JoinCommunityButton;
