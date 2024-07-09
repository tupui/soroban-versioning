import pytest
from sqlalchemy import create_engine

from tansu.events.database.session_factory import conn_str, SqlAlchemyBase

# ----- DATABASE -----

DEBUG = False


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
    print("\nCleaning tables")
    SqlAlchemyBase.metadata.drop_all(engine)
