import { TransactionBuilder } from "@stellar/stellar-sdk";
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

export function isValidGithubUrl(url: string) {
  return /^https:\/\/github\.com\/[^\/]+\/[^\/]+$/.test(url);
}

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
  return {
    projectName: project.name,
    logoImageLink: tomlData.DOCUMENTATION?.ORG_LOGO || "",
    thumbnailImageLink: tomlData.DOCUMENTATION?.ORG_THUMBNAIL || "",
    description: tomlData.DOCUMENTATION?.ORG_DESCRIPTION || "",
    organizationName: tomlData.DOCUMENTATION?.ORG_NAME || "",
    officials: {
      websiteLink: tomlData.DOCUMENTATION?.ORG_URL || "",
      githubLink: project.config.url || "",
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
    authorGithubNames:
      tomlData.PRINCIPALS?.map((p: { github: string }) => p.github) || [],
    maintainersAddresses: tomlData.ACCOUNTS || [],
  };
}

export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const processDecodedData = (xdrData: string): any => {
  try {
    return TransactionBuilder.fromXDR(
      xdrData,
      import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
    );
  } catch (error) {
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
    const voters_approve = proposal.vote_data.votes
      .filter(
        (vote: Vote) =>
          vote.tag === "PublicVote" &&
          vote.values[0].vote_choice.tag === "Approve",
      )
      .map((vote: Vote) => vote.values[0].address);
    const voters_reject = proposal.vote_data.votes
      .filter(
        (vote: Vote) =>
          vote.tag === "PublicVote" &&
          vote.values[0].vote_choice.tag === "Reject",
      )
      .map((vote: Vote) => vote.values[0].address);
    const voters_abstain = proposal.vote_data.votes
      .filter(
        (vote: Vote) =>
          vote.tag === "PublicVote" &&
          vote.values[0].vote_choice.tag === "Abstain",
      )
      .map((vote: Vote) => vote.values[0].address);

    return {
      id: proposal.id,
      title: proposal.title,
      ipfs: proposal.ipfs,
      status: proposal.status.tag.toLocaleLowerCase() as ProposalStatus,
      voting_ends_at: Number(proposal.vote_data.voting_ends_at),
      voteStatus: {
        approve: {
          voteType: VoteType.APPROVE,
          score: voters_approve.length,
          voters: voters_approve.map((voter: string) => {
            return {
              address: voter,
              image: null,
              name: "",
              github: "",
            };
          }),
        },
        reject: {
          voteType: VoteType.REJECT,
          score: voters_reject.length,
          voters: voters_reject.map((voter: string) => {
            return {
              address: voter,
              image: null,
              name: "",
              github: "",
            };
          }),
        },
        abstain: {
          voteType: VoteType.CANCEL,
          score: voters_abstain.length,
          voters: voters_abstain.map((voter: string) => {
            return {
              address: voter,
              image: null,
              name: "",
              github: "",
            };
          }),
        },
      },
    };
  }
  throw new Error("this is anonymous vote. current not working.");
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
        renderToastModal("/images/flower.svg", title, description);
      })
      .catch((err) => {
        console.error("Failed to show success toast:", err);
      });
  },
  error: (title: string, description: string) => {
    import("./toastHelper")
      .then(({ renderToastModal }) => {
        renderToastModal("/images/wrong.svg", title, description);
      })
      .catch((err) => {
        console.error("Failed to show error toast:", err);
      });
  },
};
