export type ProposalStatus = "active" | "rejected" | "cancelled" | "approved";

export type ProposalViewStatus =
  | "active"
  | "rejected"
  | "cancelled"
  | "voted"
  | "approved";

export interface OutcomeContract {
  address: string;
  execute_fn: string;
  args: any[];
}

export interface Proposal {
  id: number;
  title: string;
  ipfs: string;
  proposer: string;
  status: ProposalStatus;
  voting_ends_at: number;
  voteStatus: VoteStatus;
  outcome_contracts?: OutcomeContract[] | null; // Array of [approved, rejected, cancelled] contracts
}

export interface ProposalView {
  id: number;
  title: string;
  proposer: string;
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

export interface ProposalOutcome {
  approved?: {
    description: string;
    xdr?: string; // Optional for backward compatibility
    contract?: OutcomeContract; // New contract-based outcome
  };
  rejected?: {
    description: string;
    xdr?: string; // Optional for backward compatibility
    contract?: OutcomeContract; // New contract-based outcome
  };
  cancelled?: {
    description: string;
    xdr?: string; // Optional for backward compatibility
    contract?: OutcomeContract; // New contract-based outcome
  };
}
