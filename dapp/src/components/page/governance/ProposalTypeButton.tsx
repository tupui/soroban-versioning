import React, { useEffect, useState } from "react";

interface ProposalTypeButtonProps {
  proposalTypeStatus: string;
  proposalType: string;
  title: string;
  onClick: (proposalType: string) => void;
}

const ProposalTypeButton: React.FC<ProposalTypeButtonProps> = ({
  proposalTypeStatus,
  proposalType,
  title,
  onClick,
}) => {
  const [isSelected, setIsSelected] = useState(true);

  useEffect(() => {
    if (proposalTypeStatus === proposalType) {
      setIsSelected(true);
    } else {
      setIsSelected(false);
    }
  }, [proposalTypeStatus]);

  const buttonClass = `py-[18px] w-[180px] flex justify-center border border-[#FFBD1E] ${isSelected ? "bg-[#FFBD1E]" : "bg-white"}`;

  return (
    <button className={buttonClass} onClick={() => onClick(proposalType)}>
      <span className="text-base text-[#2D0F51]">{title}</span>
    </button>
  );
};

export default ProposalTypeButton;
