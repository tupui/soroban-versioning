import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine

from tansu.events.app import create_app
from tansu.events.database import db_models
from tansu.events.database.session_factory import (
    conn_str,
    SqlAlchemyBase,
    SessionFactory,
)
from tansu.events.ingest import events_to_db


TANSU_PROJECT_KEY = "37ae83c06fde1043724743335ac2f3919307892ee6307cce8c0c63eaa549e156"


# ----- API -----


@pytest.fixture(scope="session", autouse=True)
def app():
    app = create_app()
    yield app


@pytest.fixture(scope="session")
async def a_client(app):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


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
        action="commit",
        project_key=TANSU_PROJECT_KEY,
        value="04cea5e23c7c50ae3dc304218314f21e7164c9d2",
    )
    event_2 = db_models.Event(
        ledger=1,
        action="register",
        project_key=TANSU_PROJECT_KEY,
        value="bed45eef20315c731cc5912c7e2aa626b7cf2a45",
    )

    await events_to_db([event_1, event_2])

    async with SessionFactory() as session:
        async with session.begin():
            session.add(db_models.LatestLedger(ledger=4))
