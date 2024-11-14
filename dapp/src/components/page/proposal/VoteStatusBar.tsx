import React from "react";
import type { VoteType } from "types/proposal";

interface VoteStatusBarProps {
  interest: number;
  conflict: number;
  abstain: number;
  onClick?: (voteType: VoteType) => void;
}

const VoteStatusBar: React.FC<VoteStatusBarProps> = ({
  interest,
  conflict,
  abstain,
  onClick,
}) => {
  const total = interest + conflict + abstain;
  const interestPercent = total ? (interest / total) * 100 : 0;
  const conflictPercent = total ? (conflict / total) * 100 : 0;
  const abstainPercent = total ? (abstain / total) * 100 : 0;

  return (
    <div className="flex h-4 bg-gray-200 rounded-md overflow-hidden">
      <div
        className="bg-interest cursor-pointer"
        style={{ width: `${interestPercent}%` }}
        onClick={() => onClick?.("interest")}
      ></div>
      <div
        className="bg-abstain cursor-pointer"
        style={{ width: `${abstainPercent}%` }}
        onClick={() => onClick?.("abstain")}
      ></div>
      <div
        className="bg-conflict cursor-pointer"
        style={{ width: `${conflictPercent}%` }}
        onClick={() => onClick?.("conflict")}
      ></div>
    </div>
  );
};

export default VoteStatusBar;
