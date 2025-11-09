import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
// NEW IMPORTS FOR STELLAR WALLETS KIT
import {
  StellarWalletsKit,
  XBullWalletAdapter,
  FreighterWalletAdapter,
  LitemintWalletAdapter,
  WalletAdapterNetwork,
  type Adapter,
} from "@stellar/wallets-kit";

export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

// Re-export key components from Stellar Wallets Kit for consumer convenience
export {
  StellarWalletsKit,
  XBullWalletAdapter,
  FreighterWalletAdapter,
  LitemintWalletAdapter,
  WalletAdapterNetwork,
  type Adapter,
};

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}

// NEW STELLAR WALLETS KIT INTEGRATION

/**
 * Configuration options for initializing the Stellar Wallets Kit.
 */
export interface StellarWalletsKitOptions {
  /**
   * The Stellar network to connect to.
   * @default WalletAdapterNetwork.futurenet
   */
  network?: WalletAdapterNetwork;

  /**
   * An array of wallet adapters to support.
   * Defaults to [XBullWalletAdapter, FreighterWalletAdapter, LitemintWalletAdapter].
   */
  adapters?: Adapter[];
}

/**
 * Initializes and returns a new instance of StellarWalletsKit.
 * This allows the consuming application to configure the wallet kit as needed,
 * promoting loose coupling and testability.
 *
 * @param {StellarWalletsKitOptions} [options] - Optional configuration for the wallet kit.
 * @returns {StellarWalletsKit} A configured instance of StellarWalletsKit.
 */
export function initializeStellarWalletsKit(
  options: StellarWalletsKitOptions = {}
): StellarWalletsKit {
  const {
    network = WalletAdapterNetwork.futurenet,
    adapters = [
      new XBullWalletAdapter(),
      new FreighterWalletAdapter(),
      new LitemintWalletAdapter(),
    ],
  } = options;

  return new StellarWalletsKit({
    network,
    adapters,
  });
}

export const ContractErrors = {
  0: { message: "UnexpectedError" },
  1: { message: "InvalidKey" },
  2: { message: "ProjectAlreadyExist" },
  3: { message: "UnauthorizedSigner" },
  4: { message: "NoHashFound" },
  5: { message: "InvalidDomainError" },
  6: { message: "MaintainerNotDomainOwner" },
  7: { message: "ProposalInputValidation" },
  8: { message: "NoProposalorPageFound" },
  9: { message: "AlreadyVoted" },
  10: { message: "ProposalVotingTime" },
  11: { message: "ProposalActive" },
  12: { message: "WrongVoteType" },
  13: { message: "WrongVoter" },
  14: { message: "TallySeedError" },
  15: { message: "InvalidProof" },
  16: { message: "NoAnonymousVotingConfig" },
  17: { message: "BadCommitment" },
  18: { message: "UnknownMember" },
  19: { message: "MemberAlreadyExist" },
  20: { message: "VoterWeight" },
  21: { message: "VoteLimitExceeded" },
  22: { message: "ContractPaused" },
  23: { message: "UpgradeError" },
  24: { message: "ContractValidation" },
  25: { message: "CollateralError" },
};

export interface Contract {
  address: string;
  wasm_hash: Option<Buffer>;
}

export type ContractKey =
  | { tag: "DomainContract"; values: void }
  | { tag: "CollateralContract"; values: void };

export type DataKey =
  | { tag: "Member"; values: readonly [string] }
  | { tag: "Paused"; values: void }
  | { tag: "UpgradeProposal"; values: void }
  | { tag: "AdminsConfig"; values: void };

export interface Badges {
  community: Array<string>;
  developer: Array<string>;
  triage: Array<string>;
  verified: Array<string>;
}

export enum Badge {
  Developer = 10000000,
  Triage = 5000000,
  Community = 1000000,
  Verified = 500000,
  Default = 1,
}

export interface ProjectBadges {
  badges: Array<Badge>;
  project: Buffer;
}

export interface Member {
  meta: string;
  projects: Array<ProjectBadges>;
}

export type ProposalStatus =
  | { tag: "Active"; values: void }
  | { tag: "Approved"; values: void }
  | { tag: "Rejected"; values: void }
  | { tag: "Cancelled"; values: void }
  | { tag: "Malicious"; values: void };

export type Vote =
  | { tag: "PublicVote"; values: readonly [PublicVote] }
  | { tag: "AnonymousVote"; values: readonly [AnonymousVote] };

export type VoteChoice =
  | { tag: "Approve"; values: void }
  | { tag: "Reject"; values: void }
  | { tag: "Abstain"; values: void };

export interface PublicVote {
  address: string;
  vote_choice: VoteChoice;
  weight: u32;
}

export interface AnonymousVote {
  address: string;
  commitments: Array<Buffer>;
  encrypted_seeds: Array<string>;
  encrypted_votes: Array<string>;
  weight: u32;
}

export interface VoteData {
  public_voting: boolean;
  votes: Array<Vote>;
  voting_ends_at: u64;
}

export interface AnonymousVoteConfig {
  public_key: string;
  seed_generator_point: Buffer;
  vote_generator_point: Buffer;
}

export interface AdminsConfig {
  admins: Array<string>;
  threshold: u32;
}

export interface UpgradeProposal {
  admins_config: AdminsConfig;
  approvals: Array<string>;
  executable_at: u64;
  wasm_hash: Buffer;
}

export interface Proposal {
  id: u32;
  ipfs: string;
  outcomes_contract: Option<string>;
  proposer: string;
  status: ProposalStatus;
  title: string;
  vote_data: VoteData;
}

export interface Dao {
  proposals: Array<Proposal>;
}

export type ProjectKey =
  | { tag: "Key"; values: readonly [Buffer] }
  | { tag: "Badges"; values: readonly [Buffer] }
  | { tag: "LastHash"; values: readonly [Buffer] }
  | { tag: "Dao"; values: readonly [Buffer, u32] }
  | { tag: "DaoTotalProposals"; values: readonly [Buffer] }
  | { tag: "AnonymousVoteConfig"; values: readonly [Buffer] };

export interface Config {
  ipfs: string;
  url: string;
}

export interface Project {
  config: Config;
  maintainers: Array<string>;
  name: string;
}

export interface Client {
  /**
   * Construct and simulate a anonymous_voting_setup transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Setup anonymous voting for a project.
   *
   * Configures BLS12-381 cryptographic primitives for anonymous voting.
   * Only the contract admin can call this function.
   *
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - Unique identifier for the project
   * * `public_key` - Asymmetric public key to be used for vote encryption
   *
   * # Panics
   * * If the caller is not the contract admin
   */
  anonymous_voting_setup: (
    {
      maintainer,
      project_key,
      public_key,
    }: { maintainer: string; project_key: Buffer; public_key: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a get_anonymous_voting_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the anonymous voting configuration for a project.
   *
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - The project key identifier
   *
   * # Returns
   * * `types::AnonymousVoteConfig` - The anonymous voting configuration
   *
   * # Panics
   * * If no anonymous voting configuration exists for the project
   */
  get_anonymous_voting_config: (
    { project_key }: { project_key: Buffer },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the tran