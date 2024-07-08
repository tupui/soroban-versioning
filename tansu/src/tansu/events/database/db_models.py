from tansu.events.database.session_factory import SqlAlchemyBase

from sqlalchemy import orm


class Event(SqlAlchemyBase):
    __tablename__ = "event"

    id: orm.Mapped[int] = orm.mapped_column(primary_key=True)
    topics: orm.Mapped[dict[int, str]]
    value: orm.Mapped[str]
