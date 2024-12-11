import axios from "axios";
import {
  getIpfsBasicLink,
  getOutcomeLinkFromIpfs,
  getProposalLinkFromIpfs,
} from "utils/utils";

async function fetchProposalFromIPFS(url: string) {
  try {
    const proposalUrl = getProposalLinkFromIpfs(url);
    const response = await axios.get(proposalUrl);
    const content = response.data;

    const basicUrl = getIpfsBasicLink(url);

    const updatedContent = content.replace(
      /!\[([^\]]*)\]\(([^http][^)]+|[^)]+)\)/g,
      `![$1](${basicUrl}/$2)`,
    );

    return updatedContent;
  } catch (error) {
    console.error("Error fetching the IPFS file:", error);
    throw error;
  }
}

async function fetchOutcomeDataFromIPFS(url: string) {
  try {
    const outcomeUrl = getOutcomeLinkFromIpfs(url);
    const response = await axios.get(outcomeUrl);
    return response.data;
  } catch (error) {
    console.error("Error fetching the outcomes data from IPFS:", error);
    throw error;
  }
}

export { fetchProposalFromIPFS, fetchOutcomeDataFromIPFS };
