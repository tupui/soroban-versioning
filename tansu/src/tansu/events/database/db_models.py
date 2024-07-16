from sqlalchemy import orm

from tansu.events.database.session_factory import SqlAlchemyBase


class Event(SqlAlchemyBase):
    __tablename__ = "event"

    id: orm.Mapped[int] = orm.mapped_column(primary_key=True)
    ledger: orm.Mapped[int]
    action: orm.Mapped[str] = orm.mapped_column(index=True)
    project_key: orm.Mapped[str] = orm.mapped_column(index=True)
    value: orm.Mapped[str]


class LatestLedger(SqlAlchemyBase):
    __tablename__ = "latest_ledger"

    ledger: orm.Mapped[int] = orm.mapped_column(primary_key=True)
