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
// Import the extracted IPFS functions
import {
  getIpfsBasicLink,
  getProposalLinkFromIpfs,
  getOutcomeLinkFromIpfs,
} from "./ipfsFunctions";

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

// The IPFS functions have been moved to ipfsFunctions.ts
// Re-export them for backward compatibility
export { getIpfsBasicLink, getProposalLinkFromIpfs, getOutcomeLinkFromIpfs };

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

const createModal = (imgSrc: string, title: string, description: string) => {
  const body = document.getElementsByTagName("body")[0];
  if (!body) throw new Error("Body couldn't be found");
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-white/35 backdrop-blur-md flex justify-center items-center z-[9999]";
  modal.onclick = () => body.removeChild(modal);
  const modalContent = document.createElement("div");
  modalContent.className =
    "modal relative p-9 w-[1048px] max-h-[90vh] bg-white shadow-modal";
  modalContent.onclick = (e) => e.stopPropagation();
  modal.appendChild(modalContent);
  const content = document.createElement("div");
  content.className = "flex items-center gap-[18px]";
  const img = document.createElement("img");
  img.src = imgSrc;
  content.appendChild(img);
  const div1 = document.createElement("div");
  div1.className = "flex-grow flex flex-col gap-[30px]";
  const div2 = document.createElement("div");
  div2.className = "flex flex-col gap-3";
  const p1 = document.createElement("p");
  p1.className = "leading-6 text-2xl font-medium text-primary";
  p1.textContent = title;
  div2.appendChild(p1);
  if (description) {
    const p2 = document.createElement("p");
    p2.className = "text-base text-secondary";
    p2.textContent = description;
    div2.appendChild(p2);
  }
  const div3 = document.createElement("div");
  div3.className = "flex justify-end gap-[18px]";
  const cancelButton = document.createElement("button");
  cancelButton.className =
    "p-[18px_36px] bg-[#F5F1F9] leading-5 text-xl text-primary";
  cancelButton.textContent = "Cancel";
  cancelButton.onclick = () => body.removeChild(modal);
  div3.appendChild(cancelButton);
  const okButton = document.createElement("button");
  okButton.className = "p-[18px_36px] bg-primary leading-5 text-xl text-white";
  okButton.textContent = "Ok";
  okButton.onclick = () => body.removeChild(modal);
  div3.appendChild(okButton);
  div1.appendChild(div2);
  div1.appendChild(div3);
  content.appendChild(div1);
  modalContent.append(content);
  const closeButton = document.createElement("button");
  closeButton.className =
    "absolute top-0 right-0 lg:translate-x-1/2 -translate-y-1/2 p-[18px] bg-red cursor-pointer";
  closeButton.onclick = () => body.removeChild(modal);
  const closeSvg = document.createElement("img");
  closeSvg.src = "/icons/cancel-white.svg";
  closeButton.appendChild(closeSvg);
  modalContent.appendChild(closeButton);
  body.appendChild(modal);
};

export const toast = {
  success: (title: string, description: string) => {
    createModal("/images/flower.svg", title, description);
  },
  error: (title: string, description: string) => {
    createModal("/images/wrong.svg", title, description);
  },
};
