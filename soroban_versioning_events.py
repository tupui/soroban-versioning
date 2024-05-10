import binascii
from collections import namedtuple

import stellar_sdk
import stellar_sdk.xdr
from stellar_sdk.soroban_rpc import EventFilter, EventFilterType

Event = namedtuple("Event", ["topics", "value"])


def parse_xdr(xdr):
    scval = stellar_sdk.xdr.SCVal.from_xdr(xdr)
    type_scval = scval.type.name.split("_")[1].lower()
    parsed_scval = getattr(stellar_sdk.scval, f"from_{type_scval}")(scval)

    if isinstance(parsed_scval, bytes):
        parsed_scval = binascii.b2a_hex(parsed_scval)
    return parsed_scval


def fetch_events(contract_id: str, start_ledger: int | None = None):
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
                # topics=[["*", "*"], ],
            )
        ],
    )

    latest_ledger = res.latest_ledger
    events_ = []
    for event in res.events:
        topics = [parse_xdr(topic) for topic in event.topic]
        value = parse_xdr(event.value)
        events_.append(Event(topics=topics, value=value))

    return events_, latest_ledger


contract_id = "CAHCQFBMZIY6Y6QPHPN2N64QVKIA6CTGTWBS3SNNIRCATRBANAV3NHWK"
start_ledger = None

events = fetch_events(contract_id=contract_id, start_ledger=start_ledger)

print(events)
