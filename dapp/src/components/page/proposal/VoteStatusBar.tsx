import React from "react";

interface VoteStatusBarProps {
  interest: number;
  conflict: number;
  abstain: number;
}

const VoteStatusBar: React.FC<VoteStatusBarProps> = ({
  interest,
  conflict,
  abstain,
}) => {
  const total = interest + conflict + abstain;
  const interestPercent = total ? (interest / total) * 100 : 0;
  const conflictPercent = total ? (conflict / total) * 100 : 0;
  const abstainPercent = total ? (abstain / total) * 100 : 0;

  return (
    <div className="flex h-4 bg-gray-200 rounded-md overflow-hidden">
      <div
        className="bg-interest"
        style={{ width: `${interestPercent}%` }}
        onClick={() => {}}
      ></div>
      <div
        className="bg-abstain"
        style={{ width: `${abstainPercent}%` }}
        onClick={() => {}}
      ></div>
      <div
        className="bg-conflict"
        style={{ width: `${conflictPercent}%` }}
        onClick={() => {}}
      ></div>
    </div>
  );
};

export default VoteStatusBar;
