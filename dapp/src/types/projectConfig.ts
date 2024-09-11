export interface ConfigData {
  projectName: string;
  logoImageLink: string;
  thumbnailImageLink: string;
  description: string;
  companyName: string;
  officials: {
    websiteLink: string;
    githubLink: string;
  };
  socialLinks: {
    twitter: string;
    telegram: string;
    discord: string;
    instagram: string;
  };
  version: string;
  authorGithubNames: string[];
  maintainersAddresses: string[];
};