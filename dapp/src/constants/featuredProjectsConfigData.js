export const featuredProjectsConfigData = [
  {
    projectName: "tansu",
    logoImageLink:
      "https://github.com/tupui/soroban-versioning/blob/main/website/static/img/logo.svg",
    description: "Bringing Git hashes onto Stellar's blockchain",
    organizationName: "Consulting Manao GmbH",
    officials: {
      websiteLink: "https://tansu.dev",
      githubLink: "https://github.com/tupui/soroban-versioning",
    },
    socialLinks: {},
    authorGithubNames: ["tupui"],
    maintainersAddresses: [import.meta.env.PUBLIC_TANSU_OWNER_ID],
  },
];

export function getFeaturedProjectsConfigData() {
  return featuredProjectsConfigData;
}
