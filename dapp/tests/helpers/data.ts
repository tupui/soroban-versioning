export const WALLET_PK =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

export const MOCK_PROJECT = {
  name: "demo",
  description: "Demo project description",
  config_url: "https://github.com/demo/demo",
  config_ipfs: "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
  maintainers: [WALLET_PK],
  commits: ["6663520bd9e6ede248fef8157b2af0b6b6b41046"],
  badges: {
    developer: [WALLET_PK],
    triage: [],
    community: [WALLET_PK],
    verified: [WALLET_PK],
  },
};

export const MOCK_PROPOSAL = {
  id: 1,
  title: "Test Proposal",
  ipfs: "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
  status: "Active",
  vote_data: {
    public_voting: true,
    voting_ends_at: Math.floor(Date.now() / 1000) + 3600,
    votes: [],
  },
};

export const MOCK_MEMBER = {
  member_address: WALLET_PK,
  meta: "QmTestCID123mockipfs456789abcdef",
  projects: [
    {
      project: new Uint8Array([116, 101, 115, 116]), // "test" in bytes
      badges: ["Developer", "Community", "Verified"],
    },
  ],
};
