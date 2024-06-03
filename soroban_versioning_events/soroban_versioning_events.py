from ingest import events_to_db, fetch_events

contract_id = "CAHCQFBMZIY6Y6QPHPN2N64QVKIA6CTGTWBS3SNNIRCATRBANAV3NHWK"
start_ledger = None

events, _ = fetch_events(contract_id=contract_id, start_ledger=start_ledger)

print(events)

events_to_db(events)
