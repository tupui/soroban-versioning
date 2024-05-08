import json
import uuid

import httpx


def events(contract_id: str, start_ledger: int | None = None):
    with httpx.Client() as session:
        if start_ledger is None:
            res = httpx.post(
                "https://soroban-testnet.stellar.org",
                json={"jsonrpc": "2.0", "id": uuid.uuid4().hex,
                      "method": "getLatestLedger"},
            )
            res.raise_for_status()
            last_ledger = res.json()["result"]["sequence"]
            start_ledger = int(last_ledger-(3600 / 6 * 20))  # around 20h back

        res = session.post(
            "https://soroban-testnet.stellar.org",
            json={
                "jsonrpc": "2.0",
                "id": uuid.uuid4().hex,
                "method": "getEvents",
                "params": {
                    "startLedger": start_ledger,
                    "filters": [
                        {
                            "type": "contract",
                            "contractIds": [contract_id],
                            "topics": [["*", "*"]],
                        }
                    ],
                },
            },
        )
        res.raise_for_status()
        res = res.json()  # ["result"]
        print(json.dumps(res, indent=4))


contract_id = "CAHCQFBMZIY6Y6QPHPN2N64QVKIA6CTGTWBS3SNNIRCATRBANAV3NHWK"
start_ledger = None  # 1499300

events(contract_id=contract_id, start_ledger=start_ledger)

# import stellar_sdk
# from stellar_sdk.soroban_rpc import EventFilter, EventFilterType
#
# soroban_server = stellar_sdk.SorobanServer()
# soroban_server.get_events(
#     1499300, filters=[
#         EventFilter(
#             event_type=EventFilterType.CONTRACT,
#             contract_ids=[
#                 "CAHCQFBMZIY6Y6QPHPN2N64QVKIA6CTGTWBS3SNNIRCATRBANAV3NHWK"
#             ],
#             topics=[
#                 ["*", "*"],
#             ],
#         )
#     ]
# )


# import binascii

# 'AAAADwAAAAZjb21taXQAAA=='
# 'AAAADQAAACCa/N5K2SsdROdFe/OAy7D47x6z81F+57cvQ763w7wCrA=='
# 'AAAADQAAABTF7kUFjfiSWLEGkJ0tlC0w0SMASA=='

# stellar_sdk.xdr.sc_val.SCVal.from_xdr().bytes.sc_bytes
# binascii.b2a_hex()

# stellar_sdk.xdr.sc_val.SCVal.from_xdr().sym.sc_symbol
# decode
