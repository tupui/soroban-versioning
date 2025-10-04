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
  voteStatus: VoteStatus;
}

export enum VoteType {
  APPROVE = "approve",
  REJECT = "reject",
  CANCEL = "abstain",
}

export enum VoteResultType {
  APPROVE = "approved",
  REJECT = "rejected",
  CANCEL = "cancelled",
}

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

// Updated ProposalOutcome interface to support both XDR and contract addresses
export interface ProposalOutcome {
  approved: {
    description: string;
    xdr?: string;        
    contract?: string;  
  };
  rejected: {
    description: string;
    xdr?: string;       
    contract?: string;   
  };
  cancelled: {
    description: string;
    xdr?: string;        
    contract?: string;   
  };
}