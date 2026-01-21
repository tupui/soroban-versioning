export interface ConfigData {
  projectName: string; // Display name from IPFS (PROJECT_NAME), falls back to domainName
  domainName: string; // Soroban Domain name (on-chain identifier, max 15 chars)
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
