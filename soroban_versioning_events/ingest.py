import stellar_sdk
import stellar_sdk.xdr
from stellar_sdk.soroban_rpc import EventFilter, EventFilterType

from database import db_models
from database.session_factory import Warehouse
import models


def fetch_events(
    contract_id: str, start_ledger: int | None = None
) -> tuple[list[models.Event], int]:
    """Fetch events from Soroban RPC."""
    # stellar_sdk.soroban_server_async.SorobanServerAsync
    soroban_server = stellar_sdk.SorobanServer()
    if start_ledger is None:
        last_ledger = soroban_server.get_latest_ledger().sequence
        start_ledger = int(last_ledger - (3600 / 6 * 20))  # around 20h back

    res = soroban_server.get_events(
        start_ledger,
        filters=[
            EventFilter(
                event_type=EventFilterType.CONTRACT,
                contract_ids=[contract_id],
                # can filter by projects or event type using topics
                # topics=[["*", "*"], ],
            )
        ],
    )

    latest_ledger = res.latest_ledger
    events_ = []
    for event in res.events:
        topic_ = event.topic
        value = event.value
        events_.append(models.Event(topics=topic_, value=value))

    return events_, latest_ledger


def events_to_db(events: list[models.Event]) -> None:
    """Commit events to DB."""
    with Warehouse().session_factory_sync() as session:
        events_db = []
        for event in events:
            topics_ = {i: topic_ for i, topic_ in event.topics}
            event_ = db_models.Event(topics=topics_, value=event.value)
            events_db.append(event_)
        session.add_all(events_db)
        session.commit()
