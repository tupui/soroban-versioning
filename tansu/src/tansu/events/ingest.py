import stellar_sdk
import stellar_sdk.xdr
from stellar_sdk.soroban_rpc import EventFilter, EventFilterType

from tansu.events.database import db_models, SessionFactory


def fetch_events(
    contract_id: str, start_ledger: int | None = None
) -> tuple[list[db_models.Event], int]:
    """Fetch events-events from Soroban RPC."""
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
        ledger = event.ledger
        events_.append(db_models.Event(ledger=ledger, topics=topic_, value=value))

    return events_, latest_ledger


async def events_to_db(events: list[db_models.Event]) -> None:
    """Commit events-events to DB."""
    async with SessionFactory() as session:
        async with session.begin():
            session.add_all(events)
