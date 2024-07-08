from typing import Any

from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import JSON
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from tansu.events.settings import BACKEND_CONFIG


class SqlAlchemyBase(DeclarativeBase):
    type_annotation_map = {
        dict[int, Any]: JSON,
    }


conn_str = f"postgresql+psycopg://{BACKEND_CONFIG.username}:{BACKEND_CONFIG.password}@{BACKEND_CONFIG.host}:{BACKEND_CONFIG.port}/{BACKEND_CONFIG.database}"
engine = create_async_engine(conn_str, pool_recycle=2000)
SessionFactory = async_sessionmaker(bind=engine, expire_on_commit=False)
