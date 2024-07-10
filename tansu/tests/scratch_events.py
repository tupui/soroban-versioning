from typing import Any
from sqlalchemy import orm, JSON


class Base(orm.DeclarativeBase):
    # needed to tell SQLAlchemy to translate a dictionary into a JSON entry
    type_annotation_map = {
        dict[str, Any]: JSON,
    }


class Event(Base):
    __tablename__ = "SorobanEvent"

    id: orm.Mapped[int] = orm.mapped_column(primary_key=True)
    contract_id: orm.Mapped[str]
    ledger: orm.Mapped[int]
    topics: orm.Mapped[dict[str, Any]]
    value: orm.Mapped[str]


from sqlalchemy import create_engine

engine = create_engine("sqlite://", echo=True)

# the following creates the table in the DB
Base.metadata.create_all(engine)

import stellar_sdk
from stellar_sdk.soroban_rpc import EventFilter, EventFilterType

soroban_server = stellar_sdk.SorobanServer()

contract_id = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"

ledger = soroban_server.get_latest_ledger().sequence - int(3600 / 6 * 24)
print(f"Ledger {ledger}")

res = soroban_server.get_events(
    ledger,
    filters=[
        EventFilter(
            event_type=EventFilterType.CONTRACT,
            contract_ids=[contract_id],
            topics=[["AAAADwAAAAh0cmFuc2Zlcg==", "*", "*", "*"]],
        )
    ],
)
events = res.events

import sqlalchemy
from sqlalchemy.orm import sessionmaker

Session = sessionmaker(engine)
with Session.begin() as session:
    events_ = []
    for event in events:
        topic_ = event.topic
        value = event.value
        events_.append(
            Event(
                contract_id=contract_id, ledger=event.ledger, topics=topic_, value=value
            )
        )
    session.add_all(events_)

with orm.Session(engine) as session:
    stmt = (
        sqlalchemy.select(Event.ledger)
        .where(Event.contract_id == contract_id)
        .order_by(Event.ledger.desc())
    )
    ledger = session.scalars(stmt).first()

print(ledger)

with Session.begin() as session:
    event_1 = Event(
        ledger=1,
        contract_id=contract_id,
        topics={
            # transfer
            "topic_1": "AAAADwAAAAh0cmFuc2Zlcg==",
            # GA7YNBW5CBTJZ3ZZOWX3ZNBKD6OE7A7IHUQVWMY62W2ZBG2SGZVOOPVH
            "topic_2": "AAAAEgAAAAAAAAAAP4aG3RBmnO85da+8tCofnE+D6D0hWzMe1bWQm1I2auc=",
        },
        value="AAAABAAAJxA=",
    )
    event_2 = Event(
        ledger=1,
        contract_id=contract_id,
        topics={
            # transfer
            "topic_1": "AAAADwAAAAh0cmFuc2Zlcg==",
            # GAFYGBHKVFP36EOIRGG74V42F3ORAA2ZWBXNULMNDXAMMXQH5MCIGXXI
            "topic_2": "AAAAEgAAAAAAAAAAC4ME6qlfvxHIiY3+V5ou3RADWbBu2i2NHcDGXgfrBIM=",
        },
        value="AAAABAAAE4g=",
    )
    session.add_all([event_1, event_2])

import sqlalchemy

with orm.Session(engine) as session:
    stmt = sqlalchemy.select(Event)
    for event in session.scalars(stmt):
        print(event.topics, event.value)

print("BOOB")

with orm.Session(engine) as session:
    stmt = sqlalchemy.select(Event).where(Event.ledger == 1)
    for event in session.scalars(stmt):
        print(event.topics, event.value)

import stellar_sdk

stellar_sdk.scval.to_symbol("transfer").to_xdr()
# 'AAAADwAAAAh0cmFuc2Zlcg=='
stellar_sdk.scval.to_int32(10_000).to_xdr()
# 'AAAABAAAJxA='
stellar_sdk.scval.to_int32(5_000).to_xdr()
# 'AAAABAAAE4g='
stellar_sdk.scval.to_int32(1_000).to_xdr()
# 'AAAABAAAA+g='
stellar_sdk.scval.to_address(
    "GA7YNBW5CBTJZ3ZZOWX3ZNBKD6OE7A7IHUQVWMY62W2ZBG2SGZVOOPVH"
).to_xdr()
# 'AAAAEgAAAAAAAAAAP4aG3RBmnO85da+8tCofnE+D6D0hWzMe1bWQm1I2auc='
stellar_sdk.scval.to_address(
    "GAFYGBHKVFP36EOIRGG74V42F3ORAA2ZWBXNULMNDXAMMXQH5MCIGXXI"
).to_xdr()


# 'AAAAEgAAAAAAAAAAC4ME6qlfvxHIiY3+V5ou3RADWbBu2i2NHcDGXgfrBIM='


@sqlalchemy.event.listens_for(Event, "after_insert")
def event_handler(mapper, connection, target):
    topics = target.topics
    value = stellar_sdk.scval.to_native(target.value)

    for key, topic in topics.items():
        topics[key] = stellar_sdk.scval.to_native(topic)

    print(f"Event listener: {topics} {value}")


with Session.begin() as session:
    event_3 = Event(
        ledger=2,
        contract_id=contract_id,
        topics={
            # transfer
            "topic_1": "AAAADwAAAAh0cmFuc2Zlcg==",
            # GA7YNBW5CBTJZ3ZZOWX3ZNBKD6OE7A7IHUQVWMY62W2ZBG2SGZVOOPVH
            "topic_2": "AAAAEgAAAAAAAAAAP4aG3RBmnO85da+8tCofnE+D6D0hWzMe1bWQm1I2auc=",
        },
        value="AAAABAAAJxA=",
    )
    session.add(event_3)
