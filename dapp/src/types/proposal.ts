export type ProposalStatus = "active" | "rejected" | "cancelled" | "approved";

export interface Proposal {
  id: number;
  title: string;
  description: string;
  status: ProposalStatus;
  endDate: string;
  expiredDate: string;
}

export interface ProposalCardProps {
  proposalNumber: number;
  proposalTitle: string;
  proposalStatus: ProposalStatus;
  endDate: string | null;
}