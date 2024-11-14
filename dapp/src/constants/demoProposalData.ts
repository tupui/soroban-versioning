import type { Proposal, ProposalCardProps } from "types/proposal";

export const demoProposalCardData: ProposalCardProps[] = [
  {
    proposalNumber: 10,
    proposalTitle: "Issue Bounty: Addition of DAO system to Tansu - $3000",
    proposalStatus: "active",
    endDate: "2024-11-24",
  },
  {
    proposalNumber: 9,
    proposalTitle: "Proposal Nine",
    proposalStatus: "cancelled",
    endDate: null,
  },
  {
    proposalNumber: 8,
    proposalTitle: "Proposal Eight",
    proposalStatus: "active",
    endDate: "2024-11-21",
  },
  {
    proposalNumber: 7,
    proposalTitle: "Proposal Seven",
    proposalStatus: "active",
    endDate: "2024-11-18",
  },
  {
    proposalNumber: 6,
    proposalTitle: "Proposal Six",
    proposalStatus: "rejected",
    endDate: "2024-11-10",
  },
  {
    proposalNumber: 5,
    proposalTitle: "Proposal Five",
    proposalStatus: "cancelled",
    endDate: null,
  },
  {
    proposalNumber: 4,
    proposalTitle: "Proposal Four",
    proposalStatus: "approved",
    endDate: "2023-10-30",
  },
  {
    proposalNumber: 3,
    proposalTitle: "Proposal Three",
    proposalStatus: "approved",
    endDate: "2023-9-30",
  },
  {
    proposalNumber: 2,
    proposalTitle: "Proposal Two",
    proposalStatus: "rejected",
    endDate: "2023-8-15",
  },
  {
    proposalNumber: 1,
    proposalTitle: "Proposal One",
    proposalStatus: "rejected",
    endDate: "2023-6-01",
  },
];

export const demoProposalData: Proposal[] = [
  {
    id: 1,
    title: "Issue Bounty: Add DAO system to the project - $3000",
    ipfsLink:
      "https://bafybeidsfg2rfmpgtisfnmk6lur5dmy6j4kwjblh2rhme6nrsvjcaci4jq.ipfs.w3s.link/",
    description:
      "https://bafybeidsfg2rfmpgtisfnmk6lur5dmy6j4kwjblh2rhme6nrsvjcaci4jq.ipfs.w3s.link/proposal.md",
    outcome: "",
    status: "active",
    voteStatus: {
      totalScore: 6,
      interest: {
        voteType: "interest",
        score: 4,
        voters: {
          maintainer: [
            {
              address: "",
              image: null,
            },
          ],
          contributor: [
            {
              address: "",
              image: null,
            },
            {
              address: "",
              image: null,
            },
          ],
          community: [
            {
              address: "",
              image: null,
            },
            {
              address: "",
              image: null,
            },
            {
              address: "",
              image: null,
            },
          ],
        },
      },
      conflict: {
        voteType: "conflict",
        score: 1,
        voters: {
          maintainer: [],
          contributor: [],
          community: [
            {
              address: "",
              image: null,
            },
          ],
        },
      },
      abstain: {
        voteType: "abstain",
        score: 1,
        voters: {
          maintainer: [],
          contributor: [],
          community: [
            {
              address: "",
              image: null,
            },
          ],
        },
      },
    },
    endDate: "2024-11-24",
  },
];
