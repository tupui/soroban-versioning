from typing import Any

from sqlalchemy import orm

from tansu.events.database.session_factory import SqlAlchemyBase


class Event(SqlAlchemyBase):
    __tablename__ = "event"

    id: orm.Mapped[int] = orm.mapped_column(primary_key=True)
    topics: orm.Mapped[dict[int, Any]]
    value: orm.Mapped[str]
