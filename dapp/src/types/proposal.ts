export type ProposalStatus =
  | "active"
  | "rejected"
  | "cancelled"
  | "approved"
  | "voted";

export interface Proposal {
  id: number;
  title: string;
  projectName: string;
  maintainers: string[];
  ipfsLink: string;
  status: ProposalStatus;
  voteStatus: VoteStatus;
  endDate: string | null;
}

export interface ProposalCardProps {
  proposalNumber: number;
  proposalTitle: string;
  proposalStatus: ProposalStatus;
  endDate: string | null;
}

export type VoteType = "approve" | "reject" | "abstain";

export type VoterRole = "maintainer" | "contributor" | "community";

export interface VoteStatus {
  totalScore: number;
  approve: VoteData;
  reject: VoteData;
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
