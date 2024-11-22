import { TransactionBuilder } from "@stellar/stellar-sdk";
import type { ProposalStatus, ProposalViewStatus } from "types/proposal";

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

export function extractConfigData(tomlData: any, projectName: string) {
  return {
    projectName: projectName,
    logoImageLink: tomlData.DOCUMENTATION?.ORG_LOGO || "",
    thumbnailImageLink: tomlData.DOCUMENTATION?.ORG_THUMBNAIL || "",
    description: tomlData.DOCUMENTATION?.ORG_DESCRIPTION || "",
    organizationName: tomlData.DOCUMENTATION?.ORG_NAME || "",
    officials: {
      websiteLink: tomlData.DOCUMENTATION?.ORG_URL || "",
      githubLink: tomlData.DOCUMENTATION?.ORG_GITHUB || "",
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
  let trxFromXdr;
  try {
    trxFromXdr = TransactionBuilder.fromXDR(
      xdrData,
      import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
    );
  } catch (error) {
    console.error("Error decoding XDR:", error);
  }

  return trxFromXdr;
};

export const modifySlashInXdr = (xdr: string) => {
  return xdr.replaceAll("/", "//");
};

export const getIpfsBasicLink = (ipfsLink: string) => {
  return `https://${ipfsLink}.ipfs.w3s.link/`;
};

export const getProposalLinkFromIpfs = (ipfsLink: string) => {
  return `https://${ipfsLink}.ipfs.w3s.link/proposal.md`;
};

export const getOutcomeLinkFromIpfs = (ipfsLink: string) => {
  return `https://${ipfsLink}.ipfs.w3s.link/outcomes.json`;
};

export const modifyProposalStatusToView = (
  status: ProposalStatus,
  endDate: string | null,
): ProposalViewStatus => {
  if (status === "accepted") {
    return "approved";
  }
  if (status === "active") {
    if (endDate !== null) {
      const endDateTimestamp = new Date(endDate).setHours(0, 0, 0, 0);
      const currentTime = new Date().setHours(0, 0, 0, 0);
      if (endDateTimestamp < currentTime) {
        return "voted";
      }
      return "active";
    }
  }
  return status;
};
