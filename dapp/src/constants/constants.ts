import type { AnyObject } from "types/types";

export const voteTypeLabelMap: AnyObject = {
  approve: "Approve",
  reject: "Reject",
  abstain: "Cancel",
};

export const voteTypeDescriptionMap: AnyObject = {
  approve: "You believe this proposal should move forward.",
  reject: "You believe this proposal should not move forward.",
  abstain: "You choose to abstain.",
};

export const votedTypeLabelMap: AnyObject = {
  approve: "Approved",
  reject: "Rejected",
  abstain: "Cancelled",
};
