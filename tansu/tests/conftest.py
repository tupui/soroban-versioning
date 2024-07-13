import pytest
from sqlalchemy import create_engine

from tansu.events.database import db_models
from tansu.events.database.session_factory import (
    conn_str,
    SqlAlchemyBase,
    SessionFactory,
)
from tansu.events.ingest import events_to_db

# ----- DATABASE -----

DEBUG = False
DROP_AFTER_TESTS = False


@pytest.fixture(scope="session")
def engine():
    engine_ = create_engine(conn_str, echo=DEBUG)
    yield engine_
    engine_.dispose()


@pytest.fixture(scope="session", autouse=True)
def tables(engine):
    print("\nCleaning tables")
    SqlAlchemyBase.metadata.drop_all(engine)
    print("\nCreating tables")
    SqlAlchemyBase.metadata.create_all(engine)
    yield
    if DROP_AFTER_TESTS:
        print("\nCleaning tables")
        SqlAlchemyBase.metadata.drop_all(engine)


@pytest.fixture(scope="session", autouse=True)
async def fake_events(tables):
    event_1 = db_models.Event(
        ledger=4,
        topics={
            # transfer
            "topic_1": "AAAADwAAAAh0cmFuc2Zlcg==",
            # GA7YNBW5CBTJZ3ZZOWX3ZNBKD6OE7A7IHUQVWMY62W2ZBG2SGZVOOPVH
            "topic_2": "AAAAEgAAAAAAAAAAP4aG3RBmnO85da+8tCofnE+D6D0hWzMe1bWQm1I2auc=",
        },
        value="AAAABAAAJxA=",
    )
    event_2 = db_models.Event(
        ledger=1,
        topics={
            # transfer
            "topic_1": "AAAADwAAAAh0cmFuc2Zlcg==",
            # GAFYGBHKVFP36EOIRGG74V42F3ORAA2ZWBXNULMNDXAMMXQH5MCIGXXI
            "topic_2": "AAAAEgAAAAAAAAAAC4ME6qlfvxHIiY3+V5ou3RADWbBu2i2NHcDGXgfrBIM=",
        },
        value="AAAABAAAE4g=",
    )

    await events_to_db([event_1, event_2])

    async with SessionFactory() as session:
        async with session.begin():
            session.add(db_models.LatestLedger(ledger=4))
