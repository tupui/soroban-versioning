export enum ProjectType {
  SOFTWARE = "SOFTWARE",
  GENERIC = "GENERIC"
}

export interface ConfigData {
  projectName: string;
  projectType: ProjectType;
  logoImageLink: string;
  thumbnailImageLink: string;
  description: string;
  organizationName: string;
  officials: {
    websiteLink: string;
    githubLink?: string;
  };
  socialLinks: {
    twitter: string;
    telegram: string;
    discord: string;
  };
  authorHandles: string[];
  maintainersAddresses: string[];
  readmeContent?: string;
}
