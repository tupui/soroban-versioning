export type ProposalStatus = "active" | "rejected" | "cancelled" | "approved";

export type ProposalViewStatus =
  | "active"
  | "rejected"
  | "cancelled"
  | "voted"
  | "approved";

export interface Proposal {
  id: number;
  title: string;
  ipfs: string;
  nqg: number;
  status: ProposalStatus;
  voting_ends_at: number;
  voteStatus: VoteStatus;
}

export interface ProposalView {
  id: number;
  title: string;
  projectName: string;
  ipfsLink: string;
  status: ProposalViewStatus;
  endDate: number;
  nqg: number;
  voteStatus: VoteStatus;
}

export interface ProposalCardView {
  proposalNumber: number;
  proposalTitle: string;
  proposalStatus: ProposalViewStatus;
  endDate: number;
}

export type VoteType = "approve" | "reject" | "abstain";

export type VoterRole = "maintainer" | "community";

export interface VoteStatus {
  approve: VoteData;
  reject: VoteData;
  abstain: VoteData;
}

export interface VoteData {
  voteType: VoteType;
  score: number;
  voters: Voter[];
}

export interface Voter {
  address: string;
  image: string | null;
  name: string;
  github: string;
}

export interface ProposalOutcome {
  approved: {
    description: string;
    xdr: string;
  };
  rejected: {
    description: string;
    xdr: string;
  };
  cancelled: {
    description: string;
    xdr: string;
  };
}
