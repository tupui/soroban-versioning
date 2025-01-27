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
    <div className="h-[18px] flex gap-3">
      <div
        className="bg-[#93F4A8] cursor-pointer"
        style={{ width: `${interestPercent}%` }}
        onClick={() => onClick?.("approve")}
      ></div>
      <div
        className="bg-[#FBDE7E] cursor-pointer"
        style={{ width: `${abstainPercent}%` }}
        onClick={() => onClick?.("abstain")}
      ></div>
      <div
        className="bg-[#F79FB1] cursor-pointer"
        style={{ width: `${conflictPercent}%` }}
        onClick={() => onClick?.("reject")}
      ></div>
    </div>
  );
};

export default VoteStatusBar;
