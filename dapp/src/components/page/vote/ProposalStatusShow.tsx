import React from "react";
import type { ProposalStatus } from "types/proposal";

interface ProposalStatusShowProps {
  proposalStatus: ProposalStatus;
}

const ProposalStatusShow: React.FC<ProposalStatusShowProps> = ({
  proposalStatus,
}) => {
  let title;
  let backgroundColorClass;

  switch (proposalStatus) {
    case "active":
      title = "Active";
      backgroundColorClass = "bg-green";
      break;
    case "rejected":
      title = "Rejected";
      backgroundColorClass = "bg-red";
      break;
    case "cancelled":
      title = "Cancelled";
      backgroundColorClass = "bg-gray";
      break;
    case "approved":
      title = "Approved";
      backgroundColorClass = "bg-violet-600";
      break;
    default:
      title = "Unknown";
      backgroundColorClass = "bg-gray";
  }

  return (
    <div
      className={`${backgroundColorClass} text-sm sm:text-base font-bold text-white px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-2 rounded-lg`}
    >
      <h1 className="text-white">{title}</h1>
    </div>
  );
};

export default ProposalStatusShow;
