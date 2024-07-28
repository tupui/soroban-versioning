import asyncio

from tansu.events.ingest import events_to_db, fetch_events

contract_id = "CC3JCYWHNMPMQTOQUNDCJSCFSWRFZIE2JVSAUEXEG56DMKOMI3RL7VOH"
start_ledger = None

events, _ = fetch_events(contract_id=contract_id, start_ledger=start_ledger)

print(events)

asyncio.run(events_to_db(events))
