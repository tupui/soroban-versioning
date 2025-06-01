import axios from "axios";
import {
  getIpfsBasicLink,
  getOutcomeLinkFromIpfs,
  getProposalLinkFromIpfs,
} from "utils/utils";
import { toast } from "utils/utils";

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
    // Don't show error toast for IPFS failures as they may be expected
    // For example, if the proposal hasn't been uploaded yet
    return null;
  }
}

async function fetchOutcomeDataFromIPFS(url: string) {
  try {
    const outcomeUrl = getOutcomeLinkFromIpfs(url);
    const response = await axios.get(outcomeUrl);
    return response.data;
  } catch (error) {
    // Don't show error toast for IPFS failures as they may be expected
    // For example, if the outcome data hasn't been uploaded yet
    return null;
  }
}

export { fetchProposalFromIPFS, fetchOutcomeDataFromIPFS };
