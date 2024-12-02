import React from "react";
import type { VoteType } from "types/proposal";

interface VoteStatusBarProps {
  approve: number;
  reject: number;
  abstain: number;
  onClick?: (voteType: VoteType) => void;
}

const VoteStatusBar: React.FC<VoteStatusBarProps> = ({
  approve,
  reject,
  abstain,
  onClick,
}) => {
  const total = approve + reject + abstain;
  const interestPercent = total ? (approve / total) * 100 : 0;
  const conflictPercent = total ? (reject / total) * 100 : 0;
  const abstainPercent = total ? (abstain / total) * 100 : 0;

  return (
    <div className="flex h-4 bg-gray-200 rounded-md overflow-hidden">
      <div
        className="bg-interest cursor-pointer"
        style={{ width: `${interestPercent}%` }}
        onClick={() => onClick?.("approve")}
      ></div>
      <div
        className="bg-abstain cursor-pointer"
        style={{ width: `${abstainPercent}%` }}
        onClick={() => onClick?.("abstain")}
      ></div>
      <div
        className="bg-conflict cursor-pointer"
        style={{ width: `${conflictPercent}%` }}
        onClick={() => onClick?.("reject")}
      ></div>
    </div>
  );
};

export default VoteStatusBar;
