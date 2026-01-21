export const featuredProjectsConfigData = [
  {
    projectName: "Tansu - Git on Stellar",
    domainName: "tansu", // Soroban Domain name (on-chain identifier)
    logoImageLink:
      "https://github.com/tupui/soroban-versioning/blob/main/website/static/img/logo.svg",
    description: "Decentralized project governance on Stellar",
    organizationName: "Consulting Manao GmbH",
    officials: {
      websiteLink: "https://tansu.dev",
      githubLink: "https://github.com/tupui/soroban-versioning",
    },
    socialLinks: {},
    authorGithubNames: ["tupui"],
    maintainersAddresses: [
      "GD4FXNCYPQWNDWZYZZD4WFYYFTP466IKAKCZOYE5TPFTSSOZDA4QF3ER",
    ],
  },
];

export function getFeaturedProjectsConfigData() {
  return featuredProjectsConfigData;
}
