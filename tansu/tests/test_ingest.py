from tansu.events.database import db_models
from tansu.events.ingest import fetch_events

CONTRACT_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"


def test_fetch_events():
    events, last_ledger = fetch_events(contract_id=CONTRACT_ID)
    assert isinstance(events[0], db_models.Event)
    assert isinstance(last_ledger, int)
