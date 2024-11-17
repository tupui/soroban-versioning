import React from "react";
import type { ProposalStatus } from "types/proposal";

interface ProposalStatusDivProps {
  proposalStatus: ProposalStatus;
}

const ProposalStatusDiv: React.FC<ProposalStatusDivProps> = ({
  proposalStatus,
}) => {
  let title;
  let backgroundColorClass;

  switch (proposalStatus) {
    case "active":
      title = "Active";
      backgroundColorClass = "bg-active";
      break;
    case "rejected":
      title = "Rejected";
      backgroundColorClass = "bg-conflict";
      break;
    case "cancelled":
      title = "Cancelled";
      backgroundColorClass = "bg-abstain";
      break;
    case "voted":
      title = "Voted";
      backgroundColorClass = "bg-voted";
      break;
    case "approved":
      title = "Approved";
      backgroundColorClass = "bg-approved";
      break;
    default:
      title = "Unknown";
      backgroundColorClass = "bg-gray";
  }

  return (
    <div
      className={`${backgroundColorClass} text-sm sm:text-base md:text-xl font-bold text-white px-1 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-lg`}
    >
      <h1 className="text-white">{title}</h1>
    </div>
  );
};

export default ProposalStatusDiv;
