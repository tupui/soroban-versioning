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
    proposalStatus: "voted",
    endDate: "2024-11-9",
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
    projectName: "Tansu",
    maintainers: [
      "GCMFQP44AR32S7IRIUKNOEJW5PNWOCLRHLQWSHUCSV4QZOMUXZOVA7Q2",
      "GDOQ67KNQFEQW27QTLSBD2UWDAGPWVFCK6TP73WF7OS2A3VEYSAZXQWD",
    ],
    ipfsLink:
      "https://bafybeigstnjnededvbckmvlmodpw2m745i5lidmyttb4u7o6ouiudokbx4.ipfs.w3s.link/",
    description:
      "https://bafybeigstnjnededvbckmvlmodpw2m745i5lidmyttb4u7o6ouiudokbx4.ipfs.w3s.link/proposal.md",
    outcome:
      "https://bafybeigstnjnededvbckmvlmodpw2m745i5lidmyttb4u7o6ouiudokbx4.ipfs.w3s.link/outcomes.json",
    status: "voted",
    voteStatus: {
      totalScore: 6,
      approve: {
        voteType: "approve",
        score: 4,
        voters: {
          maintainer: [
            {
              address: "",
              image: null,
              name: "Pamphile Roy",
              github: "https://github.com/tupui",
            },
          ],
          contributor: [
            {
              address: "",
              image: null,
              name: "",
              github: "",
            },
            {
              address: "",
              image: null,
              name: "",
              github: "",
            },
          ],
          community: [
            {
              address: "",
              image: null,
              name: "",
              github: "",
            },
            {
              address: "",
              image: null,
              name: "",
              github: "",
            },
            {
              address: "",
              image: null,
              name: "",
              github: "",
            },
          ],
        },
      },
      reject: {
        voteType: "reject",
        score: 1,
        voters: {
          maintainer: [],
          contributor: [],
          community: [
            {
              address: "",
              image: null,
              name: "",
              github: "",
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
              name: "",
              github: "",
            },
          ],
        },
      },
    },
    endDate: "2024-11-19",
  },
];

export const demoOutcomeData: any = {
  tx: {
    tx: {
      source_account:
        "GBU764PFZXKZUORAUK3IG36Y6OXSLYM6ZERLJA2BZ2Y2GSKNKWL4KKC5",
      fee: 5312486,
      seq_num: 221608492723602976,
      cond: {
        time: {
          min_time: 0,
          max_time: 0,
        },
      },
      memo: "none",
      operations: [
        {
          source_account: null,
          body: {
            invoke_host_function: {
              host_function: {
                invoke_contract: {
                  contract_address:
                    "CC5TSJ3E26YUYGYQKOBNJQLPX4XMUHUY7Q26JX53CJ2YUIZB5HVXXRV6",
                  function_name: "mine",
                  args: [
                    {
                      bytes:
                        "000000ea80a23b9340abb81e22ebe2c84783896eab4ab047ebc006f9ca54fb66",
                    },
                    {
                      string: "TANSU28",
                    },
                    {
                      u64: 1188896,
                    },
                    {
                      address:
                        "GBU764PFZXKZUORAUK3IG36Y6OXSLYM6ZERLJA2BZ2Y2GSKNKWL4KKC5",
                    },
                  ],
                },
              },
              auth: [
                {
                  credentials: "source_account",
                  root_invocation: {
                    function: {
                      contract_fn: {
                        contract_address:
                          "CC5TSJ3E26YUYGYQKOBNJQLPX4XMUHUY7Q26JX53CJ2YUIZB5HVXXRV6",
                        function_name: "mine",
                        args: [
                          {
                            bytes:
                              "000000ea80a23b9340abb81e22ebe2c84783896eab4ab047ebc006f9ca54fb66",
                          },
                          {
                            string: "TANSU28",
                          },
                          {
                            u64: 1188896,
                          },
                          {
                            address:
                              "GBU764PFZXKZUORAUK3IG36Y6OXSLYM6ZERLJA2BZ2Y2GSKNKWL4KKC5",
                          },
                        ],
                      },
                    },
                    sub_invocations: [],
                  },
                },
              ],
            },
          },
        },
      ],
      ext: {
        v1: {
          ext: "v0",
          resources: {
            footprint: {
              read_only: [
                {
                  contract_data: {
                    contract:
                      "CC2D4LQAWPMGD5A7XJHF5KN3A5QYJGQJS3VSFXR6TKTH6ZUR5RUFCYCW",
                    key: "ledger_key_contract_instance",
                    durability: "persistent",
                  },
                },
              ],
              read_write: [
                {
                  trustline: {
                    account_id:
                      "GDNMPUEOS27LYEG4HS74RHLFWO325JMIDEAP67QOVYJBJC6XSGE4E5ST",
                    asset: {
                      credit_alphanum4: {
                        asset_code: "FCM",
                        issuer:
                          "GD765M4FIG4C4CGWUFDPD2QCWKISYRLBRIYMLSILCCTPY7DEGGUKPFBE",
                      },
                    },
                  },
                },
                {
                  contract_data: {
                    contract:
                      "CC5TSJ3E26YUYGYQKOBNJQLPX4XMUHUY7Q26JX53CJ2YUIZB5HVXXRV6",
                    key: {
                      vec: [
                        {
                          symbol: "Block",
                        },
                        {
                          u64: 4211,
                        },
                      ],
                    },
                    durability: "persistent",
                  },
                },
              ],
            },
            instructions: 5000000,
            read_bytes: 25000,
            write_bytes: 1200,
          },
          resource_fee: 5312386,
        },
      },
    },
    signatures: [],
  },
};
