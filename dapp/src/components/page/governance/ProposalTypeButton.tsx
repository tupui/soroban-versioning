import React from "react";
import { useState, useEffect } from "react";

interface ProposalTypeButtonProps {
  proposalTypeStatus: string;
  proposalType: string;
  title: string;
  position?: "start" | "end";
  onClick: (proposalType: string) => void;
}

const ProposalTypeButton: React.FC<ProposalTypeButtonProps> = ({
  proposalTypeStatus,
  proposalType,
  title,
  position = null,
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

  const buttonClass = `px-2.5 sm:px-3 py-1.5 sm:py-2 text-md sm:text-xl font-medium border border-zinc-200 focus:outline-none ${
    isSelected ? "bg-zinc-200" : "bg-white"
  } ${position === "start" ? "rounded-tl-lg" : position === "end" ? "rounded-tr-lg" : ""}`;

  return (
    <button className={buttonClass} onClick={() => onClick(proposalType)}>
      {title}
    </button>
  );
};

export default ProposalTypeButton;
