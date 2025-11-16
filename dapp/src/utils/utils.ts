import * as StellarSdk from "@stellar/stellar-sdk";
import type {
  Proposal as ContractProposal,
  Project,
} from "../../packages/tansu";
import type { Vote } from "../../packages/tansu";
import {
  VoteType,
  type Proposal,
  type ProposalStatus,
  type ProposalView,
  type ProposalViewStatus,
} from "types/proposal";
// Import the extracted IPFS functions have been moved to ipfsFunctions.ts

export function truncateMiddle(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  const ellipsis = "...";
  const charsToShow = maxLength - ellipsis.length;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return (
    str.substring(0, frontChars) +
    ellipsis +
    str.substring(str.length - backChars)
  );
}

export function extractConfigData(tomlData: any, project: Project) {
  const projectType = tomlData.PROJECT_TYPE || "SOFTWARE";

  const authorHandles = tomlData.PRINCIPALS?.map((p: { github?: string; handle?: string }) =>
    p.handle || p.github || ""
  ) || [];

  return {
    projectName: project.name,
    projectType: projectType,
    logoImageLink: tomlData.DOCUMENTATION?.ORG_LOGO || "",
    thumbnailImageLink: tomlData.DOCUMENTATION?.ORG_THUMBNAIL || "",
    description: tomlData.DOCUMENTATION?.ORG_DESCRIPTION || "",
    organizationName: tomlData.DOCUMENTATION?.ORG_NAME || "",
    officials: {
      websiteLink: tomlData.DOCUMENTATION?.ORG_URL || "",
      githubLink: tomlData.DOCUMENTATION?.ORG_GITHUB
        ? `https://github.com/${tomlData.DOCUMENTATION.ORG_GITHUB}`
        : project.config.url || "",
    },
    socialLinks: {
      ...(tomlData.DOCUMENTATION?.ORG_TWITTER && {
        twitter: tomlData.DOCUMENTATION.ORG_TWITTER,
      }),
      ...(tomlData.DOCUMENTATION?.ORG_TELEGRAM && {
        telegram: tomlData.DOCUMENTATION.ORG_TELEGRAM,
      }),
      ...(tomlData.DOCUMENTATION?.ORG_DISCORD && {
        discord: tomlData.DOCUMENTATION.ORG_DISCORD,
      }),
    },
    authorHandles: authorHandles,
    maintainersAddresses: tomlData.ACCOUNTS || [],
    readmeContent: tomlData.README_CONTENT || undefined,
  };
}

export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const processDecodedData = (xdrData: string): any => {
  try {
    return StellarSdk.TransactionBuilder.fromXDR(
      xdrData,
      import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
    );
  } catch {
    // Don't log to console, just return null to indicate failure
    return null;
  }
};

export const modifySlashInXdr = (xdr: string) => {
  return xdr.replaceAll("/", "//");
};

// IPFS functions are now directly imported from ipfsFunctions.ts

export const modifyProposalStatusToView = (
  status: ProposalStatus,
  endDate: number,
): ProposalViewStatus => {
  if (status === "approved") {
    return "approved";
  }
  if (status === "active") {
    if (endDate !== null) {
      const endDateTimestamp = new Date(endDate * 1000);
      const currentTime = new Date();

      if (endDateTimestamp < currentTime) {
        return "voted";
      }
      return "active";
    }
  }
  return status;
};

export const modifyProposalToView = (
  proposal: Proposal,
  projectName: string,
): ProposalView => {
  const proposalStatusView = modifyProposalStatusToView(
    proposal.status,
    proposal.voting_ends_at,
  );
  const proposalView: ProposalView = {
    id: proposal.id,
    title: proposal.title,
    proposer: proposal.proposer,
    projectName: projectName,
    ipfsLink: proposal.ipfs,
    endDate: proposal.voting_ends_at,
    voteStatus: proposal.voteStatus,
    status: proposalStatusView as ProposalViewStatus,
  };

  return proposalView;
};

