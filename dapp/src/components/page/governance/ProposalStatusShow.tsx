import React from "react";
import type { ProposalViewStatus } from "types/proposal";

interface ProposalStatusShowProps {
  proposalStatus: ProposalViewStatus;
}

const ProposalStatusShow: React.FC<ProposalStatusShowProps> = ({
  proposalStatus,
}) => {
  let title;
  let backgroundColorClass;
  let textColorClass = "text-white";

  switch (proposalStatus) {
    case "active":
      title = "Active";
      backgroundColorClass = "bg-[#E6F4E9]";
      textColorClass = "text-[#007D1B]";
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
    <div className={`p-[6px_15.5px] ${backgroundColorClass}`}>
      <p className={`text-xs ${textColorClass}`}>{title}</p>
    </div>
  );
};

export default ProposalStatusShow;
