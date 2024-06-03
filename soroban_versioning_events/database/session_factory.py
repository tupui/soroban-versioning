"""Database helpers.

* BackendDB: database configuration
* database_url: URL to use for establishing a connection
* SqlAlchemyBase: base class to create SQLAlchemy db_models
* Warehouse: provides an async context manager to make DB queries
"""

import contextlib
import os
from typing import Any, AsyncIterator, Dict, Optional

from pydantic import BaseModel
import sqlalchemy.orm
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import create_engine, JSON, sessionmaker
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from ..log import logger


class SqlAlchemyBase(DeclarativeBase):
    type_annotation_map = {
        dict[str, Any]: JSON,
    }


class BackendDB(BaseModel):
    host: str = os.getenv("POSTGRES_HOST", "localhost")
    port: int = os.getenv("POSTGRES_PORT", 5432)
    database: str = os.getenv("POSTGRES_DATABASE", "tansu_test")
    username: str = os.getenv("POSTGRES_USER", "tansu_test")
    password: str = os.getenv("POSTGRES_PASSWORD", "tansu_test")


def database_url(
    db_config: Optional[Dict | BackendDB] = None, sync: bool = False
) -> str:
    if db_config is None:
        db_config = BackendDB()

    if not isinstance(db_config, BackendDB):
        db_config = BackendDB(**db_config)

    sync = "psycopg" if sync else "psycopg_async"

    return f"postgresql+{sync}://{db_config.username}:{db_config.password}@{db_config.host}:{db_config.port}/{db_config.database}"


class Warehouse:
    """Interact with the DB.

    Examples
    --------

    >>> from tansu.database import Warehouse
    >>> async with Warehouse().begin() as session:
    ...     await session.get(...)

    """

    engine_sync: sqlalchemy.Engine | None = None
    session_factory_sync: sqlalchemy.orm.sessionmaker | None = None
    engine: sqlalchemy.Engine | None = None
    session_factory: sqlalchemy.orm.sessionmaker | None = None

    @classmethod
    def sync_session(
        cls,
        db_config: Optional[BackendDB] = None,
        debug: bool = False,
    ):
        Warehouse.global_init(db_config=db_config, debug=debug)

    @staticmethod
    def global_init(db_config: Optional[BackendDB] = None, debug: bool = False) -> None:
        if Warehouse.session_factory:
            return

        conn_str = database_url(db_config=db_config)
        logger.info(f"Connecting to DB at: {conn_str}...")

        try:
            conn_str_sync = database_url(db_config=db_config, sync=True)
            engine_sync = create_engine(conn_str_sync)
            with engine_sync.connect():
                logger.info("Successfully connected ✨")
        except OperationalError as exc:
            raise ConnectionError("Check parameters and if DB is alive") from exc

        Warehouse.engine_sync = engine_sync
        Warehouse.session_factory_sync = sessionmaker(
            bind=engine_sync, expire_on_commit=False
        )

        engine = create_async_engine(conn_str, echo=debug, pool_recycle=3600)
        Warehouse.engine = engine
        Warehouse.session_factory = async_sessionmaker(
            bind=engine, expire_on_commit=False
        )

    def __init__(
        self,
        db_config: Optional[BackendDB] = None,
        debug: bool = False,
    ):
        Warehouse.global_init(db_config=db_config, debug=debug)

    @contextlib.asynccontextmanager
    async def begin(self) -> AsyncIterator[AsyncSession]:
        async with self.session_factory() as session:
            async with session.begin():
                yield session
