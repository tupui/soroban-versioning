import React from "react";

interface VoteStatusBarProps {
  approve: number;
  reject: number;
  abstain: number;
}

const VoteStatusBar: React.FC<VoteStatusBarProps> = ({
  approve,
  reject,
  abstain,
}) => {
  const total = approve + reject + abstain;
  const interestPercent = total ? (approve / total) * 100 : 0;
  const conflictPercent = total ? (reject / total) * 100 : 0;
  const abstainPercent = total ? (abstain / total) * 100 : 0;

  return (
    <div className="flex-grow h-[18px] flex gap-3">
      {interestPercent > 0 && (
        <div
          className="bg-[#93F4A8]"
          style={{ width: `${interestPercent}%` }}
        />
      )}
      {abstainPercent > 0 && (
        <div className="bg-[#FBDE7E]" style={{ width: `${abstainPercent}%` }} />
      )}
      {conflictPercent > 0 && (
        <div
          className="bg-[#F79FB1]"
          style={{ width: `${conflictPercent}%` }}
        />
      )}
    </div>
  );
};

export default VoteStatusBar;
