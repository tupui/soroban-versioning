export type ProposalStatus = "active" | "rejected" | "cancelled" | "approved";

export interface Proposal {
  id: number;
  title: string;
  description: string;
  outcome: string;
  status: ProposalStatus;
  voteStatus: VoteStatus;
  endDate: string;
}

export interface ProposalCardProps {
  proposalNumber: number;
  proposalTitle: string;
  proposalStatus: ProposalStatus;
  endDate: string | null;
}

export type VoteType = "interest" | "conflict" | "abstain";

export type VoterRole = "maintainer" | "contributor" | "community";

export interface VoteStatus {
  totalScore: number;
  interest: VoteData;
  conflict: VoteData;
  abstain: VoteData;
}

export interface VoteData {
  voteType: VoteType;
  score: number;
  voters: {
    maintainer: Voter[];
    contributor: Voter[];
    community: Voter[];
  };
}

export interface Voter {
  address: string;
  image: string | null;
}
