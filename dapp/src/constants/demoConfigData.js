export const demoConfigData = [
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
  {
    projectName: "SALib",
    logoImageLink:
      "https://raw.githubusercontent.com/SALib/SALib/main/docs/assets/logo.png",
    description: "Sensitivity Analysis Library in Python",
    organizationName: "SALib",
    officials: {
      websiteLink: "https://salib.readthedocs.io/",
      githubLink: "https://github.com/SALib/SALib",
    },
    socialLinks: {},
    authorGithubNames: ["tupui"],
    maintainersAddresses: [import.meta.env.PUBLIC_TANSU_OWNER_ID],
  },
];

export function getDemoConfigData() {
  return demoConfigData;
}
