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

export { fetchProposalFromIPFS };
