import asyncio

from tansu.events.ingest import events_to_db, fetch_events

contract_id = "CAP52ERGUZ65UNPHP36CQBHYUPEUG2TT4NPVEV7CREWRT7UCPD7PRWEE"
start_ledger = None

events, _ = fetch_events(contract_id=contract_id, start_ledger=start_ledger)

print(events)

asyncio.run(events_to_db(events))
