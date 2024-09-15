export const demoConfigData = [
  {
    projectName: "tansu",
    logoImageLink:
      "https://github.com/tupui/soroban-versioning/blob/main/website/static/img/logo.svg",
    description: "Bringing Git hashes onto Stellar’s blockchain",
    companyName: "Consulting Manao GmbH",
    officials: {
      websiteLink: "https://tansu.dev",
      githubLink: "https://github.com/tupui/soroban-versioning",
    },
    socialLinks: {},
    authorGithubNames: ["tupui"],
    maintainersAddresses: [
      "GCMFQP44AR32S7IRIUKNOEJW5PNWOCLRHLQWSHUCSV4QZOMUXZOVA7Q2",
    ],
  },
  {
    projectName: "scipy",
    description: "SciPy library main repository",
    companyName: "SciPy",
    officials: {
      websiteLink: "https://scipy.org/",
      githubLink: "https://github.com/scipy/scipy",
    },
    socialLinks: {
      twitter: "https://twitter.com/",
      telegram: "https://t.me/",
      discord: "https://discord.gg/",
      instagram: "https://instagram.com/",
    },
    authorGithubNames: ["rgommers", "pv"],
    maintainersAddresses: [
      "GAJCCCRIRR7OQBEMWRYSUKNXQOHQXAMCPBXJYZD3kBLy6KPWxYv3W2C",
      "GDNSSYSCSSJ76FER5WEEXME5G4MTCUBKDRQSKOYP36KUKVDB2VCMERS6",
    ],
  },
  // {
  //   projectName: "salib",
  //   logoImageLink: "https://raw.githubusercontent.com/SALib/SALib/main/docs/assets/logo.png",
  //   description: "Python implementations of commonly used sensitivity analysis methods. Useful in systems modeling to calculate the effects of model inputs or exogenous factors on outputs of interest.",
  //   companyName: " SALib",
  //   officials: {
  //     websiteLink: "http://salib.github.io/SALib/",
  //     githubLink: "https://github.com/SALib/SALib",
  //   },
  //   socialLinks: {
  //     twitter: "https://twitter.com/",
  //     instagram: "https://instagram.com/",
  //   },
  //   authorGithubNames: ["ConnectedSystems","tupui"],
  //   maintainersAddresses: [
  //     "GCUDW6ZF5SCGCMS3QUTELZ6LSAH6IVVXNRPRLAUNJ2XYLCA7KH7ZCVQS",
  //     "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37"
  //   ],
  // },
  // {
  //   projectName: "fff",
  //   logoImageLink: "https://github.com/0xExp-po/soroban-versioning/blob/main/website/static/img/logo.svg",
  //   description: "Bringing Git hashes onto Stellar’s blockchain",
  //   companyName: "Consulting Manao GmbH",
  //   officials: {
  //     websiteLink: "https://tansu.dev",
  //     githubLink: "https://github.com/0xExp-po/soroban-versioning",
  //   },
  //   socialLinks: {
  //   },
  //   authorGithubNames: ["0xExp-po"],
  //   maintainersAddresses: [
  //     "GALDGLKIXR52A5EZTIRZ2IWEZ5PWN55IY2TLA7ORFPG2VVSFVV5PYNOB",
  //   ],
  // },
];

export function getDemoConfigData() {
  return demoConfigData;
}
