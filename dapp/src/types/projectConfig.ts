export interface ConfigData {
  projectName: string; // On-chain name (Soroban Domain identifier)
  projectFullName: string; // Display name from IPFS (ORG_DBA), falls back to projectName
  logoImageLink: string;
  thumbnailImageLink: string;
  description: string;
  organizationName: string;
  officials: {
    websiteLink: string;
    githubLink: string;
  };
  socialLinks: {
    twitter: string;
    telegram: string;
    discord: string;
  };
  authorGithubNames: string[];
  maintainersAddresses: string[];
}