export const modifyProposalFromContract = (
  proposal: ContractProposal,
): Proposal => {
  if (proposal.vote_data.public_voting) {
    const publicVotes = proposal.vote_data.votes.filter(
      (v: Vote) => v.tag === "PublicVote",
    );

    // Filter out invalid votes once at the top
    const validVotes = publicVotes.filter((v: Vote) => {
      const voteData = (v as any).values?.[0];
      return voteData?.vote_choice?.tag && voteData?.address;
    });

    const voters_approve = validVotes.filter((v: Vote) => {
      const voteData = (v as any).values?.[0];
      return voteData.vote_choice.tag === "Approve";
    });
    const voters_reject = validVotes.filter((v: Vote) => {
      const voteData = (v as any).values?.[0];
      return voteData.vote_choice.tag === "Reject";
    });
    const voters_abstain = validVotes.filter((v: Vote) => {
      const voteData = (v as any).values?.[0];
      return voteData.vote_choice.tag === "Abstain";
    });

    const sumWeight = (arr: Vote[]) =>
      arr.reduce((acc, v) => {
        const voteData = (v as any).values?.[0];
        return acc + (voteData.weight ?? 1);
      }, 0);

    return {
      id: proposal.id,
      title: proposal.title,
      ipfs: proposal.ipfs,
      proposer: proposal.proposer,
      status: proposal.status.tag.toLocaleLowerCase() as ProposalStatus,
      voting_ends_at: Number(proposal.vote_data.voting_ends_at),
      outcomes_contract: proposal.outcomes_contract || null,
      voteStatus: {
        approve: {
          voteType: VoteType.APPROVE,
          score: sumWeight(voters_approve),
          voters: voters_approve.map((voter: Vote) => {
            const voteData = (voter as any).values?.[0];
            return {
              address: voteData.address,
              image: null,
              name: "",
              github: "",
            };
          }),
        },
        reject: {
          voteType: VoteType.REJECT,
          score: sumWeight(voters_reject),
          voters: voters_reject.map((voter: Vote) => {
            const voteData = (voter as any).values?.[0];
            return {
              address: voteData.address,
              image: null,
              name: "",
              github: "",
            };
          }),
        },
        abstain: {
          voteType: VoteType.CANCEL,
          score: sumWeight(voters_abstain),
          voters: voters_abstain.map((voter: Vote) => {
            const voteData = (voter as any).values?.[0];
            return {
              address: voteData.address,
              image: null,
              name: "",
              github: "",
            };
          }),
        },
      },
    };
  }
  // Anonymous voting – individual vote choices are hidden until execution.
  // We cannot compute precise tallies client-side before the proposal is executed,
  // therefore expose zeroed scores and empty voter arrays so the UI can still
  // render the proposal card and details without breaking.

  return {
    id: proposal.id,
    title: proposal.title,
    ipfs: proposal.ipfs,
    proposer: proposal.proposer,
    status: proposal.status.tag.toLocaleLowerCase() as ProposalStatus,
    voting_ends_at: Number(proposal.vote_data.voting_ends_at),
    outcomes_contract: proposal.outcomes_contract || null,
    voteStatus: {
      approve: { voteType: VoteType.APPROVE, score: 0, voters: [] },
      reject: { voteType: VoteType.REJECT, score: 0, voters: [] },
      abstain: { voteType: VoteType.CANCEL, score: 0, voters: [] },
    },
  } as Proposal;
};

/**
 * Toast notification system
 *
 * This object provides methods for showing toast notifications.
 * Under the hood, it creates a React root and renders a Modal component.
 */
export const toast = {
  success: (title: string, description: string) => {
    import("./toastHelper")
      .then(({ renderToastModal }) => {
        renderToastModal("/images/flower.svg", title, description, true);
      })
      .catch((_err) => {});
  },
  error: (title: string, description: string) => {
    import("./toastHelper")
      .then(({ renderToastModal }) => {
        renderToastModal("/images/wrong.svg", title, description, false);
      })
      .catch((_err) => {});
  },
};
