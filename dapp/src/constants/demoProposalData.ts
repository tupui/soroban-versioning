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
