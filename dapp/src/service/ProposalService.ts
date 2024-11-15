import axios from "axios";

async function fetchProposalFromIPFS(url: string) {
  try {
    const response = await axios.get(
      url.endsWith("/") ? `${url}proposal.md` : `${url}/proposal.md`,
    );
    let content = response.data;
    content = content.replace(
      /!\[([^\]]*)\]\(([^http][^)]+)\)/g,
      `![$1](${url}$2)`,
    );
    return content;
  } catch (error) {
    console.error("Error fetching the IPFS file:", error);
    throw error;
  }
}

async function fetchOutcomeDataFromIPFS(baseUrl: string) {
  try {
    const response = await axios.get(`${baseUrl}/outcomes.json`);
    return response.data;
  } catch (error) {
    console.error("Error fetching the outcomes data from IPFS:", error);
    throw error;
  }
}

export { fetchProposalFromIPFS, fetchOutcomeDataFromIPFS };
