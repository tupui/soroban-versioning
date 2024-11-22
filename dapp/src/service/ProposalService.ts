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
    let content = response.data;

    const basicUrl = getIpfsBasicLink(url);
    content = content.replace(
      /!\[([^\]]*)\]\(([^http][^)]+)\)/g,
      `![$1](${basicUrl}$2)`,
    );

    return content;
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
