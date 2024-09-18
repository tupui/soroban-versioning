import asyncio

from tansu.events.ingest import events_to_db, fetch_events

contract_id = "CCYM5OC6RTMEUHRK2BRU5YX4G4O745DPLPU4EXVTRCUN7JRJJWXEEXAB"
start_ledger = None

events, _ = fetch_events(contract_id=contract_id, start_ledger=start_ledger)

print(events)

asyncio.run(events_to_db(events))
