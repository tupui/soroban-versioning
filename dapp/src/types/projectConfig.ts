export interface ConfigData {
  projectName: string;
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
    instagram: string;
    facebook: string;
    reddit: string;
  };
  authorGithubNames: string[];
  maintainersAddresses: string[];
}
